from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models.user import User
from app.models.application import Application
from app.models.tag import Tag
from app.routes import applications
from app.routes import auth
from app.routes import tags
from app.routes import admin
from app.routes import admin_tools
from app.core.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router, prefix="/auth")
app.include_router(applications.router, prefix="/applications", tags=["Applications"])
app.include_router(tags.router, prefix="/tags", tags=["Tags"])
app.include_router(admin.router)
app.include_router(admin_tools.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}