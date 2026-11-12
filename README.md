# Quiet for iPhone

A standalone iPhone app that filters Shorts from the YouTube website. Quiet uses React Native, Expo SDK 58 and WKWebView on iOS. It has no backend, ads, subscription, Quiet account, analytics or remote filter service.

The public repository is [Bobsfun11/Quiet-iphone](https://github.com/Bobsfun11/Quiet-iphone). The previous 1.0.0 source compiled in a [hosted macOS run](https://github.com/Bobsfun11/Quiet-iphone/actions/runs/43264445242). Use the artifact from a successful run that matches the source revision you want to install. [Windows build handoff](docs/RESUME-WINDOWS.md)

## What Quiet does

- Hides YouTube Shorts navigation, shelves and tiles and blocks direct Shorts URLs. Search, subscriptions and long videos remain available.
- Filters at document start and handles dynamic page updates, with a separate native policy for top-level navigation.
- Keeps YouTube website sessions on the device and offers a subscriptions start page, desktop website mode and browser controls. It asks before opening external HTTPS links outside Quiet.
- Follows the iPhone’s light or dark appearance for Quiet’s interface. YouTube renders its own website. Quiet supports Reduce Motion and uses SF Symbols and selective haptics on iOS. [Design notes](docs/DESIGN-NOTES.md)
- Accepts a YouTube launch link from an optional iPhone Shortcuts automation. [Automatic-opening setup](docs/AUTO-OPEN.md)

The embedded Instagram, TikTok and Snapchat integrations were removed. If you set up a Shortcuts automation for one of them, turn it off in Shortcuts on your iPhone.

## Install on your iPhone

The manual GitHub workflow builds an unsigned device IPA on a standard hosted Mac in the public repository. AltStore Classic on Windows signs it with your regular Apple account. Free signatures need refreshing every seven days. [Windows personal-signing instructions](docs/WINDOWS-INSTALL.md)

Download the IPA from the GitHub workflow artifact and sign it before installation. Enter your Apple password directly in the local signing tool.

### Option A — Mac and Xcode (personal development install)

The included `Install-on-iPhone.command` prepares dependencies and opens Xcode for you. Run it from Terminal with `bash Install-on-iPhone.command`, then complete the signing and device steps below. It does not install Xcode or handle your Apple credentials.

1. Install Node.js 24 LTS, Xcode **26.4 or newer**, and the current CocoaPods release. Open Xcode once and install its iOS components. The app requires iOS **16.4 or newer**.
2. Unzip this project, open Terminal in its folder, and run:

   ```sh
   npm ci
   npx expo prebuild --platform ios
   npx pod-install ios
   open ios/Quiet.xcworkspace
   ```

3. Connect your iPhone, trust the Mac, and enable Developer Mode in iPhone Settings → Privacy & Security if prompted.
4. In Xcode, select the **Quiet** target → Signing & Capabilities. Select your personal Apple development team, enable automatic signing and change `com.quietsocial.personal` to your own unique identifier if necessary.
5. Select your iPhone as the run destination. Choose **Product → Scheme → Edit Scheme → Run → Build Configuration → Release**, then press Run. Release embeds the JavaScript bundle, so the installed app does not need a development server.
6. Trust the developer in iPhone Settings → General → VPN & Device Management if prompted. Open Quiet and sign in directly on the YouTube website if it allows your account to sign in.

A free personal Apple team can usually install a development build, subject to Apple's current device/capability limits. Such installs expire and typically need rebuilding after seven days. A paid developer membership supports longer distribution options.

For debug development instead, use `npm run ios -- --device` and keep Metro running. Debug builds intentionally connect to Metro; a Release build does not.

### Option B — No Mac: Expo cloud build and Apple signing

A Windows/Linux computer or cloud development terminal can run these commands. An Expo account and an Apple Developer Program membership are required for device distribution through this route. Cloud build quotas or charges depend on your Expo plan.

```sh
npm ci
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Complete authentication in your own terminal/browser, register your iPhone using the device-registration page, and approve signing for your own team. `eas init` writes your own project ID to app config. Install using the signed build's installation link on the registered iPhone. You may need Developer Mode for an internal development build.

For TestFlight:

```sh
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
```

Create your own App Store Connect app record, select it during submission, wait for Apple processing and invite your Apple account as a tester. External testers can require beta review. App Store approval is not guaranteed. Build/submission commands do not bypass Apple's account, signing, processing or review requirements.

**Only an iPhone available?** Source files cannot install themselves as an iPhone app. Use a Mac, the Windows personal-signing route above, or a cloud build terminal with your own distribution signing account. No Apple credentials are configured in this project. Expo Go compatibility and authentication requirements vary by SDK; this project's supported installation paths produce standalone signed builds, not an assumed one-tap Expo Go install.

## Local preview and checks

```sh
npm ci
npm run typecheck
npm test
npm run export:ios
npm run export:web
npx playwright install webkit
npm run test:browser
```

The Playwright config uses `/usr/bin/chromium` by default on Linux; set `CHROMIUM_PATH` to a different installed Chromium/Chrome binary if needed. For WebKit's Linux system libraries, follow Playwright's install-dependencies instructions. `npm run preview` runs the **sample-content browser preview**, not live social websites. Do not use that preview for social sign-in.

Browser tests run the exact injected filter source against local fixtures in Chromium and WebKit. They exercise YouTube Shorts filtering, regular content, dynamic updates, navigation and the browser preview. Signed-in YouTube, WKWebView navigation and the iPhone’s appearance and motion need separate [device checks](docs/DEVICE-CHECKLIST.md).

## Privacy

Quiet's injected code never reads login fields, messages or cookies. Website sessions are maintained by the default WKWebView data store, separate from Safari. Native preferences contain only onboarding and view options. The script-to-native bridge accepts only small, fixed status messages. No user URLs or page text are saved to preferences. YouTube receives your requests, cookies and activity under its own policies.

Sign out using YouTube’s account menu. Resetting preferences keeps website cookies. To remove local app data, sign out and use **Delete App**. Apple and iCloud backups may retain previous data according to your device settings.

## Scope and maintenance

Quiet’s filter applies to the YouTube website inside Quiet. The official YouTube, Instagram and TikTok apps still have their own feeds. A Shortcuts redirect takes effect after YouTube opens and can be disabled in Shortcuts.

For Instagram, Slowth is a free App Store option that can detect Reels in the official app while a screen broadcast you start is active. It processes frames on the device and temporarily shields the whole app when it detects Reels. Instagram’s inbox remains available when the shield is clear. [Slowth](https://github.com/skar404/slowth)

Selective feed blocking with working native TikTok messaging remains unverified and unimplemented. Apple’s Screen Time shielding APIs require Family Controls, which Apple lists as unavailable to free Personal Teams. App distribution with the entitlement needs separate Apple approval. [iOS signing capabilities](https://developer.apple.com/help/account/reference/supported-capabilities-ios), [Family Controls entitlement](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement)

Google may restrict sign-in from embedded browsers. Website sessions are separate from Safari and the YouTube app. YouTube layout changes can require updates to Quiet’s filter. Filter data lives in `src/model/platforms.ts`, URL decisions in `src/filter/policy.ts`, and the document-start filter in `src/filter/script.ts`.

## Project layout

- `App.tsx`: startup, saved preferences and navigation.
- `src/components/BrowserSurface.tsx`: real iPhone WKWebView integration.
- `src/components/BrowserSurface.web.tsx`: explicitly labelled sample-content preview.
- `src/filter/`: filtering, bridge validation and invented test fixtures.
- `src/screens/`: onboarding, home and settings.
- `eas.json`: internal device, simulator and TestFlight build profiles.
- `.github/workflows/verify.yml`: automated checks plus optional macOS simulator compilation.

The generated `ios/` project is included in the delivery zip for convenience and can also be regenerated from `app.json`. Do not commit signing assets, Apple secrets or `credentials.json`.

## References

- [Expo iOS development](https://docs.expo.dev/guides/local-app-development/)
- [EAS internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [EAS TestFlight submission](https://docs.expo.dev/submit/ios/)
- [React Native WebView reference](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md)
- [Apple Developer Program](https://developer.apple.com/programs/)

Project source is provided under the MIT license; dependencies retain their own licenses.
