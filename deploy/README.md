# Deploy trên VPS

Trước lần chạy đầu tiên, tạo hai file biến môi trường thật từ các file mẫu:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Điền đầy đủ giá trị cần thiết trong:

- `backend/.env`
- `frontend/.env`

Ở production, `ADMIN_API_KEY` là bắt buộc. Tạo một giá trị ngẫu nhiên dài tối
thiểu 32 byte, không dùng lại khóa của nhà cung cấp. Compose ép
`APP_ENV=production`, vì vậy backend sẽ từ chối toàn bộ thao tác quản trị nếu
khóa này bị bỏ trống.

Đặt thêm `POSTGRES_PASSWORD` và `DATABASE_URL`, ví dụ:

```dotenv
POSTGRES_DB=legal_radar
POSTGRES_USER=legal_radar
POSTGRES_PASSWORD=<mật-khẩu-ngẫu-nhiên>
DATABASE_URL=postgresql+psycopg://legal_radar:<url-encoded-password>@postgres:5432/legal_radar
```

Trước lần chuyển dữ liệu đầu tiên, chạy import không phá hủy:

```bash
docker compose -f deploy/compose.yaml run --rm backend \
  python scripts/migrate_jsonl_to_sql.py
```

Giữ `runs/queue.jsonl` cho đến khi đã so sánh số lượng và kiểm thử review trên
SQL. Rollback bằng cách bỏ `DATABASE_URL` rồi triển khai lại; script import
không sửa hoặc xóa JSONL.

Hai file `.env` chứa cấu hình riêng và secret, không được commit lên Git.

## DNS và HTTPS

Trước khi chạy Compose, cả hai domain phải có DNS `A record` trỏ về địa chỉ
IPv4 của VPS:

- `diachung.dpdns.org`
- `api.theoria-lab.io.vn`

Nếu DNS chưa trỏ đúng, Caddy sẽ không thể lấy chứng chỉ HTTPS từ Let's Encrypt.

## Firewall

Chỉ cần mở hai cổng public trên VPS:

- `80/tcp`
- `443/tcp`

Không cần mở cổng `3000` hoặc `8000`. Frontend và backend chỉ được truy cập
trong Docker network nội bộ thông qua Caddy.

## Khởi chạy

Chạy các service từ thư mục root của repo:

```bash
docker compose -f deploy/compose.yaml up --build -d
```

Xác minh sau triển khai:

```bash
curl --fail https://api.theoria-lab.io.vn/health
curl --fail https://api.theoria-lab.io.vn/ready
docker compose -f deploy/compose.yaml ps
```

Sau khi đăng nhập bằng phiên admin, kiểm tra `/api/metrics` và đối chiếu
`X-Request-ID` với log JSON. Quy trình cảnh báo, xử lý sự cố và phục hồi dữ liệu
được ghi tại `docs/OPERATIONS_RUNBOOK.md`.

Backend chạy bằng user không đặc quyền, root filesystem chỉ đọc và chỉ volume
`runs_data` được phép ghi. Khi rollback, checkout commit đã kiểm thử trước đó và
chạy lại lệnh `docker compose ... up --build -d`; không xóa volume audit.

Caddy tự động lấy và gia hạn chứng chỉ HTTPS. Chứng chỉ được lưu trong named
volume `caddy_data`; không xóa volume này khi deploy lại.

Lệnh `docker compose down` thông thường không xóa named volume. Không sử dụng
`docker compose down -v` trừ khi chủ động muốn xóa dữ liệu chứng chỉ.
