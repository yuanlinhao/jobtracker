from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import logging
from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.auth import get_current_user
from datetime import timedelta
from app.schemas.user import UserSignup, UserLogin, UserOut, UserInDB

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s")

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup")
def signup(user_in: UserSignup, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        logger.warning(f"Signup attempt with existing email: {user_in.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(user_in.password)
    new_user = User(email=user_in.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"New user signed up with email:{new_user.email} (id:{new_user.id})")
    return {"email": new_user.email, "id": new_user.id}

@router.post("/login")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: {user_in.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_in_db = UserInDB.from_orm(user)

    access_token_expires = timedelta(minutes=30)
    token = create_access_token(
        data={
              "sub": str(user.id), 
              "email": user_in_db.email, 
              "is_admin": user.is_admin
              },
        expires_delta=access_token_expires
    )
    logger.info(f"User {user.email} (id: {user.id}) logged in successfully")
    return {"access_token": token, "token_type": "bearer"}

@router.post("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    logger.info(f"User {current_user.email} requested their profile")
    return current_user