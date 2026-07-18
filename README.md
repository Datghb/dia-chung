![CI](https://github.com/Datghb/Parasitic-/actions/workflows/ci.yml/badge.svg)

# Địa chứng

Hệ thống giám sát tin đồn sáp nhập đơn vị hành chính (ĐVHC) trên mạng xã hội. Sử dụng RAG + Knowledge Graph để phân loại phát ngôn thành **đúng** / **hiểu lầm** / **cần kiểm chứng**, phục vụ cán bộ nhà nước ra quyết định xử phạt.

## Kiến trúc tổng thể

```mermaid
graph TB
    subgraph "Sources"
        FB[Facebook]
        YT[YouTube]
    end

    subgraph "P3 — Crawler"
        DISCOVER[Discover API<br/>keyword → URLs]
        SCRAPE[BD Scraper API<br/>URL → post + comments]
        CLEAN[cleaner.py<br/>remove UI garbage]
        FILTER[filter.py<br/>DVHC relevance ≥2 keywords]
    end

    subgraph "P4 — Pipeline"
        INGEST[CommentIngestor]
        LLM[LLM Extract<br/>claim + keywords + subject]
        ENGINE[Engine: phan_loai_claim]
        SOURCE[Source Verification<br/>Google Search + Tier classify]
        GUARD[Guardrails<br/>PII, injection, label enum]
    end

    subgraph "P1 — Engine"
        MODEL[model.py<br/>FactRef, DieuKhoan, HanhVi]
        KG[Knowledge Graph<br/>kg_nodes + kg_edges]
        MATCH[match_fact_ref<br/>BM25 matching]
    end

    subgraph "P2 — Data"
        FACTS[fact_references.json<br/>4 ground truth ĐVHC]
        FIXTURES[comments_batch_*.json<br/>45 fixture comments]
        CASES[study_cases.json<br/>real penalty cases]
    end

    subgraph "Data Stores"
        CRAWLED[runs/crawled_raw.jsonl]
        QUEUE[runs/queue.jsonl]
    end

    subgraph "P5 — Frontend"
        DASHBOARD[Dashboard<br/>Next.js]
        CASEVIEW[Hồ sơ đối tượng]
        VERIFY[Tầng kiểm chứng]
    end

    FB --> DISCOVER
    YT --> DISCOVER
    DISCOVER --> SCRAPE
    SCRAPE --> CLEAN
    CLEAN --> FILTER
    FILTER --> CRAWLED
    CRAWLED --> INGEST

    INGEST --> LLM
    LLM --> ENGINE
    ENGINE --> SOURCE
    SOURCE --> GUARD
    GUARD --> QUEUE

    MODEL --> ENGINE
    KG --> ENGINE
    MATCH --> ENGINE
    FACTS --> MATCH

    QUEUE --> DASHBOARD
    QUEUE --> CASEVIEW
    QUEUE --> VERIFY

    DASHBOARD -->|POST /api/crawl| DISCOVER
```

## Pipeline E2E

```mermaid
flowchart TD
    A[Comment MXH] --> B[LLM Extract]
    B --> C{claim + keywords + subject}

    C --> D[match_hanh_vi<br/>keyword/BM25 trên KG]
    D --> E[phan_loai_claim<br/>rule-based classification]

    E --> F{Nhãn}
    F -->|đúng khung + đúng chủ thể| G[dung]
    F -->|gán nhầm tổ chức↔cá nhân| H[hieu_lam]
    F -->|dùng khung NĐ15 sau 01/7/2026| H
    F -->|thiếu dữ kiện / không match| I[can_kiem_chung]

    C --> J[dynamic_search_gemini<br/>Google Search grounding]
    J --> K[classify_tier<br/>.gov.vn=Tier0, TTXVN=Tier1]
    K --> L[apply_fusion_rules]

    L --> M{Nguồn tin}
    M -->|≥1 Tier0 confirm| N[co_nguon_xac_nhan]
    M -->|Tier0 deny sau ngày claim| O[co_bac_bo_chinh_thuc]
    M -->|không match| P[chua_tim_thay_nguon]

    G --> Q[tich_hop_nguon]
    H --> Q
    I --> Q
    N --> Q
    O --> Q
    P --> Q

    Q --> R[Guardrails<br/>label enum, PII, injection]
    R --> S[QueueItem]
    S --> T[runs/queue.jsonl]
    T --> U[Dashboard]
```

## Luồng dữ liệu chi tiết

```mermaid
sequenceDiagram
    participant U as Dashboard
    participant API as FastAPI
    participant C as Crawler (P3)
    participant P as Pipeline (P4)
    participant E as Engine (P1)
    participant L as LLM Provider
    participant S as Source Search

    U->>API: POST /api/crawl
    API->>C: crawl_and_process()

    C->>C: _discover_urls(queries)
    Note over C: Discover API: keyword → FB URLs

    C->>C: _crawl_one_post(url)
    Note over C: BD Scraper: post + comments parallel

    C->>C: clean_post() → remove UI garbage
    C->>C: is_relevant() → ≥2 DVHC keywords

    C-->>API: {crawled, relevant, items}

    loop mỗi comment trong items
        API->>P: process_one(comment)
        P->>L: extract_claim(text)
        L-->>P: {claim, keywords, subject}

        P->>E: phan_loai_claim(claim, subject, kg)
        E->>E: match_hanh_vi() trên KG
        E->>E: match_fact_ref() so sánh ground truth
        E-->>P: nhãn + lý_do + citations

        P->>S: dynamic_search_gemini(keywords)
        S-->>P: search results

        P->>P: xac_thuc_nguon() → tier classify
        P->>P: tich_hop_nguon() → merge label
        P->>P: guardrails → validate

        P-->>API: QueueItem
        API->>API: append to queue.jsonl
    end

    API-->>U: {crawled, relevant, items}
    U->>API: GET /api/queue
    API-->>U: queue items
```

## Team ownership

```mermaid
graph LR
    subgraph "P1 — Engine Architect"
        P1A[model.py]
        P1B[engine.py]
        P1C[guardrails.py]
        P1D[data/kg/]
    end

    subgraph "P2 — Data Specialist"
        P2A[fact_references.json]
        P2B[facts_corpus.json]
        P2C[study_cases.json]
        P2D[comments_batch_*.json]
    end

    subgraph "P3 — Crawl Engineer"
        P3A[facebook.py]
        P3B[cleaner.py]
        P3C[filter.py]
        P3D[scheduler.py]
    end

    subgraph "P4 — API + Pipeline"
        P4A[pipeline.py]
        P4B[providers.py]
        P4C[api/routes/]
        P4D[source_search.py]
    end

    subgraph "P5 — Frontend + Ops"
        P5A[frontend/app/]
        P5B[deploy/]
        P5C[pitch deck]
    end

    P2A -->|ground truth| P1B
    P3D -->|crawl_and_process| P4A
    P1B -->|phan_loai_claim| P4A
    P4C -->|API| P5A
```

## Stack

| Layer | Tech | Mô tả |
|---|---|---|
| Frontend | Next.js, TypeScript | Dashboard giám sát, hồ sơ đối tượng, tầng kiểm chứng |
| Backend API | FastAPI, Python 3.11+ | REST API: queue, cases, verify, crawl, qa |
| Engine | Python (pure functions) | Rule-based classification + FactRef matching + BM25 |
| Pipeline | Python | LLM extract → engine → source verification → queue |
| Crawler | Bright Data Discover + Scraper API | Keyword search → FB post URLs → scrape content + comments |
| Data | JSON (KG, facts, fixtures) | Knowledge Graph NĐ 174, ground truth, study cases |

## Cấu trúc thư mục

```
backend/legal_radar/
├── model.py              # Data model: VanBan, DieuKhoan, HanhVi, QueueItem, FactRef
├── engine.py             # Classification engine: phan_loai_claim(), match_fact_ref()
├── pipeline.py           # CommentIngestor: LLM extract → engine → queue
├── providers.py          # LLM providers: Gemini, Groq, OpenRouter
├── source_search.py      # Dynamic source search (Gemini + Google Search grounding)
├── source_classifier.py  # Tier classification: .gov.vn, TTXVN, báo lớn
├── guardrails.py         # Label enum, PII scan, injection defense
├── vn_normalize.py       # Vietnamese text normalization
├── api/                  # FastAPI routes
│   ├── main.py           # App entry + CORS
│   ├── routes/queue.py   # GET /api/queue
│   ├── routes/cases.py   # GET /api/cases/{id}
│   ├── routes/verify.py  # GET /api/verify
│   └── routes/qa.py      # POST /api/qa
└── crawlers/             # Social media crawlers (P3)
    ├── facebook.py       # Bright Data Discover + Scraper API
    ├── cleaner.py        # Content cleaner: remove UI garbage
    ├── filter.py         # DVHC relevance filter (≥2 keyword match)
    ├── scheduler.py      # crawl_and_process(): crawl → clean → filter
    └── youtube.py        # YouTube Data API v3

data/
├── kg/                   # Knowledge Graph (frozen)
│   ├── kg_nodes.json     # VanBan, DieuKhoan, HanhVi, ChuThe, MucPhat
│   └── kg_edges.json     # QUY_DINH_TAI, THAY_THE
├── facts/                # Ground truth (P2)
│   ├── fact_references.json   # 4 FactRef: NQ QH, Bộ Nội vụ, UBND Thanh Hóa
│   └── facts_corpus.json      # Knowledge base
├── fixtures/             # Test data
│   └── comments_batch_*.json  # 45 mock comments (3 batches)
├── study_cases/          # Real penalty cases
└── legal/                # Legal source text (NĐ 174 trích)

runs/
├── crawled_raw.jsonl     # Raw crawled posts (P3 writes)
├── queue.jsonl           # Processed queue items (P4 writes)
└── reports/              # Generated reports

frontend/app/
├── page.tsx              # Dashboard chính: hàng đợi giám sát
├── cases/[id]/           # Hồ sơ đối tượng + panel nguồn tin
├── verify/               # Tầng kiểm chứng
├── mock-data.ts          # Fallback data
├── types.ts              # Claim, Alert, Verdict types
└── components/           # UI components
```

## Chạy backend

```powershell
cd backend
python -m pip install -e ".[dev]"
uvicorn backend.legal_radar.api.main:app --reload
```

## Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

## Chạy crawler

```powershell
# Set Bright Data API key
$env:BRIGHTDATA_API_KEY = "your-key"

# Crawl 20 posts về ĐVHC
python run_facebook_crawler.py

# Output: runs/crawled_raw.jsonl
```

## Pipeline E2E

Xem diagram Mermaid ở mục "Pipeline E2E" phía trên.

## Chạy tests

```powershell
cd backend
pytest tests/ -v
```

## Team (5 người)

| ID | Vai trò | Sở hữu chính |
|---|---|---|
| P1 | Engine Architect | model.py, engine.py, KG data |
| P2 | Data Specialist | fact_references, fixtures, study_cases |
| P3 | Crawl Engineer | crawlers/, cleaner, filter, keywords |
| P4 | API + Pipeline | api/, pipeline.py, providers.py |
| P5 | Frontend + Ops | frontend/, deploy, pitch |

## CI

GitHub Actions chạy trên mỗi push:
- `ruff check` — lint
- `pytest` — unit tests
- Type checking (nếu có)
