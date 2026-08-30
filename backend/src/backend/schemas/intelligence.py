from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    report_id: str


class VerifyRequest(BaseModel):
    report_ids: list[str]


class PriorityRequest(BaseModel):
    incident_id: str


class SilenceRequest(BaseModel):
    area_id: str
