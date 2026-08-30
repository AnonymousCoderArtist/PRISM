from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.database import get_db
from backend.models.report import Report
from backend.schemas.report import ReportRead

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=list[ReportRead])
def list_reports(
    db: Session = Depends(get_db),
    source_type: str | None = Query(None),
    status: str | None = Query(None),
    incident_id: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
) -> list[ReportRead]:
    q = db.query(Report)
    if source_type:
        q = q.filter(Report.source_type == source_type)
    if status:
        q = q.filter(Report.status == status)
    if incident_id:
        q = q.filter(Report.incident_id == incident_id)
    items = q.order_by(Report.timestamp.desc()).offset(offset).limit(limit).all()
    return [ReportRead.model_validate(i) for i in items]


@router.get("/{report_id}", response_model=ReportRead)
def get_report(report_id: str, db: Session = Depends(get_db)) -> ReportRead:
    item = db.get(Report, report_id)
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportRead.model_validate(item)
