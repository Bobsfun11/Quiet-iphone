"""Package source, native project, documentation and the labelled web preview."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import zipfile

project = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Package Quiet source and its labelled browser preview.')
parser.add_argument('--output', type=Path, default=Path('/workspace/shared/downloads') if Path('/workspace/shared/downloads').exists() else project.parent / 'Quiet-Delivery')
delivery = parser.parse_args().output
delivery.mkdir(parents=True, exist_ok=True)
excluded = {'node_modules', '.expo', '.git', 'dist', 'dist-web', 'build', 'test-results', 'playwright-report', '__pycache__'}

with zipfile.ZipFile(delivery / 'Quiet-iPhone-Project.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(project.rglob('*')):
        relative = path.relative_to(project)
        if any(part in excluded for part in relative.parts) or not path.is_file():
            continue
        if path.name.startswith('.env') or path.suffix in {'.p12', '.mobileprovision', '.ipa', '.log'}:
            continue
        if path.name in {'credentials.json', '.xcode.env.local'}:
            continue
        archive.write(path, Path('Quiet-iPhone') / relative)

# This smaller archive is ready for a GitHub browser upload: package.json and
# .github/workflows sit at the root once the wrapper folder is opened.
with zipfile.ZipFile(delivery / 'Quiet-GitHub-Upload.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(project.rglob('*')):
        relative = path.relative_to(project)
        if any(part in excluded | {'ios', 'android'} for part in relative.parts) or not path.is_file():
            continue
        if path.name.startswith('.env') or path.suffix in {'.p12', '.mobileprovision', '.ipa', '.log'} or path.name == 'credentials.json':
            continue
        archive.write(path, Path('Quiet-GitHub-Upload') / relative)

with zipfile.ZipFile(delivery / 'Quiet-Sample-Preview.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted((project / 'dist-web').rglob('*')):
        if path.is_file(): archive.write(path, Path('Quiet-Sample-Preview') / path.relative_to(project / 'dist-web'))
    archive.writestr('Quiet-Sample-Preview/READ-ME.txt',
        'Sample content only. This preview cannot access real social accounts or filter other apps.\n'
        'Serve this folder with: python3 -m http.server 4173\n'
        'Then open http://localhost:4173 in your browser.\n'
        'Use the iPhone project and Apple signing instructions for the real app.\n')

shutil.copy2(project / 'README.md', delivery / 'Quiet-Installation.md')
shutil.copy2(project / 'docs/VERIFICATION.md', delivery / 'Quiet-Verification.md')
shutil.copy2(project / 'docs/WINDOWS-INSTALL.md', delivery / 'Quiet-Windows-Setup.md')
shutil.copy2(project / 'docs/AUTO-OPEN.md', delivery / 'Quiet-Auto-Open.md')
shutil.copy2(project / 'docs/RESUME-WINDOWS.md', delivery / 'Quiet-Next-Steps.md')
if (project / 'test-results/quiet-home.png').exists():
    shutil.copy2(project / 'test-results/quiet-home.png', delivery / 'Quiet-Preview.png')
for screen in ['welcome', 'settings']:
    screenshot = project / f'test-results/quiet-{screen}.png'
    if screenshot.exists(): shutil.copy2(screenshot, delivery / f'Quiet-{screen.title()}.png')

checksums = {}
for name in ['Quiet-iPhone-Project.zip', 'Quiet-GitHub-Upload.zip', 'Quiet-Sample-Preview.zip']:
    path = delivery / name
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None, f'Corrupt ZIP: {name}'
    checksums[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    print(f'{name}: {path.stat().st_size:,} bytes')
(delivery / 'Quiet-Checksums.json').write_text(json.dumps(checksums, indent=2) + '\n')
print('ZIP integrity verified.')
