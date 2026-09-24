import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mpService } from '../../services/mpService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LocationPickerMap } from '../../components/map/LocationPickerMap';
import { AlertTriangle, CheckCircle2, MapPin, DollarSign, Calendar, Clock } from 'lucide-react';

export const RecommendationForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  // Form State with SLA Input
  const [form, setForm] = useState({
    title: '',
    sector: 'Drinking Water Facilities',
    category: 'GENERAL',
    estimated_cost: '',
    address: '',
    description: '',
    latitude: '',
    longitude: '',
    sla_target_days: '75',
  });

  const handleMapLocationSelect = (lat: number, lng: number, displayAddress?: string) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      address: displayAddress || prev.address,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const targetDays = parseInt(form.sla_target_days || '75');
      const targetDate = new Date(Date.now() + targetDays * 86400000).toISOString().slice(0, 10);
      const latVal = form.latitude ? parseFloat(form.latitude) : 18.9067;
      const lngVal = form.longitude ? parseFloat(form.longitude) : 72.8258;

      const res = await mpService.submitRecommendation({
        title: form.title,
        description: form.description,
        sector: form.sector,
        category: form.category as any,
        estimated_cost: parseFloat(form.estimated_cost),
        address: form.address,
        latitude: latVal,
        longitude: lngVal,
      });

      // Save to shared localStorage state for instant live cross-portal sync with DA & IA
      const existingStr = localStorage.getItem('mplads_submitted_recommendations');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newRec = {
        id: res.project?.id || `p${Date.now()}`,
        recommendation_no: `REC-2026-MH01-${Math.floor(100 + Math.random() * 900)}`,
        title: form.title,
        description: form.description,
        sector: form.sector,
        category: form.category,
        estimated_cost: parseFloat(form.estimated_cost),
        sanctioned_amount: parseFloat(form.estimated_cost),
        status: 'RECOMMENDED',
        address: form.address,
        latitude: latVal,
        longitude: lngVal,
        sla_target_days: targetDays,
        days_remaining: targetDays,
        target_completion_date: targetDate,
        sla_deadline: new Date(Date.now() + targetDays * 86400000).toISOString(),
        created_at: new Date().toISOString(),
        is_sla_breached: targetDays > 75,
        mp_name: 'Hon. Rajesh Sharma (MP)',
      };
      localStorage.setItem('mplads_submitted_recommendations', JSON.stringify([newRec, ...existing]));

      setSuccessResult(res);
      setTimeout(() => navigate('/mp/recommendations'), 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed submitting recommendation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Submit Work Recommendation</h2>
          <p className="text-xs text-slate-600">MPLADS Statutory Proposal Submission Form with SLA Schedule Control</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/mp')}>Back to Dashboard</Button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-3">
          <AlertTriangle size={20} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successResult && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 size={20} />
              <span>Recommendation Submitted & Registered in PostGIS Database!</span>
            </div>
            <p className="text-xs text-slate-700">Project ID: {successResult.project.id}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-slate-900">
            <span>Project Proposal Specification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Title / Project Name *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Installation of Solar RO Drinking Water Plant in Colaba School"
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sector Category *</label>
                <select
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs font-medium"
                >
                  <option value="Drinking Water Facilities">Drinking Water Facilities</option>
                  <option value="Sanitation & Public Toilets">Sanitation & Public Toilets</option>
                  <option value="Education & School Infrastructure">Education & School Infrastructure</option>
                  <option value="Roads, Bridges & Footpaths">Roads, Bridges & Footpaths</option>
                  <option value="Public Health & Ambulances">Public Health & Ambulances</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Category Quota *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs font-medium"
                >
                  <option value="GENERAL">GENERAL Public Infrastructure</option>
                  <option value="SC">SC Reserved Quota (15% Min)</option>
                  <option value="ST">ST Reserved Quota (7.5% Min)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Budget (INR ₹) *</label>
                <input
                  type="number"
                  required
                  value={form.estimated_cost}
                  onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                  placeholder="e.g. 2500000"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
                />
              </div>

              {/* STATUTORY SLA TARGET COMPLETION SCHEDULE INPUT */}
              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1 flex items-center space-x-1">
                  <Clock size={14} />
                  <span>Statutory SLA Target Schedule *</span>
                </label>
                <select
                  value={form.sla_target_days}
                  onChange={(e) => setForm({ ...form, sla_target_days: e.target.value })}
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2.5 text-xs text-amber-900 focus:outline-none focus:border-amber-500 font-bold shadow-xs"
                >
                  <option value="45">45 Days (Fast-Track Schedule)</option>
                  <option value="60">60 Days (Accelerated Schedule)</option>
                  <option value="75">75 Days (Statutory SLA Window)</option>
                  <option value="90">90 Days (Extended Schedule — SLA Overrun)</option>
                  <option value="120">120 Days (Major Infrastructure — SLA Overrun)</option>
                </select>
              </div>
            </div>

            {/* INTERACTIVE GIS MAP LOCATION PICKER */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-sky-800 flex items-center space-x-1.5">
                <MapPin size={14} />
                <span>GIS Work Site Location Picker (Search & Click Pin to Auto-Fill Coordinates)</span>
              </label>
              <LocationPickerMap
                selectedLat={form.latitude ? parseFloat(form.latitude) : null}
                selectedLng={form.longitude ? parseFloat(form.longitude) : null}
                onLocationSelect={handleMapLocationSelect}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Location Address *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. Municipal Secondary School Grounds, Ward 4, Fort, Mumbai"
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude Coordinate</label>
                <input
                  type="text"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="18.9067"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude Coordinate</label>
                <input
                  type="text"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="72.8258"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Technical Description & Scope *</label>
              <textarea
                rows={4}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe intended beneficiaries, scope of work, technical components, and public utility..."
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => navigate('/mp')}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Submitting & Verifying...' : 'Submit Recommendation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
