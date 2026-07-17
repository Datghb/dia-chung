# Legal-KG Dashboard

Dashboard AI pháp lý sử dụng RAG và Knowledge Graph để hỗ trợ giám sát nội
dung mạng xã hội theo Nghị định 174/2026.

## Cấu trúc

- `frontend/`: dashboard Next.js/vinext và Cloudflare worker.
- `backend/`: FastAPI, legal engine, source verification và pipeline AI.
- `contracts/`: contract dữ liệu dùng chung giữa frontend và backend.
- `data/`: dữ liệu pháp luật, Knowledge Graph và fixtures.
- `runs/`: kết quả runtime của pipeline.
- `deploy/`: cấu hình container và triển khai.
- `docs/`: tài liệu kiến trúc, kiểm chứng, pitch và demo.

## Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

## Chạy backend

```powershell
cd backend
python -m pip install -e ".[dev]"
uvicorn legal_radar.api.main:app --reload
```

Frontend mặc định gọi backend tại `http://localhost:8000`.
