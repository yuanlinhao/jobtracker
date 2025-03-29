from fastapi import FastAPI
from app.database import engine, Base
from app.models.user import User
from app.models.application import Application
from app.models.tag import Tag

from app.routes import auth

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router, prefix="/auth")

@app.get("/")
async def root():
    return {"message": "Hello World"}