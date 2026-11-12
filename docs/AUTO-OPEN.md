# Open social apps into Quiet with free iPhone Shortcuts

By default, opening the official TikTok, Instagram, YouTube or Snapchat app opens that original app. Quiet does not modify it or install an app-launch interceptor.

Apple's free Shortcuts automations can approximate the switch: **original app opens → the automation opens that platform inside Quiet**. Quiet now handles platform-specific launch links on cold start and when already running. A repeated launch to the same platform returns to its starting view. This behavior still requires validation on a real iPhone.

## Set up one automation per platform

First install a signed Quiet build and sign in on each website you want to use. Then on your iPhone:

1. Open **Shortcuts → Automation → +**. Choose the **App** trigger (or create a personal automation first if your iOS version presents that step).
2. Choose **TikTok**, and select **Is Opened**. Do **not** choose Quiet as the trigger.
3. Choose a blank automation and add an **Open URLs** action. If the editor needs a separate URL action, add **URL** containing the link below and pass it to **Open URLs**.
4. Use `quiet-social://open/tiktok?view=inbox` as the URL.
5. Select **Run Immediately**, or turn off **Ask Before Running** and confirm **Don't Ask**, depending on your iOS version. Save the automation.
6. With your phone unlocked, open TikTok. The automation should switch to Quiet's TikTok web inbox. The original app may appear briefly before the switch.
7. Repeat for the other original apps using these URLs:

| Original app trigger | Open this URL |
| --- | --- |
| TikTok | `quiet-social://open/tiktok?view=inbox` |
| Instagram | `quiet-social://open/instagram?view=inbox` |
| YouTube | `quiet-social://open/youtube` |
| Snapchat | `quiet-social://open/snapchat?view=inbox` |

The app also shows these selectable links under **Settings → Open into Quiet → Show setup steps**. This is a guide; no switch in Quiet silently installs a Shortcut. Personal automations must be created on your iPhone.

## What remains available

- **TikTok:** opens its web inbox where available. Profiles, account routes and supported search pages are allowed; For You, Following, Explore, Live and video routes stay blocked. The web platform may require the native app for messaging or sign-in; Quiet cannot make unsupported features work.
- **Instagram:** opens the web inbox; regular feed, profiles, stories and Explore remain allowed, subject to Instagram's web features. Reels routes are blocked.
- **YouTube:** opens regular YouTube, or subscriptions if you enable inbox-first. Search, subscriptions and long videos remain allowed; Shorts routes are blocked.
- **Snapchat:** attempts web chat in desktop view. Spotlight is blocked, but Snapchat may reject iPhone browsers or limit chat/calls.

## Limits

This is a redirect after the original app opens, not a replacement of that app's code or icon. It is not a security lock and can be disabled. It does not transfer your native-app sign-in, capture the screen, inspect your inbox, or preserve a specific message/post from an incoming notification. Links opening original apps from Quiet stay disabled to avoid feed escapes and automation loops.

If you want the original app temporarily, disable its automation in Shortcuts and turn it back on later. Shortcuts UI labels vary by iOS version. The app must remain signed and unexpired for its launch links to work; free-account signing needs refreshing every seven days.

## Apple documentation

- [App opening triggers](https://support.apple.com/guide/shortcuts/apde31e9638b/ios)
- [Create a personal automation](https://support.apple.com/guide/shortcuts/apdfbdbd7123/ios)
- [Allow an automation to run automatically](https://support.apple.com/guide/shortcuts/apd602971e63/ios)
