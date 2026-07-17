# 04 — Rebuild Prompt Pack (generic P0–P8)

Paste-ready prompt skeletons. The AI fills every `<<SLOT>>` in BOOTSTRAP
Phase C from the Decision Block + Architecture Menu. Run **in order** per
builder; after each: acceptance check → commit (given message +
`[AI-generated]` + AI co-author trailer) → collab-log entry.

**Rules of engagement**
- Never paste old source code — only these prompts and kit specs.
- The generated repo is standalone: no factory imports, own provider layer,
  own requirements file.
- If output diverges from spec: don't hand-edit — re-prompt with the failing
  test output or the violated spec line.

## Parallelism map (2 builders; fold into 1 or split to 3 as staffed)

| Builder-1 (core) | Builder-2 (surface/data) |
|---|---|
| P0 → P1 → P2 → P4 | (after P1 lands) domain data prep → P3 → P5 |
| P6 → P9 | P7 → first real run |
| — | P8 |

Interface contract: P1's data model is the only shared file — Builder-1 owns
it; Builder-2 consumes.

---

## P0 — Repo conventions + scaffold (first 10 minutes)

```
Create a CLAUDE.md for this repo with these project conventions, then the
package layout.

Project: <<PRODUCT_NAME>> — <<ONE_SENTENCE_FROM_DECISION_BLOCK>>.
Built live at <<EVENT>>; every line of code AI-generated in-window.

Conventions to record in CLAUDE.md:
- Python 3.11+, pytest; type hints on all signatures; frozen dataclasses;
  pure functions for all core logic (no I/O in <<CORE_MODULE>>).
- TDD mandatory: tests written and failing BEFORE implementation.
- <<ARCHETYPE_SPECIFIC_INVARIANTS>>   (e.g. archetype C: "NEVER cache or
  memoize any engine call on the measurement path"; archetype B: "every agent
  step appended to a JSONL trace the moment it completes")
- Crash-safe persistence: sampled/streamed data appended to JSONL + flush.
- Secrets only via .env (python-dotenv); never committed, never logged.
- Standalone repo: no imports from any external private codebase.

Layout: <<PACKAGE>>/ (empty __init__.py), <<DATA_DIR>>/, tests/, runs/
(gitignored with .env and __pycache__), requirements.txt
(<<DEPS_FROM_MENU>>), README.md stub with the Decision Block pasted in.
```
**Accept:** tree matches; `pip install -r requirements.txt` clean.
**Commit:** `chore: repo scaffold + conventions [AI-generated]`

## P1 — Data model + loader (TDD)

```
Implement the core data model and loader, tests first.

<<PASTE: entity list + fields + validation rules from Phase B>>

Write tests/test_model.py first: valid input loads; each missing required
field raises ValueError naming the field; duplicate ids raise; <<DOMAIN
VALIDATION CASES>>. Then implement <<PACKAGE>>/model.py to make them pass.
Loader reads UTF-8 JSON (<<or the partner's format>>).
```
**Accept:** model tests green.
**Commit:** `feat(model): data model + fail-fast loader [AI-generated]`

## P2 — Core engine (the heart; budget the most care here)

```
Implement <<CORE_MODULE>> strictly tests-first.

<<PASTE: formulas / state transitions / ranking rules AS SPEC TEXT, plus the
full test-case list — this is the invariant core from the Decision Block>>

Write tests covering every listed case BEFORE implementing. Pure functions
only — no network, no file I/O in this module. Deterministic where math
allows (seeded randomness). <<ROUNDING/SCHEMA RULES>>.
```
**Accept:** all core tests green; run twice to confirm determinism.
**Commit:** `feat(core): <<name>> engine, TDD [AI-generated]`

## P3 — Provider layer (thin, own code)

```
Implement <<PACKAGE>>/providers.py: a minimal provider abstraction.

- ChatRequest/ChatResponse as frozen dataclasses.
- Engines: <<FROM BUDGET TABLE — model ids, env var names, fallback keys
  rotated on quota errors>>.
- One function: chat(engine, req) -> ChatResponse; lazy SDK imports; raise
  on unknown engine listing valid ones.
No retries here (the pipeline owns retry policy). Unit-test only
registry/dispatch with mocks — no live calls in tests.
```
**Accept:** tests green; one manual live smoke per engine (1 call each).
**Commit:** `feat(providers): thin multi-engine layer [AI-generated]`

## P4 — Pipeline / run loop

```
Implement the <<sampler|agent loop|ingest pipeline|request pipeline>> per
this spec, plus tests for the pure parts using a fake chat function.

<<PASTE: loop spec — iteration order, retry policy (fail fast on config
errors, retry transient), pause/rate limits, on_progress/on_record hooks>>

Every successful unit of work is appended to runs/*.jsonl the moment it
completes (crash-safe), with flush. Cost/usage accounting per <<BUDGET
TABLE prices>>. All prints via callers, flush=True.
```
**Accept:** unit tests green; live micro-run (smallest possible) writes
JSONL incrementally.
**Commit:** `feat(pipeline): crash-safe streaming run loop [AI-generated]`

## P5 — Report/output + CLI

```
Implement <<PACKAGE>>/report.py and cli.py.

build_report(...) returns versioned JSON (schema_version "0.1"):
<<REPORT FIELDS from Phase B — always include: inputs echo, core results,
honesty metrics (CIs/error counts/coverage), cost, errors>>.
render_markdown(report) produces a human digest: <<DIGEST SHAPE>>.

CLI: run (executes pipeline, streams to runs/, writes _report.json + .md,
prints digest, exit 1 on zero successes) · score/replay (rebuild report
offline from saved JSONL).
```
**Accept:** full smoke run produces JSONL + both reports; replay reproduces
the report from JSONL alone.
**Commit:** `feat(report,cli): versioned report + digest [AI-generated]`

## P6 — Product surface (API / MCP / UI)

```
Implement the product surface: <<FastMCP tool(s) | FastAPI endpoints |
Streamlit page>> per Phase B.

<<PASTE: tool/endpoint signatures + docstrings — one primary action, not
twenty. Errors return JSON {"error": ..., actionable fields}, never a
traceback. Results saved under runs/ and re-fetchable by id.>>
```
**Accept:** surface smoke-tested end-to-end against a saved run.
**Commit:** `feat(surface): <<mcp|api|ui>> product surface [AI-generated]`

## P7 — Demo page + deploy

```
Create the public demo artifact: <<static HTML report page | hosted API docs
| hosted UI>> rendering the latest real run, mobile-readable, no build step.
Then a deploy config for <<TARGET>> with health endpoint.
```
**Accept:** public URL serves real data; health returns 200.
**Commit:** `feat(deploy): live demo URL [AI-generated]`

## P8 — Domain value layer (the partner deliverable)

```
Generate the concrete artifact the partner/judges keep:
<<e.g. archetype C: fix package (llms.txt + JSON-LD + top-5 action brief);
archetype A: curated answer pack; archetype B: automated-run transcript +
ROI sheet>> — generated live from the real run data, with a validator.
```
**Accept:** artifact validates; Product Lead approves it as pitch-ready.
**Commit:** `feat(value): partner deliverable generator [AI-generated]`

## P9 — Product guardrails + eval gate

Full prompt card lives in `10_HARNESS_GUARDRAILS.md` (archetype-specific
rails + smoke-eval). Run after P6, before Gate 3 if possible — the
negative-path demo it produces goes in the video.
**Commit:** `feat(guardrails): boundary validation + rails + smoke eval [AI-generated]`

---

# PRE-FILLED SLOTS — AIZ Legal-KG (Điều 95 NĐ174 ↔ Điều 101 NĐ15)

Giá trị slot đã chốt pre-event. Tại H0 chỉ cần dán vào skeleton tương ứng;
số liệu pháp lý lấy nguyên văn từ `data/nd174_trich.md`, spec chi tiết trong
`13_DOMAIN_BRIEF.md`.

## Slot chung

| Slot | Giá trị |
|---|---|
| `<<PRODUCT_NAME>>` | `legal-radar` (đổi tại H0 nếu team có tên hay hơn) |
| `<<ONE_SENTENCE_FROM_DECISION_BLOCK>>` | Dashboard giám sát cho cán bộ: KG điều–khoản–điểm NĐ174/2026, phát hiện thảo luận MXH liên quan vi phạm Điều 95, xác định chủ thể + khung phạt, diff với NĐ15/2020 |
| `<<CORE_MODULE>>` | `legal_radar/engine.py` (matching + phạt + diff — pure) |
| `<<PACKAGE>>` | `legal_radar` |
| `<<DATA_DIR>>` | `data/` (chứa `kg_nodes.json`, `kg_edges.json`, `comments_batch*.json`, `study_cases.json`, `facts_corpus.json`) |
| `<<DEPS_FROM_MENU>>` | `fastapi uvicorn jinja2 pydantic python-dotenv pytest httpx google-genai groq` |
| `<<ARCHETYPE_SPECIFIC_INVARIANTS>>` | (1) Mọi kết luận hiển thị PHẢI kèm trích dẫn "điểm X, khoản Y, Điều Z — NĐ số"; không có trích dẫn → không hiển thị. (2) Nhãn phân loại là enum đóng: `dung / hieu_lam / can_kiem_chung` — KHÔNG tồn tại nhãn "vi phạm". (3) Mức phạt cá nhân LUÔN được suy từ mức tổ chức × 1/2 (Điều 4 k3) — không hard-code 2 con số độc lập. |

## P1 filled — Data model KG

```
Entity list (frozen dataclasses, loader từ data/kg_nodes.json + kg_edges.json):

- VanBan: id, so_hieu ("174/2026/NĐ-CP"), ngay_hieu_luc, trang_thai (hieu_luc/het_hieu_luc)
- DieuKhoan: id, van_ban_id, dieu (int), khoan (int|None), diem (str|None),
  noi_dung (nguyên văn) — id dạng "nd174-d95-k1-a"
- HanhVi: id, dieu_khoan_id, mo_ta, nhom ("tin_gia" | "boc_phot" | "khac")
- ChuThe: loai ("ca_nhan" | "to_chuc"), mo_ta_nhan_dien (KOL/tiktoker vs
  fanpage doanh nghiệp/hội nhóm — theo Điều 2)
- MucPhat: dieu_khoan_id, min_vnd, max_vnd, ap_dung_cho ("to_chuc" —
  mức cá nhân KHÔNG lưu, luôn derive = 1/2 qua hàm pure)
- BienPhapKhacPhuc: dieu_khoan_id, mo_ta, pham_vi ("k1_k2" | "k2_only")
- NguonTin (facts corpus — Dual-RAG tầng 2, xem 13_DOMAIN_BRIEF §5b):
  id, tier (0|1|2), nguon, tieu_de, noi_dung_tom_tat, ngay_dang, url

Edges: THAY_THE (from_dieu_khoan → to_dieu_khoan, dien_giai diff),
QUY_DINH_TAI (HanhVi → DieuKhoan), AP_DUNG_CHO (MucPhat → ChuThe).

Domain validation cases (tests bắt buộc):
- diem chỉ hợp lệ khi có khoan; khoan chỉ hợp lệ khi có dieu
- id trùng → ValueError nêu id
- MucPhat min > max → ValueError
- edge trỏ tới id không tồn tại → ValueError nêu edge
- nhãn nhom/loai ngoài enum → ValueError
```

## P2 filled — Core engine (invariant core, kỹ nhất)

```
legal_radar/engine.py — pure functions, no I/O, no LLM call:

1. muc_phat_cho_chu_the(muc_phat, loai_chu_the) -> (min_vnd, max_vnd)
   — to_chuc: giữ nguyên; ca_nhan: chia đôi (Điều 4 k3 NĐ174).
   Tests: 20-30tr → 10-15tr; 30-50tr → 15-25tr; input âm → ValueError.

2. match_hanh_vi(claim_keywords, kg) -> list[HanhVi] xếp theo độ khớp
   — keyword/BM25 thuần trên mo_ta + noi_dung (LLM chỉ dùng ở P4 để
   trích keywords, KHÔNG ở đây). Tests: "tin giả" → d95-k1-a;
   "gây hoang mang" → d95-k2-c; "bóc phốt xúc phạm" → d95-k1-a;
   query rỗng → [].

3. phan_loai_claim(claim, matched, kg) -> Nhan(dung|hieu_lam|can_kiem_chung)
   + ly_do + trich_dan (bắt buộc non-empty khi nhãn != can_kiem_chung)
   — luật phân loại đóng, liệt kê đủ trong 13_DOMAIN_BRIEF.md §bộ-bình-luận:
   (a) claim nêu đúng khung + đúng chủ thể → dung
   (b) claim gán khung tổ chức cho cá nhân hoặc ngược lại → hieu_lam
   (c) claim dùng khung NĐ15 sau 01/7/2026 → hieu_lam (nhầm quy định cũ)
   (d) không match được hành vi hoặc thiếu dữ kiện chủ thể → can_kiem_chung
   Tests: mỗi luật ≥2 case, cả biên (claim nêu "20-30 triệu" không nói
   chủ thể → can_kiem_chung, không đoán).

4. diff_thay_the(edge, kg) -> DiffRow(hanh_vi, to_chuc_cu, to_chuc_moi,
   ca_nhan_cu, ca_nhan_moi, bien_phap_moi) — Tests: cặp Đ101 NĐ15 ↔ Đ95
   NĐ174 ra đúng bảng trong data/nd174_trich.md.

5. xep_uu_tien(items) -> sorted — key: (nhãn hieu_lam trước, độ lan truyền
   mock desc, thời gian desc). Deterministic, test bằng fixture.

6. xac_thuc_nguon(claim_keywords, facts_corpus, thoi_gian_claim)
   -> NhanNguon(co_nguon_xac_nhan | co_bac_bo_chinh_thuc | chua_tim_thay_nguon)
   + matched_docs — BM25/keyword thuần, quy tắc hợp nhất theo tier
   (13_DOMAIN_BRIEF §5b): xác nhận cần ≥1 Tier0 hoặc ≥2 Tier1/2 độc lập;
   bác bỏ chỉ Tier0/1 và ngay_dang > thoi_gian_claim.
   Tests BẮT BUỘC (đúc từ 2 kịch bản ask.txt, expected đã sửa):
   - claim khớp công bố Tier0 có trước → co_nguon_xac_nhan (chống phạt oan
     — dù chứa từ khóa nhạy cảm "kiểm soát đặc biệt")
   - claim có bài bác bỏ Tier0 đăng SAU → co_bac_bo_chinh_thuc; nhãn tổng
     đề xuất vẫn là gợi ý + ưu tiên cao, KHÔNG phải "vi phạm/100% sai"
   - bài bác bỏ đăng TRƯỚC thời gian claim → KHÔNG tính là bác bỏ
   - không match gì → chua_tim_thay_nguon (trung tính — không phải
     "nghi vấn sai độ tin cậy cao")
   - corpus rỗng → chua_tim_thay_nguon, không crash

7. Tích hợp: nhan_nguon feed vào ly_do của phan_loai_claim; claim kêu gọi
   hành động ("rút tiền nhanh") + chua_tim_thay_nguon → xep_uu_tien đẩy
   top hàng đợi (escalation là hành vi của HỆ THỐNG; kết luận là của cán bộ).
```

## P4 filled — Ingest + batch pipeline

```
- ingest_vanban: parse data/nd174_trich.md + (TODO) nd15_trich.md →
  kg_nodes/kg_edges JSON; chạy 1 lần, human verify output rồi FREEZE
  (commit file JSON đã duyệt — LLM extraction sai điều khoản là rủi ro #2).
- ingest_facts: data/facts_corpus_notes.md → facts_corpus.json (snapshot
  tĩnh 10-20 doc, tier gắn tay lúc soạn, freeze như KG luật — KHÔNG crawl
  live trong 48h; kiến trúc chừa interface cắm crawler sau).
- ingest_comments: đọc comments_batch*.json (bộ mô phỏng, 3 nhóm) →
  với mỗi comment: LLM trích (claim, keywords, chủ thể nếu nêu) →
  engine.phan_loai_claim → append runs/queue.jsonl (crash-safe, flush).
- Nút/CLI "Cập nhật dữ liệu mới" nạp batch kế tiếp → mô phỏng luồng
  giám sát tự động chảy vào queue (không upload thủ công).
- Retry: fail-fast lỗi config; retry 2 lần lỗi transient; comment lỗi
  LLM → nhãn can_kiem_chung + error ghi vào record (không drop).
```

## P6 filled — Dashboard 3 màn (KHÔNG chatbot) + Q&A API phụ

```
FastAPI + Jinja2 server-rendered, không SPA:

1. GET /  — Hàng đợi giám sát (màn mặc định): bảng items từ
   runs/queue.jsonl qua engine.xep_uu_tien; cột: tóm tắt, nhãn (badge),
   chủ thể, trích dẫn ngắn, thời gian; filter theo nhãn/nhóm hành vi.
2. GET /case/{id} — Hồ sơ đối tượng: chủ thể (cá nhân/tổ chức + căn cứ
   nhận diện), hành vi khớp (điểm/khoản/điều + nguyên văn), khung phạt
   THEO CHỦ THỂ (hiện cả 2 cột + rule 1/2), biện pháp khắc phục, panel
   diff cũ/mới (THAY_THE), lý do gắn nhãn + **panel nguồn tin** (nhãn
   nguồn 3 mức + matched docs kèm link/ngày — Dual-RAG tầng 2). Kèm form
   nhập ad-hoc (POST /case/adhoc) — tính năng phụ, không phải luồng chính.
3. GET /verify — Tầng kiểm chứng: bảng so sánh từng study case
   (data/study_cases.json): kết luận hệ thống vs quyết định xử phạt
   thật đã công bố (điều khoản viện dẫn + mức phạt), cột khớp/lệch.
4. POST /api/qa — Q&A API phụ: {"question": ...} → {"answer", "citations":
   [≥1 bắt buộc], "label"} ; không đủ căn cứ → refuse có cấu trúc
   (P9 rail). Errors: JSON, không traceback.
```

## P8 filled — Deliverable cho cán bộ

```
Báo cáo tổng hợp xuất từ runs/queue.jsonl: số item theo nhãn/nhóm hành vi,
top hiểu lầm lặp lại, điều khoản bị viện dẫn sai nhiều nhất, bảng diff
cũ/mới, kết quả kiểm chứng study case — render markdown + HTML tĩnh
(in được, đính kèm pitch). Validator: báo cáo thiếu trích dẫn ở bất kỳ
kết luận nào → exit 1.
```
