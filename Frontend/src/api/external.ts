import { client } from './client';
import type { WeatherResponse } from '../types/external';

export const externalApi = {
  getWeather: async (city: string): Promise<WeatherResponse> => {
    const response = await client.get('/external/weather', { params: { city } });
    return response.data;
  },
};
