from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.area import Area
from backend.schemas.area import AreaRead

router = APIRouter(prefix="/api/areas", tags=["areas"])


@router.get("", response_model=list[AreaRead])
def list_areas(
    db: Session = Depends(get_db),
    status: str | None = Query(None),
    min_priority: int | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
) -> list[AreaRead]:
    q = db.query(Area)
    if status:
        q = q.filter(Area.status == status)
    if min_priority is not None:
        q = q.filter(Area.priority >= min_priority)
    items = q.order_by(Area.priority.desc()).offset(offset).limit(limit).all()
    return [AreaRead.model_validate(i) for i in items]


@router.get("/{area_id}", response_model=AreaRead)
def get_area(area_id: str, db: Session = Depends(get_db)) -> AreaRead:
    item = db.get(Area, area_id)
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Area not found")
    return AreaRead.model_validate(item)
