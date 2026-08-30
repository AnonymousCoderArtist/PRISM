from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from backend.models.evidence import EvidenceType

SOURCE_WEIGHT = {
    "field_officer": 25,
    "satellite": 25,
    "drone": 20,
    "field_report": 25,
    "verified_citizen": 10,
    "citizen": 10,
    "sensor": 10,
    "photo": 10,
    "video": 12,
    "news": 8,
    "social_media": 5,
    "voice": 5,
    "media": 5,
}


def _age_hours(timestamp: datetime) -> float:
    return (datetime.utcnow() - timestamp).total_seconds() / 3600.0


def _freshness_score(age_hours: float) -> int:
    if age_hours <= 1:
        return 10
    if age_hours <= 6:
        return 7
    if age_hours <= 24:
        return 4
    return 0


def _corroboration_score(evidence_count: int) -> int:
    if evidence_count >= 4:
        return 10
    if evidence_count == 3:
        return 8
    if evidence_count == 2:
        return 5
    return 0


def _location_agreement_score(reports: list[dict[str, Any]]) -> int:
    if len(reports) < 2:
        return 5
    lats = [r.get("latitude", 0) for r in reports]
    lngs = [r.get("longitude", 0) for r in reports]
    if not lats or not lngs:
        return 0
    spread = max(lats) - min(lats) + max(lngs) - min(lngs)
    if spread < 0.01:
        return 10
    if spread < 0.05:
        return 6
    return 2


def _contradiction_penalty(contradictions: int) -> int:
    return max(0, 10 - contradictions * 5)


def compute_confidence(
    *,
    source_type: str,
    timestamp: datetime,
    evidence_count: int = 1,
    contradictions: int = 0,
    reports: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    reports = reports or []
    source_score = SOURCE_WEIGHT.get(source_type, 2)
    freshness = _freshness_score(_age_hours(timestamp))
    corroboration = _corroboration_score(evidence_count)
    location = _location_agreement_score(reports)
    quality = 10 if source_type in {"field_officer", "satellite", "drone", "field_report"} else 5
    penalty = _contradiction_penalty(contradictions)

    total = min(100, max(0, source_score + freshness + corroboration + location + quality + penalty))
    return {
        "score": total,
        "breakdown": {
            "source": source_score,
            "freshness": freshness,
            "corroboration": corroboration,
            "location": location,
            "quality": quality,
            "penalty": penalty,
        },
        "explanation": _explain(source_type, evidence_count, contradictions, freshness),
    }


def _explain(source_type: str, evidence_count: int, contradictions: int, freshness: int) -> str:
    parts = [f"{source_type} source"]
    if evidence_count > 1:
        parts.append(f"corroborated by {evidence_count - 1} other source(s)")
    if freshness >= 7:
        parts.append("fresh reporting")
    if contradictions:
        parts.append(f"{contradictions} contradiction(s) detected")
    return "; ".join(parts) if parts else "limited evidence"
