from enum import Enum as PyEnum

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.database import Base


class IncidentStatus(str, PyEnum):
    active = "active"
    contained = "contained"
    resolved = "resolved"
    monitoring = "monitoring"


class IncidentSeverity(str, PyEnum):
    low = "low"
    moderate = "moderate"
    high = "high"
    severe = "severe"
    critical = "critical"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    event_type = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_id = Column(String, ForeignKey("areas.id"), nullable=True, index=True)
    severity = Column(SQLEnum(IncidentSeverity), nullable=False, default=IncidentSeverity.moderate, index=True)
    people_affected = Column(Integer, nullable=False, default=0)
    people_trapped = Column(Integer, nullable=False, default=0)
    vulnerable_population = Column(Integer, nullable=False, default=0)
    confidence = Column(Integer, nullable=False, default=0)
    priority = Column(Integer, nullable=False, default=0)
    status = Column(SQLEnum(IncidentStatus), nullable=False, default=IncidentStatus.active, index=True)
    created_at = Column(DateTime, nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    area = relationship("Area", back_populates="incidents")
    evidences = relationship("Evidence", back_populates="incident")
