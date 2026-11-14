# Verification for Quiet 1.1.0

On Windows, the TypeScript checks, logic tests and six Playwright scenarios cover the revised source. Chromium and WebKit exercise onboarding, the platform routes, the preview's connection states and the absence of an embedded browser.

The IPA packager suite runs on the hosted Mac because it uses POSIX file permissions and symlinks. A compiled unsigned iPhone device build verifies compilation and packaging. Instagram account setup, decryption, sending and receiving, and appearance and motion on an iPhone require the [signed device checks](DEVICE-CHECKLIST.md).

TikTok messaging is still unavailable in the app. The experimental signing test compares local output against fixed vectors from the pinned upstream implementation. An account-free live probe on November 14, 2026 verified that TikTok returns a first-party QR challenge and responds to a status check. Account authorization, read access and delivery still need validation.
