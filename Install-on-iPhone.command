#!/bin/bash
set -euo pipefail
QUIET_PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$QUIET_PROJECT_DIR"

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Install Xcode from the Mac App Store, open it once, and try again."
  read -r -p "Press Return to close. "
  exit 1
fi
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Install Node.js 24 LTS from https://nodejs.org/ and try again."
  read -r -p "Press Return to close. "
  exit 1
fi

echo "Preparing Quiet. This downloads the project's locked dependencies."
npm ci
npx expo prebuild --platform ios --no-install
npx pod-install ios
open ios/Quiet.xcworkspace
echo
echo "Xcode is opening. Connect your iPhone and select it as the run destination."
echo "In Quiet > Signing & Capabilities, select your own development team."
echo "Choose a unique Bundle Identifier if Xcode requests one."
echo "For an app that runs without this Mac, edit the Run scheme to use Release."
echo "Then press Run in Xcode. See README.md for setup details."
read -r -p "Press Return to close this window. "
