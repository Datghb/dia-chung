"""Facebook + Bright Data — fast mode."""
import logging, sys, os
from pathlib import Path
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))
os.environ["BRIGHTDATA_API_KEY"] = "6a624d3b-dccb-491d-965a-ef326bd2a76e"
from legal_radar.crawlers.facebook import crawl_facebook
results = crawl_facebook(
    max_posts=20, max_comments_per_post=50, delay_between_posts=0,
    fb_username="22010408@st.phenikaa-uni.edu.vn",
    fb_password="Phucuhungyen2004*",
    output_path="runs/crawled_raw.jsonl",
)
print(f"\nDone: {len(results)} posts")
for i, p in enumerate(results, 1):
    print(f"[{i}] {p['author']} - {len(p['comments'])} comments")
