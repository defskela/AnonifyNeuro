from fastapi import APIRouter, Depends, HTTPException, Query, status

from app import schemas
from app.services.weather_service import (ExternalApiUnavailableError,
                                          WeatherRateLimitError,
                                          WeatherService)

router = APIRouter(prefix="/external", tags=["external"])


def get_weather_service() -> WeatherService:
    return WeatherService()


@router.get("/weather", response_model=schemas.ExternalWeatherRead)
async def get_weather(
    city: str = Query(..., min_length=2, max_length=80),
    service: WeatherService = Depends(get_weather_service),
):
    try:
        weather = await service.get_weather(city)
        return {
            "city": weather.city,
            "country": weather.country,
            "temperature_c": weather.temperature_c,
            "feels_like_c": weather.feels_like_c,
            "description": weather.description,
            "humidity": weather.humidity,
            "wind_speed": weather.wind_speed,
            "source": weather.source,
            "fetched_at": weather.fetched_at,
        }
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except WeatherRateLimitError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Weather API rate limit reached") from exc
    except ExternalApiUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Weather provider is unavailable") from exc
