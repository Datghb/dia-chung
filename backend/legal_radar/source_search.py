from __future__ import annotations

import json
import os
from dataclasses import dataclass

try:
    from google import genai
except ImportError:
    genai = None


def dynamic_search_gemini(
    claim_keywords: list[str],
    thoi_gian_claim: str,
    api_key: str | None = None,
) -> list[dict]:
    if genai is None:
        raise ImportError("google-genai package not installed")

    key = api_key or os.environ.get("GOOGLE_API_KEY_1") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise ValueError("No Gemini API key provided")

    client = genai.Client(api_key=key)
    query = " ".join(claim_keywords)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"""Tìm kiếm thông tin chính thức liên quan đến: "{query}"

Chỉ trả về các nguồn tin chính thức từ cơ quan nhà nước, báo chí chính thống Việt Nam.
Với mỗi nguồn tìm thấy, trả về JSON array với format:
[{{"tieu_de": "...", "nguon": "...", "url": "...", "ngay_dang": "YYYY-MM-DD", "noi_dung_tom_tat": "1-2 câu", "la_bac_bo": true/false, "la_xac_nhan": true/false}}]

Nếu không tìm thấy nguồn chính thức, trả về [].
KHÔNG tự tạo URL giả. Chỉ trả về URL thật.""",
        tools={"google_search": {}},
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        results = json.loads(text)
    except json.JSONDecodeError:
        return []

    return results
