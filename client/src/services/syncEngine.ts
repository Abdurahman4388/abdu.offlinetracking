import { db } from '../db/index.js';
import { api } from './api.js';
import { Report } from '@offline-tracker/shared';

export interface SyncProgressCallback {
  (status: {
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
    lastSyncedAt?: string;
    lastError?: string;
  }): void;
}

export class SyncEngine {
  private static isRunning = false;
  private static subscribers: Set<SyncProgressCallback> = new Set();
  private static syncInterval: any = null;

  /**
   * Subscribe to sync state changes
   */
  static subscribe(callback: SyncProgressCallback): () => void {
    this.subscribers.add(callback);
    this.notifySubscribers();
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private static async notifySubscribers(lastError?: string) {
    const pendingCount = await db.syncQueue.count();
    const failedReports = await db.reports.where('syncStatus').equals('FAILED').count();
    const meta = await db.metadata.get('lastSyncedAt');

    for (const callback of this.subscribers) {
      callback({
        isSyncing: this.isRunning,
        pendingCount,
        failedCount: failedReports,
        lastSyncedAt: meta?.value,
        lastError,
      });
    }
  }

  /**
   * Start periodic synchronization background check (every 30 seconds when active)
   */
  static startPeriodicSync(intervalMs = 30000) {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  static stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Main Queue Processor: checks network, retrieves eligible queue items,
   * pushes batch to backend, updates local state idempotently.
   */
  static async processQueue(force = false): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
  }> {
    if (this.isRunning) {
      return { success: false, syncedCount: 0, failedCount: 0 };
    }

    // 1. Verify actual network connectivity via health heartbeat
    try {
      const health = await api.checkHealth();
      if (!health || health.status !== 'ok') {
        return { success: false, syncedCount: 0, failedCount: 0 };
      }
    } catch {
      // Cannot reach backend API - keep records offline safely
      return { success: false, syncedCount: 0, failedCount: 0 };
    }

    this.isRunning = true;
    await this.notifySubscribers();

    let syncedCount = 0;
    let failedCount = 0;
    let lastError: string | undefined;

    try {
      const now = new Date();
      const allQueueItems = await db.syncQueue.toArray();

      // Filter eligible items: either forced or nextRetryAt is in the past / not set
      const eligibleItems = allQueueItems.filter((item) => {
        if (force) return true;
        if (!item.nextRetryAt) return true;
        return new Date(item.nextRetryAt) <= now;
      });

      if (eligibleItems.length === 0) {
        this.isRunning = false;
        await this.notifySubscribers();
        return { success: true, syncedCount: 0, failedCount: 0 };
      }

      // Mark local reports as SYNCHRONIZING
      for (const item of eligibleItems) {
        await db.reports.update(item.reportId, { syncStatus: 'SYNCHRONIZING' });
      }

      // Gather payloads
      const payloads: Partial<Report>[] = eligibleItems.map((item) => item.payload);

      // Send batch to backend
      const response = await api.syncBatchReports(payloads);

      // Process server results
      for (const result of response.results) {
        const queueItem = eligibleItems.find((i) => i.reportId === result.id);
        if (!queueItem) continue;

        if (result.status === 'synced' || result.status === 'conflict_resolved') {
          // Success! Remove from sync queue
          await db.syncQueue.delete(queueItem.id);

          // Update local report
          await db.reports.update(result.id, {
            syncStatus: 'SYNCHRONIZED',
            ...(result.report ? result.report : {}),
          });

          // Add local activity record confirming synchronization
          await db.activities.put({
            id: `act-sync-${Date.now()}-${result.id.slice(0, 4)}`,
            reportId: result.id,
            activityType: 'SYNCED',
            description: 'Report successfully synchronized with central backend',
            actorId: queueItem.payload.createdBy || 'system',
            createdAt: new Date().toISOString(),
          });

          syncedCount++;
        } else {
          // Failure for specific item: compute exponential backoff
          const attempts = (queueItem.attempts || 0) + 1;
          const backoffDelaySeconds = Math.min(60, Math.pow(2, attempts));
          const nextRetry = new Date(Date.now() + backoffDelaySeconds * 1000).toISOString();

          await db.syncQueue.update(queueItem.id, {
            attempts,
            lastAttemptAt: new Date().toISOString(),
            nextRetryAt: nextRetry,
            errorMessage: result.message || 'Synchronization rejected by server',
          });

          await db.reports.update(result.id, { syncStatus: 'FAILED' });

          failedCount++;
          lastError = result.message;
        }
      }

      // Update last sync time metadata
      await db.metadata.put({
        key: 'lastSyncedAt',
        value: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      lastError = err.message || 'Batch synchronization failed';
      console.error('[SyncEngine] Error during processQueue:', err);

      // Mark affected items back to FAILED/PENDING with backoff
      const items = await db.syncQueue.toArray();
      for (const item of items) {
        const attempts = (item.attempts || 0) + 1;
        const backoffSeconds = Math.min(60, Math.pow(2, attempts));
        const nextRetry = new Date(Date.now() + backoffSeconds * 1000).toISOString();

        await db.syncQueue.update(item.id, {
          attempts,
          lastAttemptAt: new Date().toISOString(),
          nextRetryAt: nextRetry,
          errorMessage: lastError,
        });

        await db.reports.update(item.reportId, { syncStatus: 'FAILED' });
      }
    } finally {
      this.isRunning = false;
      await this.notifySubscribers(lastError);
    }

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
    };
  }
}

