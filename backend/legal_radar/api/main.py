"""HTTP API for the Legal-KG backend."""

import os

from fastapi import FastAPI
from fastapi import HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

from backend.legal_radar.settings import get_settings
from backend.legal_radar.paths import data_dir, runs_dir

from backend.legal_radar.api.routes import auth, cases, crawl, qa, queue, verify

settings = get_settings()

_origins = [origin.strip() for origin in settings.frontend_origin.split(",") if origin.strip()]

app = FastAPI(title="Legal-KG API", version="0.1.0")
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
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

app.include_router(queue.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
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
    return {"status": "ready"}
