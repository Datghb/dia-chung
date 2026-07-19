![CI](https://github.com/Datghb/Parasitic-/actions/workflows/ci.yml/badge.svg)

# Địa Chứng

Hệ thống giám sát tin đồn sáp nhập đơn vị hành chính (ĐVHC) trên mạng xã hội. Sử dụng RAG + Knowledge Graph để phân loại phát ngôn thành **đúng** / **hiểu lầm** / **cần kiểm chứng**, phục vụ cán bộ nhà nước ra quyết định xử phạt.

## Kiến trúc tổng thể

```mermaid
graph TB
    subgraph "Sources"
        FB[Facebook]
        YT[YouTube - DISABLED]
        NEWS[News - DISABLED]
    end

    subgraph "P3 — Crawler"
        DISCOVER[Bright Data Discover API<br/>keyword → URLs]
        SCRAPE[BD Scraper API<br/>URL → post + comments]
        CLEAN[cleaner.py<br/>remove UI garbage]
        FILTER[filter.py<br/>merger keyword required + DVHC relevance]
    end

    subgraph "P4 — Pipeline"
        INGEST[CommentIngestor]
        LLM[LLM Extract<br/>claim + keywords + subject]
        ENGINE[Engine: phan_loai_claim]
        SOURCE[Source Verification<br/>Bright Data Discover + Tier classify]
        GUARD[Guardrails<br/>PII, injection, label enum, validate_reviewer_label]
    end

    subgraph "P1 — Engine"
        MODEL[model.py<br/>FactRef, DieuKhoan, HanhVi, AuditEntry]
        KG[Knowledge Graph<br/>kg_nodes + kg_edges]
        MATCH[match_fact_ref<br/>BM25 matching]
    end

    subgraph "P2 — Data"
        FACTS[fact_references.json<br/>ground truth ĐVHC]
        FIXTURES[fixtures/*.json<br/>test comments]
        CASES[study_cases.json<br/>real penalty cases]
    end

    subgraph "Data Stores"
        CRAWLED[runs/crawled_raw.jsonl]
        QUEUE[runs/queue.jsonl]
        AUDIT[runs/audit.jsonl]
    end

    subgraph "P5 — Frontend"
        DASHBOARD[Dashboard<br/>Next.js]
        CASEVIEW[Hồ sơ đối tượng + Review Panel]
        VERIFY[Tầng kiểm chứng]
    end

    subgraph "Review System"
        REVIEW[PATCH /cases/id/status<br/>PATCH /cases/id/review<br/>GET /cases/id/audit]
    end

    FB --> DISCOVER
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

    CASEVIEW --> REVIEW
    REVIEW --> QUEUE
    REVIEW --> AUDIT

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

    C --> J[source_search<br/>Bright Data Discover API]
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
    T --> V[Officer review]
    V --> W{approve / reject / escalate}
    W -->|reviewer_label override| X[resolved]
    X --> Y[audit.jsonl]
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
    participant R as Review System

    U->>API: POST /api/crawl
    API->>C: crawl_and_process()

    C->>C: _discover_urls(queries)
    Note over C: Bright Data Discover API<br/>7 fallback queries, metadata pre-filter

    C->>C: _crawl_one_post(url)
    Note over C: BD Scraper: post + comments parallel

    C->>C: clean_post() → remove UI garbage
    C->>C: is_relevant() → merger keyword required + DVHC filter

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
        Note over S: Bright Data Discover API<br/>(same API as crawler)
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

    Note over U,R: Officer review flow

    U->>API: GET /api/cases/{id}
    API-->>U: case detail

    U->>API: PATCH /api/cases/{id}/status
    Note over API: status=new → reviewing
    API->>API: update queue.jsonl
    API->>API: append audit.jsonl
    API-->>U: updated case

    U->>API: PATCH /api/cases/{id}/review
    Note over API: action=approve/reject/escalate<br/>human_label override
    API->>API: update queue.jsonl
    API->>API: append audit.jsonl
    API-->>U: resolved case

    U->>API: GET /api/cases/{id}/audit
    API-->>U: audit trail entries
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
        P2D[fixtures/*.json]
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
| Frontend | Vinext, React, TypeScript | Dashboard giám sát, hồ sơ đối tượng, tầng kiểm chứng |
| Backend API | FastAPI, Python 3.11+ | REST API: queue, cases, review, verify, crawl, qa |
| Engine | Python (pure functions) | Rule-based classification + FactRef matching + BM25 |
| Pipeline | Python | LLM extract → engine → source verification → queue |
| Crawler | Bright Data Discover + Scraper API | Keyword search → FB post URLs → scrape content + comments |
| Source Search | Bright Data Discover API | Dynamic source verification (same API as crawler) |
| Data | JSON (KG, facts, fixtures) | Knowledge Graph NĐ 174, ground truth, study cases |

## Cấu trúc thư mục

```
backend/legal_radar/
├── model.py              # Data model: VanBan, DieuKhoan, HanhVi, QueueItem, AuditEntry, FactRef
├── engine.py             # Classification engine: phan_loai_claim(), match_fact_ref()
├── pipeline.py           # CommentIngestor: LLM extract → engine → queue
├── providers.py          # LLM providers: Gemini, Groq, OpenRouter
├── source_search.py      # Dynamic source search (Bright Data Discover API)
├── source_classifier.py  # Tier classification: .gov.vn, TTXVN, báo lớn
├── guardrails.py         # Label enum, PII scan, injection defense, validate_reviewer_label()
├── vn_normalize.py       # Vietnamese text normalization
├── settings.py           # Environment config (API keys, etc.)
├── paths.py              # Path helpers (runs_dir, data_dir, repo_root)
├── api/
│   ├── main.py           # FastAPI app + CORS
│   ├── dependencies.py   # Shared deps (runs_dir, data_dir)
│   ├── schemas.py        # Pydantic schemas: QueueItemResponse, AuditEntryResponse, ReviewRequest, etc.
│   ├── data_access.py    # JSONL read/write: list_queue_items, update_queue_item_status, get_audit_log
│   └── routes/
│       ├── queue.py      # GET /queue, PATCH /cases/{id}/status, PATCH /cases/{id}/review, GET /cases/{id}/audit, DELETE /queue
│       ├── cases.py      # GET /cases/{id}
│       ├── crawl.py      # POST /crawl (SSE stream), GET /crawl/debug
│       ├── verify.py     # GET /verify
│       └── qa.py         # POST /qa
└── crawlers/
    ├── facebook.py       # Bright Data Discover + Scraper API (7 fallback queries, metadata pre-filter)
    ├── cleaner.py        # Content cleaner: remove UI garbage
    ├── filter.py         # DVHC relevance filter (merger keyword required + ≥2 total matches)
    ├── scheduler.py      # crawl_and_process(): crawl → clean → filter
    ├── youtube.py        # YouTube Data API v3 (DISABLED)
    └── news.py           # Vietnamese news RSS crawler (DISABLED)

frontend/
├── app/
│   ├── page.tsx              # Dashboard: Market Overview (charts, KPI, heatmap)
│   ├── queue/page.tsx        # Hàng đợi giám sát (queue table)
│   ├── reports/page.tsx      # Báo cáo tổng hợp
│   ├── verify/page.tsx       # Tầng kiểm chứng (study cases)
│   ├── sources/page.tsx      # Nguồn tin
│   └── layout.tsx            # Sidebar + Topbar layout
├── components/
│   ├── cases/case-detail.tsx # Hồ sơ chi tiết + Review Panel + Audit Timeline
│   ├── queue/queue-view.tsx  # Queue table with filters
│   ├── dashboard/market-overview.tsx  # Charts, heatmaps, KPI cards
│   └── common/               # Sidebar, Topbar, Badges
├── hooks/use-queries.ts      # React Query hooks: useQueueQuery, useUpdateStatusMutation, useAuditQuery
├── types/index.ts            # Case, ApiQueueItem, AuditEntry, StudyCase
└── utils/
    ├── api.ts                # mapApiCase(), fetchQueue(), reviewCase()
    ├── date.ts               # parseCaseDate()
    └── topic.ts              # discussionTopicName(), legalTopicName()

data/
├── kg/                       # Knowledge Graph
│   ├── kg_nodes.json         # VanBan, DieuKhoan, HanhVi, ChuThe, MucPhat
│   └── kg_edges.json         # QUY_DINH_TAI, THAY_THE
├── facts/
│   ├── fact_references.json  # Ground truth FactRef entries
│   └── facts_corpus.json     # Knowledge base (merger topics only)
├── fixtures/                 # Test comments
├── study_cases/              # Real penalty cases
└── legal/                    # Legal source text (NĐ 174)

runs/
├── queue.jsonl               # Queue items (source of truth)
├── audit.jsonl               # Review audit trail (append-only)
└── crawled_raw.jsonl         # Raw crawled posts
```

## Data stores

| File | Format | Ghi chú |
|---|---|---|
| `runs/queue.jsonl` | JSONL | **Source of truth** cho tất cả case. Mỗi lần update sẽ full rewrite. |
| `runs/audit.jsonl` | JSONL | **Append-only** log. Ghi lại mọi thay đổi status, label override, review notes. |
| `runs/crawled_raw.jsonl` | JSONL | Raw crawl output từ Facebook crawler. URL-deduped trước khi ghi. |
| `data/kg/kg_nodes.json` | JSON | Knowledge Graph nodes: VanBan, DieuKhoan, HanhVi, ChuThe, MucPhat. |
| `data/kg/kg_edges.json` | JSON | Knowledge Graph edges: QUY_DINH_TAI, THAY_THE. |
| `data/facts/fact_references.json` | JSON | Ground truth FactRef entries cho BM25 matching. |
| `data/facts/facts_corpus.json` | JSON | Knowledge base (chỉ chứa entries liên quan sáp nhập ĐVHC). |

## API endpoints

| Method | Path | Mô tả |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/queue` | Liệt kê tất cả queue items |
| GET | `/api/cases/{case_id}` | Lấy chi tiết một case |
| PATCH | `/api/cases/{case_id}/status` | Cập nhật status (new/reviewing/resolved), reviewer_label, reviewer_reason, reviewer_note |
| PATCH | `/api/cases/{case_id}/review` | Review action: approve/reject/escalate, human_label override, human_source_label |
| GET | `/api/cases/{case_id}/audit` | Lấy audit trail cho một case |
| DELETE | `/api/queue` | Xóa toàn bộ queue |
| POST | `/api/crawl` | Trigger crawl Facebook (SSE stream) |
| GET | `/api/crawl/debug` | Debug endpoint: test Bright Data APIs |
| GET | `/api/verify` | Lấy study cases cho tầng kiểm chứng |
| POST | `/api/qa` | Phân tích một comment đơn lẻ |

## Human-in-the-loop (Review workflow)

Hệ thống hỗ trợ cán bộ nhà nước review và override kết quả phân loại của AI:

**Luồng review:**
1. Case được tạo với `status=new` từ pipeline
2. Officer mở case → chuyển `status=reviewing` (PATCH /cases/{id}/status)
3. Officer review nhãn AI, có thể override bằng `reviewer_label`
4. Officer resolve case → `status=resolved`

**Label override:**
- Officer có thể ghi đè nhãn AI (`dung` / `hieu_lam` / `can_kiem_chung`) bằng `reviewer_label`
- Khi set `reviewer_label`, status tự động chuyển thành `resolved`
- Validate qua `guardrails.validate_reviewer_label()`

**Review actions** (PATCH /cases/{id}/review):
- `approve` — đồng ý với nhãn AI
- `reject` — từ chối, cần xem xét lại
- `escalate` — chuyển cấp trên xử lý

**Audit trail:**
- Mọi thay đổi status, label override, review action đều được ghi vào `runs/audit.jsonl`
- Mỗi entry gồm: case_id, action, actor, old_value, new_value, note, timestamp
- Append-only, không bao giờ xóa hoặc sửa

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

# Crawl posts về ĐVHC (Facebook only — YouTube/News disabled)
python run_facebook_crawler.py
# Output: runs/crawled_raw.jsonl
```

Thiết lập crawler: xem [`docs/CRAWLERS_SETUP.md`](docs/CRAWLERS_SETUP.md).

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
- business evaluation 14 ca kiểm thử
- frontend TypeScript, ESLint, production build, server-render tests và Playwright E2E

## Vận hành an toàn

Production phải đặt `APP_ENV=production`, `ADMIN_API_KEY` và giới hạn `FRONTEND_ORIGIN`. Các API thay đổi dữ liệu quản trị dùng header `X-Admin-Key`; nếu production thiếu key, hệ thống từ chối thao tác. Xem [SECURITY.md](SECURITY.md) và [kế hoạch đánh giá/pilot](docs/EVALUATION_AND_PILOT.md).
