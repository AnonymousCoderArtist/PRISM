from fastapi import APIRouter
from sqlalchemy import text

from backend.database import get_db
from backend.services.simulation import engine
from backend.schemas.health import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", database="sqlite", simulation_running=engine.running)


@router.get("/health/db")
def health_db() -> dict[str, str]:
    db = next(get_db())
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    finally:
        pass
