import os
from dataclasses import dataclass

import httpx


class WeatherApiError(Exception):
    pass


class WeatherApiTimeout(WeatherApiError):
    pass


@dataclass
class WeatherPayload:
    city: str
    country: str
    temperature_c: float
    feels_like_c: float
    description: str
    humidity: int
    wind_speed: float


class WeatherApiAdapter:
    def __init__(self):
        self.base_url = os.getenv("WEATHER_API_BASE_URL", "https://api.openweathermap.org")
        self.api_key = os.getenv("WEATHER_API_KEY", "")
        self.timeout_seconds = float(os.getenv("WEATHER_API_TIMEOUT", "4"))

    async def fetch_current_weather(self, city: str) -> WeatherPayload:
        if not self.api_key:
            raise WeatherApiError("WEATHER_API_KEY is not configured")

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(
                    f"{self.base_url}/data/2.5/weather",
                    params={
                        "q": city,
                        "appid": self.api_key,
                        "units": "metric",
                        "lang": "ru",
                    },
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise WeatherApiTimeout("External weather API timeout") from exc
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text if exc.response is not None else ""
            raise WeatherApiError(f"Weather API HTTP error: {detail}") from exc
        except httpx.HTTPError as exc:
            raise WeatherApiError("Weather API request failed") from exc

        payload = response.json()
        weather = payload.get("weather") or [{}]
        main = payload.get("main") or {}
        wind = payload.get("wind") or {}
        sys = payload.get("sys") or {}

        return WeatherPayload(
            city=payload.get("name", city),
            country=sys.get("country", ""),
            temperature_c=float(main.get("temp", 0.0)),
            feels_like_c=float(main.get("feels_like", 0.0)),
            description=str(weather[0].get("description", "")).strip(),
            humidity=int(main.get("humidity", 0)),
            wind_speed=float(wind.get("speed", 0.0)),
        )
