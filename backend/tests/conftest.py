import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.core.security import hash_password
from app.database import SessionLocal

FAKE_USER_ID = "123e4567-e89b-12d3-a456-426614174000"

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module", autouse=True)
def setup_fake_user():
    db = SessionLocal()
    fake_user = db.query(User).filter(User.id == FAKE_USER_ID).first()
    if not fake_user:
        fake_user = User(
            id=FAKE_USER_ID,
            email="fakeuser@example.com",
            hashed_password=hash_password("fakepassword"),
            is_admin=False
        )
        db.add(fake_user)
        db.commit()
    db.close()
