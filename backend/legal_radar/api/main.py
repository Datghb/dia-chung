"""HTTP API for the Legal-KG backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.legal_radar.settings import get_settings

from backend.legal_radar.api.routes import cases, crawl, qa, queue, verify

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
    allow_credentials=False,
)
app.include_router(queue.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(verify.router, prefix="/api")
app.include_router(qa.router, prefix="/api")
app.include_router(crawl.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
