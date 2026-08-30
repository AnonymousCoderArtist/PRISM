from enum import Enum as PyEnum

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.database import Base


class EvidenceType(str, PyEnum):
    supports = "supports"
    contradicts = "contradicts"
    neutral = "neutral"


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False, index=True)
    source_type = Column(String, nullable=False)
    source_id = Column(String, nullable=True)
    confidence = Column(Integer, nullable=False, default=0)
    evidence_type = Column(SQLEnum(EvidenceType), nullable=False, default=EvidenceType.supports)
    timestamp = Column(DateTime, nullable=False, index=True)
    data = Column("metadata", Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    incident = relationship("Incident", back_populates="evidences")
