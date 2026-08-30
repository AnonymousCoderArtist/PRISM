from enum import Enum as PyEnum

from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.database import Base


class AreaStatus(str, PyEnum):
    normal = "normal"
    at_risk = "at_risk"
    affected = "affected"
    severe = "severe"
    information_void = "information_void"


class Area(Base):
    __tablename__ = "areas"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    population = Column(Integer, nullable=False, default=0)
    vulnerable_population = Column(Integer, nullable=False, default=0)
    status = Column(SQLEnum(AreaStatus), nullable=False, default=AreaStatus.normal, index=True)
    risk_score = Column(Integer, nullable=False, default=0)
    priority = Column(Integer, nullable=False, default=0)
    confidence = Column(Integer, nullable=False, default=0)
    information_void_score = Column(Integer, nullable=False, default=0)
    last_verified = Column(DateTime, nullable=True)
    report_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    incidents = relationship("Incident", back_populates="area")
