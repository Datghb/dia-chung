"""Facebook + Bright Data — Discover API mode (no Playwright).

Requires BRIGHTDATA_API_KEY in environment or .env file.
"""
import logging, sys, os
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
sys.path.insert(0, str(Path(__file__).resolve().parent))

env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

if not os.environ.get("BRIGHTDATA_API_KEY"):
    print("ERROR: BRIGHTDATA_API_KEY not set. Create .env file or set environment variable.")
    sys.exit(1)

from backend.legal_radar.crawlers.facebook import crawl_facebook
results = crawl_facebook(max_posts=20, output_path="runs/crawled_raw.jsonl")
print(f"\nDone: {len(results)} posts")
for i, p in enumerate(results, 1):
    print(f"[{i}] {p['author']} - {len(p['comments'])} comments")
