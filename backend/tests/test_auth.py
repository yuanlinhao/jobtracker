import pytest

# ----- Robust Worst Case BVA for Signup -----

@pytest.mark.parametrize("email,password,expected_status", [
    ("validuser@example.com", "validpass123", 200),  # Valid case
    ("", "validpass123", 422),                      # Empty email
    ("invalid-email", "validpass123", 422),         # Invalid email format
    ("a" * 320 + "@test.com", "validpass123", 422), # Excessively long email
    ("validuser2@example.com", "", 422),            # Empty password
    ("validuser3@example.com", "short", 400),       # Too short password
    ("validuser4@example.com", "12345678", 200),    # Minimum valid password
    ("validuser5@example.com", "123456789", 200),   # Just above minimum
])
def test_signup_bva(client, email, password, expected_status):
    response = client.post("/auth/signup", json={"email": email, "password": password})
    assert response.status_code == expected_status

# ----- Signup Valid Case for Dependency -----

def test_signup_valid(client):
    response = client.post("/auth/signup", json={"email": "testuser@example.com", "password": "securepass"})
    assert response.status_code == 200
    assert response.json()["message"] == "Signup successful"

# ----- Duplicate Email -----

def test_signup_duplicate_email(client):
    client.post("/auth/signup", json={"email": "testuser@example.com", "password": "securepass"})
    response = client.post("/auth/signup", json={"email": "testuser@example.com", "password": "securepass"})
    assert response.status_code == 400
    assert "Email already registered" in response.text

# ----- Login ECP -----

def test_login_ecp_valid(client):
    client.post("/auth/signup", json={"email": "validuser@example.com", "password": "validpass123"})
    response = client.post("/auth/login", json={"email": "validuser@example.com", "password": "validpass123"})
    assert response.status_code == 200
    assert response.json()["message"] == "Login successful"

# ----- /auth/me -----

def test_me_valid_cookie(client):
    signup_res = client.post("/auth/signup", json={"email": "me@test.com", "password": "mypassword"})
    assert signup_res.status_code == 200
    token = signup_res.cookies.get("access_token")
    client.cookies.set("access_token", token)
    res = client.get("/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "me@test.com"
