from fastapi import APIRouter
from fastapi.responses import Response
from fastapi.websockets import WebSocket

from backend.services.simulation import engine, manager
from backend.schemas.simulation import (
    SimulationState,
    SimulationStartRequest,
    SimulationPauseRequest,
    SimulationResetRequest,
)

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.get("/status", response_model=SimulationState)
def simulation_status() -> SimulationState:
    from backend.services.ai_adapter import get_adapter
    state = engine.get_state()
    state["ai_live"] = get_adapter().live
    state["ai_stats"] = get_adapter().stats
    return SimulationState(**state)


@router.post("/start")
async def simulation_start(req: SimulationStartRequest) -> Response:
    from backend.services.ai_adapter import get_adapter
    try:
        get_adapter().enable()
    except Exception:
        # if no API key is configured, demo mode continues
        pass
    await engine.start(req.speed_ms)
    import json
    return Response(content=json.dumps({"status": "started", "tick": engine.tick, "ai_live": get_adapter().live}), media_type="application/json")


@router.post("/pause")
async def simulation_pause(req: SimulationPauseRequest) -> Response:
    await engine.pause()
    import json
    return Response(content=json.dumps({"status": "paused", "tick": engine.tick}), media_type="application/json")


@router.post("/reset")
async def simulation_reset(req: SimulationResetRequest) -> Response:
    await engine.reset()
    import json
    return Response(content=json.dumps({"status": "reset", "tick": 0}), media_type="application/json")


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        manager.disconnect(websocket)
