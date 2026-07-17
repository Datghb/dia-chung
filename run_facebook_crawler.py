"""Facebook + Bright Data hybrid crawler — 20 posts, 3 min apart."""
import logging, sys, os
from pathlib import Path
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))
os.environ["BRIGHTDATA_API_KEY"] = "6a624d3b-dccb-491d-965a-ef326bd2a76e"
from legal_radar.crawlers.facebook import crawl_facebook, SEARCH_PHRASE
print("=" * 60)
print("Facebook + Bright Data Hybrid Crawler")
print(f"Search: {SEARCH_PHRASE}")
print("Target: 20 posts, 50 comments each, 3 min apart")
print("=" * 60)
results = crawl_facebook(
    max_posts=20, max_comments_per_post=50, delay_between_posts=180,
    fb_username="22010408@st.phenikaa-uni.edu.vn",
    fb_password="Phucuhungyen2004*",
    output_path="runs/crawled_raw.jsonl",
)
print(f"\n{'='*60}")
print(f"DONE: {len(results)} posts")
print("=" * 60)
for i, p in enumerate(results, 1):
    nc = len(p["comments"])
    print(f"[{i}] {p['author']} — {nc} comments — {p['text'][:80]}...")
