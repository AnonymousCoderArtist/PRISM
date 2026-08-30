from pydantic import BaseModel
from datetime import datetime


class AreaRead(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    population: int
    vulnerable_population: int
    status: str
    risk_score: int
    priority: int
    confidence: int
    information_void_score: int
    last_verified: datetime | None = None
    report_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
