# Real iPhone acceptance checks

Status: not run in the Linux build environment. Do not mark a platform supported until tested with your own account on the target iPhone. Never include credentials, DMs, cookies or screenshots containing private content in bug reports.

1. Install a signed **Release** build; quit any Metro server and confirm it opens independently. Check both a fresh install and a relaunch after force-quitting.
2. Complete onboarding; change inbox-first and desktop preferences; restart; confirm the choices persist.
3. For each platform, try direct username/email login and 2FA. Confirm origin display and expected domains. Report embedded-browser rejection without attempting to bypass it.
4. Instagram: navigate the regular feed, profiles, stories, Explore and inbox. Check that no Reels tab is visible. Try a direct Reel URL from a message: it must show the filter guard or a blocking notice. Confirm ordinary messages and non-Reel links work where Instagram supports them.
5. YouTube: search and play a long video; verify Shorts navigation and shelves are hidden. Try Shorts from search or a deep link. Rotate/device multitask if using picture-in-picture.
6. TikTok: confirm the website actually supports login and messaging on your account. Check For You, Following, Explore, Live and video links are blocked. If its inbox requires the native app, retain the compatibility warning and treat messaging as unavailable.
7. Snapchat: confirm whether Snapchat for Web accepts the iPhone. If rejected, verify Quiet displays compatibility help and does not promise native chat. If accepted, test chat, photo upload, device permissions and Spotlight hiding.
8. Check back/forward gestures, back/forward toolbar buttons, reload, stop, browser errors, offline/reconnect and WebKit process termination recovery. Verify no repeated navigation loop when a platform redirects to a blocked feed.
9. Follow an external link. Confirm it asks before leaving Quiet. Decline once, then accept once. Try `instagram://`, `youtube://`, custom schemes, HTTP and disguised/lookalike domains. None should silently launch another app from Quiet.
10. Test file/image uploads and camera/microphone prompts only if you want those features. Requests should remain subject to iOS and website permissions. Check nothing is requested merely by opening the home screen.
11. Sign out in a platform's own account menu and relaunch. Confirm preferences reset shows onboarding but intentionally leaves other platform sessions alone.
12. Check VoiceOver, larger system text, small iPhone displays, keyboard appearance and scrolling in the compatibility sheet. Test on the actual iOS version you will use.
13. Test platform launch URLs with Quiet closed, already open and showing a different platform. Reopening the same platform link should return to its starting view. Create a Shortcuts App → Is Opened automation using `AUTO-OPEN.md`; confirm it switches after the original app opens, preserves the requested platform, does not loop, and can be disabled. A notification's original message/post is not transferred.
14. Feel-check a Release build on the oldest supported iPhone available: interrupt press feedback, return repeatedly to Home (entrances should not replay), check one-time illustration settling, and check haptic timing. Enable iOS Reduce Motion, relaunch and verify that scale, translation and compatibility-sheet sliding are suppressed. Native timing and haptics were not verified in the Linux browser tests.

These checks are release criteria for device compatibility, not claims that they already passed.
