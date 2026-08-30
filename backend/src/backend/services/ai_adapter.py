from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types
import httpx

from backend.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_MODEL_FALLBACKS,
    AI_PROVIDER,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL,
)


class AIAdapterError(Exception):
    pass


class AIAdapter:
    def __init__(self) -> None:
        self._provider = AI_PROVIDER
        self._gemini_client = None
        self._gemini_model = GEMINI_MODEL
        self._gemini_models = [GEMINI_MODEL] + GEMINI_MODEL_FALLBACKS
        self._openai_model = OPENAI_MODEL
        self._openai_base_url = OPENAI_BASE_URL.rstrip("/")
        self._http = httpx.Client(timeout=30.0)

        if self._provider == "openai":
            if not OPENAI_API_KEY:
                raise AIAdapterError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
        else:
            # Default to Gemini if GEMINI_API_KEY is present and provider not explicitly set to openai
            if GEMINI_API_KEY:
                try:
                    self._gemini_client = genai.Client(api_key=GEMINI_API_KEY)
                    self._provider = "gemini"
                except Exception as exc:
                    raise AIAdapterError(f"Failed to init Gemini client: {exc}") from exc

    @property
    def available(self) -> bool:
        if self._provider == "openai":
            return bool(OPENAI_API_KEY)
        return self._gemini_client is not None

    def _try_gemini_models(self, prompt: str, config=None) -> str | None:
        last_error = None
        for model_name in self._gemini_models:
            try:
                resp = self._gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                text = (resp.text or "").strip()
                if text:
                    return text
            except Exception as exc:
                last_error = exc
                continue
        return None

    def _call_gemini(self, prompt: str, response_schema: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self._gemini_client:
            raise AIAdapterError("Gemini client not configured")

        config = None
        if response_schema:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
            )
        
        text = self._try_gemini_models(prompt, config=config)
        if text is None:
            raise AIAdapterError("All Gemini models failed")
        if not text:
            raise AIAdapterError("Empty response from Gemini")
        return json.loads(text)

    def _call_openai(self, prompt: str, response_schema: dict[str, Any] | None = None) -> dict[str, Any]:
        if not OPENAI_API_KEY:
            raise AIAdapterError("OPENAI_API_KEY is not configured")

        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        messages = [{"role": "user", "content": prompt}]
        payload: dict[str, Any] = {
            "model": self._openai_model,
            "messages": messages,
        }
        if response_schema:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": {"name": "output", "schema": response_schema},
            }

        url = f"{self._openai_base_url}/chat/completions"
        resp = self._http.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        text = data["choices"][0]["message"]["content"].strip()
        if not text:
            raise AIAdapterError("Empty response from OpenAI-compatible provider")
        return json.loads(text)

    def _generate(self, prompt: str, response_schema: dict[str, Any] | None = None) -> dict[str, Any]:
        if self._provider == "openai":
            return self._call_openai(prompt, response_schema=response_schema)
        if self._provider == "gemini":
            return self._call_gemini(prompt, response_schema=response_schema)
        raise AIAdapterError("No AI provider configured")

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
            data = self._generate(prompt, response_schema=schema)
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
            data = self._generate(prompt, response_schema=schema)
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
            if self._provider == "gemini" and self._gemini_client:
                text = self._try_gemini_models(prompt)
                if text:
                    return text

            if self._provider == "openai":
                headers = {
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": self._openai_model,
                    "messages": [{"role": "user", "content": prompt}],
                }
                url = f"{self._openai_base_url}/chat/completions"
                resp = self._http.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"].strip()
                if text:
                    return text

            raise AIAdapterError("No AI provider configured for summarization")
        except Exception as exc:
            raise AIAdapterError(f"summarize_situation failed: {exc}") from exc


_adapter: AIAdapter | None = None


def get_adapter() -> AIAdapter:
    global _adapter
    if _adapter is None:
        _adapter = AIAdapter()
    return _adapter
