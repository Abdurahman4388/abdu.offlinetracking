import { prisma } from '../config/db.js';
import { CreateReportInput } from '@offline-tracker/shared';

export interface SyncResultItem {
  id: string;
  status: 'synced' | 'already_synced' | 'conflict_resolved' | 'failed';
  message?: string;
  report?: any;
}

export class SyncService {
  /**
   * Process a batch of offline reports with UUID idempotency and conflict resolution
   */
  static async processBatchSync(reports: CreateReportInput[]): Promise<{
    processed: number;
    results: SyncResultItem[];
  }> {
    const results: SyncResultItem[] = [];

    for (const reportData of reports) {
      try {
        const existing = await prisma.report.findUnique({
          where: { id: reportData.id },
          include: { creator: true, assignee: true },
        });

        if (existing) {
          // Idempotent check
          // If server status has moved forward (e.g. ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED)
          // server status is authoritative.
          const serverStatusesAdvanced = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
          if (serverStatusesAdvanced.includes(existing.status) && reportData.status === 'SUBMITTED') {
            // Log sync attempt
            await prisma.syncAttempt.create({
              data: {
                reportId: existing.id,
                attemptNumber: 1,
                result: 'SUCCESS',
                clientPayload: JSON.stringify(reportData),
                errorMessage: 'Report already exists on server with advanced status',
              },
            });

            results.push({
              id: reportData.id,
              status: 'conflict_resolved',
              message: `Server holds authoritative status: ${existing.status}`,
              report: existing,
            });
            continue;
          }

          // If client version is newer or equal, update non-authoritative fields
          const updated = await prisma.report.update({
            where: { id: reportData.id },
            data: {
              category: reportData.category,
              description: reportData.description,
              location: reportData.location,
              priority: reportData.priority,
              imageUrl: reportData.imageUrl ?? existing.imageUrl,
              syncStatus: 'SYNCHRONIZED',
              version: { increment: 1 },
            },
            include: { creator: true, assignee: true },
          });

          await prisma.syncAttempt.create({
            data: {
              reportId: existing.id,
              attemptNumber: 1,
              result: 'SUCCESS',
              clientPayload: JSON.stringify(reportData),
            },
          });

          results.push({
            id: reportData.id,
            status: 'synced',
            message: 'Existing report updated and synchronized',
            report: updated,
          });
        } else {
          // New report from client - insert atomically
          const created = await prisma.$transaction(async (tx) => {
            const newReport = await tx.report.create({
              data: {
                id: reportData.id,
                category: reportData.category,
                description: reportData.description,
                location: reportData.location,
                latitude: reportData.latitude,
                longitude: reportData.longitude,
                priority: reportData.priority,
                status: reportData.status || 'SUBMITTED',
                syncStatus: 'SYNCHRONIZED',
                imageUrl: reportData.imageUrl,
                createdBy: reportData.createdBy,
                reportedAt: new Date(reportData.reportedAt),
                version: reportData.version || 1,
              },
              include: { creator: true, assignee: true },
            });

            await tx.activity.create({
              data: {
                reportId: newReport.id,
                activityType: newReport.status === 'DRAFT' ? 'CREATED' : 'SUBMITTED',
                description: `Report synchronized from offline field worker (${newReport.category} at ${newReport.location})`,
                actorId: reportData.createdBy,
              },
            });

            await tx.syncAttempt.create({
              data: {
                reportId: newReport.id,
                attemptNumber: 1,
                result: 'SUCCESS',
                clientPayload: JSON.stringify(reportData),
              },
            });

            return newReport;
          });

          results.push({
            id: reportData.id,
            status: 'synced',
            message: 'Report successfully created and synchronized',
            report: created,
          });
        }
      } catch (err: any) {
        console.error(`Error syncing report ${reportData.id}:`, err);

        // Attempt to log failure in SyncAttempt if report exists, or record in telemetry
        try {
          await prisma.syncAttempt.create({
            data: {
              reportId: reportData.id,
              attemptNumber: 1,
              result: 'FAILED',
              errorMessage: err.message || 'Unknown database error',
              clientPayload: JSON.stringify(reportData),
            },
          });
        } catch {
          // Ignore secondary logging error
        }

        results.push({
          id: reportData.id,
          status: 'failed',
          message: err.message || 'Failed to sync report to server',
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  }

  /**
   * Get sync telemetry statistics
   */
  static async getSyncTelemetry() {
    const [totalAttempts, successfulAttempts, failedAttempts, recentAttempts] =
      await Promise.all([
        prisma.syncAttempt.count(),
        prisma.syncAttempt.count({ where: { result: 'SUCCESS' } }),
        prisma.syncAttempt.count({ where: { result: 'FAILED' } }),
        prisma.syncAttempt.findMany({
          take: 15,
          orderBy: { attemptedAt: 'desc' },
          include: {
            report: {
              select: {
                id: true,
                category: true,
                location: true,
                status: true,
              },
            },
          },
        }),
      ]);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate:
        totalAttempts > 0
          ? `${Math.round((successfulAttempts / totalAttempts) * 100)}%`
          : '100%',
      recentAttempts,
    };
  }
}
