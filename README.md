# CeleX Services

Static website for CeleX Services (War of Clans event services). No build step.

- `index.html`, `styles.css`, `app.js`: the site
- `assets/icons/`: payment icons and monochrome Discord, Telegram, and LINE marks (Simple Icons, CC0)

## Run locally
Open `index.html`, or run `python3 -m http.server` in this folder.

## Deploy
GitHub Pages: Settings, Pages, deploy from the `main` branch, root folder.

## Receive order requests with Google Sheets
The site can submit custom-styled order requests to a private Google Sheet using Google Apps Script. Customers stay on the site. A submitted request is marked `Pending`; it is not a confirmed booking, and the displayed estimate must be confirmed with the customer.

1. Create a Google Sheet and keep its sharing settings private.
2. Open **Extensions > Apps Script**. Replace the editor contents with `Code.gs` from this project.
3. Copy the Sheet ID from its URL (the text between `/d/` and `/edit`) into `SPREADSHEET_ID` at the top of `Code.gs`. Save.
4. In Apps Script, select `setupSheet` and click **Run** once. Review and approve the requested Google Sheets permission. This creates the `Orders` tab and headers.
5. Select **Deploy > New deployment > Web app**. Set **Execute as** to yourself and **Who has access** to **Anyone**, then deploy and copy the web app URL. Google may show a warning when deploying your own script.
6. Paste the deployed URL into `ORDER_ENDPOINT` near the top of `app.js`, commit/push the change, and let Vercel redeploy.
7. Submit a test request from the live site and confirm it appears in the private `Orders` tab. Delete the test row afterward if desired.

The web app must be accessible to anyone so the public site can submit requests; the Sheet itself should remain private. The endpoint URL is public and can receive spam. The script applies basic field validation and a honeypot, but this is intended for a small site, not high-volume or sensitive-data collection. Do not collect passwords, payment-card details, or other sensitive information.

## Discord request notifications
Discord notifications are sent by Apps Script after the request is written to the Sheet. Webhook URLs are never placed in the website. Because webhook URLs are credentials, revoke any URL that has been shared and create replacements before using this feature.

1. In Apps Script, open **Project Settings > Script Properties** and add each replacement URL using the matching property name: `WEBHOOK_ALFHEIM`, `WEBHOOK_JOTUNHEIM_SPY`, `WEBHOOK_ASGARD_SPY`, `WEBHOOK_MINI_ASGARD_SPY`, `WEBHOOK_MINI_ASGARD_TOWERS`, `WEBHOOK_BIG_ASGARD_TOWERS`, `WEBHOOK_HOLDING_THE_THRONE`, and `WEBHOOK_CUSTOM_BOT`.
2. Save the properties. Do not add webhook URLs to `app.js`, `Code.gs`, the Sheet, or a public repository.
3. In **Deploy > Manage deployments**, edit the web app deployment, select **New version**, and deploy the updated `Code.gs`.
4. In the Apps Script function selector, run `testAllWebhooks` once to send a connection test to each configured service channel. Review the execution log for successes, skipped properties, or HTTP errors.
5. Submit a test order for each service and confirm its notification appears in the corresponding channel. The notification includes the request ID, service, selected options, estimate, and preferred time; it omits customer contact details and notes. The Sheet remains the source for those private details.

An individual webhook failure is logged and does not undo an order already saved to the Sheet. Missing webhook properties are logged and skipped.

## Edit prices
All rates live at the top of `app.js` in the `S` array.

## Show or hide discounted prices
In `app.js`, set `SHOW_DISCOUNT` at the top. `true` shows the regular price crossed out beside the discounted price with a small corner ribbon on discounted service cards. `false` shows regular prices only and hides the ribbons.
