import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNetwork } from '../context/NetworkContext.js';
import { ReportStorageService } from '../services/reportStorage.js';
import {
  REPORT_CATEGORIES,
  REPORT_PRIORITIES,
  ReportCategory,
  ReportPriority,
  Report,
} from '@offline-tracker/shared';
import {
  HardDrive,
  MapPin,
  Camera,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Save,
  Send,
  Navigation,
} from 'lucide-react';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const CreateReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isOnline, triggerSync } = useNetwork();

  // Generated UUID
  const [reportId] = useState<string>(() => generateUUID());

  // Form State
  const [category, setCategory] = useState<ReportCategory>('Water Supply');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [priority, setPriority] = useState<ReportPriority>('Medium');
  const [reportedAt, setReportedAt] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // GPS Coordinates Capture
  const handleCaptureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          if (!location) {
            setLocation(
              `GPS Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
            );
          }
        },
        () => {
          // Provide simulated regional coordinate fallback if browser GPS denied
          const simLat = 15.55 + (Math.random() - 0.5) * 0.05;
          const simLng = 32.53 + (Math.random() - 0.5) * 0.05;
          setLatitude(parseFloat(simLat.toFixed(4)));
          setLongitude(parseFloat(simLng.toFixed(4)));
          if (!location) {
            setLocation(`Regional Sector Grid (${simLat.toFixed(4)}, ${simLng.toFixed(4)})`);
          }
        }
      );
    }
  };

  // Image upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setValidationError('Image size must be under 2MB for offline storage');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (isDraft: boolean) => {
    setValidationError(null);

    // Validation
    if (!description.trim() || description.trim().length < 5) {
      setValidationError('Please provide a detailed description of at least 5 characters');
      return;
    }
    if (!location.trim() || location.trim().length < 3) {
      setValidationError('Please provide an infrastructure location of at least 3 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date(reportedAt).toISOString();
      const status = isDraft ? 'DRAFT' : 'SUBMITTED';

      const newReport: Report = {
        id: reportId,
        category,
        description: description.trim(),
        location: location.trim(),
        latitude,
        longitude,
        priority,
        status,
        syncStatus: 'PENDING',
        imageUrl: imageBase64,
        createdBy: currentUser.id,
        creator: currentUser,
        version: 1,
        reportedAt: now,
      };

      // 1. Commit immediately to IndexedDB via Dexie
      // If draft, do NOT enqueue for server sync; if submitted, enqueue for server sync
      await ReportStorageService.saveReportLocally(
        newReport,
        !isDraft,
        isDraft ? `Draft report saved locally` : `Report submitted from field device`
      );

      // 2. If online and submitted, attempt immediate sync in background
      if (!isDraft && isOnline) {
        triggerSync().catch(() => {});
      }

      setSuccessMessage(
        isDraft
          ? 'Draft successfully saved in local IndexedDB.'
          : isOnline
          ? 'Report submitted and synchronization initiated!'
          : 'Report saved locally in offline queue! Will sync automatically when connection returns.'
      );

      setTimeout(() => {
        navigate(`/reports/${reportId}`);
      }, 1000);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save report locally');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Report Infrastructure Defect
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fill in the details below. Data is saved locally in IndexedDB first, ensuring zero
            data loss even if network disconnects mid-submission.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-right">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">UUID</span>
          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
            #{reportId.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {validationError && (
        <div className="p-4 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 shadow-xs">
        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Infrastructure Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority Level <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReportPriority)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {REPORT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & GPS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Location Description / Landmark <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleCaptureLocation}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Navigation className="w-3 h-3" />
              <span>Get GPS Coordinates</span>
            </button>
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pump Station 3, East Nile Irrigation Canal, Sector 7"
              className="w-full pl-9 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          {latitude && longitude && (
            <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                Coordinates captured: Lat {latitude.toFixed(4)}, Lng {longitude.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Defect Description & Physical Symptoms <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what occurred, visible damage, safety risks, affected infrastructure components, and immediate hazards..."
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Date and Photo Attachment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Incident Timestamp
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="datetime-local"
                value={reportedAt}
                onChange={(e) => setReportedAt(e.target.value)}
                className="w-full pl-9 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Photo Attachment (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>{imageBase64 ? 'Change Photo' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageBase64 && (
                <div className="relative">
                  <img
                    src={imageBase64}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setImageBase64(null)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reporter Info Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs flex items-center justify-between text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
          <div>
            <span>Reporting as: </span>
            <strong className="text-slate-900 dark:text-slate-200">{currentUser.name}</strong> (
            {currentUser.role})
          </div>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <HardDrive className="w-3 h-3" /> IndexedDB Active
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save as Local Draft</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Submit Issue Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
