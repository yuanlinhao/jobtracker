from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base
from app.models.application_tag import ApplicationTag
from app.models.mixins import TimestampMixin

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="applications")

    application_tags = relationship(
        "ApplicationTag",
        cascade="all, delete-orphan",
        back_populates="application"
    )
