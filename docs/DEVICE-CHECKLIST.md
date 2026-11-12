# Real iPhone acceptance checks

Run these checks on the iPhone you will use after signing an updated Release build. Keep credentials and private content out of bug reports.

1. Quit Metro and open Quiet. Check a fresh install and a relaunch after force-quitting.
2. Complete onboarding, change the subscriptions start and desktop website preferences, and relaunch. Verify the preferences persist. When upgrading from 1.0.0, confirm the YouTube preferences survive and the old Instagram, TikTok and Snapchat rows and settings are gone.
3. Switch between light and dark appearance in iPhone Settings. Confirm Quiet updates on Home, Settings, the website controls, and the help sheet. Check that the status bar, text, icons and loading states remain readable. YouTube’s website renders its own content.
4. Search for and play a long video. Open subscriptions. Verify Shorts tabs, shelves and tiles are filtered. Open a direct Shorts link inside Quiet and confirm it is blocked. Test rotation and multitasking if you use picture-in-picture.
5. Try YouTube sign-in and 2FA with your own account. Check the origin shown by Quiet. If Google rejects the embedded browser, record the error.
6. Check back and forward gestures and buttons, reload, stop, offline recovery, and the error screen. Confirm no repeated navigation loop when a route is blocked.
7. Follow an external HTTPS link and confirm Quiet asks before opening it. Decline once, then accept once. Test a `youtube://` link, an HTTP link, and a lookalike domain. Confirm these do not silently leave Quiet.
8. Check that resetting preferences returns to onboarding and leaves the website’s session state intact. Sign out through the website to end the session.
9. Test both [YouTube Shortcuts links](AUTO-OPEN.md) from cold and warm starts. Check a repeated launch, opening from Settings, disabling the automation, and turning off any old Instagram, TikTok or Snapchat automations. The redirect should switch after YouTube opens and should not loop.
10. Check VoiceOver, larger text, a small display and keyboard appearance. Return to Home repeatedly and verify entrances do not replay. Turn on Reduce Motion, relaunch and check that large movements are reduced. Judge website scrolling and touch feedback on the actual device.
