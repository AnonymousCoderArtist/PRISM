from pydantic import BaseModel
from datetime import datetime


class ReportRead(BaseModel):
    id: str
    timestamp: datetime
    source_type: str
    source_name: str
    latitude: float
    longitude: float
    location_name: str
    raw_text: str
    media_type: str
    claimed_severity: int
    people_affected: int
    people_trapped: int
    vulnerable_population: int
    event_type: str
    evidence_type: str
    confidence: int
    status: str
    incident_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
