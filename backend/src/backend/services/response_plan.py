from __future__ import annotations

import math
from datetime import datetime
from typing import Any

from backend.models.resource import Resource, ResourceStatus
from backend.models.incident import Incident

ASSUMED_SPEED_KMH = {
    "boat": 25,
    "ambulance": 35,
    "helicopter": 180,
    "rescue_team": 25,
    "excavator": 20,
    "medical_team": 35,
    "water_tanker": 30,
    "supply_vehicle": 40,
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _eta_minutes(resource: Resource, incident: Incident) -> int:
    speed = ASSUMED_SPEED_KMH.get(resource.type, 30)
    distance = _haversine_km(resource.latitude, resource.longitude, incident.latitude, incident.longitude)
    if speed <= 0:
        return 9999
    return max(1, int((distance / speed) * 60))


def optimize_resources(resources: list[Resource], incidents: list[Incident]) -> list[dict[str, Any]]:
    available = [r for r in resources if r.status == ResourceStatus.available and r.availability > 0]
    prioritized = sorted(incidents, key=lambda i: i.priority, reverse=True)
    assignments: list[dict[str, Any]] = []
    used_resources: set[str] = set()

    for incident in prioritized:
        candidates = [
            r for r in available
            if r.id not in used_resources
            and r.type in {"boat", "rescue_team", "ambulance", "helicopter", "medical_team"}
        ]
        if not candidates:
            continue
        candidates.sort(key=lambda r: _eta_minutes(r, incident))
        for resource in candidates:
            if resource.capacity >= 1:
                eta = _eta_minutes(resource, incident)
                assignments.append(
                    {
                        "resource_id": resource.id,
                        "incident_id": incident.id,
                        "eta_minutes": eta,
                        "reason": f"priority={incident.priority}, capacity={resource.capacity}",
                    }
                )
                used_resources.add(resource.id)
                break
    return assignments


def generate_response_plan(resources: list[Resource], incidents: list[Incident]) -> dict[str, Any]:
    assignments = optimize_resources(resources, incidents)
    return {
        "plan_id": f"PLAN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "assignments": assignments,
        "note": "ESTIMATED ETA based on geodesic distance and assumed speeds",
    }
