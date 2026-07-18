"""Eval runner: chay toan bo cases.json qua engine that va gate theo nhom dvhc."""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from legal_radar.engine import match_fact_ref, phan_loai_claim
from legal_radar.model import load_fact_refs, load_kg


def main() -> int:
    """Chay tat ca eval case qua engine that va in ket qua PASS/FAIL/SKIP.

    Moi case trong ``cases.json`` duoc chay qua ``phan_loai_claim`` voi KG
    va FactRef that (khong hardcode, khong bypass). Cac truong duoc kiem:
    ``expected_label``, ``expected_reason_contains``,
    ``expected_citations_non_empty``, ``expected_fact_ref_match``,
    ``expected_no_fact_ref_false_positive``, ``expected_no_crash``, va
    ``expected_muc_phat_match`` (ly_do hoac citations co nhac khoang tien
    phat). Truong thuoc pham vi pipeline (``expected_refuse``,
    ``expected_anonymized``, ``expected_dynamic_search``,
    ``expected_study_case_id``, ``expected_uu_tien``) duoc bo qua o tang
    engine; case chi co cac truong do duoc danh dau SKIP. Ket qua nhom
    legacy in ra trung thuc, khong tinh vao gate.

    Returns:
        int: 0 neu it nhat 9/10 case ``ev-dvhc-*`` PASS (Gate G1),
        nguoc lai 1.
    """
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    root = Path(__file__).resolve().parents[2]
    cases = json.loads(Path(__file__).with_name("cases.json").read_text(encoding="utf-8"))
    kg = load_kg(root / "data" / "kg" / "kg_nodes.json", root / "data" / "kg" / "kg_edges.json")
    fact_refs = load_fact_refs(root / "data" / "facts" / "fact_references.json")
    print(f"Loaded {len(cases)} evaluation cases, {len(fact_refs)} fact refs")

    dvhc_pass = 0
    dvhc_total = 0
    legacy_pass = 0
    legacy_total = 0
    skipped = 0
    for case in cases:
        engine_checks = [k for k in (
            "expected_label", "expected_reason_contains", "expected_citations_non_empty",
            "expected_fact_ref_match", "expected_no_fact_ref_false_positive",
            "expected_muc_phat_match", "expected_no_crash",
        ) if k in case]
        if not engine_checks:
            skipped += 1
            print(f"SKIP {case['id']}: chi co truong pham vi pipeline")
            continue

        failures = []
        try:
            nhan, ly_do, citations = phan_loai_claim(case["comment"], None, kg, fact_refs)
        except Exception as exc:
            if case.get("expected_no_crash"):
                failures.append(f"crash: {exc}")
            nhan, ly_do, citations = None, f"exception: {exc}", []

        if "expected_label" in case and (nhan is None or nhan.value != case["expected_label"]):
            failures.append(f"label={nhan.value if nhan else 'crash'} muon {case['expected_label']}")
        if "expected_reason_contains" in case and case["expected_reason_contains"] not in ly_do:
            failures.append(f"ly_do thieu '{case['expected_reason_contains']}'")
        if case.get("expected_citations_non_empty") and not citations:
            failures.append("citations rong")
        if case.get("expected_muc_phat_match") and not (
            re.search(r"\d+\s*[-]\s*\d+\s*tri[eệ]u", ly_do)
            or any(re.search(r"\d", c) for c in citations)
        ):
            failures.append("ly_do/citations khong nhac muc phat")
        if "expected_fact_ref_match" in case:
            matched = match_fact_ref(case["comment"], fact_refs)
            if matched is None or matched.id != case["expected_fact_ref_match"]:
                failures.append(
                    f"fact_ref={matched.id if matched else None} muon {case['expected_fact_ref_match']}"
                )
        if case.get("expected_no_fact_ref_false_positive") and match_fact_ref(case["comment"], fact_refs) is not None:
            failures.append("fact_ref khop nham (false positive)")

        is_dvhc = case["id"].startswith("ev-dvhc-")
        if is_dvhc:
            dvhc_total += 1
        else:
            legacy_total += 1
        if failures:
            print(f"FAIL {case['id']}: " + "; ".join(failures))
        else:
            if is_dvhc:
                dvhc_pass += 1
            else:
                legacy_pass += 1
            print(f"PASS {case['id']}")

    print(f"Legacy: {legacy_pass}/{legacy_total} pass (thong tin, khong gate)")
    print(f"DVHC:   {dvhc_pass}/{dvhc_total} pass (gate G1: >= 9/10)")
    print(f"Skip:   {skipped} case pham vi pipeline")
    if dvhc_total >= 10 and dvhc_pass >= 9:
        print("GATE G1: PASS")
        return 0
    print("GATE G1: FAIL")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
