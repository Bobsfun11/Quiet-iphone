"""Validate device bundles and package a conventional IPA without signing it."""
from __future__ import annotations

import hashlib
import os
from pathlib import Path, PurePosixPath
import plistlib
import stat
import struct
import zipfile

ARM64 = 0x0100000C
LC_BUILD_VERSION = 0x32
PLATFORM_IOS = 2


def validate_device_executable(data: bytes) -> None:
    # Current Xcode Release builds for a generic iPhone produce thin arm64.
    # Reject simulator and universal/other-platform executables rather than
    # handing a misleading or incompatible archive to the installation guide.
    if len(data) < 32 or data[:4] != b'\xcf\xfa\xed\xfe':
        raise ValueError('Expected a thin, little-endian 64-bit Mach-O device executable.')
    _, cpu, _, filetype, ncmds, sizeofcmds, _, _ = struct.unpack_from('<8I', data)
    if cpu != ARM64 or filetype != 2:
        raise ValueError('The main executable must be an arm64 Mach-O application.')
    if ncmds > 10000 or sizeofcmds > len(data) - 32:
        raise ValueError('Invalid Mach-O load-command table.')
    offset, end, platform = 32, 32 + sizeofcmds, None
    for _ in range(ncmds):
        if offset + 8 > end:
            raise ValueError('Truncated Mach-O load command.')
        cmd, size = struct.unpack_from('<2I', data, offset)
        if size < 8 or offset + size > end:
            raise ValueError('Invalid Mach-O load-command size.')
        if cmd == LC_BUILD_VERSION:
            if size < 24:
                raise ValueError('Truncated Mach-O build-version command.')
            platform = struct.unpack_from('<I', data, offset + 8)[0]
        offset += size
    if platform != PLATFORM_IOS:
        raise ValueError('Expected an iOS device binary, not an iOS Simulator or macOS binary.')


def validate_metadata(info: dict) -> str:
    if info.get('CFBundleSupportedPlatforms') != ['iPhoneOS']:
        raise ValueError('The app must target iPhoneOS, not iPhoneSimulator.')
    executable = info.get('CFBundleExecutable')
    if not isinstance(executable, str) or not executable or executable in {'.', '..'} or '/' in executable or '\\' in executable:
        raise ValueError('Invalid app executable name.')
    if not info.get('CFBundleIdentifier'):
        raise ValueError('Missing app bundle identifier.')
    return executable


def validate_app(app: Path) -> None:
    if not app.is_dir() or app.suffix != '.app':
        raise ValueError('Provide a compiled .app directory from Release-iphoneos.')
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    executable = validate_metadata(info)
    binary = app / executable
    validate_device_executable(binary.read_bytes())
    if not binary.stat().st_mode & stat.S_IXUSR:
        raise ValueError('The main binary must retain its executable permission.')
    if not (app / 'main.jsbundle').is_file() or (app / 'main.jsbundle').stat().st_size == 0:
        raise ValueError('Missing embedded main.jsbundle; a standalone Release build is required.')
    if (app / 'embedded.mobileprovision').exists():
        raise ValueError('This personal-signing delivery must not contain a provisioning profile.')
    if any(app.rglob('*.appex')):
        raise ValueError('This delivery is designed without extensions for free personal signing.')
    for path in app.rglob('*'):
        if path.is_symlink():
            if os.path.isabs(os.readlink(path)) or not path.resolve().is_relative_to(app.resolve()):
                raise ValueError(f'Bundle symlink escapes its app directory: {path.name}')


def verify_ipa(ipa: Path) -> dict:
    with zipfile.ZipFile(ipa) as archive:
        if archive.testzip() is not None:
            raise ValueError('Corrupt ZIP entry in IPA.')
        infos = archive.infolist()
        names = [info.filename for info in infos]
        if len(set(names)) != len(names):
            raise ValueError('Duplicate ZIP entries in IPA.')
        for name in names:
            path = PurePosixPath(name)
            if path.is_absolute() or '..' in path.parts or '\\' in name or not name.startswith('Payload/'):
                raise ValueError('IPA contains an unsafe or unexpected archive path.')
        roots = {name.split('/')[1] for name in names if len(name.split('/')) >= 3}
        if len(roots) != 1 or not next(iter(roots)).endswith('.app'):
            raise ValueError('IPA must contain exactly one app in Payload/.')
        root = f'Payload/{next(iter(roots))}/'
        info = plistlib.loads(archive.read(root + 'Info.plist'))
        executable = validate_metadata(info)
        entry = archive.getinfo(root + executable)
        if not (entry.external_attr >> 16) & stat.S_IXUSR:
            raise ValueError('Archive lost the executable permission on the main binary.')
        validate_device_executable(archive.read(entry))
        if not archive.read(root + 'main.jsbundle'):
            raise ValueError('Missing embedded JavaScript bundle.')
        if root + 'embedded.mobileprovision' in names or any('.appex/' in name for name in names):
            raise ValueError('Unexpected signing profile or app extension in personal-signing IPA.')
        return {
            'bundleIdentifier': info['CFBundleIdentifier'],
            'version': info.get('CFBundleShortVersionString', ''),
            'platform': 'iPhoneOS', 'architecture': 'arm64',
            'sha256': hashlib.sha256(ipa.read_bytes()).hexdigest(),
        }


def package_ipa(app: Path, destination: Path) -> dict:
    validate_app(app)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix('.ipa.partial')
    root = PurePosixPath('Payload') / app.name
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(app.rglob('*')):
                name = str(root / path.relative_to(app))
                if path.is_symlink():
                    info = zipfile.ZipInfo(name)
                    info.create_system = 3
                    info.external_attr = (stat.S_IFLNK | 0o777) << 16
                    archive.writestr(info, os.readlink(path).encode('utf-8'))
                elif path.is_file():
                    archive.write(path, name)
        result = verify_ipa(temporary)
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)
    destination.with_suffix('.ipa.sha256').write_text(f"{result['sha256']}  {destination.name}\n")
    return result
