# Dashboard Metrics — How They Work

Three metrics power the monitoring dashboard. Each answers a distinct question
and uses independent signals from the pipeline.

---

## 1. MỨC RỦI RO (Spread Risk)

**Question:** How much damage could this claim cause if left unchecked?

### Signals

| Signal | Source | Weight | Range |
|--------|--------|--------|-------|
| Label severity | `nhan` (engine) | HIEU_LAM=40, CAN_KIEM_CHUNG=20, DUNG=5 | 5–40 |
| Reach | `reach` (comment) | `min(30, log2(reach+1) * 5)` | 0–30 |
| Call-to-action | `_detect_call_to_action()` | 15 if CTA + no source, 5 if CTA + source, 0 otherwise | 0–15 |
| Source gap | `nhan_nguon` | CHUA_TIM_THAY=10, CO_BAC_BO=5, CO_XAC_NHAN=0 | 0–10 |

### Formula

```
risk = severity + reach + cta + source_gap
risk = min(100, risk)
```

### Display Thresholds

| Score | Badge | Color |
|-------|-------|-------|
| ≥ 70 | Khẩn cấp | Pink/red |
| 40–69 | Cao | Amber |
| 15–39 | Trung bình | Blue |
| < 15 | Thấp | Gray |

### Example Calculations

| Claim | severity | reach | cta | source_gap | Total |
|-------|----------|-------|-----|------------|-------|
| HIEU_LAM, 500 reach, CTA, no source | 40 | 20 | 15 | 10 | **85** (Khẩn cấp) |
| CAN_KIEM_CHUNG, 100 reach, no CTA, no source | 20 | 15 | 0 | 10 | **45** (Cao) |
| DUNG, 30 reach, no CTA, has source | 5 | 10 | 0 | 0 | **15** (Trung bình) |
| DUNG, 5 reach, no CTA, has source | 5 | 5 | 0 | 0 | **10** (Thấp) |

---

## 2. ĐÁNH GIÁ AI (AI Accuracy)

**Question:** How confident is the AI in its classification?

### Signals

| Signal | Source | Weight | Range |
|--------|--------|--------|-------|
| BM25 match quality | `match_hanh_vi_with_scores()` | `min(30, max(0, (score-0.5)*8))` | 0–30 |
| Amount precision | `_classify_ca_nhan/_to_chuc` | exact=20, in_range=12, single=8, none=0 | 0–20 |
| Subject detection | `_detect_subject_type()` | detected=10, unknown=0 | 0–10 |
| Citations | `citations` list | `min(10, count*5)` | 0–10 |
| Study case match | `_match_study_case()` | matched=5, not=0 | 0–5 |
| Base | — | always 25 | 25 |

### Formula

```
accuracy = base + bm25 + amount + subject + citation + study_case
accuracy = min(100, accuracy)
```

### Display Thresholds

| Score | Badge | Meaning |
|-------|-------|---------|
| ≥ 75 | Chính xác | Strong match, high precision |
| 50–74 | Đáng tin cậy | Good match, some uncertainty |
| 25–49 | Cần xem xét | Partial match, needs review |
| < 25 | Thấp | Weak evidence |

### Example Calculations

| Scenario | base | bm25 | amount | subject | cite | study | Total |
|----------|------|------|--------|---------|------|-------|-------|
| Study case match, perfect | 10 | 25 | 25 | 15 | 15 | 10 | **100** |
| Good match, org, exact amount | 10 | 20 | 25 | 15 | 10 | 0 | **80** |
| Partial match, has amount | 10 | 10 | 15 | 15 | 5 | 0 | **55** |
| No match, no amount, no subject | 10 | 0 | 0 | 0 | 0 | 0 | **10** |

---

## 3. ĐỘ TIN CẬY (Source Reliability)

**Question:** How trustworthy is the evidence supporting this claim?

The system typically provides only 1 source per claim, so source count is not used as a signal.
Instead, we weight what we can actually measure.

### Signals

| Signal | Source | Weight | Range |
|--------|--------|--------|-------|
| Best source tier | `classify_tier()` | Tier 0 (gov)=45, Tier 1 (state)=35, Tier 2 (news)=20, none=0 | 0–45 |
| Source recency | `_parse_date()` comparison | 15 if source within 30 days of claim | 0–15 |
| Confirmation status | `nhan_nguon` | CO_BAC_BO=30, CO_XAC_NHAN=15, CHUA_TIM_THAY=0 | 0–30 |
| Has citations | `citations` | 5 if has any | 0–5 |

### When no search results available (fallback source)

| Status | Score | Meaning |
|--------|-------|---------|
| CO_BAC_BO_CHINH_THUC | 90 | Official denial = strongest signal |
| CO_NGUON_XAC_NHAN + citations | 70 | Confirmed by source + legal backing |
| CO_NGUON_XAC_NHAN (no citations) | 55 | Confirmed by source, no legal backing |
| CHUA_TIM_THAY + citations | 5 | Only legal citations, no source |
| CHUA_TIM_THAY (no citations) | 0 | No evidence at all |

### Formula (with search results)

```
reliability = tier + recency + denial + citations
reliability = min(100, reliability)
```

### Display Thresholds

| Score | Badge | Meaning |
|-------|-------|---------|
| ≥ 80 | Đáng tin cậy | Government or multiple state sources |
| 50–79 | Có cơ sở | Some official sources found |
| 20–49 | Chưa đủ cơ sở | Unofficial or single source |
| < 20 | Không có cơ sở | No source found |

### Example Calculations

| Scenario | tier | recency | denial | cite | Total |
|----------|------|---------|--------|------|-------|
| Tier 0 gov source, recent, confirmed | 45 | 15 | 15 | 5 | **80** |
| Tier 1 state media, recent, confirmed | 35 | 15 | 15 | 0 | **65** |
| Tier 2 news source, old, confirmed | 20 | 0 | 15 | 5 | **40** |
| No search, but official denial | — | — | — | — | **90** |
| No search, confirmed by source + citations | — | — | — | — | **70** |
| No search, confirmed by source only | — | — | — | — | **55** |
| No source found, no citations | 0 | 0 | 0 | 0 | **0** |

---

## Signal Extraction (Engine Changes)

The engine now exposes intermediate signals that were previously discarded:

| Signal | Function | Previously Returned | Now Returns |
|--------|----------|-------------------|-------------|
| BM25 score | `match_hanh_vi_with_scores()` | `list[DieuKhoan]` | `list[tuple[DieuKhoan, float]]` |
| Amount match | `_classify_ca_nhan/_to_chuc()` | 3-tuple | 4-tuple (adds match type) |
| CTA detected | `tich_hop_nguon()` | 2-tuple | 3-tuple (adds bool) |
| Study case | `_match_study_case()` | result or None | same (captured as bool) |

### New Dataclasses

- **`PhanLoaiResult`**: returned by `phan_loai_claim()`, carries nhan, ly_do, citations, bm25_score, amount_match, study_case_matched
- **`ClassificationResult`**: extended with bm25_score, amount_match, study_case_matched, cta_detected

### Backward Compatibility

- `score` and `confidence` fields retained (old formulas)
- `priority` field retained (used for sorting)
- Old `score`/`confidence` can be deprecated in future release
