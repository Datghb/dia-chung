"""Low-cardinality request metrics and structured event logging."""

from __future__ import annotations

import json
import logging
from threading import Lock
from typing import Any

logger = logging.getLogger("legal_radar.http")


class MetricsRegistry:
    """In-process operational counters suitable for a single API replica."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._requests = 0
        self._errors = 0
        self._routes: dict[tuple[str, str, int], tuple[int, float, float]] = {}

    def observe(
        self,
        method: str,
        route: str,
        status_code: int,
        duration_seconds: float,
    ) -> None:
        status_family = status_code // 100
        with self._lock:
            self._requests += 1
            if status_code >= 400:
                self._errors += 1
            key = (method, route, status_family)
            count, total, maximum = self._routes.get(key, (0, 0.0, 0.0))
            self._routes[key] = (
                count + 1,
                total + duration_seconds,
                max(maximum, duration_seconds),
            )

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            routes = [
                {
                    "method": method,
                    "route": route,
                    "status_family": f"{family}xx",
                    "requests": aggregate[0],
                    "latency_ms_avg": round(
                        aggregate[1] * 1000 / aggregate[0],
                        3,
                    ),
                    "latency_ms_max": round(aggregate[2] * 1000, 3),
                }
                for (method, route, family), aggregate in sorted(self._routes.items())
            ]
            return {
                "requests_total": self._requests,
                "errors_total": self._errors,
                "routes": routes,
            }


metrics = MetricsRegistry()


def log_request(**fields: object) -> None:
    logger.info(json.dumps({"event": "http_request", **fields}, separators=(",", ":")))
