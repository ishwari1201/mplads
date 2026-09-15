import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { publicService } from '../../services/publicService';
import { WorkRecommendation } from '../../types/project';
import {
  AlertTriangle,
  CheckCircle2,
  Navigation,
  UploadCloud,
  MapPin,
  FileText,
  Camera,
  Info
} from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWork?: WorkRecommendation | null;
  availableWorks?: WorkRecommendation[];
}

const CITIZEN_OBSERVATION_CATEGORIES = [
  { value: 'WORK_NOT_COMPLETED', label: '1. Work does not appear completed' },
  { value: 'WORK_INCOMPLETE', label: '2. Work is incomplete / partially built' },
  { value: 'WORK_DAMAGED', label: '3. Work appears damaged or deteriorated' },
  { value: 'LOCATION_INCORRECT', label: '4. Work location appears incorrect on map' },
  { value: 'WORK_NOT_VISIBLE', label: '5. Work is not visible at this location' },
  { value: 'QUALITY_CONCERNING', label: '6. Work quality appears concerning' },
  { value: 'INFO_INCORRECT', label: '7. Work information / signboard appears incorrect' },
  { value: 'OTHER_OBSERVATION', label: '8. Other ground observation' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  selectedWork: initialSelectedWork = null,
  availableWorks = [],
}) => {
  const [reportType, setReportType] = useState<'KNOWN_WORK' | 'UNLISTED_WORK'>(
    initialSelectedWork ? 'KNOWN_WORK' : 'KNOWN_WORK'
  );

  const [selectedWorkId, setSelectedWorkId] = useState<string>(initialSelectedWork?.id || '');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [category, setCategory] = useState(CITIZEN_OBSERVATION_CATEGORIES[0].value);
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Optional Browser GPS evidence state
  const [citizenLat, setCitizenLat] = useState<number | null>(null);
  const [citizenLng, setCitizenLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const requestBrowserGps = () => {
    setGpsLoading(true);
    setGpsMessage(null);

    if (!navigator.geolocation) {
      setGpsMessage('Browser Geolocation is unavailable. Report will be submitted without GPS.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCitizenLat(pos.coords.latitude);
        setCitizenLng(pos.coords.longitude);
        setGpsMessage(`Captured location: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS capture skipped or denied:', err.message);
        setGpsMessage('GPS skipped. Your report will be accepted without GPS coordinates.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please enter a description of your ground observation.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    if (reportType === 'KNOWN_WORK' && selectedWorkId) {
      formData.append('work_id', selectedWorkId);
    }
    formData.append('category', category);
    formData.append('description', description.trim());
    formData.append('reporter_name', reporterName.trim() || 'Anonymous Citizen');
    formData.append('reporter_email', reporterEmail.trim() || '');

    if (citizenLat !== null && citizenLng !== null) {
      formData.append('latitude', citizenLat.toString());
      formData.append('longitude', citizenLng.toString());
    }

    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      const res = await publicService.submitCitizenReport(formData);
      setSubmissionResult(res);
    } catch (err: any) {
      console.error('Error submitting citizen report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSubmissionResult(null);
    setDescription('');
    setReporterName('');
    setReporterEmail('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setCitizenLat(null);
    setCitizenLng(null);
    setGpsMessage(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Report Ground Observation / Work Issue">
      {submissionResult ? (
        <div className="p-5 space-y-4">
          <div className="p-5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-center space-y-3">
            <CheckCircle2 size={44} className="mx-auto text-emerald-400" />
            <h4 className="text-base font-bold text-slate-100">Thank You for Your Feedback</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your observation report has been successfully recorded in the PostgreSQL database and forwarded to the government authority for physical ground review.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="gold" onClick={resetAndClose} className="px-6 text-xs">
              Close Window
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CITIZEN POLICY BANNER */}
          <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-start space-x-2 text-sky-200 text-xs leading-relaxed">
            <Info size={18} className="text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong>LOCATION & PRIVACY POLICY:</strong> Browser GPS is completely optional. You can report on any work regardless of your location. Your feedback provides ground reality context for public transparency.
            </div>
          </div>

          {/* REPORT TYPE SELECTOR */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReportType('KNOWN_WORK')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                reportType === 'KNOWN_WORK'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <FileText size={16} />
              <span>Report Known Work</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('UNLISTED_WORK')}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                reportType === 'UNLISTED_WORK'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <AlertTriangle size={16} />
              <span>Report Unlisted Work</span>
            </button>
          </div>

          {/* WORK SELECTOR IF KNOWN WORK */}
          {reportType === 'KNOWN_WORK' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Public MPLADS Work
              </label>
              {availableWorks.length > 0 ? (
                <select
                  value={selectedWorkId}
                  onChange={(e) => setSelectedWorkId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Select Work from Directory --</option>
                  {availableWorks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title} ({w.address || 'Location Unspecified'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Work ID or Work Title"
                  value={selectedWorkId}
                  onChange={(e) => setSelectedWorkId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              )}
            </div>
          )}

          {/* CITIZEN OBSERVATION CATEGORY */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              What do you observe on the ground?
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {CITIZEN_OBSERVATION_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Description of Ground Reality
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you see at the site (e.g., work claims to be complete but construction is unfinished, site missing signboard, etc.)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* OPTIONAL CITIZEN GPS ATTACHMENT */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Navigation size={14} className="text-sky-400" />
                <span>Attach Current Location (Optional Context)</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={requestBrowserGps}
                disabled={gpsLoading}
                className="text-[11px] py-1 h-7"
              >
                {gpsLoading ? 'Capturing...' : citizenLat !== null ? 'Re-capture GPS' : 'Attach My GPS'}
              </Button>
            </div>
            {gpsMessage && <p className="text-[11px] text-sky-400 font-mono">{gpsMessage}</p>}
          </div>

          {/* OPTIONAL PHOTO ATTACHMENT */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <Camera size={14} className="text-sky-400" />
              <span>Attach Site Photo (Optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-950 file:text-sky-300 hover:file:bg-sky-900 cursor-pointer"
            />
            {photoPreview && (
              <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700">
                <img src={photoPreview} alt="Site preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* REPORTER INFO (OPTIONAL) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name (Optional)</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Anonymous Citizen"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email / Phone (Optional)</label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* FORM ACTIONS */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" disabled={loading} className="px-5">
              {loading ? 'Submitting...' : 'Submit Ground Report'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
