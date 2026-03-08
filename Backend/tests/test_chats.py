def _auth_headers(client, username: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    assert response.status_code == 200
    body = response.json()
    token = body["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_chats_returns_user_chats(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.get("/chats", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert isinstance(data["items"], list)
    assert data["items"], "Expected at least one chat for seeded user"
    assert {"id", "created_at"}.issubset(data["items"][0].keys())


def test_get_chat_messages_returns_messages(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    chats_response = test_app.get("/chats", headers=headers)
    chat_id = chats_response.json()["items"][0]["id"]

    messages_response = test_app.get(
        f"/chats/{chat_id}/messages", headers=headers)

    assert messages_response.status_code == 200
    messages = messages_response.json()
    assert messages, "Expected seeded messages"
    assert all(message["chat_id"] == chat_id for message in messages)


def test_get_chat_messages_not_found_for_other_user(test_app):
    other_headers = _auth_headers(test_app, "otheruser", "otherpass")
    other_chats_response = test_app.get("/chats", headers=other_headers)
    other_chat_id = other_chats_response.json()["items"][0]["id"]

    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.get(
        f"/chats/{other_chat_id}/messages", headers=headers)

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions"


def test_create_chat_success(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.post(
        "/chats",
        json={"title": "New Project"},
        headers=headers
    )

    assert response.status_code == 201
    chat_data = response.json()
    assert chat_data["title"] == "New Project"
    assert "id" in chat_data


def test_send_message_success(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    chat_response = test_app.post("/chats", json={}, headers=headers)
    chat_id = chat_response.json()["id"]

    message_response = test_app.post(
        f"/chats/{chat_id}/messages",
        json={"content": "Here is the document"},
        headers=headers
    )

    assert message_response.status_code == 201
    message_data = message_response.json()
    assert message_data["chat_id"] == chat_id
    assert message_data["sender"] == "user"
    assert message_data["content"] == "Here is the document"


def test_send_message_requires_content_or_image(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    chat_response = test_app.post("/chats", json={}, headers=headers)
    chat_id = chat_response.json()["id"]

    message_response = test_app.post(
        f"/chats/{chat_id}/messages",
        json={},
        headers=headers
    )

    assert message_response.status_code == 422


def test_send_message_not_found_for_other_user(test_app):
    other_headers = _auth_headers(test_app, "otheruser", "otherpass")
    other_chat_response = test_app.post(
        "/chats", json={}, headers=other_headers)
    other_chat_id = other_chat_response.json()["id"]

    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.post(
        f"/chats/{other_chat_id}/messages",
        json={"content": "Should not work"},
        headers=headers
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions"


def test_admin_can_read_other_user_chat_messages(test_app):
    other_headers = _auth_headers(test_app, "otheruser", "otherpass")
    create_chat_response = test_app.post(
        "/chats",
        json={"title": "Other user admin visibility chat"},
        headers=other_headers
    )
    other_chat_id = create_chat_response.json()["id"]
    post_message_response = test_app.post(
        f"/chats/{other_chat_id}/messages",
        json={"content": "Visible for admin"},
        headers=other_headers
    )
    assert post_message_response.status_code == 201

    admin_headers = _auth_headers(test_app, "adminuser", "adminpass")
    response = test_app.get(f"/chats/{other_chat_id}/messages", headers=admin_headers)

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert payload


def test_admin_sees_all_chats(test_app):
    admin_headers = _auth_headers(test_app, "adminuser", "adminpass")
    response = test_app.get("/chats", headers=admin_headers)

    assert response.status_code == 200
    chats = response.json()["items"]
    titles = {chat["title"] for chat in chats}
    assert "Onboarding" in titles
    assert "Private" in titles


def test_chat_files_upload_list_download_delete_flow(test_app, monkeypatch):
    headers = _auth_headers(test_app, "testuser", "testpass")
    chat_id = test_app.get("/chats", headers=headers).json()["items"][0]["id"]

    monkeypatch.setattr("app.routers.chats.storage.upload_file", lambda *args, **kwargs: "ok")
    monkeypatch.setattr("app.routers.chats.storage.get_presigned_url", lambda key: f"https://files.local/{key}")
    monkeypatch.setattr("app.routers.chats.storage.delete_file", lambda *args, **kwargs: None)

    upload_response = test_app.post(
        f"/chats/{chat_id}/files",
        files={"file": ("sample.png", b"1234", "image/png")},
        headers=headers,
    )
    assert upload_response.status_code == 201
    uploaded = upload_response.json()
    assert uploaded["filename"] == "sample.png"
    file_id = uploaded["id"]

    list_response = test_app.get(f"/chats/{chat_id}/files", headers=headers)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert len(listed) == 1
    assert listed[0]["id"] == file_id

    download_response = test_app.get(f"/chats/{chat_id}/files/{file_id}/download", headers=headers)
    assert download_response.status_code == 200
    assert download_response.json()["url"].startswith("https://files.local/")

    delete_response = test_app.delete(f"/chats/{chat_id}/files/{file_id}", headers=headers)
    assert delete_response.status_code == 204


def test_chat_files_forbidden_for_foreign_chat(test_app, monkeypatch):
    owner_headers = _auth_headers(test_app, "otheruser", "otherpass")
    owner_chat_id = test_app.get("/chats", headers=owner_headers).json()["items"][0]["id"]

    monkeypatch.setattr("app.routers.chats.storage.upload_file", lambda *args, **kwargs: "ok")

    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.post(
        f"/chats/{owner_chat_id}/files",
        files={"file": ("sample.png", b"1234", "image/png")},
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions"
