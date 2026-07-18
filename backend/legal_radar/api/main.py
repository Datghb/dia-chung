"""HTTP API for the Legal-KG backend."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import cases, crawl, qa, queue, verify

_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGIN", "https://theoria-lab.io.vn,http://localhost:3000,http://localhost:3001"
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="Legal-KG API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.chatgpt\.site",
    allow_methods=["GET", "POST", "OPTIONS"],
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
