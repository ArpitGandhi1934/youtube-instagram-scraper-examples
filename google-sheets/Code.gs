/**
 * YouTube and Instagram data in Google Sheets, via the yugenox Apify Actors.
 *
 * Setup: Extensions > Apps Script, paste this file, save, reload the sheet.
 * A menu "YouTube / Instagram data" appears. Run "Set Apify token" once.
 * Each other menu item asks for one value, runs the Actor and writes the results to a new tab.
 */

const SETTINGS = {
  maxItems: 20, // rows per run; also caps what one click can cost
  maxTotalChargeUsd: 1, // hard cost cap per run, enforced by Apify
};

const ACTORS = {
  youtube: 'yugenox~youtube-scraper', // $2.00 per 1,000 videos
  instagram: 'yugenox~instagram-scraper', // $1.90 per 1,000 rows
};

// Columns written to the sheet: [header, function that reads it from one result row]
const YOUTUBE_COLUMNS = [
  ['Title', (v) => v.title],
  ['URL', (v) => v.url],
  ['Channel', (v) => v.channelName],
  ['Published', (v) => v.publishedAt || v.date],
  ['Views', (v) => v.viewCount],
  ['Likes', (v) => v.likes],
  ['Dislikes (estimate, Return YouTube Dislike)', (v) => v.dislikes],
  ['Comments pulled', (v) => (v.comments ? v.comments.length : '')],
  ['Top comment', (v) => (v.comments && v.comments[0] ? v.comments[0].text : '')],
  ['Subscribers', (v) => v.numberOfSubscribers],
];

const INSTAGRAM_COLUMNS = [
  ['URL', (p) => p.url],
  ['Posted', (p) => p.createdAt],
  ['Type', (p) => p.productType || p.mediaType],
  ['Likes', (p) => p.likeCount],
  ['Comments', (p) => p.commentCount],
  ['Plays', (p) => (p.video ? p.video.playCount : '')],
  ['Engagement rate (%)', (p) => p.engagementRate],
  ['Caption', (p) => p.caption],
  ['Owner', (p) => (p.owner ? p.owner.username : '')],
  ['Followers', (p) => (p.owner ? p.owner.followerCount : '')],
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('YouTube / Instagram data')
    .addItem('YouTube: search videos', 'youtubeSearch')
    .addItem('YouTube: channel videos', 'youtubeChannel')
    .addItem('Instagram: profile posts', 'instagramProfile')
    .addSeparator()
    .addItem('Set Apify token', 'setApifyToken')
    .addToUi();
}

function setApifyToken() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('Apify API token', 'Apify Console > Settings > API & Integrations', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  // Stored per user, never in the sheet itself.
  PropertiesService.getUserProperties().setProperty('APIFY_TOKEN', res.getResponseText().trim());
  ui.alert('Saved.');
}

function youtubeSearch() {
  const q = ask_('YouTube search', 'Search term, e.g. "home espresso"');
  if (!q) return;
  const rows = runActor_(ACTORS.youtube, { searchTerms: [q], maxItems: SETTINGS.maxItems, includeDislikes: true, maxComments: 3 });
  writeTab_(`YouTube: ${q}`, YOUTUBE_COLUMNS, rows.filter((r) => !r.error));
}

function youtubeChannel() {
  const c = ask_('YouTube channel', 'Channel name, @handle or channel URL');
  if (!c) return;
  const rows = runActor_(ACTORS.youtube, { channels: [c], maxItems: SETTINGS.maxItems, includeDislikes: true });
  writeTab_(`YouTube: ${c}`, YOUTUBE_COLUMNS, rows.filter((r) => !r.error));
}

function instagramProfile() {
  const h = ask_('Instagram profile', 'Handle or profile URL of a public account, e.g. nasa');
  if (!h) return;
  const url = /^https?:/.test(h) ? h : `https://www.instagram.com/${h.replace(/^@/, '')}/`;
  const rows = runActor_(ACTORS.instagram, { startUrls: [url], maxItems: SETTINGS.maxItems });
  writeTab_(`Instagram: ${h}`, INSTAGRAM_COLUMNS, rows.filter((r) => r.dataType === 'post'));
}

// Starts a run, waits for it (polling, so no single request runs long) and returns its rows.
function runActor_(actor, input) {
  const token = PropertiesService.getUserProperties().getProperty('APIFY_TOKEN');
  if (!token) throw new Error('Set your Apify token first (menu: Set Apify token).');
  const base = 'https://api.apify.com/v2';
  let run = api_('post', `${base}/acts/${actor}/runs?waitForFinish=30&maxTotalChargeUsd=${SETTINGS.maxTotalChargeUsd}`, token, input).data;
  const deadline = Date.now() + 5 * 60 * 1000; // Apps Script stops a script after 6 minutes
  while (['READY', 'RUNNING'].indexOf(run.status) !== -1) {
    if (Date.now() > deadline) throw new Error(`Run ${run.id} is still running. Open it in Apify Console, or lower maxItems.`);
    run = api_('get', `${base}/actor-runs/${run.id}?waitForFinish=30`, token).data;
  }
  if (run.status !== 'SUCCEEDED') throw new Error(`Run ${run.id} ended with status ${run.status}`);
  return api_('get', `${base}/datasets/${run.defaultDatasetId}/items?clean=true`, token);
}

function api_(method, url, token, body) {
  const res = UrlFetchApp.fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    contentType: 'application/json',
    payload: body ? JSON.stringify(body) : undefined,
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code >= 300) throw new Error(`Apify API ${code}: ${res.getContentText().slice(0, 300)}`);
  return JSON.parse(res.getContentText());
}

function ask_(title, prompt) {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(title, prompt, ui.ButtonSet.OK_CANCEL);
  return res.getSelectedButton() === ui.Button.OK ? res.getResponseText().trim() : '';
}

function writeTab_(name, columns, rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const title = name.slice(0, 90);
  const sheet = ss.getSheetByName(title) || ss.insertSheet(title);
  sheet.clear();
  const values = [columns.map((c) => c[0])].concat(
    rows.map((r) => columns.map((c) => {
      const v = c[1](r);
      return v === undefined || v === null ? '' : v;
    })),
  );
  sheet.getRange(1, 1, values.length, columns.length).setValues(values);
  sheet.setFrozenRows(1);
  ss.toast(`${rows.length} rows written to "${title}"`);
}
