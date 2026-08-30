from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.incident import Incident
from backend.models.report import Report
from backend.models.area import Area
from backend.models.resource import Resource
from backend.schemas.incident import IncidentRead
from backend.schemas.area import AreaRead
from backend.schemas.intelligence import AnalyzeRequest, VerifyRequest, PriorityRequest, SilenceRequest
from backend.services.ai_adapter import get_adapter, AIAdapterError
from backend.services.confidence import compute_confidence
from backend.services.priority import compute_priority
from backend.services.information_void import compute_information_void
from backend.services.weather_risk import compute_weather_risk
from backend.services.response_plan import generate_response_plan

router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])


@router.post("/analyze")
def analyze_report(req: AnalyzeRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    report = db.get(Report, req.report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    adapter = get_adapter()
    try:
        structured = adapter.analyze_report(report.raw_text, report.source_type.value)
    except AIAdapterError:
        structured = {
            "event_type": report.event_type or "unknown",
            "severity": report.claimed_severity,
            "people_affected": report.people_affected,
            "people_trapped": report.people_trapped,
            "vulnerable_population": report.vulnerable_population,
            "location_name": report.location_name,
            "lat": report.latitude,
            "lng": report.longitude,
            "evidence": [report.evidence_type],
            "summary": report.raw_text,
        }
    return {"report_id": report.id, "structured": structured}


@router.post("/verify")
def verify_reports(req: VerifyRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    reports = db.query(Report).filter(Report.id.in_(req.report_ids)).all()
    if not reports:
        raise HTTPException(status_code=404, detail="No reports found")
    payload = [
        {
            "id": r.id,
            "source_type": r.source_type.value,
            "location_name": r.location_name,
            "event_type": r.event_type,
            "raw_text": r.raw_text,
        }
        for r in reports
    ]
    adapter = get_adapter()
    try:
        result = adapter.verify_reports(payload)
    except AIAdapterError:
        result = {
            "contradictions": [],
            "corroboration": [r.id for r in reports],
            "overall_confidence_note": "deterministic fallback",
        }
    return {"reports": payload, "verification": result}


@router.post("/priority")
def recalculate_priority(req: PriorityRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    incident = db.get(Incident, req.incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    result = compute_priority(
        severity=incident.severity.value,
        people_affected=incident.people_affected,
        vulnerable_population=incident.vulnerable_population,
        confidence=incident.confidence,
        urgency=incident.priority,
        isolation=0,
        forecast_risk=0,
    )
    incident.priority = result["priority_score"]
    db.commit()
    db.refresh(incident)
    return {"incident_id": incident.id, "priority": result}


@router.post("/situation")
def situation_summary(db: Session = Depends(get_db)) -> dict[str, Any]:
    incidents = db.query(Incident).order_by(Incident.priority.desc()).limit(20).all()
    areas = db.query(Area).order_by(Area.priority.desc()).limit(20).all()
    incident_data = [IncidentRead.model_validate(i).model_dump(mode="json") for i in incidents]
    area_data = [AreaRead.model_validate(a).model_dump(mode="json") for a in areas]
    adapter = get_adapter()
    try:
        summary = adapter.summarize_situation(incident_data, area_data)
    except AIAdapterError:
        summary = (
            f"{len(incidents)} active incidents. "
            f"Top priority: {incidents[0].title if incidents else 'None'}."
        )
    return {
        "summary": summary,
        "incident_count": len(incidents),
        "area_count": len(areas),
        "top_priority_incidents": incident_data[:5],
        "top_priority_areas": area_data[:5],
    }


@router.post("/silence")
def detect_silence(req: SilenceRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    area = db.get(Area, req.area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    weather = compute_weather_risk(area.latitude, area.longitude)
    result = compute_information_void(
        expected_reports=max(1, area.population // 5000),
        observed_reports=area.report_count,
        expected_activity=max(1, area.population // 10000),
        observed_activity=max(0, area.report_count - 1),
        connectivity=1.0 - (area.information_void_score / 100.0),
        last_verified=area.last_verified,
        weather_risk=int(weather.get("forecast_risk", 0)),
        population=area.population,
    )
    area.information_void_score = result["void_score"]
    db.commit()
    db.refresh(area)
    return {"area_id": area.id, "information_void": result}


@router.get("/confidence")
def confidence_for_report(report_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    same = db.query(Report).filter(Report.incident_id == report.incident_id).all()
    result = compute_confidence(
        source_type=report.source_type.value,
        timestamp=report.timestamp,
        evidence_count=len(same),
        contradictions=0,
        reports=[{"latitude": r.latitude, "longitude": r.longitude} for r in same],
    )
    return {"report_id": report.id, "confidence": result}


@router.get("/weather/{lat}/{lon}")
def weather(lat: float, lon: float) -> dict[str, Any]:
    return compute_weather_risk(lat, lon)


@router.post("/resources/plan")
def resource_plan(db: Session = Depends(get_db)) -> dict[str, Any]:
    resources = db.query(Resource).all()
    incidents = db.query(Incident).filter(Incident.status == "active").order_by(Incident.priority.desc()).all()
    plan = generate_response_plan(resources, incidents)
    return plan
