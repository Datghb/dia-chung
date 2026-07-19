# Nhật Ký Cộng Tác Với AI (AI Collaboration Log)

Hệ thống **Địa Chứng** (Legal Radar) được phát triển với sự hỗ trợ của các trợ lý lập trình trí tuệ nhân tạo (AI coding agents) bao gồm Claude Code, Google Antigravity, và GitHub Copilot. Dưới đây là nhật ký các phiên làm việc quan trọng, thể hiện phương pháp đồng thiết kế (co-design) và tối ưu hóa hệ thống.

---

## Phiên 1: Xây Dựng Khung Quy Tắc Phạt (FastAPI + BM25 Rules Engine)
* **AI Agent**: Claude 3.5 Sonnet
* **Nội dung**:
  * Phát triển engine cốt lõi [`engine.py`](../backend/legal_radar/engine.py) sử dụng giải thuật BM25 để so khớp mức phạt tiền đối chiếu với Nghị định 15/2020 và cập nhật Nghị định 174/2026/NĐ-CP (có hiệu lực từ 01/7/2026).
  * Viết các rules phân biệt loại hình phạt tổ chức (khung gốc) và cá nhân (khung chia đôi) nhằm bảo đảm nguyên lý tối ưu hóa trong quy định pháp luật Việt Nam.
  * Sinh file Knowledge Graph mẫu (`kg_nodes.json`, `kg_edges.json`).

## Phiên 2: Thiết Kế Pipeline & Fallback Chain Cho LLM
* **AI Agent**: Claude Code
* **Nội dung**:
  * Thiết kế kiến trúc trích xuất ý kiến từ bình luận bằng LLM thông qua `TokenRouterProvider`, hỗ trợ fallback chain tự động chuyển đổi sang Gemini API hoặc Groq API khi gặp lỗi quota hoặc latency.
  * Tích hợp cơ chế Human-in-the-loop (HITL) đưa các kết quả nghi ngờ hoặc lỗi model vào hàng đợi phê duyệt của cán bộ kiểm duyệt.

## Phiên 3: Bảo Mật Hóa & Triển Khai (Security Hardening & Dockerize)
* **AI Agent**: Google Antigravity
* **Nội dung**:
  * Cấu hình lại các file Dockerfile: đổi user thực thi từ root sang non-root (`USER node` cho frontend, `USER legal-radar` cho backend) bảo đảm nguyên tắc đặc quyền tối thiểu.
  * Loại bỏ các khóa bí mật cứng (hardcoded paths) trong `.github/workflows/cd.yml` thay bằng GitHub Secrets (`VPS_DEPLOY_PATH`).
  * Đồng bộ hóa OpenAPI schema thực tế từ FastAPI để sinh file `contracts/openapi.json` tự động.

## Phiên 4: Sửa Lỗi Linter & Đồng Bộ Hóa Dependency CI
* **AI Agent**: Google Antigravity (M35 & Flash)
* **Nội dung**:
  * Cấu hình ruff linter trong `backend/ruff.toml`, phân lập các lỗi docstrings D102/D103 của tests và production code.
  * Refactor toàn bộ code Python backend để vượt qua 53 lỗi linter & format, cập nhật các exception names tuân thủ chuẩn N818 (`InvalidSessionError`, `CircuitOpenError`, `CaseVersionConflictError`).
  * Sửa lỗi dependency SQLAlchemy / psycopg thiếu trong `backend/requirements.txt` khiến CI test collection crash.
  * Khắc phục lỗi bảo mật Trivy Action version tag (`v0.35.0` thay cho bản cũ bị compromised) và đồng bộ package-lock.json của frontend cho Drizzle ORM.
