from fastapi import FastAPI
from app.database import engine, Base
from app.models.user import User
from app.models.application import Application
from app.models.tag import Tag
from app.routes import applications
from app.routes import auth
from app.routes import tags

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router, prefix="/auth")
app.include_router(applications.router, prefix="/applications", tags=["Applications"])
app.include_router(tags.router, prefix="/tags", tags=["Tags"])

@app.get("/")
async def root():
    return {"message": "Hello World"}