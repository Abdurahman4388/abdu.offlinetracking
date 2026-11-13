import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext.js';
import { api } from '../services/api.js';
import { ReportStorageService } from '../services/reportStorage.js';
import { DashboardStats, Report, Activity } from '@offline-tracker/shared';
import { PriorityChart, CategoryChart } from '../components/charts/DistributionChart.js';
import { ReportTable } from '../components/reports/ReportTable.js';
import { ActivityTimeline } from '../components/timeline/ActivityTimeline.js';
import {
  Layers,
  AlertOctagon,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { isOnline } = useNetwork();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [unassignedReports, setUnassignedReports] = useState<Report[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isOnline) {
        const [serverStats, serverReports, serverActs] = await Promise.all([
          api.fetchStats(),
          api.fetchReports({ status: 'SUBMITTED', limit: 6 }),
          api.fetchRecentActivities(),
        ]);
        setStats(serverStats);
        setUnassignedReports(serverReports.reports);
        setRecentActivities(serverActs.slice(0, 8));
      } else {
        // Compute stats locally from Dexie
        const { reports } = await ReportStorageService.getReports({}, false);
        const sub = reports.filter((r) => r.status === 'SUBMITTED');
        setUnassignedReports(sub.slice(0, 6));

        // Basic local stats
        const priorityDistribution: any = { Low: 0, Medium: 0, High: 0, Critical: 0 };
        const categoryDistribution: any = {};
        for (const r of reports) {
          if (r.priority in priorityDistribution) priorityDistribution[r.priority]++;
          categoryDistribution[r.category] = (categoryDistribution[r.category] || 0) + 1;
        }

        setStats({
          total: reports.length,
          draft: reports.filter((r) => r.status === 'DRAFT').length,
          submitted: sub.length,
          assigned: reports.filter((r) => r.status === 'ASSIGNED').length,
          inProgress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
          resolved: reports.filter((r) => r.status === 'RESOLVED').length,
          rejected: reports.filter((r) => r.status === 'REJECTED').length,
          pendingSync: 0,
          failedSync: 0,
          priorityDistribution,
          categoryDistribution,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isOnline]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Coordinator Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Operations Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Infrastructure Coordination Hub
            </h1>
            <p className="text-xs text-purple-200/90 mt-1 max-w-xl">
              Monitor incoming defect reports, triage regional infrastructure emergencies, assign
              field specialists, and manage report status transitions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-sm shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              <span>Review All Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Reports</span>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats?.total ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">All submissions</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Submitted</span>
          <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats?.submitted ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Awaiting triage</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Assigned</span>
          <div className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats?.assigned ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Technician appointed</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">In Progress</span>
          <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats?.inProgress ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Active maintenance</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Resolved</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.resolved ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Completed & closed</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Rejected</span>
          <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats?.rejected ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">With documented reason</span>
        </div>
      </div>

      {/* Distribution Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Priority Distribution
              </h3>
              <AlertOctagon className="w-4 h-4 text-slate-400" />
            </div>
            <PriorityChart data={stats.priorityDistribution} />
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Category Distribution
              </h3>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <CategoryChart data={stats.categoryDistribution} />
          </div>
        </div>
      )}

      {/* Triage Queue & Global Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Incoming Issues Requiring Triage & Assignment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Newly submitted reports from field staff waiting for technician dispatch.
              </p>
            </div>
            <Link
              to="/reports?status=SUBMITTED"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              <span>View All Incoming</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <ReportTable reports={unassignedReports} isLoading={isLoading} />
        </div>

        {/* Global Activity Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Audit Event Stream
            </h2>
            <Link
              to="/activities"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ActivityTimeline activities={recentActivities} />
          </div>
        </div>
      </div>
    </div>
  );
};
