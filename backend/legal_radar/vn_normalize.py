# Vietnamese text normalization helpers

import re
import unicodedata


def strip_diacritics(text: str) -> str:
    """Remove Vietnamese diacritics: 'triệu' -> 'trieu', 'tổ chức' -> 'to chuc'."""
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))


# Non-diacritics keyword patterns (used when input lacks diacritics)
_NO_DIACRITICS_PATTERNS = {
    # Money
    "trieu": "triệu",
    "củ": "triệu",
    "chai": "triệu",
    # Subject
    "to chuc": "tổ chức",
    "ca nhan": "cá nhân",
    "cong ty": "công ty",
    "doanh nghiep": "doanh nghiệp",
    "hoi nhom": "hội nhóm",
    # Legal
    "nghi dinh": "nghị định",
    "quy dinh": "quy định",
    "dieu luat": "điều luật",
    "hinh phat": "hình phạt",
    "vi pham": "vi phạm",
    "thong tin": "thông tin",
    "su that": "sự thật",
    "gia mao": "giả mạo",
    "xuc pham": "xúc phạm",
    "vu khong": "vu khống",
    "hoang mang": "hoang mang",
    "tin gia": "tin giả",
    "tin don": "tin đồn",
    "lam dung": "lạm dụng",
    "loi dung": "lợi dụng",
}
