from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime

from app.schemas.tag import TagOut

class ApplicationTagInput(BaseModel):
    tag_id: UUID
    field: str

class ApplicationCreate(BaseModel):
    company: str = Field(..., min_length=1)
    position: str = Field(..., min_length=1)
    status: str = Field(default="wishlist")
    location: Optional[str]
    url: Optional[HttpUrl]
    notes: Optional[str]
    tags: Optional[List[TagOut]] = []

class ApplicationOut(BaseModel):
    id: UUID
    company: str
    position: str
    status: str
    location: Optional[str]
    url: Optional[HttpUrl]
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tags: Dict[str, List[TagOut]]

    model_config = {
        "from_attributes": True
    }

class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    url: Optional[HttpUrl] = None
    notes: Optional[str] = None
    tags: Optional[List[ApplicationTagInput]] = None

    model_config = {
        "extra": "forbid"
    }
