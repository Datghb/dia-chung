from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class NhanNguon(str, Enum):
    CO_NGUON_XAC_NHAN = "co_nguon_xac_nhan"
    CO_BAC_BO_CHINH_THUC = "co_bac_bo_chinh_thuc"
    CHUA_TIM_THAY_NGUON = "chua_tim_thay_nguon"


class Tier(int, Enum):
    CO_QUAN_CHINH_PHU = 0
    BAO_CHINH_THONG = 1
    BAO_LON = 2


TIER_0_DOMAINS = [
    ".gov.vn",
    "chinhphu.vn",
    "sbv.gov.vn",
    "moh.gov.vn",
    "bocongan.gov.vn",
    "mic.gov.vn",
    "moj.gov.vn",
    "vietnamgovernment.vn",
]

TIER_1_DOMAINS = [
    "ttxvn.vn",
    "baotintuc.vn",
    "vtv.vn",
    "vnews.vn",
    "nhandan.vn",
    "quochoi.vn",
    "suckhoedoisong.vn",
]

TIER_2_DOMAINS = [
    "vnexpress.net",
    "tuoitre.vn",
    "thanhnien.vn",
    "dantri.com.vn",
    "vietnamnet.vn",
    "plo.vn",
    "nld.com.vn",
    "baotuyenquang.com.vn",
]


def classify_tier(url: str) -> int:
    url_lower = url.lower()
    if ".gov.vn" in url_lower:
        return 0
    for domain in TIER_0_DOMAINS:
        if domain in url_lower:
            return 0
    for domain in TIER_1_DOMAINS:
        if domain in url_lower:
            return 1
    for domain in TIER_2_DOMAINS:
        if domain in url_lower:
            return 2
    return 2


@dataclass(frozen=True)
class SearchDoc:
    id: str
    tier: int
    nguon: str
    tieu_de: str
    noi_dung_tom_tat: str
    ngay_dang: str
    url: str
    la_bac_bo: bool = False
    la_xac_nhan: bool = False


def apply_fusion_rules(
    docs: list[SearchDoc],
    thoi_gian_claim: str,
) -> tuple[NhanNguon, list[SearchDoc], str]:
    if not docs:
        return NhanNguon.CHUA_TIM_THAY_NGUON, [], "Không tìm thấy nguồn"

    confirm_docs = [d for d in docs if d.la_xac_nhan]
    deny_docs = [d for d in docs if d.la_bac_bo]

    tier0_confirms = [d for d in confirm_docs if d.tier == 0]
    tier12_confirms = [d for d in confirm_docs if d.tier in (1, 2)]

    if tier0_confirms:
        return (
            NhanNguon.CO_NGUON_XAC_NHAN,
            tier0_confirms,
            f"{tier0_confirms[0].nguon} (Tier 0) xác nhận",
        )

    if len(tier12_confirms) >= 2:
        return (
            NhanNguon.CO_NGUON_XAC_NHAN,
            tier12_confirms,
            f"{len(tier12_confirms)} nguồn Tier 1/2 độc lập xác nhận",
        )

    tier01_denies = [d for d in deny_docs if d.tier in (0, 1)]
    for d in tier01_denies:
        if d.ngay_dang > thoi_gian_claim:
            return (
                NhanNguon.CO_BAC_BO_CHINH_THUC,
                [d],
                f"{d.nguon} (Tier {d.tier}) bác bỏ ngày {d.ngay_dang}",
            )

    return (
        NhanNguon.CHUA_TIM_THAY_NGUON,
        docs,
        "Tìm thấy nguồn nhưng không đủ điều kiện hợp nhất",
    )


def xac_thuc_nguon(
    claim_keywords: list[str],
    thoi_gian_claim: str,
    search_results: list[dict],
) -> tuple[NhanNguon, list[dict], str]:
    docs: list[SearchDoc] = []
    for r in search_results:
        tier = classify_tier(r.get("url", ""))
        docs.append(
            SearchDoc(
                id=r.get("id", f"dyn-{hash(r.get('url', '')) % 10000}"),
                tier=tier,
                nguon=r.get("nguon", ""),
                tieu_de=r.get("tieu_de", ""),
                noi_dung_tom_tat=r.get("noi_dung_tom_tat", ""),
                ngay_dang=r.get("ngay_dang", ""),
                url=r.get("url", ""),
                la_bac_bo=r.get("la_bac_bo", False),
                la_xac_nhan=r.get("la_xac_nhan", False),
            )
        )

    nhan, matched, ly_do = apply_fusion_rules(docs, thoi_gian_claim)
    return nhan, [vars(d) for d in matched], ly_do
