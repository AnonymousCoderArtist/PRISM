from pydantic import BaseModel
from datetime import datetime


class ResourceRead(BaseModel):
    id: str
    type: str
    status: str
    latitude: float
    longitude: float
    capacity: int
    availability: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResourceAssignmentRead(BaseModel):
    id: str
    resource_id: str
    incident_id: str
    eta_minutes: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}
