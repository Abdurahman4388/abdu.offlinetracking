import React from 'react';
import { Link } from 'react-router-dom';
import { Report } from '@offline-tracker/shared';
import { StatusBadge, PriorityBadge, SyncBadge } from '../common/Badge.js';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

interface ReportCardProps {
  report: Report;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const formattedDate = new Date(report.reportedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono text-slate-400">
            #{report.id.slice(0, 8)}
          </span>
          <div className="flex items-center gap-1.5">
            <SyncBadge syncStatus={report.syncStatus} />
            <PriorityBadge priority={report.priority} size="sm" />
          </div>
        </div>

        <div className="mb-2">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {report.category}
          </span>
          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
            {report.description}
          </p>
        </div>

        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{report.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <StatusBadge status={report.status} size="sm" />
        <Link
          to={`/reports/${report.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <span>View Details</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
