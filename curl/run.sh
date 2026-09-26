#!/usr/bin/env bash
# Run the YouTube or Instagram scraper with one HTTP call and get the results back as JSON.
#
#   ./curl/run.sh youtube inputs/youtube/video-urls.json
#   ./curl/run.sh instagram inputs/instagram/hashtag.json out/hashtag.json
#
# Uses Apify's run-sync-get-dataset-items endpoint: it starts the run, waits for it (up to
# 5 minutes) and returns the dataset. For bigger jobs start a run and read the dataset later
# (see the Node or Python runner). Needs APIFY_TOKEN in the environment or in .env.
set -euo pipefail

case "${1:-}" in
  youtube) ACTOR="yugenox~youtube-scraper" ;;
  instagram) ACTOR="yugenox~instagram-scraper" ;;
  *) echo "usage: ./curl/run.sh <youtube|instagram> <input.json> [output.json]" >&2; exit 1 ;;
esac
INPUT="${2:?input.json required}"
OUT="${3:-/dev/stdout}"

if [ -z "${APIFY_TOKEN:-}" ] && [ -f .env ]; then set -a; . ./.env; set +a; fi
: "${APIFY_TOKEN:?Set APIFY_TOKEN (see .env.example)}"

[ "$OUT" != /dev/stdout ] && mkdir -p "$(dirname "$OUT")"

curl -sS --fail-with-body -X POST \
  "https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?format=json&clean=true" \
  -H "Authorization: Bearer ${APIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  --data @"${INPUT}" \
  -o "${OUT}"
