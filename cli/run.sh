#!/usr/bin/env bash
# Run the YouTube or Instagram scraper with the Apify CLI.
#
#   npm install -g apify-cli && apify login      # once
#   ./cli/run.sh youtube inputs/youtube/playlist.json
#   ./cli/run.sh instagram inputs/instagram/keyword.json out/keyword.json
#
# `apify call` runs the Actor in the cloud under your account, waits for it and, with
# --output-dataset, prints the results as JSON. stdin is closed so the CLI never waits on an
# interactive prompt (e.g. an update notice) when run from scripts.
set -euo pipefail

case "${1:-}" in
  youtube) ACTOR="yugenox/youtube-scraper" ;;
  instagram) ACTOR="yugenox/instagram-scraper" ;;
  *) echo "usage: ./cli/run.sh <youtube|instagram> <input.json> [output.json]" >&2; exit 1 ;;
esac
INPUT="${2:?input.json required}"
OUT="${3:-/dev/stdout}"
[ "$OUT" != /dev/stdout ] && mkdir -p "$(dirname "$OUT")"

apify call "$ACTOR" --input-file "$INPUT" --output-dataset --silent < /dev/null > "$OUT"
