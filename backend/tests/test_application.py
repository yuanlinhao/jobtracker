import pytest
from uuid import uuid4
from app.main import app
from app.models.user import User
from app.core.auth import get_current_user
from app.database import SessionLocal
from app.core.security import hash_password
from uuid import UUID

FAKE_USER_ID = UUID("123e4567-e89b-12d3-a456-426614174000")

@pytest.fixture(scope="module", autouse=True)
def override_auth():
    def fake_get_current_user():
        return User(
            id=FAKE_USER_ID,
            email="fakeuser@example.com",
            hashed_password="fakehashed",
            is_admin=True
        )
    app.dependency_overrides[get_current_user] = fake_get_current_user
    yield
    app.dependency_overrides.clear()



# ---------- POST /applications/ ---------- (Robust Worst-Case BVA)
@pytest.mark.parametrize("payload, expected_status", [
    # Valid case
    ({"company": "OpenAI", "position": "Engineer", "status": "wishlist"}, 201),
    # Boundary cases
    ({"company": "", "position": "Engineer", "status": "wishlist"}, 422),  # Empty company
    ({"company": "OpenAI", "position": "", "status": "wishlist"}, 422),    # Empty position
    ({"company": "OpenAI", "position": "Engineer", "status": ""}, 422),    # Empty status
    ({"company": "O" * 256, "position": "Engineer", "status": "wishlist"}, 422),  # Too long company
    ({"company": "OpenAI", "position": "E" * 256, "status": "wishlist"}, 422),    # Too long position
    # Robust Invalid
    ({}, 422),  # Missing all fields
    ({"company": "OpenAI", "position": "Engineer", "status": "invalid_status"}, 422),
])
def test_create_application_bva(client, payload, expected_status):
    response = client.post("/applications/", json=payload)
    assert response.status_code == expected_status

# ---------- GET /applications/{id} ---------- (ECP)
def test_get_application_by_id_ecp(client):
    # Create application first
    create_res = client.post("/applications/", json={"company": "TestCo", "position": "Dev", "status": "wishlist"})
    assert create_res.status_code == 201
    app_id = create_res.json()["id"]

    # Valid fetch
    get_res = client.get(f"/applications/{app_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == app_id

    # Invalid ID
    invalid_res = client.get(f"/applications/{uuid4()}")
    assert invalid_res.status_code == 404

# ---------- PATCH /applications/{id} ---------- (Robust Worst-Case BVA)
@pytest.mark.parametrize("update_data, expected_status", [
    # Valid update
    ({"company": "NewCompany"}, 200),
    # Boundary tests
    ({"company": ""}, 422),  # Empty company
    ({"company": "N" * 256}, 422),  # Too long
    # Invalid tag logic (simulate structure)
    ({"tags": [{"tag_id": str(uuid4()), "field": "company"}]}, 400),  # Invalid tag ID
])
def test_update_application_bva(client, update_data, expected_status):
    create_res = client.post("/applications/", json={"company": "PatchTest", "position": "QA", "status": "wishlist"})
    assert create_res.status_code == 201
    app_id = create_res.json()["id"]

    patch_res = client.patch(f"/applications/{app_id}", json=update_data)
    assert patch_res.status_code == expected_status

# ---------- DELETE /applications/{id} ---------- (ECP)
def test_delete_application_ecp(client):
    # Create app
    res = client.post("/applications/", json={"company": "DeleteCo", "position": "QA", "status": "wishlist"})
    assert res.status_code == 201
    app_id = res.json()["id"]

    # Valid delete
    del_res = client.delete(f"/applications/{app_id}")
    assert del_res.status_code == 204

    # Already deleted
    del_again_res = client.delete(f"/applications/{app_id}")
    assert del_again_res.status_code == 204  # Safe re-delete behavior assumed

    # Non-existent
    non_exist_res = client.delete(f"/applications/{uuid4()}")
    assert non_exist_res.status_code == 404

# ---------- PATCH /applications/{id}/restore ---------- (ECP)
def test_restore_application_ecp(client):
    res = client.post("/applications/", json={"company": "RestoreCo", "position": "QA", "status": "wishlist"})
    assert res.status_code == 201
    app_id = res.json()["id"]

    # Soft delete
    del_res = client.delete(f"/applications/{app_id}")
    assert del_res.status_code == 204

    # Valid restore
    restore_res = client.patch(f"/applications/{app_id}/restore")
    assert restore_res.status_code == 200

    # Already restored
    restore_again = client.patch(f"/applications/{app_id}/restore")
    assert restore_again.status_code == 400

# ---------- DELETE /applications/{id}/permanent ---------- (ECP)
def test_permanent_delete_application_ecp(client):
    res = client.post("/applications/", json={"company": "PermDelCo", "position": "QA", "status": "wishlist"})
    assert res.status_code == 201
    app_id = res.json()["id"]

    # Not deleted yet - permanent delete should fail
    perm_fail = client.delete(f"/applications/{app_id}/permanent")
    assert perm_fail.status_code == 400

    # Soft delete first
    client.delete(f"/applications/{app_id}")

    # Now valid permanent delete
    perm_success = client.delete(f"/applications/{app_id}/permanent")
    assert perm_success.status_code == 204

    # Non-existent
    non_exist_perm = client.delete(f"/applications/{uuid4()}/permanent")
    assert non_exist_perm.status_code == 404

# ---------- POST /tags/ ---------- (Robust Worst-Case BVA)
@pytest.mark.parametrize("payload, expected_status", [
    ({"name": "Tech"}, 201),  # Valid case
    ({"name": ""}, 422),      # Empty name
    ({"name": "T" * 256}, 422),  # Too long name (assuming max length < 256)
    ({}, 422),                # Missing field
])
def test_create_tag_bva(client, payload, expected_status):
    res = client.post("/tags/", json=payload)
    assert res.status_code == expected_status

# ---------- GET /tags/ ---------- (ECP)
def test_get_tags_ecp(client):
    client.post("/tags/", json={"name": "Design"})
    res = client.get("/tags/")
    assert res.status_code == 200
    tags = res.json()
    assert isinstance(tags, list)
    assert any(tag["name"] == "Design" for tag in tags)


# ---------- DELETE /tags/{id} ---------- (ECP)
def test_delete_tag_ecp(client):
    create_res = client.post("/tags/", json={"name": "ToDelete"})
    assert create_res.status_code == 201
    tag_id = create_res.json()["id"]

    del_res = client.delete(f"/tags/{tag_id}")
    assert del_res.status_code == 204

    # Verify deletion
    get_res = client.get("/tags/")
    assert all(tag["id"] != tag_id for tag in get_res.json())



# ----------------- ADMIN + SECRET ADMIN TOOLS TESTS -----------------

# --- GET /admin/users ---
def test_admin_get_all_users(client):
    app.dependency_overrides[get_current_user] = lambda: User(
        id=FAKE_USER_ID, email="admin@example.com", hashed_password="fakehashed", is_admin=True
    )

    res = client.get("/admin/users")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    app.dependency_overrides.clear()

# --- DELETE /admin/users/{user_id} ---
def test_admin_delete_user(client):
    app.dependency_overrides[get_current_user] = lambda: User(
        id=FAKE_USER_ID, email="admin@example.com", hashed_password="fakehashed", is_admin=True
    )

    db = SessionLocal()
    temp_user = User(id=uuid4(), email="temp@example.com", hashed_password="temp", is_admin=False)
    db.add(temp_user)
    db.commit()
    db.refresh(temp_user)
    db.close()

    del_res = client.delete(f"/admin/users/{temp_user.id}")
    assert del_res.status_code == 204

    # Admin can't delete themselves
    res_self = client.delete(f"/admin/users/{FAKE_USER_ID}")
    assert res_self.status_code == 400

    app.dependency_overrides.clear()

# --- POST /admin-tools/promote/{user_id} ---
def test_secret_promote_user(client):
    # Create non-admin user
    db = SessionLocal()
    normal_user = User(id=uuid4(), email="normal@example.com", hashed_password="temp", is_admin=False)
    db.add(normal_user)
    db.commit()
    db.refresh(normal_user)
    db.close()

    app.dependency_overrides[get_current_user] = lambda: User(
        id=FAKE_USER_ID, email="admin@example.com", hashed_password="fakehashed", is_admin=True
    )

    promote_res = client.post(f"/admin-tools/promote/{normal_user.id}", json={"secret": "bomboclat"})
    assert promote_res.status_code == 200
    assert "promoted to admin" in promote_res.json()["message"]

    # Wrong Passcode
    fail_res = client.post(f"/admin-tools/promote/{normal_user.id}", json={"secret": "wrong"})
    assert fail_res.status_code == 403

    app.dependency_overrides.clear()

# --- POST /admin-tools/demote/{user_id} ---
def test_secret_demote_user(client):
    # Create admin user to demote
    db = SessionLocal()
    admin_user = User(id=uuid4(), email="demote@example.com", hashed_password="temp", is_admin=True)
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    db.close()

    app.dependency_overrides[get_current_user] = lambda: User(
        id=FAKE_USER_ID, email="admin@example.com", hashed_password="fakehashed", is_admin=True
    )

    demote_res = client.post(f"/admin-tools/demote/{admin_user.id}", json={"secret": "bomboclat"})
    assert demote_res.status_code == 200
    assert "demoted to regular user" in demote_res.json()["message"]

    # Can't demote myself
    fail_self = client.post(f"/admin-tools/demote/{FAKE_USER_ID}", json={"secret": "bomboclat"})
    assert fail_self.status_code == 400

    app.dependency_overrides.clear()
