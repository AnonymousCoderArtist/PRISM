from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.incident import Incident
from backend.schemas.incident import IncidentRead

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("", response_model=list[IncidentRead])
def list_incidents(
    db: Session = Depends(get_db),
    severity: str | None = Query(None),
    status: str | None = Query(None),
    area_id: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
) -> list[IncidentRead]:
    q = db.query(Incident)
    if severity:
        q = q.filter(Incident.severity == severity)
    if status:
        q = q.filter(Incident.status == status)
    if area_id:
        q = q.filter(Incident.area_id == area_id)
    items = q.order_by(Incident.priority.desc()).offset(offset).limit(limit).all()
    return [IncidentRead.model_validate(i) for i in items]


@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> IncidentRead:
    item = db.get(Incident, incident_id)
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentRead.model_validate(item)
