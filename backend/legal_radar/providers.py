"""LLM provider adapters.

TokenRouter (primary) / Gemini / Groq / OpenRouter cho P4 extract claim.
Moi class tu chua, khong dung bien toan cuc; API key doc tu settings.
Interface thong nhat: generate(prompt) -> str.
"""

from typing import Protocol

import requests


class ClaimExtractor(Protocol):
    def extract(self, text: str) -> dict[str, object]: ...


class TokenRouterProvider:
    """Lop mong goi TokenRouter API (OpenAI-compatible endpoint — primary)."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        timeout_s: int = 30,
    ) -> None:
        self.api_key = api_key
        self.model = model or "google/gemini-3-flash-preview"
        self.base_url = (base_url or "https://api.tokenrouter.com/v1").rstrip("/")
        self.timeout_s = timeout_s

    def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise RuntimeError("Thieu bien moi truong TOKENROUTER_API_KEY")
        response = requests.post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=self.timeout_s,
        )
        if response.status_code != 200:
            raise RuntimeError(f"TokenRouter HTTP {response.status_code}: {response.text[:300]}")
        return response.json()["choices"][0]["message"]["content"]


class GeminiProvider:
    """Lop mong goi Gemini API (lua chon chinh — free quota lon nhat).

    Attributes:
        api_key (str | None): Gemini API key.
        google_api_key (str | None): Alternative Google API key.
        google_api_key_1 (str | None): Alternative Google API key variant.
        model (str): Ten model Gemini su dung.
        timeout_s (int): Timeout HTTP moi request, tinh bang giay.
    """

    def __init__(
        self,
        api_key: str | None = None,
        google_api_key: str | None = None,
        google_api_key_1: str | None = None,
        model: str = "gemini-2.5-flash-lite",
        timeout_s: int = 30,
    ) -> None:
        """Khoi tao provider voi model va timeout.

        Args:
            api_key (str | None): Gemini API key.
            google_api_key (str | None): Alternative Google API key.
            google_api_key_1 (str | None): Alternative Google API key variant.
            model (str): Ten model Gemini.
            timeout_s (int): Timeout HTTP (giay).

        Returns:
            None
        """
        self.api_key = api_key
        self.google_api_key = google_api_key
        self.google_api_key_1 = google_api_key_1
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
        api_key = self.api_key or self.google_api_key or self.google_api_key_1
        if not api_key:
            raise RuntimeError("Thieu bien moi truong GEMINI_API_KEY hoac GOOGLE_API_KEY")
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
        api_key (str | None): Groq API key.
        model (str): Ten model Groq su dung.
        timeout_s (int): Timeout HTTP moi request (giay).
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct",
        timeout_s: int = 30,
    ) -> None:
        """Khoi tao provider voi model va timeout.

        Args:
            api_key (str | None): Groq API key.
            model (str): Ten model Groq.
            timeout_s (int): Timeout HTTP (giay).

        Returns:
            None
        """
        self.api_key = api_key
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
        if not self.api_key:
            raise RuntimeError("Thieu bien moi truong GROQ_API_KEY")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
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
        api_key (str | None): OpenRouter API key.
        model (str): Ten model tren OpenRouter.
        timeout_s (int): Timeout HTTP moi request (giay).
    """

    def __init__(
        self, api_key: str | None = None, model: str = "google/gemma-3-27b-it:free", timeout_s: int = 30
    ) -> None:
        """Khoi tao provider voi model va timeout.

        Args:
            api_key (str | None): OpenRouter API key.
            model (str): Ten model OpenRouter (uu tien tag :free).
            timeout_s (int): Timeout HTTP (giay).

        Returns:
            None
        """
        self.api_key = api_key
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
        if not self.api_key:
            raise RuntimeError("Thieu bien moi truong OPENROUTER_API_KEY")
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=self.timeout_s,
        )
        if response.status_code != 200:
            raise RuntimeError(f"OpenRouter HTTP {response.status_code}: {response.text[:200]}")
        return response.json()["choices"][0]["message"]["content"]


class FallbackProvider:
    """Try providers in order until one succeeds."""

    def __init__(self, providers: list) -> None:
        self.providers = providers

    def generate(self, prompt: str) -> str:
        last_error = ""
        for provider in self.providers:
            try:
                return provider.generate(prompt)
            except Exception as exc:
                last_error = f"{type(provider).__name__}: {exc}"
                continue
        raise RuntimeError(f"All providers failed. Last: {last_error}")
