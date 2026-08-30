from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.sql import func

from backend.database import Base


class ActivityEvent(Base):
    __tablename__ = "activity_log"

    id = Column(String, primary_key=True)
    event_type = Column(String, nullable=False, index=True)
    payload = Column(Text, nullable=False)
    tick = Column(Integer, nullable=False, default=0, index=True)
    created_at = Column(DateTime, server_default=func.now())
