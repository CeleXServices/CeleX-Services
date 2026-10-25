# CeleX Services

Static website for CeleX Services (War of Clans event services). No build step.

- `index.html`, `styles.css`, `app.js`: the site
- `assets/icons/`: payment icons (PayPal and Revolut from Simple Icons, crypto from cryptocurrency-icons, both CC0)

## Run locally
Open `index.html`, or run `python3 -m http.server` in this folder.

## Deploy
GitHub Pages: Settings, Pages, deploy from the `main` branch, root folder.

## Edit prices
All rates live at the top of `app.js` in the `S` array.

## Show or hide discounted prices
In `app.js`, set `SHOW_DISCOUNT` at the top. `true` shows the regular price crossed out with the discounted price below it. `false` shows regular prices only.
