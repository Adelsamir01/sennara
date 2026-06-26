import { app } from '../../src/server';
import { setPool } from '../../src/config/database';
import { setRedis } from '../../src/config/redis';
import { getTestPool, setupTestDb, clearTestDb, reseedSpecies, closeTestDb } from './db';
import { getMockRedis, clearMockRedis, closeMockRedis } from './redis';

export async function initTestEnvironment(): Promise<void> {
  setPool(getTestPool());
  setRedis(getMockRedis() as any);
  await setupTestDb();
  await clearMockRedis();
}

export async function resetTestEnvironment(): Promise<void> {
  await clearTestDb();
  await reseedSpecies();
  await clearMockRedis();
}

export async function teardownTestEnvironment(): Promise<void> {
  await closeTestDb();
  await closeMockRedis();
}

export { app };
