from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: str
    simulation_running: bool
