import Redis from 'ioredis';
import { env } from './env';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(env.REDIS_URL);
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

// Token deny-list helpers (used for logout / compromised tokens)
export function deniedTokenKey(jti: string): string {
  return `deny:${jti}`;
}

export async function denyToken(jti: string, ttlSeconds: number): Promise<void> {
  await cacheSet(deniedTokenKey(jti), '1', ttlSeconds);
}

export async function isTokenDenied(jti: string): Promise<boolean> {
  const denied = await getRedis().get(deniedTokenKey(jti));
  return denied === '1';
}

// Refresh-token rotation helpers
export function refreshTokenKey(jti: string): string {
  return `refresh:${jti}`;
}

export async function storeRefreshToken(
  jti: string,
  userId: string,
  ttlSeconds: number
): Promise<void> {
  await cacheSet(refreshTokenKey(jti), { userId }, ttlSeconds);
}

export async function consumeRefreshToken(jti: string): Promise<string | null> {
  const redis = getRedis();
  const key = refreshTokenKey(jti);
  const value = await redis.get(key);
  if (!value) return null;
  await redis.del(key);
  try {
    const parsed = JSON.parse(value) as { userId: string };
    return parsed.userId;
  } catch {
    return null;
  }
}
