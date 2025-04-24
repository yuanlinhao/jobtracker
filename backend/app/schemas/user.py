from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserSignup(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    created_at: datetime
    is_admin: bool


    class Config:
        from_attributes = True

class UserInDB(UserOut):
    hashed_password: str
    