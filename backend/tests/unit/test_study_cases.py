import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")


def _load(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class TestStudyCases:
    def setup_method(self):
        self.cases = _load("study_cases/study_cases.json")

    def test_file_is_list(self):
        assert isinstance(self.cases, list)
        assert len(self.cases) >= 1

    def test_required_fields(self):
        required = {
            "id", "ten_vu", "nguon_cong_bo", "ngay_quyet_dinh",
            "hanh_vi", "dieu_khoan_vien_dan", "muc_phat", "chu_the",
            "nguon_url", "an_danh", "expected_he_thong",
        }
        for case in self.cases:
            for field in required:
                assert field in case, f"Case {case.get('id')}: missing '{field}'"

    def test_muc_phat_positive(self):
        for case in self.cases:
            assert case["muc_phat"] > 0, f"Case {case['id']}: muc_phat <= 0"

    def test_chu_the_valid(self):
        for case in self.cases:
            assert case["chu_the"] in ("ca_nhan", "to_chuc"), \
                f"Case {case['id']}: invalid chu_the '{case['chu_the']}'"

    def test_ngay_format(self):
        for case in self.cases:
            assert len(case["ngay_quyet_dinh"]) == 10, \
                f"Case {case['id']}: ngay_quyet_dinh not YYYY-MM-DD"

    def test_expected_he_thong_fields(self):
        required = {"dieu_khoan_cu", "dieu_khoan_moi", "muc_phat_to_chuc_cu",
                     "muc_phat_ca_nhan_cu", "muc_phat_to_chuc_moi",
                     "muc_phat_ca_nhan_moi", "nhan", "ghi_chu"}
        for case in self.cases:
            exp = case["expected_he_thong"]
            for field in required:
                assert field in exp, \
                    f"Case {case['id']}: expected_he_thong missing '{field}'"

    def test_expected_nhan_valid(self):
        for case in self.cases:
            assert case["expected_he_thong"]["nhan"] in ("dung", "hieu_lam", "can_kiem_chung"), \
                f"Case {case['id']}: invalid expected nhan"

    def test_muc_phat_ranges_valid(self):
        for case in self.cases:
            exp = case["expected_he_thong"]
            for key in ["muc_phat_to_chuc_cu", "muc_phat_ca_nhan_cu",
                        "muc_phat_to_chuc_moi", "muc_phat_ca_nhan_moi"]:
                rng = exp[key]
                assert len(rng) == 2, f"Case {case['id']}: {key} should be [min, max]"
                assert rng[0] <= rng[1], f"Case {case['id']}: {key} min > max"

    def test_rule_half_in_expected(self):
        for case in self.cases:
            exp = case["expected_he_thong"]
            tc_cu = exp["muc_phat_to_chuc_cu"]
            cn_cu = exp["muc_phat_ca_nhan_cu"]
            tc_moi = exp["muc_phat_to_chuc_moi"]
            cn_moi = exp["muc_phat_ca_nhan_moi"]
            assert cn_cu[0] == tc_cu[0] // 2, \
                f"Case {case['id']}: ca_nhan_cu min != to_chuc_cu min / 2"
            assert cn_cu[1] == tc_cu[1] // 2, \
                f"Case {case['id']}: ca_nhan_cu max != to_chuc_cu max / 2"
            assert cn_moi[0] == tc_moi[0] // 2, \
                f"Case {case['id']}: ca_nhan_moi min != to_chuc_moi min / 2"
            assert cn_moi[1] == tc_moi[1] // 2, \
                f"Case {case['id']}: ca_nhan_moi max != to_chuc_moi max / 2"

    def test_muc_phat_case_in_range(self):
        for case in self.cases:
            exp = case["expected_he_thong"]
            cn_cu = exp["muc_phat_ca_nhan_cu"]
            if case["chu_the"] == "ca_nhan":
                assert cn_cu[0] <= case["muc_phat"] <= cn_cu[1], \
                    f"Case {case['id']}: muc_phat {case['muc_phat']} " \
                    f"not in ca_nhan range {cn_cu}"

    def test_urls_are_real(self):
        for case in self.cases:
            url = case["nguon_url"]
            assert url.startswith("http"), f"Case {case['id']}: invalid URL"
            assert len(url) > 20, f"Case {case['id']}: URL too short"




