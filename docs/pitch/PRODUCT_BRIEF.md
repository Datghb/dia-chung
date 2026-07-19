# ĐỊA CHỨNG

## Hệ thống giám sát tin đồn sáp nhập đơn vị hành chính

**Slogan:** Biến tin đồn thành claim, biến văn bản thành bằng chứng.

---

## 1. Tóm tắt giải pháp

**Đề bài:** "Legal knowledge graph — Tracking new regulations & public discourse"

**Giải pháp:** Địa Chứng là dashboard giám sát nội bộ, giúp cán bộ quản lý nhà nước phát hiện và đánh giá tin đồn về sáp nhập đơn vị hành chính trên mạng xã hội — tự động, có trích dẫn pháp lý và nguồn tin đi kèm.

Hệ thống tự động thu thập bài viết công khai từ Facebook, trích xuất phát ngôn chính (claim), đối chiếu với cơ sở dữ liệu pháp luật và nguồn tin chính thức, rồi xếp vào hàng đợi với nhãn rõ ràng: **Đúng** / **Hiểu lầm** / **Cần kiểm chứng**. Cán bộ mở dashboard, thấy ngay tin đồn nào cần xử lý trước, kèm điều khoản, mức phạt và nguồn tham chiếu — không cần tự tra cứu từ đầu.

**Địa Chứng không kết luận ai vi phạm, không yêu cầu gỡ bài.** Quyết định cuối cùng luôn thuộc về cán bộ.

---

## 2. Vấn đề

Sau sáp nhập còn 34 tỉnh/thành (07/2025) và chuyển sang mô hình chính quyền 2 cấp, mạng xã hội liên tục xuất hiện tin đồn:

* "Sắp tiếp tục sáp nhập còn 16 tỉnh" — tái xuất hiện ít nhất 2 lần, đều bị Bộ Nội vụ bác bỏ.
* "Thanh Hóa giảm từ 166 xuống còn 58 xã" — tin giả từ tài khoản cá nhân, bị Tỉnh ủy bác bỏ.
* Nhầm lẫn "cấp huyện vẫn còn hoạt động" — hiểu sai mô hình 2 cấp đã có hiệu lực.
* Giả mạo văn bản/con dấu cơ quan nhà nước về sáp nhập.

**Pain point thực tế:** cán bộ Sở TT&TT phải tự đọc từng bài đăng, tự tra nhiều nghị quyết/lệnh, tự xác định điều khoản nào đang hiệu lực, mức phạt cá nhân khác tổ chức ra sao. Việc tra cứu thủ công trên nhiều nguồn rời rạc làm chậm phản ứng và có rủi ro viện dẫn sai — dẫn đến quyết định xử phạt bị khiếu nại.

---

## 3. Người dùng

**Trực tiếp:** cán bộ theo dõi tin giả tại Sở TT&TT, Cục PTTH&TTĐT.

**Gián tiếp:** người dân, doanh nghiệp — hưởng lợi khi cán bộ xử lý tin đồn nhanh và chính xác hơn.

Địa Chứng **không** phục vụ người dân truy cập trực tiếp. Đây là công cụ nội bộ cho cơ quan quản lý.

---

## 4. Khác biệt so với giải pháp hiện tại

| | Tra cứu pháp luật | Social listening | **Địa Chứng** |
|---|---|---|---|
| Luồng dữ liệu | Cán bộ chủ động tìm | Tự động đếm mentions | **Tự động chảy vào hàng đợi** |
| Mức phân tích | Văn bản tĩnh | Cảm xúc chung chung | **Đối chiếu đúng điều khoản, mức phạt, chủ thể** |
| Nguồn tin | Không có | Không có | **Kiểm chứng độc lập với nguồn chính thức phân tầng** |
| Trích dẫn | Người dùng tự tra | Không có | **Tự động kèm điều khoản + nguồn** |

Câu trả lời cho "khác gì thuvienphapluat?": *Họ là thư viện tra cứu tĩnh. Chúng tôi là vòng giám sát chủ động — tin đồn tự chảy vào, được đối chiếu và gắn nhãn sẵn.*

---

## 5. Phạm vi MVP

Tập trung vào tin đồn sáp nhập đơn vị hành chính, đối chiếu với Điều 95 Nghị định 174/2026/NĐ-CP (thay thế NĐ 15/2020 từ 01/7/2026).

**Ba nhóm tin đồn được xử lý:**

1. **Số lượng và mô hình đơn vị hành chính** — "cả nước còn bao nhiêu tỉnh", "cấp huyện đã bỏ chưa". Đối chiếu: 34 tỉnh/thành theo Nghị quyết 202, mô hình 2 cấp theo Luật 72.

2. **Tin đồn tiếp tục sáp nhập** — "sắp giảm còn 16 tỉnh", "xã mình sắp sáp nhập tiếp". Đối chiếu: chưa có chủ trương sáp nhập thêm (Bộ Nội vụ bác bỏ).

3. **Giả mạo văn bản và tin đồn cực đoan** — hình ảnh con dấu giả, tin đồn phi thực tế. Đối chiếu: cảnh báo của Bộ Công an về thủ đoạn giả mạo.

**Ba vụ xử phạt thật** đã sưu tầm để kiểm chứng hệ thống: hai vụ tin sai trên Facebook cá nhân và một vụ bình luận sai về sáp nhập tỉnh (đăng trên Tuổi Trẻ, 05/2025).

**Phạm vi ngoài MVP:** chỉ crawl Facebook (không YouTube), không thu thập nội dung riêng tư, không xây hồ sơ hành vi cá nhân, không bao phủ lĩnh vực pháp luật khác ngoài ĐVHC.

---

## 6. Hệ thống nhãn

Hệ thống dùng nhãn đóng, **không có nhãn "vi phạm"**:

**Nhãn nội dung:**

| Nhãn | Ý nghĩa |
|---|---|
| Đúng | Phát ngôn khớp đúng khung phạt, đúng chủ thể, đúng văn bản đang hiệu lực |
| Hiểu lầm | Nhầm mức phạt tổ chức/cá nhân; dùng khung NĐ15 đã hết hiệu lực; mâu thuẫn dữ liệu thực tế |
| Cần kiểm chứng | Thiếu dữ kiện hoặc không khớp thông tin nào trong phạm vi đã nạp |

**Nhãn nguồn tin** (đối chiếu độc lập):

| Nhãn | Ý nghĩa |
|---|---|
| Có nguồn xác nhận | Cơ quan chính phủ hoặc ≥2 báo chính thống xác nhận |
| Có bác bỏ chính thức | Cơ quan chính phủ bác bỏ, đăng sau thời điểm tin đồn |
| Chưa tìm thấy nguồn | Không khớp — nhãn trung tính, không suy diễn thành "sai" |

**Nguyên tắc:** mọi nhãn phải kèm trích dẫn cụ thể. Không đủ căn cứ thì trả "Cần kiểm chứng", không đoán.

---

## 7. Cách hệ thống hoạt động

```
Bài viết MXH → Trích xuất phát ngôn → Đối chiếu pháp luật → Kiểm chứng nguồn → Hàng đợi
```

1. **Thu thập:** bài viết công khai trên Facebook được tự động crawl theo từ khóa liên quan sáp nhập ĐVHC.
2. **Trích xuất:** AI tách phát ngôn chính, từ khóa pháp lý và loại chủ thể (cá nhân/tổ chức) từ mỗi bài viết.
3. **Đối chiếu pháp luật:** phát ngôn được so với biểu đồ tri thức pháp luật — kiểm tra đúng điều khoản, đúng khung phạt, đúng văn bản đang hiệu lực. Đặc biệt: mức phạt cá nhân luôn bằng 1/2 mức phạt tổ chức (Điều 4 khoản 3 NĐ174) — lỗi viện dẫn phổ biến nhất.
4. **Kiểm chứng nguồn:** tìm kiếm động trên Google, phân tầng nguồn theo thẩm quyền (cơ quan chính phủ → báo chí chính thống → báo lớn), áp dụng quy tắc hợp nhất.
5. **Guardrails:** kiểm tra nhãn hợp lệ, lọc thông tin cá nhân, chống prompt injection trước khi đưa vào hàng đợi.
6. **Hiển thị:** cán bộ xem trong dashboard, đổi trạng thái xử lý, nhập thêm nội dung thủ công nếu cần.

---

## 8. Sản phẩm

Dashboard bao gồm 5 màn chính:

* **Tổng quan thị trường** — KPI rủi ro, xu hướng theo thời gian, phân bổ nền tảng, heatmap chủ đề × nền tảng, nhận định điều hành tự động.
* **Hàng đợi giám sát** — bảng phát ngôn đã phân loại, lọc theo nhãn/trạng thái/mức ưu tiên. Nút "Quét MXH" để thu thập dữ liệu mới. Nút "Nhập nội dung" để dán văn bản hoặc tải file hàng loạt.
* **Hồ sơ đối tượng** — chi tiết một mục: nội dung gốc, phát ngôn trích xuất, nhãn AI kèm lý do, căn cứ pháp luật (điều/khoản/điểm, chủ thể, mức phạt), nguồn tin kiểm chứng, đồ thị tri thức.
* **Tầng kiểm chứng** — so sánh kết quả hệ thống với 3 vụ xử phạt thật đã công bố.
* **Knowledge Graph** — đồ thị quan hệ: Phát ngôn → Chủ thể → Điều luật → Nguồn kiểm chứng.

---

## 9. Điểm đổi mới

* **Đối chiếu theo thời gian hiệu lực:** phát ngôn viện dẫn nghị định cũ đã hết hiệu lực bị phát hiện ngay — hệ thống biết văn bản nào đang thay thế văn bản nào.
* **Tách bạch mức phạt theo chủ thể:** cá nhân và tổ chức có mức phạt khác nhau, hệ thống kiểm tra tường minh thay vì gán chung một số.
* **Hai lớp kiểm chứng độc lập:** một lớp đối chiếu luật (đúng/sai khung phạt), một lớp đối chiếu nguồn tin (đã bị bác bỏ chính thức hay chưa) — không lẫn vào nhau.
* **Đối chiếu với vụ xử phạt thật:** 3 study case thật dùng để kiểm tra hệ thống có tái lập đúng kết quả của quyết định đã công bố hay không.

---

## 10. An toàn và pháp lý

* **Không có nhãn "vi phạm"** trong toàn bộ hệ thống — chỉ có Đúng / Hiểu lầm / Cần kiểm chứng.
* **Ẩn danh** khi hiển thị thông tin cá nhân trong study case.
* **Chống prompt injection** cho nội dung mạng xã hội đưa vào AI.
* **Lọc thông tin cá nhân** (tên, link mạng xã hội) trước khi xử lý.
* Credentials lưu trong biến môi trường, không hardcode trong mã nguồn.

---

## 11. Đánh giá

* **330 unit tests + 9 integration tests** chạy trên mỗi lần cập nhật mã nguồn.
* **14 eval case** kiểm tra nhãn hệ thống khớp nhãn kỳ vọng.
* **3 study case thật** đối chiếu điều khoản/mức phạt với quyết định xử phạt đã công bố.

Chưa có benchmark F1/accuracy tách riêng — đây là việc cần đo thêm nếu sản phẩm đi tiếp.

---

## 12. Kịch bản demo

> Mở hàng đợi giám sát → chọn bình luận "cá nhân share tin giả bị phạt 20-30 triệu"
> → hệ thống tự gắn nhãn **Hiểu lầm** — lý do: "20-30 triệu là mức TỔ CHỨC; cá nhân chỉ 10-15 triệu theo Điều 4 khoản 3 NĐ174"
> → kèm trích dẫn điểm a khoản 1 Điều 95
> → chuyển sang tầng kiểm chứng: hệ thống tái lập đúng mức phạt của vụ xử phạt thật đã công bố

Hai loại lỗi phổ biến nhất — nhầm lẫn cá nhân/tổ chức và dùng khung phạt cũ — đều bị bắt được.

---

## 13. Kết luận

Địa Chứng giúp cán bộ nhìn thấy tin đồn nào cần xử lý trước, thay vì tự đọc hàng trăm bài đăng thủ công.

Phát ngôn được tách ra, đối chiếu đúng điều khoản còn hiệu lực, đúng mức phạt theo chủ thể, và kiểm tra xem đã có nguồn chính thức bác bỏ chưa — tất cả trước khi cán bộ ra quyết định.

**Địa Chứng không giám sát người dân. Địa Chứng giúp cán bộ xử lý tin đồn nhanh hơn và chính xác hơn.**

---

**Slogan:** Biến tin đồn thành claim, biến văn bản thành bằng chứng.
**Thông điệp:** Đúng chủ thể, đúng thời điểm, đúng căn cứ.
