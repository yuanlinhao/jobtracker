from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class ApplicationTag(Base):
    __tablename__ = "application_tags"

    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True)
    field = Column(String, nullable=False)

    application = relationship("Application", back_populates="application_tags")
    tag = relationship("Tag", back_populates="application_tags")