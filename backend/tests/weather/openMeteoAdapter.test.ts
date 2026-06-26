import { OpenMeteoAdapter } from '../../src/modules/weather/adapters/openMeteoAdapter';

describe('OpenMeteoAdapter', () => {
  const adapter = new OpenMeteoAdapter();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('parses current weather response', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockImplementation((url: any) => {
      const u = url.toString();
      if (u.includes('marine-api')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            current: {
              wave_height: 1.2,
              sea_surface_temperature: 26.5,
            },
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 30,
            wind_speed_10m: 5,
            wind_direction_10m: 180,
            surface_pressure: 1012,
            visibility: 10000,
          },
        }),
      } as Response);
    });

    const weather = await adapter.getCurrent(27.2579, 33.8116);

    expect(weather).not.toBeNull();
    expect(weather?.waveHeightM).toBe(1.2);
    expect(weather?.waterTemperatureC).toBe(26.5);
    expect(weather?.airTemperatureC).toBe(30);
    expect(weather?.windSpeedKmh).toBe(18); // 5 m/s * 3.6

    mockFetch.mockRestore();
  });

  it('returns null when API fails', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const weather = await adapter.getCurrent(27.2579, 33.8116);
    expect(weather).toBeNull();

    mockFetch.mockRestore();
  });
});
