# Kiến Trúc Hệ Thống Địa Chứng (System Architecture)

Thư mục này chứa các tài liệu thiết kế kiến trúc kỹ thuật và các quyết định thiết kế (ADRs) cho hệ thống **Địa Chứng**.

## Các Thành Phần Chính

Hệ thống được thiết kế theo mô hình Microservices phân lớp sạch (Clean Architecture):

1. **FastAPI Backend (RAG1 + RAG2 API)**
   * **API Layer**: Cung cấp endpoints RESTful bảo mật, hỗ trợ CORS theo môi trường và rate limiting.
   * **Domain Service (Engine)**: `engine.py` chịu trách nhiệm so khớp và đưa ra kết luận mức phạt dựa trên BM25 & Knowledge Graph.
   * **Storage Layer**: `storage.py` hỗ trợ cả JSONL (development) và SQL Store (production, PostgreSQL) có cơ chế quản lý phiên bản phòng chống tranh chấp ghi dữ liệu (Optimistic Locking via version field).

2. **Next.js Frontend Dashboard**
   * Hiển thị bảng điều khiển trực quan hóa dữ liệu mạng xã hội đã thu thập.
   * Cung cấp giao diện Human-in-the-loop (HITL) cho phép quản trị viên phê duyệt, bác bỏ hoặc đính chính nhãn phân loại.

3. **Resilience & Security**
   * **Circuit Breaker**: Tự động ngắt kết nối LLM provider khi xảy ra lỗi liên tục.
   * **Input Guardrails**: Khử định danh PII (thông tin cá nhân) và vô hiệu hóa prompt injection trước khi gửi sang LLM.

## Sơ Đồ Thiết Kế chi tiết
Xem thêm chi tiết tại:
* [Báo cáo thuyết minh kiến trúc](../THUYET_MINH_DIA_CHUNG.md)
* [Quyết định kiến trúc ADR-001](architecture/ADR-001-production-persistence-and-sessions.md)
