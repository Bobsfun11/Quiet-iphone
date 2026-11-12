# Quiet for iPhone

A standalone iPhone app for using social websites with short-video navigation and feeds hidden. Built with React Native, Expo SDK 58 and `react-native-webview` (WKWebView on iOS). It has no application backend, ads, subscription, Quiet account, analytics or remote filter service.

**Windows handoff for this project:** [resume the free build](docs/RESUME-WINDOWS.md). The selected repository is `Bobsfun11/Quite-iphone`; the connected integration currently returns HTTP 403 for uploads. This is a GitHub account-access blocker before signing, not a completed native build.

**Implementation is complete in source. Device installation, Apple code signing, native compilation and signed-in platform verification still require the steps below. The browser preview contains labelled sample content; it is not evidence that every platform works on an iPhone.**

## What is implemented

- Instagram: hide Reels navigation; block `/reel` and `/reels` routes. Keep regular feed, profiles, stories, Explore and the web inbox where Instagram permits them.
- YouTube: hide Shorts navigation, shelves and tiles; block Shorts routes; keep regular videos, search and subscriptions.
- TikTok: block For You, Following, Explore, Live and video routes; open the web inbox with desktop view enabled by default. Web messaging and sign-in may require the native app and are not guaranteed.
- Snapchat: hide Spotlight navigation and block Spotlight routes. Attempt Snapchat for Web in desktop view. **Snapchat may refuse iPhones; desktop view does not guarantee chat, camera, calls or sign-in support.**
- Two filtering layers: document-start CSS/JavaScript (including dynamic DOM updates and History API navigation), plus a native main-frame navigation policy.
- Strict short-video filtering: individual Reel/Short/video links, including links sent in messages, are blocked too. Long videos stay available.
- Persistent WKWebView website sessions; per-platform desktop view; an inbox-first preference; onboarding; browser back/forward/reload; loading, error and interrupted-process states; external-link confirmation; compatibility help; preference reset.
- Platform-specific app links and an in-app guide for free iPhone Shortcuts automations that forward an original-app launch into Quiet. See [automatic-opening setup](docs/AUTO-OPEN.md); the automation must be created on your iPhone.
- Refined grouped layouts, iPhone SF Symbols, short Reanimated entrances, tactile press feedback, selective haptics and reduced-motion support. See [design notes and skill sources](docs/DESIGN-NOTES.md).
- Original app links are rejected. External HTTPS sites can open in the system browser only after confirmation; protection does not apply there.

## Install on your iPhone

**Windows, no paid Apple membership:** use the [Windows personal-signing instructions](docs/WINDOWS-INSTALL.md). The included manual GitHub workflow builds an unsigned device IPA on a hosted Mac. AltStore Classic on Windows signs it with your regular Apple account. Free signatures need refreshing every seven days. No paid Apple membership is required for that route; the hosted build still needs a repository and an available free runner allowance or public-source approval.

There is no installable `.ipa` in this archive: Apple must sign device builds. Do not enter an Apple password, signing key or social password in chat.

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
6. Trust the developer in iPhone Settings → General → VPN & Device Management if prompted. Open Quiet and sign in directly on each social website.

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

Browser tests run the exact injected filter source against local invented fixtures in Chromium and WebKit. They verify short-feed removal, regular-content and login preservation, dynamic updates, route interception, media pausing, origin checks, reinjection, onboarding and saved preferences. They do not verify signed-in Instagram/TikTok/YouTube/Snapchat, WKWebView delegates or real-device capabilities. See [device acceptance checks](docs/DEVICE-CHECKLIST.md).

## Privacy

Quiet's injected code never reads login fields, messages or cookies. Website sessions are maintained by the default WKWebView data store, separate from Safari. Native preferences contain only onboarding and view options. The script-to-native bridge accepts only small, fixed status messages. No user URLs or page text are saved to preferences. Social websites naturally receive your requests, cookies and activity under their own policies.

Sign out using each website's account menu. Preference reset intentionally **does not** erase website cookies. To remove local app data, sign out and delete the app using **Delete App**, not Offload App; Apple/iCloud backups may retain previous data according to your device settings. Quiet has no background notifications or automatic sync with the native apps.

## Scope and maintenance

This app neither changes nor locks installed social apps. To avoid returning to those feeds, remove their Home Screen shortcuts or separately configure Apple's Screen Time. Screen Time integration is not included; it needs additional Apple entitlements and is unnecessary to filter Quiet's own web views.

Some platforms block embedded sign-in, especially Google/Facebook single sign-on. Use direct platform email/username sign-in when offered. Quiet cannot transfer Safari cookies, override account restrictions, unlock missing web features, guarantee zero content flashes or guarantee that a platform redesign will match these selectors. Site experiments and non-English labels can require rule updates.

Filter data lives in `src/model/platforms.ts`, URL decisions in `src/filter/policy.ts`, and the document-start filter in `src/filter/script.ts`. There are no broad text filters that hide unrelated conversations. The project is independent of the platforms and of SocialLite, with original code and artwork.

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
