import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SyncEngine, SyncProgressCallback } from '../services/syncEngine.js';
import { api } from '../services/api.js';

interface NetworkContextType {
  isOnline: boolean;
  isReachable: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  failedSyncCount: number;
  lastSyncedAt?: string;
  lastError?: string;
  triggerSync: (force?: boolean) => Promise<void>;
  toggleSimulatedOffline: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [browserOnline, setBrowserOnline] = useState<boolean>(navigator.onLine);
  const [isReachable, setIsReachable] = useState<boolean>(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    return localStorage.getItem('fit_simulated_offline') === 'true';
  });

  const [syncState, setSyncState] = useState<{
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
    lastSyncedAt?: string;
    lastError?: string;
  }>({
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
  });

  // Effective online status takes simulation into account
  const isOnline = browserOnline && !isSimulatedOffline && isReachable;

  // Active heartbeat ping
  const checkReachability = useCallback(async () => {
    if (!navigator.onLine || isSimulatedOffline) {
      setIsReachable(false);
      return;
    }
    try {
      const health = await api.checkHealth();
      setIsReachable(health.status === 'ok');
    } catch {
      setIsReachable(false);
    }
  }, [isSimulatedOffline]);

  // Network event listeners
  useEffect(() => {
    const handleOnline = () => {
      setBrowserOnline(true);
      checkReachability().then(() => {
        // Trigger auto sync on connectivity restoration
        SyncEngine.processQueue();
      });
    };

    const handleOffline = () => {
      setBrowserOnline(false);
      setIsReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkReachability();

    // Heartbeat every 12 seconds
    const interval = setInterval(checkReachability, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkReachability]);

  // Subscribe to SyncEngine updates
  useEffect(() => {
    const handleSyncUpdate: SyncProgressCallback = (status) => {
      setSyncState(status);
    };

    const unsubscribe = SyncEngine.subscribe(handleSyncUpdate);
    SyncEngine.startPeriodicSync(20000);

    return () => {
      unsubscribe();
      SyncEngine.stopPeriodicSync();
    };
  }, []);

  const triggerSync = async (force = false) => {
    if (!isOnline && !force) return;
    await SyncEngine.processQueue(force);
  };

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      localStorage.setItem('fit_simulated_offline', String(next));
      if (!next) {
        // Turning back online: trigger reachability check and queue flush
        setTimeout(() => {
          checkReachability().then(() => SyncEngine.processQueue());
        }, 300);
      }
      return next;
    });
  };

  const value = {
    isOnline,
    isReachable,
    isSimulatedOffline,
    isSyncing: syncState.isSyncing,
    pendingSyncCount: syncState.pendingCount,
    failedSyncCount: syncState.failedCount,
    lastSyncedAt: syncState.lastSyncedAt,
    lastError: syncState.lastError,
    triggerSync,
    toggleSimulatedOffline,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

