import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNetwork } from '../context/NetworkContext.js';
import { ReportStorageService } from '../services/reportStorage.js';
import { Report, Activity } from '@offline-tracker/shared';
import { ReportCard } from '../components/reports/ReportCard.js';
import { ActivityTimeline } from '../components/timeline/ActivityTimeline.js';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const FieldWorkerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { isOnline, isSyncing, pendingSyncCount, failedSyncCount, triggerSync } = useNetwork();

  const [myReports, setMyReports] = useState<Report[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { reports } = await ReportStorageService.getReports(
        { createdBy: currentUser.id },
        isOnline
      );
      setMyReports(reports);

      // Load activities
      if (reports.length > 0) {
        const acts = await ReportStorageService.getActivities(reports[0].id, isOnline);
        setRecentActivities(acts.slice(0, 8));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id, isOnline]);

  const inProgressCount = myReports.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length;
  const resolvedCount = myReports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Technician Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-2">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Field Worker Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs text-blue-200/90 mt-1 max-w-xl">
              Report infrastructure defects on-site. Any reports created while disconnected are
              stored securely in IndexedDB and will be synced upon reconnection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/reports/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-blue-950 hover:bg-blue-50 transition-colors shadow-sm shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Create New Report</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>My Total Reports</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {myReports.length}
          </div>
          <span className="text-[11px] text-slate-400">Local & Server records</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pending Sync Queue</span>
            <RefreshCw
              className={`w-4 h-4 text-amber-500 ${isSyncing ? 'animate-spin' : ''}`}
            />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {pendingSyncCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>{failedSyncCount > 0 ? `${failedSyncCount} failed` : 'Guaranteed in DB'}</span>
            {pendingSyncCount > 0 && isOnline && (
              <button
                onClick={() => triggerSync(true)}
                disabled={isSyncing}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active / In Progress</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {inProgressCount}
          </div>
          <span className="text-[11px] text-slate-400">Assigned & maintenance</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Resolved Issues</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </div>
          <span className="text-[11px] text-slate-400">Verified & closed</span>
        </div>
      </div>

      {/* Main Grid: My Recent Reports & Local Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              My Recent Submissions
            </h2>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading reports...</div>
          ) : myReports.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
              <p className="text-xs text-slate-500">You have not submitted any reports yet.</p>
              <Link
                to="/reports/create"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Your First Report</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports.slice(0, 4).map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Recent Timeline Activities
          </h2>
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ActivityTimeline activities={recentActivities} />
          </div>
        </div>
      </div>
    </div>
  );
};
