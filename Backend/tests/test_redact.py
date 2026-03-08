from io import BytesIO

from app.routers import redact


def _auth_headers(client, username: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    assert response.status_code == 200
    token = response.json()["jwt_token"]
    return {"Authorization": f"Bearer {token}"}


def _mock_redact_dependencies(monkeypatch):
    class DummyStorage:
        def upload_file(self, file_data: bytes, object_name: str, content_type: str = "application/octet-stream"):
            return object_name

        def get_presigned_url(self, object_name: str) -> str:
            return f"http://test.local/{object_name}"

    async def fake_call_ml_service(file_content: bytes, filename: str):
        return redact.DetectionResult(
            success=True,
            detections=[
                redact.BoundingBox(x1=1, y1=1, x2=4, y2=4, confidence=0.98, class_name="license_plate")
            ],
            image_width=8,
            image_height=8
        )

    monkeypatch.setattr(redact, "storage", DummyStorage())
    monkeypatch.setattr(redact, "call_ml_service", fake_call_ml_service)


def _tiny_png_bytes() -> bytes:
    return (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
        b"\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfeA\xe2'\xd5"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def test_redact_document(test_app, monkeypatch):
    _mock_redact_dependencies(monkeypatch)
    headers = _auth_headers(test_app, "testuser", "testpass")

    file_content = _tiny_png_bytes()
    files = {"file": ("test.png", BytesIO(file_content), "image/png")}

    response = test_app.post("/redact", files=files, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    assert data["status"] == "success"
    assert data["detections_count"] == 1


def test_get_entities(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.get("/entities", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "entities" in data
    assert "license_plate" in data["entities"]


def test_get_task_log(test_app, monkeypatch):
    _mock_redact_dependencies(monkeypatch)
    headers = _auth_headers(test_app, "testuser", "testpass")

    file_content = _tiny_png_bytes()
    files = {"file": ("test.png", BytesIO(file_content), "image/png")}
    redact_response = test_app.post("/redact", files=files, headers=headers)
    task_id = redact_response.json()["task_id"]

    response = test_app.get(f"/logs/{task_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "details" in data


def test_get_task_log_not_found(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.get("/logs/nonexistent", headers=headers)
    assert response.status_code == 404
    assert "Task not found" in response.json()["detail"]


def test_get_task_log_forbidden_for_non_owner(test_app, monkeypatch):
    _mock_redact_dependencies(monkeypatch)
    owner_headers = _auth_headers(test_app, "otheruser", "otherpass")
    files = {"file": ("test.png", BytesIO(_tiny_png_bytes()), "image/png")}
    created = test_app.post("/redact", files=files, headers=owner_headers)
    task_id = created.json()["task_id"]

    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.get(f"/logs/{task_id}", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions"


def test_admin_can_read_other_user_task_log(test_app, monkeypatch):
    _mock_redact_dependencies(monkeypatch)
    owner_headers = _auth_headers(test_app, "otheruser", "otherpass")
    files = {"file": ("test.png", BytesIO(_tiny_png_bytes()), "image/png")}
    created = test_app.post("/redact", files=files, headers=owner_headers)
    task_id = created.json()["task_id"]

    headers = _auth_headers(test_app, "adminuser", "adminpass")
    response = test_app.get(f"/logs/{task_id}", headers=headers)
    assert response.status_code == 200
