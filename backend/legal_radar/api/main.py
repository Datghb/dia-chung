"""HTTP API for the Legal-KG backend."""

from fastapi import FastAPI

from .routes import cases, qa, queue, verify

app = FastAPI(title="Legal-KG API", version="0.1.0")
app.include_router(queue.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(verify.router, prefix="/api")
app.include_router(qa.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

