export const REPORT_CATEGORIES = [
  'Water Supply',
  'Electricity',
  'Roads and Transportation',
  'School Infrastructure',
  'Healthcare Infrastructure',
  'Equipment Damage',
  'Public Safety',
  'Communication Services',
  'Other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export type ReportPriority = (typeof REPORT_PRIORITIES)[number];

export const REPORT_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const SYNC_STATUSES = [
  'PENDING',
  'SYNCHRONIZING',
  'SYNCHRONIZED',
  'FAILED',
] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const USER_ROLES = ['FIELD_WORKER', 'COORDINATOR'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ACTIVITY_TYPES = [
  'CREATED',
  'EDITED',
  'SUBMITTED',
  'SYNCED',
  'SYNC_FAILED',
  'ASSIGNED',
  'STATUS_CHANGED',
  'RESOLVED',
  'REJECTED',
  'REOPENED',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/**
 * Valid Status Transitions
 * - DRAFT -> SUBMITTED
 * - SUBMITTED -> ASSIGNED
 * - SUBMITTED -> REJECTED
 * - ASSIGNED -> IN_PROGRESS
 * - ASSIGNED -> REJECTED
 * - IN_PROGRESS -> RESOLVED
 * - RESOLVED -> ASSIGNED (Reopen)
 */
export const VALID_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['ASSIGNED'], // Reopening goes back to ASSIGNED with reason
  REJECTED: [], // Terminal
};

export function isValidStatusTransition(
  from: ReportStatus,
  to: ReportStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

