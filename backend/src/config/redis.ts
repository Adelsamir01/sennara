import Redis from 'ioredis';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/0');
  }
  return redisInstance;
}

export function setRedis(instance: Redis): void {
  redisInstance = instance;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await getRedis().get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await getRedis().setex(key, ttlSeconds, serialized);
}

export async function cacheDelete(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
