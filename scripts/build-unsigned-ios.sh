#!/bin/bash
# Compile on a hosted Mac; sign later on Windows with the user's free account.
# No Apple account, certificate, provisioning profile or Expo account is used.
set -euo pipefail

QUIET_PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$QUIET_PROJECT_DIR"
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This compilation step needs macOS. On Windows, run the included GitHub Actions workflow instead." >&2
  exit 1
fi
for tool in node npm xcodebuild xcrun pod python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing build tool: $tool" >&2
    exit 1
  fi
done

export EXPO_NO_TELEMETRY=1
export COCOAPODS_DISABLE_STATS=true
export CI=1
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
# Release builds must embed their JavaScript rather than expecting Metro.
unset SKIP_BUNDLING
unset FORCE_BUNDLING

xcodebuild -version
python3 - <<'PY'
import re, subprocess, sys
text = subprocess.check_output(['xcodebuild', '-version'], text=True)
match = re.search(r'Xcode (\d+)\.(\d+)', text)
if not match or tuple(map(int, match.groups())) < (26, 4):
    sys.exit('Quiet requires Xcode 26.4 or newer.')
PY

npx --no-install expo prebuild --platform ios --no-install
pod install --project-directory=ios
mkdir -p build/iphone

xcodebuild \
  -workspace ios/Quiet.xcworkspace \
  -scheme Quiet \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build/iphone/DerivedData \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY= \
  DEVELOPMENT_TEAM= \
  build 2>&1 | tee build/iphone/xcodebuild.log

QUIET_DEVICE_APP="build/iphone/DerivedData/Build/Products/Release-iphoneos/Quiet.app"
python3 scripts/package-unsigned-ipa.py "$QUIET_DEVICE_APP" build/iphone/Quiet-unsigned.ipa
python3 scripts/verify-ipa.py build/iphone/Quiet-unsigned.ipa
{
  echo 'Quiet 1.0.0 — unsigned iPhone device build'
  echo 'Sign on Windows using AltStore Classic and your own free Apple account.'
  echo 'This file cannot be installed directly before personal signing.'
  echo "Source commit: $(git rev-parse HEAD 2>/dev/null || echo 'local build')"
  xcodebuild -version
} > build/iphone/BUILD-INFO.txt
echo 'Device IPA ready: build/iphone/Quiet-unsigned.ipa'
