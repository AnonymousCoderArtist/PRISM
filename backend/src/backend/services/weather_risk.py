from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def _load_demo_weather() -> dict[str, Any]:
    path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "demo" / "weather.json"
    if not path.exists():
        return {
            "rainfall_next_6h_mm": 0,
            "rain_probability": 10,
            "weather_condition": "clear",
            "forecast_risk": 5,
        }
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {
            "rainfall_next_6h_mm": 0,
            "rain_probability": 10,
            "weather_condition": "clear",
            "forecast_risk": 5,
        }


def compute_weather_risk(lat: float, lon: float) -> dict[str, Any]:
    # MVP: local deterministic fallback. External APIs may be added later.
    return _load_demo_weather()
