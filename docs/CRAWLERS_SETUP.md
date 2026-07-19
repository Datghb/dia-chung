# Cấu hình crawler Facebook, YouTube và báo chí

Backend đọc cấu hình từ `backend/.env`. Không commit file này và không đưa API
key vào source code.

## Biến môi trường

```env
BRIGHTDATA_API_KEY=
YOUTUBE_API_KEY=
CRAWL_NEWS_ENABLED=true
```

Thiếu cấu hình của nền tảng nào thì scheduler bỏ qua nền tảng đó; các crawler
còn lại vẫn chạy.

## Lấy YouTube API key

1. Mở [Google Cloud Console](https://console.cloud.google.com/), tạo hoặc chọn
   một project.
2. Vào **APIs & Services → Library**, tìm và bật **YouTube Data API v3**.
3. Vào **APIs & Services → Credentials → Create credentials → API key**.
4. Chọn **Edit API key**:
   - đặt **API restrictions** thành **Restrict key**;
   - chỉ chọn **YouTube Data API v3**;
   - nếu backend có IP ra Internet cố định, thêm giới hạn IP trong
     **Application restrictions**.
5. Điền key vào `YOUTUBE_API_KEY` trong `backend/.env`.

Crawler chỉ đọc dữ liệu công khai nên không cần OAuth client ID. `search.list`
tiêu tốn quota đáng kể; tránh đặt lịch crawl quá dày hoặc dùng quá nhiều từ
khóa.

Kiểm tra key:

```bash
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=sap+nhap+tinh&key=YOUR_KEY"
```

## Nguồn báo chí RSS

Crawler báo chí không cần API key. Mặc định hệ thống đọc các RSS do VnExpress,
Tuổi Trẻ, Dân Trí và VietNamNet cung cấp, chỉ giữ tiêu đề, mô tả, liên kết,
tòa soạn và thời gian xuất bản. Đặt `CRAWL_NEWS_ENABLED=false` để tắt nguồn này.

## Chạy thử

Từ thư mục repo:

```bash
cd backend
python -m pytest tests/unit/test_crawlers.py
python -c "from legal_radar.crawlers.scheduler import crawl_now; print(crawl_now(max_posts_per_platform=2))"
```

Nếu chạy bằng Docker Compose, cập nhật `backend/.env` rồi tạo lại container:

```bash
docker compose -f deploy/compose.yaml up -d --build backend
```
