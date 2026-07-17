# 14 — Handoff P2.7: nối `tich_hop_nguon()` vào `pipeline.py`

**Từ:** A1 (Engine Architect)
**Đến:** B1 (Data Pipeline Lead)
**File bị ảnh hưởng:** `backend/legal_radar/pipeline.py` — `CommentIngestor.process_one()`

---

## Bối cảnh

P2.7 (theo plan) yêu cầu: nhãn nguồn (`nhan_nguon`, kết quả xác thực nguồn của A2 — `xac_thuc_nguon()`) phải được hợp nhất vào `ly_do` của claim, và **claim kêu gọi hành động (report/tẩy chay/cảnh báo...) mà chưa tìm thấy nguồn xác minh nào thì phải được đẩy lên đầu hàng đợi**.

Hiện tại `process_one()` đã tự làm việc này một cách thủ công (nối chuỗi `ly_do`, cộng `priority` tay), nhưng:
- Logic không nằm trong `engine.py` nên không test độc lập được.
- Thiếu hẳn phần "kêu gọi hành động + không nguồn → đẩy top".
- Không phân biệt `co_nguon_xac_nhan` với `co_bac_bo_chinh_thuc` khi gắn vào `ly_do`.

A1 đã viết hàm pure `tich_hop_nguon()` trong `backend/legal_radar/engine.py` để thay thế phần này, có test đầy đủ (`backend/tests/unit/test_engine.py::TestTichHopNguon`, `TestDetectCallToAction`).

## Hàm mới

```python
def tich_hop_nguon(
    nhan: NhanPhanLoai,
    ly_do: str,
    nhan_nguon: NhanNguon,
    ly_do_nguon: str,
    claim: str,
) -> tuple[str, int]:
    """Trả về (ly_do_moi, priority_bump)."""
```

Quy tắc:
- `co_bac_bo_chinh_thuc` hoặc `co_nguon_xac_nhan` → nối `ly_do_nguon` vào `ly_do` (dạng `"{ly_do} | Nguồn: {ly_do_nguon}"`).
- `co_bac_bo_chinh_thuc` → `priority_bump = 2` (khẩn — có nguồn chính thức bác bỏ).
- `chua_tim_thay_nguon` **+** claim chứa pattern kêu gọi hành động (`_detect_call_to_action()`, vd "tẩy chay", "report ngay", "cảnh giác", "chia sẻ ngay"...) → `priority_bump = 1` (đẩy top).
- Các trường hợp khác → `priority_bump = 0`, `ly_do` giữ nguyên.

Hàm **không** tự đổi `nhan` (nhãn phân loại hành vi RAG1) — chỉ gộp lời giải thích + tính priority. Việc gán `priority` cuối cùng cho `QueueItem` vẫn là quyết định của pipeline (cộng với priority nền hiện có, ví dụ `1 if nhan == HIEU_LAM else 0`).

## Việc cần làm ở `pipeline.py`

Trong `CommentIngestor.process_one()`, đoạn hiện tại:

```python
if nhan_nguon.value == "co_bac_bo_chinh_thuc":
    ly_do = f"{ly_do} | Nguon: {ly_do_nguon}"
priority = 1 if nhan == NhanPhanLoai.HIEU_LAM else 0
if nhan_nguon.value == "chua_tim_thay_nguon":
    priority += 1
```

→ thay bằng:

```python
from .engine import tich_hop_nguon  # thêm vào import ở đầu file

...

ly_do, priority_bump = tich_hop_nguon(nhan, ly_do, nhan_nguon, ly_do_nguon, extracted["claim"])
priority = (1 if nhan == NhanPhanLoai.HIEU_LAM else 0) + priority_bump
```

Lưu ý: logic cũ tăng priority cho **mọi** claim chưa tìm thấy nguồn (kể cả claim trung tính) — bản mới chỉ tăng priority khi chưa tìm thấy nguồn **và** claim có kêu gọi hành động, tránh đẩy oan các bình luận trung tính lên đầu hàng đợi.

## Kiểm tra sau khi nối

Không có test nào hiện tại assert vào logic cũ trong `pipeline.py` nên an toàn để thay. Sau khi nối, chạy:

```bash
cd backend
python -m pytest tests/ -q
```

Nếu muốn thêm test riêng cho `process_one()` với case "kêu gọi hành động + chưa có nguồn", đặt trong `backend/tests/unit/test_integration.py` hoặc file mới `test_pipeline.py`.
