from __future__ import annotations

import re
import math
from collections import Counter
from typing import Any

from .model import (
    KnowledgeGraph, DieuKhoan, MucPhat, HanhVi, LoaiChuThe,
    NhanPhanLoai, NhanNguon, QueueItem,
)


# ── P2.1: Tính mức phạt theo chủ thể ──

def muc_phat_cho_chu_the(mp: MucPhat, loai_chu_the: LoaiChuThe) -> tuple[int, int]:
    if loai_chu_the == LoaiChuThe.TO_CHUC:
        return (mp.min_vnd, mp.max_vnd)
    return (mp.min_vnd // 2, mp.max_vnd // 2)


# ── Normalize text ────────────────────────────────────────────────────────

# Vietnamese MXH slang → formal Vietnamese
# Curated: chỉ giữ key được test/hàm downstream dùng thật.
# Đã bỏ ~136 key English/teen-code không ai tham chiếu (flex, cancel, catfish
# nhóm clout/ratio/brigade/purge/simp/stan/sus/slay...) + fix 6 duplicate key
# (giá trị đầu bị đè âm thầm bởi giá trị sau — vd "k" từng vừa là "nghìn" vừa
# là "không", giữ đúng 1 nghĩa "không" vì đó là hành vi thực tế trước đây).
_SLANG_MAP: dict[str, str] = {
    # ── Money slang ──
    "củ": "triệu",
    "chai": "triệu",
    "lít": "triệu",
    "cành": "triệu",
    "trái": "triệu",

    # ── Social media action slang ──
    "share": "chia sẻ",
    "reup": "tải lại",
    "cap": "chụp màn hình",
    "comment": "bình luận",
    "cmt": "bình luận",
    "block": "chặn",
    "report": "báo cáo",
    "ban": "cấm",
    "tag": "gắn nhãn",
    "livestream": "phát sóng trực tiếp",
    "page": "trang",
    "mod": "điều hành viên",

    # ── Content / behavior slang ──
    "fake": "giả",
    "news": "tin",
    "bóc phốt": "vạch trần",
    "bóc p": "vạch trần",
    "phốt": "sự thật",
    "scam": "lừa đảo",
    "lùa gà": "lừa đảo",
    "viral": "lan truyền",
    "trending": "xu hướng",
    "catfish": "giả mạo danh tính",
    "drama": "lùm xùm",
    "sub": "ám chỉ",
    "tea": "tin đồn",
    "spill the tea": "lan truyền tin đồn",

    # ── Vietnamese informal / teen code ──
    "bl": "bình luận",
    "ib": "nhắn tin riêng",
    "ate": "làm tốt",
    "periodt": "vậy thôi",
    "ngl": "thật lòng mà nói",
    "fr": "thật sự",
    "ong": "anh",
    "ko": "không",
    "k": "không",
    "hông": "không",
    "j": "gì",
    "z": "vậy",
    "r": "rồi",
    "uk": "ừ",
    "v": "vậy",
    "thui": "thôi",
    "bóc": "vạch trần",
    "bị ban": "bị cấm",
}


def normalize_text(text: str) -> str:
    if not text:
        return ""
    result = text.lower()

    # Multi-word slang first (longer phrases before shorter)
    multi = {k: v for k, v in _SLANG_MAP.items() if " " in k}
    for slang, standard in sorted(multi.items(), key=lambda x: -len(x[0])):
        result = result.replace(slang, standard)

    # Single-word slang with word boundary
    single = {k: v for k, v in _SLANG_MAP.items() if " " not in k}
    for slang, standard in single.items():
        result = re.sub(r'(?<!\w)' + re.escape(slang) + r'(?!\w)', standard, result)

    return result


# ── P2.2: Match hành vi trong KG (BM25-like scoring) ──

def _tokenize(text: str) -> list[str]:
    normalized = normalize_text(text)
    return [w for w in re.findall(r'[\w]+', normalized) if len(w) >= 2]


def _bm25_score(query_tokens: list[str], doc_tokens: list[str], k1: float = 1.5, b: float = 0.75) -> float:
    if not query_tokens or not doc_tokens:
        return 0.0
    doc_len = len(doc_tokens)
    avg_dl = 10.0
    tf = Counter(doc_tokens)
    score = 0.0
    for qt in query_tokens:
        if qt in tf:
            f = tf[qt]
            numerator = f * (k1 + 1)
            denominator = f + k1 * (1 - b + b * doc_len / avg_dl)
            score += math.log(1 + numerator / denominator)
    return score


def match_hanh_vi(text: str, kg: KnowledgeGraph, min_score: float = 0.8) -> list[DieuKhoan]:
    if not text.strip():
        return []

    query_tokens = _tokenize(text)
    if not query_tokens:
        return []

    hanh_vis: list[HanhVi] = [n for n in kg.nodes if isinstance(n, HanhVi)]

    scored: list[tuple[float, str]] = []
    for hv in hanh_vis:
        hv_tokens = _tokenize(hv.mo_ta)
        score = _bm25_score(query_tokens, hv_tokens)
        if score >= min_score:
            scored.append((score, hv.id))

    scored.sort(key=lambda x: -x[0])

    result: list[DieuKhoan] = []
    seen: set[str] = set()
    for _, hv_id in scored:
        for dk in kg.get_dieu_khoan_for_hanh_vi(hv_id):
            if dk.id not in seen:
                result.append(dk)
                seen.add(dk.id)
    return result


# ── P2.3: Phân loại claim ──

_AMOUNT_RANGE_RE = re.compile(r'(\d+)\s*(?:[-\u2013\u2014~])\s*(\d+)\s*(?:trieu|tri\u1ec7u|tr)')
_AMOUNT_SINGLE_RE = re.compile(r'(\d+)\s*(?:trieu|tri\u1ec7u|tr)\b')


def _extract_amounts_millions(text: str) -> list[tuple[int, int]]:
    normalized = normalize_text(text)
    amounts = [(int(m.group(1)), int(m.group(2))) for m in _AMOUNT_RANGE_RE.finditer(normalized)]
    if not amounts:
        for m in _AMOUNT_SINGLE_RE.finditer(normalized):
            val = int(m.group(1))
            amounts.append((val, val))
    return amounts


def _detect_subject_type(text: str) -> str | None:
    normalized = normalize_text(text)
    ca_nhan_patterns = [
        r'\bcá\s*nhân\b', r'\bngười\s+dùng\b', r'\btài\s+khoản\b',
        r'\buser\b', r'\bkol\b', r'\btiktoker\b', r'\bhot\s*girl\b',
        r'\bhot\s*boy\b', r'\bstreamer\b', r'\byoutuber\b',
        r'\binfluencer\b', r'\bcreator\b', r'\bnick\b',
    ]
    to_chuc_patterns = [
        r'\btổ\s*chức\b', r'\bdoanh\s*nghiệp\b', r'\bcông\s*ty\b',
        r'\bfanpage\b', r'\bpage\b.*\bcộng\s*đồng\b',
        r'\btrang\b.*\bcộng\s*đồng\b',
        r'\bnhóm\b.*\bcộng\s*đồng\b', r'\bhội\s*nhóm\b',
        r'\bwebsite\b', r'\btrang\s*tin\b',
    ]
    for p in ca_nhan_patterns:
        if re.search(p, normalized):
            return "ca_nhan"
    for p in to_chuc_patterns:
        if re.search(p, normalized):
            return "to_chuc"
    return None


def _detect_old_regulation(text: str) -> bool:
    normalized = normalize_text(text)
    old_patterns = [
        r'\bnd\s*15\b', r'\bnđ\s*15\b', r'\bnghị\s*định\s*15\b',
        r'\b15/2020\b', r'\b101\b.*\bnđ\s*15\b', r'\bnđ15\b',
        r'\bquy\s*định\s*cũ\b', r'\bluật\s*cũ\b', r'\btrước\s*2026\b',
        r'\btrước\s*01.*7.*2026\b',
    ]
    return any(re.search(p, normalized) for p in old_patterns)


def _detect_conditional_claim(text: str) -> bool:
    normalized = normalize_text(text)
    patterns = [
        r'\bnếu\b', r'\bcó\s*thể\b', r'\bliệu\b', r'\bchắc\s*không\b',
        r'\bphải\s*không\b', r'\bđúng\s*không\b', r'\bcó\s*ko\b',
        r'\bko\b.*\bthật\s*à\b', r'\bthật\s*à\b', r'\bthật\s*hay\s*giả\b',
        r'\bnghe\s*nói\b', r'\bnghe\s*đồn\b', r'\btin\s*đồn\b',
        r'\bchưa\s*xác\s*nhận\b', r'\bkhông\s*chắc\b',
    ]
    return any(re.search(p, normalized) for p in patterns)


def _get_penalty_range_millions(dk: DieuKhoan, kg: KnowledgeGraph) -> tuple[int, int] | None:
    for mp_node in kg.get_muc_phat_for_dieu_khoan(dk.id):
        if isinstance(mp_node, MucPhat):
            return (mp_node.min_vnd // 1_000_000, mp_node.max_vnd // 1_000_000)

    # Fallback: cùng khoản (dieu+khoan) thường chung 1 khung phạt cho mọi điểm —
    # dùng MucPhat của điểm chị em nếu điểm này chưa có MucPhat riêng.
    for sibling in kg.nodes:
        if (
            isinstance(sibling, DieuKhoan)
            and sibling.id != dk.id
            and sibling.dieu == dk.dieu
            and sibling.khoan == dk.khoan
        ):
            for mp_node in kg.get_muc_phat_for_dieu_khoan(sibling.id):
                if isinstance(mp_node, MucPhat):
                    return (mp_node.min_vnd // 1_000_000, mp_node.max_vnd // 1_000_000)
    return None


def _build_citation(dk: DieuKhoan, kg: KnowledgeGraph) -> str:
    parts = [f"Điều {dk.dieu} khoản {dk.khoan}"]
    if dk.diem:
        parts.append(f"điểm {dk.diem}")
    van_ban = kg.find_node(dk.van_ban_id)
    parts.append(van_ban.so_hieu if van_ban else dk.van_ban_id)
    return " ".join(parts)


def phan_loai_claim(
    claim: str,
    loai_chu_the: str | None,
    kg: KnowledgeGraph,
) -> tuple[NhanPhanLoai, str, list[str]]:
    if not claim.strip():
        return (NhanPhanLoai.CAN_KIEM_CHUNG, "Claim rỗng", [])

    auto_subject = _detect_subject_type(claim)
    effective_subject = loai_chu_the or auto_subject

    matched_dks = match_hanh_vi(claim, kg)
    amounts = _extract_amounts_millions(claim)

    _ND15_K1_RANGE = (10, 20)
    _ND15_K1_CA_NHAN = (5, 10)
    _ND174_K1_RANGE = (20, 30)
    _ND174_K2_RANGE = (30, 50)

    has_penalty_keyword = bool(re.search(r'\b(?:phạt|tiền|mức|vi phạm)\b', normalize_text(claim)))

    if _detect_old_regulation(claim):
        old_amounts = [a for a in amounts if a[0] <= 20]
        if old_amounts or not amounts:
            return (
                NhanPhanLoai.HIEU_LAM,
                "Tham chiếu quy định cũ (NĐ15/2020) đã hết hiệu lực từ 01/7/2026 — "
                "khung hiện tại theo NĐ174/2026 là 20-30 triệu (tổ chức), 10-15 triệu (cá nhân)",
                [],
            )

    if not matched_dks:
        if has_penalty_keyword and amounts:
            lo_val, hi_val = amounts[0]
            if (lo_val, hi_val) == _ND15_K1_RANGE or (lo_val, hi_val) == _ND15_K1_CA_NHAN:
                return (
                    NhanPhanLoai.HIEU_LAM,
                    f"Mức {lo_val}-{hi_val} triệu là khung NĐ15/2020 (hết hiệu lực 30/6/2026) — "
                    "khung hiện tại theo NĐ174/2026 là 20-30 triệu (tổ chức), 10-15 triệu (cá nhân)",
                    [],
                )
        return (NhanPhanLoai.CAN_KIEM_CHUNG, "Không khớp hành vi nào trong phạm vi đã nạp", [])

    citations = [_build_citation(dk, kg) for dk in matched_dks[:2]]

    if effective_subject is None:
        if _detect_conditional_claim(claim):
            return (
                NhanPhanLoai.CAN_KIEM_CHUNG,
                "Claim có điều kiện/ngoại lệ + thiếu chủ thể — cần cán bộ đối chiếu",
                citations,
            )
        return (
            NhanPhanLoai.CAN_KIEM_CHUNG,
            "Thiếu dữ kiện chủ thể (cá nhân/tổ chức) — không đủ căn cứ phân loại",
            citations,
        )

    if effective_subject == "ca_nhan":
        return _classify_ca_nhan(claim, matched_dks, amounts, citations, kg)
    elif effective_subject == "to_chuc":
        return _classify_to_chuc(claim, matched_dks, amounts, citations, kg)

    return (NhanPhanLoai.CAN_KIEM_CHUNG, "Không xác định được loại chủ thể", citations)


def _classify_ca_nhan(
    claim: str,
    matched_dks: list[DieuKhoan],
    amounts: list[tuple[int, int]],
    citations: list[str],
    kg: KnowledgeGraph,
) -> tuple[NhanPhanLoai, str, list[str]]:
    best_dk = matched_dks[0]
    penalty = _get_penalty_range_millions(best_dk, kg)
    expected_ca_nhan = (penalty[0] // 2, penalty[1] // 2) if penalty else (10, 15)

    if not amounts:
        has_amount_word = bool(re.search(r'\b(?:phạt|tiền|mức)\b', normalize_text(claim)))
        if has_amount_word:
            return (
                NhanPhanLoai.CAN_KIEM_CHUNG,
                "Có nhắc mức phạt nhưng không trích dẫn số cụ thể — cần xác minh",
                citations,
            )
        return (NhanPhanLoai.DUNG, "Đúng hành vi + đúng chủ thể cá nhân", citations)

    lo_val, hi_val = amounts[0]

    if lo_val == expected_ca_nhan[0] and hi_val == expected_ca_nhan[1]:
        return (NhanPhanLoai.DUNG, f"Đúng khung cá nhân ({lo_val}-{hi_val} triệu) theo Điều {best_dk.dieu} NĐ174", citations)

    if lo_val == hi_val and expected_ca_nhan[0] <= lo_val <= expected_ca_nhan[1]:
        return (NhanPhanLoai.DUNG, f"Đúng khung cá nhân ({lo_val} triệu, nằm trong {expected_ca_nhan[0]}-{expected_ca_nhan[1]})", citations)

    if lo_val == 5 and hi_val == 10:
        return (
            NhanPhanLoai.HIEU_LAM,
            "Mức 5-10 triệu là khung NĐ15/2020 (hết hiệu lực 30/6/2026) — "
            f"cá nhân theo NĐ174 là {expected_ca_nhan[0]}-{expected_ca_nhan[1]} triệu",
            citations,
        )

    if lo_val >= 20:
        return (
            NhanPhanLoai.HIEU_LAM,
            f"Gán mức tổ chức ({lo_val}-{hi_val} triệu) cho cá nhân — "
            f"thực tế cá nhân chỉ {expected_ca_nhan[0]}-{expected_ca_nhan[1]} triệu (bằng 1/2 mức tổ chức)",
            citations,
        )

    if penalty:
        tc_range = penalty
        if lo_val == tc_range[0] and hi_val == tc_range[1]:
            return (
                NhanPhanLoai.HIEU_LAM,
                f"Mức {lo_val}-{hi_val} triệu là khung tổ chức — cá nhân chỉ {expected_ca_nhan[0]}-{expected_ca_nhan[1]} triệu",
                citations,
            )

    return (
        NhanPhanLoai.CAN_KIEM_CHUNG,
        f"Mức {lo_val}-{hi_val} triệu không khớp khung nào đã nạp cho cá nhân ({expected_ca_nhan[0]}-{expected_ca_nhan[1]} triệu)",
        citations,
    )


def _classify_to_chuc(
    claim: str,
    matched_dks: list[DieuKhoan],
    amounts: list[tuple[int, int]],
    citations: list[str],
    kg: KnowledgeGraph,
) -> tuple[NhanPhanLoai, str, list[str]]:
    best_dk = matched_dks[0]
    penalty = _get_penalty_range_millions(best_dk, kg)

    if not amounts:
        has_amount_word = bool(re.search(r'\b(?:phạt|tiền|mức)\b', normalize_text(claim)))
        if has_amount_word:
            return (
                NhanPhanLoai.CAN_KIEM_CHUNG,
                "Có nhắc mức phạt nhưng không trích dẫn số cụ thể — cần xác minh",
                citations,
            )
        return (NhanPhanLoai.DUNG, "Đúng hành vi + đúng chủ thể tổ chức", citations)

    lo_val, hi_val = amounts[0]

    if penalty and lo_val == penalty[0] and hi_val == penalty[1]:
        return (NhanPhanLoai.DUNG, f"Đúng khung tổ chức ({lo_val}-{hi_val} triệu) theo Điều 95 NĐ174", citations)

    if penalty and lo_val == hi_val and penalty[0] <= lo_val <= penalty[1]:
        return (NhanPhanLoai.DUNG, f"Đúng khung tổ chức ({lo_val} triệu, nằm trong {penalty[0]}-{penalty[1]})", citations)

    if lo_val == 10 and hi_val == 20:
        return (
            NhanPhanLoai.HIEU_LAM,
            "Mức 10-20 triệu là khung NĐ15/2020 (hết hiệu lực 30/6/2026) — "
            f"tổ chức theo NĐ174 là {penalty[0]}-{penalty[1]} triệu" if penalty else
            "Mức 10-20 triệu là khung NĐ15/2020 (hết hiệu lực 30/6/2026)",
            citations,
        )

    if penalty and lo_val > penalty[1]:
        other_penalty = None
        for dk in matched_dks:
            p = _get_penalty_range_millions(dk, kg)
            if p and p[0] <= lo_val <= p[1]:
                other_penalty = (dk, p)
                break
        if other_penalty:
            dk2, p2 = other_penalty
            return (
                NhanPhanLoai.HIEU_LAM,
                f"Mức {lo_val}-{hi_val} triệu thuộc khoản 2 (30-50 triệu), "
                f"không phải khoản 1 ({penalty[0]}-{penalty[1]} triệu) — "
                f"hành vi khoản 1 khác khoản 2",
                [_build_citation(dk2, kg)],
            )
        return (
            NhanPhanLoai.HIEU_LAM,
            f"Mức {lo_val}-{hi_val} triệu vượt khung khoản 1 ({penalty[0]}-{penalty[1]} triệu) — "
            "có thể nhầm lẫn khoản",
            citations,
        )

    if penalty and lo_val < penalty[0]:
        if lo_val == 5 and hi_val == 10:
            return (
                NhanPhanLoai.HIEU_LAM,
                "Mức 5-10 triệu là khung cá nhân NĐ15/2020 — "
                f"tổ chức theo NĐ174 là {penalty[0]}-{penalty[1]} triệu",
                citations,
            )
        return (
            NhanPhanLoai.HIEU_LAM,
            f"Mức {lo_val}-{hi_val} triệu thấp hơn khung tối thiểu ({penalty[0]} triệu) cho tổ chức",
            citations,
        )

    return (
        NhanPhanLoai.CAN_KIEM_CHUNG,
        f"Mức {lo_val}-{hi_val} triệu không khớp khung nào đã nạp",
        citations,
    )


# ── P2.4: Diff THAY_THE ──

def diff_thay_the(dk_id: str, kg: KnowledgeGraph) -> str | None:
    edges = kg.get_thay_the(dk_id)
    if not edges:
        return None

    edge = edges[0]
    old_node = kg.find_node(edge.source)
    new_node = kg.find_node(edge.target)

    parts = []
    if isinstance(old_node, DieuKhoan) and isinstance(new_node, DieuKhoan):
        old_vb = kg.find_node(old_node.van_ban_id)
        new_vb = kg.find_node(new_node.van_ban_id)
        if old_vb and new_vb:
            parts.append(f"{old_vb.so_hieu} → {new_vb.so_hieu}")

        old_mp = _get_penalty_range_millions(old_node, kg)
        new_mp = _get_penalty_range_millions(new_node, kg)
        if old_mp and new_mp:
            parts.append(f"Tổ chức: {old_mp[0]}-{old_mp[1]}tr → {new_mp[0]}-{new_mp[1]}tr")
            parts.append(f"Cá nhân: {old_mp[0]//2}-{old_mp[1]//2}tr → {new_mp[0]//2}-{new_mp[1]//2}tr")

    if edge.dien_giai:
        parts.append(edge.dien_giai)

    return " | ".join(parts) if parts else None


# ── P2.5: Xếp ưu tiên ──

_NHAN_PRIORITY = {
    NhanPhanLoai.CAN_KIEM_CHUNG: 0,
    NhanPhanLoai.HIEU_LAM: 1,
    NhanPhanLoai.DUNG: 2,
}


def xep_uu_tien(items: list[QueueItem]) -> list[QueueItem]:
    return sorted(items, key=lambda x: (-x.priority, _NHAN_PRIORITY.get(x.nhan, 99), x.id))

