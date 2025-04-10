from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.models.tag import Tag
from app.models.user import User
from app.database import SessionLocal
from app.schemas.tag import TagCreate, TagOut
from app.core.auth import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=TagOut, status_code=201)
def create_tag(
    tag_in: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag = Tag(name=tag_in.name, user_id=current_user.id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

@router.get("/", response_model=List[TagOut])
def get_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Tag).filter(Tag.user_id == current_user.id).all()

@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tag = db.query(Tag).filter(Tag.id == tag_id, Tag.user_id == current_user.id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    return