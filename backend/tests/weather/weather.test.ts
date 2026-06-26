import { MockEgyptAdapter } from '../../src/modules/weather/adapters/mockEgyptAdapter';
import * as weatherService from '../../src/modules/weather/services/weatherService';
import { setRedis } from '../../src/config/redis';
import { getMockRedis, clearMockRedis, closeMockRedis } from '../utils/redis';
import { initTestEnvironment, teardownTestEnvironment } from '../utils/testApp';

describe('Weather Module', () => {
  let fetchSpy: jest.SpyInstance;

  beforeAll(async () => {
    await initTestEnvironment();
    setRedis(getMockRedis() as any);
    // Force OpenMeteo to fail so tests use the deterministic mock adapter
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);
  });

  afterEach(async () => {
    await clearMockRedis();
  });

  afterAll(async () => {
    fetchSpy?.mockRestore();
    await teardownTestEnvironment();
    await closeMockRedis();
  });

  describe('MockEgyptAdapter', () => {
    it('generates deterministic current weather', async () => {
      const adapter = new MockEgyptAdapter();
      const weather = await adapter.getCurrent(27.2579, 33.8116);

      expect(weather).not.toBeNull();
      expect(weather?.location.latitude).toBe(27.2579);
      expect(weather?.windSpeedKmh).toBeGreaterThanOrEqual(8);
      expect(weather?.waveHeightM).toBeGreaterThanOrEqual(0.2);
      expect(weather?.tidalState).toMatch(/rising|falling|high|low/);
    });

    it('generates 7-day forecast', async () => {
      const adapter = new MockEgyptAdapter();
      const forecast = await adapter.getForecast(27.2579, 33.8116, 7);

      expect(forecast).toHaveLength(7);
      forecast.forEach((day) => {
        expect(day.source).toBe('mock-egypt');
        expect(day.windSpeedKmh).toBeGreaterThanOrEqual(8);
      });
    });
  });

  describe('WeatherService', () => {
    it('fetches, caches and persists current weather', async () => {
      const weather = await weatherService.getCurrentWeather(27.2579, 33.8116);

      expect(weather).not.toBeNull();
      expect(weather?.source).toBe('mock-egypt');

      // Second call should be cached (same object shape, source preserved)
      const cached = await weatherService.getCurrentWeather(27.2579, 33.8116);
      expect(cached?.fetchedAt).toEqual(weather?.fetchedAt);
    });

    it('fetches and caches forecast', async () => {
      const forecast = await weatherService.getForecast(27.2579, 33.8116, 3);

      expect(forecast).toHaveLength(3);
      expect(forecast[0].source).toBe('mock-egypt');

      const cached = await weatherService.getForecast(27.2579, 33.8116, 3);
      expect(cached[0].fetchedAt).toEqual(forecast[0].fetchedAt);
    });
  });
});
