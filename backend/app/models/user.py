from sqlalchemy import Column, String, DateTime
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_admin = Column(String, default="false", nullable=False)

    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    tags = relationship(
        "Tag",
        back_populates="user",
        cascade="all, delete-orphan"
    )
