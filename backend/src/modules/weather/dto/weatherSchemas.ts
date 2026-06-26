import { z } from 'zod';

export const currentWeatherSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const forecastSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  days: z.coerce.number().min(1).max(7).default(7),
});

export type CurrentWeatherDto = z.infer<typeof currentWeatherSchema>;
export type ForecastDto = z.infer<typeof forecastSchema>;
