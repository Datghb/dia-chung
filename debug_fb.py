import sys, time
sys.path.insert(0, 'backend')
from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=False)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768},
        locale="vi-VN",
    )
    page = context.new_page()
    
    # Login
    page.goto('https://www.facebook.com/login', wait_until='domcontentloaded', timeout=30000)
    time.sleep(3)
    page.query_selector('input[name="email"]').fill("22010408@st.phenikaa-uni.edu.vn")
    page.query_selector('input[name="pass"]').fill("Phucuhungyen2004*")
    for btn in page.query_selector_all('div[role="button"]'):
        if "đăng nhập" in btn.inner_text().strip().lower():
            btn.click()
            break
    time.sleep(8)
    
    # Search
    from urllib.parse import quote_plus
    page.goto(f'https://www.facebook.com/search/posts/?q={quote_plus("tin giả")}', wait_until='domcontentloaded', timeout=30000)
    time.sleep(5)
    
    for _ in range(3):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
    
    # Dump ALL hrefs
    print("=== ALL hrefs on page ===")
    all_links = page.query_selector_all('a[href]')
    seen = set()
    for link in all_links:
        href = link.get_attribute("href") or ""
        if href and href not in seen and "facebook" in href:
            seen.add(href)
            text = link.inner_text().strip()[:60]
            print(f"  href={href[:150]}  text={text}")
    
    browser.close()
