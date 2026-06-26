import { Worker } from 'bullmq';
import { redisConnection, redisConnectionOptions } from '../config/queue';
import { processImage } from './imageProcessingJob';
import { prefetchWeather } from './weatherPrefetchJob';
import { processOfflineSync } from './offlineSyncJob';

console.log('Sennara worker starting...');

const workers = [
  new Worker('image-processing', processImage, { connection: redisConnectionOptions }),
  new Worker('weather-prefetch', prefetchWeather, { connection: redisConnectionOptions }),
  new Worker('offline-sync', processOfflineSync, { connection: redisConnectionOptions }),
];

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down workers...`);
  await Promise.all(workers.map((w) => w.close()));
  await redisConnection.quit();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
