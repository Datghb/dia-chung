import requests, json

API_KEY = "6a624d3b-dccb-491d-965a-ef326bd2a76e"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

url = "https://api.brightdata.com/datasets/v3/scrape"
params = {"dataset_id": "gd_lkay758p1eanlolqw8", "include_errors": "true", "format": "json"}
payload = {"input": [{"url": "https://www.facebook.com/1321675329997244"}]}

resp = requests.post(url, params=params, headers=headers, json=payload, timeout=90)
data = resp.json()
print(json.dumps(data, indent=2, ensure_ascii=False)[:5000])
