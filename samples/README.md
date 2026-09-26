# Samples

Real output of every file in [`../inputs`](../inputs), collected on 2026-09-26 from YouTube Scraper build 0.1.11 and Instagram Scraper build 0.2.7, at 5 items or fewer per example.

Before committing, each file went through [`redact.jq`](redact.jq):

- Instagram accounts that are not verified appear as `user_1`, `user_2` and so on, with their id, name, bio, links and avatar set to `null`. Posts they own show `REDACTED` instead of a post code and URL.
- YouTube comment authors appear as `@user_1`, `@user_2` and so on.
- Email addresses are removed from all text (descriptions, bios), and every profile's `emails` and `phones` values are blanked.
- Signed Instagram image and video URLs (they expire after a few days) are replaced with a placeholder.

Verified accounts, brands, channels and every count are unmodified. Your own runs return the full values.

| File | Input | Rows |
|---|---|---:|
| `youtube/search.json` | `searchTerms: ["python tutorial"]` | 5 |
| `youtube/channel.json` | `channels: ["@mkbhd"]` | 5 |
| `youtube/video-urls.json` | 2 video URLs, `includeDislikes` | 2 |
| `youtube/playlist.json` | a Fireship playlist | 5 |
| `youtube/comments.json` | 1 video, `maxComments: 5` (comments sit inside the video row) | 1 |
| `youtube/date-sort-filters.json` | `"iphone review"`, this month, sorted by views | 5 |
| `youtube/shorts.json` | `"cat shorts"`, `includeShorts` | 5 |
| `instagram/profile.json` | `nasa`, last 60 days | 3 |
| `instagram/reels-tab.json` | `nike/reels/` | 3 |
| `instagram/hashtag.json` | `#travel` and `#nyc`, 2 each | 4 |
| `instagram/keyword.json` | `toronto` | 3 |
| `instagram/location.json` | Berlin | 3 |
| `instagram/audio.json` | one original sound | 1 |
| `instagram/post-url.json` | 1 reel with latest comments, AI summary, views | 1 |
| `instagram/comments.json` | comments mode on 1 reel | 5 |
| `instagram/profile-details.json` | `nasa` details with related profiles | 1 |
| `instagram/lookalike-business-filters.json` | `nasa` + up to 5 related accounts, business/creator only, 100k+ followers | 5 |
