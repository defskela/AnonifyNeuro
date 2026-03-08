export interface WeatherResponse {
  city: string;
  country: string;
  temperature_c: number;
  feels_like_c: number;
  description: string;
  humidity: number;
  wind_speed: number;
  source: string;
  fetched_at: string;
}
