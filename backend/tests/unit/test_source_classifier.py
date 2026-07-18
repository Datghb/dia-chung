import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from backend.legal_radar.source_classifier import (
    classify_tier,
    apply_fusion_rules,
    xac_thuc_nguon,
    SearchDoc,
    NhanNguon,
)


class TestClassifyTier:
    def test_gov_vn_is_tier0(self):
        assert classify_tier("https://sbv.gov.vn/tin-tuc") == 0
        assert classify_tier("https://moh.gov.vn/thong-bao") == 0
        assert classify_tier("https://bocongan.gov.vn/") == 0

    def test_chinhphu_is_tier0(self):
        assert classify_tier("https://chinhphu.vn/portal/page") == 0

    def test_ttxvn_is_tier1(self):
        assert classify_tier("https://baotintuc.vn/xa-hoi") == 1

    def test_vtv_is_tier1(self):
        assert classify_tier("https://vtv.vn/tin-tuc") == 1

    def test_nhandan_is_tier1(self):
        assert classify_tier("https://nhandan.vn/phap-luat") == 1

    def test_suckhoedoisong_is_tier1(self):
        assert classify_tier("https://suckhoedoisong.vn/thoi-su") == 1

    def test_vnexpress_is_tier2(self):
        assert classify_tier("https://vnexpress.net/phap-luat") == 2

    def test_tuoitre_is_tier2(self):
        assert classify_tier("https://tuoitre.vn/tin-moi") == 2

    def test_baotuyenquang_is_tier2(self):
        assert classify_tier("https://baotuyenquang.com.vn/phap-luat/") == 2

    def test_unknown_domain_is_tier2(self):
        assert classify_tier("https://some-random-blog.com/article") == 2

    def test_case_insensitive(self):
        assert classify_tier("https://SBV.GOV.VN/tin") == 0
        assert classify_tier("https://VNEXPRESS.NET/tin") == 2

    def test_subdomain_gov(self):
        assert classify_tier("https://tintuc.chinhphu.vn/") == 0


class TestApplyFusionRules:
    def test_empty_docs(self):
        nhan, matched, ly_do = apply_fusion_rules([], "2026-07-10")
        assert nhan == NhanNguon.CHUA_TIM_THAY_NGUON
        assert matched == []

    def test_tier0_confirm(self):
        docs = [
            SearchDoc("d1", 0, "SBV", "SBV xác nhận", "nội dung", "2026-07-01",
                       "https://sbv.gov.vn", la_xac_nhan=True)
        ]
        nhan, matched, ly_do = apply_fusion_rules(docs, "2026-07-10")
        assert nhan == NhanNguon.CO_NGUON_XAC_NHAN
        assert len(matched) == 1

    def test_two_tier1_confirm(self):
        docs = [
            SearchDoc("d1", 1, "TTXVN", "TTXVN xác nhận", "nội dung", "2026-07-01",
                       "https://baotintuc.vn", la_xac_nhan=True),
            SearchDoc("d2", 1, "Nhân Dân", "ND xác nhận", "nội dung", "2026-07-02",
                       "https://nhandan.vn", la_xac_nhan=True),
        ]
        nhan, matched, ly_do = apply_fusion_rules(docs, "2026-07-10")
        assert nhan == NhanNguon.CO_NGUON_XAC_NHAN
        assert len(matched) == 2

    def test_one_tier1_not_enough(self):
        docs = [
            SearchDoc("d1", 1, "TTXVN", "TTXVN", "nội dung", "2026-07-01",
                       "https://baotintuc.vn", la_xac_nhan=True),
        ]
        nhan, matched, ly_do = apply_fusion_rules(docs, "2026-07-10")
        assert nhan == NhanNguon.CHUA_TIM_THAY_NGUON

    def test_deny_after_claim_time(self):
        docs = [
            SearchDoc("d1", 0, "SBV", "SBV bác bỏ", "nội dung", "2026-07-15",
                       "https://sbv.gov.vn", la_bac_bo=True),
        ]
        nhan, matched, ly_do = apply_fusion_rules(docs, "2026-07-10")
        assert nhan == NhanNguon.CO_BAC_BO_CHINH_THUC

    def test_deny_before_claim_time_not_counted(self):
        docs = [
            SearchDoc("d1", 0, "SBV", "SBV bác bỏ", "nội dung", "2026-07-01",
                       "https://sbv.gov.vn", la_bac_bo=True),
        ]
        nhan, matched, ly_do = apply_fusion_rules(docs, "2026-07-10")
        assert nhan == NhanNguon.CHUA_TIM_THAY_NGUON


class TestXacThucNguon:
    def test_full_pipeline_with_gov_url(self):
        results = [
            {
                "id": "r1",
                "nguon": "SBV",
                "tieu_de": "SBV bác bỏ tin đồn",
                "noi_dung_tom_tat": "NHNN xác nhận",
                "ngay_dang": "2026-07-01",
                "url": "https://sbv.gov.vn/thong-bao",
                "la_xac_nhan": True,
            }
        ]
        nhan, matched, ly_do = xac_thuc_nguon(
            ["tin đồn", "ngân hàng"], "2026-07-10", results
        )
        assert nhan == NhanNguon.CO_NGUON_XAC_NHAN
        assert len(matched) == 1
        assert matched[0]["tier"] == 0

    def test_empty_results(self):
        nhan, matched, ly_do = xac_thuc_nguon(["test"], "2026-07-10", [])
        assert nhan == NhanNguon.CHUA_TIM_THAY_NGUON
        assert matched == []

    def test_tier_classified_from_url(self):
        results = [
            {
                "id": "r1",
                "nguon": "VnExpress",
                "tieu_de": "Bài báo",
                "noi_dung_tom_tat": "Nội dung",
                "ngay_dang": "2026-07-01",
                "url": "https://vnexpress.net/tin",
                "la_xac_nhan": True,
            }
        ]
        nhan, matched, ly_do = xac_thuc_nguon(["test"], "2026-07-10", results)
        assert matched[0]["tier"] == 2




