import { Job } from 'bullmq';
import * as weatherService from '../modules/weather/services/weatherService';

export interface WeatherPrefetchData {
  locations: { lat: number; lng: number }[];
  days: number;
}

export async function prefetchWeather(job: Job<WeatherPrefetchData>): Promise<void> {
  const { locations, days } = job.data;

  for (const location of locations) {
    await weatherService.getForecast(location.lat, location.lng, days);
  }
}
