import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine, is_sqlite
from app.routers import admin, auth, auth_google, integrity, research, sources, super_admin, writing
from app.services.llm_client import is_available as llm_is_available

app = FastAPI(title="AI Academic Success Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# University logos are public assets (shown pre- and post-login), unlike
# policy documents -- kept in their own mounted subdirectory rather than
# exposing all of storage_dir, so private policy PDFs stay server-side only.
_logos_dir = os.path.join(settings.storage_dir, "logos")
os.makedirs(_logos_dir, exist_ok=True)
app.mount("/logos", StaticFiles(directory=_logos_dir), name="logos")


@app.on_event("startup")
def on_startup() -> None:
    if not is_sqlite:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    llm_available, llm_detail = llm_is_available()
    return {"status": "ok", "llm_available": llm_available, "llm_detail": llm_detail}


app.include_router(auth.router)
app.include_router(auth_google.router)
app.include_router(research.router)
app.include_router(integrity.router)
app.include_router(writing.router)
app.include_router(sources.router)
app.include_router(admin.router)
app.include_router(super_admin.router)
