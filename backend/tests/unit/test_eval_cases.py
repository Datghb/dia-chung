import json
import os

EVAL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "eval")


def _load(filename):
    path = os.path.join(EVAL_DIR, filename)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


class TestEvalCases:
    def setup_method(self):
        self.cases = _load("cases.json")

    def test_file_is_list(self):
        assert isinstance(self.cases, list)
        assert len(self.cases) == 24

    def test_required_fields(self):
        for case in self.cases:
            assert "id" in case, f"Missing 'id'"
            assert "group" in case, f"Missing 'group' in {case['id']}"
            assert "comment" in case, f"Missing 'comment' in {case['id']}"
            assert "expected_label" in case or "expected_refuse" in case or "expected_anonymized" in case, \
                f"{case['id']}: missing expected outcome"

    def test_unique_ids(self):
        ids = [c["id"] for c in self.cases]
        assert len(ids) == len(set(ids)), "Duplicate eval case IDs"

    def test_expected_labels_valid(self):
        valid = {"dung", "hieu_lam", "can_kiem_chung"}
        for case in self.cases:
            if "expected_label" in case:
                assert case["expected_label"] in valid, \
                    f"{case['id']}: invalid expected_label '{case['expected_label']}'"

    def test_groups_coverage(self):
        groups = {c["group"] for c in self.cases}
        required_groups = {"dung", "hieu_lam", "can_kiem_chung", "study_case",
                           "chong_phat_oan", "chong_lot_luoi", "injection",
                           "out_of_domain", "pii"}
        missing = required_groups - groups
        assert not missing, f"Missing groups: {missing}"

    def test_dung_cases_have_citations(self):
        dung_cases = [c for c in self.cases if c["group"] == "dung"]
        for case in dung_cases:
            assert case.get("expected_citations_non_empty") is True, \
                f"{case['id']}: dung case should expect non-empty citations"

    def test_hieu_lam_cases_have_reason(self):
        hieu_lam_cases = [c for c in self.cases if c["group"] == "hieu_lam"]
        for case in hieu_lam_cases:
            assert "expected_reason_contains" in case, \
                f"{case['id']}: hieu_lam case should specify expected_reason_contains"

    def test_injection_case_exists(self):
        injection = [c for c in self.cases if c["group"] == "injection"]
        assert len(injection) >= 1
        assert injection[0].get("expected_no_crash") is True

    def test_pii_case_exists(self):
        pii = [c for c in self.cases if c["group"] == "pii"]
        assert len(pii) >= 1
        assert pii[0].get("expected_anonymized") is True

    def test_out_of_domain_case_exists(self):
        ood = [c for c in self.cases if c["group"] == "out_of_domain"]
        assert len(ood) >= 1
        assert ood[0].get("expected_refuse") is True

    def test_comments_not_empty(self):
        for case in self.cases:
            assert len(case["comment"].strip()) > 5, \
                f"{case['id']}: comment too short"





