# Xác Thực Quyết Định & Đối Chiếu Pháp Luật (Legal Logic Verification)

Thư mục này tài liệu hóa quy trình kiểm định tính chính xác của thuật toán phân loại mức phạt đối với các hành vi vi phạm.

## Phương Pháp Xác Thực

Hệ thống sử dụng bộ 14 trường hợp điển hình thực tế (Curated Study Cases) tại `data/study_cases/study_cases.json` để chạy đối sánh hồi quy:

1. **Khớp Hành Vi**: Đảm bảo các từ lóng hay thuật ngữ địa phương được chuẩn hóa chính xác trước khi so khớp.
2. **Khớp Khung Phạt**: Kiểm tra công thức phân chia khung phạt cá nhân bằng đúng 1/2 khung phạt của tổ chức theo quy định pháp luật.
3. **Phát Hiện Luật Cũ**: Tự động nhận diện nếu người dùng tham chiếu Nghị định cũ đã hết hiệu lực (Nghị định 15/2020) và đề xuất khung phạt mới theo Nghị định 174/2026.

## Chạy Thử Nghiệm

* Script kiểm tra tự động chạy tích hợp trong CI/CD: `python backend/eval/smoke.py`
* Chi tiết các công thức toán học và trọng số mô hình được mô tả trong [Cách Tính Điểm (Metrics Formula)](../METRICS.md).
