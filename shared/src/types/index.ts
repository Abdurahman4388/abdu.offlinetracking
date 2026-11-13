import {
  ReportCategory,
  ReportPriority,
  ReportStatus,
  SyncStatus,
  UserRole,
  ActivityType,
} from '../constants/index.js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Report {
  id: string;
  category: ReportCategory;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  priority: ReportPriority;
  status: ReportStatus;
  syncStatus: SyncStatus;
  imageUrl?: string | null;
  
  createdBy: string;
  creator?: User;
  
  assignedTo?: string | null;
  assignee?: User | null;
  
  rejectionReason?: string | null;
  resolutionNotes?: string | null;
  reopenReason?: string | null;

  version: number;
  reportedAt: string; // ISO string
  createdAt?: string;
  updatedAt?: string;

  activities?: Activity[];
  syncAttempts?: SyncAttempt[];
}

export interface Activity {
  id: string;
  reportId: string;
  activityType: ActivityType;
  description: string;
  actorId: string;
  actor?: User;
  metadata?: string | null;
  createdAt: string;
}

export interface SyncAttempt {
  id: string;
  reportId: string;
  attemptNumber: number;
  result: 'SUCCESS' | 'FAILED';
  errorMessage?: string | null;
  clientPayload?: string | null;
  attemptedAt: string;
}

export interface SyncQueueItem {
  id: string; // usually reportId or queueId
  reportId: string;
  action: 'CREATE' | 'UPDATE' | 'TRANSITION';
  payload: Partial<Report>;
  attempts: number;
  lastAttemptAt?: string | null;
  nextRetryAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  draft: number;
  submitted: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  pendingSync: number;
  failedSync: number;
  priorityDistribution: Record<ReportPriority, number>;
  categoryDistribution: Record<ReportCategory, number>;
}

export interface ReportFilterOptions {
  category?: ReportCategory | 'ALL';
  priority?: ReportPriority | 'ALL';
  status?: ReportStatus | 'ALL';
  syncStatus?: SyncStatus | 'ALL';
  assignedTo?: string | 'ALL';
  createdBy?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

