# Deploy trên VPS

Trước lần chạy đầu tiên, tạo hai file biến môi trường thật từ các file mẫu:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Điền đầy đủ giá trị cần thiết trong:

- `backend/.env`
- `frontend/.env`

Hai file `.env` chứa cấu hình riêng và secret, không được commit lên Git.

Chạy hai service từ thư mục root của repo:

```bash
docker compose -f deploy/compose.yaml up --build -d
```

Backend được publish tại cổng `8000`; frontend được publish tại cổng `3000`.
