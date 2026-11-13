import React from 'react';
import { ReportStatus, ReportPriority, SyncStatus } from '@offline-tracker/shared';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  RefreshCw,
  FileEdit,
  ArrowUpRight,
} from 'lucide-react';

export const StatusBadge: React.FC<{ status: ReportStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const styles: Record<ReportStatus, { bg: string; text: string; icon: any; label: string }> = {
    DRAFT: {
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      text: 'Draft',
      icon: FileEdit,
      label: 'Draft',
    },
    SUBMITTED: {
      bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      text: 'Submitted',
      icon: Clock,
      label: 'Submitted',
    },
    ASSIGNED: {
      bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      text: 'Assigned',
      icon: ArrowUpRight,
      label: 'Assigned',
    },
    IN_PROGRESS: {
      bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      text: 'In Progress',
      icon: RefreshCw,
      label: 'In Progress',
    },
    RESOLVED: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      text: 'Resolved',
      icon: CheckCircle2,
      label: 'Resolved',
    },
    REJECTED: {
      bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      text: 'Rejected',
      icon: XCircle,
      label: 'Rejected',
    },
  };

  const item = styles[status] || styles.DRAFT;
  const Icon = item.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${item.bg}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{item.label}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: ReportPriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'md',
}) => {
  const styles: Record<ReportPriority, { bg: string; icon: any }> = {
    Low: {
      bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: Clock,
    },
    Medium: {
      bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      icon: AlertTriangle,
    },
    High: {
      bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
    },
    Critical: {
      bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      icon: AlertOctagon,
    },
  };

  const item = styles[priority] || styles.Low;
  const Icon = item.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${item.bg}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{priority}</span>
    </span>
  );
};

export const SyncBadge: React.FC<{ syncStatus: SyncStatus }> = ({ syncStatus }) => {
  const map: Record<SyncStatus, { label: string; bg: string; dot: string; pulse?: boolean }> = {
    SYNCHRONIZED: {
      label: 'Synced',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    PENDING: {
      label: 'Pending Sync',
      bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    SYNCHRONIZING: {
      label: 'Syncing...',
      bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
      pulse: true,
    },
    FAILED: {
      label: 'Sync Failed',
      bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
  };

  const conf = map[syncStatus] || map.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.bg}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${conf.dot} ${conf.pulse ? 'animate-ping' : ''}`}
      />
      <span>{conf.label}</span>
    </span>
  );
};

