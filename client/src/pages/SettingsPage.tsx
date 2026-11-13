import React, { useState, useEffect } from 'react';
import { useNetwork } from '../context/NetworkContext.js';
import { useAuth } from '../context/AuthContext.js';
import { db, clearLocalDatabase } from '../db/index.js';
import { api } from '../services/api.js';
import {
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Server,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    isOnline,
    isSimulatedOffline,
    isSyncing,
    lastSyncedAt,
    lastError,
    triggerSync,
    toggleSimulatedOffline,
  } = useNetwork();

  const { currentUser, users, switchUser } = useAuth();

  // Local storage counts
  const [localReportCount, setLocalReportCount] = useState(0);
  const [localQueueCount, setLocalQueueCount] = useState(0);
  const [localActivityCount, setLocalActivityCount] = useState(0);
  const [healthStatus, setHealthStatus] = useState<string>('Unknown');
  const [isPinging, setIsPinging] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshCounts = async () => {
    try {
      const [rCount, qCount, aCount] = await Promise.all([
        db.reports.count(),
        db.syncQueue.count(),
        db.activities.count(),
      ]);
      setLocalReportCount(rCount);
      setLocalQueueCount(qCount);
      setLocalActivityCount(aCount);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePingServer = async () => {
    setIsPinging(true);
    try {
      const res = await api.checkHealth();
      setHealthStatus(`Online (${res.status}) - ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      setHealthStatus(`Unreachable: ${err.message}`);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    refreshCounts();
    handlePingServer();
  }, [isOnline]);

  const handleClearDatabase = async () => {
    if (
      !window.confirm(
        'Warning: This will clear all locally cached reports, pending queue items, and offline activities from IndexedDB. Continue?'
      )
    ) {
      return;
    }
    await clearLocalDatabase();
    await refreshCounts();
    setNotification('IndexedDB database cleared successfully.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          System Diagnostics & Offline Engine
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor IndexedDB telemetry, test offline network resilience, and configure simulated
          environment states.
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Connection & Offline Simulation Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Network & Heartbeat Sentinel
              </h2>
              <p className="text-xs text-slate-500">
                Status: {isOnline ? 'Online & Reaching Central API' : 'Disconnected / Offline Mode'}
              </p>
            </div>
          </div>

          <button
            onClick={handlePingServer}
            disabled={isPinging}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Server className={`w-3.5 h-3.5 ${isPinging ? 'animate-pulse text-blue-500' : ''}`} />
            <span>Ping Server</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block text-[11px]">Browser Online Flag:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {navigator.onLine ? 'navigator.onLine = true' : 'navigator.onLine = false'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Backend API Heartbeat:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{healthStatus}</span>
          </div>
        </div>

        {/* Offline Simulation Switcher */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Simulated Offline Mode
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                Demo Feature
              </span>
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Force the app to simulate total network disconnection without needing to disable Wi-Fi.
              Ideal for evaluating graduation project offline requirements!
            </p>
          </div>

          <button
            onClick={toggleSimulatedOffline}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
              isSimulatedOffline
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
            }`}
          >
            {isSimulatedOffline ? 'Disable (Go Online)' : 'Simulate Offline'}
          </button>
        </div>
      </div>

      {/* IndexedDB Local Engine Stats */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              IndexedDB Storage Telemetry (Dexie.js)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Database: OfflineFieldTrackerDB
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Reports in Dexie
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {localReportCount}
            </div>
            <span className="text-[10px] text-slate-400">Cached & local creations</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Sync Queue Items
            </span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {localQueueCount}
            </div>
            <span className="text-[10px] text-slate-400">Waiting for server egress</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Stored Audit Activities
            </span>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {localActivityCount}
            </div>
            <span className="text-[10px] text-slate-400">IndexedDB event trail</span>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            <span>Last Synced: </span>
            <strong className="text-slate-700 dark:text-slate-300">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Not yet'}
            </strong>
            {lastError && <span className="text-rose-500 ml-2">({lastError})</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerSync(true)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Force Sync Queue'}</span>
            </button>

            <button
              onClick={handleClearDatabase}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Demo Accounts Reference */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Graduation Demo Accounts & User Switcher
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map((u) => {
            const isSelected = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      u.role === 'COORDINATOR'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                    }`}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {u.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">{u.email}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    u.role === 'COORDINATOR'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}
                >
                  {u.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graduation Defense & Evaluation Quick Guide */}
      <div className="p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            Graduation Defense • Quick Evaluation Steps for Reviewers
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
            Cohort 1
          </span>
        </div>
        <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside leading-relaxed">
          <li>
            <strong>Test Offline Capture:</strong> Toggle <em>Simulate Offline</em> on this page or in the navbar.
          </li>
          <li>
            <strong>Create an Issue:</strong> Go to <em>Report New Issue</em>, enter details, and submit. Check the banner—it shows 1 pending sync queued in IndexedDB.
          </li>
          <li>
            <strong>Test Refresh Persistence:</strong> Refresh the browser tab (F5). The report remains fully accessible.
          </li>
          <li>
            <strong>Test Auto-Sync:</strong> Disable simulated offline mode. Watch the sentinel detect connectivity and automatically sync with the server.
          </li>
          <li>
            <strong>Test Coordinator Workflow:</strong> Switch to Coordinator in the navbar. Open the report, assign a technician, and resolve it with documented notes.
          </li>
        </ol>
      </div>
    </div>
  );
};
