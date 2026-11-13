import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useNetwork } from '../../context/NetworkContext.js';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  History,
  Settings,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser, isCoordinator } = useAuth();
  const { pendingSyncCount, isOnline } = useNetwork();

  const links = [
    {
      to: '/dashboard',
      label: isCoordinator ? 'Management Overview' : 'Technician Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/reports',
      label: 'All Issues & Reports',
      icon: FileSpreadsheet,
    },
    {
      to: '/reports/create',
      label: 'Report New Issue',
      icon: PlusCircle,
      highlight: true,
    },
    {
      to: '/activities',
      label: 'Activity History',
      icon: History,
    },
    {
      to: '/settings',
      label: 'Diagnostics & Storage',
      icon: Settings,
      badge: pendingSyncCount > 0 ? pendingSyncCount : undefined,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-6">
        {/* User Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center gap-3">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {currentUser.name}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isCoordinator ? 'bg-purple-500' : 'bg-blue-500'
                }`}
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                {currentUser.role.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                  } ${link.highlight ? 'border border-blue-200 dark:border-blue-900/50' : ''}`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      link.highlight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Offline Status */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-2 border border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              IndexedDB Storage
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ● Auto-synchronizing with server
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Offline. Changes queued.
              </span>
            )}
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            NilePixel Technologies • Cohort 1
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Graduation Capstone Project • Offline-First
          </p>
        </div>
      </div>
    </aside>
  );
};
