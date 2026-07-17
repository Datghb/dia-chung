# PLAN — Hackathon AIZ Legal-KG: 5 người, 2 team

## MỤC TIÊU

Build sản phẩm AI pháp lý (RAG + KG) trong 48h: dashboard giám sát vi phạm MXH cho cán bộ Sở TT&TT theo NĐ 174/2026. Câu hỏi trung tâm: **"Làm sao hệ thống biết bài viết đó là đúng hay sai?"**

---

## CẤU TRÚC TEAM

### Team A — Accuracy (2 người): "Hệ thống biết đúng hay sai như thế nào?"

| ID | Vai trò | Sở hữu | Tại sao quan trọng |
|---|---|---|---|
| **A1** | Engine Architect | P1 data model (shared interface), P2 core engine (7 hàm pure), KG data (kg_nodes/kg_edges JSON), test suite P2 | Đây là **invariant core** — nếu engine sai, mọi thứ downstream sai theo |
| **A2** | Verification Specialist | Dynamic source search (Gemini + Google Search grounding), source_search.py, P9 guardrails (5 domain rails), eval gate (14 cases), study case verification | Trả lời câu hỏi "đúng hay sai" cho BẤT KỲ chủ đề nào — không hardcode corpus |

### Team B — Infrastructure (3 người): "Build, chạy, trình bày"

| ID | Vai trò | Sở hữu | Tại sao quan trọng |
|---|---|---|---|
| **B1** | Data Pipeline Lead | P3 provider layer (LLM), P4 ingest pipeline, comment fixtures, JSONL queue | LLM extract claim/keywords từ comment → feed vào engine Team A |
| **B2** | Dashboard Lead | P6 dashboard 3 màn, API endpoints, UI templates (FastAPI + Jinja2) | Mặt tiền sản phẩm — cán bộ thao tác trực tiếp trên đây |
| **B3** | Ops + Pitch Lead | P0 scaffold, P5 report/CLI, P7 deploy, P8 deliverable, pitch deck, demo video, collab log | Đảm bảo ship được + pitch được |

---

## SHARED INTERFACE (dependency chéo)

```
P1 data model (A1 owns → mọi người consume)
├── legal_radar/model.py: frozen dataclasses (VanBan, DieuKhoan, HanhVi, ChuThe, MucPhat, BienPhapKhacPhuc)
├── data/kg_nodes.json + kg_edges.json (frozen after verify)
├── legal_radar/source_search.py (A2 owns, Gemini + Google Search grounding — search BẤT KỲ chủ đề)
├── legal_radar/source_classifier.py (A2 owns, classify tier theo URL + fusion rules)
└── data/comments_batch*.json (B2 owns, format theo fixture spec §5)
```

**Quy tắc:** A1 publish model.py + schema → B1/B2/B3 import. Thay đổi model = announce + cả 2 team sync.

---

## PIPELINE DỮ LIỆU — AI ĐOÁN ĐÚNG/SAI NHƯ THẾ NÀO?

```
Comment MXH (untrusted text)
    │
    ▼
[LLM Extract — P4/B1] → {claim, keywords, chủ thể nếu nêu}
    │
    ▼
[match_hanh_vi — P2/A1] → list DieuKhoan khớp (keyword/BM25 trên KG)
    │
    ├─→ [phan_loai_claim — P2/A1] → nhãn (dung|hieu_lam|can_kiem_chung) + lý_do + trích_dan
    │       │
    │       └─ Rules:
    │           (a) đúng khung + đúng chủ thể → dung
    │           (b) gán nhầm tổ chức↔cá nhân → hieu_lam
    │           (c) dùng khung NĐ15 sau 01/7/2026 → hieu_lam
    │           (d) thiếu dữ kiện / không match → can_kiem_chung
    │
    └─→ [xac_thuc_nguon — P2/A2] → nhãn nguồn + matched_docs
            │
            ├─ RAG 1 (KG luật): đã match ở trên → trích dẫn điều/khoản/điểm
            │
            └─ RAG 2 (Nguồn tin — DYNAMIC SEARCH):
                │
                │  Gemini + Google Search grounding
                │  → Tìm kiếm BẤT KỲ chủ đề nào trên web (không hardcode corpus)
                │  → Kết quả phân tầng theo URL: .gov.vn=Tier0, TTXVN/VTV=Tier1, báo lớn=Tier2
                │
                └─ FUSION RULES:
                    ├─ ≥1 Tier0 hoặc ≥2 Tier1/2 xác nhận → co_nguon_xac_nhan
                    ├─ Tier0/1 bác bỏ SAU thời gian claim → co_bac_bo_chinh_thuc
                    ├─ Search fail (quota/API) → chua_tim_thay_nguon + log error
                    └─ không match → chua_tim_thay_nguon (TRUNG TÍNH, không phải "sai")
    │
    ▼
[Integration — P2/A1] → nhan_nguon feed vào ly_do; kêu gọi hành động + không nguồn → đẩy top queue
    │
    ▼
[Guardrails — P9/A2] → label enum check, rule 1/2 assert, PII scan, injection defense
    │
    ▼
Queue (runs/queue.jsonl) → Dashboard (P6/B2)
```

---

## TASK BREAKDOWN THEO TỪNG PHASE

### PHASE 0 — Bootstrap + Scaffold (H0 → H0+1h) — ALL 5

| Task | Owner | Depends on | Deliverable |
|---|---|---|---|
| P0: repo scaffold, CLAUDE.md, layout, requirements.txt | B3 | — | repo structure, `pip install` clean |
| P0: deploy hello-world (FastAPI `/health` → 200) | B3 | — | public URL |
| P0: .env synced 2 laptops, git configured | B3 | — | both laptops ready |
| Decision Block confirmed | A1 + B3 | triage done | Decision Block in README + collab log |
| Cut list finalized (5 items) | A1 + B3 | Decision Block | cut list in DECISIONS.md |

### PHASE 1 — Data Model + KG Data (H1 → H4) — A1 leads

| Task | Owner | Depends on | Deliverable |
|---|---|---|---|
| P1: implement model.py (frozen dataclasses + loader) — TDD | **A1** | P0 | `tests/test_model.py` green |
| P1: domain validation tests (diem requires khoan, khoan requires dieu, duplicate id, min>max, edge ref missing, enum violation) | **A1** | — | 15+ test cases green |
| KG data: write kg_nodes.json + kg_edges.json từ data/nd174_trich.md | **A1** | P1 model | ~30-50 nodes, JSON valid |
| KG verify: cross-check 3 node mẫu với text gốc nd174_trich.md | **A1** | kg_nodes done | verify log |
| P3: implement providers.py (Gemini + Groq + OpenRouter thin layer) | **B1** | P0 | `tests/test_providers.py` green, 1 live smoke per engine |
| P4 prep: soạn comments_batch_1.json (15 câu nhóm đúng) | **B2** | — | JSON theo fixture spec §5 |
| P4 prep: soạn comments_batch_2.json (15 câu nhóm hiểu lầm) | **B2** | — | JSON, focus nhầm chủ thể + nhầm NĐ15 |
| P4 prep: soạn comments_batch_3.json (15 câu nhóm cần kiểm chứng) | **B2** | — | JSON, câu hỏi có điều kiện |
| source_search.py: draft dynamic search (Gemini + Google Search grounding) | **A2** | P3 providers | test 1 query mẫu bất kỳ chủ đề |
| source_classifier.py: classify_tier() theo URL + fusion rules | **A2** | — | test 5 URL mẫu (.gov.vn, ttxvn, vnexpress, random) |
| Study cases: sưu tầm 1-2 quyết định xử phạt thật | **A2** | — | study_cases.json |

**Gate G1 (H4 = 15%):** P1 model tests green × 2 runs. KG JSON valid. Providers live-smoked.

### PHASE 2 — Core Engine + Dual-RAG (H4 → H12) — A1+A2 leads

| Task | Owner | Depends on | Deliverable |
|---|---|---|---|
| **P2.1:** muc_phat_cho_chu_the() — pure, TDD | **A1** | P1 model | 3 test cases green (20-30→10-15, 30-50→15-25, âm→ValueError) |
| **P2.2:** match_hanh_vi() — keyword/BM25 trên KG | **A1** | P1 model, kg_nodes | 4 test cases green ("tin giả"→d95-k1-a, "gây hoang mang"→d95-k2-c, "bóc phốt"→d95-k1-a, rỗng→[]) |
| **P2.3:** phan_loai_claim() — rule-based classification | **A1** | P2.2 | 8+ test cases (2 per rule a/b/c/d, edge: "20-30tr" không chủ thể → can_kiem_chung) |
| **P2.4:** diff_thay_the() — render edge THAY_THE | **A1** | kg_edges | 2 test cases (Đ101 NĐ15 ↔ Đ95 NĐ174) |
| **P2.5:** xep_uu_tien() — sort queue | **A1** | — | deterministic test với fixture |
| **P2.6:** xac_thuc_nguon() — **ĐÂY LÀ CORE CÂU HỎI "ĐÚNG HAY SAI"** | **A2** | P3 providers (Gemini key) | 8 test cases bắt buộc (xem dưới) |
| **P2.6a:** source_search.py — Gemini + Google Search grounding, search BẤT KỲ chủ đề | **A2** | P3 providers | 1 hàm: search(query) → list[{tieu_de, nguon, url, ngay_dang, noi_dung_tom_tat}] |
| **P2.6b:** source_classifier.py — classify_tier() theo URL (.gov.vn=Tier0, TTXVN/VTV=Tier1, báo lớn=Tier2) | **A2** | — | test với URL mẫu, mở rộng không hardcode |
| **P2.6c:** apply_fusion_rules() — phân tầng + hợp nhất kết quả search | **A2** | P2.6a + P2.6b | test: Tier0 confirm → co_nguon_xac_nhan; Tier0 deny sau thoi_gian → co_bac_bo |
| **P2.7:** integration — nhan_nguon feed vào phan_loai_claim ly_do | **A1 + A2** | P2.3 + P2.6 | test: kêu gọi hành động + không nguồn → đẩy top |
| Vietnamese text normalization: bỏ dấu, slang→standard ("củ"→"triệu", "share"→"chia sẻ") | **A1** | — | normalize_text() + test cases |
| P4: implement ingest_vanban (parse nd174_trich.md → kg JSON) | **B1** | P1 model, nd174_trich.md | 1 lần, human verify, FREEZE |
| P4: implement ingest_comments (LLM extract → engine → queue) | **B1** | P3, P2.3 (interface) | pipeline test với 1 comment |
| P6 prep: wireframe 3 màn (paper sketch) | **B2** | — | sketch approved by team |

**Test cases BẮT BUỘC cho P2.6 (xac_thuc_nguon) — Dynamic search:**

| # | Scenario | Input | Expected | Chống cái gì |
|---|---|---|---|---|
| 1 | Search tìm thấy Tier0 xác nhận | keywords=["SCB", "bác bỏ", "tin đồn"] | Tìm thấy sbv.gov.vn (Tier0) → `co_nguon_xac_nhan` | Xác nhận chính thức |
| 2 | Search tìm thấy Tier0 bác bỏ SAU thoi_gian | keywords + SBV bác bỏ sau ngày claim | `co_bac_bo_chinh_thuc`; nhãn tổng vẫn là gợi ý | Chống khẳng định sai |
| 3 | Bác bỏ TRƯỚC thoi_gian claim | keywords + bác bỏ trước ngày claim | KHÔNG tính là bác bỏ | Chống lỗi timeline |
| 4 | Search cho chủ đề bất kỳ (y tế) | keywords=["bệnh viện", "ca bệnh lạ"] | Tìm thấy moh.gov.vn (Tier0) → `co_nguon_xac_nhan` | **Mọi chủ đề** |
| 5 | Search cho chủ đề bất kỳ (an ninh) | keywords=["công an", "lừa đảo", "mạng"] | Tìm thấy bocongan.gov.vn (Tier0) → `co_nguon_xac_nhan` | **Mọi chủ đề** |
| 6 | Search chỉ tìm thấy Tier2 | keywords + chỉ báo lớn (VnExpress, Tuổi Trẻ) | `chua_tim_thay_nguon` (cần ≥2 Tier1/2) | Không đủ thẩm quyền |
| 7 | Search không tìm thấy gì | keywords không liên quan | `chua_tim_thay_nguon` (trung tính) | Chống phạt oan |
| 8 | Search API fail (quota/error) | keywords + API error | `chua_tim_thay_nguon` + log error, không crash | Graceful degradation |

**Gate G2 (H8.5 = 35%) — SCOPE FREEZE:**
- All P2 tests green × 2 runs (deterministic)
- One real run end-to-end: comment → LLM extract → engine → queue item
- Demo-moment artifact exists in run file

### PHASE 3 — Guardrails + Pipeline + Dashboard (H12 → H17) — song song

| Task | Owner | Depends on | Deliverable |
|---|---|---|---|
| **P9.1:** LABEL_ENUM enforcement — reject "vi_pham" | **A2** | P2 model | test: "vi_pham" → ValueError |
| **P9.2:** Rule 1/2 assertion — cá nhân == 1/2 tổ chức | **A2** | P2.1 | test: mismatch → raise |
| **P9.3:** PII guard — scan + anonymize | **A2** | — | test với fixture tên thật |
| **P9.4:** Injection defense — pattern scan + wrap | **A2** | — | test: injection → can_kiem_chung, không đổi behavior |
| **P9.5:** Nguồn-tin rails — NHAN_NGUON_ENUM, chua_tim_thay_nguon render rule | **A2** | P2.6 | test: "chưa tìm thấy" ≠ "nghi vấn sai" |
| P4: batch pipeline (all 45 comments → queue.jsonl) | **B1** | P2.3 interface, comments_batch | queue.jsonl with 45 items |
| P4: "Cập nhật dữ liệu mới" CLI nút | **B1** | — | CLI trigger batch tiếp |
| P5: report.py + cli.py | **B3** | P4 | report JSON + markdown |
| P6.1: Hàng đợi giám sát (màn mặc định) | **B2** | queue.jsonl, P2.5 | GET / renders table |
| P6.2: Hồ sơ đối tượng + panel nguồn tin + panel diff | **B2** | P2.1-2.4, P2.6 | GET /case/{id} |
| P6.3: Tầng kiểm chứng | **B2** | study_cases | GET /verify |
| P6.4: Q&A API phụ | **B2** | P2.3 | POST /api/qa |

**Gate G3 (H17 = 50%):** Deployed URL returns 200 from phone on mobile data. Real data on screen.

### PHASE 4 — Polish + Second Run + Deploy (H17 → H24)

| Task | Owner | Depends on | Deliverable |
|---|---|---|---|
| **Eval gate:** eval/smoke.py + eval/cases.json (14 cases) | **A2** | P2 + P9 | runner pass/fail, exit 1 on fail |
| Eval: run trên toàn bộ 14 cases, in confusion matrix + N | **A2** | eval cases | confusion matrix N=14 |
| Second run: bigger N (all 3 batches) | **B1** | pipeline stable | stronger numbers |
| Dashboard polish: filter, badge colors, responsive | **B2** | P6 working | UI clean |
| P7: deploy config (Railway/Render) + health endpoint | **B3** | P6 | stable public URL |
| P8: báo cáo tổng hợp (markdown + HTML tĩnh) | **B3** | queue data | printable report |
| Verify: chạy study case qua hệ thống, so sánh với quyết định thật | **A2** | P2 + study_cases | verify table: khớp/lệch |

### PHASE 5 — Pitch + Video + Submit (H24 → H46)

| Task | Owner | Depends on | Deliverable |
|---|---|---|---|
| Pitch deck: 12 slides | **B3** | data ready | PDF + source |
| Demo script: 5-min structure rehearsed | **B3 + B2** | product working | script approved |
| Video: screen record + edit | **B3** | product + script | MP4 ≤ limit |
| Collab log: header + entries curated | **B3** | all commits | AI_COLLABORATION_LOG.md |
| Pre-submit checklist | **ALL** | everything | all green |
| Submit at 95% | **B3** | checklist 100% | confirmation screenshot |
| Live encore rehearsed × 2 | **B2** | deploy stable | no flake |

---

## DEPENDENCY MAP (critical path)

```
P0 scaffold (B3, H0-1h)
    │
    ▼
P1 data model (A1, H1-3h) ← SHARED INTERFACE
    │           │
    │           ▼
    │       P3 providers (B1, H1-3h) ← ĐỘC LẬP với P1
    │           │
    ├───────────┤
    │           │
    ▼           ▼
P2 engine    P4 pipeline
(A1, H4-8h)  (B1, H6-10h)
    │           │
    ▼           │
P2.6 xac_thuc  │
(A2, H6-10h)   │
    │           │
    ▼           ▼
P9 guardrails  P6 dashboard
(A2, H10-14h)  (B2, H10-16h)
    │           │
    └─────┬─────┘
          ▼
    E2E + Gate G2
          │
          ▼
    Eval + Deploy + Pitch
    (A2+B3, H17-46h)
```

**Parallelism tối đa:**
- H1-3h: A1 (P1) song song B1 (P3) song song A2 (facts corpus) song song B2 (comments prep)
- H4-8h: A1 (P2.1-2.5) song song B1 (P4 prep) song song A2 (P2.6) song song B2 (P6 wireframe)
- H10-16h: A2 (P9) song song B1 (P4 batch) song song B2 (P6 UI) song song B3 (P5+P7)

---

## CUT LIST (5 items, ưu tiên cắt từ dưới lên)

| # | Cắt | Khi nào | Thay thế |
|---|---|---|---|
| 5 | Q&A API tự do → preset queries (5-7 câu mẫu) | H17 nếu P6 trễ | Hardcode Q&A từ KG |
| 4 | Dashboard 3→2 màn (bỏ verify interactive → bảng HTML tĩnh) | H14 nếu B2 overload | Static HTML so sánh |
| 3 | Biểu đồ xu hướng → chart tĩnh render 1 lần | H16 nếu chart ăn time | Bỏ chart, chỉ bảng |
| 2 | Second run bigger N → dùng run đầu tiên | H20 nếu quota/time | Show CI-vs-N story |
| 1 | Deploy Railway → ngrok from laptop | H18 nếu deploy fail | ngrok + fallback HTML |
| **KHÔNG BAO GIỜ CẮT:** | KG core + rule 1/2 + Dynamic source search (xac_thuc_nguon) + citation bắt buộc + eval gate + collab log + video |

---

## RISK ĐẶC THÙ CHO PLAN NÀY

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **A1 bottleneck** — P1 model là dependency cho TẤT CẢ | High | Critical | A1 deliver P1 trong 2h đầu; B1 song song P3 không cần P1 |
| **Dynamic search quota** — Gemini Google Search grounding hết quota (~50 calls/ngày) | Low | High | Gemini free 500 RPD/key ×2 = 1000 RPD; batch 50 comments chỉ dùng ~50 calls. Nếu hết → chua_tim_thay_nguon (trung tính, không crash) |
| **Dynamic search hallucination** — Gemini tạo URL/tin giả | Medium | High | classify_tier() chỉ accept URL có domain thật (.gov.vn, vnexpress.net...); test assert URL hợp lệ; reject URL lạ |
| **Dynamic search latency** — mỗi call 2-3s, 50 comments × 3s = 2.5 phút | Low | Low | Chấp nhận được cho batch pipeline; song song nếu cần (asyncio) |
| **Dynamic search trả lời sai** — Gemini trả kết quả không liên quan claim | Medium | Medium | Fusion rules kiểm tra relevance: keywords phải match ≥1 trong title/summary; không match → chua_tim_thay_nguon |
| **P2.3 ↔ P4 interface mismatch** — engine expect input format khác LLM output | Medium | Medium | A1 + B1 sync interface tại H6 (5 min); test adapter ở P4 |
| **BM25 miss tiếng Việt MXH** — "củ", "share", "fake" | High | Medium | A1 build normalize_text() trong P2; test với slang fixtures |
| **B2 overload** — 3 màn dashboard trong 6h | Medium | High | Cut list item 4 (3→2 màn); B2 chỉ build 2 màn core, verify = static |
| **LLM extract sai claim** — garbage in → engine output sai | Medium | Medium | P4 retry 2x; LLM error → can_kiem_chung + error log; human verify first batch |
| **Tier classification sai** — URL .gov.vn nhưng không phải cơ quan có thẩm quyền chủ đề | Low | Medium | Whitelist mở rộng theo domain pattern, không hardcode tên miền cụ thể |

---

## PRE-EVENT CHECKLIST CÒN THIẾU

**A2 (Verification Specialist):**
- [ ] Sưu tầm 1-2 quyết định xử phạt thật → `data/study_cases.json`
- [ ] Test Gemini Google Search grounding — verify dynamic search hoạt động với 3 query mẫu khác nhau chủ đề
- [ ] Viết draft classify_tier() — test với 10 URL mẫu (.gov.vn, ttxvn.vn, vnexpress.net, random blog, .com)
- [ ] Viết draft apply_fusion_rules() — test logic Tier0 confirm/deny với mock data

**A1 (Engine Architect):**
- [ ] Tải + trích Điều 101 NĐ 15/2020 → `data/nd15_trich.md`

**B2 (Dashboard Lead):**
- [ ] Soạn 45 bình luận mô phỏng → `data/comments_batch_1/2/3.json`

**ALL:**
- [ ] Verify toàn bộ data với text gốc trước khi freeze

---

## VALIDATION PLAN

| Gate | Criteria | Who checks |
|---|---|---|
| G1 (H4) | P1 tests green ×2, providers live-smoked, Gemini Google Search grounding test query thành công | A1 + B1 + A2 |
| G2 (H8.5) | P2 ALL tests green ×2 (including 10 source verification tests), E2E happy path, scope freeze | A1 + A2 |
| G3 (H17) | Deployed URL 200 from phone, real data on screen | B3 |
| G4 (H31) | Video exported, plays clean | B3 |
| G5 (H43) | Pre-submit checklist 100%, all links public | ALL |
| Eval (H20) | 14/14 cases pass (including dynamic search cases), confusion matrix printed | A2 |

---

## OPEN QUESTIONS

1. **Dynamic search API choice:** Gemini + Google Search grounding (miễn phí, đã có key) vs SerpAPI (100 free queries/day) vs NewsAPI (100 free/day)? Recommend Gemini vì không cần thêm key.
2. **Gemini Google Search grounding có sẵn trên free tier không?** Cần verify trước event — nếu không có, fallback sang SerpAPI hoặc Tavily.
3. **Bộ 45 comments mô phỏng** đã soạn chưa? Nếu chưa, B2 soạn tại event nhưng mất ~2h.
4. **LLM choice cho P4 extract:** Gemini flash-lite (free) hay Groq llama-4-scout (30K TPM)? Recommend Gemini vì free quota lớn hơn.