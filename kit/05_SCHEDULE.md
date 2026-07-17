# 05 — Schedule: %-based blocks + milestone gates

Percentages of the build window so the same plan works for 24 h or 48 h.
Fill the absolute times once the window is known. Gates are **blocking**
(charter rule 4) and each has a binary card in `12_GO_NO_GO.md` — GATE 1 = G1,
GATE 2 = G2, GATE 3 = G3; video export = G4; submit = G5.

| % of window | 24 h | 48 h | Block | Output | Owner |
|---|---|---|---|---|---|
| 0–2% | H0–0.5 | H0–1 | Triage (`02_PROBLEM_INTAKE`) + BOOTSTRAP Phase A/B | Decision Block committed | All |
| 2–8% | H0.5–2 | H1–4 | Pivot-surface prep + P0 | Domain data drafted; repo scaffolded; hello-world deployed | Data + Builder-1 |
| 8–15% | H2–3.5 | H4–7 | **P1–P2 core sprint** | data model + core engine, tests green | Builder-1 |
| **GATE 1 (15%)** | H3.5 | H7 | — | **Core engine green.** Behind → cut list item 1 | Tech Lead |
| 15–25% | H3.5–6 | H7–12 | P3–P4 | providers live-smoked; pipeline streams JSONL | Both |
| 25–35% | H6–8.5 | H12–17 | **First real run** (+ overnight on 48 h) + P5 | baseline result with honesty metrics = the demo data | Data |
| **GATE 2 (35%) — SCOPE FREEZE** | H8.5 | H17 | — | **End-to-end happy path.** After this: cut-only | Product Lead |
| 35–50% | H8.5–12 | H17–24 | P6 surface + P7 deploy | live URL with real data | Builder-1 |
| **GATE 3 (50%)** | H12 | H24 | — | **Deployed URL up.** Behind → static-HTML fallback now | Tech Lead |
| 50–65% | H12–15.5 | H24–31 | P8 value layer + second run / bigger N | partner deliverable; stronger numbers | Data + Product |
| 65–80% | H15.5–19 | H31–38 | Slides v1 + **video shoot & edit** | final MP4 ≤ limit | Pitcher |
| 80–90% | H19–21.5 | H38–43 | Log curation + repo hygiene + rehearsal ×2 | collab log final; no secrets; pitch ≤ time | All |
| 90–95% | H21.5–23 | H43–46 | **SUBMIT** everything | all deliverables in | Pitcher |
| 95–100% | H23–24 | H46–48 | Buffer + encore prep | live-demo fallback rehearsed | All |

## Standing schedule rules

- **Code stops at 65%.** After that, only P8-polish and demo fixes with Tech
  Lead sign-off. The last third sells the first two-thirds.
- **Submit at 95%, not 100%.** Upload portals die at deadline minus five minutes.
- **Sleep in shifts** (48 h: min 4 h/person/night). Pin gate reviews to the
  schedule, not to "when we finish".
- **Overnight runs** (archetype C/A): start before the sleep shift, crash-safe
  JSONL mandatory, one person on watch rotation.

## Cut list (đã chốt pre-event cho AIZ Legal-KG — ordered)

1. **Tab kiểm chứng interactive → bảng HTML tĩnh** so sánh "kết luận hệ
   thống vs quyết định xử phạt thật" (giữ nội dung, bỏ tương tác)
2. **Biểu đồ xu hướng live → chart tĩnh** render 1 lần từ mock data
3. **Q&A API tự do → preset queries** (5–7 câu hỏi mẫu có sẵn đáp án từ KG)
4. **Never cut:** KG core + rule 1/2 (Điều 4 k3), citation bắt buộc,
   hàng đợi giám sát, tests, collab log, video.

> Window 48h → dùng cột "48 h" trong bảng trên. Thời gian tuyệt đối
> (ngày/giờ thực): {{TODO-EVENT: điền khi BTC công bố lịch}}.
