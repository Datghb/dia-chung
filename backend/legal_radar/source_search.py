from __future__ import annotations

import json
import logging
import os

import requests as http_requests

from .source_classifier import TIER_0_DOMAINS, TIER_1_DOMAINS, TIER_2_DOMAINS

logger = logging.getLogger(__name__)

TRUSTED_DOMAINS = TIER_0_DOMAINS + TIER_1_DOMAINS + TIER_2_DOMAINS


def _get_tokenrouter_config() -> tuple[str, str, str]:
    api_key = os.environ.get("TOKENROUTER_API_KEY", "")
    base_url = os.environ.get("TOKENROUTER_BASE_URL", "https://api.tokenrouter.com/v1").rstrip("/")
    model = os.environ.get("TOKENROUTER_MODEL", "google/gemini-3-flash-preview")
    return api_key, base_url, model


def dynamic_search_gemini(
    claim_keywords: list[str],
    thoi_gian_claim: str,
    api_key: str | None = None,
) -> list[dict]:
    tr_key, base_url, model = _get_tokenrouter_config()
    tokenrouter_key = api_key or tr_key
    gemini_key = (
        os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
        or os.environ.get("GOOGLE_API_KEY_1", "")
    )
    if not tokenrouter_key and not gemini_key:
        logger.warning("No TOKENROUTER_API_KEY or GEMINI_API_KEY set — skipping source search")
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
        # Prefer the native Gemini API when configured because it supports
        # Google Search grounding and returns verifiable live-web citations.
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
        logger.warning("Source search request error: %s", exc)
        return []

    if response.status_code != 200:
        logger.warning("%s source search HTTP %s: %s", provider, response.status_code, response.text[:200])
        return []

    try:
        data = response.json()
        if provider == "TokenRouter":
            text = data["choices"][0]["message"]["content"].strip()
        else:
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        logger.warning("%s source search parse error: %s", provider, exc)
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
        logger.warning("%s source search returned non-JSON: %s", provider, text[:200])
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


def _is_trusted_domain(url: str) -> bool:
    """Check if URL belongs to a trusted domain whitelist."""
    url_lower = url.lower()
    return any(domain in url_lower for domain in TRUSTED_DOMAINS)
