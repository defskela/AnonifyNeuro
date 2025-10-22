from io import BytesIO

import pytest


def test_redact_document(test_app):
    # Login first
    login_response = test_app.post("/auth/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    token = login_response.json()["jwt_token"]

    # Mock file
    file_content = b"mock pdf content"
    files = {"file": ("test.pdf", BytesIO(file_content), "application/pdf")}

    response = test_app.post("/redact", files=files, headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    assert data["status"] == "success"


def test_get_entities(test_app):
    # Login first
    login_response = test_app.post("/auth/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    token = login_response.json()["jwt_token"]

    response = test_app.get("/entities", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert "entities" in data
    assert "name" in data["entities"]


def test_get_task_log(test_app):
    # Login first
    login_response = test_app.post("/auth/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    token = login_response.json()["jwt_token"]

    # Create a task first by calling redact
    file_content = b"mock pdf content"
    files = {"file": ("test.pdf", BytesIO(file_content), "application/pdf")}
    redact_response = test_app.post("/redact", files=files, headers={
        "Authorization": f"Bearer {token}"
    })
    task_id = redact_response.json()["task_id"]

    # Get log
    response = test_app.get(f"/logs/{task_id}", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "details" in data


def test_get_task_log_not_found(test_app):
    # Login first
    login_response = test_app.post("/auth/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    token = login_response.json()["jwt_token"]

    response = test_app.get("/logs/nonexistent", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 404
    assert "Task not found" in response.json()["detail"]
