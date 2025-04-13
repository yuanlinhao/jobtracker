from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
import logging
from app.database import SessionLocal
from app.models.user import User
from app.core.auth import get_current_user

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s")

router = APIRouter(prefix="/admin-tools", tags=["Admin Tools"])

SECRET_CODE = "bomboclat"

class SecretCodeInput(BaseModel):
    secret: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_secret_code(secret_input: SecretCodeInput):
    if secret_input.secret != SECRET_CODE:
        logger.warning("Attempt to use admin-tools with invalid secret.")
        raise HTTPException(status_code=403, detail="Invalid secret code")

@router.post("/promote/{user_id}", status_code=200)
def promote_user(
    user_id: UUID,
    secret_input: SecretCodeInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_secret_code(secret_input)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"Admin tool: Tried to promote nonexistent user {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    logger.info(f"User {user.email} (id: {user.id}) was promoted to admin via secret tool by {current_user.email}")
    return {"message": f"User {user.email} promoted to admin."}

@router.post("/demote/{user_id}", status_code=200)
def demote_user(
    user_id: UUID,
    secret_input: SecretCodeInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_secret_code(secret_input)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"Admin tool: Tried to demote nonexistent user {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot modify your own admin status.")
    user.is_admin = False
    db.commit()
    logger.info(f"User {user.email} (id: {user.id}) was demoted from admin via secret tool by {current_user.email}")
    return {"message": f"User {user.email} demoted to regular user."}
