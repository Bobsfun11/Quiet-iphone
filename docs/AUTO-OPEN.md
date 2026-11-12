# Open YouTube into Quiet with iPhone Shortcuts

An optional Shortcuts automation opens the filtered YouTube website in Quiet after the official YouTube app opens. The original app may appear briefly first. The automation does not lock its feed.

## Set up the YouTube automation

First install a signed Quiet build. Then on your iPhone:

1. Open **Shortcuts → Automation → +**. Choose the **App** trigger.
2. Choose **YouTube** and select **Is Opened**.
3. Add an **Open URLs** action. If the editor needs a separate URL action, add **URL** with your chosen link and pass it to **Open URLs**.
4. Use `quiet-social://open/youtube` to follow Quiet’s start page preference, or `quiet-social://open/youtube?view=inbox` to go directly to subscriptions.
5. Select **Run Immediately**, or turn off **Ask Before Running** and confirm **Don't Ask**, depending on your iOS version.
6. Save the automation and open YouTube with your phone unlocked. Confirm that Quiet opens the website at the expected page.

Quiet shows the launch link in Settings. You create and manage the automation in Shortcuts. If you have old Instagram, TikTok or Snapchat automations that open Quiet, turn them off in Shortcuts. Their launch links no longer open a website in Quiet.

## Behavior

The YouTube link can open Quiet when it is closed or already running. A repeated launch returns to the start page. Search, subscriptions and long videos are available inside Quiet, where Shorts routes are filtered.

Quiet has its own website session. The redirect opens the start page without carrying over a particular video from a notification. Disable the automation whenever you want to open YouTube directly. Quiet must remain signed for its app links to work.

- [App opening triggers](https://support.apple.com/guide/shortcuts/apde31e9638b/ios)
- [Create a personal automation](https://support.apple.com/guide/shortcuts/apdfbdbd7123/ios)
- [Allow an automation to run automatically](https://support.apple.com/guide/shortcuts/apd602971e63/ios)
