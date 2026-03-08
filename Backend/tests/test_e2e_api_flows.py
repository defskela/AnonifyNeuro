import pytest

from app.routers.external import get_weather_service
from app.services.weather_service import (ExternalApiUnavailableError,
                                          NormalizedWeather)


pytestmark = pytest.mark.e2e


def _login_tokens(client, username: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    data = response.json()
    return {"access": data["access_token"], "refresh": data["refresh_token"]}


def _auth_headers(client, username: str, password: str) -> dict[str, str]:
    tokens = _login_tokens(client, username, password)
    return {"Authorization": f"Bearer {tokens['access']}"}


def _mock_storage(monkeypatch):
    monkeypatch.setattr("app.routers.chats.storage.upload_file", lambda *args, **kwargs: "ok")
    monkeypatch.setattr("app.routers.chats.storage.get_presigned_url", lambda key: f"https://files.local/{key}")
    monkeypatch.setattr("app.routers.chats.storage.delete_file", lambda *args, **kwargs: None)


def _weather_success_override(test_app):
    class StubService:
        async def get_weather(self, city: str):
            return NormalizedWeather(
                city=city,
                country="RU",
                temperature_c=6.2,
                feels_like_c=4.5,
                description="облачно",
                humidity=71,
                wind_speed=2.8,
                source="openweathermap",
                fetched_at="2026-03-08T10:00:00+00:00",
            )

    test_app.app.dependency_overrides[get_weather_service] = lambda: StubService()


def _weather_fail_override(test_app):
    class StubService:
        async def get_weather(self, city: str):
            raise ExternalApiUnavailableError("unavailable")

    test_app.app.dependency_overrides[get_weather_service] = lambda: StubService()


def _clear_overrides(test_app):
    test_app.app.dependency_overrides.pop(get_weather_service, None)


def _create_chat_and_file(test_app, headers):
    chat_response = test_app.post("/chats", json={"title": "E2E Chat"}, headers=headers)
    assert chat_response.status_code == 201
    chat_id = chat_response.json()["id"]

    message_response = test_app.post(
        f"/chats/{chat_id}/messages",
        json={"content": "E2E message"},
        headers=headers,
    )
    assert message_response.status_code == 201

    upload_response = test_app.post(
        f"/chats/{chat_id}/files",
        files={"file": ("sample.png", b"1234", "image/png")},
        headers=headers,
    )
    assert upload_response.status_code == 201
    file_id = upload_response.json()["id"]

    return chat_id, file_id


# End-to-end API flow: login -> refresh -> logout -> invalid refresh
# checks session lifecycle and security constraints in one scenario.
def test_e2e_session_lifecycle(test_app):
    tokens = _login_tokens(test_app, "testuser", "testpass")
    headers = {"Authorization": f"Bearer {tokens['access']}"}

    refresh_response = test_app.post("/auth/refresh", json={"refresh_token": tokens["refresh"]})
    assert refresh_response.status_code == 200
    new_refresh = refresh_response.json()["refresh_token"]

    logout_response = test_app.post("/auth/logout", json={"refresh_token": new_refresh}, headers=headers)
    assert logout_response.status_code == 200

    replay_response = test_app.post("/auth/refresh", json={"refresh_token": new_refresh})
    assert replay_response.status_code == 401


# End-to-end CRUD by role: user can create/read own data, admin can access other user data.
def test_e2e_role_based_crud_and_files(test_app, monkeypatch):
    _mock_storage(monkeypatch)

    user_headers = _auth_headers(test_app, "testuser", "testpass")
    chat_id, file_id = _create_chat_and_file(test_app, user_headers)

    own_read = test_app.get(f"/chats/{chat_id}/messages", headers=user_headers)
    assert own_read.status_code == 200

    other_headers = _auth_headers(test_app, "otheruser", "otherpass")
    forbidden_read = test_app.get(f"/chats/{chat_id}/messages", headers=other_headers)
    assert forbidden_read.status_code == 403

    admin_headers = _auth_headers(test_app, "adminuser", "adminpass")
    admin_read = test_app.get(f"/chats/{chat_id}/messages", headers=admin_headers)
    assert admin_read.status_code == 200

    download_response = test_app.get(f"/chats/{chat_id}/files/{file_id}/download", headers=user_headers)
    assert download_response.status_code == 200
    assert download_response.json()["url"].startswith("https://files.local/")


# End-to-end list scenario: filtering/sorting/pagination should return stable response model.
def test_e2e_chats_filter_sort_paginate(test_app):
    headers = _auth_headers(test_app, "testuser", "testpass")

    response = test_app.get(
        "/chats",
        params={
            "q": "On",
            "sort_by": "created_at",
            "sort_order": "desc",
            "page": 1,
            "page_size": 5,
        },
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload
    assert "total" in payload
    assert payload["page"] == 1


# End-to-end external integration: success and provider outage are both handled predictably.
def test_e2e_external_api_success_and_failure(test_app):
    _weather_success_override(test_app)
    success = test_app.get("/external/weather", params={"city": "Moscow"})
    assert success.status_code == 200
    assert success.json()["city"] == "Moscow"

    _weather_fail_override(test_app)
    failure = test_app.get("/external/weather", params={"city": "Moscow"})
    assert failure.status_code == 503

    _clear_overrides(test_app)
