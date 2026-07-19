from __future__ import annotations

import json
import logging
import os
import time
from urllib.parse import urlparse

import requests as http_requests

from backend.legal_radar.source_classifier import TIER_0_DOMAINS, TIER_1_DOMAINS, TIER_2_DOMAINS
from backend.legal_radar.settings import get_settings
from backend.legal_radar.resilience import CircuitBreaker, CircuitOpen, call_with_retry

logger = logging.getLogger(__name__)

TRUSTED_DOMAINS = TIER_0_DOMAINS + TIER_1_DOMAINS + TIER_2_DOMAINS

BD_DISCOVER_URL = "https://api.brightdata.com/discover"
_brightdata_breaker = CircuitBreaker(failure_threshold=3, recovery_seconds=30)

_DOMAIN_TO_NGUON: dict[str, str] = {
    "chinhphu.vn": "Cổng TTĐT Chính phủ",
    "bocongan.gov.vn": "Cổng TTĐT Bộ Công an",
    "moh.gov.vn": "Cổng TTĐT Bộ Y tế",
    "mic.gov.vn": "Cổng TTĐT Bộ TT&TT",
    "moj.gov.vn": "Cổng TTĐT Bộ Tư pháp",
    "sbv.gov.vn": "Ngân hàng Nhà nước",
    "vietnamgovernment.vn": "Cổng TTĐT Chính phủ",
    "ttxvn.vn": "Thông tấn xã Việt Nam",
    "baotintuc.vn": "Báo Tin tức",
    "vtv.vn": "Đài Truyền hình Việt Nam",
    "vnews.vn": "VNews",
    "nhandan.vn": "Báo Nhân Dân",
    "quochoi.vn": "Cổng TTĐT Quốc hội",
    "suckhoedoisong.vn": "Báo Sức khỏe & Đời sống",
    "vnexpress.net": "VnExpress",
    "tuoitre.vn": "Báo Tuổi Trẻ",
    "thanhnien.vn": "Báo Thanh Niên",
    "dantri.com.vn": "Báo Dân Trí",
    "vietnamnet.vn": "VietNamNet",
    "plo.vn": "Báo Pháp Luật TP.HCM",
    "nld.com.vn": "Báo Người Lao Động",
}


def _bd_headers() -> dict[str, str]:
    key = os.environ.get("BRIGHTDATA_API_KEY", "")
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def _infer_nguon(url: str) -> str:
    """Infer source agency name from URL domain."""
    try:
        host = urlparse(url).hostname or ""
    except Exception:
        return ""
    host_lower = host.lower()
    for domain, name in _DOMAIN_TO_NGUON.items():
        if domain in host_lower:
            return name
    return host


def _build_source_query(keywords: list[str]) -> list[str]:
    """Build 2 site-restricted sub-queries from keywords.

    Always includes ĐVHC (administrative unit merger) context terms
    to keep search results on-topic. Sub-query 1 targets TIER_0,
    sub-query 2 targets TIER_1 + TIER_2.
    """
    kw = " ".join(keywords[:6])
    if not kw.strip():
        kw = "sáp nhập đơn vị hành chính"

    merger_context = "sáp nhập đơn vị hành chính tỉnh"
    combined = f"{merger_context} {kw}"

    tier0_sites = " OR ".join(f"site:{d}" for d in [".gov.vn", "chinhphu.vn", "bocongan.gov.vn", "sbv.gov.vn"])
    tier12_sites = " OR ".join(
        f"site:{d}"
        for d in ["baotintuc.vn", "vtv.vn", "nhandan.vn", "vnexpress.net", "tuoitre.vn", "thanhnien.vn", "vietnamnet.vn"]
    )

    return [
        f"{combined} {tier0_sites}",
        f"{combined} {tier12_sites}",
    ]


def _poll_discover(task_id: str) -> list[dict]:
    """Poll Bright Data Discover API until done. Returns list of result items."""
    for i in range(15):
        time.sleep(3)
        try:
            r = http_requests.get(
                f"{BD_DISCOVER_URL}?task_id={task_id}",
                headers=_bd_headers(),
                timeout=15,
            )
        except http_requests.RequestException:
            logger.warning("Source search poll %d failed for task %s", i, task_id)
            continue
        if r.status_code != 200:
            continue
        data = r.json()
        if data.get("status") == "done":
            return data.get("results", [])
    return []


def _map_bd_result(item: dict) -> dict:
    """Map a Bright Data Discover result to the xac_thuc_nguon input format.

    Results that pass _is_trusted_domain() are real search results from
    government/news sites — mark as confirmed so apply_fusion_rules()
    can classify them properly.
    """
    url = item.get("link", "")
    return {
        "tieu_de": item.get("title", ""),
        "nguon": _infer_nguon(url),
        "url": url,
        "ngay_dang": "",
        "noi_dung_tom_tat": item.get("description", ""),
        "la_bac_bo": False,
        "la_xac_nhan": True,
    }


def _is_trusted_domain(url: str) -> bool:
    """Check if URL belongs to a trusted domain whitelist."""
    url_lower = url.lower()
    return any(domain in url_lower for domain in TRUSTED_DOMAINS)


def search_brightdata(
    claim_keywords: list[str],
    thoi_gian: str = "",
) -> list[dict]:
    """Search for official Vietnamese sources via Bright Data Discover API.

    Builds site-restricted queries targeting TIER_0/1/2 domains,
    sends to Bright Data Discover API (same pattern as crawlers/facebook.py),
    returns real search results with verified URLs.
    """
    api_key = os.environ.get("BRIGHTDATA_API_KEY", "")
    if not api_key:
        logger.warning("No BRIGHTDATA_API_KEY — skipping source search")
        return []

    sub_queries = _build_source_query(claim_keywords)
    if not sub_queries:
        return []

    seen_urls: set[str] = set()
    results: list[dict] = []

    for query in sub_queries:
        logger.info("BrightData Discover: %s", query)
        try:
            resp = call_with_retry(
                lambda: http_requests.post(
                    BD_DISCOVER_URL,
                    headers=_bd_headers(),
                    json={
                        "query": query,
                        "num_results": 5,
                        "format": "json",
                        "language": "vi",
                        "country": "VN",
                    },
                    timeout=15,
                ),
                breaker=_brightdata_breaker,
                attempts=2,
                retry_on=(http_requests.RequestException,),
            )
        except (http_requests.RequestException, CircuitOpen) as exc:
            logger.warning("BrightData Discover request error: %s", exc)
            continue

        if resp.status_code != 200:
            logger.warning("BrightData Discover HTTP %s: %s", resp.status_code, resp.text[:200])
            continue

        task_id = resp.json().get("task_id")
        if not task_id:
            logger.warning("BrightData Discover returned no task_id")
            continue

        raw_results = _poll_discover(task_id)
        for item in raw_results:
            url = item.get("link", "")
            if not url or url in seen_urls:
                continue
            if not _is_trusted_domain(url):
                logger.debug("Bỏ qua URL không thuộc whitelist: %s", url)
                continue
            seen_urls.add(url)
            results.append(_map_bd_result(item))

    logger.info("BrightData source search returned %d results", len(results))
    return results


# ── Fallback LLM search (kept for future use when GEMINI_API_KEY is set) ──


def _get_tokenrouter_config() -> tuple[str, str, str]:
    settings = get_settings()
    api_key = settings.tokenrouter_api_key or ""
    base_url = settings.tokenrouter_base_url.rstrip("/")
    model = settings.tokenrouter_model
    return api_key, base_url, model


def _fallback_llm_search(
    claim_keywords: list[str],
    thoi_gian_claim: str,
    api_key: str | None = None,
) -> list[dict]:
    """Fallback: ask LLM to generate source URLs. Only use when Bright Data returns nothing AND GEMINI_API_KEY is set."""
    tr_key, base_url, model = _get_tokenrouter_config()
    tokenrouter_key = api_key or tr_key
    gemini_key = (
        os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
        or os.environ.get("GOOGLE_API_KEY_1", "")
    )
    if not tokenrouter_key and not gemini_key:
        logger.warning("No TOKENROUTER_API_KEY or GEMINI_API_KEY set — skipping fallback LLM search")
        return []

    query = " ".join(claim_keywords)
    prompt = (
        f'Tìm kiếm thông tin chính thức liên quan đến: "{query}"\n\n'
        "Chỉ trả về các nguồn tin chính thức từ cơ quan nhà nước, báo chí chính thống Việt Nam.\n"
        "Với mỗi nguồn tìm thấy, trả về JSON array với format:\n"
        '[{"tieu_de": "...", "nguon": "...", "url": "...", "ngay_dang": "YYYY-MM-DD", '
        '"noi_dung_tom_tat": "1-2 câu", "la_bac_bo": true/false, "la_xac_nhan": true/false}]\n\n'
        "Nếu không tìm thấy nguồn chính thức, trả về [].\n"
        "KHÔNG tự tạo URL giả. Chỉ trả về URL thật."
    )

    try:
        if gemini_key and api_key is None:
            gemini_model = os.environ.get("GEMINI_SEARCH_MODEL", "gemini-2.5-flash")
            response = http_requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent",
                params={"key": gemini_key},
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "tools": [{"google_search": {}}],
                },
                timeout=60,
            )
            provider = "Gemini"
        else:
            response = http_requests.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {tokenrouter_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=60,
            )
            provider = "TokenRouter"
    except Exception as exc:
        logger.warning("Fallback LLM source search error: %s", exc)
        return []

    if response.status_code != 200:
        logger.warning("%s fallback source search HTTP %s: %s", provider, response.status_code, response.text[:200])
        return []

    try:
        data = response.json()
        if provider == "TokenRouter":
            text = data["choices"][0]["message"]["content"].strip()
        else:
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        logger.warning("%s fallback source search parse error: %s", provider, exc)
        return []

    if not text:
        return []

    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:]
            if part.startswith("["):
                text = part
                break

    bracket_start = text.find("[")
    bracket_end = text.rfind("]")
    if bracket_start != -1 and bracket_end != -1 and bracket_end > bracket_start:
        text = text[bracket_start : bracket_end + 1]

    try:
        results = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("%s fallback source search returned non-JSON: %s", provider, text[:200])
        return []

    if not isinstance(results, list):
        return []

    verified = []
    for r in results:
        url = r.get("url", "")
        if not url:
            continue
        if not _is_trusted_domain(url):
            logger.warning("Bỏ qua URL không thuộc whitelist: %s", url)
            continue
        verified.append(r)

    return verified


# Keep old name as alias for backward compatibility
dynamic_search_gemini = _fallback_llm_search
