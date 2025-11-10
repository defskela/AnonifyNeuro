import pytest

from app import models


def test_register_success(test_app):
    response = test_app.post("/auth/register", json={
        "username": "newuser",
        "password": "testpass",
        "email": "new@example.com"
    })
    assert response.status_code == 201
    data = response.json()
    assert "message" in data
    assert "jwt_token" in data


def test_register_duplicate_username(test_app):
    # First register
    test_app.post("/auth/register", json={
        "username": "testuser2",
        "password": "testpass",
        "email": "test2@example.com"
    })
    # Second register with same username
    response = test_app.post("/auth/register", json={
        "username": "testuser2",
        "password": "testpass",
        "email": "test3@example.com"
    })
    assert response.status_code == 400
    assert "Username already registered" in response.json()["detail"]


def test_register_duplicate_email(test_app):
    # First register
    test_app.post("/auth/register", json={
        "username": "testuser3",
        "password": "testpass",
        "email": "test4@example.com"
    })
    # Second register with same email
    response = test_app.post("/auth/register", json={
        "username": "testuser4",
        "password": "testpass",
        "email": "test4@example.com"
    })
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


def test_login_success(test_app):
    # Register first
    test_app.post("/auth/register", json={
        "username": "loginuser",
        "password": "loginpass",
        "email": "login@example.com"
    })
    # Login
    response = test_app.post("/auth/login", json={
        "username": "loginuser",
        "password": "loginpass"
    })
    assert response.status_code == 200
    data = response.json()
    assert "jwt_token" in data


def test_login_invalid_credentials(test_app):
    response = test_app.post("/auth/login", json={
        "username": "nonexistent",
        "password": "wrongpass"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


def test_logout_success(test_app):
    # Login with testuser
    login_response = test_app.post("/auth/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    token = login_response.json()["jwt_token"]

    # Logout
    response = test_app.post("/auth/logout", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    assert "Logged out successfully" in response.json()["message"]


def test_logout_no_token(test_app):
    response = test_app.post("/auth/logout")
    assert response.status_code == 403


def test_refresh_success(test_app):
    # Login with testuser
    login_response = test_app.post("/auth/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    token = login_response.json()["jwt_token"]

    # Refresh
    response = test_app.post("/auth/refresh", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert "jwt_token" in data


def test_refresh_invalid_token(test_app):
    response = test_app.post("/auth/refresh", headers={
        "Authorization": "Bearer invalidtoken"
    })
    assert response.status_code == 401


def test_update_profile_success(test_app):
    register_response = test_app.post("/auth/register", json={
        "username": "profileuser",
        "password": "initialpass",
        "email": "profile@example.com"
    })
    register_data = register_response.json()
    token = register_data["jwt_token"]

    update_response = test_app.put(
        "/auth/profile",
        json={"username": "profileuser_updated", "password": "newpass"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert update_response.status_code == 200
    update_data = update_response.json()
    assert update_data["message"] == "Profile updated successfully"
    assert "jwt_token" in update_data

    login_response = test_app.post("/auth/login", json={
        "username": "profileuser_updated",
        "password": "newpass"
    })
    assert login_response.status_code == 200
    assert "jwt_token" in login_response.json()


def test_update_profile_username_conflict(test_app):
    response_user1 = test_app.post("/auth/register", json={
        "username": "conflict_source",
        "password": "pass1",
        "email": "conflict1@example.com"
    })
    token_user1 = response_user1.json()["jwt_token"]

    test_app.post("/auth/register", json={
        "username": "conflict_target",
        "password": "pass2",
        "email": "conflict2@example.com"
    })

    update_response = test_app.put(
        "/auth/profile",
        json={"username": "conflict_target"},
        headers={"Authorization": f"Bearer {token_user1}"}
    )

    assert update_response.status_code == 400
    assert "Username already registered" in update_response.json()["detail"]


def test_update_profile_no_fields(test_app):
    register_response = test_app.post("/auth/register", json={
        "username": "nofields",
        "password": "nopass",
        "email": "nofields@example.com"
    })
    token = register_response.json()["jwt_token"]

    response = test_app.put(
        "/auth/profile",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "No fields to update"
