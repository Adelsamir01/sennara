import { Job } from 'bullmq';
import { query } from '../config/database';

export interface OfflineSyncData {
  syncItemId: string;
}

export async function processOfflineSync(job: Job<OfflineSyncData>): Promise<void> {
  const { syncItemId } = job.data;

  const result = await query(
    'SELECT * FROM offline_sync_queue WHERE id = $1 AND status = $2',
    [syncItemId, 'pending']
  );

  if (result.rowCount === 0) {
    return;
  }

  try {
    // TODO: Route to appropriate module based on entity_type
    // For now mark completed
    await query(
      "UPDATE offline_sync_queue SET status = 'completed', updated_at = NOW() WHERE id = $1",
      [syncItemId]
    );
  } catch (err) {
    await query(
      "UPDATE offline_sync_queue SET status = 'failed', retry_count = retry_count + 1, error_log = $2, updated_at = NOW() WHERE id = $1",
      [syncItemId, (err as Error).message]
    );
    throw err;
  }
}
