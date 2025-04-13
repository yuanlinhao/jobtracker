from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
import logging

from app.database import SessionLocal
from app.models.user import User
from app.core.auth import get_current_user
from app.schemas.user import UserOut

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s")

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# GET /admin/users - View all users
@router.get("/users", response_model=list[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    logger.info(f"Admin {current_admin.email} fetched all users.")
    users = db.query(User).all()
    return users

@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Admin cannot delete themselves")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    logger.info(f"Admin {current_admin.email} deleted user {user.email} (id: {user.id})")
    return
