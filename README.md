# Quiet for iPhone

Quiet is an iPhone app for using social messages without a short-video feed. The native inbox uses system light or dark appearance, iOS keyboard behavior, and supports Reduce Motion.

## Current build

- **Instagram** connects through Beeper Cloud. Quiet can open existing conversations and read or send text once the device is verified. This integration still needs a signed-in iPhone test. Media, calls, message requests and push notifications are outside this build's scope.
- **TikTok** still appears in Quiet. Its native inbox is unavailable while a personal messaging connection is being researched.
- Instagram and TikTok have no embedded browser or feed in Quiet. Snapchat and YouTube have been removed.

Quiet runs independently once installed. With free Apple signing, AltServer is used for signing and periodic refresh. iOS restricts Quiet from editing the interfaces of the official Instagram and TikTok apps. Optional [Shortcuts automations](docs/AUTO-OPEN.md) can redirect an app launch to the corresponding Quiet screen.

## Install

Download the IPA from a successful [GitHub Actions build](https://github.com/Bobsfun11/Quiet-iphone/actions/workflows/build-unsigned-ios.yml) of the version you want. On Windows, sign it with AltStore Classic and your own Apple account. [Windows installation](docs/WINDOWS-INSTALL.md)

On a Mac, install Node 24 LTS, Xcode 26.4 or newer, and CocoaPods. Run `bash Install-on-iPhone.command` to open the generated workspace. In Xcode select your development team and iPhone, set the scheme to Release, and press Run. The app supports iOS 16.4 or newer.

## Connect Instagram

1. In Beeper, go to **Settings → Accounts → Add an Account → Instagram** and choose **Beeper Cloud**. Use an authenticator app for Instagram two-factor authentication. [Beeper's Instagram instructions](https://help.beeper.com/instagram)
2. Create a Matrix password for your Beeper account. [Beeper's password instructions](https://help.beeper.com/quick-references/how-can-i-reset-or-set-a-password)
3. In Quiet, tap **Instagram → Connect Instagram** and enter your Beeper username and Matrix password. If prompted, use your Beeper recovery code. It is available from the profile menu in Beeper. [Beeper's iPhone setup instructions](https://help.beeper.com/en_US/ios/beeper-mobile-getting-started-guide)

Beeper Cloud routes Instagram messages through its servers. Quiet sends Beeper credentials directly to Beeper, stores its session in the iPhone Keychain, and uses an encrypted local Matrix store. Disconnecting in Quiet clears its local store and session. Manage the Instagram connection itself in Beeper. [Beeper's connection types](https://help.beeper.com/en_US/troubleshooting/beeper-on-device-vs-beeper-cloud-what-goes-to-beeper-servers)

## Develop and verify

```sh
npm ci
npm run typecheck
npm test
npm run export:web
npx playwright install webkit
npm run test:browser
```

Set `CHROMIUM_PATH` if Chromium is installed away from the location in the Playwright config. The web preview exercises the interface without account access. [Build verification](docs/VERIFICATION.md) · [iPhone acceptance checks](docs/DEVICE-CHECKLIST.md)

- `App.tsx` handles app navigation, preferences, and links from Shortcuts.
- `src/screens/` contains the inbox, conversations, account setup, and the app's main screens.
- `modules/quiet-matrix/` connects the iOS app to Beeper using a pinned version of the Matrix Rust SDK.
- `src/tiktok/` contains experimental pieces of the TikTok connection. The app never uses them to sign in or fetch messages.

Quiet is MIT-licensed. Dependencies retain their own licenses. [Third-party notices](THIRD-PARTY-NOTICES.md)
