import React from 'react';
import { Link } from 'react-router-dom';
import { Report } from '@offline-tracker/shared';
import { StatusBadge, PriorityBadge, SyncBadge } from '../common/Badge.js';
import { MapPin, ArrowUpRight } from 'lucide-react';

interface ReportTableProps {
  reports: Report[];
  isLoading?: boolean;
}

export const ReportTable: React.FC<ReportTableProps> = ({ reports, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full py-12 text-center text-xs text-slate-500 animate-pulse">
        Loading reports from storage...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="w-full py-16 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          No reports found matching your criteria.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Try clearing filters or create a new issue report.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
          <tr>
            <th scope="col" className="px-4 py-3.5">
              Issue / Category
            </th>
            <th scope="col" className="px-4 py-3.5">
              Location
            </th>
            <th scope="col" className="px-4 py-3.5">
              Priority
            </th>
            <th scope="col" className="px-4 py-3.5">
              Status
            </th>
            <th scope="col" className="px-4 py-3.5">
              Sync
            </th>
            <th scope="col" className="px-4 py-3.5">
              Assignee
            </th>
            <th scope="col" className="px-4 py-3.5">
              Reported
            </th>
            <th scope="col" className="px-4 py-3.5 text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {reports.map((report) => {
            const formattedDate = new Date(report.reportedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <tr
                key={report.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <td className="px-4 py-3 max-w-[240px]">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {report.category}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate" title={report.description}>
                    {report.description}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    #{report.id.slice(0, 8)}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[180px]">
                  <div className="flex items-center gap-1 truncate" title={report.location}>
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{report.location}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={report.priority} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={report.status} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <SyncBadge syncStatus={report.syncStatus} />
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {report.assignee ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 flex items-center justify-center font-bold text-[10px]">
                        {report.assignee.name.charAt(0)}
                      </span>
                      <span className="truncate text-xs">{report.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formattedDate}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/reports/${report.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    <span>Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
