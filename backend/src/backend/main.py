from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import DATABASE_URL
from backend.database import init_db
from backend.models import (
    Area,
    Evidence,
    Incident,
    Report,
    Resource,
    ResourceAssignment,
    ActivityEvent,
)
from backend.routers import health, reports, incidents, resources, areas, simulation, intelligence
from backend.services.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from backend.database import SessionLocal

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="PRISM Backend",
    description="Post-Disaster Reality Intelligence & Situation Mapping",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(reports.router)
app.include_router(incidents.router)
app.include_router(resources.router)
app.include_router(areas.router)
app.include_router(simulation.router)
app.include_router(intelligence.router)


STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "database": DATABASE_URL}


if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
