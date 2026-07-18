# PLAN — Tích hợp crawl data thật (Facebook + Bright Data) vào pipeline ĐVHC

## MỤC TIÊU

Thay thế mock data bằng data thật từ Facebook, crawled qua Bright Data API. Domain: **tin đồn sáp nhập ĐVHC**. Luồng: Facebook search → Bright Data scrape → clean → filter → pipeline → dashboard.

**Giữ nguyên:** toàn bộ engine, model, pipeline, guardrails, API routes, frontend components.
**Thay đổi:** crawler keywords, thêm clean + filter layer, kết nối crawler → pipeline, thêm API endpoint crawl.

---

## PHÂN TÍCH HIỆN TRẠNG

### Crawler đã có (hoạt động được):

| Component | File | Status |
|---|---|---|
| FB login + search (Playwright) | `backend/legal_radar/crawlers/facebook.py` | _pw_login(), _pw_collect_urls() — OK |
| Bright Data scrape (posts + comments) | `backend/legal_radar/crawlers/facebook.py` | _bd_scrape(), _crawl_one_post() — OK |
| YouTube crawl | `backend/legal_radar/crawlers/youtube.py` | OK nhưng ít giá trị cho domain ĐVHC |
| Scheduler (background) | `backend/legal_radar/crawlers/scheduler.py` | CrawlScheduler class — OK |
| Runner script | `run_facebook_crawler.py` | Hardcoded creds, chạy standalone |
| Credentals | Bright Data key + FB account | Hoạt động, dùng tiếp |

### Vấn đề cần sửa:

| # | Vấn đề | Mức độ | Giải pháp |
|---|---|---|---|
| 1 | **Keywords generic** — "tin giả", "fake news" → crawl mọi thứ, không liên quan ĐVHC | Critical | Thay bằng domain-specific keywords |
| 2 | **Không có relevance filter** — mọi post đều vào pipeline | Critical | Thêm keyword-based filter |
| 3 | **Comment quality很差** — UI elements, random strings, HTML artifacts | High | Thêm content cleaner |
| 4 | **Không kết nối pipeline** — crawled data sits in JSONL, không feed vào engine | Critical | Kết nối crawler → CommentIngestor |
| 5 | **Không có API trigger** — dashboard không trigger crawl | Medium | Thêm POST /api/crawl endpoint |
| 6 | **Creds hardcoded** trong run_facebook_crawler.py | Low | Chuyển sang .env (không block) |

---

## THIẾT KẾ

### Kiến trúc luồng dữ liệu mới:

```
[Dashboard: "Cập nhật dữ liệu mới" button]
    │
    ▼
POST /api/crawl → trigger CrawlScheduler.run_once()
    │
    ▼
Facebook Search (Playwright) — keywords ĐVHC-specific
    │  "sáp nhập tỉnh", "giảm đơn vị hành chính", "34 tỉnh còn 16"...
    ▼
Bright Data scrape — posts + comments song song
    │
    ▼
[Content Cleaner] — remove UI garbage, normalize text
    │
    ▼
[Relevance Filter] — keyword match: chỉ giữ post liên quan ĐVHC
    │
    ▼
[CommentIngestor.process_one()] — LLM extract → engine → FactRef → queue item
    │
    ▼
runs/queue.jsonl → Dashboard hiển thị data thật
```

### C1: Domain-specific keywords cho Facebook search

Thay `FALLBACK_QUERIES` trong `facebook.py`:

```python
FALLBACK_QUERIES = [
    "sáp nhập tỉnh",
    "giảm đơn vị hành chính",
    "34 tỉnh còn 16",
    "sáp nhập đơn vị hành chính cấp tỉnh",
    "gộp tỉnh 2026",
    "giảm số lượng tỉnh",
    "Bộ Nội vụ sáp nhập",
    "tin đồn sáp nhập tỉnh",
    "sắp xếp đơn vị hành chính",
]
```

Cập nhật `scheduler.py` → `CRAWL_KEYWORDS`:

```python
CRAWL_KEYWORDS: list[str] = [
    "sáp nhập tỉnh",
    "giảm đơn vị hành chính",
    "34 tỉnh còn 16",
    "gộp tỉnh",
    "sắp xếp ĐVHC",
    "Bộ Nội vụ bác bỏ",
]
```

### C2: Content Cleaner — `backend/legal_radar/crawlers/cleaner.py` (file mới)

```python
"""Clean raw crawled data before pipeline ingestion."""

# UI garbage patterns từ Facebook comments
_UI_PATTERNS = [
    r"^Find friends$", r"^View Post$", r"^See more$",
    r"^No comments yet$", r"^Be the first to comment\.$",
    r"^Photos from .+?\'s post$", r"^See translation$",
    r"^Interested$", r"^Not interested$",
    r"^Newest$", r"^Most relevant$",
    r"^.+?\'s post$",  # "Đời sống's post"
    r"^https?://\S+$",  # standalone URLs
    r"^[A-Za-z0-9+/=]{20,}$",  # base64/random strings
    r"^[a-z0-9]{30,}$",  # random hash strings
]

# Minimum text length to keep
MIN_TEXT_LENGTH = 10
MIN_COMMENT_LENGTH = 5

def clean_post(raw: dict) -> dict | None:
    """Clean a raw crawled post. Return None if post should be rejected."""
    text = (raw.get("text") or "").strip()
    if len(text) < MIN_TEXT_LENGTH:
        return None
    
    # Clean comments
    clean_comments = []
    for c in raw.get("comments", []):
        comment_text = (c.get("text") or "").strip()
        if len(comment_text) < MIN_COMMENT_LENGTH:
            continue
        if _is_ui_garbage(comment_text):
            continue
        clean_comments.append({
            "text": comment_text,
            "author": c.get("author", "Unknown"),
            "timestamp": c.get("timestamp", ""),
            "likes": c.get("likes", 0),
        })
    
    return {
        "platform": raw.get("platform", "facebook"),
        "content_type": "post",
        "text": text,
        "author": raw.get("author", "Unknown"),
        "url": raw.get("url", ""),
        "timestamp": raw.get("timestamp", ""),
        "engagement": raw.get("engagement", {}),
        "comments": clean_comments,
    }

def _is_ui_garbage(text: str) -> bool:
    """Check if text is Facebook UI garbage."""
    for pattern in _UI_PATTERNS:
        if re.match(pattern, text, re.IGNORECASE):
            return True
    return False
```

### C3: Relevance Filter — `backend/legal_radar/crawlers/filter.py` (file mới)

```python
"""Domain-specific relevance filter for crawled data."""

_DVHC_KEYWORDS = [
    "sáp nhập", "gộp tỉnh", "giảm tỉnh", "hợp nhất",
    "đơn vị hành chính", "DVHC", "cấp tỉnh", "cấp xã",
    "tỉnh mới", "thành phố mới", "nối tỉnh",
    "16 tỉnh", "20 tỉnh", "34 tỉnh", "166 xã", "58 xã",
    "Bộ Nội vụ", "Nghị quyết Quốc hội",
    "sắp xếp", "quy hoạch tỉnh",
]

_MIN_KEYWORD_MATCH = 2  # cần ≥ 2 keywords match

def is_relevant(text: str) -> bool:
    """Check if text is relevant to admin merger domain."""
    text_lower = text.lower()
    matches = sum(1 for kw in _DVHC_KEYWORDS if kw.lower() in text_lower)
    return matches >= _MIN_KEYWORD_MATCH

def filter_posts(posts: list[dict]) -> list[dict]:
    """Filter posts, keep only relevant ones."""
    relevant = []
    for post in posts:
        # Check post text + all comment texts
        all_text = post.get("text", "")
        for c in post.get("comments", []):
            all_text += " " + c.get("text", "")
        
        if is_relevant(all_text):
            relevant.append(post)
    return relevant
```

### C4: Kết nối crawler → pipeline

Sửa `scheduler.py` → sau khi crawl, gọi `CommentIngestor`:

```python
def crawl_and_process(
    keywords=None, max_posts=20, output_path=None,
    kg=None, provider=None, queue_path=None,
) -> list[dict]:
    """Crawl → clean → filter → process through pipeline."""
    # 1. Crawl
    raw_items = crawl_now(keywords=keywords, max_posts=max_posts, output_path=output_path)
    
    # 2. Clean + Filter
    from .cleaner import clean_post
    from .filter import is_relevant
    
    processed = []
    for raw in raw_items:
        cleaned = clean_post(raw)
        if not cleaned:
            continue
        
        # Check relevance on post text + comments
        all_text = cleaned["text"]
        for c in cleaned.get("comments", []):
            all_text += " " + c.get("text", "")
        
        if not is_relevant(all_text):
            continue
        
        # 3. Process each comment through pipeline
        if kg and provider and queue_path:
            from ..pipeline import CommentIngestor
            ingestor = CommentIngestor(provider, kg, queue_path)
            for c in cleaned.get("comments", []):
                if len(c.get("text", "")) >= 10:
                    item = ingestor.process_one({
                        "id": f"crawl-{hash(c['text']) % 100000}",
                        "text": c["text"],
                        "thoi_gian": c.get("timestamp", ""),
                    })
                    processed.append(item)
        
        processed.append(cleaned)
    
    return processed
```

### C5: API endpoint — POST /api/crawl

Thêm route mới trong `backend/legal_radar/api/routes/`:

```python
# backend/legal_radar/api/routes/crawl.py
from fastapi import APIRouter
from ...crawlers.scheduler import crawl_now
from ...crawlers.cleaner import clean_post
from ...crawlers.filter import is_relevant

router = APIRouter(tags=["crawl"])

@router.post("/api/crawl")
def trigger_crawl(max_posts: int = 10) -> dict:
    """Trigger a crawl cycle and return results."""
    raw_items = crawl_now(max_posts_per_platform=max_posts)
    
    cleaned = []
    for raw in raw_items:
        c = clean_post(raw)
        if c and is_relevant(c.get("text", "") + " " + 
                             " ".join(cc.get("text", "") for cc in c.get("comments", []))):
            cleaned.append(c)
    
    return {
        "crawled": len(raw_items),
        "relevant": len(cleaned),
        "items": cleaned[:20],
    }
```

Cập nhật `main.py` để include router mới.

### C6: Dashboard integration

Thêm nút "Cập nhật dữ liệu mới" trong frontend → gọi POST /api/crawl → refresh queue.

---

## FILES THAY ĐỔI

| # | File | Thay đổi | Loại |
|---|---|---|---|
| 1 | `backend/legal_radar/crawlers/facebook.py` | Thay FALLBACK_QUERIES bằng keywords ĐVHC | Sửa |
| 2 | `backend/legal_radar/crawlers/scheduler.py` | Thay CRAWL_KEYWORDS + thêm crawl_and_process() | Sửa |
| 3 | `backend/legal_radar/crawlers/cleaner.py` | **MỚI** — content cleaner | Tạo mới |
| 4 | `backend/legal_radar/crawlers/filter.py` | **MỚI** — relevance filter | Tạo mới |
| 5 | `backend/legal_radar/crawlers/__init__.py` | Export cleaner + filter | Sửa |
| 6 | `backend/legal_radar/api/routes/crawl.py` | **MỚI** — POST /api/crawl endpoint | Tạo mới |
| 7 | `backend/legal_radar/api/main.py` | Include crawl router | Sửa |
| 8 | `run_facebook_crawler.py` | Cập nhật keywords ĐVHC | Sửa |

---

## THỰC HIỆN THEO THỨ TỰ

| Bước | Task | Files | Depends on |
|---|---|---| ---|
| 1 | Tạo `cleaner.py` — content cleaner | `backend/legal_radar/crawlers/cleaner.py` | — |
| 2 | Tạo `filter.py` — relevance filter | `backend/legal_radar/crawlers/filter.py` | — |
| 3 | Cập nhật `facebook.py` — keywords ĐVHC | `backend/legal_radar/crawlers/facebook.py` | — |
| 4 | Cập nhật `scheduler.py` — keywords + crawl_and_process() | `backend/legal_radar/crawlers/scheduler.py` | Bước 1, 2 |
| 5 | Tạo `crawl.py` route + cập nhật `main.py` | `backend/legal_radar/api/routes/crawl.py`, `main.py` | Bước 4 |
| 6 | Cập nhật `run_facebook_crawler.py` | `run_facebook_crawler.py` | Bước 3 |
| 7 | Test crawl thật — chạy 1 cycle, verify data quality | Manual | Bước 6 |
| 8 | Verify crawled data feed vào pipeline → queue.jsonl | Manual + API | Bước 7 |

---

## RISK

| Risk | Mitigation |
|---|---|
| Keywords ĐVHC quá hẹp → ít kết quả | Thử nhiều biến thể query, fallback sang keywords broader ("tin đồn", "sáp nhập") |
| Bright Data hết quota / API fail | Retry 2x, graceful degradation → trả về rỗng, không crash |
| Playwright login fail (FB checkpoint) | Captcha detection + log warning, fallback crawl-only (không login) |
| Relevance filter quá strict → miss data | Test với crawled data hiện tại, điều chỉnh _MIN_KEYWORD_MATCH |
| Comment quality vẫn tệ sau clean | Thêm patterns vào _UI_PATTERNS dựa trên data thật |
| Credentials bị lộ | Chuyển sang .env (không block nhưng nên làm) |

---

## VALIDATION

| Gate | Criteria |
|---|---|
| G1 | `cleaner.py` loại bỏ ≥ 80% UI garbage từ crawled_raw.jsonl hiện tại |
| G2 | `filter.py` giữ lại ≥ 1 post liên quan ĐVHC từ crawled data (nếu có) |
| G3 | `POST /api/crawl` trả về 200 + JSON có "crawled" và "relevant" fields |
| G4 | Crawl thật: ≥ 1 post liên quan ĐVHC được crawl + clean + hiển thị trên dashboard |
| G5 | Crawled comment chạy qua pipeline → QueueItem trong queue.jsonl |

---

## OPEN ITEMS

- [ ] **Bright Data quota**: Kiểm tra remaining quota trước khi crawl batch lớn
- [ ] **FB login stability**: Playwright login có thể bị FB checkpoint → cần test trước
- [ ] **Relevance threshold**: _MIN_KEYWORD_MATCH = 2 có thể quá strict/lỏng → calibrate qua data thật
