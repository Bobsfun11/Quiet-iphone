# Resume the free iPhone build from Windows

The app source and build workflow are ready locally. The current blocker is **the connected GitHub integration's write permission**, before Apple signing. No device IPA has been compiled, no hosted run has started, and no payment has been made.

Your public repository is [Bobsfun11/Quite-iphone](https://github.com/Bobsfun11/Quite-iphone) — note **Quite**, exactly as you named it. The final check found only its initial `README.md` (commit `2f92042b97045e3b61910d0fd0c74f003f3e550c`), with no app files or workflows. Git push, the connected GitHub Contents API and a final Git blob write all returned HTTP 403. Repository metadata reports your own account has admin/write rights; those rights have not made file writes available to this integration.

## Fastest path without changing the integration

You can perform the upload in your own Windows browser:

1. Download **Quiet-GitHub-Upload.zip** from the chat and extract it. This package contains only source and documentation intended for GitHub, including `.github/workflows/`. It has no signing credentials or website sessions.
2. Open the extracted **Quiet-GitHub-Upload** folder. You should see `App.tsx`, `package.json`, `src`, `.github` and other project files directly inside it.
3. Open [the repository's upload page](https://github.com/Bobsfun11/Quite-iphone/upload/main), signed in to GitHub as its owner. Drag the **contents** of the extracted folder onto the upload area, including `.github`. Do not upload the outer ZIP or add a wrapper folder above `package.json`. Commit the upload to `main`.
4. Open **Actions → Build iPhone IPA for Windows signing → Run workflow** and select `main`. This workflow uses the standard `macos-26` hosted runner in your public repository. It does not request an Apple/Expo account, signing key or paid runner.
5. Wait for a successful run. Under **Artifacts**, download **Quiet-unsigned-iPhone**, extract it and save `Quiet-unsigned.ipa`. Artifacts last three days, so keep your own copy. If the run fails, the `Quiet-native-build-log` artifact records the compilation output; the first native build has not yet been verified.
6. Follow [WINDOWS-INSTALL.md](WINDOWS-INSTALL.md) to sign/install that IPA with AltStore Classic on your Windows PC and your regular free Apple account. The original apps remain unchanged; the app requires its own website sign-ins. Free personal signatures require refreshing every seven days.

This uses GitHub's standard free public-repository compute path and personal Apple signing. Do not select a paid/larger runner, buy an Apple membership, enter Apple credentials into GitHub, or add signing secrets to this source.

## Alternative: allow the assistant to upload and build

In the ChatGPT/Codex GitHub connection settings, configure access to `Bobsfun11/Quite-iphone` and allow repository **Contents** and **Workflows** writes if your integration offers them. Then ask to continue. If the connection is limited to read-only permissions, use the browser upload above instead. No password or token needs to be pasted into chat.

After an upload, the assistant can inspect the remote commit and any available build logs/artifacts, repair compilation issues where writes are permitted, and deliver the IPA. It still cannot enter your Apple credentials or physically enable iPhone Developer Mode.

## What was completed

- Four platform web views with short-feed DOM filtering and native route guards.
- Persistent website sessions, browser navigation and error/recovery handling.
- Free Shortcuts launch links, plus instructions and in-app setup help.
- A refined cream/forest design, grouped rows, iPhone SF Symbols and original sprig artwork.
- Reanimated entrances, light press/arrow feedback, selective iPhone haptics and Reduce Motion handling.
- Logic, filtering, browser UI and IPA validation tests; generated iOS project and production JS/Hermes export.
- The manual hosted-Mac device workflow and unsigned IPA checks.

The browser preview uses invented sample content and is labelled. Native compilation, real iPhone execution, Shortcuts execution and signed-in platform features still need verification. TikTok and Snapchat may restrict their web features on iPhone.
