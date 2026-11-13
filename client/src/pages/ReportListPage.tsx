import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext.js';
import { ReportStorageService } from '../services/reportStorage.js';
import {
  Report,
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
  REPORT_STATUSES,
  SYNC_STATUSES,
  ReportCategory,
  ReportPriority,
  ReportStatus,
  SyncStatus,
} from '@offline-tracker/shared';
import { ReportTable } from '../components/reports/ReportTable.js';
import { ReportCard } from '../components/reports/ReportCard.js';
import {
  Search,
  Filter,
  PlusCircle,
  LayoutGrid,
  List,
  RotateCcw,
} from 'lucide-react';

export const ReportListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOnline } = useNetwork();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters
  const search = searchParams.get('search') || '';
  const category = (searchParams.get('category') as ReportCategory | 'ALL') || 'ALL';
  const priority = (searchParams.get('priority') as ReportPriority | 'ALL') || 'ALL';
  const status = (searchParams.get('status') as ReportStatus | 'ALL') || 'ALL';
  const syncStatus = (searchParams.get('syncStatus') as SyncStatus | 'ALL') || 'ALL';

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'ALL') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const result = await ReportStorageService.getReports(
        {
          search,
          category,
          priority,
          status,
          syncStatus,
        },
        isOnline
      );
      setReports(result.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [search, category, priority, status, syncStatus, isOnline]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Infrastructure Issue Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View, filter, and triage all infrastructure incidents across regional zones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Card grid view"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/reports/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Report</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by keywords, location, ID or category..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              {REPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
              <Filter className="w-3.5 h-3.5" /> Quick Filters:
            </span>

            {/* Priority Filter */}
            <select
              value={priority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">Any Priority</option>
              {REPORT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  Priority: {p}
                </option>
              ))}
            </select>

            {/* Sync Status Filter */}
            <select
              value={syncStatus}
              onChange={(e) => updateFilter('syncStatus', e.target.value)}
              className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">Any Sync State</option>
              {SYNC_STATUSES.map((ss) => (
                <option key={ss} value={ss}>
                  Sync: {ss}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
              {reports.length} {reports.length === 1 ? 'record' : 'records'} found
            </span>
            {(search || category !== 'ALL' || priority !== 'ALL' || status !== 'ALL' || syncStatus !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reports Display (Table or Grid) */}
      {viewMode === 'table' ? (
        <ReportTable reports={reports} isLoading={isLoading} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};

