"""Bounded retries and circuit breaking for third-party providers."""

from __future__ import annotations

import time
from collections.abc import Callable
from threading import Lock
from typing import TypeVar

T = TypeVar("T")


class CircuitOpen(RuntimeError):
    """The provider is temporarily isolated after repeated failures."""


class CircuitBreaker:
    def __init__(self, *, failure_threshold: int = 3, recovery_seconds: float = 30) -> None:
        self._threshold = failure_threshold
        self._recovery_seconds = recovery_seconds
        self._failures = 0
        self._opened_at: float | None = None
        self._lock = Lock()

    def before_call(self, *, now: float | None = None) -> None:
        current = time.monotonic() if now is None else now
        with self._lock:
            if self._opened_at is None:
                return
            if current - self._opened_at >= self._recovery_seconds:
                self._opened_at = None
                self._failures = 0
                return
            raise CircuitOpen("Provider circuit is open")

    def succeed(self) -> None:
        with self._lock:
            self._failures = 0
            self._opened_at = None

    def fail(self, *, now: float | None = None) -> None:
        current = time.monotonic() if now is None else now
        with self._lock:
            self._failures += 1
            if self._failures >= self._threshold:
                self._opened_at = current


def call_with_retry(
    operation: Callable[[], T],
    *,
    breaker: CircuitBreaker,
    attempts: int = 3,
    retry_on: tuple[type[BaseException], ...] = (TimeoutError,),
    sleep: Callable[[float], None] = time.sleep,
) -> T:
    """Run an operation with capped exponential backoff and a shared circuit."""
    breaker.before_call()
    for attempt in range(attempts):
        try:
            result = operation()
        except retry_on:
            breaker.fail()
            if attempt + 1 == attempts:
                raise
            sleep(min(0.25 * (2**attempt), 1.0))
        else:
            breaker.succeed()
            return result
    raise RuntimeError("Unreachable retry state")
