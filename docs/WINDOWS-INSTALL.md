# Install Quiet with Windows and a free Apple account

You do **not** need a paid Apple Developer membership, Expo membership or your own Mac for this route. A hosted Mac first compiles an **unsigned iPhone device IPA**. AltStore Classic and AltServer on Windows then sign it for your own iPhone using your regular Apple account.

Use an IPA from a successful run of the version you want to install. [Device build workflow](https://github.com/Bobsfun11/Quiet-iphone/actions/workflows/build-unsigned-ios.yml)

## 1. Produce the device IPA

The project includes `.github/workflows/build-unsigned-ios.yml` and `scripts/build-unsigned-ios.sh`. They run only when manually started. They do not use Apple or Expo credentials.

The workflow installs locked dependencies, generates the iOS project, builds `Release-iphoneos` on a standard `macos-26` runner with code signing disabled, and embeds the JavaScript bundle. It then validates that the main executable is arm64 for **iPhoneOS**, not an iOS Simulator, and packages `Payload/Quiet.app` as `Quiet-unsigned.ipa`, preserving executable permissions.

The standard GitHub-hosted runner is free for this public repository. Keep Apple credentials and signing files out of the source. [Bobsfun11/Quiet-iphone](https://github.com/Bobsfun11/Quiet-iphone)

1. Open **Actions → Build iPhone IPA for Windows signing → Run workflow**.
2. Wait for the run to finish. If it fails, check the run log or its `Quiet-native-build-log` artifact.
3. While signed in to GitHub, download `Quiet-unsigned-iPhone` from **Artifacts** on the successful run. GitHub retains it for three days. Save a local copy.
4. Extract the artifact ZIP. Keep **`Quiet-unsigned.ipa`** and its `.sha256` checksum file together.

You do not need to run a developer server, compile code on Windows or rebuild weekly. The same IPA can be re-signed. Compile again only when the source changes.

## 2. Set up AltStore Classic on Windows

Use the official [AltStore Classic Windows instructions](https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows). This is **AltStore Classic with AltServer**, not the EU-only AltStore PAL marketplace.

1. Install the Apple iTunes/iCloud components required by that guide. Follow its current direct-from-Apple download guidance rather than third-party download sites. If you already use Microsoft Store versions, follow AltStore's own troubleshooting guidance before changing anything.
2. Download and install **AltServer for Windows** through the official [AltStore website](https://altstore.io/).
3. Connect your iPhone to the PC with a USB cable, unlock it, and accept **Trust This Computer**.
4. Start AltServer. In the Windows notification area, click its diamond icon → **Install AltStore** → select your iPhone. Use your own free Apple account in AltServer's local sign-in dialog. Do not enter it in chat, GitHub, a source file or a build secret.
5. Complete the trust/Developer Mode steps in the official guide. On current iOS, this normally includes **Settings → General → VPN & Device Management** and **Settings → Privacy & Security → Developer Mode**, with a restart if requested.
6. Keep AltServer running. For wireless refresh, enable the device's Wi-Fi sync and keep the PC/iPhone on the same network, following the guide.

## 3. Sign and install Quiet

1. Copy **`Quiet-unsigned.ipa`** to the iPhone's Files app, for example through iCloud Drive. Use the IPA inside the downloaded artifact, not its outer ZIP and not `Quiet-iPhone-Project.zip`.
2. Keep AltServer running on the Windows PC with the iPhone connected by USB or reachable over configured Wi-Fi sync.
3. Open **AltStore Classic → My Apps → +**, select `Quiet-unsigned.ipa`, and let AltStore sign and install it. Complete any account/2FA prompt directly in AltStore or AltServer.
4. Open Quiet from the iPhone Home Screen. A Release build starts without a Metro server. Open Instagram in Quiet and follow the Beeper setup instructions.
5. Check appearance, keyboard and scrolling on the iPhone, then verify that an Instagram text arrives in both directions. [Real-device checklist](DEVICE-CHECKLIST.md)

An optional Shortcuts automation can switch to Quiet after the official Instagram app opens. Turn off old Quiet automations for Snapchat or YouTube. [Shortcuts setup](AUTO-OPEN.md)

## 4. Keep it working without a paid membership

Free-account installations expire after **seven days**. Open **AltStore → My Apps → Refresh All** while AltServer is available before they expire. Background refreshing may help but does not remove the seven-day rule. The PC must be available for refresh; the app cannot renew its own Apple signature.

Apple also limits active sideloaded apps and App IDs with free accounts. AltStore itself occupies an app slot; Quiet has no app extensions. No JIT setup is needed for this app: Hermes executes its embedded bytecode normally. There is no jailbreak step.

If Quiet expires, re-sign/reinstall the same IPA using the same account and identifier. Avoid deleting the app if you want to preserve its local Beeper session. AltStore describes refreshing and recovery in its official documentation.

## References

- [Official Windows setup](https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows)
- [AltStore refresh and free-account limits](https://faq.altstore.io/altstore-classic/your-altstore)
- [AltStore troubleshooting](https://faq.altstore.io/altstore-classic/troubleshooting-guide)
- [GitHub standard runner availability and billing](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job)
