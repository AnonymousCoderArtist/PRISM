from pydantic import BaseModel
from datetime import datetime


class IncidentRead(BaseModel):
    id: str
    title: str
    event_type: str
    latitude: float
    longitude: float
    area_id: str | None = None
    severity: str
    people_affected: int
    people_trapped: int
    vulnerable_population: int
    confidence: int
    priority: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
