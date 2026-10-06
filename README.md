# YouTube & Instagram Scraper Examples: Python, Node.js, curl, Apify CLI, Google Sheets

[![YouTube Scraper on Apify][badge-yt]][store-yt] [![Instagram Scraper on Apify][badge-ig]][store-ig]

Working **YouTube and Instagram scraper examples** for every input mode of two Apify Actors: the [YouTube Scraper][store-yt] (search, channels, playlists, video URLs, comments, date and sort filters, Shorts, estimated dislikes) and the [Instagram Scraper][store-ig] (profiles, reels, hashtags, keywords, locations, audio, posts, comments, profile details, lookalike accounts). Each example is a small JSON input you can run from Python, Node.js, curl, the Apify CLI or Google Sheets, with real sample output next to it. Both Actors read public data without a YouTube API key or an Instagram login.

- [Setup](#setup)
- [YouTube examples](#youtube-examples): [search](#youtube-search), [channel](#youtube-channel-videos), [video URLs + dislikes](#youtube-video-urls-and-dislikes), [playlist](#youtube-playlist), [comments](#youtube-comments), [date and sort filters](#youtube-date-and-sort-filters), [Shorts](#youtube-shorts-scraper)
- [Instagram examples](#instagram-examples): [profile](#instagram-profile-posts), [reels](#instagram-reels-scraper-reels-tab), [hashtag](#instagram-hashtag), [keyword](#instagram-keyword-search), [location](#instagram-location-posts), [audio](#instagram-reels-by-audio), [post URL](#instagram-post-url-with-add-ons), [comments](#instagram-comments), [profile details](#instagram-profile-details-and-related-accounts), [lookalike + business filters](#instagram-lookalike-accounts-with-business-filters)
- [Google Sheets](#google-sheets) · [Price](#price) · [Why not the official APIs](#why-this-instead-of-the-youtube-data-api-or-the-instagram-graph-api) · [Limits](#limits)

## Setup

1. Create a free Apify account and copy your API token ([sign up][signup], then Console > Settings > API & Integrations).
2. `cp .env.example .env` and paste the token after `APIFY_TOKEN=`.
3. Install whichever runner you want:

| Runner | Install | Run an example |
|---|---|---|
| Node.js 20.6+ | `npm install` | `node --env-file=.env node/run.mjs youtube inputs/youtube/search.json` |
| Python 3.10+ | `pip install -r python/requirements.txt` | `python python/run.py youtube inputs/youtube/search.json` |
| curl | nothing | `./curl/run.sh youtube inputs/youtube/search.json` |
| Apify CLI | `npm install -g apify-cli && apify login` | `./cli/run.sh youtube inputs/youtube/search.json` |

Every runner takes `<youtube|instagram> <input.json> [output.json]` and prints JSON when no output file is given. Any input file below works with any runner. The Node and Python runners set a $1 cost cap per run.

The whole thing in a few lines, if you'd rather not use the runners:

```python
# pip install apify-client
from apify_client import ApifyClient

client = ApifyClient("YOUR_APIFY_TOKEN")
run = client.actor("yugenox/youtube-scraper").call(
    run_input={"channels": ["@mkbhd"], "maxItems": 20, "maxComments": 5, "includeDislikes": True}
)
dataset_id = run["defaultDatasetId"] if isinstance(run, dict) else run.default_dataset_id  # client v1-2 / v3
for video in client.dataset(dataset_id).iterate_items():
    print(video["title"], video["viewCount"], video.get("likes"), video.get("dislikes"))
```

```js
// npm install apify-client
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const run = await client.actor('yugenox/instagram-scraper').call({
    startUrls: ['https://www.instagram.com/nasa/reels/'],
    maxItems: 20,
    includeTranscript: true, // $0.004 per started minute of speech
});
const { items } = await client.dataset(run.defaultDatasetId).listItems();
for (const reel of items) console.log(reel.url, reel.video?.playCount, reel.transcript);
```

## YouTube examples

Actor: `yugenox/youtube-scraper`. One row per video with title, views, exact likes, upload date, channel, subscribers, description, hashtags and description links. Comments and estimated dislikes are added inside the same row when you ask for them.

### YouTube search

[`inputs/youtube/search.json`](inputs/youtube/search.json) · [sample](samples/youtube/search.json)

```json
{ "searchTerms": ["python tutorial"], "maxItems": 5 }
```

`maxItems` is per search term. Several terms in one run are fine.

### YouTube channel videos

[`inputs/youtube/channel.json`](inputs/youtube/channel.json) · [sample](samples/youtube/channel.json)

```json
{ "channels": ["@mkbhd"], "maxItems": 5 }
```

A channel name, `@handle` or channel URL all work. Returns the newest videos first, up to `maxItems` per channel.

### YouTube video URLs and dislikes

[`inputs/youtube/video-urls.json`](inputs/youtube/video-urls.json) · [sample](samples/youtube/video-urls.json)

```json
{ "startUrls": ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/jNQXAC9IVRw"], "includeDislikes": true }
```

`watch?v=`, `youtu.be/`, `/shorts/` and `/embed/` links are accepted. With `includeDislikes` each row gets `dislikes` and `rating` from [Return YouTube Dislike](https://returnyoutubedislike.com): an **estimate**, since YouTube hid public dislike counts in 2021. For a CSV of dislikes in bulk, see [youtube-dislike-count-bulk](https://github.com/ArpitGandhi1934/youtube-dislike-count-bulk).

### YouTube playlist

[`inputs/youtube/playlist.json`](inputs/youtube/playlist.json) · [sample](samples/youtube/playlist.json)

```json
{ "startUrls": ["https://www.youtube.com/playlist?list=PL0vfts4VzfNjzjr4leSQ1_WUm_6vlpfxd"], "maxItems": 5 }
```

### YouTube comments

[`inputs/youtube/comments.json`](inputs/youtube/comments.json) · [sample](samples/youtube/comments.json)

```json
{ "startUrls": ["https://www.youtube.com/watch?v=jNQXAC9IVRw"], "maxComments": 5 }
```

`maxComments` adds up to that many top comments to each video row as `comments[]` (text, author, likes, reply count, relative time). It works with search, channel and playlist inputs too, and the comments are included in the video's price: 100 videos with 20 comments each is 100 results, not 2,100.

### YouTube date and sort filters

[`inputs/youtube/date-sort-filters.json`](inputs/youtube/date-sort-filters.json) · [sample](samples/youtube/date-sort-filters.json)

```json
{ "searchTerms": ["iphone review"], "dateFilter": "month", "sortBy": "views", "maxItems": 5 }
```

`dateFilter`: `any`, `hour`, `today`, `week`, `month`, `year`. `sortBy`: `relevance`, `date`, `views`, `rating`. Both apply to search terms only, not to channel, playlist or video URLs. Rows are written as they finish, so sort the dataset yourself if order matters.

### YouTube Shorts scraper

[`inputs/youtube/shorts.json`](inputs/youtube/shorts.json) · [sample](samples/youtube/shorts.json)

```json
{ "searchTerms": ["cat shorts"], "includeShorts": true, "maxShorts": 5, "maxStreams": 0, "maxItems": 5 }
```

Shorts are off by default. With `includeShorts`, search results also include Shorts, flagged `isShort: true` with a `shortsUrl`. `maxShorts` and `maxStreams` cap Shorts and live streams per search term (`0` excludes them). YouTube doesn't return the Shorts shelf when a date filter or non-default sort is set, and `duration` is empty on Shorts.

If you only need Shorts, the dedicated [YouTube Shorts Scraper][store-shorts] (`yugenox/youtube-shorts-scraper`) costs less per Short: $1.30 per 1,000 on the Apify Free and Starter plans (down to $1.00 on Business), plus $0.001 per run and $0.0003 per channel, search or URL checked, against $2.00 per 1,000 rows here. It reads a channel's Shorts tab (newest, most popular or oldest first), YouTube's Shorts-only search and Shorts URLs, has a newer-than date filter, and adds the song a Short uses when YouTube lists one. It reads public details only: no video files, captions or comment text.

```json
{ "channels": ["@NASA"], "channelSortBy": "popular", "maxResults": 20 }
```

Run it with the Python or JavaScript snippet at the top by changing the Actor name to `yugenox/youtube-shorts-scraper`; the runners in this repo take `youtube` or `instagram` only.

## Instagram examples

Actor: `yugenox/instagram-scraper`. Posts mode returns one row per post or reel with caption, likes, comments, plays, owner with follower count, co-authors, tagged users, location, audio and media URLs.

### Instagram profile posts

[`inputs/instagram/profile.json`](inputs/instagram/profile.json) · [sample](samples/instagram/profile.json)

```json
{ "startUrls": ["https://www.instagram.com/nasa/"], "until": "60 days", "maxItems": 3 }
```

A profile URL, bare handle or numeric user ID. Posts come newest first. `until` takes a date (`2026-09-01`) or a period (`7 days`, `3 months`) and stops reading the profile at the first older post, so you don't pay for it.

### Instagram Reels scraper (reels tab)

[`inputs/instagram/reels-tab.json`](inputs/instagram/reels-tab.json) · [sample](samples/instagram/reels-tab.json)

```json
{ "startUrls": ["https://www.instagram.com/nike/reels/"], "maxItems": 3 }
```

Only the profile's reels, with `video.playCount`. Add `"includeTranscript": true` for speech-to-text; see [instagram-reels-transcript-bulk](https://github.com/ArpitGandhi1934/instagram-reels-transcript-bulk) for a ready-made reels-to-text tool.

### Instagram hashtag

[`inputs/instagram/hashtag.json`](inputs/instagram/hashtag.json) · [sample](samples/instagram/hashtag.json)

```json
{ "startUrls": ["#travel", "https://www.instagram.com/explore/tags/nyc/"], "maxItemsPerQuery": 2, "maxItems": 4 }
```

`#tag` or the tag URL. Logged-out visitors see Instagram's curated **top posts** for a hashtag, about 60 at most, and only for tags that have a public page (`travel`, `nyc` and `toronto` do; some tags are login-only and return nothing, at no charge). `expandRelatedKeywords` pulls more posts from related keywords. `maxItemsPerQuery` caps each hashtag separately.

### Instagram keyword search

[`inputs/instagram/keyword.json`](inputs/instagram/keyword.json) · [sample](samples/instagram/keyword.json)

```json
{ "keywords": ["toronto"], "maxItems": 3 }
```

Same limits as hashtags: curated top posts, about 60 per keyword.

### Instagram location posts

[`inputs/instagram/location.json`](inputs/instagram/location.json) · [sample](samples/instagram/location.json)

```json
{ "startUrls": ["https://www.instagram.com/explore/locations/213131048/"], "maxItems": 3 }
```

Top and most recent posts at a place, typically about 70 in total. Use `"resultsType": "details"` for the place itself (category, coordinates, address).

### Instagram reels by audio

[`inputs/instagram/audio.json`](inputs/instagram/audio.json) · [sample](samples/instagram/audio.json)

```json
{ "startUrls": ["https://www.instagram.com/reels/audio/29369820619287776/"], "maxItems": 3 }
```

Reels that use a given sound. The id is in the audio page URL.

### Instagram post URL with add-ons

[`inputs/instagram/post-url.json`](inputs/instagram/post-url.json) · [sample](samples/instagram/post-url.json)

```json
{ "startUrls": ["https://www.instagram.com/p/DdPsDCWRT-u/"], "commentsPerPost": 3, "includeAiSummary": true, "includeVideoViews": true }
```

`/p/`, `/reel/` and `/share/` links. `commentsPerPost` attaches the newest comments as `latestComments`, `includeAiSummary` adds Instagram's own `aiTitle` and `aiSummary`, and `includeVideoViews` adds `video.viewCount`. All three are included in the row price. Add-ons work on every posts-mode input, not only post URLs.

### Instagram comments

[`inputs/instagram/comments.json`](inputs/instagram/comments.json) · [sample](samples/instagram/comments.json)

```json
{ "startUrls": ["https://www.instagram.com/p/DdPsDCWRT-u/"], "resultsType": "comments", "maxComments": 5, "maxItems": 5 }
```

One row per comment (text, author, likes, date), newest first by default; `"commentsSort": "top"` returns the most-liked first. Replies to comments are only visible to logged-in accounts, so they are not included.

For comments only, the [Instagram Comments Scraper][store-igc] (`yugenox/instagram-comments-scraper`) takes post URLs with like, keyword and date filters that run before billing; [instagram-comments-export](https://github.com/ArpitGandhi1934/instagram-comments-export) wraps it in Python and Node scripts that write Excel, CSV or JSONL.

### Instagram profile details and related accounts

[`inputs/instagram/profile-details.json`](inputs/instagram/profile-details.json) · [sample](samples/instagram/profile-details.json)

```json
{ "startUrls": ["https://www.instagram.com/nasa/"], "resultsType": "details", "includeRelatedProfiles": true }
```

One row per profile: bio, bio links, followers, following, reels count, category, account type (personal, business or creator), emails and phones found in the bio, and with `includeRelatedProfiles` up to 50 similar accounts Instagram suggests.

### Instagram lookalike accounts with business filters

[`inputs/instagram/lookalike-business-filters.json`](inputs/instagram/lookalike-business-filters.json) · [sample](samples/instagram/lookalike-business-filters.json)

```json
{ "startUrls": ["https://www.instagram.com/nasa/"], "resultsType": "details", "scrapeRelatedProfiles": 5, "businessOnly": true, "minFollowers": 100000, "maxItems": 5 }
```

`scrapeRelatedProfiles` also scrapes up to N accounts related to each profile you give (one level deep), which is a quick way to build a lookalike list for influencer or competitor research. Filters drop rows before you pay for them: `businessOnly` keeps business and creator accounts, `minFollowers`/`maxFollowers` set a follower band, `verifiedOnly` keeps verified accounts and `withContactOnly` keeps profiles that list an email or phone in their bio. These are public profile signals only: no audience demographics and no fake-follower analysis.

## Google Sheets

[`google-sheets/Code.gs`](google-sheets/Code.gs) adds a menu to any Google Sheet that pulls YouTube search results, a YouTube channel or an Instagram profile into a new tab. Setup takes two minutes: see [google-sheets/README.md](google-sheets/README.md).

## Price

Pay per result, no subscription. Prices checked on 2026-10-06 from the Apify API (Apify Free plan prices):

| Job | yugenox Actors | Alternative on Apify |
|---|---|---|
| 1,000 YouTube videos | **$2.00** | streamers/youtube-scraper: $4.00 |
| 100 YouTube videos with 20 comments each | **$0.20** (comments ride inside the video row) | $4.40 (streamers/youtube-scraper $0.40 + streamers/youtube-comments-scraper $2.00 per 1,000 comments × 2,000) |
| 1,000 YouTube Shorts | **$1.30** with the [Shorts Scraper][store-shorts] (plus $0.001 per run and $0.0003 per channel or search); $2.00 here with `includeShorts` | streamers/youtube-shorts-scraper: $4.00 |
| YouTube dislike estimates | included | not offered |
| 1,000 Instagram posts | **$1.90** | apify/instagram-scraper: $2.70 |
| 1,000 Instagram comments | **$1.90** with the [Comments Scraper][store-igc] or with `resultsType: "comments"` here | apify/instagram-comment-scraper: $2.60 |
| One 30-second Instagram reel with transcript | **$0.0059** | apify/instagram-reel-scraper: $0.0506 ($0.0026 + $0.048 per transcript minute) |

For plain video metadata at volume, apidojo/youtube-scraper is $0.50 per 1,000 (10-video minimum per query, no single-video URLs, no comments or dislikes). For short reel transcripts, apple_yang/instagram-transcripts-scraper is $0.0055 per 30-second reel, slightly below ours; we're slightly lower from two started minutes up. For Instagram comments, apidojo/instagram-comments-scraper is $0.50 per 1,000, below ours. Full dated comparisons: [YouTube scrapers compared](https://yugenox-data.vercel.app/compare/youtube-scrapers) and [reel transcript tools compared](https://yugenox-data.vercel.app/compare/instagram-reel-transcript-tools).

The Instagram price includes latest comments, AI summaries and view counts in the row; transcripts are $0.004 per started minute of audio. Plain post rows without those extras are available for less elsewhere on the Store. Instagram row and comment prices drop on bigger Apify plans: $1.50 per 1,000 on Scale and $1.10 on Business (the YouTube Scraper costs the same on every plan). Apify's free plan includes monthly credit you can spend on any of these Actors; Free-plan runs of the Instagram Actors are limited to 100 results each.

## Why this instead of the YouTube Data API or the Instagram Graph API

The official APIs are the right choice for your own channel or account, for publishing, and whenever you need Google's or Meta's official numbers. For collecting public data about other channels and accounts they are harder to use:

**YouTube Data API v3**

- **Quota.** Projects get 10,000 units a day by default. A `search.list` call costs 100 units, so about 100 searches a day; reading comments and video details costs more calls on top.
- **No dislikes.** Since December 13, 2021 `dislikeCount` is returned only to the video's owner.
- **Setup.** A Google Cloud project and API key, and a quota extension request for more.

**Instagram Graph API**

- **Only accounts that authorized your app.** It returns media for Instagram professional accounts connected to your app; Business Discovery adds a few public fields of other business and creator accounts. Hashtag search is capped at 30 unique hashtags per 7 days, and there is no location, audio or related-accounts feed and no transcripts.
- **Setup and review.** A Meta developer app, an Instagram professional account, access tokens and, for most permissions, app review. The Instagram Basic Display API was shut down on December 4, 2024.

With the Actors you need one Apify token, and you pay per result.

## Limits

- **Public data only.** Neither Actor signs in. Private Instagram accounts, stories, tagged posts, follower lists and profile search are not available.
- **Instagram hashtags and keywords** return curated top posts, about 60 per term; locations return about 70 posts. Comments come newest first unless you ask for the most-liked (`commentsSort: "top"`), and without replies.
- **Instagram plays and views** are read logged-out and can differ from what the creator sees in Insights. Don't use them to verify creator payouts.
- **YouTube filters** (`dateFilter`, `sortBy`) apply to search terms only. Dislikes are estimates. This repo doesn't cover subtitles.
- **Inputs that return nothing** (a YouTube channel that doesn't exist, a search with no results, a private or deleted video) are listed in the run's `ERRORS` record and status message and aren't charged. Set `errorRowsInDataset: true` to also get them as dataset rows with an `error` field, each billed as one result. Instagram runs list what happened to every input (`ok`, `private`, `not_found` …) in a `RUN_REPORT` record.

## More

- YouTube dislike counts in bulk to CSV: [youtube-dislike-count-bulk](https://github.com/ArpitGandhi1934/youtube-dislike-count-bulk)
- Instagram Reels to text in bulk: [instagram-reels-transcript-bulk](https://github.com/ArpitGandhi1934/instagram-reels-transcript-bulk)
- Instagram comments to Excel or CSV with like, keyword and date filters: [instagram-comments-export](https://github.com/ArpitGandhi1934/instagram-comments-export) ([Instagram Comments Scraper][store-igc]). Shorts only: [YouTube Shorts Scraper][store-shorts]
- Both Actors inside Claude, ChatGPT, Cursor or VS Code through pinned Apify MCP servers: [yugenox-mcp](https://github.com/ArpitGandhi1934/yugenox-mcp)
- Guides on [yugenox-data.vercel.app](https://yugenox-data.vercel.app): [YouTube Data API alternative](https://yugenox-data.vercel.app/youtube/data-api-alternative), [YouTube scrapers compared](https://yugenox-data.vercel.app/compare/youtube-scrapers), [YouTube comments](https://yugenox-data.vercel.app/youtube/comments-scraper), [channel videos to CSV](https://yugenox-data.vercel.app/youtube/channel-videos-to-csv), [Instagram without login](https://yugenox-data.vercel.app/instagram/scraper-no-login), [influencer vetting](https://yugenox-data.vercel.app/instagram/influencer-vetting), [location posts](https://yugenox-data.vercel.app/instagram/location-posts), [reels by audio](https://yugenox-data.vercel.app/instagram/reels-by-audio), [use in ChatGPT, Claude and Cursor](https://yugenox-data.vercel.app/ai/use-in-chatgpt-claude-cursor), [pricing calculator](https://yugenox-data.vercel.app/pricing-calculator)
- The Actors, with input forms, output schemas, reviews and their API pages (clients, OpenAPI, MCP for AI agents): [YouTube Scraper][store-yt] ([API][api-yt]) and [Instagram Scraper][store-ig] ([API][api-ig])

## Samples, testing and legal

- Every input in [`inputs/`](inputs) was run against the live Actors on 2026-09-26 (YouTube build 0.1.11, Instagram build 0.2.7), each one through one of the four runners, and every runner against both Actors. Input keys were checked against both input schemas on the same day, and again on 2026-10-06 against the live builds (YouTube 0.1.14, Instagram 0.2.15), when the prices were re-checked too. See [samples/README.md](samples/README.md) for what's in each sample and how private individuals' details were pseudonymized before committing.
- Not affiliated with YouTube, Google, Instagram or Meta. YouTube is a trademark of Google LLC; Instagram is a trademark of Meta Platforms, Inc.
- Dislike estimates: [Return YouTube Dislike](https://returnyoutubedislike.com).
- Results can include personal data (usernames, comments). Follow GDPR, PIPEDA, CCPA and the platforms' terms when you store or publish them. See [Is web scraping legal?][legal].
- MIT licensed. Made by Yugenox Corporation.

<!-- All apify.com links for this README live below. When the Apify affiliate id exists, append ?fpr=<id> to these URLs only. -->
[store-yt]: https://apify.com/yugenox/youtube-scraper
[store-ig]: https://apify.com/yugenox/instagram-scraper
[api-yt]: https://apify.com/yugenox/youtube-scraper/api
[api-ig]: https://apify.com/yugenox/instagram-scraper/api
[store-shorts]: https://apify.com/yugenox/youtube-shorts-scraper
[store-igc]: https://apify.com/yugenox/instagram-comments-scraper
[badge-yt]: https://apify.com/actor-badge?actor=yugenox/youtube-scraper
[badge-ig]: https://apify.com/actor-badge?actor=yugenox/instagram-scraper
[signup]: https://console.apify.com/sign-up
[legal]: https://blog.apify.com/is-web-scraping-legal/
