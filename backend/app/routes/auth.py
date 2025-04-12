from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.core.auth import get_current_user
from datetime import timedelta
from app.schemas.user import UserSignup, UserLogin, UserOut, UserInDB

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
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(user_in.password)
    new_user = User(email=user_in.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"email": new_user.email, "id": new_user.id}

@router.post("/login")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
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
    return {"access_token": token, "token_type": "bearer"}

@router.post("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user