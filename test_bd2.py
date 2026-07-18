import requests, json

API_KEY = "6a624d3b-dccb-491d-965a-ef326bd2a76e"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

url = "https://api.brightdata.com/datasets/v3/scrape"
params = {"dataset_id": "gd_lyclm1571iy3mv57zw", "include_errors": "true", "format": "json"}
payload = {"input": [{"url": "https://www.facebook.com/1321675329997244"}]}

resp = requests.post(url, params=params, headers=headers, json=payload, timeout=90)
print(f"Status: {resp.status_code}")

data = resp.json()
print(f"Type: {type(data)}, Items: {len(data) if isinstance(data, list) else 'N/A'}")
if isinstance(data, list) and data:
    print(json.dumps(data[0], indent=2, ensure_ascii=False)[:3000])
elif isinstance(data, dict):
    print(json.dumps(data, indent=2, ensure_ascii=False)[:3000])
