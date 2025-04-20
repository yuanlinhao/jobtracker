from pydantic import BaseModel
from uuid import UUID
from app.constants.tag_fields import TaggableField

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class TagOut(TagBase):
    id: UUID

    class Config:
        from_attributes = True

class ApplicationTagIn(BaseModel):
    tag_id: UUID
    field: TaggableField

class ApplicationTagOut(BaseModel):
    id: UUID
    name: str
    field: TaggableField
