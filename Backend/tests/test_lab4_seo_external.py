from app.routers.external import get_weather_service
from app.services.weather_service import (ExternalApiUnavailableError,
                                          NormalizedWeather,
                                          WeatherRateLimitError)


def test_robots_txt(test_app):
    response = test_app.get("/robots.txt")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    body = response.text
    assert "Disallow: /chats" in body
    assert "Sitemap:" in body


def test_sitemap_xml(test_app):
    response = test_app.get("/sitemap.xml")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/xml")
    body = response.text
    assert "<loc>http://localhost:3000/about</loc>" in body
    assert "<loc>http://localhost:3000/login</loc>" in body
    assert "<loc>http://localhost:3000/register</loc>" in body


def test_external_weather_success(test_app):
    class StubService:
        async def get_weather(self, city: str):
            return NormalizedWeather(
                city=city,
                country="RU",
                temperature_c=3.5,
                feels_like_c=0.8,
                description="пасмурно",
                humidity=74,
                wind_speed=4.1,
                source="openweathermap",
                fetched_at="2026-03-08T10:00:00+00:00",
            )

    test_app.app.dependency_overrides[get_weather_service] = lambda: StubService()

    response = test_app.get("/external/weather", params={"city": "Moscow"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["city"] == "Moscow"
    assert payload["source"] == "openweathermap"

    test_app.app.dependency_overrides.pop(get_weather_service, None)


def test_external_weather_unavailable(test_app):
    class StubService:
        async def get_weather(self, city: str):
            raise ExternalApiUnavailableError("down")

    test_app.app.dependency_overrides[get_weather_service] = lambda: StubService()

    response = test_app.get("/external/weather", params={"city": "Moscow"})
    assert response.status_code == 503

    test_app.app.dependency_overrides.pop(get_weather_service, None)


def test_external_weather_rate_limited(test_app):
    class StubService:
        async def get_weather(self, city: str):
            raise WeatherRateLimitError("too many")

    test_app.app.dependency_overrides[get_weather_service] = lambda: StubService()

    response = test_app.get("/external/weather", params={"city": "Moscow"})
    assert response.status_code == 429

    test_app.app.dependency_overrides.pop(get_weather_service, None)
