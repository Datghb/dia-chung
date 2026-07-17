"""Minimal evaluation gate; populate cases.json as the engine is implemented."""

import json
from pathlib import Path


def main() -> int:
    cases = json.loads(Path(__file__).with_name("cases.json").read_text(encoding="utf-8"))
    print(f"Loaded {len(cases)} evaluation cases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

