import { WeatherAdapter, MarineWeather } from './weatherAdapter';

/**
 * Open-Meteo is free, requires no API key, and provides hourly air weather.
 * Marine data (wave height) is available via their marine API.
 */
export class OpenMeteoAdapter implements WeatherAdapter {
  readonly name = 'open-meteo';

  async getCurrent(lat: number, lng: number): Promise<MarineWeather | null> {
    const url = new URL('https://marine-api.open-meteo.com/v1/marine');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('current', 'wave_height,wind_wave_height,ocean_current_velocity,ocean_current_direction,sea_surface_temperature');
    url.searchParams.set('timezone', 'Africa/Cairo');

    const airUrl = new URL('https://api.open-meteo.com/v1/forecast');
    airUrl.searchParams.set('latitude', String(lat));
    airUrl.searchParams.set('longitude', String(lng));
    airUrl.searchParams.set('current', 'temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure,visibility');
    airUrl.searchParams.set('timezone', 'Africa/Cairo');

    try {
      const [marineRes, airRes] = await Promise.all([
        fetch(url.toString()),
        fetch(airUrl.toString()),
      ]);
      if (!marineRes.ok || !airRes.ok) return null;

      const marine = (await marineRes.json()) as Record<string, unknown>;
      const air = (await airRes.json()) as Record<string, unknown>;

      return this.mapToMarineWeather(
        lat,
        lng,
        (marine.current as Record<string, unknown>) || {},
        (air.current as Record<string, unknown>) || {}
      );
    } catch {
      return null;
    }
  }

  async getForecast(lat: number, lng: number, days: number): Promise<MarineWeather[]> {
    const url = new URL('https://marine-api.open-meteo.com/v1/marine');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('daily', 'wave_height_max,wind_wave_height_max');
    url.searchParams.set('forecast_days', String(days));
    url.searchParams.set('timezone', 'Africa/Cairo');

    const airUrl = new URL('https://api.open-meteo.com/v1/forecast');
    airUrl.searchParams.set('latitude', String(lat));
    airUrl.searchParams.set('longitude', String(lng));
    airUrl.searchParams.set('daily', 'temperature_2m_max,wind_speed_10m_max,wind_direction_10m_dominant,surface_pressure_mean');
    airUrl.searchParams.set('forecast_days', String(days));
    airUrl.searchParams.set('timezone', 'Africa/Cairo');

    try {
      const [marineRes, airRes] = await Promise.all([
        fetch(url.toString()),
        fetch(airUrl.toString()),
      ]);
      if (!marineRes.ok || !airRes.ok) return [];

      const marine = (await marineRes.json()) as Record<string, unknown>;
      const air = (await airRes.json()) as Record<string, unknown>;

      const marineDaily = (marine.daily as Record<string, unknown[]>) || {};
      const airDaily = (air.daily as Record<string, unknown[]>) || {};

      const result: MarineWeather[] = [];
      for (let i = 0; i < days; i++) {
        const date = marineDaily.time?.[i];
        if (!date) continue;
        result.push({
          fetchedAt: new Date(),
          source: this.name,
          location: { latitude: lat, longitude: lng },
          windSpeedKmh: this.toKmh(airDaily.wind_speed_10m_max?.[i] as number | undefined),
          windDirectionDeg: (airDaily.wind_direction_10m_dominant?.[i] as number) ?? null,
          waveHeightM: (marineDaily.wave_height_max?.[i] as number) ?? null,
          swellDirectionDeg: null,
          barometricPressureHpa: (airDaily.surface_pressure_mean?.[i] as number) ?? null,
          airTemperatureC: (airDaily.temperature_2m_max?.[i] as number) ?? null,
          waterTemperatureC: null,
          tidalState: null,
          visibilityKm: null,
        });
      }
      return result;
    } catch {
      return [];
    }
  }

  private mapToMarineWeather(
    lat: number,
    lng: number,
    marine: Record<string, unknown>,
    air: Record<string, unknown>
  ): MarineWeather {
    return {
      fetchedAt: new Date(),
      source: this.name,
      location: { latitude: lat, longitude: lng },
      windSpeedKmh: this.toKmh(air?.wind_speed_10m as number | undefined),
      windDirectionDeg: (air?.wind_direction_10m as number) ?? null,
      waveHeightM: (marine?.wave_height as number) ?? null,
      swellDirectionDeg: (marine?.ocean_current_direction as number) ?? null,
      barometricPressureHpa: (air?.surface_pressure as number) ?? null,
      airTemperatureC: (air?.temperature_2m as number) ?? null,
      waterTemperatureC: (marine?.sea_surface_temperature as number) ?? null,
      tidalState: null,
      visibilityKm: this.toKm(air?.visibility as number | undefined),
    };
  }

  private toKmh(mps?: number): number | null {
    if (mps === undefined || mps === null) return null;
    return Math.round(mps * 3.6 * 10) / 10;
  }

  private toKm(meters?: number): number | null {
    if (meters === undefined || meters === null) return null;
    return Math.round(meters / 100) / 10;
  }
}
