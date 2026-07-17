# Cấu trúc thư mục dự án AIZ Legal-KG

```text
.
├── frontend/
│   ├── app/
│   │   ├── cases/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── verify/
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── queue/
│   │   ├── case/
│   │   ├── verification/
│   │   └── common/
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── env.ts
│   │   └── formatters.ts
│   ├── types/
│   │   └── api.ts
│   ├── public/
│   ├── tests/
│   ├── .env.example
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── legal_radar/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── queue.py
│   │   │   │   ├── cases.py
│   │   │   │   ├── verify.py
│   │   │   │   └── qa.py
│   │   │   ├── main.py
│   │   │   ├── dependencies.py
│   │   │   └── schemas.py
│   │   ├── __init__.py
│   │   ├── model.py
│   │   ├── engine.py
│   │   ├── normalization.py
│   │   ├── verification.py
│   │   ├── guardrails.py
│   │   ├── providers.py
│   │   ├── pipeline.py
│   │   ├── report.py
│   │   └── cli.py
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── contract/
│   ├── eval/
│   │   ├── cases.json
│   │   ├── smoke.py
│   │   └── README.md
│   ├── scripts/
│   │   ├── ingest_data.py
│   │   ├── export_openapi.py
│   │   └── generate_report.py
│   ├── .env.example
│   └── pyproject.toml
│
├── contracts/
│   ├── README.md
│   ├── queue-item.schema.json
│   ├── llm-extraction.schema.json
│   └── openapi.json
│
├── data/
│   ├── legal/
│   │   ├── nd174_trich.md
│   │   └── nd15_trich.md
│   ├── kg/
│   │   ├── kg_nodes.json
│   │   └── kg_edges.json
│   ├── facts/
│   │   └── facts_corpus.json
│   ├── study_cases/
│   │   └── study_cases.json
│   └── fixtures/
│       ├── comments_batch_1.json
│       ├── comments_batch_2.json
│       └── comments_batch_3.json
│
├── runs/
│   ├── .gitkeep
│   ├── queue.jsonl
│   ├── errors.jsonl
│   └── reports/
│
├── deploy/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── compose.yaml
│   └── README.md
│
├── docs/
│   ├── architecture/
│   ├── verification/
│   ├── reports/
│   ├── pitch/
│   ├── demo/
│   └── AI_COLLABORATION_LOG.md
│
├── scripts/
│   ├── bootstrap.ps1
│   ├── dev.ps1
│   └── test.ps1
│
├── kit/
├── .gitignore
├── README.md
└── DECISIONS.md
```

## Giải thích thư mục và file

### `frontend/`

Chứa toàn bộ giao diện web viết bằng Next.js và TypeScript.

- `app/`: định nghĩa các trang và layout theo Next.js App Router.
  - `app/page.tsx`: trang hàng đợi giám sát.
  - `app/cases/[id]/page.tsx`: trang chi tiết một hồ sơ.
  - `app/verify/page.tsx`: trang kiểm chứng thông tin.
  - `app/layout.tsx`: layout chung của ứng dụng.
  - `app/globals.css`: style toàn cục.
- `components/`: các component giao diện có thể tái sử dụng.
  - `queue/`: bảng, bộ lọc và badge của hàng đợi.
  - `case/`: component hiển thị hồ sơ, mức phạt và trích dẫn.
  - `verification/`: component hiển thị nguồn xác nhận hoặc bác bỏ.
  - `common/`: button, modal, loading và các component dùng chung.
- `lib/api-client.ts`: tập trung các hàm gọi API backend.
- `lib/env.ts`: đọc và kiểm tra biến môi trường frontend.
- `lib/formatters.ts`: định dạng ngày, tiền, nhãn và văn bản.
- `types/api.ts`: khai báo TypeScript type cho dữ liệu API.
- `public/`: ảnh, biểu tượng và tài nguyên tĩnh.
- `tests/`: kiểm thử component và giao diện.
- `.env.example`: danh sách biến môi trường frontend cần cấu hình.
- `next.config.ts`: cấu hình Next.js.
- `package.json`: dependencies và scripts của frontend.
- `tsconfig.json`: cấu hình TypeScript.

### `backend/`

Chứa API, lõi xử lý pháp lý, pipeline AI và kiểm thử backend.

#### `backend/legal_radar/`

Python package chính của hệ thống.

- `api/`: lớp FastAPI cung cấp dữ liệu cho frontend.
  - `api/main.py`: khởi tạo FastAPI application và health check.
  - `api/dependencies.py`: các dependency dùng chung cho API.
  - `api/schemas.py`: request/response schema của API.
  - `api/routes/queue.py`: endpoint hàng đợi giám sát.
  - `api/routes/cases.py`: endpoint chi tiết hồ sơ.
  - `api/routes/verify.py`: endpoint kiểm chứng nguồn tin.
  - `api/routes/qa.py`: endpoint hỏi đáp pháp lý.
- `model.py`: domain model như văn bản, điều khoản, hành vi, chủ thể và mức phạt.
- `engine.py`: các hàm match hành vi, phân loại claim, tính mức phạt và xếp ưu tiên.
- `normalization.py`: chuẩn hóa tiếng Việt, bỏ dấu và chuyển slang về dạng chuẩn.
- `verification.py`: xác thực claim bằng Knowledge Graph và facts corpus.
- `guardrails.py`: kiểm tra nhãn, dữ liệu cá nhân, prompt injection và các luật an toàn.
- `providers.py`: adapter gọi Gemini, Groq hoặc OpenRouter.
- `pipeline.py`: nối các bước extract, engine, verification, guardrails và ghi queue.
- `report.py`: tạo báo cáo JSON hoặc Markdown.
- `cli.py`: cung cấp các lệnh chạy pipeline và xuất báo cáo.
- `__init__.py`: đánh dấu `legal_radar` là một Python package.

#### Các thư mục backend khác

- `tests/unit/`: kiểm thử từng hàm hoặc module độc lập.
- `tests/integration/`: kiểm thử pipeline và API khi ghép nhiều module.
- `tests/contract/`: kiểm tra backend tuân thủ contract dùng chung với frontend.
- `eval/`: bộ đánh giá chất lượng nghiệp vụ.
  - `cases.json`: các tình huống đánh giá bắt buộc.
  - `smoke.py`: chạy eval và trả exit code lỗi khi có case không đạt.
  - `README.md`: hướng dẫn chạy và đọc kết quả eval.
- `scripts/ingest_data.py`: nhập dữ liệu pháp lý và bình luận.
- `scripts/export_openapi.py`: xuất OpenAPI contract từ FastAPI.
- `scripts/generate_report.py`: sinh báo cáo từ dữ liệu runtime.
- `.env.example`: danh sách biến môi trường và API key backend cần có.
- `pyproject.toml`: dependencies, cấu hình build, test và lint của Python.

### `contracts/`

Chứa định dạng dữ liệu dùng chung giữa frontend và backend.

- `README.md`: mô tả contract và cách cập nhật.
- `queue-item.schema.json`: JSON Schema của một item trong hàng đợi.
- `llm-extraction.schema.json`: JSON Schema cho kết quả trích xuất từ LLM.
- `openapi.json`: mô tả toàn bộ endpoint và DTO của backend.

### `data/`

Chứa dữ liệu đầu vào được quản lý và kiểm chứng.

- `legal/`: văn bản pháp luật gốc hoặc bản trích.
- `kg/`: node và edge của Knowledge Graph pháp lý.
- `facts/`: corpus nguồn tin dùng để xác thực claim.
- `study_cases/`: các quyết định hoặc tình huống thực tế để đối chiếu.
- `fixtures/`: các batch bình luận mô phỏng phục vụ test và demo.

### `runs/`

Chứa dữ liệu được sinh ra trong lúc hệ thống chạy.

- `.gitkeep`: giữ thư mục tồn tại khi chưa có output.
- `queue.jsonl`: hàng đợi kết quả phân tích; mỗi dòng là một JSON object.
- `errors.jsonl`: lỗi phát sinh trong pipeline.
- `reports/`: báo cáo được tạo từ các lần chạy.

### `deploy/`

Chứa cấu hình đóng gói và triển khai ứng dụng.

- `Dockerfile.backend`: tạo container cho FastAPI backend.
- `Dockerfile.frontend`: tạo container cho Next.js frontend.
- `compose.yaml`: chạy frontend và backend cùng nhau.
- `README.md`: hướng dẫn deploy và cấu hình môi trường.

### `docs/`

Chứa tài liệu và sản phẩm bàn giao của dự án.

- `architecture/`: tài liệu kiến trúc và luồng dữ liệu.
- `verification/`: nhật ký kiểm chứng KG, facts corpus và study case.
- `reports/`: báo cáo tĩnh dùng để chia sẻ hoặc in.
- `pitch/`: slide và nội dung thuyết trình.
- `demo/`: kịch bản, tài nguyên và ghi chú quay demo.
- `AI_COLLABORATION_LOG.md`: nhật ký cộng tác với công cụ AI.

### `scripts/`

Chứa script điều phối toàn dự án.

- `bootstrap.ps1`: chuẩn bị môi trường frontend và backend.
- `dev.ps1`: chạy frontend và backend ở chế độ development.
- `test.ps1`: chạy toàn bộ test của hai phía.

### Các file và thư mục ở root

- `kit/`: bộ tài liệu, checklist và biểu mẫu hackathon hiện có.
- `.gitignore`: loại trừ secret, cache, dependencies và runtime output khỏi Git.
- `README.md`: giới thiệu dự án và hướng dẫn chạy nhanh.
- `DECISIONS.md`: lưu các quyết định kiến trúc và thay đổi phạm vi quan trọng.
