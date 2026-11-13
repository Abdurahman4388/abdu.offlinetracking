import React from 'react';
import { useNetwork } from '../../context/NetworkContext.js';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export const NetworkBanner: React.FC = () => {
  const { isOnline, isSimulatedOffline, pendingSyncCount, isSyncing, triggerSync, toggleSimulatedOffline } =
    useNetwork();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      className={`w-full py-2 px-4 text-xs font-medium flex items-center justify-between border-b transition-colors ${
        !isOnline
          ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800/60'
          : 'bg-blue-500/10 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800/60'
      }`}
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span>
            {!isOnline
              ? isSimulatedOffline
                ? 'Simulated Offline Mode active. You can create reports; all mutations are safely stored in IndexedDB.'
                : 'Offline: Internet connection unavailable. All reports and activities are saved locally in IndexedDB.'
              : `${pendingSyncCount} local reports pending synchronization.`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSimulatedOffline && (
            <button
              onClick={toggleSimulatedOffline}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Go Online
            </button>
          )}

          {pendingSyncCount > 0 && isOnline && (
            <button
              onClick={() => triggerSync(true)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

