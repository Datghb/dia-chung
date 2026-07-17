# 02 — Problem Intake: 30-minute triage at reveal

Hard timebox: **30 minutes** from problem release to a committed Decision
Block. The AI (via BOOTSTRAP Phase A) drafts; humans confirm. Deadlock →
Product Lead decides at minute 25.

## Step 1 — Decompose the problem (10 min)

Answer in one or two lines each:

1. **Who hurts?** (specific user/business, not "everyone")
2. **When does it hurt?** (the moment/frequency — natural frequency matters
   for the demo story)
3. **What does it cost them?** (time, money, risk — get a number if the
   brief has one)
4. **What data/assets did the organizers give?** (dataset, API, partner
   brand, domain) — the demo must use the *real* asset if one exists.
5. **What would the judges' "wow" be?** — draft the **demo moment**: the
   single number, artifact, or live interaction that proves the solution in
   under 30 seconds.

## Step 2 — Score archetype fit (10 min)

Score each archetype in `03_ARCHITECTURE_MENU.md` 1–5 for this problem:

| Archetype | Fit (1–5) | Why |
|---|---|---|
| A. RAG / knowledge app | | |
| B. Agent / workflow automation | | |
| C. Measurement / scoring engine | | |
| D. LLM API service / integration layer | | |
| E. AI UI / copilot | | |

Rules of thumb: ≥4 on one archetype → take it. Two tie at 3–4 → take the one
with the stronger **demo moment**. Nothing ≥3 → re-read the problem; you are
solving the wrong problem, not missing an archetype. Hybrids are allowed but
one archetype must be primary (it owns the core engine).

## Step 3 — Invariant core vs pivot surface (5 min)

Write one line each:

- **Invariant core:** the engine/math/loop that would survive any problem
  statement in this domain (this is what P2 builds and what gates protect).
- **Pivot surface:** the domain-specific data, prompts, category, or config
  that adapts the core to THIS problem (cheap to change — 30 min max).

> Principle (proven at VAIC): **the pivot is the surface, not the product.**
> If mid-event the direction feels wrong, change the surface. Touching the
> core after Phase B means you chose the wrong archetype — a Product Lead
> call, and it costs a gate.

## Step 4 — Commit the Decision Block (5 min)

```markdown
## DECISION BLOCK — {{EVENT}} H0+30min
- Problem (one sentence): ...
- Who hurts / cost: ...
- Track chosen: ...  (fallback: ...)
- Archetype: X (score N/5) — primary; hybrid notes: ...
- Invariant core: ...
- Pivot surface: ...
- Demo moment: "..."
- Explicitly NOT building: ... (first 3 cut-list items)
- Confirmed by: Product Lead ✔ Tech Lead ✔  — timestamp
```

Paste the block into the repo README and the collab log. Direction is now
frozen (see charter rule 2).

---

# PRE-FILLED DRAFT — đề bài đã công bố sớm (verify lại tại H0 nếu brief đổi)

Đề bài: **"Legal knowledge graph — Tracking new regulations & public
Discourse"** (CÔNG TY CỔ PHẦN AIZ). Phân tích chi tiết trong
`13_DOMAIN_BRIEF.md`; dữ liệu đã verify trong `data/nd174_trich.md`.

## Step 1 draft — Decompose

1. **Who hurts?** Cán bộ cơ quan quản lý nhà nước (Sở TT&TT, Cục PTTH&TTĐT)
   phải giám sát và chế tài vi phạm thông tin trên MXH.
2. **When?** Liên tục — từ 01/7/2026 NĐ174 có hiệu lực, thảo luận/hiểu lầm
   về mức phạt mới bùng lên trên MXH; cán bộ hiện phải tra cứu thủ công
   từng vụ.
3. **Cost?** Xử lý chậm → tin giả lan rộng; viện dẫn sai điều khoản/mức
   phạt (đặc biệt bẫy cá nhân vs tổ chức) → quyết định xử phạt bị khiếu nại.
4. **Assets?** Toàn văn NĐ 174/2026 (docx có sẵn), NĐ 15/2020 (TODO tải),
   1–2 quyết định xử phạt công khai (TODO sưu tầm).
5. **Demo moment:** xem Decision Block dưới.

## Step 2 draft — Archetype fit

| Archetype | Fit (1–5) | Why |
|---|---|---|
| A. RAG / knowledge app | **5** | Lõi bài toán: KG điều–khoản–điểm + trả lời có trích dẫn — PRIMARY |
| B. Agent / workflow automation | 2 | Không cần planning loop; pipeline phân loại tuyến tính là đủ |
| C. Measurement / scoring engine | 3 | Có yếu tố phân loại/xếp ưu tiên nhưng không phải scoring thống kê |
| D. LLM API service | 2 | Q&A API chỉ là endpoint phụ |
| E. AI UI / copilot | **4** | Dashboard cán bộ là mặt tiền sản phẩm — HYBRID secondary |

## Step 4 — DECISION BLOCK (draft, chờ xác nhận H0)

```markdown
## DECISION BLOCK — AIZ Legal-KG hackathon, H0+30min (DRAFT pre-event)
- Problem (one sentence): Cán bộ quản lý nhà nước thiếu công cụ giám sát chủ
  động các vi phạm tin giả/bóc phốt trên MXH và tra nhanh đúng điều-khoản-điểm
  + khung phạt theo chủ thể khi NĐ174/2026 thay NĐ15/2020 từ 01/7/2026.
- Who hurts / cost: Sở TT&TT / cơ quan quản lý — xử lý chậm, viện dẫn sai mức
  phạt (bẫy cá nhân=1/2 tổ chức, Điều 4 k3) → quyết định bị khiếu nại.
- Track chosen: Legal knowledge graph — Tracking new regulations & public
  discourse (fallback: thu hẹp còn feature 1+2+4, bỏ social monitoring).
- Archetype: A (5/5) — primary; hybrid E (4/5): dashboard cán bộ 3 tầng,
  KHÔNG phải chatbot.
- Invariant core: KG schema (VanBan/DieuKhoan/HanhVi/ChuThe/MucPhat/
  BienPhapKhacPhuc + edge THAY_THE/QUY_DINH_TAI/AP_DUNG_CHO) + claim/subject
  matching kèm trích dẫn bắt buộc + rule mức phạt cá nhân = 1/2 tổ chức.
- Pivot surface: phạm vi điều khoản (Đ95 NĐ174 ↔ Đ101 NĐ15), bộ bình luận
  mô phỏng, study case kiểm chứng.
- Demo moment: "Mở 1 item trong hàng đợi giám sát: bình luận 'cá nhân share
  tin giả bị phạt 20-30 triệu' → hồ sơ đối tượng tự gắn nhãn 'hiểu lầm —
  20-30tr là mức TỔ CHỨC; cá nhân 10-15tr theo Điều 4 khoản 3' kèm trích dẫn
  điểm a khoản 1 Điều 95 + bảng diff cũ/mới; chuyển tab kiểm chứng: hệ thống
  tái lập đúng mức phạt của 1 vụ xử phạt thật đã công bố."
- Explicitly NOT building: (1) quét fanpage thật/góc bản quyền điểm d — rủi
  ro pháp lý: gắn nhãn vi phạm lên fanpage có tên = tự vi phạm điểm a, và
  không thể xác minh licensing trong 48h; (2) case management/phân công;
  (3) biểu đồ xu hướng live (chart tĩnh từ mock).
- Confirmed by: Product Lead ☐ Tech Lead ☐  — {{TODO-EVENT: timestamp}}
```
