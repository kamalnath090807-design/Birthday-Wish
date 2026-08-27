import { Env } from '../types.js';
import { d1 } from '../db/index.js';
import { deleteFromCloudinary } from '../utils/cloudinary.js';

export interface CleanupResult {
  totalFound: number;
  deleted: number;
  failed: number;
  timestamp: string;
}

/**
 * Executes automated cleanup of media older than 72 hours (3 days).
 * Deletes expired assets from Cloudinary and nullifies references in D1.
 * Idempotent and safe to run on hourly schedule.
 */
export async function runMediaCleanup(env: Env): Promise<CleanupResult> {
  const now = new Date();
  const nowIso = now.toISOString();

  let expiredList: any[] = [];
  try {
    expiredList = await d1.getExpiredMedia(env.DB, nowIso);
  } catch (err: any) {
    console.error('[Cleanup Job] Error querying expired media from D1:', err);
    return {
      totalFound: 0,
      deleted: 0,
      failed: 0,
      timestamp: nowIso,
    };
  }

  if (expiredList.length === 0) {
    return {
      totalFound: 0,
      deleted: 0,
      failed: 0,
      timestamp: nowIso,
    };
  }

  console.log(`[Cleanup Job] Found ${expiredList.length} expired media asset(s) to delete (exceeded 72h limit).`);

  let deleted = 0;
  let failed = 0;

  for (const item of expiredList) {
    try {
      const delResult = await deleteFromCloudinary(item.providerPublicId, item.resourceType, env);

      if (delResult.success) {
        const deletedAt = new Date().toISOString();
        await d1.markMediaDeleted(env.DB, item.id, deletedAt);
        await d1.clearMediaUrlReferences(env.DB, item.mediaUrl);
        deleted++;
        console.log(`[Cleanup Job] ✅ Deleted ${item.resourceType} (${item.providerPublicId}) & nullified D1 references.`);
      } else {
        await d1.markMediaFailed(env.DB, item.id, delResult.error || 'Deletion failed');
        failed++;
        console.warn(`[Cleanup Job] ⚠️ Could not delete ${item.providerPublicId}: ${delResult.error}`);
      }
    } catch (itemErr: any) {
      failed++;
      console.error(`[Cleanup Job] ❌ Error processing item ${item.id}:`, itemErr);
      await d1.markMediaFailed(env.DB, item.id, itemErr.message || 'Unknown error').catch(() => {});
    }
  }

  console.log(`[Cleanup Job Summary] Total: ${expiredList.length}, Deleted: ${deleted}, Failed: ${failed}`);

  return {
    totalFound: expiredList.length,
    deleted,
    failed,
    timestamp: nowIso,
  };
}
