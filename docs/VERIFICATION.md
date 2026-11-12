# Verification of this delivery

Verified in the Linux cloud workspace on November 11, 2026:

| Check | Result |
| --- | --- |
| TypeScript strict typecheck | Passed |
| Navigation, preferences and message-bridge logic | 9 tests passed |
| Platform launch links for Shortcuts, including rejection of arbitrary URLs | 2 tests passed |
| Chromium browser scenarios | 14 tests passed |
| WebKit browser scenarios | 14 tests passed |
| Expo dependency compatibility | Passed |
| Expo Doctor | 20 of 20 checks passed |
| iOS production JavaScript/Hermes export | Passed |
| Web sample-preview production export | Passed |
| iOS native project generation | Passed |
| Signed native iPhone compilation | Not run: no macOS/Xcode/signing account in this workspace |
| Simulator or real iPhone execution | Not run |
| Signed-in platform behavior | Not tested: needs your own accounts on the target phone |

Browser scenarios use invented HTML fixtures, with navigation intercepted locally. They exercise the same injected script used by the iPhone app, including DOM changes, direct and client-side route guards, regular-content preservation, hidden-media pausing, wrong-origin rejection, repeated injection, onboarding and settings. The web preview contains only sample content and is clearly labelled.

WebKit on this host required Debian's official browser shared libraries extracted into a user-owned directory. Playwright's ldconfig-only dependency preflight cannot see that directory, so host dependency validation was skipped after verifying the libraries loaded. The browser itself and all assertions ran normally; no test was skipped. This is a test-environment detail, not an iPhone installation requirement.

Device-specific limitations remain in [DEVICE-CHECKLIST.md](DEVICE-CHECKLIST.md). A passing WebKit fixture test is not a claim of signed-in iPhone compatibility, Apple review approval, or a completed installation.

## Windows personal-signing preparation

Added a manually triggered hosted-Mac workflow for an unsigned **iPhoneOS arm64** device IPA, plus a package verifier and Windows/AltStore instructions. This route uses a regular Apple account and does not require buying the Apple Developer Program membership.

All eight IPA packager tests passed. They use synthetic executable headers in temporary test directories. They are validation tests, not compiled iPhone apps, and none of those test fixtures are delivered as an IPA. Workflow YAML and build-script shell syntax were validated; hosted actions are pinned to verified official release commits. The actual device build and Windows installation have not yet run. The hosted build must complete before an installable-for-signing IPA can be delivered.

## Automatic-opening support

Added cold-start and running-app handling for `quiet-social://open/<platform>` links, with optional `?view=inbox`. Shortcuts automations can use those links to open the filtered platform after its original app opens. Setup instructions are included in Settings and `AUTO-OPEN.md`. The app cannot install an automation on the user's behalf.

After this change, all 11 logic tests, strict TypeScript checks, iOS/web bundle exports and the four app UI scenarios across Chromium/WebKit passed. The unchanged filter scenarios passed previously. Actual native URL dispatch and Shortcuts automation execution are still untested on an iPhone.

## Visual and animation pass

Added Reanimated motion, per-platform icon modules (SF Symbols on iPhone), brief press feedback, grouped home rows, a shared original illustration and selective haptics. Final dependency checks and Expo Doctor passed (20/20); strict types, logic checks, production exports and generated iOS project checks passed. The full 28 browser scenarios passed, including reduced-motion navigation without page errors. The six UI scenarios were rerun after the final typography/reduced-motion adjustments and passed. All eight IPA packager tests passed. Final screenshots and a labelled sample-content browser video are included in the delivery.

The connected GitHub integration returned HTTP 403 for both Git push and Contents API writes to `Bobsfun11/Quite-iphone`. No source was uploaded and no hosted Mac build ran. A signed or unsigned real device IPA is **not** included. The account step is described in `RESUME-WINDOWS.md`.
