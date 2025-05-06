from fastapi import APIRouter, HTTPException, Depends, Response, Request, status
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
import logging

from app.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserSignup, UserLogin, UserOut, UserInDB
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup")
def signup(user_in: UserSignup, response: Response, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        logger.warning(f"Signup attempt with existing email: {user_in.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(user_in.password)
    new_user = User(email=user_in.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none"
    )

    logger.info(f"New user signed up with email:{new_user.email} (id:{new_user.id})")
    return {"message": "Signup successful"}

@router.post("/login")
def login(user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: {user_in.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_in_db = UserInDB.from_orm(user)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "is_admin": user.is_admin},
        expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    logger.info(f"User {user.email} (id: {user.id}) logged in successfully")
    return {"message": "Login successful"}

@router.post("/logout")
def logout(response: Response):
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=0
    )
    logger.info("User logged out and token cleared")
    return {"message": "Logged out"}

@router.get("/me", response_model=UserOut)
def get_me(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    logger.info(f"User {user.email} verified via cookie")
    return user
