# Báo Cáo Phân Tích (Analysis & Crawling Reports)

Thư mục này chứa các báo cáo và kết quả chạy thực nghiệm từ quá trình thu thập thông tin mạng xã hội.

## Các Tập Tin Đầu Ra (Output Artifacts)

Tất cả báo cáo được lưu trong thư mục chạy `runs/` (được cấu hình qua biến môi trường `RUNS_DIR`):

* **`runs/queue.jsonl`**: Hàng đợi kiểm duyệt chứa các comment thô thu thập được từ Facebook cùng với nhãn đề xuất từ hệ thống AI.
* **`runs/audit.jsonl`**: Nhật ký kiểm toán ghi lại tất cả thao tác của con người (phê duyệt, sửa đổi nhãn, thay đổi trạng thái case).
* **Báo cáo định kỳ**: Sinh tự động bằng script `backend/scripts/generate_report.py`.

## Phân Tích Thực Nghiệm

Để biết chi tiết về kết quả thử nghiệm và đánh giá chất lượng phân loại, vui lòng đọc tài liệu [Evaluation and Pilot Plan](../EVALUATION_AND_PILOT.md).
