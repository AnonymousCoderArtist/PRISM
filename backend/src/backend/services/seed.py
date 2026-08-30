from datetime import datetime, timedelta
from typing import Any

from backend.models.report import Report, SourceType, MediaType, ReportStatus
from backend.models.incident import Incident, IncidentStatus, IncidentSeverity
from backend.models.evidence import Evidence, EvidenceType
from backend.models.area import Area, AreaStatus
from backend.models.resource import Resource, ResourceType, ResourceStatus
from backend.models.activity_log import ActivityEvent
from backend.services.simulation import manager


GUWAHATI_CENTER = (26.1445, 91.7362)
SEED_TICK = 0


def _ts(minutes_ago: int = 0) -> datetime:
    return datetime.utcnow() - timedelta(minutes=minutes_ago)


def seed_database(db: Any) -> dict[str, Any]:
    if db.query(Area).count() > 0:
        return {"status": "already_seeded"}

    areas = [
        Area(id="S01", name="Dispur", latitude=26.1445, longitude=91.7362, population=12000, vulnerable_population=1800, status=AreaStatus.at_risk, risk_score=45, priority=65, confidence=72, information_void_score=10, last_verified=_ts(15)),
        Area(id="S02", name="Paltan Bazaar", latitude=26.1585, longitude=91.7485, population=25000, vulnerable_population=3200, status=AreaStatus.affected, risk_score=68, priority=80, confidence=85, information_void_score=5, last_verified=_ts(5)),
        Area(id="S03", name="Bhangagarh", latitude=26.1495, longitude=91.7655, population=18000, vulnerable_population=2200, status=AreaStatus.severe, risk_score=82, priority=92, confidence=91, information_void_score=2, last_verified=_ts(2)),
        Area(id="S04", name="Maligaon", latitude=26.1325, longitude=91.7255, population=22000, vulnerable_population=2800, status=AreaStatus.at_risk, risk_score=58, priority=72, confidence=68, information_void_score=15, last_verified=_ts(20)),
        Area(id="S05", name="Chandmari", latitude=26.1655, longitude=91.7555, population=9000, vulnerable_population=1100, status=AreaStatus.normal, risk_score=30, priority=40, confidence=60, information_void_score=25, last_verified=_ts(45)),
        Area(id="S06", name="Lokhra", latitude=26.1285, longitude=91.7355, population=14000, vulnerable_population=1600, status=AreaStatus.at_risk, risk_score=52, priority=68, confidence=74, information_void_score=12, last_verified=_ts(18)),
        Area(id="S07", name="Beltola", latitude=26.1385, longitude=91.7455, population=16000, vulnerable_population=2000, status=AreaStatus.normal, risk_score=25, priority=35, confidence=55, information_void_score=35, last_verified=_ts(60)),
        Area(id="S08", name="Ganeshguri", latitude=26.1425, longitude=91.7405, population=20000, vulnerable_population=2400, status=AreaStatus.affected, risk_score=65, priority=78, confidence=88, information_void_score=8, last_verified=_ts(8)),
        Area(id="S09", name="Six Mile", latitude=26.1515, longitude=91.7425, population=11000, vulnerable_population=1300, status=AreaStatus.information_void, risk_score=40, priority=50, confidence=20, information_void_score=85, last_verified=_ts(120)),
        Area(id="S10", name="Jalukbari", latitude=26.1215, longitude=91.7225, population=17000, vulnerable_population=2100, status=AreaStatus.at_risk, risk_score=48, priority=62, confidence=70, information_void_score=18, last_verified=_ts(25)),
    ]
    db.add_all(areas)
    db.flush()

    incidents = [
        Incident(id="INC-001", title="Brahmaputra Flooding - Bhangagarh", event_type="flood", latitude=26.1495, longitude=91.7655, area_id="S03", severity=IncidentSeverity.critical, people_affected=420, people_trapped=85, vulnerable_population=340, confidence=92, priority=95, status=IncidentStatus.active, created_at=_ts(30)),
        Incident(id="INC-002", title="Road Collapse - Maligaon Bridge", event_type="infrastructure", latitude=26.1325, longitude=91.7255, area_id="S04", severity=IncidentSeverity.high, people_affected=150, people_trapped=20, vulnerable_population=60, confidence=78, priority=82, status=IncidentStatus.active, created_at=_ts(25)),
        Incident(id="INC-003", title="Building Damage - Paltan Bazaar", event_type="structural", latitude=26.1585, longitude=91.7485, area_id="S02", severity=IncidentSeverity.high, people_affected=200, people_trapped=45, vulnerable_population=80, confidence=85, priority=80, status=IncidentStatus.active, created_at=_ts(20)),
        Incident(id="INC-004", title="Waterlogging - Dispur", event_type="flood", latitude=26.1445, longitude=91.7362, area_id="S01", severity=IncidentSeverity.moderate, people_affected=80, people_trapped=5, vulnerable_population=25, confidence=72, priority=65, status=IncidentStatus.active, created_at=_ts(15)),
        Incident(id="INC-005", title="Power Outage - Ganeshguri", event_type="infrastructure", latitude=26.1425, longitude=91.7405, area_id="S08", severity=IncidentSeverity.moderate, people_affected=300, people_trapped=0, vulnerable_population=120, confidence=88, priority=60, status=IncidentStatus.active, created_at=_ts(10)),
        Incident(id="INC-006", title="Communication Blackout - Six Mile", event_type="communications", latitude=26.1515, longitude=91.7425, area_id="S09", severity=IncidentSeverity.high, people_affected=500, people_trapped=30, vulnerable_population=200, confidence=20, priority=85, status=IncidentStatus.active, created_at=_ts(35)),
        Incident(id="INC-007", title="Flooding - Lokhra", event_type="flood", latitude=26.1285, longitude=91.7355, area_id="S06", severity=IncidentSeverity.moderate, people_affected=120, people_trapped=15, vulnerable_population=40, confidence=74, priority=68, status=IncidentStatus.active, created_at=_ts(18)),
        Incident(id="INC-008", title="Landslide Risk - Jalukbari", event_type="landslide", latitude=26.1215, longitude=91.7225, area_id="S10", severity=IncidentSeverity.moderate, people_affected=90, people_trapped=10, vulnerable_population=30, confidence=70, priority=62, status=IncidentStatus.active, created_at=_ts(22)),
    ]
    db.add_all(incidents)
    db.flush()

    reports = [
        Report(id="R-001", timestamp=_ts(30), source_type=SourceType.field_officer, source_name="Field Officer Raj", latitude=26.1495, longitude=91.7655, location_name="Bhangagarh", raw_text="Severe flooding observed near Bhangagarh intersection. Water level rising rapidly.", media_type=MediaType.text, claimed_severity=4, people_affected=420, people_trapped=85, vulnerable_population=340, event_type="flood", evidence_type="field_report", confidence=92, status=ReportStatus.verified, incident_id="INC-001"),
        Report(id="R-002", timestamp=_ts(28), source_type=SourceType.drone, source_name="DRN-01", latitude=26.1498, longitude=91.7658, location_name="Bhangagarh", raw_text="Aerial imagery confirms flooding extent.", media_type=MediaType.video, claimed_severity=4, people_affected=380, people_trapped=75, vulnerable_population=300, event_type="flood", evidence_type="drone", confidence=90, status=ReportStatus.verified, incident_id="INC-001"),
        Report(id="R-003", timestamp=_ts(25), source_type=SourceType.citizen, source_name="Amit Sharma", latitude=26.1325, longitude=91.7255, location_name="Maligaon Bridge", raw_text="Bridge partially collapsed. People stranded on both sides.", media_type=MediaType.photo, claimed_severity=3, people_affected=150, people_trapped=20, vulnerable_population=60, event_type="infrastructure", evidence_type="photo", confidence=78, status=ReportStatus.verified, incident_id="INC-002"),
        Report(id="R-004", timestamp=_ts(22), source_type=SourceType.field_officer, source_name="Officer Priya", latitude=26.1328, longitude=91.7258, location_name="Maligaon Bridge", raw_text="Confirmed structural damage. Emergency vehicles cannot cross.", media_type=MediaType.text, claimed_severity=3, people_affected=150, people_trapped=20, vulnerable_population=60, event_type="infrastructure", evidence_type="field_report", confidence=82, status=ReportStatus.verified, incident_id="INC-002"),
        Report(id="R-005", timestamp=_ts(20), source_type=SourceType.citizen, source_name="Rahul Das", latitude=26.1585, longitude=91.7485, location_name="Paltan Bazaar", raw_text="Building collapsed near market. Several people trapped.", media_type=MediaType.video, claimed_severity=3, people_affected=200, people_trapped=45, vulnerable_population=80, event_type="structural", evidence_type="video", confidence=85, status=ReportStatus.verified, incident_id="INC-003"),
        Report(id="R-006", timestamp=_ts(18), source_type=SourceType.news, source_name="Assam Times", latitude=26.1585, longitude=91.7485, location_name="Paltan Bazaar", raw_text="Multiple injuries reported from building collapse.", media_type=MediaType.text, claimed_severity=3, people_affected=200, people_trapped=45, vulnerable_population=80, event_type="structural", evidence_type="news", confidence=80, status=ReportStatus.verified, incident_id="INC-003"),
        Report(id="R-007", timestamp=_ts(15), source_type=SourceType.social_media, source_name="@guwahati_watcher", latitude=26.1445, longitude=91.7362, location_name="Dispur", raw_text="Waterlogging reported near Dispur.", media_type=MediaType.text, claimed_severity=2, people_affected=80, people_trapped=5, vulnerable_population=25, event_type="flood", evidence_type="social_media", confidence=60, status=ReportStatus.verified, incident_id="INC-004"),
        Report(id="R-008", timestamp=_ts(12), source_type=SourceType.citizen, source_name="Meena Devi", latitude=26.1425, longitude=91.7405, location_name="Ganeshguri", raw_text="Power outage affecting entire area.", media_type=MediaType.text, claimed_severity=2, people_affected=300, people_trapped=0, vulnerable_population=120, event_type="infrastructure", evidence_type="citizen", confidence=75, status=ReportStatus.verified, incident_id="INC-005"),
        Report(id="R-009", timestamp=_ts(10), source_type=SourceType.satellite, source_name="SAT-IMG-01", latitude=26.1425, longitude=91.7405, location_name="Ganeshguri", raw_text="Satellite confirms widespread power outage.", media_type=MediaType.photo, claimed_severity=2, people_affected=300, people_trapped=0, vulnerable_population=120, event_type="infrastructure", evidence_type="satellite", confidence=88, status=ReportStatus.verified, incident_id="INC-005"),
        Report(id="R-010", timestamp=_ts(35), source_type=SourceType.citizen, source_name="Unknown Caller", latitude=26.1515, longitude=91.7425, location_name="Six Mile", raw_text="No contact with Six Mile area for 2 hours.", media_type=MediaType.voice, claimed_severity=3, people_affected=500, people_trapped=30, vulnerable_population=200, event_type="communications", evidence_type="voice", confidence=35, status=ReportStatus.pending, incident_id="INC-006"),
        Report(id="R-011", timestamp=_ts(18), source_type=SourceType.citizen, source_name="Babul Ahmed", latitude=26.1285, longitude=91.7355, location_name="Lokhra", raw_text="Flood water entering homes in Lokhra.", media_type=MediaType.photo, claimed_severity=2, people_affected=120, people_trapped=15, vulnerable_population=40, event_type="flood", evidence_type="photo", confidence=70, status=ReportStatus.verified, incident_id="INC-007"),
        Report(id="R-012", timestamp=_ts(22), source_type=SourceType.field_officer, source_name="Officer Tom", latitude=26.1215, longitude=91.7225, location_name="Jalukbari", raw_text="Landslide risk detected near Jalukbari hill.", media_type=MediaType.text, claimed_severity=2, people_affected=90, people_trapped=10, vulnerable_population=30, event_type="landslide", evidence_type="field_report", confidence=72, status=ReportStatus.verified, incident_id="INC-008"),
        Report(id="R-013", timestamp=_ts(5), source_type=SourceType.citizen, source_name="Priya Gogoi", latitude=26.1445, longitude=91.7362, location_name="Dispur", raw_text="Water level rising near my house.", media_type=MediaType.text, claimed_severity=2, people_affected=40, people_trapped=0, vulnerable_population=15, event_type="flood", evidence_type="citizen", confidence=55, status=ReportStatus.verified, incident_id="INC-004"),
        Report(id="R-014", timestamp=_ts(3), source_type=SourceType.citizen, source_name="Ravi Kumar", latitude=26.1585, longitude=91.7485, location_name="Paltan Bazaar", raw_text="Rescue team arrived at Paltan.", media_type=MediaType.text, claimed_severity=2, people_affected=0, people_trapped=0, vulnerable_population=0, event_type="rescue", evidence_type="citizen", confidence=80, status=ReportStatus.verified, incident_id="INC-003"),
    ]
    db.add_all(reports)
    db.flush()

    resources = [
        Resource(id="RES-001", type=ResourceType.boat, status=ResourceStatus.deployed, latitude=26.1490, longitude=91.7640, capacity=12, availability=0.8),
        Resource(id="RES-002", type=ResourceType.boat, status=ResourceStatus.available, latitude=26.1300, longitude=91.7200, capacity=10, availability=1.0),
        Resource(id="RES-003", type=ResourceType.ambulance, status=ResourceStatus.deployed, latitude=26.1580, longitude=91.7480, capacity=4, availability=0.6),
        Resource(id="RES-004", type=ResourceType.ambulance, status=ResourceStatus.available, latitude=26.1400, longitude=91.7400, capacity=4, availability=1.0),
        Resource(id="RES-005", type=ResourceType.helicopter, status=ResourceStatus.available, latitude=26.1500, longitude=91.7500, capacity=8, availability=1.0),
        Resource(id="RES-006", type=ResourceType.rescue_team, status=ResourceStatus.deployed, latitude=26.1495, longitude=91.7650, capacity=20, availability=0.9),
        Resource(id="RES-007", type=ResourceType.rescue_team, status=ResourceStatus.available, latitude=26.1600, longitude=91.7500, capacity=15, availability=1.0),
        Resource(id="RES-008", type=ResourceType.medical_team, status=ResourceStatus.available, latitude=26.1450, longitude=91.7350, capacity=10, availability=1.0),
        Resource(id="RES-009", type=ResourceType.water_tanker, status=ResourceStatus.available, latitude=26.1300, longitude=91.7300, capacity=5000, availability=1.0),
        Resource(id="RES-010", type=ResourceType.excavator, status=ResourceStatus.maintenance, latitude=26.1200, longitude=91.7100, capacity=1, availability=0.0),
        Resource(id="RES-011", type=ResourceType.supply_vehicle, status=ResourceStatus.available, latitude=26.1400, longitude=91.7400, capacity=1000, availability=1.0),
        Resource(id="RES-012", type=ResourceType.boat, status=ResourceStatus.available, latitude=26.1250, longitude=91.7350, capacity=8, availability=1.0),
    ]
    db.add_all(resources)
    db.flush()

    evidences = [
        Evidence(id="EV-001", incident_id="INC-001", source_type=SourceType.field_officer.value, source_id="R-001", confidence=92, evidence_type=EvidenceType.supports, timestamp=_ts(30), data='{"weight": 25, "field": 25, "satellite": 0, "drone": 0, "citizen": 0, "total": 92, "breakdown": {"field": 25, "satellite": 0, "drone": 0, "citizen": 0, "consistency": 10}, "explanation": "field officer confirmation strong"}'),
        Evidence(id="EV-002", incident_id="INC-001", source_type=SourceType.drone.value, source_id="R-002", confidence=90, evidence_type=EvidenceType.supports, timestamp=_ts(28), data='{"weight": 20, "field": 0, "satellite": 0, "drone": 20, "citizen": 0, "total": 90, "breakdown": {"field": 0, "satellite": 0, "drone": 20, "citizen": 0, "consistency": 10}, "explanation": "drone confirmation strong"}'),
        Evidence(id="EV-003", incident_id="INC-002", source_type=SourceType.citizen.value, source_id="R-003", confidence=78, evidence_type=EvidenceType.supports, timestamp=_ts(25), data='{"weight": 10, "field": 0, "satellite": 0, "drone": 0, "citizen": 10, "total": 78, "breakdown": {"field": 0, "satellite": 0, "drone": 0, "citizen": 10, "consistency": 8}, "explanation": "citizen photo corroborated by field officer"}'),
        Evidence(id="EV-004", incident_id="INC-002", source_type=SourceType.field_officer.value, source_id="R-004", confidence=82, evidence_type=EvidenceType.supports, timestamp=_ts(22), data='{"weight": 25, "field": 25, "satellite": 0, "drone": 0, "citizen": 0, "total": 82, "breakdown": {"field": 25, "satellite": 0, "drone": 0, "citizen": 0, "consistency": 7}, "explanation": "field officer confirmation moderate"}'),
        Evidence(id="EV-005", incident_id="INC-003", source_type=SourceType.citizen.value, source_id="R-005", confidence=85, evidence_type=EvidenceType.supports, timestamp=_ts(20), data='{"weight": 10, "field": 0, "satellite": 0, "drone": 0, "citizen": 10, "total": 85, "breakdown": {"field": 0, "satellite": 0, "drone": 0, "citizen": 10, "consistency": 9}, "explanation": "citizen video corroborated by news"}'),
        Evidence(id="EV-006", incident_id="INC-003", source_type=SourceType.news.value, source_id="R-006", confidence=80, evidence_type=EvidenceType.supports, timestamp=_ts(20), data='{"weight": 5, "field": 0, "satellite": 0, "drone": 0, "citizen": 0, "total": 80, "breakdown": {"field": 0, "satellite": 0, "drone": 0, "citizen": 0, "consistency": 8}, "explanation": "news report corroborates citizen video"}'),
        Evidence(id="EV-007", incident_id="INC-004", source_type=SourceType.social_media.value, source_id="R-007", confidence=60, evidence_type=EvidenceType.supports, timestamp=_ts(15), data='{"weight": 5, "field": 0, "satellite": 0, "drone": 0, "citizen": 0, "total": 60, "breakdown": {"field": 0, "satellite": 0, "drone": 0, "citizen": 0, "consistency": 5}, "explanation": "single social media report"}'),
        Evidence(id="EV-008", incident_id="INC-005", source_type=SourceType.citizen.value, source_id="R-008", confidence=75, evidence_type=EvidenceType.supports, timestamp=_ts(10), data='{"weight": 10, "field": 0, "satellite": 0, "drone": 0, "citizen": 10, "total": 75, "breakdown": {"field": 0, "satellite": 0, "drone": 0, "citizen": 10, "consistency": 7}, "explanation": "citizen report corroborated by satellite"}'),
        Evidence(id="EV-009", incident_id="INC-005", source_type=SourceType.satellite.value, source_id="R-009", confidence=88, evidence_type=EvidenceType.supports, timestamp=_ts(10), data='{"weight": 25, "field": 0, "satellite": 25, "drone": 0, "citizen": 0, "total": 88, "breakdown": {"field": 0, "satellite": 25, "drone": 0, "citizen": 0, "consistency": 8}, "explanation": "satellite confirmation strong"}'),
        Evidence(id="EV-010", incident_id="INC-006", source_type=SourceType.citizen.value, source_id="R-010", confidence=35, evidence_type=EvidenceType.neutral, timestamp=_ts(35), data='{"weight": 2, "field": 0, "satellite": 0, "drone": 0, "citizen": 0, "total": 35, "breakdown": {"field": 0, "satellite": 0, "drone": 0, "citizen": 0, "consistency": 3}, "explanation": "single unverified social report"}'),
    ]
    db.add_all(evidences)
    db.flush()

    activities = [
        ActivityEvent(id="ACT-001", event_type="SIMULATION_SEED", payload='{"message": "Database seeded with initial data"}', tick=0),
        ActivityEvent(id="ACT-002", event_type="INCIDENT_FORMED", payload='{"incident_id": "INC-001"}', tick=30),
        ActivityEvent(id="ACT-003", event_type="INCIDENT_FORMED", payload='{"incident_id": "INC-002"}', tick=25),
        ActivityEvent(id="ACT-004", event_type="REPORT_VERIFIED", payload='{"report_id": "R-001"}', tick=30),
        ActivityEvent(id="ACT-005", event_type="REPORT_VERIFIED", payload='{"report_id": "R-002"}', tick=28),
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
