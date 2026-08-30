from __future__ import annotations

import os
from typing import Any

from google import genai
from google.genai import types

from backend.config import GEMINI_API_KEY, GEMINI_MODEL


class AIAdapterError(Exception):
    pass


class AIAdapter:
    def __init__(self) -> None:
        self._client = None
        self._model = GEMINI_MODEL
        if GEMINI_API_KEY:
            try:
                self._client = genai.Client(api_key=GEMINI_API_KEY)
            except Exception as exc:  # pragma: no cover - optional dependency
                raise AIAdapterError(f"Failed to init Gemini client: {exc}") from exc

    @property
    def available(self) -> bool:
        return self._client is not None

    def _generate(self, prompt: str, response_schema: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self._client:
            raise AIAdapterError("Gemini client not configured")

        config = None
        if response_schema:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
            )
        resp = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=config,
        )
        text = (resp.text or "").strip()
        if not text:
            raise AIAdapterError("Empty response from Gemini")
        return text

    def analyze_report(self, raw_text: str, source_type: str) -> dict[str, Any]:
        prompt = (
            "Extract structured disaster report fields from the text below.\n"
            "Return JSON with keys: event_type, severity (1-5), people_affected, people_trapped, "
            "vulnerable_population, location_name, lat, lng, evidence (list of strings), summary.\n"
            "If a value is unknown, use 0 or empty string. Do not invent coordinates.\n"
            f"source_type={source_type}\n"
            f"text={raw_text}"
        )
        schema = {
            "type": "object",
            "properties": {
                "event_type": {"type": "string"},
                "severity": {"type": "integer"},
                "people_affected": {"type": "integer"},
                "people_trapped": {"type": "integer"},
                "vulnerable_population": {"type": "integer"},
                "location_name": {"type": "string"},
                "lat": {"type": "number"},
                "lng": {"type": "number"},
                "evidence": {"type": "array", "items": {"type": "string"}},
                "summary": {"type": "string"},
            },
            "required": ["event_type", "severity", "people_affected", "people_trapped", "vulnerable_population", "location_name", "evidence", "summary"],
        }
        try:
            raw = self._generate(prompt, response_schema=schema)
            import json
            data = json.loads(raw)
            if not isinstance(data, dict):
                raise AIAdapterError("Invalid JSON structure")
            return data
        except Exception as exc:
            raise AIAdapterError(f"analyze_report failed: {exc}") from exc

    def verify_reports(self, reports: list[dict[str, Any]]) -> dict[str, Any]:
        prompt = (
            "Given these disaster reports, identify contradictions and corroboration.\n"
            "Return JSON with keys: contradictions (list of strings), corroboration (list of strings), "
            "overall_confidence_note (string).\n"
            f"reports={reports}"
        )
        schema = {
            "type": "object",
            "properties": {
                "contradictions": {"type": "array", "items": {"type": "string"}},
                "corroboration": {"type": "array", "items": {"type": "string"}},
                "overall_confidence_note": {"type": "string"},
            },
            "required": ["contradictions", "corroboration", "overall_confidence_note"],
        }
        try:
            raw = self._generate(prompt, response_schema=schema)
            import json
            data = json.loads(raw)
            if not isinstance(data, dict):
                raise AIAdapterError("Invalid JSON structure")
            return data
        except Exception as exc:
            raise AIAdapterError(f"verify_reports failed: {exc}") from exc

    def summarize_situation(self, incidents: list[dict[str, Any]], areas: list[dict[str, Any]]) -> str:
        prompt = (
            "Summarize the disaster situation for an emergency operations center.\n"
            "Be concise. Highlight top priorities and information voids.\n"
            f"incidents={incidents}\n"
            f"areas={areas}"
        )
        try:
            resp = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
            )
            return (resp.text or "").strip()
        except Exception as exc:
            raise AIAdapterError(f"summarize_situation failed: {exc}") from exc


_adapter: AIAdapter | None = None


def get_adapter() -> AIAdapter:
    global _adapter
    if _adapter is None:
        _adapter = AIAdapter()
    return _adapter
