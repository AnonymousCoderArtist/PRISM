from pydantic import BaseModel


class SimulationState(BaseModel):
    running: bool
    tick: int
    scenario_phase: str
    elapsed: float


class SimulationStartRequest(BaseModel):
    speed_ms: int | None = None


class SimulationPauseRequest(BaseModel):
    pass


class SimulationResetRequest(BaseModel):
    pass
