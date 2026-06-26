import { imageProcessingQueue, weatherPrefetchQueue, offlineSyncQueue } from '../config/queue';

export async function enqueueImageProcessing(key: string, widths?: number[]) {
  return imageProcessingQueue.add('process-image', { key, widths });
}

export async function enqueueWeatherPrefetch(
  locations: { lat: number; lng: number }[],
  days: number = 7
) {
  return weatherPrefetchQueue.add('prefetch-weather', { locations, days });
}

export async function enqueueOfflineSync(syncItemId: string) {
  return offlineSyncQueue.add('process-offline-sync', { syncItemId });
}
