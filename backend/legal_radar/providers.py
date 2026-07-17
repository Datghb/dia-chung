"""LLM provider adapters.

Ba lop mong goi LLM (Gemini / Groq / OpenRouter) cho P4 extract claim.
Moi class tu chua, khong dung bien toan cuc; API key doc bang os.getenv
ngay trong generate(). Interface thong nhat: generate(prompt) -> str.
"""

import os
from typing import Protocol

import requests


class ClaimExtractor(Protocol):
    def extract(self, text: str) -> dict[str, object]: ...


class GeminiProvider:
    """Lop mong goi Gemini API (lua chon chinh — free quota lon nhat).

    Khong giu ket noi hay key o cap class/module; key doc bang
    os.getenv("GEMINI_API_KEY") ngay trong generate().

    Attributes:
        model (str): Ten model Gemini su dung.
        timeout_s (int): Timeout HTTP moi request, tinh bang giay.
    """

    def __init__(self, model: str = "gemini-2.0-flash-lite", timeout_s: int = 30) -> None:
        """Khoi tao provider voi model va timeout.

        Args:
            model (str): Ten model Gemini.
            timeout_s (int): Timeout HTTP (giay).

        Returns:
            None
        """
        self.model = model
        self.timeout_s = timeout_s

    def generate(self, prompt: str) -> str:
        """Gui prompt toi Gemini va tra ve text response.

        Args:
            prompt (str): Noi dung prompt gui di.

        Returns:
            str: Text tho model tra ve.

        Raises:
            RuntimeError: Khi thieu GEMINI_API_KEY hoac HTTP status != 200.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Thieu bien moi truong GEMINI_API_KEY")
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
            params={"key": api_key},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=self.timeout_s,
        )
        if response.status_code != 200:
            raise RuntimeError(f"Gemini HTTP {response.status_code}: {response.text[:200]}")
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]


class GroqProvider:
    """Lop mong goi Groq API (fallback 1 — llama-4-scout, 30K TPM).

    Attributes:
        model (str): Ten model Groq su dung.
        timeout_s (int): Timeout HTTP moi request (giay).
    """

    def __init__(self, model: str = "meta-llama/llama-4-scout-17b-16e-instruct", timeout_s: int = 30) -> None:
        """Khoi tao provider voi model va timeout.

        Args:
            model (str): Ten model Groq.
            timeout_s (int): Timeout HTTP (giay).

        Returns:
            None
        """
        self.model = model
        self.timeout_s = timeout_s

    def generate(self, prompt: str) -> str:
        """Gui prompt toi Groq (OpenAI-compatible endpoint) va tra ve text.

        Args:
            prompt (str): Noi dung prompt gui di.

        Returns:
            str: Text tho model tra ve.

        Raises:
            RuntimeError: Khi thieu GROQ_API_KEY hoac HTTP status != 200.
        """
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("Thieu bien moi truong GROQ_API_KEY")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=self.timeout_s,
        )
        if response.status_code != 200:
            raise RuntimeError(f"Groq HTTP {response.status_code}: {response.text[:200]}")
        return response.json()["choices"][0]["message"]["content"]


class OpenRouterProvider:
    """Lop mong goi OpenRouter (fallback 2 — khi Gemini va Groq het quota).

    Attributes:
        model (str): Ten model tren OpenRouter.
        timeout_s (int): Timeout HTTP moi request (giay).
    """

    def __init__(self, model: str = "google/gemma-3-27b-it:free", timeout_s: int = 30) -> None:
        """Khoi tao provider voi model va timeout.

        Args:
            model (str): Ten model OpenRouter (uu tien tag :free).
            timeout_s (int): Timeout HTTP (giay).

        Returns:
            None
        """
        self.model = model
        self.timeout_s = timeout_s

    def generate(self, prompt: str) -> str:
        """Gui prompt toi OpenRouter va tra ve text response.

        Args:
            prompt (str): Noi dung prompt gui di.

        Returns:
            str: Text tho model tra ve.

        Raises:
            RuntimeError: Khi thieu OPENROUTER_API_KEY hoac HTTP status != 200.
        """
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise RuntimeError("Thieu bien moi truong OPENROUTER_API_KEY")
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=self.timeout_s,
        )
        if response.status_code != 200:
            raise RuntimeError(f"OpenRouter HTTP {response.status_code}: {response.text[:200]}")
        return response.json()["choices"][0]["message"]["content"]
