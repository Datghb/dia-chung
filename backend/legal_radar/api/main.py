"""HTTP API for the Legal-KG backend."""

import os
import re
import time
import uuid

from fastapi import FastAPI
from fastapi import HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

from backend.legal_radar.settings import get_settings
from backend.legal_radar.paths import data_dir, runs_dir

from backend.legal_radar.api.routes import auth, cases, crawl, ops, qa, queue, verify
from backend.legal_radar.api.data_access import check_persistence
from backend.legal_radar.observability import log_request, metrics

settings = get_settings()

_origins = [origin.strip() for origin in settings.frontend_origin.split(",") if origin.strip()]

app = FastAPI(title="Địa Chứng API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    # Keep local development usable even when FRONTEND_ORIGIN is overridden
    # with only production domains in the process environment.
    allow_origin_regex=r"https://(?:.*\.chatgpt\.site|diachung\.dpdns\.org)|http://(?:localhost|127\.0\.0\.1)(?::\d+)?",
    allow_methods=["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    started_at = time.perf_counter()
    supplied_request_id = request.headers.get("X-Request-ID", "")
    request_id = (
        supplied_request_id
        if re.fullmatch(r"[A-Za-z0-9._-]{8,64}", supplied_request_id)
        else str(uuid.uuid4())
    )
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if settings.app_env.lower() == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
    response.headers["X-Request-ID"] = request_id
    duration = time.perf_counter() - started_at
    route = getattr(request.scope.get("route"), "path", "unmatched")
    metrics.observe(request.method, route, response.status_code, duration)
    log_request(
        request_id=request_id,
        method=request.method,
        route=route,
        status=response.status_code,
        duration_ms=round(duration * 1000, 3),
    )
    return response

app.include_router(queue.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(ops.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(verify.router, prefix="/api")
app.include_router(qa.router, prefix="/api")
app.include_router(crawl.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/ready")
def readiness() -> dict[str, str]:
    required_kg = data_dir() / "kg" / "kg_nodes.json"
    runtime_dir = runs_dir()
    if not required_kg.is_file() or not runtime_dir.is_dir() or not os.access(runtime_dir, os.W_OK):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Required data or runtime storage is unavailable",
        )
    try:
        check_persistence()
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Transactional persistence is unavailable",
        ) from error
    return {"status": "ready"}
