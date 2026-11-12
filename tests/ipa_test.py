from pathlib import Path
import plistlib
import stat
import struct
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from ipa_support import package_ipa, validate_device_executable, verify_ipa


def device_header(platform=2, cpu=0x0100000C):
    # Synthetic Mach-O header for parser tests. Never included in a delivery.
    return struct.pack('<8I', 0xFEEDFACF, cpu, 0, 2, 1, 24, 0, 0) + struct.pack('<6I', 0x32, 24, platform, 0x100400, 0x1A0400, 0)


class IpaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.app = self.root / 'Quiet.app'
        self.app.mkdir()
        (self.app / 'Info.plist').write_bytes(plistlib.dumps({
            'CFBundleSupportedPlatforms': ['iPhoneOS'], 'CFBundleExecutable': 'Quiet',
            'CFBundleIdentifier': 'com.quietsocial.personal', 'CFBundleShortVersionString': '1.0.0',
        }))
        (self.app / 'Quiet').write_bytes(device_header())
        (self.app / 'Quiet').chmod(0o755)
        (self.app / 'main.jsbundle').write_bytes(b'not-a-real-app-only-a-test-fixture')
        self.ipa = self.root / 'output' / 'Quiet-unsigned.ipa'

    def tearDown(self):
        self.temp.cleanup()

    def test_packaging_preserves_binary_permissions_and_verifies_hash(self):
        result = package_ipa(self.app, self.ipa)
        self.assertEqual(result['architecture'], 'arm64')
        self.assertEqual(result['platform'], 'iPhoneOS')
        with zipfile.ZipFile(self.ipa) as archive:
            self.assertTrue((archive.getinfo('Payload/Quiet.app/Quiet').external_attr >> 16) & stat.S_IXUSR)
        self.assertIn(result['sha256'], self.ipa.with_suffix('.ipa.sha256').read_text())
        self.assertEqual(result, verify_ipa(self.ipa))

    def test_simulator_binary_is_rejected_even_with_device_plist(self):
        (self.app / 'Quiet').write_bytes(device_header(platform=7))
        with self.assertRaisesRegex(ValueError, 'Simulator'):
            package_ipa(self.app, self.ipa)
        self.assertFalse(self.ipa.exists())

    def test_missing_embedded_javascript_is_rejected(self):
        (self.app / 'main.jsbundle').unlink()
        with self.assertRaisesRegex(ValueError, 'main.jsbundle'):
            package_ipa(self.app, self.ipa)

    def test_windows_zip_that_loses_executable_permission_is_rejected(self):
        (self.app / 'Quiet').chmod(0o644)
        with self.assertRaisesRegex(ValueError, 'executable permission'):
            package_ipa(self.app, self.ipa)

    def test_signing_profiles_and_extensions_are_rejected(self):
        profile = self.app / 'embedded.mobileprovision'
        profile.write_bytes(b'test')
        with self.assertRaisesRegex(ValueError, 'provisioning'):
            package_ipa(self.app, self.ipa)
        profile.unlink()
        (self.app / 'Plugins' / 'Extra.appex').mkdir(parents=True)
        with self.assertRaisesRegex(ValueError, 'extensions'):
            package_ipa(self.app, self.ipa)

    def test_escaping_symlinks_are_rejected(self):
        (self.app / 'escape').symlink_to('../outside')
        with self.assertRaisesRegex(ValueError, 'symlink'):
            package_ipa(self.app, self.ipa)

    def test_path_traversal_in_archive_is_rejected(self):
        package_ipa(self.app, self.ipa)
        with zipfile.ZipFile(self.ipa, 'a') as archive:
            archive.writestr('Payload/../bad', 'test')
        with self.assertRaisesRegex(ValueError, 'unsafe'):
            verify_ipa(self.ipa)

    def test_non_device_and_truncated_macho_commands_are_rejected(self):
        for data in [b'not-macho', device_header(cpu=0x01000007), device_header(platform=1), device_header()[:48]]:
            with self.subTest(data=data):
                with self.assertRaises(ValueError):
                    validate_device_executable(data)


if __name__ == '__main__':
    unittest.main()
