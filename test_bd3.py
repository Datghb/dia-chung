import requests, json, time

API_KEY = "6a624d3b-dccb-491d-965a-ef326bd2a76e"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Test Facebook Comments API
print("=== Facebook Comments API ===")
url = "https://api.brightdata.com/datasets/v3/scrape"
params = {"dataset_id": "gd_lkay758p1eanlolqw8", "include_errors": "true", "format": "json"}
payload = {"input": [{"url": "https://www.facebook.com/1321675329997244"}]}

resp = requests.post(url, params=params, headers=headers, json=payload, timeout=90)
print(f"Status: {resp.status_code}")

if resp.status_code == 200:
    data = resp.json()
    if isinstance(data, list):
        print(f"Comments: {len(data)}")
        for c in data[:3]:
            print(f"  [{c.get('user_name', '?')}] {str(c.get('comment_text', ''))[:100]}")
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False)[:1000])
elif resp.status_code == 202:
    data = resp.json()
    sid = data.get("snapshot_id")
    print(f"Async snapshot: {sid}")
    for i in range(30):
        time.sleep(5)
        r = requests.get(f"https://api.brightdata.com/datasets/v3/snapshot/{sid}", headers=headers, timeout=30)
        if r.status_code == 200:
            result = r.json()
            if isinstance(result, list):
                print(f"Comments: {len(result)}")
                for c in result[:3]:
                    print(f"  [{c.get('user_name', '?')}] {str(c.get('comment_text', ''))[:100]}")
            break
        print(f"  Poll {i+1}: {r.status_code}")
else:
    print(resp.text[:500])
