import { WeatherAdapter, MarineWeather } from './weatherAdapter';

/**
 * Deterministic mock adapter for Egyptian waters.
 * Useful for demos, tests, and fallback when external APIs fail.
 */
export class MockEgyptAdapter implements WeatherAdapter {
  readonly name = 'mock-egypt';

  async getCurrent(lat: number, lng: number): Promise<MarineWeather | null> {
    return this.generate(lat, lng, 0);
  }

  async getForecast(lat: number, lng: number, days: number): Promise<MarineWeather[]> {
    const result: MarineWeather[] = [];
    for (let i = 0; i < days; i++) {
      result.push(this.generate(lat, lng, i));
    }
    return result;
  }

  private generate(lat: number, lng: number, dayOffset: number): MarineWeather {
    // Use a simple pseudo-random based on lat/lng/date so it feels consistent.
    const seed = Math.abs(Math.sin(lat * 10 + lng * 5 + dayOffset) * 10000);
    const baseTemp = this.baseTemperature(lat, lng);

    return {
      fetchedAt: new Date(Date.now() + dayOffset * 86400000),
      source: this.name,
      location: { latitude: lat, longitude: lng },
      windSpeedKmh: 8 + (seed % 25),
      windDirectionDeg: Math.floor(seed % 360),
      waveHeightM: Math.round((0.2 + (seed % 18) / 10) * 10) / 10,
      swellDirectionDeg: Math.floor(seed % 360),
      barometricPressureHpa: 1010 + (seed % 20),
      airTemperatureC: Math.round((baseTemp - 2 + (seed % 8)) * 10) / 10,
      waterTemperatureC: Math.round((baseTemp + 1 + (seed % 4)) * 10) / 10,
      tidalState: ['rising', 'falling', 'high', 'low'][Math.floor(seed % 4)],
      visibilityKm: 5 + Math.floor(seed % 15),
    };
  }

  private baseTemperature(lat: number, lng: number): number {
    // Red Sea is warmer than Mediterranean
    if (lng > 32 && lat < 29) return 28;
    // Mediterranean
    if (lat > 30) return 24;
    // Nile / Lake Nasser
    return 26;
  }
}
