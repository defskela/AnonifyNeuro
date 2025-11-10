def _auth_headers(client, username: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    assert response.status_code == 200
    token = response.json()["jwt_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_chats_returns_user_chats(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.get("/chats", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data, "Expected at least one chat for seeded user"
    assert {"id", "created_at"}.issubset(data[0].keys())


def test_get_chat_messages_returns_messages(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    chats_response = test_app.get("/chats", headers=headers)
    chat_id = chats_response.json()[0]["id"]

    messages_response = test_app.get(
        f"/chats/{chat_id}/messages", headers=headers)

    assert messages_response.status_code == 200
    messages = messages_response.json()
    assert messages, "Expected seeded messages"
    assert all(message["chat_id"] == chat_id for message in messages)


def test_get_chat_messages_not_found_for_other_user(test_app):
    other_headers = _auth_headers(test_app, "otheruser", "otherpass")
    other_chats_response = test_app.get("/chats", headers=other_headers)
    other_chat_id = other_chats_response.json()[0]["id"]

    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.get(
        f"/chats/{other_chat_id}/messages", headers=headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "Chat not found"
