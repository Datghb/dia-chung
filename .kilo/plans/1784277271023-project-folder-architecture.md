# Kiến trúc thư mục chung — AIZ Legal-KG

Tài liệu này chuyển hóa plan 5 người thành một cấu trúc thư mục chung để các thành viên có thể làm song song, giữ ổn định shared interface và giảm xung đột khi merge.

> Plan nguồn: `1784277271023-hackathon-5-person-team-plan.md`
>
> Quy ước kiến trúc: dự án được chia rõ thành `frontend/` và `backend/`. Frontend dùng Next.js/TypeScript; backend dùng FastAPI/Python và chứa toàn bộ lõi AI pháp lý. Hai phía chỉ giao tiếp qua HTTP API theo contract chung.

## 1. Cấu trúc thư mục đề xuất

```text
.
├── frontend/                         # FRONTEND — B2 sở hữu
│   ├── app/                          # Next.js App Router
│   │   ├── cases/[id]/page.tsx       # Màn hồ sơ đối tượng
│   │   ├── verify/page.tsx           # Tầng kiểm chứng
│   │   ├── page.tsx                  # Hàng đợi giám sát
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/                   # Thành phần UI dùng chung
│   ├── lib/
│   │   ├── api-client.ts             # Nơi duy nhất gọi backend
│   │   ├── env.ts                    # Đọc NEXT_PUBLIC_API_URL
│   │   └── formatters.ts
│   ├── types/                        # TypeScript DTO khớp OpenAPI
│   ├── public/                       # Ảnh, icon và asset tĩnh
│   ├── tests/                        # Component/render/E2E tests
│   ├── .env.example
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                          # BACKEND — A1, A2, B1 và B3
│   ├── legal_radar/                  # Python package — lõi hệ thống
│       ├── __init__.py
│       ├── model.py                  # A1 — frozen dataclasses + loader
│       ├── engine.py                 # A1 — 7 hàm pure của P2
│       ├── normalization.py          # A1 — chuẩn hóa tiếng Việt/slang
│       ├── verification.py           # A2 — Dual-RAG/xac_thuc_nguon
│       ├── guardrails.py             # A2 — 5 domain rails
│       ├── providers.py              # B1 — Gemini/Groq/OpenRouter adapter
│       ├── pipeline.py               # B1 — orchestration ingest → queue
│       ├── report.py                 # B3 — báo cáo JSON/Markdown
│       ├── cli.py                    # B3/B1 — lệnh ingest, report, update
│       └── api/
│           ├── main.py               # FastAPI app + /health
│           ├── dependencies.py
│           ├── schemas.py            # DTO API, ánh xạ từ domain model
│           └── routes/
│               ├── queue.py
│               ├── cases.py
│               ├── verify.py
│               └── qa.py
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── test_model.py         # A1
│   │   │   ├── test_engine.py        # A1
│   │   │   ├── test_verification.py  # A2
│   │   │   ├── test_guardrails.py    # A2
│   │   │   └── test_providers.py     # B1
│   │   ├── integration/
│   │   │   ├── test_pipeline.py      # B1
│   │   │   └── test_api.py           # B2 phối hợp
│   │   └── contract/
│   │       └── test_openapi.py
│   ├── eval/                         # A2 — gate 14 ca độc lập
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
├── contracts/                        # A1 duyệt — shared interface đã freeze
│   ├── README.md                     # Version, owner, quy trình thay đổi
│   ├── queue-item.schema.json
│   ├── llm-extraction.schema.json
│   └── openapi.json                  # Snapshot contract giữa API và dashboard
│
├── data/                             # Dữ liệu nguồn có thể commit
│   ├── legal/
│   │   ├── nd174_trich.md
│   │   └── nd15_trich.md
│   ├── kg/
│   │   ├── kg_nodes.json             # A1
│   │   └── kg_edges.json             # A1
│   ├── facts/
│   │   └── facts_corpus.json         # A2
│   ├── study_cases/
│   │   └── study_cases.json          # A2
│   └── fixtures/
│       ├── comments_batch_1.json      # B1/B2 — nhóm đúng
│       ├── comments_batch_2.json      # B1/B2 — nhóm hiểu lầm
│       └── comments_batch_3.json      # B1/B2 — cần kiểm chứng
│
├── runs/                             # Output runtime, không sửa bằng tay
│   ├── .gitkeep
│   ├── queue.jsonl
│   ├── errors.jsonl
│   └── reports/
│
├── scripts/                           # Lệnh điều phối toàn dự án
│   ├── bootstrap.ps1
│   ├── dev.ps1                       # Chạy đồng thời FE và BE
│   ├── test.ps1                      # Test cả hai phía
│   └── export_openapi.ps1
│
├── deploy/                            # B3 — cấu hình triển khai
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   ├── compose.yaml
│   └── README.md
│
├── docs/                              # B3 — tài liệu và deliverable
│   ├── architecture/
│   │   ├── decisions.md
│   │   └── data-flow.md
│   ├── verification/
│   │   ├── kg-verify-log.md
│   │   └── facts-verify-log.md
│   ├── reports/
│   ├── pitch/
│   ├── demo/
│   └── AI_COLLABORATION_LOG.md
│
├── kit/                               # Bộ tài liệu hackathon hiện có
├── .gitignore
├── README.md                          # Quick start + Decision Block
└── DECISIONS.md                       # Scope freeze, cut list, quyết định lớn
```

## 2. Phân chia Frontend và Backend

### Frontend (`frontend/`)

Frontend chịu trách nhiệm:

- Hiển thị hàng đợi giám sát, hồ sơ chi tiết và tầng kiểm chứng.
- Gửi câu hỏi hoặc yêu cầu cập nhật tới backend.
- Lọc, sắp xếp, hiển thị badge, citation và diff văn bản.
- Xử lý loading, empty state và lỗi mạng.
- Không tự phân loại claim, tính mức phạt hoặc xác thực nguồn.
- Không đọc trực tiếp `data/` hay `runs/`.

Biến môi trường chính:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`backend/`)

Backend chịu trách nhiệm:

- Nạp và kiểm tra dữ liệu pháp lý.
- Chuẩn hóa văn bản tiếng Việt.
- Match hành vi, phân loại claim và tính mức phạt.
- Dual-RAG xác thực nguồn.
- Chạy guardrails và xếp ưu tiên.
- Gọi các LLM provider qua adapter.
- Ghi queue/report và cung cấp FastAPI endpoints.
- Không chứa component, CSS hoặc logic trình bày UI.

Biến môi trường chính:

```env
APP_ENV=development
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
DATA_DIR=../data
RUNS_DIR=../runs
```

### API nối FE với BE

| Method | Endpoint | Frontend sử dụng cho |
|---|---|---|
| `GET` | `/health` | Kiểm tra backend hoạt động |
| `GET` | `/api/queue` | Màn hàng đợi giám sát |
| `GET` | `/api/cases/{id}` | Hồ sơ đối tượng, nguồn và diff |
| `GET` | `/api/verify` | Tầng kiểm chứng |
| `POST` | `/api/qa` | Q&A pháp lý |
| `POST` | `/api/ingest/comments` | Cập nhật batch dữ liệu mới |

## 3. Ranh giới module

Luồng phụ thuộc hợp lệ:

```text
data
  ↓
model → normalization → engine
  ↓                       ↓
verification ─────────→ pipeline ← providers
       ↓                  ↓
  guardrails          runs/queue.jsonl
                          ↓
                 backend/FastAPI API
                          ↓
                frontend/Next.js dashboard
```

Quy tắc bắt buộc:

1. `model.py` và các schema trong `contracts/` là shared interface. A1 là owner; thay đổi phải được thông báo cho B1, B2 và B3.
2. `engine.py`, `verification.py` và `guardrails.py` không phụ thuộc UI, FastAPI hoặc một LLM provider cụ thể.
3. `providers.py` chỉ chuẩn hóa lời gọi LLM và trả dữ liệu theo `llm-extraction.schema.json`.
4. `pipeline.py` là nơi ghép provider, engine, verification và guardrails; không đặt business rule trong route API.
5. Dashboard chỉ nhận DTO qua HTTP. Kiểu TypeScript trong `frontend/types/` phải khớp `contracts/openapi.json`.
6. `data/` chứa đầu vào đã kiểm chứng; `runs/` chỉ chứa kết quả sinh trong lúc chạy.
7. Eval là gate phát hành, không trộn với test đơn vị và không được sửa expected output để hợp thức hóa lỗi.

## 4. Ownership theo 5 thành viên

| Owner | Phạm vi chính | Có quyền review bắt buộc |
|---|---|---|
| A1 — Engine Architect | `backend/legal_radar/model.py`, engine, normalization, `data/kg/` | `contracts/`, thay đổi domain model |
| A2 — Verification Specialist | Backend verification, guardrails, facts, study cases, `backend/eval/` | Nhãn nguồn, citation, chống phát oan |
| B1 — Data Pipeline Lead | Backend providers, pipeline, fixtures và test pipeline | Contract LLM extraction, queue writer |
| B2 — Dashboard Lead | Toàn bộ `frontend/`, phối hợp schema API | DTO hiển thị, OpenAPI consumer |
| B3 — Ops + Pitch Lead | `deploy/`, `docs/`, report/CLI, root config | Deploy, deliverable, collab log |

Các thư mục `contracts/`, `README.md`, `DECISIONS.md` và `.env.example` là vùng dùng chung; merge cần ít nhất owner liên quan review.

## 5. Quy ước dữ liệu và output

- ID domain phải ổn định, ví dụ `d95-k1-a`; không dùng vị trí mảng làm ID.
- JSON nguồn được format ổn định, UTF-8, không chứa comment.
- Mỗi item trong `queue.jsonl` là một JSON object hoàn chỉnh trên một dòng.
- Mọi kết quả phân loại phải dùng enum: `dung`, `hieu_lam`, `can_kiem_chung`.
- Mọi kết quả xác thực nguồn phải dùng enum: `co_nguon_xac_nhan`, `co_bac_bo_chinh_thuc`, `chua_tim_thay_nguon`.
- `chua_tim_thay_nguon` là trạng thái trung tính, không được render thành “sai” hoặc “vi phạm”.
- Secret chỉ tồn tại trong `.env` cục bộ hoặc secret store của nền tảng deploy.

## 6. Cấu trúc tối thiểu cho MVP

Nếu cần cắt scope trong 48 giờ, vẫn phải giữ các đường dẫn sau:

```text
frontend/
backend/legal_radar/{model,engine,verification,guardrails,providers,pipeline}.py
backend/legal_radar/api/main.py
contracts/
data/{legal,kg,facts,fixtures}/
runs/
backend/tests/{unit,integration,contract}/
backend/eval/
deploy/
docs/AI_COLLABORATION_LOG.md
```

Không cắt KG core, quy tắc mức phạt cá nhân bằng một nửa tổ chức, Dual-RAG, citation bắt buộc, eval gate, collaboration log hoặc video demo.

## 7. Trình tự khởi tạo thư mục

1. B3 tạo scaffold, `.env.example`, `pyproject.toml`, health endpoint và deploy skeleton.
2. A1 publish `model.py`, KG schema và các file trong `contracts/`; sau đó freeze phiên bản `v1`.
3. A2, B1 và B2 làm song song trên contract `v1`.
4. B1 tạo một E2E run vào `runs/queue.jsonl`.
5. B2 nối dashboard với API bằng dữ liệu thật.
6. A2 chạy `backend/eval/smoke.py`; B3 chỉ deploy/release khi gate đạt.
