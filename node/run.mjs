#!/usr/bin/env node
// Run the YouTube or Instagram scraper on Apify with a JSON input file and save the results.
//
//   node --env-file=.env node/run.mjs youtube inputs/youtube/search.json
//   node --env-file=.env node/run.mjs instagram inputs/instagram/profile.json out/nasa.json
//
// Prints the results to stdout when no output path is given. Needs Node 20.6+ and APIFY_TOKEN.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ApifyClient } from 'apify-client';

const ACTORS = {
    youtube: 'yugenox/youtube-scraper', // $2.00 per 1,000 videos; comments + dislikes inside the row
    instagram: 'yugenox/instagram-scraper', // $1.90 per 1,000 rows; transcripts $0.004 per minute
};

const [which, inputPath, outPath] = process.argv.slice(2);
if (!ACTORS[which] || !inputPath) {
    console.error('usage: node node/run.mjs <youtube|instagram> <input.json> [output.json]');
    process.exit(1);
}
if (!process.env.APIFY_TOKEN) {
    console.error('Set APIFY_TOKEN (see .env.example)');
    process.exit(1);
}

const input = JSON.parse(readFileSync(inputPath, 'utf8'));
const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

// call() starts the run, streams its log to stderr and waits for it to finish.
// maxTotalChargeUsd is a hard cost cap for pay-per-event Actors like these two.
const run = await client.actor(ACTORS[which]).call(input, { maxTotalChargeUsd: 1 });
console.error(`Run ${run.id}: ${run.status}`);

const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.error(`${items.length} items`);

const json = JSON.stringify(items, null, 2);
if (outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${json}\n`);
    console.error(`Saved to ${outPath}`);
} else {
    console.log(json);
}
