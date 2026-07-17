"""Facebook crawler — 20 posts, 3 min apart."""
import logging, sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s",
                    handlers=[logging.StreamHandler(sys.stdout)])
sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

from legal_radar.crawlers.facebook import crawl_facebook, SEARCH_PHRASE

FB_USER = "22010408@st.phenikaa-uni.edu.vn"
FB_PASS = "Phucuhungyen2004*"

MAX_POSTS = 20
MAX_COMMENTS = 50
DELAY = 180

print("=" * 60)
print("Facebook Crawler")
print(f"Search: {SEARCH_PHRASE}")
print(f"Target: {MAX_POSTS} posts, {MAX_COMMENTS} comments each")
print(f"Delay: {DELAY}s between posts")
print(f"Est: ~{MAX_POSTS * (DELAY + 30) // 60} min")
print("=" * 60)

results = crawl_facebook(
    max_posts=MAX_POSTS, max_comments_per_post=MAX_COMMENTS,
    delay_between_posts=DELAY, fb_username=FB_USER, fb_password=FB_PASS,
    output_path="runs/crawled_raw.jsonl",
)

print(f"\n{'='*60}")
print(f"DONE: {len(results)} posts")
print("=" * 60)
for i, p in enumerate(results, 1):
    nc = len(p["comments"])
    print(f"[{i}] {p['author']} — {nc} comments")
    print(f"    {p['text'][:100]}...")
