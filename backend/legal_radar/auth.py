"""Signed, short-lived operator sessions."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass

ALLOWED_ROLES = frozenset({"viewer", "reviewer", "admin"})


class InvalidSession(ValueError):
    """Raised when a session cannot be trusted."""


@dataclass(frozen=True)
class Principal:
    subject: str
    role: str
    csrf_token: str
    expires_at: int


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


class SessionManager:
    """Issue and verify compact HMAC-SHA256 session tokens."""

    def __init__(self, secret: str, *, ttl_seconds: int) -> None:
        if not secret:
            raise ValueError("Session secret must not be empty")
        self._secret = secret.encode("utf-8")
        self._ttl_seconds = ttl_seconds

    def issue(
        self,
        subject: str,
        role: str,
        *,
        now: int | None = None,
    ) -> tuple[str, Principal]:
        clean_subject = subject.strip()
        if not clean_subject or len(clean_subject) > 100:
            raise ValueError("Invalid session subject")
        if role not in ALLOWED_ROLES:
            raise ValueError("Invalid session role")
        issued_at = int(time.time()) if now is None else now
        principal = Principal(
            subject=clean_subject,
            role=role,
            csrf_token=secrets.token_urlsafe(24),
            expires_at=issued_at + self._ttl_seconds,
        )
        payload = _encode(
            json.dumps(
                {
                    "sub": principal.subject,
                    "role": principal.role,
                    "csrf": principal.csrf_token,
                    "exp": principal.expires_at,
                },
                separators=(",", ":"),
                sort_keys=True,
            ).encode("utf-8")
        )
        signature = _encode(
            hmac.new(self._secret, payload.encode("ascii"), hashlib.sha256).digest()
        )
        return f"{payload}.{signature}", principal

    def verify(self, token: str, *, now: int | None = None) -> Principal:
        try:
            payload, supplied_signature = token.split(".", 1)
            expected_signature = _encode(
                hmac.new(self._secret, payload.encode("ascii"), hashlib.sha256).digest()
            )
            if not hmac.compare_digest(supplied_signature, expected_signature):
                raise InvalidSession("Invalid session signature")
            data = json.loads(_decode(payload))
            principal = Principal(
                subject=str(data["sub"]),
                role=str(data["role"]),
                csrf_token=str(data["csrf"]),
                expires_at=int(data["exp"]),
            )
        except InvalidSession:
            raise
        except (KeyError, TypeError, ValueError, UnicodeError, json.JSONDecodeError) as error:
            raise InvalidSession("Malformed session") from error

        current_time = int(time.time()) if now is None else now
        if principal.expires_at <= current_time:
            raise InvalidSession("Session expired")
        if (
            not principal.subject
            or len(principal.subject) > 100
            or principal.role not in ALLOWED_ROLES
            or not principal.csrf_token
        ):
            raise InvalidSession("Invalid session claims")
        return principal
