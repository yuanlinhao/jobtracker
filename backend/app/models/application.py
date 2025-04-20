from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
from app.database import Base
from app.models.application_tag import ApplicationTag
from app.models.mixins import TimestampMixin

def utcnow():
    return datetime.now(timezone.utc)

class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    status = Column(String, default="wishlist", nullable=False)
    location = Column(String, nullable=True)
    url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="applications")

    application_tags = relationship(
        "ApplicationTag",
        cascade="all, delete-orphan",
        back_populates="application"
    )
