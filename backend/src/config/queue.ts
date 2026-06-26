import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

function parseRedisUrl(url: string): { host: string; port: number; db?: number; password?: string } {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      db: parsed.pathname ? parseInt(parsed.pathname.replace('/', '') || '0', 10) : 0,
      password: parsed.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const redisConfig = parseRedisUrl(process.env.REDIS_URL || 'redis://localhost:6379/0');

export const redisConnection = new IORedis({
  ...redisConfig,
  maxRetriesPerRequest: null,
});

export const redisConnectionOptions: QueueOptions['connection'] = {
  ...redisConfig,
  maxRetriesPerRequest: null,
};

const queueOptions: QueueOptions = {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
};

export const imageProcessingQueue = new Queue('image-processing', queueOptions);
export const weatherPrefetchQueue = new Queue('weather-prefetch', queueOptions);
export const offlineSyncQueue = new Queue('offline-sync', queueOptions);

export async function closeQueues(): Promise<void> {
  await imageProcessingQueue.close();
  await weatherPrefetchQueue.close();
  await offlineSyncQueue.close();
  await redisConnection.quit();
}
