import cron from 'node-cron';
import { env } from '../config/env.js';
import { uploadsService } from '../modules/uploads/uploads.service.js';

// Periodically delete orphan uploads (is_referenced=false, older than the
// configured age) from both the bucket and the database.
export function startCleanupJob(): (() => void) | null {
  if (!cron.validate(env.cleanupCron)) {
    console.warn(`[cleanup] invalid CLEANUP_CRON "${env.cleanupCron}" — job disabled`);
    return null;
  }

  const task = cron.schedule(env.cleanupCron, async () => {
    try {
      const result = await uploadsService.cleanupOrphans();
      if (result.deleted > 0) {
        console.log(`[cleanup] removed ${result.deleted}/${result.scanned} orphan file(s)`);
      }
    } catch (err) {
      console.error('[cleanup] job failed:', (err as Error).message);
    }
  });

  console.log(`🧹 Orphan-file cleanup scheduled (cron: "${env.cleanupCron}")`);
  return () => void task.stop();
}
