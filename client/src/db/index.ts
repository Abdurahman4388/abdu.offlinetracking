import Dexie, { Table } from 'dexie';
import { Report, SyncQueueItem, Activity } from '@offline-tracker/shared';

export interface MetadataEntry {
  key: string;
  value: any;
  updatedAt: string;
}

export class FieldTrackerDatabase extends Dexie {
  reports!: Table<Report, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  activities!: Table<Activity, string>;
  metadata!: Table<MetadataEntry, string>;

  constructor() {
    super('OfflineFieldTrackerDB');
    this.version(1).stores({
      reports: 'id, category, priority, status, syncStatus, createdBy, assignedTo, reportedAt, version',
      syncQueue: 'id, reportId, action, attempts, nextRetryAt, createdAt',
      activities: 'id, reportId, activityType, actorId, createdAt',
      metadata: 'key',
    });
  }
}

export const db = new FieldTrackerDatabase();

/**
 * Reset local database (useful for testing and graduation defense resets)
 */
export async function clearLocalDatabase() {
  await db.transaction('rw', db.reports, db.syncQueue, db.activities, db.metadata, async () => {
    await db.reports.clear();
    await db.syncQueue.clear();
    await db.activities.clear();
    await db.metadata.clear();
  });
}

