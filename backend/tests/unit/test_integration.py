import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")
EVAL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "eval")

from backend.legal_radar.source_classifier import classify_tier, apply_fusion_rules, SearchDoc, NhanNguon
from backend.legal_radar.guardrails import validate_label, assert_rule_half, anonymize_pii, sanitize_injection


def _load_json(dirpath, filename):
    with open(os.path.join(dirpath, filename), encoding="utf-8") as f:
        return json.load(f)


class TestKgNodesLoadable:
    def test_load_and_index(self):
        nodes = _load_json(DATA_DIR, "kg/kg_nodes.json")
        by_id = {n["id"]: n for n in nodes}
        assert "nd174-d95-k1-a" in by_id
        assert "nd15-d101-k1-a" in by_id
        assert "mp-d95-k1" in by_id
        assert "ct-ca-nhan" in by_id
        assert "ct-to-chuc" in by_id

    def test_muc_phat_derive_half(self):
        nodes = _load_json(DATA_DIR, "kg/kg_nodes.json")
        mp_nodes = [n for n in nodes if n["type"] == "MucPhat"]
        for mp in mp_nodes:
            to_chuc_min = mp["min_vnd"]
            to_chuc_max = mp["max_vnd"]
            ca_nhan_min = to_chuc_min // 2
            ca_nhan_max = to_chuc_max // 2
            assert_rule_half(to_chuc_min, to_chuc_max, ca_nhan_min, ca_nhan_max)


class TestKgEdgesIntegrity:
    def test_all_edges_reference_existing_nodes(self):
        nodes = _load_json(DATA_DIR, "kg/kg_nodes.json")
        edges = _load_json(DATA_DIR, "kg/kg_edges.json")
        node_ids = {n["id"] for n in nodes}
        for edge in edges:
            assert edge["from_id"] in node_ids, \
                f"Edge {edge['type']}: from_id '{edge['from_id']}' not in nodes"
            assert edge["to_id"] in node_ids, \
                f"Edge {edge['type']}: to_id '{edge['to_id']}' not in nodes"

    def test_thay_the_nd15_to_nd174(self):
        edges = _load_json(DATA_DIR, "kg/kg_edges.json")
        thay_the = [e for e in edges if e["type"] == "THAY_THE"]
        nd15_to_nd174 = [e for e in thay_the
                         if e["from_id"].startswith("nd15") and e["to_id"].startswith("nd174")]
        assert len(nd15_to_nd174) >= 3, \
            f"Expected >=3 THAY_THE edges from NĐ15 to NĐ174, got {len(nd15_to_nd174)}"

    def test_ap_dung_cho_rule_half(self):
        nodes = _load_json(DATA_DIR, "kg/kg_nodes.json")
        edges = _load_json(DATA_DIR, "kg/kg_edges.json")
        node_map = {n["id"]: n for n in nodes}

        ap_dung = [e for e in edges if e["type"] == "AP_DUNG_CHO"]
        by_mp = {}
        for e in ap_dung:
            mp_id = e["from_id"]
            if mp_id not in by_mp:
                by_mp[mp_id] = {}
            by_mp[mp_id][e["to_id"]] = e.get("he_so", 1.0)

        for mp_id, mapping in by_mp.items():
            if "ct-to-chuc" in mapping and "ct-ca-nhan" in mapping:
                assert mapping["ct-to-chuc"] == 1.0, f"{mp_id}: to_chuc he_so != 1.0"
                assert mapping["ct-ca-nhan"] == 0.5, f"{mp_id}: ca_nhan he_so != 0.5"


class TestStudyCasesWithKg:
    def test_study_case_penalty_in_kg_range(self):
        nodes = _load_json(DATA_DIR, "kg/kg_nodes.json")
        cases = _load_json(DATA_DIR, "study_cases/study_cases.json")

        mp_by_dk = {}
        for n in nodes:
            if n["type"] == "MucPhat":
                mp_by_dk[n["dieu_khoan_id"]] = n

        for case in cases:
            exp = case["expected_he_thong"]
            cn_range = exp["muc_phat_ca_nhan_cu"]
            assert cn_range[0] <= case["muc_phat"] <= cn_range[1], \
                f"Study case {case['id']}: penalty {case['muc_phat']} " \
                f"not in expected ca_nhan range {cn_range}"


class TestEvalCasesWithGuardrails:
    def test_dung_labels_valid(self):
        cases = _load_json(EVAL_DIR, "cases.json")
        for case in cases:
            if case.get("expected_label"):
                validate_label(case["expected_label"])

    def test_injection_case_sanitized(self):
        cases = _load_json(EVAL_DIR, "cases.json")
        injection_cases = [c for c in cases if c["group"] == "injection"]
        for case in injection_cases:
            result = sanitize_injection(case["comment"])
            assert result.startswith("[quoted data:"), \
                f"Eval {case['id']}: injection not sanitized"

    def test_pii_case_anonymized(self):
        cases = _load_json(EVAL_DIR, "cases.json")
        pii_cases = [c for c in cases if c["group"] == "pii"]
        for case in pii_cases:
            result = anonymize_pii(case["comment"])
            assert "Nguyễn Văn A" not in result, \
                f"Eval {case['id']}: PII not anonymized"


class TestNd15TrichMd:
    def test_file_exists(self):
        path = os.path.join(DATA_DIR, "legal/nd15_trich.md")
        assert os.path.exists(path), "nd15_trich.md not found"

    def test_contains_dieu_101(self):
        path = os.path.join(DATA_DIR, "legal/nd15_trich.md")
        with open(path, encoding="utf-8") as f:
            content = f.read()
        assert "Điều 101" in content
        assert "10.000.000" in content
        assert "20.000.000" in content

    def test_contains_rule_half(self):
        path = os.path.join(DATA_DIR, "legal/nd15_trich.md")
        with open(path, encoding="utf-8") as f:
            content = f.read()
        assert "1/2" in content


class TestClassifierWithStudyCases:
    def test_classify_study_case_urls(self):
        cases = _load_json(DATA_DIR, "study_cases/study_cases.json")
        for case in cases:
            url = case["nguon_url"]
            tier = classify_tier(url)
            assert tier in (0, 1, 2), f"Case {case['id']}: invalid tier {tier}"


class TestEndToEnd:
    def test_full_flow_mock(self):
        nodes = _load_json(DATA_DIR, "kg/kg_nodes.json")
        edges = _load_json(DATA_DIR, "kg/kg_edges.json")
        cases = _load_json(DATA_DIR, "study_cases/study_cases.json")
        eval_cases = _load_json(EVAL_DIR, "cases.json")

        assert len(nodes) > 0
        assert len(edges) > 0
        assert len(cases) > 0
        assert len(eval_cases) == 14

        node_ids = {n["id"] for n in nodes}
        for edge in edges:
            assert edge["from_id"] in node_ids
            assert edge["to_id"] in node_ids

        for case in cases:
            validate_label(case["expected_he_thong"]["nhan"])

        for eval_case in eval_cases:
            if eval_case.get("expected_label"):
                validate_label(eval_case["expected_label"])





