from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base
from app.models.application_tag import ApplicationTag
from app.models.mixins import TimestampMixin

class Tag(Base, TimestampMixin):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tags")

    application_tags = relationship(
        "ApplicationTag",
        back_populates="tag",
        cascade="all, delete-orphan"
    )
