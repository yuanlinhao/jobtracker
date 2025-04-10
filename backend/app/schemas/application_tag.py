from pydantic import BaseModel
from uuid import UUID

class ApplicationTagCreate(BaseModel):
    tag_id: UUID
    field: str

class ApplicationTagOut(BaseModel):
    tag_id: UUID
    field: str

    class Config:
        from_attributes = True