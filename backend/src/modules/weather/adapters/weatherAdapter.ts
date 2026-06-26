export interface MarineWeather {
  fetchedAt: Date;
  source: string;
  location: { latitude: number; longitude: number };
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  waveHeightM: number | null;
  swellDirectionDeg: number | null;
  barometricPressureHpa: number | null;
  airTemperatureC: number | null;
  waterTemperatureC: number | null;
  tidalState: string | null;
  visibilityKm: number | null;
}

export interface WeatherAdapter {
  readonly name: string;
  getCurrent(lat: number, lng: number): Promise<MarineWeather | null>;
  getForecast(lat: number, lng: number, days: number): Promise<MarineWeather[]>;
}
