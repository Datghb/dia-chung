import logging, sys, os
from pathlib import Path
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
sys.path.insert(0, str(Path('.').resolve() / 'backend'))
os.environ["BRIGHTDATA_API_KEY"] = "6a624d3b-dccb-491d-965a-ef326bd2a76e"
from legal_radar.crawlers.facebook import crawl_facebook
results = crawl_facebook(max_posts=1, delay_between_posts=5, fb_username="22010408@st.phenikaa-uni.edu.vn", fb_password="Phucuhungyen2004*", output_path="runs/crawled_raw.jsonl")
if results:
    p = results[0]
    print("Author:", p["author"])
    print("Text:", p["text"][:200])
    print("Comments:", len(p["comments"]))
    for c in p["comments"][:5]:
        print("  -", c["author"], ":", c["text"][:80])
else:
    print("No results")
