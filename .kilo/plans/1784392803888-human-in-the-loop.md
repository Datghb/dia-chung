# Human-in-the-Loop Review System

## Mục tiêu

Thêm workflow cán bộ review kết quả AI: xem hồ sơ → ghi chú → override nhãn (Đúng/Hiểu lầm/Cần kiểm chứng) → đánh dấu đã xử lý. Có audit trail đơn giản.

## Quyết định thiết kế

| Quyết định | Lựa chọn |
|-----------|----------|
| Override nhãn AI | ✅ Cán bộ sửa được nhãn + ghi lý do |
| Phân công cán bộ | ❌ Không — team nhỏ, tự chọn |
| Audit trail | ✅ JSONL append-only (`runs/audit.jsonl`) |
| Storage | JSONL files (không thêm DB) |

## Data Model Changes

### QueueItem (model.py) — thêm fields

```python
reviewer_label: str = ""           # Nhãn cán bộ override (rỗng = chưa override)
reviewer_reason: str = ""          # Lý do cán bộ ghi
reviewer_note: str = ""            # Ghi chú chung của cán bộ
reviewed_at: str = ""              # ISO timestamp khi review
```

### AuditEntry — dataclass mới

```python
@dataclass
class AuditEntry:
    case_id: str
    action: str          # "status_change" | "label_override" | "note_added"
    actor: str           # "system" hoặc tên cán bộ (future)
    old_value: str
    new_value: str
    note: str
    timestamp: str       # ISO format
```

## API Changes

### Mở rộng PATCH `/api/cases/{case_id}/status`

Body hiện tại: `{"status": "reviewing"}`

Body mới:
```json
{
  "status": "resolved",
  "reviewer_label": "hieu_lam",        // optional — override nhãn AI
  "reviewer_reason": "Mức phạt sai...", // optional — lý do override
  "reviewer_note": "Cần gửi cảnh báo"   // optional — ghi chú
}
```

### Thêm GET `/api/cases/{case_id}/audit`

Trả về lịch sử thay đổi của 1 hồ sơ:
```json
[
  {"action": "status_change", "old": "new", "new": "reviewing", "timestamp": "..."},
  {"action": "label_override", "old": "dung", "new": "hieu_lam", "note": "...", "timestamp": "..."}
]
```

## Frontend Changes

### case-detail.tsx — Review Panel

Thêm section "ĐÁNH GIÁ CÁN BỘ" sau "KẾT QUẢ THẨM ĐỊNH AI":

```
┌─────────────────────────────────────┐
│ ĐÁNH GIÁ CÁN BỘ                     │
│                                      │
│ Nhãn cán bộ: [Đúng ▼] [Hiểu lầm ▼] │
│              [Cần kiểm chứng ▼]      │
│                                      │
│ Lý do: [textarea]                    │
│ Ghi chú: [textarea]                  │
│                                      │
│ [Lưu đánh giá]  [Đánh dấu đã xử lý] │
└─────────────────────────────────────┘
```

### queue-view.tsx — Badge phân biệt

- Hồ sơ chưa review: badge "Mới" (xám)
- Đang review: badge "Đang xử lý" (vàng)
- Đã review + override: badge "Đã xử lý" + icon override (xanh lá)
- Đã review + không override: badge "Đã xử lý" (xanh lá)

### case-detail.tsx — Audit History

Hiển thị timeline nhỏ cuối trang:
```
Lịch sử:
• 19/07 08:30 — Mới → Đang xử lý
• 19/07 09:15 — Override nhãn: Đúng → Hiểu lầm (Mức phạt sai)
• 19/07 09:16 — Đang xử lý → Đã xử lý
```

## Files cần sửa

| File | Change |
|------|--------|
| `backend/legal_radar/model.py` | Thêm `reviewer_label`, `reviewer_reason`, `reviewer_note`, `reviewed_at` vào QueueItem |
| `backend/legal_radar/api/schemas.py` | Thêm fields vào `StatusUpdate` request + `QueueItemResponse` |
| `backend/legal_radar/api/data_access.py` | Update `update_queue_item_status()` — ghi override + append audit log |
| `backend/legal_radar/api/routes/queue.py` | Thêm `GET /cases/{id}/audit`, mở rộng PATCH body |
| `backend/legal_radar/guardrails.py` | Thêm `validate_reviewer_label()` — chỉ chấp nhận 3 nhãn |
| `frontend/components/cases/case-detail.tsx` | Thêm Review Panel + Audit Timeline |
| `frontend/types/index.ts` | Thêm `reviewerLabel`, `reviewerReason`, `reviewerNote` |
| `frontend/utils/api.ts` | Map reviewer fields |
| `frontend/hooks/use-queries.ts` | Thêm `useAuditQuery()` hook |

## Implementation Order

1. **Backend data model** — QueueItem fields + AuditEntry dataclass
2. **Backend API** — schemas + routes + data_access + guardrails
3. **Frontend types** — update Case type + ApiQueueItem
4. **Frontend Review Panel** — case-detail.tsx UI
5. **Frontend Audit Timeline** — case-detail.tsx history section
6. **Tests** — unit tests cho review workflow

## Validation

- Cán bộ override nhãn → `reviewer_label` ghi vào JSONL
- Audit log append-only → mỗi thay đổi ghi 1 dòng
- `validate_reviewer_label()` reject nhãn không hợp lệ
- Status workflow: `new` → `reviewing` → `resolved` (không quay lại)
- Nếu có `reviewer_label` → status tự chuyển `resolved`
