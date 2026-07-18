import requests, json, time

API_KEY = "6a624d3b-dccb-491d-965a-ef326bd2a76e"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Test Web Unlocker to search Google for Facebook posts
print("=== Web Unlocker: Google search ===")
resp = requests.post(
    "https://api.brightdata.com/datasets/v3/scrape",
    params={"dataset_id": "gd_lkay758p1eanlolqw8", "include_errors": "true", "format": "json"},
    headers=headers,
    json={"input": [{"url": "https://www.facebook.com/share/p/17yf2ZfpHp/"}]},
    timeout=90,
)
print(f"Comments Status: {resp.status_code}")
data = resp.json()
print(json.dumps(data, indent=2, ensure_ascii=False)[:2000])
