import React from 'react';
import { ReportPriority, ReportCategory } from '@offline-tracker/shared';

interface PriorityChartProps {
  data: Record<ReportPriority, number>;
}

export const PriorityChart: React.FC<PriorityChartProps> = ({ data }) => {
  const total = Object.values(data).reduce((acc, curr) => acc + curr, 0);

  const colors: Record<ReportPriority, { bg: string; text: string; fill: string }> = {
    Low: { bg: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400', fill: '#94a3b8' },
    Medium: { bg: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', fill: '#0ea5e9' },
    High: { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', fill: '#f59e0b' },
    Critical: { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', fill: '#f43f5e' },
  };

  const priorities: ReportPriority[] = ['Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="space-y-4">
      {/* Stacked Bar */}
      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
        {total === 0 ? (
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-full" />
        ) : (
          priorities.map((priority) => {
            const count = data[priority] || 0;
            const pct = (count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={priority}
                style={{ width: `${pct}%` }}
                className={`h-full ${colors[priority].bg} transition-all duration-500`}
                title={`${priority}: ${count} (${Math.round(pct)}%)`}
              />
            );
          })
        )}
      </div>

      {/* Legend & Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        {priorities.map((priority) => {
          const count = data[priority] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={priority}
              className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60"
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className={`w-2 h-2 rounded-full ${colors[priority].bg}`} />
                <span>{priority}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{count}</span>
                <span className="text-[11px] text-slate-400">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface CategoryChartProps {
  data: Record<ReportCategory, number>;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const entries = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const max = entries.length > 0 ? Math.max(...entries.map(([_, c]) => c)) : 1;

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No category data available to display.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([cat, count]) => {
        const pct = Math.round((count / max) * 100);
        return (
          <div key={cat} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                {cat}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${pct}%` }}
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

