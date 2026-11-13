import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNetwork } from '../context/NetworkContext.js';
import {
  HardDrive,
  Wifi,
  WifiOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  RefreshCw,
  Layers,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole } = useAuth();
  const { isOnline, pendingSyncCount } = useNetwork();

  const handleSelectRole = (role: 'FIELD_WORKER' | 'COORDINATOR') => {
    switchRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <HardDrive className="w-3.5 h-3.5" />
          <span>NilePixel Technologies • Cohort 1 Graduation Project</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Offline Field Issue Tracker
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          An enterprise-grade, offline-first infrastructure issue reporting and lifecycle
          management platform. Create reports anywhere with zero connectivity; automatically
          synchronize when online with guaranteed idempotency.
        </p>

        {/* Live Network & Sync Banner */}
        <div className="pt-2 flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-700 dark:text-emerald-400">System Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-400">IndexedDB Local Mode</span>
              </>
            )}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-500 dark:text-slate-400">
            {pendingSyncCount} mutations in local queue
          </span>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Field Worker Card */}
        <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Field Worker Portal
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Designed for field technicians operating on-site in remote, zero-connectivity
                zones.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Create infrastructure issues with full offline persistence</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Draft reports stored in IndexedDB surviving device restarts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Automatic background synchronization with exponential retry</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Track personal report history and repair progress</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectRole('FIELD_WORKER')}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span>Launch as Field Worker</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Coordinator Card */}
        <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Regional Coordinator Portal
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Management console for reviewing, triaging, assigning, and resolving issues.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Global review table with multi-factor filtering & search</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Assign maintenance responsibility to field personnel</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Enforce strict lifecycle transitions (Draft → Resolved / Rejected)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Full audit timeline and telemetry of sync attempts</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectRole('COORDINATOR')}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
          >
            <span>Launch as Coordinator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-slate-100">
            <Database className="w-4 h-4 text-blue-500" />
            <span>IndexedDB via Dexie.js</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Local browser storage provides true persistence surviving refreshes, tab closures, and
            device restarts.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-slate-100">
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            <span>Idempotent Sync Engine</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            UUID generation client-side with exponential backoff guarantees no duplicate server
            records and safe network interruptions.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-slate-100">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>Relational Prisma SQLite</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Authoritative server-side state machine with strict status validation and immutable
            audit activity logging.
          </p>
        </div>
      </div>
    </div>
  );
};

