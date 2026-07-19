"""Import the existing queue into SQL without modifying the JSONL rollback source."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from backend.legal_radar.storage import SqlStore


def main() -> int:
    """Migrate queue items from JSONL to SQL storage."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL", ""))
    parser.add_argument("--queue", type=Path, default=Path("runs/queue.jsonl"))
    args = parser.parse_args()
    if not args.database_url:
        parser.error("DATABASE_URL or --database-url is required")

    store = SqlStore(args.database_url)
    store.initialize()
    before = len(store.list_cases())
    imported = store.import_jsonl(args.queue)
    after = len(store.list_cases())
    print(f"Imported {imported} rows; SQL cases: {before} -> {after}")
    print("JSONL source was preserved for rollback.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
