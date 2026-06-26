import { query } from '../../../config/database';
import { cacheGet, cacheSet } from '../../../config/redis';
import { WeatherAdapter, MarineWeather } from '../adapters/weatherAdapter';
import { OpenMeteoAdapter } from '../adapters/openMeteoAdapter';
import { MockEgyptAdapter } from '../adapters/mockEgyptAdapter';

const CACHE_TTL_SECONDS = parseInt(
  process.env.WEATHER_CACHE_TTL_SECONDS || '1800',
  10
);

const adapters: WeatherAdapter[] = [
  new OpenMeteoAdapter(),
  new MockEgyptAdapter(),
];

function cacheKey(lat: number, lng: number, type: 'current' | 'forecast', days?: number): string {
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;
  return `weather:${type}:${roundedLat}:${roundedLng}:${days ?? 'now'}`;
}

function reviveDates<T extends MarineWeather | MarineWeather[]>(value: T): T {
  const items: MarineWeather[] = Array.isArray(value) ? value : [value];
  for (const item of items) {
    if (item.fetchedAt && typeof item.fetchedAt === 'string') {
      (item as MarineWeather).fetchedAt = new Date(item.fetchedAt);
    }
  }
  return value;
}

export async function getCurrentWeather(
  lat: number,
  lng: number
): Promise<MarineWeather | null> {
  const key = cacheKey(lat, lng, 'current');
  const cached = await cacheGet<MarineWeather>(key);
  if (cached) return reviveDates(cached);

  for (const adapter of adapters) {
    const data = await adapter.getCurrent(lat, lng);
    if (data) {
      await Promise.all([
        cacheSet(key, data, CACHE_TTL_SECONDS),
        persistSnapshot(data),
      ]);
      return data;
    }
  }
  return null;
}

export async function getForecast(
  lat: number,
  lng: number,
  days: number
): Promise<MarineWeather[]> {
  const key = cacheKey(lat, lng, 'forecast', days);
  const cached = await cacheGet<MarineWeather[]>(key);
  if (cached) return reviveDates(cached);

  for (const adapter of adapters) {
    const data = await adapter.getForecast(lat, lng, days);
    if (data.length > 0) {
      await cacheSet(key, data, CACHE_TTL_SECONDS);
      return data;
    }
  }
  return [];
}

async function persistSnapshot(data: MarineWeather): Promise<void> {
  await query(
    `INSERT INTO weather_snapshots (
       location, source, payload,
       wind_speed_kmh, wind_direction_deg, wave_height_m,
       barometric_pressure_hpa, air_temperature_c, water_temperature_c,
       tidal_state, visibility_km, expires_at
     ) VALUES (
       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
       $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() + INTERVAL '2 hours'
     )`,
    [
      data.location.longitude,
      data.location.latitude,
      data.source,
      JSON.stringify(data),
      data.windSpeedKmh,
      data.windDirectionDeg,
      data.waveHeightM,
      data.barometricPressureHpa,
      data.airTemperatureC,
      data.waterTemperatureC,
      data.tidalState,
      data.visibilityKm,
    ]
  );
}
