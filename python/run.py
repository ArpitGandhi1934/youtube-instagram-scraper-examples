#!/usr/bin/env python3
"""Run the YouTube or Instagram scraper on Apify with a JSON input file and save the results.

    python python/run.py youtube inputs/youtube/search.json
    python python/run.py instagram inputs/instagram/profile.json out/nasa.json

Prints the results to stdout when no output path is given.
Needs Python 3.10+, `pip install -r python/requirements.txt` and APIFY_TOKEN (env or .env).
"""

from __future__ import annotations

import json
import os
import sys
from decimal import Decimal
from pathlib import Path

from apify_client import ApifyClient

ACTORS = {
    "youtube": "yugenox/youtube-scraper",  # $2.00 per 1,000 videos; comments + dislikes inside the row
    "instagram": "yugenox/instagram-scraper",  # $1.90 per 1,000 rows; transcripts $0.004 per minute
}


def load_dotenv(path: Path = Path(".env")) -> None:
    """Minimal .env reader (run from the repo root) so there is no extra dependency."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _field(run, camel: str, snake: str):
    """apify-client v1/v2 return dicts, v3 returns a model object. Support both."""
    return run[camel] if isinstance(run, dict) else getattr(run, snake)


def main() -> None:
    if len(sys.argv) < 3 or sys.argv[1] not in ACTORS:
        sys.exit("usage: python python/run.py <youtube|instagram> <input.json> [output.json]")
    which, input_path = sys.argv[1], sys.argv[2]
    out_path = sys.argv[3] if len(sys.argv) > 3 else None

    load_dotenv()
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("Set APIFY_TOKEN (see .env.example)")

    run_input = json.loads(Path(input_path).read_text())
    client = ApifyClient(token)

    # call() starts the run, streams its log and waits for it to finish.
    # max_total_charge_usd is a hard cost cap for pay-per-event Actors like these two.
    run = client.actor(ACTORS[which]).call(run_input=run_input, max_total_charge_usd=Decimal("1"))
    if run is None:
        sys.exit("The run did not finish")
    print(f"Run {_field(run, 'id', 'id')}: {_field(run, 'status', 'status')}", file=sys.stderr)

    items = list(client.dataset(_field(run, "defaultDatasetId", "default_dataset_id")).iterate_items())
    print(f"{len(items)} items", file=sys.stderr)

    text = json.dumps(items, indent=2, ensure_ascii=False)
    if out_path:
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)
        Path(out_path).write_text(text + "\n", encoding="utf-8")
        print(f"Saved to {out_path}", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    main()
