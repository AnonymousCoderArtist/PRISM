from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import requests

from backend.services.ai_adapter import get_adapter, AIAdapterError


WTTR_URL = "https://wttr.in/{lat},{lon}?format=j1"
WTTR_TIMEOUT = 8


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


def _fetch_wttr(lat: float, lon: float) -> dict[str, Any] | None:
    try:
        resp = requests.get(WTTR_URL.format(lat=lat, lon=lon), timeout=WTTR_TIMEOUT)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None


def _extract_forecast(data: dict[str, Any]) -> dict[str, Any]:
    weather: dict[str, Any] = {
        "rainfall_next_6h_mm": 0,
        "rain_probability": 10,
        "weather_condition": "clear",
        "forecast_risk": 5,
        "disaster_predictions": [],
        "suspected_disasters": [],
    }

    try:
        current = data.get("current_condition", [{}])[0]
        weather["weather_condition"] = current.get("weatherDesc", [{}])[0].get("value", "clear").lower()
        weather["rain_probability"] = int(current.get("humidity", 0)) % 100
    except Exception:
        pass

    try:
        forecast_days = data.get("weather", [])
        total_rain = 0
        hours_with_rain = 0
        total_hours = 0
        wind_gusts: list[float] = []
        temps: list[float] = []

        for day in forecast_days[:2]:
            for hour in day.get("hourly", []):
                try:
                    rain = float(hour.get("precipMM", 0))
                    total_rain += rain
                    total_hours += 1
                    if rain > 0.5:
                        hours_with_rain += 1
                    wind_gusts.append(float(hour.get("WindGustKmph", 0)))
                    temps.append(float(hour.get("tempC", 0)))
                except Exception:
                    continue

        if total_hours > 0:
            weather["rainfall_next_6h_mm"] = round(total_rain, 1)
            weather["rain_probability"] = max(10, min(100, int((hours_with_rain / total_hours) * 100)))

        max_wind = max(wind_gusts) if wind_gusts else 0
        max_temp = max(temps) if temps else 0
        min_temp = min(temps) if temps else 0

        predictions: list[dict[str, Any]] = []
        if weather["rainfall_next_6h_mm"] >= 20 or weather["rain_probability"] >= 70:
            predictions.append({
                "disaster_type": "flood",
                "confidence": min(95, 40 + weather["rainfall_next_6h_mm"] + weather["rain_probability"] // 5),
                "severity": "high" if weather["rainfall_next_6h_mm"] >= 50 else "moderate",
                "reason": f"Heavy rainfall forecast: {weather['rainfall_next_6h_mm']} mm in next 6h with {weather['rain_probability']}% probability.",
            })

        if max_wind >= 75 or max_temp >= 45:
            predictions.append({
                "disaster_type": "cyclone" if max_wind >= 75 else "heatwave",
                "confidence": min(95, 40 + max_wind // 2 if max_wind >= 75 else 40 + (max_temp - 35) * 3),
                "severity": "critical" if max_wind >= 100 or max_temp >= 48 else "high",
                "reason": f"Extreme winds {max_wind} km/h and temperature {max_temp}°C indicate severe storm conditions." if max_wind >= 75 else f"Extreme heat {max_temp}°C with low relief indicates dangerous heatwave conditions.",
            })

        if min_temp <= 5:
            predictions.append({
                "disaster_type": "cold_wave",
                "confidence": min(95, 50 + (10 - min_temp) * 5),
                "severity": "moderate" if min_temp > 0 else "high",
                "reason": f"Temperatures dropping to {min_temp}°C. Risk of cold wave and frost conditions.",
            })

        if not predictions:
            predictions.append({
                "disaster_type": "none",
                "confidence": 85,
                "severity": "low",
                "reason": "No extreme weather patterns detected in forecast.",
            })

        weather["disaster_predictions"] = predictions
        weather["suspected_disasters"] = [p["disaster_type"] for p in predictions if p["disaster_type"] != "none"]

        base_risk = int(weather["rain_probability"] * 0.5 + max_wind * 0.2)
        weather["forecast_risk"] = max(0, min(100, base_risk))

    except Exception:
        pass

    return weather


def compute_weather_risk(lat: float, lon: float) -> dict[str, Any]:
    data = _fetch_wttr(lat, lon)
    if data is None:
        return _load_demo_weather()
    return _extract_forecast(data)


def predict_disaster(lat: float, lon: float) -> dict[str, Any]:
    weather = compute_weather_risk(lat, lon)
    adapter = get_adapter()
    prompt = (
        "You are PRISM, a disaster intelligence assistant. Based on the following weather forecast data, "
        "predict whether the region is suspected for any disaster type (flood, cyclone, earthquake, landslide, "
        "heatwave, cold_wave, fire, etc.). Return JSON with keys: disaster_type (string), confidence (int 0-100), "
        "severity (string: low/moderate/high/critical), reason (string). If no disaster is suspected, set disaster_type to 'none'."
    )
    schema = {
        "type": "object",
        "properties": {
            "disaster_type": {"type": "string"},
            "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
            "severity": {"type": "string", "enum": ["low", "moderate", "high", "critical"]},
            "reason": {"type": "string"},
        },
        "required": ["disaster_type", "confidence", "severity", "reason"],
    }
    try:
        result = adapter._generate(f"{prompt}\nweather_data={weather}", response_schema=schema)
        if not isinstance(result, dict):
            raise AIAdapterError("Invalid prediction format")
        return {
            "weather": weather,
            "prediction": {
                "disaster_type": result.get("disaster_type", "none"),
                "confidence": int(result.get("confidence", 0)),
                "severity": result.get("severity", "low"),
                "reason": result.get("reason", ""),
            },
        }
    except Exception:
        primary = weather.get("disaster_predictions", [{}])[0]
        return {
            "weather": weather,
            "prediction": {
                "disaster_type": primary.get("disaster_type", "none"),
                "confidence": int(primary.get("confidence", 0)),
                "severity": primary.get("severity", "low"),
                "reason": primary.get("reason", "Weather-based heuristic prediction."),
            },
        }
