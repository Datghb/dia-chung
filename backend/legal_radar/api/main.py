"""HTTP API for the Legal-KG backend."""

import os
from pathlib import Path

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parents[2] / ".env"
if _env_path.exists():
    load_dotenv(_env_path, override=False)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from .routes import cases, crawl, qa, queue, verify  # noqa: E402

_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGIN", "https://diachung.dpdns.org,http://localhost:3000,http://localhost:3001"
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="Legal-KG API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    # Keep local development usable even when FRONTEND_ORIGIN is overridden
    # with only production domains in the process environment.
    allow_origin_regex=r"https://.*\.chatgpt\.site|http://(?:localhost|127\.0\.0\.1)(?::\d+)?",
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
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
