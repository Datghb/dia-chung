# Địa Chứng — Pitch 5 phút

## Slide 1 — Vấn đề

Tin sai lệch trên mạng xã hội lan nhanh hơn khả năng rà soát thủ công. Chuyên
viên phải đọc nội dung, tìm claim, đối chiếu nguồn chính thức và xác định căn
cứ pháp luật trên nhiều hệ thống rời rạc.

## Slide 2 — Giải pháp

Địa Chứng là trung tâm giám sát nội dung mạng xã hội hỗ trợ:

- thu thập bài viết và bình luận từ Facebook, YouTube;
- trích xuất claim và phân loại `Đúng`, `Hiểu lầm`, `Cần kiểm chứng`;
- đối chiếu nguồn chính thức theo tầng thẩm quyền;
- gợi ý điều, khoản, điểm, chủ thể và mức phạt;
- đưa hồ sơ vào hàng đợi để chuyên viên phê duyệt.

Hệ thống chỉ hỗ trợ sàng lọc, không thay thế kết luận của người có thẩm quyền.

## Slide 3 — Luồng hoạt động

`Crawler → AI extraction → Legal engine → Source verification → Queue → Human review`

Nếu crawler hoặc AI không sẵn sàng, hệ thống chuyển sang dữ liệu dự phòng và
nhãn `Cần kiểm chứng`, không tự suy diễn thành vi phạm.

## Slide 4 — Sản phẩm

- Tổng quan thị trường: KPI, xu hướng rủi ro, nền tảng, chủ đề, heatmap.
- Hàng đợi giám sát: lọc, sắp xếp, trạng thái và mức ưu tiên.
- Hồ sơ nội dung: claim, lý do, căn cứ pháp luật và nguồn.
- Nút **Quét MXH**: crawl theo yêu cầu, loading và tự làm mới dữ liệu.
- Tầng kiểm chứng: so kết quả hệ thống với study case thực tế.

## Slide 5 — Số liệu demo

Số liệu được lấy trực tiếp từ `GET /api/queue` tại thời điểm trình bày:

- 45 bình luận fixture chuẩn hóa ban đầu;
- 14 case trong bộ eval;
- dữ liệu crawl trực tiếp hoặc 10–20 bài dự phòng có nguồn gốc rõ ràng;
- dashboard tự tính KPI, biểu đồ và cảnh báo từ dữ liệu API.

Không đọc số cố định trên slide. Trước khi pitch, mở dashboard và dùng con số
đang hiển thị.

## Slide 6 — Guardrails

- Không có nhãn “vi phạm”; chỉ có đánh giá claim.
- “Chưa tìm thấy nguồn” không đồng nghĩa nội dung sai.
- Kiểm tra timeline của nguồn xác nhận/bác bỏ.
- Ẩn PII và chống prompt injection.
- Con người quyết định trạng thái cuối cùng.

## Slide 7 — Khả năng vận hành

- CI chạy test Backend và Frontend khi push/PR.
- CD triển khai tự động lên VPS khi cập nhật `main`.
- Docker Compose + Caddy + HTTPS.
- Health check: `https://api.theoria-lab.io.vn/health`.
- Dashboard: `https://diachung.dpdns.org`.

## Slide 8 — Kết

Địa Chứng rút ngắn thời gian từ “phát hiện tín hiệu” đến “hồ sơ có căn cứ”,
giúp chuyên viên tập trung vào quyết định cần con người thay vì thao tác lặp lại.
