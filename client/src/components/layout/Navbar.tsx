import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useNetwork } from '../../context/NetworkContext.js';
import { ThemeToggle } from '../common/ThemeToggle.js';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, users, switchUser, switchRole } = useAuth();
  const {
    isOnline,
    isSimulatedOffline,
    isSyncing,
    pendingSyncCount,
    failedSyncCount,
    triggerSync,
    toggleSimulatedOffline,
  } = useNetwork();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                Offline Field Issue Tracker
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              NilePixel Technologies Cohort 1
            </p>
          </div>
        </div>

        {/* Network & Role Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Sentinel Status Badge */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSimulatedOffline}
              title={`Network: ${isOnline ? 'Online' : 'Offline'}. Click to toggle simulated offline mode for testing.`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>{isSimulatedOffline ? 'Simulated Offline' : 'Offline'}</span>
                </>
              )}
            </button>
          </div>

          {/* Sync Trigger Pill (shows pending / failed syncs) */}
          {(pendingSyncCount > 0 || failedSyncCount > 0 || isSyncing) && (
            <button
              onClick={() => triggerSync(true)}
              disabled={isSyncing}
              title="Click to force synchronization of local offline queue"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shadow-sm ${
                isSyncing
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300'
                  : failedSyncCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Syncing...'
                  : `${pendingSyncCount} Pending${failedSyncCount > 0 ? ` (${failedSyncCount} failed)` : ''}`}
              </span>
            </button>
          )}

          {/* Simulated Role Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => switchRole('FIELD_WORKER')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                currentUser.role === 'FIELD_WORKER'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Field Worker
            </button>
            <button
              onClick={() => switchRole('COORDINATOR')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                currentUser.role === 'COORDINATOR'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Coordinator
            </button>
          </div>

          {/* User selector dropdown */}
          <select
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
            className="text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none hidden lg:block"
            title="Switch Simulated Active User"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role === 'FIELD_WORKER' ? 'Field' : 'Coord'})
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
