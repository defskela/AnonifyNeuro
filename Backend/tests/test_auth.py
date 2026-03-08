def _extract_access_token(payload: dict) -> str:
    return payload["access_token"]


def _extract_refresh_token(payload: dict) -> str:
    return payload["refresh_token"]


def _login_tokens(client, username: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    assert response.status_code == 200
    body = response.json()
    return {
        "access": _extract_access_token(body),
        "refresh": _extract_refresh_token(body),
    }


def _auth_headers(client, username: str, password: str) -> dict[str, str]:
    tokens = _login_tokens(client, username, password)
    return {"Authorization": f"Bearer {tokens['access']}"}


def test_register_success(test_app):
    response = test_app.post("/auth/register", json={
        "username": "newuser",
        "password": "testpass",
        "email": "new@example.com"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "User created successfully"
    assert "access_token" in data
    assert "refresh_token" in data
    assert "jwt_token" not in data


def test_register_duplicate_username(test_app):
    test_app.post("/auth/register", json={
        "username": "testuser2",
        "password": "testpass",
        "email": "test2@example.com"
    })
    response = test_app.post("/auth/register", json={
        "username": "testuser2",
        "password": "testpass",
        "email": "test3@example.com"
    })
    assert response.status_code == 400
    assert "Username already registered" in response.json()["detail"]


def test_register_duplicate_email(test_app):
    test_app.post("/auth/register", json={
        "username": "testuser3",
        "password": "testpass",
        "email": "test4@example.com"
    })
    response = test_app.post("/auth/register", json={
        "username": "testuser4",
        "password": "testpass",
        "email": "test4@example.com"
    })
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


def test_login_success(test_app):
    test_app.post("/auth/register", json={
        "username": "loginuser",
        "password": "loginpass",
        "email": "login@example.com"
    })
    response = test_app.post("/auth/login", json={
        "username": "loginuser",
        "password": "loginpass"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_invalid_credentials(test_app):
    response = test_app.post("/auth/login", json={
        "username": "nonexistent",
        "password": "wrongpass"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


def test_refresh_success_and_rotation(test_app):
    tokens = _login_tokens(test_app, "testuser", "testpass")

    refresh_response = test_app.post("/auth/refresh", json={
        "refresh_token": tokens["refresh"]
    })
    assert refresh_response.status_code == 200
    refreshed = refresh_response.json()
    assert "access_token" in refreshed
    assert "refresh_token" in refreshed

    replay_response = test_app.post("/auth/refresh", json={
        "refresh_token": tokens["refresh"]
    })
    assert replay_response.status_code == 401
    assert replay_response.json()["detail"] in {"Refresh token revoked", "Invalid refresh token"}


def test_refresh_invalid_token(test_app):
    response = test_app.post("/auth/refresh", json={
        "refresh_token": "invalidtoken"
    })
    assert response.status_code == 401


def test_logout_success_revokes_refresh(test_app):
    tokens = _login_tokens(test_app, "testuser", "testpass")

    response = test_app.post(
        "/auth/logout",
        json={"refresh_token": tokens["refresh"]},
        headers={"Authorization": f"Bearer {tokens['access']}"}
    )
    assert response.status_code == 200
    assert "Logged out successfully" in response.json()["message"]

    refresh_after_logout = test_app.post("/auth/refresh", json={
        "refresh_token": tokens["refresh"]
    })
    assert refresh_after_logout.status_code == 401


def test_logout_no_token(test_app):
    response = test_app.post("/auth/logout")
    assert response.status_code == 403


def test_update_profile_success(test_app):
    register_response = test_app.post("/auth/register", json={
        "username": "profileuser",
        "password": "initialpass",
        "email": "profile@example.com"
    })
    token = _extract_access_token(register_response.json())

    update_response = test_app.put(
        "/auth/profile",
        json={"username": "profileuser_updated", "password": "newpass"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert update_response.status_code == 200
    update_data = update_response.json()
    assert update_data["message"] == "Profile updated successfully"
    assert "access_token" in update_data
    assert "refresh_token" in update_data

    login_response = test_app.post("/auth/login", json={
        "username": "profileuser_updated",
        "password": "newpass"
    })
    assert login_response.status_code == 200


def test_update_profile_username_conflict(test_app):
    response_user1 = test_app.post("/auth/register", json={
        "username": "conflict_source",
        "password": "pass1",
        "email": "conflict1@example.com"
    })
    token_user1 = _extract_access_token(response_user1.json())

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
    token = _extract_access_token(register_response.json())

    response = test_app.put(
        "/auth/profile",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "No fields to update"


def test_profile_includes_default_user_role(test_app):
    register_response = test_app.post("/auth/register", json={
        "username": "role_default_user",
        "password": "rolepass",
        "email": "role_default_user@example.com"
    })
    token = _extract_access_token(register_response.json())

    response = test_app.get("/auth/profile", headers={
        "Authorization": f"Bearer {token}"
    })

    assert response.status_code == 200
    payload = response.json()
    assert payload["role"] == "user"


def test_profile_includes_admin_role(test_app):
    tokens = _login_tokens(test_app, "adminuser", "adminpass")

    response = test_app.get("/auth/profile", headers={
        "Authorization": f"Bearer {tokens['access']}"
    })

    assert response.status_code == 200
    payload = response.json()
    assert payload["role"] == "admin"


def test_admin_can_update_user_role(test_app):
    target_register = test_app.post("/auth/register", json={
        "username": "role_target_user",
        "password": "rolepass",
        "email": "role_target_user@example.com"
    })
    target_token = _extract_access_token(target_register.json())
    target_profile = test_app.get("/auth/profile", headers={
        "Authorization": f"Bearer {target_token}"
    })
    target_user_id = target_profile.json()["id"]

    admin_headers = _auth_headers(test_app, "adminuser", "adminpass")
    update_response = test_app.patch(
        f"/auth/users/{target_user_id}/role",
        json={"role": "admin"},
        headers=admin_headers
    )

    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["role"] == "admin"


def test_non_admin_cannot_update_user_role(test_app):
    target_register = test_app.post("/auth/register", json={
        "username": "role_target_user_forbidden",
        "password": "rolepass",
        "email": "role_target_user_forbidden@example.com"
    })
    target_token = _extract_access_token(target_register.json())
    target_profile = test_app.get("/auth/profile", headers={
        "Authorization": f"Bearer {target_token}"
    })
    target_user_id = target_profile.json()["id"]

    non_admin_headers = _auth_headers(test_app, "testuser", "testpass")
    update_response = test_app.patch(
        f"/auth/users/{target_user_id}/role",
        json={"role": "admin"},
        headers=non_admin_headers
    )

    assert update_response.status_code == 403
    assert update_response.json()["detail"] == "Insufficient permissions"


def test_admin_update_user_role_not_found(test_app):
    admin_headers = _auth_headers(test_app, "adminuser", "adminpass")
    update_response = test_app.patch(
        "/auth/users/999999/role",
        json={"role": "admin"},
        headers=admin_headers
    )

    assert update_response.status_code == 404
    assert update_response.json()["detail"] == "User not found"


def test_admin_can_list_users(test_app):
    headers = _auth_headers(test_app, "adminuser", "adminpass")
    response = test_app.get("/auth/users", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert any(user["username"] == "testuser" for user in payload)


def test_non_admin_cannot_list_users(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")
    response = test_app.get("/auth/users", headers=headers)

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions"
