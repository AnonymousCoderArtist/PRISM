from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from backend.models.report import Report, SourceType, MediaType, ReportStatus
from backend.models.incident import Incident, IncidentStatus, IncidentSeverity
from backend.models.evidence import Evidence, EvidenceType
from backend.models.area import Area, AreaStatus
from backend.models.resource import Resource, ResourceType, ResourceStatus
from backend.models.activity_log import ActivityEvent
from backend.services.simulation import manager


BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEMO_DIR = BASE_DIR / "data" / "demo"


def _ts(minutes_ago: int = 0) -> datetime:
    return datetime.utcnow() - timedelta(minutes=minutes_ago)


def _load_json(name: str) -> Any:
    path = DEMO_DIR / name
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []


def seed_database(db: Any) -> dict[str, Any]:
    if db.query(Area).count() > 0:
        return {"status": "already_seeded"}

    areas_raw = _load_json("sectors.json")
    incidents_raw = _load_json("incidents.json")
    reports_raw = _load_json("reports.json")
    resources_raw = _load_json("resources.json")

    areas = []
    for item in areas_raw:
        areas.append(
            Area(
                id=item["id"],
                name=item.get("name", item["id"]),
                latitude=item.get("latitude", 0.0),
                longitude=item.get("longitude", 0.0),
                population=item.get("population", 0),
                vulnerable_population=item.get("vulnerable_population", 0),
                status=AreaStatus(item.get("status", "normal")),
                risk_score=item.get("risk_score", 0),
                priority=item.get("priority", 0),
                confidence=item.get("confidence", 0),
                information_void_score=item.get("information_void_score", 0),
                last_verified=_ts(30),
                report_count=item.get("report_count", 0),
            )
        )
    db.add_all(areas)
    db.flush()

    incidents = []
    for item in incidents_raw:
        incidents.append(
            Incident(
                id=item["id"],
                title=item.get("title", item["id"]),
                event_type=item.get("event_type", "unknown"),
                latitude=item.get("latitude", 0.0),
                longitude=item.get("longitude", 0.0),
                area_id=item.get("area_id"),
                severity=IncidentSeverity(item.get("severity", "moderate")),
                people_affected=item.get("people_affected", 0),
                people_trapped=item.get("people_trapped", 0),
                vulnerable_population=item.get("vulnerable_population", 0),
                confidence=item.get("confidence", 0),
                priority=item.get("priority", 0),
                status=IncidentStatus(item.get("status", "active")),
                created_at=_ts(30),
            )
        )
    db.add_all(incidents)
    db.flush()

    reports = []
    for item in reports_raw:
        reports.append(
            Report(
                id=item["id"],
                timestamp=_ts(30),
                source_type=SourceType(item.get("source_type", "citizen")),
                source_name=item.get("source_name", "Unknown"),
                latitude=item.get("latitude", 0.0),
                longitude=item.get("longitude", 0.0),
                location_name=item.get("location_name", ""),
                raw_text=item.get("raw_text", ""),
                media_type=MediaType(item.get("media_type", "text")),
                claimed_severity=item.get("claimed_severity", 1),
                people_affected=item.get("people_affected", 0),
                people_trapped=item.get("people_trapped", 0),
                vulnerable_population=item.get("vulnerable_population", 0),
                event_type=item.get("event_type", "unknown"),
                evidence_type=item.get("evidence_type", "citizen"),
                confidence=item.get("confidence", 0),
                status=ReportStatus(item.get("status", "pending")),
                incident_id=item.get("incident_id"),
            )
        )
    db.add_all(reports)
    db.flush()

    resources = []
    for item in resources_raw:
        resources.append(
            Resource(
                id=item["id"],
                type=ResourceType(item.get("type", "supply_vehicle")),
                status=ResourceStatus(item.get("status", "available")),
                latitude=item.get("latitude", 0.0),
                longitude=item.get("longitude", 0.0),
                capacity=item.get("capacity", 1),
                availability=item.get("availability", 1.0),
            )
        )
    db.add_all(resources)
    db.flush()

    evidences = [
        Evidence(
            id="EV-001",
            incident_id="INC-001",
            source_type=SourceType.field_officer.value,
            source_id="R-001",
            confidence=92,
            evidence_type=EvidenceType.supports,
            timestamp=_ts(30),
            data=json.dumps({"weight": 25, "field": 25, "satellite": 0, "drone": 0, "citizen": 0, "total": 92, "breakdown": {"field": 25, "satellite": 0, "drone": 0, "citizen": 0, "consistency": 10}, "explanation": "field officer confirmation strong"}),
        ),
        Evidence(
            id="EV-002",
            incident_id="INC-001",
            source_type=SourceType.drone.value,
            source_id="R-002",
            confidence=90,
            evidence_type=EvidenceType.supports,
            timestamp=_ts(28),
            data=json.dumps({"weight": 20, "field": 0, "satellite": 0, "drone": 20, "citizen": 0, "total": 90, "breakdown": {"field": 0, "satellite": 0, "drone": 20, "citizen": 0, "consistency": 10}, "explanation": "drone confirmation strong"}),
        ),
    ]
    db.add_all(evidences)
    db.flush()

    activities = [
        ActivityEvent(id="ACT-001", event_type="SIMULATION_SEED", payload=json.dumps({"message": "Database seeded with initial data"}), tick=0),
        ActivityEvent(id="ACT-002", event_type="INCIDENT_FORMED", payload=json.dumps({"incident_id": "INC-001"}), tick=30),
        ActivityEvent(id="ACT-003", event_type="REPORT_VERIFIED", payload=json.dumps({"report_id": "R-001"}), tick=30),
    ]
    db.add_all(activities)
    db.flush()
    db.commit()

    return {
        "status": "seeded",
        "areas": len(areas),
        "incidents": len(incidents),
        "reports": len(reports),
        "resources": len(resources),
        "evidences": len(evidences),
        "activities": len(activities),
    }
