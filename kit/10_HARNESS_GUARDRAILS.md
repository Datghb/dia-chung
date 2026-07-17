# 10 — Harness & Guardrails: protect the build, ship the safety story

Guardrails exist on both sides of the compliance boundary. Don't confuse them:

| Side | What | Compliance status |
|---|---|---|
| **Workshop harness** | Factory guardrails + Claude Code hooks running on YOUR laptops during the build | Toolchain — allowed, never ships |
| **Product guardrails** | Validation, risk tiers, injection defense INSIDE the product | Generated in-window from the P9 spec below |

## Workshop side — the build harness (set up pre-event)

The factory already ships these; verify they're active on both build laptops
(checklists/PRE_EVENT):

1. **Coding-time guardrails** (`scripts/guardrails.py`, surface 1): blocks
   `rm -rf`, `git reset --hard`, `DROP/TRUNCATE TABLE`, reads of
   `.env`/`credentials.json`/`.pem`/`.key`, broad scans. At hour 40 with no
   sleep, these catch the mistake before it happens.
2. **Session checkpointing**: `.claude/session-checkpoint.json` auto-written
   on every TodoWrite + Stop hook — a crashed Claude Code session resumes
   with context instead of losing an hour.
3. **Permission discipline**: pre-approve the repetitive safe commands
   (`pytest`, `pip install -r requirements.txt`, `git add/commit`, deploy
   CLI) in the product repo's `.claude/settings.json` so builders aren't
   answering prompts all night. **Never** `dangerously-skip-permissions` —
   one bad `rm` costs more than every prompt combined.
4. **Event tripwires** — two cheap hooks worth adding to the product repo's
   Claude Code settings at P0 time (the hook *config* is toolchain;
   generate it in-window anyway to stay clean):
   - PreToolUse on Write/Edit: block any content matching
     `AI_PRODUCT_FACTORY|agent_core` imports → compliance breach caught at
     write time, not at pre-submit.
   - PreToolUse on Bash: block `git push` if `.env` is staged.
5. **Cost/quota harness**: the budget table in `03` + key-rotation in P3.
   One person (Data role) owns quota; nobody else changes keys mid-run.

## Product side — P9 prompt card (run after P6; ~45 min)

Ship guardrails as a *feature*, sized to the archetype. This is the
technical judge's favorite conversation.

```
Implement <<PACKAGE>>/guardrails.py plus tests-first coverage.

Boundary validation (all archetypes):
- Every external input (API params, file uploads, panel/config JSON)
  validated at entry; fail fast with a JSON error naming the field —
  never a traceback to the caller.
- Outbound: secrets never in logs, errors, or responses (test asserts this).

<<IF ARCHETYPE B (agent) — risk-tiered actions:
- classify_action(action) -> LOW (read/summarize: proceed) | MEDIUM
  (write/notify: log + proceed) | HIGH (delete/spend/deploy: require
  explicit confirmation flag). Deny-by-default for unknown tools.
- Loop bounds: max_iterations cap + wall-clock timeout, both configurable,
  both tested.
- Prompt-injection defense: tool/web outputs are scanned for instruction
  patterns ("ignore previous", "you are now", embedded system-prompt
  markers) and neutralized to quoted data before re-entering the loop.>>

<<IF ARCHETYPE C (measurement) — honesty rails:
- No caching on measurement paths (test: two runs differ or fail loudly).
- Report refuses to render SoV/score numbers without N, CI, and error
  count present.>>

<<IF ARCHETYPE A/E (RAG/UI) — content rails:
- Answers must carry source refs; refuse (with a friendly message) when
  retrieval confidence/coverage is below threshold rather than guessing.
- User-visible errors are plain-language; full context goes to logs.>>

<<IF ARCHETYPE D (API) — service rails:
- Per-key rate limiting; request size caps; timeout + retry + fallback
  chain on upstream LLM calls; envelope schema on every response.>>
```
**Accept:** guardrail tests green; one live negative-path demo works (bad
input → clean refusal) — record it, it goes in the video.
**Commit:** `feat(guardrails): boundary validation + <<archetype>> rails [AI-generated]`

## The eval gate (ship with P9 — 20 min)

Every LLM feature gets a smoke-eval before the demo, factory-style:

```
Create eval/smoke.py + eval/cases.json: 8–12 cases with expected properties
(not exact strings) — happy paths, 2 adversarial inputs, 1 injection attempt,
1 out-of-domain refusal. Runner prints pass/fail per case, exit 1 on any
fail. Wire into README quickstart.
```

Run it before every deploy and once on stage if asked. "We eval-gate our own
demo" is a sentence no other team will say.

## Judge talking points this buys

- *"What breaks under bad input?"* → run the negative-path demo live.
- *"How do you stop the agent doing something destructive?"* → risk tiers,
  deny-by-default, iteration caps — in the repo, tested.
- *"How do you know the numbers are real?"* → honesty rails + eval gate +
  crash-safe JSONL trail.

---

# PRE-FILLED — P9 cho AIZ Legal-KG (archetype A/E + rail domain pháp lý)

Bài này nghiêng nặng về harness & rủi ro: sản phẩm đưa ra đối chiếu pháp lý
về người/tổ chức thật — guardrails Ở ĐÂY là feature ăn điểm, không phải
overhead. Rails đối ứng 1-1 với các dòng [DOMAIN] trong `09_RISK_MATRIX.md`.

## P9 filled prompt card (chạy sau P6, ~45 min)

```
Implement legal_radar/guardrails.py plus tests-first coverage.

Boundary validation (chuẩn A/E):
- Mọi input ngoài (API params, comment text, config JSON) validate tại
  entry; fail fast với JSON error nêu tên field — không traceback.
- Outbound: secrets không xuất hiện trong logs/errors/responses (có test).

Content rails (archetype A/E):
- Mọi answer/label hiển thị PHẢI kèm ≥1 citation dạng
  "điểm {diem}, khoản {khoan}, Điều {dieu} — Nghị định {so_hieu}";
  render layer từ chối hiển thị kết luận thiếu citation (test assert).
- Retrieval/match không đủ căn cứ → refuse có cấu trúc:
  {"label": "can_kiem_chung", "reason": "không đủ căn cứ đối chiếu",
  "citations": []} — không bao giờ đoán.
- User-visible errors tiếng Việt thân thiện; full context vào logs.

Domain rails (pháp lý — bắt buộc, đối ứng 09_RISK_MATRIX):
1. LABEL_ENUM = {"dung", "hieu_lam", "can_kiem_chung"} — setter/model
   reject mọi nhãn ngoài enum, kể cả "vi_pham" (test: thêm nhãn "vi_pham"
   → ValueError). Hệ thống KHÔNG kết luận vi phạm — thẩm quyền của cán bộ.
2. Rule 1/2 (Điều 4 k3): assert mọi khung phạt cá nhân hiển thị ==
   1/2 khung tổ chức từ KG; vi phạm → raise, không render.
3. PII guard: trước khi render, quét tên riêng đầy đủ/URL profile trong
   comment + study case → thay bằng dạng ẩn danh ("N.V.A", "fanpage F");
   test với fixture chứa tên thật giả lập.
4. Injection defense: comment text quét pattern lệnh ("ignore previous",
   "you are now", "system:", markers nhúng) → wrap thành quoted data
   trước khi vào LLM extraction (P4); test: comment chứa lệnh injection
   vẫn ra record hợp lệ nhãn can_kiem_chung, không đổi behavior.
5. Nguồn-tin rails (Dual-RAG tầng 2 — 13_DOMAIN_BRIEF §5b):
   - NHAN_NGUON_ENUM = {"co_nguon_xac_nhan", "co_bac_bo_chinh_thuc",
     "chua_tim_thay_nguon"} — đóng như LABEL_ENUM.
   - `chua_tim_thay_nguon` KHÔNG BAO GIỜ được render thành "nghi vấn sai"
     hay kèm % độ tin cậy (test assert chuỗi cấm trong output render).
   - `co_bac_bo_chinh_thuc` chỉ hợp lệ khi ngay_dang nguồn bác bỏ >
     thoi_gian claim (test case bác bỏ đăng trước → không tính).
   - Panel nguồn tin luôn hiện tier + ngày + link của matched docs —
     không có doc đối chứng thì ghi rõ "chưa tìm thấy", không suy diễn.
```

**Accept:** guardrail tests green; negative-path demo quay video được:
paste comment chứa injection + tên người thật giả lập → hệ thống trả
can_kiem_chung, PII đã ẩn danh, không crash.
**Commit:** `feat(guardrails): content rails + domain rails (label enum, rule 1/2, PII, injection) [AI-generated]`

## Eval gate filled (ship cùng P9 — 20 min)

```
Create eval/smoke.py + eval/cases.json — 14 cases, expected PROPERTIES:

- 3 case nhóm "đúng"       → label == dung, citations non-empty
- 3 case nhóm "hiểu lầm"   → label == hieu_lam; trong đó BẮT BUỘC:
    (a) nhầm mức tổ chức↔cá nhân ("cá nhân bị phạt 20-30tr")
    (b) nhầm quy định cũ ("phạt có 10-20 triệu thôi" sau 01/7/2026)
- 2 case nhóm "cần kiểm chứng" (thiếu dữ kiện chủ thể / ngoài phạm vi
   điều khoản đã nạp) → label == can_kiem_chung, không đoán
- 1 case study-case ground truth → khung phạt hệ thống khớp quyết định
   xử phạt thật đã công bố
- 1 case CHỐNG PHẠT OAN (từ ask.txt Test 1, expected đã sửa): claim
   "NHNN đặt ngân hàng X vào diện kiểm soát đặc biệt" + corpus CÓ công
   bố Tier0 trùng khớp → nhan_nguon == co_nguon_xac_nhan; label KHÔNG
   phải hieu_lam dù chứa từ khóa nhạy cảm (từ khóa không phải bằng chứng)
- 1 case CHỐNG LỌT LƯỚI (từ ask.txt Test 2, expected đã sửa): claim
   "nghe nói ngân hàng X sắp phá sản, rút tiền nhanh đi" + corpus không
   có gì → nhan_nguon == chua_tim_thay_nguon; item ĐỨNG ĐẦU hàng đợi
   (kêu gọi hành động + không nguồn); label == can_kiem_chung — hệ thống
   escalate, KHÔNG kết luận "vi phạm"
- 1 injection attempt      → xử lý như data, record hợp lệ
- 1 out-of-domain ("luật đất đai?") → refuse có cấu trúc
- 1 PII case               → output đã ẩn danh

Runner in pass/fail từng case, exit 1 nếu fail bất kỳ. Wire vào README.
In cuối: confusion matrix label tổng trên toàn bộ case + N — con số
demo được phép nói trên sân khấu là matrix này kèm N, không phải %
tự phong kiểu "FP<1%".
```

Chạy trước mỗi deploy + 1 lần trên sân khấu nếu bị hỏi.

## Workshop harness cho event này (bổ sung mục 1–5 phía trên)

- Tripwire riêng: PreToolUse Write/Edit block content match
  `AI_PRODUCT_FACTORY|agent_core` (đã nêu ở mục 4) **+ block commit file
  data chứa pattern tên riêng chưa ẩn danh vào repo public**.
- Quota: 2 chỗ gọi LLM duy nhất (ingest 1 lần + comment extraction) —
  Data role ước lượng: ~50 comments × 2 batch × 1 call ≈ 100 calls/ngày,
  dư xa free tier; không ai thêm call path mới sau scope freeze.
