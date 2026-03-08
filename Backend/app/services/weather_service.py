import asyncio
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone

from app.adapters.weather_api import (WeatherApiAdapter, WeatherApiError,
                                      WeatherApiTimeout)


class WeatherRateLimitError(Exception):
    pass


class ExternalApiUnavailableError(Exception):
    pass


@dataclass
class NormalizedWeather:
    city: str
    country: str
    temperature_c: float
    feels_like_c: float
    description: str
    humidity: int
    wind_speed: float
    source: str
    fetched_at: str


class WeatherService:
    def __init__(self, adapter: WeatherApiAdapter | None = None):
        self.adapter = adapter or WeatherApiAdapter()
        self._request_timestamps = deque()
        self._rate_limit = 20
        self._period_seconds = 60
        self._max_retries = 2

    def _check_rate_limit(self):
        now = time.time()
        while self._request_timestamps and now - self._request_timestamps[0] > self._period_seconds:
            self._request_timestamps.popleft()
        if len(self._request_timestamps) >= self._rate_limit:
            raise WeatherRateLimitError("Rate limit exceeded")
        self._request_timestamps.append(now)

    async def get_weather(self, city: str) -> NormalizedWeather:
        normalized_city = city.strip()
        if not normalized_city:
            raise ValueError("city is required")

        self._check_rate_limit()

        for attempt in range(self._max_retries + 1):
            try:
                payload = await self.adapter.fetch_current_weather(normalized_city)
                return NormalizedWeather(
                    city=payload.city,
                    country=payload.country,
                    temperature_c=payload.temperature_c,
                    feels_like_c=payload.feels_like_c,
                    description=payload.description,
                    humidity=payload.humidity,
                    wind_speed=payload.wind_speed,
                    source="openweathermap",
                    fetched_at=datetime.now(timezone.utc).isoformat(),
                )
            except WeatherApiTimeout as exc:
                if attempt >= self._max_retries:
                    raise ExternalApiUnavailableError("Weather provider timeout") from exc
                await asyncio.sleep(0.15 * (attempt + 1))
            except WeatherApiError as exc:
                if attempt >= self._max_retries:
                    raise ExternalApiUnavailableError("Weather provider failed") from exc
                await asyncio.sleep(0.15 * (attempt + 1))
