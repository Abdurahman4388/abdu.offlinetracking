import { prisma } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  ReportStatus,
  isValidStatusTransition,
  VALID_STATUS_TRANSITIONS,
} from '@offline-tracker/shared';

export interface TransitionOptions {
  actorId: string;
  targetStatus: ReportStatus;
  rejectionReason?: string;
  resolutionNotes?: string;
  reopenReason?: string;
}

export class WorkflowService {
  /**
   * Transition a report from its current status to a target status with validation and audit logging
   */
  static async transitionStatus(reportId: string, options: TransitionOptions) {
    const { targetStatus, actorId, rejectionReason, resolutionNotes, reopenReason } = options;

    return await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new AppError('Report not found', 404);
      }

      const currentStatus = report.status as ReportStatus;

      // Validate transition
      if (!isValidStatusTransition(currentStatus, targetStatus)) {
        const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
        throw new AppError(
          `Invalid status transition from "${currentStatus}" to "${targetStatus}". Allowed next statuses: [${allowed.join(
            ', '
          )}]`,
          422
        );
      }

      // Additional business logic validations
      if (targetStatus === 'REJECTED' && (!rejectionReason || rejectionReason.trim().length < 5)) {
        throw new AppError('A valid rejection reason (min 5 characters) is required', 422);
      }

      if (targetStatus === 'RESOLVED' && (!resolutionNotes || resolutionNotes.trim().length < 5)) {
        throw new AppError('Resolution notes (min 5 characters) are required', 422);
      }

      if (currentStatus === 'RESOLVED' && targetStatus === 'ASSIGNED' && (!reopenReason || reopenReason.trim().length < 5)) {
        throw new AppError('A documented reason is required to reopen a resolved report', 422);
      }

      // Determine activity type & description
      let activityType = 'STATUS_CHANGED';
      let activityDescription = `Status changed from ${currentStatus} to ${targetStatus}`;

      if (targetStatus === 'REJECTED') {
        activityType = 'REJECTED';
        activityDescription = `Report rejected. Reason: ${rejectionReason}`;
      } else if (targetStatus === 'RESOLVED') {
        activityType = 'RESOLVED';
        activityDescription = `Issue marked as resolved. Notes: ${resolutionNotes}`;
      } else if (currentStatus === 'RESOLVED' && targetStatus === 'ASSIGNED') {
        activityType = 'REOPENED';
        activityDescription = `Issue reopened. Reason: ${reopenReason}`;
      }

      // Update Report
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          status: targetStatus,
          rejectionReason: rejectionReason ?? report.rejectionReason,
          resolutionNotes: resolutionNotes ?? report.resolutionNotes,
          reopenReason: reopenReason ?? report.reopenReason,
          version: { increment: 1 },
        },
        include: {
          creator: true,
          assignee: true,
          activities: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Log Activity Record
      await tx.activity.create({
        data: {
          reportId,
          activityType,
          description: activityDescription,
          actorId,
          metadata: JSON.stringify({
            previousStatus: currentStatus,
            newStatus: targetStatus,
            rejectionReason,
            resolutionNotes,
            reopenReason,
          }),
        },
      });

      return updatedReport;
    });
  }

  /**
   * Assign a report to a maintenance technician
   */
  static async assignReport(reportId: string, assignedTo: string, actorId: string) {
    return await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new AppError('Report not found', 404);
      }

      const technician = await tx.user.findUnique({
        where: { id: assignedTo },
      });

      if (!technician) {
        throw new AppError('Assigned user not found', 404);
      }

      // If status is currently SUBMITTED, assigning automatically transitions it to ASSIGNED
      let nextStatus = report.status;
      if (report.status === 'SUBMITTED') {
        nextStatus = 'ASSIGNED';
      }

      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          assignedTo,
          status: nextStatus,
          version: { increment: 1 },
        },
        include: {
          creator: true,
          assignee: true,
        },
      });

      await tx.activity.create({
        data: {
          reportId,
          activityType: 'ASSIGNED',
          description: `Assigned to technician ${technician.name} (${technician.role})`,
          actorId,
          metadata: JSON.stringify({
            assignedToId: technician.id,
            assignedToName: technician.name,
            newStatus: nextStatus,
          }),
        },
      });

      return updatedReport;
    });
  }
}

