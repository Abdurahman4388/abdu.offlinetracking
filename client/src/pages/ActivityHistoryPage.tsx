import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext.js';
import { api } from '../services/api.js';
import { db } from '../db/index.js';
import { Activity, ACTIVITY_TYPES, ActivityType } from '@offline-tracker/shared';
import {
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';

export const ActivityHistoryPage: React.FC = () => {
  const { isOnline } = useNetwork();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType | 'ALL'>('ALL');

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      if (isOnline) {
        const serverActivities = await api.fetchRecentActivities();
        setActivities(serverActivities);
      } else {
        const localActs = await db.activities.reverse().sortBy('createdAt');
        setActivities(localActs);
      }
    } catch {
      const localActs = await db.activities.reverse().sortBy('createdAt');
      setActivities(localActs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [isOnline]);

  const filtered = activities.filter((act) => {
    if (selectedType !== 'ALL' && act.activityType !== selectedType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const descMatch = act.description.toLowerCase().includes(q);
      const repMatch = act.reportId.toLowerCase().includes(q);
      const actorMatch = act.actor?.name?.toLowerCase().includes(q);
      return descMatch || repMatch || actorMatch;
    }
    return true;
  });

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'CREATED':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'SUBMITTED':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'SYNCED':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'ASSIGNED':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'STATUS_CHANGED':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'REOPENED':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Global Activity Audit Log
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Immutable historical trail of all report creations, modifications, status transitions,
          assignments, and synchronization events.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities by description or report ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full sm:w-auto py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Event Types</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading activity stream...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No activity records found matching filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.map((act) => {
              const formattedDate = new Date(act.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={act.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(
                          act.activityType
                        )}`}
                      >
                        {act.activityType}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {act.actor?.name || 'Technician'}
                      </span>
                      <span className="text-[11px] text-slate-400">• {formattedDate}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {act.description}
                    </p>
                  </div>

                  <Link
                    to={`/reports/${act.reportId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 pt-1"
                  >
                    <span>View Report</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
