import asyncio
import json
import math
import random
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from fastapi import WebSocket


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

    async def start(self, speed_ms: int | None = None) -> None:
        if self.running:
            return
        if speed_ms is not None:
            self.speed_ms = max(200, min(10000, speed_ms))
        if self.start_time is None:
            self.start_time = datetime.utcnow()
        self.running = True
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

    async def _run_loop(self) -> None:
        while self.running:
            self.tick += 1
            self.elapsed = (datetime.utcnow() - self.start_time).total_seconds()
            await manager.broadcast("SIMULATION_TICK", {"tick": self.tick}, self.tick)
            await asyncio.sleep(self.speed_ms / 1000.0)

    def get_state(self) -> dict[str, Any]:
        phase = self._phase_for_tick(self.tick)
        return {
            "running": self.running,
            "tick": self.tick,
            "scenario_phase": phase,
            "elapsed": round(self.elapsed, 2),
        }

    def _phase_for_tick(self, tick: int) -> str:
        if tick < 5:
            return "normal"
        if tick < 10:
            return "reports_begin"
        if tick < 15:
            return "incidents_form"
        if tick < 20:
            return "evidence_arrives"
        if tick < 25:
            return "priority_update"
        if tick < 30:
            return "resource_assignment"
        if tick < 35:
            return "sector_silent"
        if tick < 40:
            return "information_void"
        return "verification"


engine = SimulationEngine()


def generate_deterministic_id(prefix: str, tick: int, index: int) -> str:
    return f"{prefix}-{tick:03d}-{index:02d}"


def seeded_random(tick: int, index: int) -> random.Random:
    return random.Random(42 + tick * 1000 + index)
