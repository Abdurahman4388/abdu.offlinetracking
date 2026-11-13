import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNetwork } from '../context/NetworkContext.js';
import { ReportStorageService } from '../services/reportStorage.js';
import { api } from '../services/api.js';
import {
  Report,
  Activity,
  ReportStatus,
} from '@offline-tracker/shared';
import { StatusBadge, PriorityBadge, SyncBadge } from '../components/common/Badge.js';
import { ActivityTimeline } from '../components/timeline/ActivityTimeline.js';
import {
  RejectModal,
  ResolveModal,
  ReopenModal,
  AssignModal,
  EditDraftModal,
} from '../components/workflow/WorkflowModals.js';
import {
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Play,
  UserCheck,
  Send,
  Trash2,
  AlertOctagon,
  RefreshCw,
  FileEdit,
} from 'lucide-react';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const { isOnline } = useNetwork();

  const [report, setReport] = useState<Report | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEditDraftOpen, setIsEditDraftOpen] = useState(false);

  const loadReportData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const rep = await ReportStorageService.getReportById(id, isOnline);
      if (rep) {
        setReport(rep);
        const acts = await ReportStorageService.getActivities(id, isOnline);
        setActivities(acts);
      }
    } catch (err: any) {
      setActionError(err.message || 'Could not load report details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [id, isOnline]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 animate-pulse">
        Retrieving report #{id?.slice(0, 8)}...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Report not found in local storage or server.
        </p>
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Issues</span>
        </Link>
      </div>
    );
  }

  // Workflow Handlers
  const handleTransitionStatus = async (
    targetStatus: ReportStatus,
    extra: { rejectionReason?: string; resolutionNotes?: string; reopenReason?: string } = {}
  ) => {
    setActionError(null);
    try {
      if (isOnline) {
        const updated = await api.transitionStatus(report.id, {
          targetStatus,
          actorId: currentUser.id,
          ...extra,
        });
        setReport(updated);
        setSuccessToast(`Status updated to ${targetStatus}`);
        loadReportData();
      } else {
        // Offline transition simulation: update locally in Dexie
        const updated: Report = {
          ...report,
          status: targetStatus,
          rejectionReason: extra.rejectionReason ?? report.rejectionReason,
          resolutionNotes: extra.resolutionNotes ?? report.resolutionNotes,
          reopenReason: extra.reopenReason ?? report.reopenReason,
          syncStatus: 'PENDING',
          version: report.version + 1,
        };

        await ReportStorageService.saveReportLocally(
          updated,
          true,
          `Status transitioned to ${targetStatus} (Offline Queue)`
        );
        setReport(updated);
        setSuccessToast(`Status updated to ${targetStatus} in offline store`);
        loadReportData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Workflow transition failed');
    }
  };

  const handleAssign = async (technicianId: string) => {
    setActionError(null);
    try {
      if (isOnline) {
        const updated = await api.assignReport(report.id, technicianId, currentUser.id);
        setReport(updated);
        setSuccessToast('Technician assigned successfully');
        loadReportData();
      } else {
        const tech = users.find((u) => u.id === technicianId);
        const updated: Report = {
          ...report,
          assignedTo: technicianId,
          assignee: tech,
          status: report.status === 'SUBMITTED' ? 'ASSIGNED' : report.status,
          syncStatus: 'PENDING',
          version: report.version + 1,
        };
        await ReportStorageService.saveReportLocally(
          updated,
          true,
          `Assigned to ${tech?.name || technicianId} (Offline Queue)`
        );
        setReport(updated);
        setSuccessToast('Assigned locally; queued for synchronization');
        loadReportData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign personnel');
    }
  };

  const handleDeleteDraft = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this draft report?')) return;
    try {
      await ReportStorageService.deleteReport(report.id, currentUser.id, isOnline);
      navigate('/reports');
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete report');
    }
  };

  const handleSaveDraft = async (updatedData: Partial<Report>) => {
    setActionError(null);
    try {
      const updated: Report = {
        ...report,
        ...updatedData,
        version: report.version + 1,
      };
      await ReportStorageService.saveReportLocally(
        updated,
        false,
        'Draft report details updated'
      );
      if (isOnline) {
        try {
          await api.updateReport(report.id, { ...updatedData, actorId: currentUser.id });
        } catch {
          // Keep offline/local
        }
      }
      setReport(updated);
      setSuccessToast('Draft updated successfully');
      loadReportData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update draft');
    }
  };

  const formattedDate = new Date(report.reportedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <div>
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Issue Registry</span>
        </Link>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="p-4 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs font-bold">
            ×
          </button>
        </div>
      )}

      {successToast && (
        <div className="p-4 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </span>
          <button onClick={() => setSuccessToast(null)} className="text-xs font-bold">
            ×
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">
                #{report.id}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Version {report.version}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {report.category}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <SyncBadge syncStatus={report.syncStatus} />
            <PriorityBadge priority={report.priority} />
            <StatusBadge status={report.status} />
          </div>
        </div>

        {/* Location & Reported Date */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{report.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Reported: {formattedDate}</span>
          </div>
          {report.latitude && report.longitude && (
            <div className="text-[11px] font-mono text-slate-400">
              GPS: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </div>
          )}
        </div>
      </div>

      {/* Description & Photo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Defect Description */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Defect Description & Symptoms
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {report.description}
            </p>
          </div>

          {/* Rejection / Resolution Callouts if applicable */}
          {report.status === 'REJECTED' && report.rejectionReason && (
            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertOctagon className="w-4 h-4" />
                <span>Rejection Notice</span>
              </div>
              <p className="text-xs">{report.rejectionReason}</p>
            </div>
          )}

          {report.status === 'RESOLVED' && report.resolutionNotes && (
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolution Documentation</span>
              </div>
              <p className="text-xs">{report.resolutionNotes}</p>
            </div>
          )}

          {report.reopenReason && report.status === 'ASSIGNED' && (
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-1">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Reopened Reason:
              </span>
              <p className="text-xs">{report.reopenReason}</p>
            </div>
          )}

          {/* Photo Preview */}
          {report.imageUrl && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                On-Site Evidence Photo
              </h3>
              <img
                src={report.imageUrl}
                alt="Infrastructure Defect"
                className="w-full max-h-96 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
              />
            </div>
          )}

          {/* Activity Timeline */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audit Timeline & Historical Events
            </h3>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Sidebar: Workflow Actions & Stakeholder Info */}
        <div className="space-y-6">
          {/* Dynamic Workflow Actions Panel */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Workflow Controls
            </h3>

            {/* DRAFT ACTIONS */}
            {report.status === 'DRAFT' && (
              <div className="space-y-2">
                <button
                  onClick={() => handleTransitionStatus('SUBMITTED')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Coordinator Queue</span>
                </button>
                <button
                  onClick={() => setIsEditDraftOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <FileEdit className="w-3.5 h-3.5 text-blue-500" />
                  <span>Edit Draft Details</span>
                </button>
                {report.createdBy === currentUser.id && (
                  <button
                    onClick={handleDeleteDraft}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Local Draft</span>
                  </button>
                )}
              </div>
            )}

            {/* SUBMITTED ACTIONS */}
            {report.status === 'SUBMITTED' && (
              <div className="space-y-2">
                <button
                  onClick={() => setIsAssignOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign Technician</span>
                </button>
                <button
                  onClick={() => setIsRejectOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject with Reason</span>
                </button>
              </div>
            )}

            {/* ASSIGNED ACTIONS */}
            {report.status === 'ASSIGNED' && (
              <div className="space-y-2">
                <button
                  onClick={() => handleTransitionStatus('IN_PROGRESS')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Mark Work In Progress</span>
                </button>
                <button
                  onClick={() => setIsAssignOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Reassign Personnel</span>
                </button>
                <button
                  onClick={() => setIsRejectOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Report</span>
                </button>
              </div>
            )}

            {/* IN_PROGRESS ACTIONS */}
            {report.status === 'IN_PROGRESS' && (
              <div className="space-y-2">
                <button
                  onClick={() => setIsResolveOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve with Notes</span>
                </button>
              </div>
            )}

            {/* RESOLVED ACTIONS */}
            {report.status === 'RESOLVED' && (
              <div className="space-y-2">
                <button
                  onClick={() => setIsReopenOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 transition-colors border border-amber-200 dark:border-amber-800"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reopen Resolved Issue</span>
                </button>
              </div>
            )}

            {/* REJECTED ACTIONS */}
            {report.status === 'REJECTED' && (
              <p className="text-xs text-slate-400 italic">
                This report has reached a terminal rejected state.
              </p>
            )}
          </div>

          {/* Stakeholders Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned Personnel & Creator
            </h3>

            {/* Creator */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Created By:</span>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {report.creator?.name ? report.creator.name.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {report.creator?.name || report.createdBy}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {report.creator?.role || 'Field Technician'}
                  </div>
                </div>
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">Assigned Technician:</span>
              {report.assignee ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                    {report.assignee.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {report.assignee.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{report.assignee.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">No specialist assigned yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Modals */}
      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        reportId={report.id}
        onConfirm={async (reason) => {
          await handleTransitionStatus('REJECTED', { rejectionReason: reason });
        }}
      />

      <ResolveModal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        reportId={report.id}
        onConfirm={async (notes) => {
          await handleTransitionStatus('RESOLVED', { resolutionNotes: notes });
        }}
      />

      <ReopenModal
        isOpen={isReopenOpen}
        onClose={() => setIsReopenOpen(false)}
        reportId={report.id}
        onConfirm={async (reason) => {
          await handleTransitionStatus('ASSIGNED', { reopenReason: reason });
        }}
      />

      <AssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        reportId={report.id}
        users={users}
        currentAssigneeId={report.assignedTo}
        onConfirm={handleAssign}
      />

      <EditDraftModal
        isOpen={isEditDraftOpen}
        onClose={() => setIsEditDraftOpen(false)}
        report={report}
        onSave={handleSaveDraft}
      />
    </div>
  );
};
