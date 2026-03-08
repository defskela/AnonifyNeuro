import asyncio

import pytest

from app.adapters.weather_api import WeatherApiError, WeatherApiTimeout, WeatherPayload
from app.services.weather_service import (ExternalApiUnavailableError,
                                          WeatherRateLimitError,
                                          WeatherService)


class _SuccessAdapter:
    async def fetch_current_weather(self, city: str):
        return WeatherPayload(
            city=city,
            country="RU",
            temperature_c=4.0,
            feels_like_c=2.5,
            description="пасмурно",
            humidity=81,
            wind_speed=3.0,
        )


class _FlakyTimeoutAdapter:
    def __init__(self):
        self.calls = 0

    async def fetch_current_weather(self, city: str):
        self.calls += 1
        if self.calls < 3:
            raise WeatherApiTimeout("timeout")
        return WeatherPayload(
            city=city,
            country="RU",
            temperature_c=1.0,
            feels_like_c=-1.0,
            description="ветер",
            humidity=65,
            wind_speed=6.0,
        )


class _AlwaysFailAdapter:
    async def fetch_current_weather(self, city: str):
        raise WeatherApiError("provider error")


@pytest.mark.unit
def test_weather_service_returns_normalized_payload():
    service = WeatherService(adapter=_SuccessAdapter())

    result = asyncio.run(service.get_weather("Moscow"))

    assert result.city == "Moscow"
    assert result.source == "openweathermap"
    assert result.temperature_c == 4.0


@pytest.mark.unit
def test_weather_service_retries_on_timeout_and_succeeds():
    adapter = _FlakyTimeoutAdapter()
    service = WeatherService(adapter=adapter)

    result = asyncio.run(service.get_weather("Moscow"))

    assert result.city == "Moscow"
    assert adapter.calls == 3


@pytest.mark.unit
def test_weather_service_raises_unavailable_after_retries_exhausted():
    service = WeatherService(adapter=_AlwaysFailAdapter())

    with pytest.raises(ExternalApiUnavailableError):
        asyncio.run(service.get_weather("Moscow"))


@pytest.mark.unit
def test_weather_service_rate_limit_exceeded():
    service = WeatherService(adapter=_SuccessAdapter())
    service._rate_limit = 2

    asyncio.run(service.get_weather("Moscow"))
    asyncio.run(service.get_weather("Moscow"))

    with pytest.raises(WeatherRateLimitError):
        asyncio.run(service.get_weather("Moscow"))
