import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.dependencies import get_current_user

# --- Client Fixture ---
@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

# --- Auth Override Fixture ---
@pytest.fixture(scope="module", autouse=True)
def override_auth():
    def override_get_current_user():
        return User(id="123e4567-e89b-12d3-a456-426614174000", email="test@example.com", hashed_password="fake", is_admin=False)
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()

# --- Robust Worst-Case BVA for Tag Creation ---
@pytest.mark.parametrize("payload, expected_status", [
    ({"name": "Tech"}, 201),  # Valid case
    ({"name": ""}, 422),  # Empty name
    ({"name": "T" * 256}, 422),  # Too long name
    ({}, 422),  # Missing field
])
def test_create_tag_bva(client, payload, expected_status):
    res = client.post("/tags/", json=payload)
    assert res.status_code == expected_status

# --- ECP for GET /tags/ ---
def test_get_tags_ecp(client):
    # Create a tag
    client.post("/tags/", json={"name": "Design"})
    res = client.get("/tags/")
    assert res.status_code == 200
    tags = res.json()
    assert isinstance(tags, list)
    assert any(tag["name"] == "Design" for tag in tags)

# --- ECP for PATCH /tags/{id} ---
def test_update_tag_ecp(client):
    # Create a tag
    create_res = client.post("/tags/", json={"name": "OldName"})
    tag_id = create_res.json()["id"]
    # Update tag
    patch_res = client.patch(f"/tags/{tag_id}", json={"name": "NewName"})
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "NewName"

# --- ECP for DELETE /tags/{id} ---
def test_delete_tag_ecp(client):
    # Create a tag
    create_res = client.post("/tags/", json={"name": "ToDelete"})
    tag_id = create_res.json()["id"]
    # Delete tag
    del_res = client.delete(f"/tags/{tag_id}")
    assert del_res.status_code == 204
    # Verify deletion
    get_res = client.get("/tags/")
    assert all(tag["id"] != tag_id for tag in get_res.json())
