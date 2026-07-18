"""HTTP API for the Legal-KG backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import cases, qa, queue, verify

app = FastAPI(title="Legal-KG API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_origin_regex=r"https://.*\.chatgpt\.site",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(queue.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(verify.router, prefix="/api")
app.include_router(qa.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
