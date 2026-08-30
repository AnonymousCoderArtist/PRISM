from __future__ import annotations

import asyncio
import json
import random
import time
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import WebSocket

from backend.models.report import SourceType
from backend.models.activity_log import ActivityEvent


BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEMO_DIR = BASE_DIR / "data" / "demo"


class WebSocketManager:
    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self._connections:
            self._connections.remove(websocket)

    async def broadcast(self, event_type: str, payload: dict[str, Any], tick: int) -> None:
        message = json.dumps({"event": event_type, "payload": payload, "tick": tick})
        for connection in list(self._connections):
            try:
                await connection.send_text(message)
            except Exception:
                self._connections.remove(connection)


manager = WebSocketManager()


class SimulationEngine:
    def __init__(self) -> None:
        self.running = False
        self.tick = 0
        self.start_time: datetime | None = None
        self.elapsed = 0.0
        self.speed_ms = 2000
        self._task: asyncio.Task | None = None
        self._scenario: list[dict[str, Any]] = []

    async def start(self, speed_ms: int | None = None) -> None:
        if self.running:
            return
        if speed_ms is not None:
            self.speed_ms = max(200, min(10000, speed_ms))
        if self.start_time is None:
            self.start_time = datetime.utcnow()
        self.running = True
        self._load_scenario()
        self._task = asyncio.create_task(self._run_loop())

    async def pause(self) -> None:
        self.running = False
        if self._task is not None:
            self._task.cancel()
            self._task = None

    async def reset(self) -> None:
        await self.pause()
        self.tick = 0
        self.start_time = None
        self.elapsed = 0.0
        self._scenario = []

    def _load_scenario(self) -> None:
        path = DEMO_DIR / "scenario.json"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            self._scenario = data.get("phases", [])
        except Exception:
            self._scenario = []

    def _phase_for_tick(self, tick: int) -> str:
        phase = "normal"
        for entry in self._scenario:
            if tick >= entry.get("tick", 0):
                phase = entry.get("name", phase)
        return phase

    def _events_for_tick(self, tick: int) -> list[str]:
        events: list[str] = []
        for entry in self._scenario:
            if tick == entry.get("tick", -1):
                events.extend(entry.get("events", []))
        return events

    async def _run_loop(self) -> None:
        rng = random.Random(42)
        while self.running:
            self.tick += 1
            self.elapsed = (datetime.utcnow() - self.start_time).total_seconds()
            phase = self._phase_for_tick(self.tick)
            events = self._events_for_tick(self.tick)
            for event in events:
                payload: dict[str, Any] = {"tick": self.tick, "phase": phase}
                if event == "REPORT_RECEIVED":
                    payload["report_id"] = f"SIM-R-{self.tick:03d}"
                    payload["source"] = rng.choice(["citizen", "field_officer", "drone", "satellite"])
                    payload["location"] = "Sector-" + rng.choice(["A", "B", "C", "D"])
                elif event == "INCIDENT_UPDATED":
                    payload["incident_id"] = f"INC-{rng.randint(1, 20):03d}"
                    payload["status"] = rng.choice(["active", "monitoring", "contained"])
                elif event == "RESOURCE_ASSIGNED":
                    payload["resource_id"] = f"RES-{rng.randint(1, 10):03d}"
                    payload["incident_id"] = f"INC-{rng.randint(1, 20):03d}"
                    payload["eta_minutes"] = rng.randint(5, 45)
                elif event == "PLAN_GENERATED":
                    payload["plan_id"] = f"PLAN-{self.tick:03d}"
                    payload["assignments"] = rng.randint(1, 4)
                elif event == "INFORMATION_VOID_DETECTED":
                    payload["area_id"] = f"S{rng.randint(1, 20):02d}"
                    payload["void_score"] = rng.randint(60, 95)
                await manager.broadcast(event, payload, self.tick)
            await manager.broadcast("SIMULATION_TICK", {"tick": self.tick, "phase": phase}, self.tick)
            await asyncio.sleep(self.speed_ms / 1000.0)

    def get_state(self) -> dict[str, Any]:
        phase = self._phase_for_tick(self.tick)
        return {
            "running": self.running,
            "tick": self.tick,
            "scenario_phase": phase,
            "elapsed": round(self.elapsed, 2),
        }


engine = SimulationEngine()


def generate_deterministic_id(prefix: str, tick: int, index: int) -> str:
    return f"{prefix}-{tick:03d}-{index:02d}"


def seeded_random(tick: int, index: int) -> random.Random:
    return random.Random(42 + tick * 1000 + index)
