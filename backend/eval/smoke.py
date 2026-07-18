"""Minimal evaluation gate; populate cases.json as the engine is implemented."""

import json
import os
import sys
from pathlib import Path

# Add backend directory to sys.path if run directly
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.legal_radar.model import load_kg, NhanPhanLoai
from backend.legal_radar.engine import phan_loai_claim
from backend.legal_radar.guardrails import sanitize_injection, anonymize_pii, validate_label
from backend.legal_radar.paths import data_dir


def main() -> int:
    # Set console encoding to UTF-8 on Windows to avoid UnicodeEncodeError
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding='utf-8')

    cases_path = Path(__file__).with_name("cases.json")
    cases = json.loads(cases_path.read_text(encoding="utf-8"))
    
    db_dir = data_dir()
    kg = load_kg(db_dir / "kg" / "kg_nodes.json", db_dir / "kg" / "kg_edges.json")
    
    passed = 0
    failed = 0
    
    print(f"Starting business evaluation gate: checking {len(cases)} cases...\n")
    
    for case in cases:
        case_id = case["id"]
        comment = case["comment"]
        
        # 1. Sanitize prompt injection
        sanitized = sanitize_injection(comment)
        if case.get("expected_no_crash") and sanitized == comment:
            print(f"FAIL: Case {case_id} failed: Injection not sanitized.")
            failed += 1
            continue
            
        # 2. Anonymize PII
        anonymized = anonymize_pii(sanitized)
        if case.get("expected_anonymized"):
            if "Nguyễn Văn A" in anonymized:
                print(f"FAIL: Case {case_id} failed: PII not anonymized.")
                failed += 1
                continue
        
        # 3. Refusal / OOD check
        if case.get("expected_refuse"):
            nhan, _, matched_dks = phan_loai_claim(anonymized, None, kg)
            if len(matched_dks) > 0 or nhan != NhanPhanLoai.CAN_KIEM_CHUNG:
                print(f"FAIL: Case {case_id} failed: Expected OOD to be refused/unmatched, but got citations or label {nhan}.")
                failed += 1
                continue
            passed += 1
            print(f"PASS: Case {case_id} passed (refusal/OOD).")
            continue
            
        # 4. Engine Classification
        nhan, ly_do, citations = phan_loai_claim(anonymized, None, kg)
        actual_label = nhan.value if hasattr(nhan, "value") else nhan
        
        # Validate label against guardrails
        try:
            validate_label(actual_label)
        except Exception as e:
            print(f"FAIL: Case {case_id} failed: Invalid label generated '{actual_label}'. Error: {e}")
            failed += 1
            continue
            
        # Check expected label
        if case.get("expected_label"):
            exp_label = case["expected_label"]
            if actual_label != exp_label:
                print(f"FAIL: Case {case_id} failed: Expected label '{exp_label}', got '{actual_label}'. Reason: {ly_do}")
                failed += 1
                continue
                
        # Check citations
        if case.get("expected_citations_non_empty"):
            if not citations:
                print(f"FAIL: Case {case_id} failed: Expected non-empty citations, got empty.")
                failed += 1
                continue
                
        # Check reason contains keyword
        if case.get("expected_reason_contains"):
            kw = case["expected_reason_contains"]
            if kw not in ly_do:
                print(f"FAIL: Case {case_id} failed: Expected reason to contain '{kw}', got '{ly_do}'.")
                failed += 1
                continue
                
        # Check muc phat match (historical cases)
        if case.get("expected_muc_phat_match"):
            if "Trùng khớp vụ việc thực tế" not in ly_do:
                print(f"FAIL: Case {case_id} failed: Expected study case match in reason, got '{ly_do}'.")
                failed += 1
                continue
                
        passed += 1
        print(f"PASS: Case {case_id} passed.")
        
    print(f"\nEvaluation summary: {passed} passed, {failed} failed.")
    return 1 if failed > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())

