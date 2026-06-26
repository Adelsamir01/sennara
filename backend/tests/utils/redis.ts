import RedisMock from 'ioredis-mock';

type MockRedis = InstanceType<typeof RedisMock>;

let mockRedis: MockRedis | null = null;

export function getMockRedis(): MockRedis {
  if (!mockRedis) {
    mockRedis = new RedisMock();
  }
  return mockRedis;
}

export async function clearMockRedis(): Promise<void> {
  const redis = getMockRedis();
  await redis.flushall();
}

export async function closeMockRedis(): Promise<void> {
  if (mockRedis) {
    await mockRedis.quit();
    mockRedis = null;
  }
}
