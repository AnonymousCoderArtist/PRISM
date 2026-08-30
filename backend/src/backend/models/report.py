from enum import Enum as PyEnum

from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Enum as SQLEnum
from sqlalchemy.sql import func

from backend.database import Base


class SourceType(str, PyEnum):
    citizen = "citizen"
    field_officer = "field_officer"
    drone = "drone"
    satellite = "satellite"
    social_media = "social_media"
    news = "news"
    voice = "voice"
    photo = "photo"
    video = "video"


class MediaType(str, PyEnum):
    text = "text"
    photo = "photo"
    video = "video"
    audio = "audio"
    voice = "voice"
    mixed = "mixed"


class ReportStatus(str, PyEnum):
    pending = "pending"
    verified = "verified"
    disputed = "disputed"
    merged = "merged"


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    source_type = Column(SQLEnum(SourceType), nullable=False, index=True)
    source_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    media_type = Column(SQLEnum(MediaType), nullable=False)
    claimed_severity = Column(Integer, nullable=False)
    people_affected = Column(Integer, nullable=False, default=0)
    people_trapped = Column(Integer, nullable=False, default=0)
    vulnerable_population = Column(Integer, nullable=False, default=0)
    event_type = Column(String, nullable=False)
    evidence_type = Column(String, nullable=False)
    confidence = Column(Integer, nullable=False, default=0)
    status = Column(SQLEnum(ReportStatus), nullable=False, default=ReportStatus.pending)
    incident_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
