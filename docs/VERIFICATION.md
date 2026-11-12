# Verification

## Quiet 1.0.1

The revised source keeps YouTube’s website in Quiet, adds system light and dark appearance to Quiet’s interface, and removes the embedded Instagram, TikTok and Snapchat views. Use a hosted build of this revision and complete the iPhone checks for appearance changes, signed-in YouTube, scrolling, and Shortcuts behavior. [Real-device checklist](DEVICE-CHECKLIST.md)

On Windows, TypeScript checks, all nine logic tests, the sample web export, and all 22 Chromium and WebKit scenarios passed. The tests cover YouTube filtering, saved preferences from 1.0.0, and removal of the old app entries and launch routes. Browser tests use invented local content. Appearance, scrolling, and signed-in WKWebView behavior need a device check with the signed 1.0.1 build.

## Previous 1.0.0 build

The earlier 1.0.0 source compiled on GitHub’s standard hosted macOS runner. The downloaded IPA passed the verifier for an arm64 iPhoneOS executable and an embedded JavaScript bundle. Its deployment target was iOS 16.4. The earlier version was opened on the test iPhone, where the embedded Instagram and TikTok website experience prompted this revision. [Hosted build 43264445242](https://github.com/Bobsfun11/Quiet-iphone/actions/runs/43264445242)

The following checks passed on the previous source in the Linux cloud workspace on November 11, 2026.

| Check | Result |
| --- | --- |
| TypeScript strict typecheck | Passed |
| Navigation, preferences, message bridge and launch links | 11 tests passed |
| Chromium and WebKit browser scenarios | 28 tests passed |
| Expo dependency compatibility and Expo Doctor | Passed |
| iOS JavaScript/Hermes and sample web exports | Passed |
| iOS native project generation | Passed |
| IPA packaging validation | 8 tests passed |

The IPA packaging tests use synthetic executable headers. The GitHub-hosted device build above verifies that the previous source also produced a real unsigned IPA. The historical checks do not cover the revised source or establish signed-in YouTube compatibility on an iPhone.
