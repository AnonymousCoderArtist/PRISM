from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


def compute_information_void(
    *,
    expected_reports: int,
    observed_reports: int,
    expected_activity: int,
    observed_activity: int,
    connectivity: float,
    last_verified: datetime | None,
    weather_risk: int,
    population: int,
) -> dict[str, Any]:
    now = datetime.utcnow()
    silence_duration_hours = 0.0
    if last_verified:
        silence_duration_hours = (now - last_verified).total_seconds() / 3600.0

    reporting_ratio = observed_reports / max(1, expected_reports)
    activity_ratio = observed_activity / max(1, expected_activity)

    void_score = int(
        max(0, min(100,
            40 * (1 - reporting_ratio)
            + 30 * (1 - activity_ratio)
            + 15 * (1 - connectivity)
            + 10 * min(1.0, silence_duration_hours / 24.0)
            + 5 * (weather_risk / 100.0)
            + 5 * min(1.0, population / 50000.0),
        ))
    )

    if void_score >= 75:
        status = "INVESTIGATION_REQUIRED"
    elif void_score >= 50:
        status = "ELEVATED_WATCH"
    else:
        status = "NORMAL"

    reasons: list[str] = []
    if reporting_ratio < 0.3:
        reasons.append("no recent reports")
    if activity_ratio < 0.3:
        reasons.append("activity drop")
    if connectivity < 0.3:
        reasons.append("connectivity unavailable")
    if weather_risk >= 60:
        reasons.append("high weather risk")
    if silence_duration_hours >= 24:
        reasons.append("silence >24h")

    return {
        "void_score": void_score,
        "status": status,
        "reason": reasons or ["within expected parameters"],
        "silence_duration_hours": round(silence_duration_hours, 2),
        "risk_level": "high" if void_score >= 75 else "moderate" if void_score >= 50 else "low",
    }
