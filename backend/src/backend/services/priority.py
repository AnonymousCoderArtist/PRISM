from __future__ import annotations

from typing import Any


def compute_priority(
    *,
    severity: str,
    people_affected: int,
    vulnerable_population: int,
    confidence: int,
    urgency: int = 50,
    isolation: int = 50,
    forecast_risk: int = 0,
) -> dict[str, Any]:
    severity_map = {"low": 10, "moderate": 30, "high": 60, "severe": 85, "critical": 100}
    severity_score = severity_map.get(severity, 10)

    pop_score = min(100, people_affected // 10)
    vuln_score = min(100, vulnerable_population // 5)

    score = int(
        0.25 * severity_score
        + 0.20 * pop_score
        + 0.15 * vuln_score
        + 0.15 * urgency
        + 0.10 * isolation
        + 0.10 * forecast_risk
        + 0.05 * confidence
    )
    score = max(0, min(100, score))

    if score >= 90:
        level = "P1"
    elif score >= 75:
        level = "P2"
    elif score >= 50:
        level = "P3"
    else:
        level = "MONITOR"

    return {
        "priority_score": score,
        "priority_level": level,
        "breakdown": {
            "severity": round(0.25 * severity_score, 2),
            "population": round(0.20 * pop_score, 2),
            "vulnerable": round(0.15 * vuln_score, 2),
            "urgency": round(0.15 * urgency, 2),
            "isolation": round(0.10 * isolation, 2),
            "forecast_risk": round(0.10 * forecast_risk, 2),
            "confidence": round(0.05 * confidence, 2),
        },
    }
