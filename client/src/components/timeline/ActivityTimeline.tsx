import React from 'react';
import { Activity } from '@offline-tracker/shared';
import {
  PlusCircle,
  FileEdit,
  Send,
  Cloud,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';

interface ActivityTimelineProps {
  activities: Activity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
        No activity history recorded yet.
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'CREATED':
        return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case 'EDITED':
        return <FileEdit className="w-4 h-4 text-slate-500" />;
      case 'SUBMITTED':
        return <Send className="w-4 h-4 text-indigo-500" />;
      case 'SYNCED':
        return <Cloud className="w-4 h-4 text-emerald-500" />;
      case 'ASSIGNED':
        return <UserCheck className="w-4 h-4 text-purple-500" />;
      case 'STATUS_CHANGED':
        return <RefreshCw className="w-4 h-4 text-amber-500" />;
      case 'RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'REOPENED':
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, idx) => {
          const isLast = idx === activities.length - 1;
          const formattedDate = new Date(activity.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <li key={activity.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                      {getIcon(activity.activityType)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {activity.actor?.name || 'Technician / System'}
                      </p>
                      <time className="text-[11px] text-slate-400">{formattedDate}</time>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {activity.description}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
