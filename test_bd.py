import logging, sys
from pathlib import Path
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
sys.path.insert(0, str(Path('.').resolve() / 'backend'))

import os
os.environ["BRIGHTDATA_API_KEY"] = "6a624d3b-dccb-491d-965a-ef326bd2a76e"

from legal_radar.crawlers.facebook import crawl_facebook

results = crawl_facebook(max_posts=5, output_path="runs/crawled_raw.jsonl")
print(f"Results: {len(results)}")
for r in results:
    print(f"  {r['author']}: {r['text'][:80]}... ({len(r['comments'])} comments)")
