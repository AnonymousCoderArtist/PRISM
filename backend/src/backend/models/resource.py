from enum import Enum as PyEnum

from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Enum as SQLEnum
from sqlalchemy.sql import func

from backend.database import Base


class ResourceStatus(str, PyEnum):
    available = "available"
    deployed = "deployed"
    unavailable = "unavailable"
    maintenance = "maintenance"


class ResourceType(str, PyEnum):
    boat = "boat"
    ambulance = "ambulance"
    helicopter = "helicopter"
    rescue_team = "rescue_team"
    excavator = "excavator"
    medical_team = "medical_team"
    water_tanker = "water_tanker"
    supply_vehicle = "supply_vehicle"


class Resource(Base):
    __tablename__ = "resources"

    id = Column(String, primary_key=True)
    type = Column(SQLEnum(ResourceType), nullable=False, index=True)
    status = Column(SQLEnum(ResourceStatus), nullable=False, default=ResourceStatus.available, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False, default=1)
    availability = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ResourceAssignment(Base):
    __tablename__ = "resource_assignments"

    id = Column(String, primary_key=True)
    resource_id = Column(String, nullable=False, index=True)
    incident_id = Column(String, nullable=False, index=True)
    eta_minutes = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
