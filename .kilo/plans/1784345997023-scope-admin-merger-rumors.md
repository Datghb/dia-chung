# PLAN — 5 người: Giám sát tin đồn sáp nhập ĐVHC + Crawl data thật

## MỤC TIÊU

Dashboard giám sát tin đồn sáp nhập đơn vị hành chính cho cán bộ nhà nước. Data thật từ Facebook (Bright Data). Phân loại bằng engine rule-based + FactRef ground truth.

---

## CẤU TRÚC TEAM

| ID | Vai trò | Sở hữu chính | Tại sao quan trọng |
|---|---|---|---|
| **P1** | Engine Architect | model.py (FactRef), engine.py (match_fact_ref, negation, refactor phan_loai_claim), KG data, engine tests, eval cases | Core logic — nếu engine sai nhãn, mọi thứ downstream sai theo |
| **P2** | Data Specialist | fact_references.json, facts_corpus.json, study_cases.json, 45 comments fixtures ĐVHC | Ground truth + fixtures — data quyết định demo có说服力 hay không |
| **P3** | Crawl Engineer | crawlers/cleaner.py, crawlers/filter.py, facebook.py keywords, scheduler.py, crawl testing | Luồng data thật — đây là điểm khác biệt với plan cũ (mock → real) |
| **P4** | API + Pipeline | api/routes/crawl.py, main.py, data_access.py, pipeline.py integration | Kết nối crawler → engine → queue → API — glue layer |
| **P5** | Frontend + Ops | frontend UI, mock-data, deploy, pitch, demo script | Mặt tiền + ship — cán bộ thao tác trực tiếp trên đây |

---

## SHARED INTERFACE

```
P1 publishes → mọi người consume:
├── model.py: FactRef dataclass (new) + existing dataclasses
├── engine.py: phan_loai_claim() mới (FactRef priority path)
├── data/kg/kg_nodes.json + kg_edges.json (frozen after verify)
└── data/facts/fact_references.json (P2 viết, P1 load)

P3 publishes → P4 consume:
├── crawlers/cleaner.py: clean_post() API
├── crawlers/filter.py: is_relevant() API
└── crawlers/scheduler.py: crawl_and_process() API

P4 publishes → P5 consume:
├── POST /api/crawl → {crawled, relevant, items}
├── GET /api/queue → queue items
└── GET /api/cases/{id} → case detail
```

**Quy tắc:** P1 publish model.py + engine interface → P3/P4 import. Thay đổi model = announce + sync.

---

## DEPENDENCY MAP

```
P2 (data fixtures, facts)
    │
    ▼
P1 (FactRef + engine refactor)  ← CRITICAL PATH
    │           │
    │           ▼
    │       P3 (cleaner + filter + keywords)  ← song song với P1 phần standalone
    │           │
    ├───────────┤
    │           │
    ▼           ▼
P4 (API + pipeline integration)
    │
    ▼
P5 (frontend + deploy + pitch)
```

**Parallelism tối đa:**
- P1 (model.py FactRef) song song P2 (viết data) song song P3 (cleaner.py + filter.py — không depend P1)
- P1 (engine refactor) xong → P3 (scheduler integration) + P4 (crawl route) chạy song song
- P4 (API) xong → P5 (frontend + deploy)

---

## TASK BREAKDOWN THEO NGƯỜI

### P1 — Engine Architect

| # | Task | Files | Depends on |
|---|---|---|---|
| P1.1 | Thêm `FactRef` dataclass vào model.py + `_TYPE_MAP` + `get_fact_refs()` | `backend/legal_radar/model.py` | — |
| P1.2 | Thêm 2 HanhVi nodes + 2 edges QUY_DINH_TAI | `data/kg/kg_nodes.json`, `data/kg/kg_edges.json` | — |
| P1.3 | Thêm `_NEGATION_CUES` + `_is_negation_of()` + `_contradicts()` | `backend/legal_radar/engine.py` | — |
| P1.4 | Thêm `match_fact_ref()` — BM25 matching trên FactRef nodes | `backend/legal_radar/engine.py` | P1.1 |
| P1.5 | Thêm `_classify_with_fact_ref()` — nhãn dựa trên FactRef | `backend/legal_radar/engine.py` | P1.3, P1.4 |
| P1.6 | Refactor `phan_loai_claim()` → `_classify_with_rules()` + FactRef priority path | `backend/legal_radar/engine.py` | P1.5 |
| P1.7 | Thêm ĐVHC slang vào `_SLANG_MAP` ("gop"→"sáp nhập", "sap nhap"→"sáp nhập") | `backend/legal_radar/engine.py` | — |
| P1.8 | Engine tests: T1–T7 (FactRef match, negation, contradiction, fallback) | `backend/tests/unit/test_engine.py` | P1.6 |
| P1.9 | Viết 10 eval cases ĐVHC | `backend/eval/cases.json` | P1.6 |
| P1.10 | Run eval gate: `python eval/smoke.py` — pass ≥ 9/10 | `backend/eval/` | P1.9 |

**Gate G1:** P1.8 tests green × 2 runs. P1.10 eval pass ≥ 9/10.

---

### P2 — Data Specialist

| # | Task | Files | Depends on |
|---|---|---|---|
| P2.1 | Viết `fact_references.json` — 4 FactRef ground truth (NQ QH, Bộ Nội vụ, UBND Thanh Hóa) | `data/facts/fact_references.json` | — |
| P2.2 | Cập nhật `facts_corpus.json` — thêm facts ĐVHC (Bộ Nội vụ bác bỏ, NQ QH, TTXVN) | `data/facts/facts_corpus.json` | — |
| P2.3 | Viết `study_cases.json` — case "34→16 tỉnh" | `data/study_cases/study_cases.json` | — |
| P2.4 | Viết `comments_batch_1.json` — 15 câu nhóm ĐÚNG (hiểu đúng, dẫn nguồn) | `data/fixtures/comments_batch_1.json` | — |
| P2.5 | Viết `comments_batch_2.json` — 15 câu nhóm HIỂU LẦM (khẳng định sai, nhầm lẫn) | `data/fixtures/comments_batch_2.json` | — |
| P2.6 | Viết `comments_batch_3.json` — 15 câu nhóm CẦN KIỂM CHỨNG (câu hỏi mở) | `data/fixtures/comments_batch_3.json` | — |
| P2.7 | Verify data: cross-check FactRef.su_that với nguồn chính thức | Manual | P2.1 |
| P2.8 | Verify study_cases.expected_he_thong.muc_phat với Điều 4 khoản 3 NĐ174 | Manual | P2.3 |

**Gate G2:** P2.1–P2.6 JSON valid, load được qua model.py. P2.7 + P2.8 verified.

---

### P3 — Crawl Engineer

| # | Task | Files | Depends on |
|---|---|---|---|
| P3.1 | Tạo `cleaner.py` — content cleaner (UI garbage patterns, min length) | `backend/legal_radar/crawlers/cleaner.py` | — |
| P3.2 | Tạo `filter.py` — relevance filter (_DVHC_KEYWORDS, _MIN_KEYWORD_MATCH) | `backend/legal_radar/crawlers/filter.py` | — |
| P3.3 | Test cleaner + filter trên `runs/crawled_raw.jsonl` hiện tại | Manual | P3.1, P3.2 |
| P3.4 | Cập nhật `facebook.py` — thay FALLBACK_QUERIES bằng keywords ĐVHC | `backend/legal_radar/crawlers/facebook.py` | — |
| P3.5 | Cập nhật `scheduler.py` — CRAWL_KEYWORDS ĐVHC + `crawl_and_process()` | `backend/legal_radar/crawlers/scheduler.py` | P3.1, P3.2 |
| P3.6 | Cập nhật `run_facebook_crawler.py` — keywords ĐVHC | `run_facebook_crawler.py` | P3.4 |
| P3.7 | Test crawl thật — chạy 1 cycle, verify ≥ 1 post ĐVHC | Manual | P3.6 |
| P3.8 | Verify crawled data → clean → filter → chất lượng OK | Manual | P3.7 |

**Gate G3:** P3.3 cleaner loại ≥ 80% garbage. P3.7 crawl thật có data.

---

### P4 — API + Pipeline

| # | Task | Files | Depends on |
|---|---|---|---|
| P4.1 | Tạo `api/routes/crawl.py` — POST /api/crawl endpoint | `backend/legal_radar/api/routes/crawl.py` | P3.5 |
| P4.2 | Cập nhật `api/main.py` — include crawl router | `backend/legal_radar/api/main.py` | P4.1 |
| P4.3 | Cập nhật `data_access.py` — đọc crawled data từ queue.jsonl (không chỉ fixtures) | `backend/legal_radar/api/data_access.py` | — |
| P4.4 | Pipeline integration: crawled comment → CommentIngestor → QueueItem → queue.jsonl | `backend/legal_radar/crawlers/scheduler.py`, `backend/legal_radar/pipeline.py` | P1.6, P3.5 |
| P4.5 | Test E2E: POST /api/crawl → crawl → clean → filter → pipeline → queue.jsonl | Manual + curl | P4.4 |
| P4.6 | Verify GET /api/queue trả về cả crawled data + fixture data | curl | P4.3 |

**Gate G4:** P4.5 E2E pass. P4.6 API trả về data thật.

---

### P5 — Frontend + Ops

| # | Task | Files | Depends on |
|---|---|---|---|
| P5.1 | Cập nhật `mock-data.ts` — domain ĐVHC (fallback khi crawl fail) | `frontend/app/mock-data.ts` | — |
| P5.2 | Cập nhật UI labels — title "Giám sát tin đồn sáp nhập ĐVHC" | Frontend components | — |
| P5.3 | Thêm "Cập nhật dữ liệu mới" button → POST /api/crawl | Frontend component | P4.1 |
| P5.4 | Cập nhật types.ts — thêm FactRef-related types nếu cần | `frontend/app/types.ts` | P1.1 |
| P5.5 | Deploy config + health check | Deploy scripts | P4.2 |
| P5.6 | Pitch deck — cập nhật narrative cho domain ĐVHC | Pitch materials | P2, P3 |
| P5.7 | Demo script — rehearse crawl → classify → dashboard flow | Manual | P4.5 |

**Gate G5:** P5.3 button hoạt động. P5.5 deployed URL 200. P5.7 demo rehearsed.

---

## THỰC HIỆN THEO PHASE

### Phase 1 — Foundation (song song 3 người)

| P1 | P2 | P3 |
|---|---|---|
| P1.1 FactRef dataclass | P2.1 fact_references.json | P3.1 cleaner.py |
| P1.2 HanhVi nodes + edges | P2.2 facts_corpus.json | P3.2 filter.py |
| P1.3 _NEGATION_CUES | P2.3 study_cases.json | P3.3 test cleaner+filter |
| P1.7 ĐVHC slang | P2.4–P2.6 fixtures (45 comments) | P3.4 facebook.py keywords |

### Phase 2 — Engine + Crawl Integration (P1 leads, P3 follows)

| P1 | P3 | P4 |
|---|---|---|
| P1.4 match_fact_ref() | P3.5 scheduler.py integration | P4.3 data_access.py |
| P1.5 _classify_with_fact_ref() | P3.6 run_facebook_crawler.py | |
| P1.6 refactor phan_loai_claim() | P3.7 test crawl thật | |
| P1.8 engine tests | | |

### Phase 3 — API + Pipeline (P4 leads, P5 starts)

| P4 | P5 |
|---|---|
| P4.1 crawl.py route | P5.1 mock-data.ts |
| P4.2 main.py update | P5.2 UI labels |
| P4.4 pipeline integration | P5.4 types.ts |
| P4.5 E2E test | |
| P4.6 verify API | |

### Phase 4 — Polish + Deploy + Pitch (P5 leads)

| P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|
| P1.9 eval cases | P2.7 verify data | P3.8 verify quality | P4.6 API verify | P5.3 crawl button |
| P1.10 eval gate | P2.8 verify phạt | | | P5.5 deploy |
| | | | | P5.6 pitch |
| | | | | P5.7 demo script |

---

## VALIDATION

| Gate | Criteria | Who |
|---|---|---|
| G1 | P1 engine tests green × 2, eval ≥ 9/10 | P1 |
| G2 | P2 data JSON valid, verified with sources | P2 |
| G3 | P3 cleaner ≥ 80% garbage removal, crawl có data ĐVHC | P3 |
| G4 | P4 E2E: POST /api/crawl → queue.jsonl có data | P4 |
| G5 | P5 deployed URL 200, demo rehearsed | P5 |

---

## RISK

| Risk | Owner | Mitigation |
|---|---|---|
| P1 bottleneck (engine refactor là dependency) | P1 | Deliver P1.1–P1.3 trước, P3/P4 song song phần standalone |
| FactRef matching sai (so số đơn giản) | P1 | Fallback can_kiem_chung khi không chắc |
| Negation miss cue mới | P1 | Mở rộng _NEGATION_CUES qua eval |
| Crawl keywords ĐVHC quá hẹp | P3 | Fallback broader keywords + giữ mock data |
| FB login fail (checkpoint) | P3 | Log warning, không crash, mock data fallback |
| Bright Data quota hết | P3 | Graceful degradation |
| P3 ↔ P4 interface mismatch | P3 + P4 | Sync interface sau P1.6 xong (5 min) |
| P5 overload (frontend + deploy + pitch) | P5 | Cut: bỏ button crawl → CLI trigger, pitch đơn giản |
| Credentials lộ | ALL | .env, không commit |

---

## CUT LIST (ưu tiên cắt từ dưới lên)

| # | Cắt | Khi nào | Thay thế |
|---|---|---|---|
| 5 | POST /api/crawl button → CLI trigger | P5 overload | `python run_facebook_crawler.py` |
| 4 | YouTube crawler integration | Hết thời gian | Chỉ dùng Facebook |
| 3 | Dashboard verify tab interactive → static HTML | P5 overload | bảng HTML tĩnh |
| 2 | Real-time crawl scheduler (background) | Hết thời gian | On-demand only |
| 1 | Pitch video editing → screen record only | Hết thời gian | Raw recording |
| **KHÔNG CẮT:** | FactRef + engine refactor + cleaner/filter + pipeline integration + eval gate + deploy |

---

## CREDENTIALS

- Bright Data API key: từ `run_facebook_crawler.py` (dùng tiếp)
- Facebook account: từ `run_facebook_crawler.py` (dùng tiếp)
- Cả 2 → `.env` (ưu tiên thấp, không block)
