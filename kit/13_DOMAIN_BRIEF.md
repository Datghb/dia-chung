# 13 — Domain Brief: Dashboard giám sát vi phạm MXH trên KG Điều 95 NĐ174/2026

> File AI đọc tại H0 cùng BOOTSTRAP. Đây là **knowledge, not code** — spec
> chưng cất từ phân tích pre-event (debate 2 vòng + đối chiếu văn bản gốc).
> Số liệu pháp lý: `data/nd174_trich.md` (đã verify với docx toàn văn).
> Decision Block draft: cuối `02_PROBLEM_INTAKE.md`.

## 1. Bài toán & hướng đi đã chốt

**Đề bài:** "Legal knowledge graph — Tracking new regulations & public
Discourse" (AIZ). **Persona:** cán bộ cơ quan quản lý (Sở TT&TT) cần tracking
kịp thời vi phạm tin giả / bóc phốt trên MXH để xử lý, chế tài.

**Sản phẩm = DASHBOARD quản lý cho cán bộ, KHÔNG phải chatbot.**
Q&A API chỉ là 1 endpoint phụ kèm citation (đáp ứng yêu cầu 7 của đề).

**Hybrid 3+1 — ba tầng dashboard** (kết quả phân tích 3 hướng):

| Tầng | Nội dung | Vai trò |
|---|---|---|
| 1. Hàng đợi giám sát (màn mặc định) | feed bình luận mô phỏng đã quét + phân loại, xếp ưu tiên | giữ câu chuyện "tracking chủ động" — cán bộ KHÔNG upload thủ công |
| 2. Hồ sơ đối tượng (luồng chính) | mở item → chủ thể (cá nhân/tổ chức), hành vi khớp điểm/khoản/điều, khung phạt theo chủ thể, biện pháp khắc phục, diff cũ/mới; + ô nhập ad-hoc (phụ) | trả lời "đối tượng này liên quan điều gì, mức nào" — subject-centric |
| 3. Tầng kiểm chứng | 1–2 vụ xử phạt THẬT đã công bố → hệ thống tái lập kết luận, bảng khớp/lệch | demo credibility + ground truth cho eval gate |

**Hướng bị loại chủ đích** (nói ra khi pitch = điểm cộng risk management):
quét fanpage thật / góc bản quyền (điểm d k1 Đ95) — vì (a) gắn nhãn "khả năng
vi phạm" lên fanpage có tên chính là hành vi có nguy cơ xúc phạm uy tín tổ
chức (tự vi phạm điểm a); (b) không thể xác minh thỏa thuận bản quyền trong
48h → false positive cao.

## 2. Mapping 4 yêu cầu đề bài → thứ tự build

```
F1+F2 (nền tảng, làm GỌN — không over-engineer)
  │   F1: cấu trúc điều–khoản–điểm  → P1 model + ingest 1 lần từ data/ đã trích
  │   F2: chủ thể/hành vi cấm/hình phạt/thời hạn/văn bản liên quan → node KG
  ▼
F4 (diff cũ/mới — "ăn theo" F1+F2, chi phí thấp, giá trị demo cao)
  │   chỉ là render edge THAY_THE đã có; đầu tư vào UX bảng so sánh
  ▼
F3 (social monitoring — pipeline SONG SONG, đầu tư nhiều nhất, rủi ro nhất)
      bộ bình luận mô phỏng → LLM extract claim/chủ thể → engine phân loại
      → queue; móc vào F1+F2 ở bước gắn trích dẫn
```

Judge sẽ hỏi "F1+F2 khác gì thuvienphapluat?" — đúng, vì vậy F3+F4 mới là
điểm thắng thua; F1+F2 chỉ cần đúng và sạch cho phạm vi 3 điều đã trích.

## 3. KG schema (invariant core — P1/P2 bảo vệ bằng test)

### Nodes

| Node | Thuộc tính | Ví dụ đã verify |
|---|---|---|
| `VanBan` | so_hieu, ngay_hieu_luc, trang_thai | NĐ 174/2026 (hiệu lực 01/7/2026), NĐ 15/2020 (hết hiệu lực phần tương ứng) |
| `DieuKhoan` | van_ban, dieu, khoan, diem, noi_dung nguyên văn | `nd174-d95-k1-a` |
| `HanhVi` | mo_ta, nhom: tin_gia \| boc_phot \| khac | "cung cấp, chia sẻ thông tin giả mạo..." (k1a); "tin sai sự thật gây hoang mang" (k2c) |
| `ChuThe` | loai: ca_nhan \| to_chuc; mo_ta nhận diện | cá nhân = user/KOL/tiktoker; tổ chức = doanh nghiệp sở hữu fanpage, hội nhóm (Điều 2 k2) |
| `MucPhat` | min_vnd, max_vnd, ap_dung_cho = to_chuc | k1: 20–30tr; k2: 30–50tr — **mức cá nhân không lưu, luôn derive ×1/2 (Điều 4 k3)** |
| `BienPhapKhacPhuc` | mo_ta, pham_vi | gỡ bỏ thông tin (k1+k2); khóa tài khoản/trang/nhóm/kênh (CHỈ k2) |

### Edges

| Edge | Nối | Thuộc tính |
|---|---|---|
| `THAY_THE` | nd15-d101-k1-a → nd174-d95-k1-a | diff: tổ chức 10–20 → 20–30tr; cá nhân 5–10 → 10–15tr; mốc 01/7/2026 |
| `QUY_DINH_TAI` | HanhVi → DieuKhoan | — |
| `AP_DUNG_CHO` | MucPhat → ChuThe | kèm hệ số (tổ chức ×1, cá nhân ×1/2) |

Quy mô: ~30–50 node cho scope MVP → **JSON files là đủ, không cần Neo4j.**
Nếu pitch cần chữ "graph database": schema này port sang Neo4j 1-1, nói được.

## 4. Luật phân loại nhãn (lõi F3 — enum ĐÓNG, không có nhãn "vi phạm")

| Nhãn | Điều kiện gắn | Ví dụ |
|---|---|---|
| `dung` | claim nêu đúng khung phạt + đúng chủ thể + đúng văn bản đang hiệu lực | "tổ chức đăng tin giả bị phạt tới 30 triệu" |
| `hieu_lam` | (a) gán khung tổ chức cho cá nhân hoặc ngược lại; (b) dùng khung NĐ15 sau 01/7/2026; (c) gán nhầm hành vi ↔ khoản (vd: hành vi k1 nhưng nói mức k2) | "cá nhân share tin giả bị phạt 20-30 triệu" (nhầm chủ thể); "phạt có 10-20 triệu thôi" (nhầm quy định cũ) |
| `can_kiem_chung` | thiếu dữ kiện chủ thể; không match được hành vi trong phạm vi đã nạp; claim có điều kiện/ngoại lệ chưa mô hình hóa | "share lại bài của người khác cũng bị phạt như đăng gốc?" (điều khoản không phân biệt cung cấp/chia sẻ → cần cán bộ đối chiếu) |

Nguyên tắc: **hệ thống đối chiếu, cán bộ kết luận.** Mọi nhãn kèm trích dẫn
"điểm X, khoản Y, Điều Z — NĐ số". Không đủ căn cứ → `can_kiem_chung`,
không đoán. (Rail enforce trong P9 — xem `10_HARNESS_GUARDRAILS.md`.)

## 5. Bộ bình luận mô phỏng (pivot surface — Data role soạn ở block 2–8%)

Nguồn văn phong: **fanpage thường + public chat forum** (bình luận ngắn, viết
tắt, cảm xúc, sai chính tả tự nhiên). 3 nhóm × ~15 câu = ~45 câu, chia 2–3
batch JSON để demo "Cập nhật dữ liệu mới" (dữ liệu tự chảy vào queue):

1. **Nhóm đúng** — hiểu đúng, hỏi xác nhận: "nghe nói giờ fanpage đăng tin
   giả bị phạt 30 củ hả", "từ 1/7 phạt nặng hơn thật à các bác".
2. **Nhóm hiểu lầm** (ưu tiên — chỗ demo ăn điểm):
   - nhầm chủ thể: "cá nhân share tin giả bị phạt 20-30 triệu" (thực ra 10–15tr)
   - nhầm quy định cũ: "phạt có 10-20 triệu thôi lo gì" (mức NĐ15, hết hiệu lực)
   - nhầm khoản: gán mức 30–50tr (k2) cho hành vi k1 thường
3. **Nhóm cần kiểm chứng** — câu hỏi có điều kiện thật: "share lại bài
   fake news của đứa khác thì sao", "đăng trong group kín có bị không",
   "bình luận hùa theo có tính là chia sẻ không".

Mỗi comment trong fixture: `{id, text, nguon_mo_ta ("fanpage tin tức",
"forum công nghệ"...), do_lan_truyen (mock int), thoi_gian}` — KHÔNG có tên
người/fanpage thật (PII rail).

## 5b. Tầng xác thực nguồn tin — Dual-RAG (bổ sung sau review ask.txt)

Kit gốc mới phân loại *claim về luật* ("phạt bao nhiêu"); điểm c khoản 2
Điều 95 ("tin sai sự thật gây hoang mang") đòi hỏi xác thực *tính đúng/sai
của nội dung*. Giải pháp: RAG thứ hai tra **corpus nguồn tin tin cậy**.

**Kiến trúc pitch được:** *"Dual-RAG — một RAG tra Luật (NĐ174) tìm khung
phạt, một RAG tra nguồn tin chính thống xác thực nội dung — cả hai chỉ GỢI Ý,
cán bộ kết luận."*

### Whitelist phân tầng thẩm quyền (không dùng danh sách phẳng)

| Tier | Nguồn | Quyền |
|---|---|---|
| 0 — Cơ quan phát ngôn đúng thẩm quyền chủ đề | SBV (ngân hàng), Bộ Y tế (dịch bệnh), Bộ Công an (an ninh), Cổng TTĐT Chính phủ | Xác nhận HOẶC bác bỏ — một mình là đủ |
| 1 — Báo chí chính thống quốc gia | TTXVN, VTV, Nhân Dân | Bác bỏ khi dẫn lời Tier 0; xác nhận cần ≥2 nguồn độc lập |
| 2 — Báo lớn | Tuổi Trẻ, Thanh Niên, VnExpress | Chỉ corroboration — không đơn phương quyết định |

### Quy tắc hợp nhất → 3 nhãn nguồn (enum đóng thứ hai)

| Nhãn nguồn | Điều kiện |
|---|---|
| `co_nguon_xac_nhan` | ≥1 tài liệu Tier 0 hoặc ≥2 tài liệu Tier 1/2 độc lập xác nhận nội dung |
| `co_bac_bo_chinh_thuc` | tài liệu Tier 0/1 bác bỏ, **thời gian đăng SAU thời gian tin đồn** |
| `chua_tim_thay_nguon` | không match — nhãn TRUNG TÍNH, chỉ đẩy ưu tiên xem xét |

**3 nguyên tắc chống lỗi logic (đúc từ review ask.txt — không thương lượng):**
1. *Vắng bằng chứng ≠ bằng chứng vắng*: không tìm thấy nguồn → `chua_tim_thay_nguon`,
   KHÔNG BAO GIỜ là "nghi vấn sai độ tin cậy cao" (tin nóng lệch crawl vài
   phút, tin địa phương, paywall — đều tạo phạt oan).
2. *Kể cả có bác bỏ chính thức*, output vẫn là **gợi ý** "nghi vấn sai sự
   thật — có bác bỏ từ [nguồn]" + ưu tiên cao — KHÔNG khẳng định "100% sai
   sự thật/vi phạm". Kết luận pháp lý (xét lỗi, hậu quả, ngoại lệ) thuộc
   cán bộ. Nhãn tổng vẫn là enum `dung/hieu_lam/can_kiem_chung`.
3. *Nhãn nguồn feed vào `ly_do`* của nhãn tổng, không thay thế nó.

### Triển khai 48h: snapshot corpus tĩnh

- `data/facts_corpus.json`: 10–20 tài liệu thật (bản tin bác bỏ, công bố
  chính thức), mỗi doc: `{id, tier, nguon, tieu_de, noi_dung_tom_tat,
  ngay_dang, url}` — ingest 1 lần, freeze như KG luật.
- Matching: keyword/BM25 thuần (cùng engine P2, không thêm LLM call path).
- Kiến trúc chừa sẵn chỗ cắm crawler thật sau event — nói được trong pitch,
  không build trong 48h.
- **Corpus hạt giống hoàn hảo: vụ tin đồn ngân hàng SCB 10/2022** — có thật,
  hồ sơ công khai đầy đủ cả 3 lớp: tin đồn lan MXH → SBV bác bỏ chính thức
  → nhiều cá nhân bị xử phạt (điểm a khoản 1 Điều 101 NĐ15). Một vụ kiểm
  chứng được cả 2 RAG + làm luôn study case §6.

## 6. Study case kiểm chứng (tầng 3 — TODO sưu tầm trước event)

Tiêu chí chọn vụ:
- Đã được cơ quan chức năng **công bố chính thức** (bản tin Sở TT&TT / Cục
  PTTH&TTĐT), có: hành vi mô tả, điều khoản viện dẫn (kỳ vọng: điểm a khoản 1
  Điều 101 NĐ15/2020), mức phạt cụ thể (kỳ vọng: 5–7.5 triệu cá nhân).
- Ưu tiên vụ tin giả điển hình (dịch bệnh, an ninh trật tự) — dễ hiểu với judge.
- **Ứng viên số 1: vụ tin đồn ngân hàng SCB 10/2022** (xem §5b) — kiểm chứng
  được đồng thời tầng luật (mức phạt) và tầng nguồn tin (bác bỏ chính thức).
- Ẩn danh trong UI: "cá nhân N.V.A — Quyết định số .../QĐ-XPHC".

Format bảng kiểm chứng: `hành vi → [hệ thống: điều khoản + khung phạt] vs
[quyết định thật: điều khoản + mức phạt] → khớp/lệch + ghi chú`. Bonus demo:
"nếu vi phạm này xảy ra sau 01/7/2026 → khung mới theo Đ95 NĐ174 là ..."
(nối thẳng sang F4).

## 7. Điểm nhấn pitch (map tiêu chí đề bài)

| Tiêu chí đề | Bằng chứng demo |
|---|---|
| Structuring điều–khoản–điểm | KG viewer / JSON node id dạng `nd174-d95-k1-a`, nguyên văn đính kèm |
| Extract subjects/obligations/penalties | Hồ sơ đối tượng: chủ thể + hành vi + khung phạt 2 cột + biện pháp khắc phục + thời hiệu 1 năm |
| Monitoring public discourse | Hàng đợi giám sát tự chảy (batch demo), xếp ưu tiên hiểu lầm lan nhanh |
| Extract updates vs prior decrees | Panel diff THAY_THE: 10-20 → 20-30tr (tổ chức), 5-10 → 10-15tr (cá nhân) |
| Source citations (yc 7) | Mọi nhãn/câu trả lời kèm "điểm a, khoản 1, Điều 95 — NĐ 174/2026/NĐ-CP"; refuse khi thiếu căn cứ |
| Detect misinformation (yc 6, một phần) | Dual-RAG: nhãn nguồn 3 mức từ whitelist phân tầng; demo vụ SCB — tin đồn ↔ bác bỏ chính thức của SBV |

Câu trả lời chuẩn bị sẵn:
- *"Khác gì thuvienphapluat?"* → "Họ là thư viện tra cứu tĩnh. Chúng tôi là
  vòng giám sát chủ động: thảo luận MXH tự chảy vào hàng đợi, được đối chiếu
  KG và gắn nhãn sẵn — cán bộ xử lý kết quả, không đi tra cứu. Và chúng tôi
  kiểm chứng được: hệ thống tái lập đúng kết luận của vụ xử phạt thật."
- *"Sao không quét Facebook thật?"* → minh bạch: API không cho phép scrape;
  kiến trúc P4 cắm nguồn thật không đổi; giá trị nằm ở logic phân loại + KG.
- *"Hệ thống kết luận người ta vi phạm à?"* → "Không — nhãn của chúng tôi
  không có chữ 'vi phạm'. Hệ thống đối chiếu và trích dẫn; kết luận là thẩm
  quyền của cán bộ. Đây là thiết kế có chủ đích." (chỉ vào P9 rail + risk matrix)
- *"Độ chính xác bao nhiêu phần trăm?"* → KHÔNG nói "FP<1%, FN<5%" hay bất kỳ
  con số % không có N đứng sau. Nói: "Chúng tôi báo cáo confusion matrix trên
  eval set N=12 case công khai trong repo, và quan trọng hơn là thiên vị thiết
  kế: hệ thống thiên về false negative — thà đẩy vào hàng đợi xem xét chứ
  không bao giờ gợi ý oan. Vụ kiểm chứng SCB khớp kết luận thật của cơ quan
  chức năng." (honesty metrics là feature, không phải điểm yếu)

## 8. Checklist pre-event còn thiếu (bổ sung vào checklists/PRE_EVENT.md)

- [ ] Tải + trích **Điều 101 NĐ 15/2020** (+ rule mức phạt NĐ15) → `data/nd15_trich.md`, format như `nd174_trich.md`
- [ ] Sưu tầm **1–2 bản tin xử phạt tin giả chính thức** → `data/study_cases_notes.md` (nguồn, số QĐ nếu công bố, hành vi, điều viện dẫn, mức phạt) — ưu tiên vụ SCB 10/2022
- [ ] Sưu tầm **10–20 tài liệu cho facts corpus** (§5b) → `data/facts_corpus_notes.md`: bản tin bác bỏ SBV, tin TTXVN/VTV về vụ SCB, vài công bố chính thức khác chủ đề (dịch bệnh, an ninh) để corpus không đơn nhất
- [ ] Soạn nháp **45 bình luận mô phỏng** theo §5 (được phép — là data; nếu rules event khắt khe về data thì regenerate live bằng LLM tại event theo spec §5)
- [ ] Điền mọi `{{TODO-EVENT}}` trong 00/01/03/05/09 khi BTC công bố thể lệ
