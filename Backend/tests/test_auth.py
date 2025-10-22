import pytest
from app import models


def test_register_success(test_app):
    response = test_app.post("/auth/register", json={
        "username": "testuser",
        "password": "testpass",
        "email": "test@example.com"
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
    # Register and login
    test_app.post("/auth/register", json={
        "username": "logoutuser",
        "password": "logoutpass",
        "email": "logout@example.com"
    })
    login_response = test_app.post("/auth/login", json={
        "username": "logoutuser",
        "password": "logoutpass"
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
    # Register and login
    test_app.post("/auth/register", json={
        "username": "refreshuser",
        "password": "refreshpass",
        "email": "refresh@example.com"
    })
    login_response = test_app.post("/auth/login", json={
        "username": "refreshuser",
        "password": "refreshpass"
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
