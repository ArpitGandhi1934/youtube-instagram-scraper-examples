# YouTube and Instagram data in Google Sheets (Apps Script)

[`Code.gs`](Code.gs) adds a **YouTube / Instagram data** menu to any Google Sheet. Each item asks for one value, runs the Actor on Apify and writes the results to a new tab:

| Menu item | You type | Tab columns |
|---|---|---|
| YouTube: search videos | a search term | title, URL, channel, published, views, likes, estimated dislikes, top comment, subscribers |
| YouTube: channel videos | a channel name, `@handle` or URL | same as above, newest videos first |
| Instagram: profile posts | a public handle or profile URL | URL, posted, type, likes, comments, plays, engagement rate (%), caption, owner, followers |

## Setup (2 minutes)

1. Open a Google Sheet, then **Extensions > Apps Script**.
2. Replace the editor contents with [`Code.gs`](Code.gs) and click **Save**.
3. Reload the sheet. The **YouTube / Instagram data** menu appears (the first run asks you to authorize the script to call external URLs and edit this sheet).
4. **YouTube / Instagram data > Set Apify token** and paste your Apify API token. It is stored in your own user properties, not in the sheet.

Change `SETTINGS.maxItems` at the top of the script for more rows per run (default 20). `SETTINGS.maxTotalChargeUsd` caps what a single run can cost.

## How it works

The script starts a run with `POST /v2/acts/<actor>/runs`, polls `GET /v2/actor-runs/<id>?waitForFinish=30` until it finishes (so no single request runs long), then reads `GET /v2/datasets/<id>/items`. Apps Script stops any script after 6 minutes, so keep `maxItems` modest; for thousands of rows, schedule the Actor on Apify and use its Google Sheets integration or a webhook instead.

Tested on 2026-09-26 by executing this exact file against the live Actors with Apps Script's `UrlFetchApp`, `SpreadsheetApp` and `PropertiesService` stood in by local equivalents: all three menu items produced their tabs (3 rows each at `maxItems: 3`).

## Notes

- YouTube dislike counts are estimates from [Return YouTube Dislike](https://returnyoutubedislike.com), not YouTube data.
- Instagram "plays" are read logged-out and can differ from the creator's own Insights.
- Public data only; nothing here signs in to YouTube or Instagram.
