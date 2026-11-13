import { db } from '../db/index.js';
import { api } from './api.js';
import {
  Report,
  ReportFilterOptions,
  Activity,
  SyncQueueItem,
} from '@offline-tracker/shared';

export class ReportStorageService {
  /**
   * Save a report locally in Dexie and conditionally enqueue it for server synchronization
   */
  static async saveReportLocally(
    report: Report,
    enqueueForSync = true,
    activityMessage = 'Report saved locally'
  ): Promise<Report> {
    const now = new Date().toISOString();

    // 1. Commit to Dexie reports table
    await db.reports.put(report);

    // 2. Add local activity log
    const localActivity: Activity = {
      id: `act-local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reportId: report.id,
      activityType: report.status === 'SUBMITTED' ? 'SUBMITTED' : 'CREATED',
      description: activityMessage,
      actorId: report.createdBy,
      createdAt: now,
    };
    await db.activities.put(localActivity);

    // 3. Enqueue for background synchronization if required
    if (enqueueForSync) {
      const queueItem: SyncQueueItem = {
        id: report.id,
        reportId: report.id,
        action: 'CREATE',
        payload: report,
        attempts: 0,
        createdAt: now,
      };
      await db.syncQueue.put(queueItem);
    }

    return report;
  }

  /**
   * Fetch reports: merges offline drafts/pending with server records when online
   */
  static async getReports(
    filters: ReportFilterOptions = {},
    isOnline = true
  ): Promise<{ reports: Report[]; isFromCache: boolean }> {
    // If online, try pulling server records and cache them locally
    if (isOnline) {
      try {
        const { reports: serverReports } = await api.fetchReports(filters);

        // Store server reports into Dexie cache
        for (const sRep of serverReports) {
          const localMatch = await db.reports.get(sRep.id);
          // Preserve local pending changes if not yet synchronized
          if (!localMatch || localMatch.syncStatus === 'SYNCHRONIZED') {
            await db.reports.put(sRep);
          }
        }
      } catch (err) {
        console.warn('[ReportStorage] Could not reach server, falling back to local Dexie store');
      }
    }

    // Read all records from Dexie
    let collection = db.reports.toCollection();

    let allReports = await collection.reverse().sortBy('reportedAt');

    // Filter in-memory for offline consistency
    if (filters.category && filters.category !== 'ALL') {
      allReports = allReports.filter((r) => r.category === filters.category);
    }
    if (filters.priority && filters.priority !== 'ALL') {
      allReports = allReports.filter((r) => r.priority === filters.priority);
    }
    if (filters.status && filters.status !== 'ALL') {
      allReports = allReports.filter((r) => r.status === filters.status);
    }
    if (filters.syncStatus && filters.syncStatus !== 'ALL') {
      allReports = allReports.filter((r) => r.syncStatus === filters.syncStatus);
    }
    if (filters.createdBy) {
      allReports = allReports.filter((r) => r.createdBy === filters.createdBy);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      allReports = allReports.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    return {
      reports: allReports,
      isFromCache: !isOnline,
    };
  }

  /**
   * Get single report by ID
   */
  static async getReportById(id: string, isOnline = true): Promise<Report | undefined> {
    if (isOnline) {
      try {
        const serverReport = await api.fetchReportById(id);
        await db.reports.put(serverReport);
        return serverReport;
      } catch (err) {
        console.warn(`[ReportStorage] Server fetch failed for report ${id}, using local`);
      }
    }
    return await db.reports.get(id);
  }

  /**
   * Delete report (draft only)
   */
  static async deleteReport(id: string, actorId: string, isOnline = true): Promise<void> {
    await db.reports.delete(id);
    await db.syncQueue.delete(id);
    await db.activities.where('reportId').equals(id).delete();

    if (isOnline) {
      try {
        await api.deleteReport(id, actorId);
      } catch (e) {
        console.warn('[ReportStorage] Could not delete on server immediately');
      }
    }
  }

  /**
   * Get local activities for a report
   */
  static async getActivities(reportId: string, isOnline = true): Promise<Activity[]> {
    if (isOnline) {
      try {
        const serverActivities = await api.fetchReportActivities(reportId);
        for (const act of serverActivities) {
          await db.activities.put(act);
        }
        return serverActivities;
      } catch {
        // Fallback to local
      }
    }
    return await db.activities.where('reportId').equals(reportId).reverse().sortBy('createdAt');
  }
}

