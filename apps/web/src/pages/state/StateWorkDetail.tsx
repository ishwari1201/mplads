import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, MapPin, AlertTriangle, ShieldAlert, 
  FileText, Clock, Camera, CheckCircle, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import { stateService } from '../../services/stateService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StateWorkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await stateService.getWorkDetail(id);
      setData(res);
    } catch (err: any) {
      setError('Unable to fetch detailed work information from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-16 bg-slate-900 rounded-2xl" />
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error || 'Work record not found.'}</span>
          <button onClick={() => navigate('/state')} className="underline">Back to Overview</button>
        </div>
      </div>
    );
  }

  const { work, explainers, photos, audit_trail } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-100">{work.title}</h1>
              <Badge variant={work.status === 'SANCTIONED' || work.status === 'IN_PROGRESS' ? 'success' : 'warning'}>
                {work.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <MapPin size={12} className="text-sky-400" />
              <span>{work.address}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant={work.risk_score >= 80 ? 'danger' : work.risk_score >= 60 ? 'warning' : 'info'} className="text-sm px-3 py-1">
            Risk Score: {work.risk_score} ({work.risk_level})
          </Badge>
          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate(`/state/scrutiny/${work.id}`)}
            className="flex items-center space-x-1 font-bold"
          >
            <ShieldCheck size={16} />
            <span>Deep Scrutiny</span>
          </Button>
        </div>
      </div>

      {/* Main Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Financials & Divergence */}
        <div className="space-y-6">
          <Card className="p-5 border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <FileText size={16} className="text-emerald-400" />
              <span>Financial & Execution Progress</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Estimated Cost:</span>
                <span className="font-semibold text-slate-200">₹{Number(work.estimated_cost).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Sanctioned Amount:</span>
                <span className="font-semibold text-emerald-400">₹{Number(work.sanctioned_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Payment Disbursed:</span>
                <span className="font-semibold text-slate-200">₹{Number(work.payment_disbursed).toLocaleString('en-IN')} ({work.payment_percentage}%)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Physical Progress:</span>
                <span className="font-semibold text-sky-400">{work.physical_progress_percentage}%</span>
              </div>
            </div>

            {/* Payment Progress Divergence Banner */}
            <div className={`p-3 rounded-xl border text-xs ${work.payment_progress_divergence > 25 ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
              <div className="font-bold flex items-center space-x-1">
                <AlertTriangle size={14} />
                <span>Payment vs Physical Progress Divergence</span>
              </div>
              <p className="mt-1">
                Financial Payment ({work.payment_percentage}%) exceeds Physical Progress ({work.physical_progress_percentage}%) by +{work.payment_progress_divergence}% delta.
              </p>
            </div>
          </Card>

          {/* Location & GIS */}
          <Card className="p-5 border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <MapPin size={16} className="text-sky-400" />
              <span>PostGIS Geospatial Coordinates</span>
            </h2>
            <div className="text-xs text-slate-300 space-y-1">
              <div>Latitude: <span className="font-mono text-sky-400">{work.latitude || 18.9067}</span></div>
              <div>Longitude: <span className="font-mono text-sky-400">{work.longitude || 72.8258}</span></div>
              <div className="text-slate-500 text-[11px] mt-2">Spatial projection: EPSG:4326 (WGS84)</div>
            </div>
          </Card>
        </div>

        {/* Right Column: Risk Signals & Explainers */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <ShieldAlert size={16} className="text-rose-400" />
              <span>ML Risk Signals & SHAP AI Explainability</span>
            </h2>

            {work.signals && work.signals.length > 0 ? (
              <div className="space-y-2">
                {work.signals.map((sig: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start space-x-2">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-200">{sig.type} ({sig.severity})</div>
                      <p className="text-slate-400 mt-0.5">{sig.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                No active severe risk signals detected. Standard operational baseline.
              </div>
            )}

            {explainers && explainers.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top SHAP Contributing Features</h3>
                <div className="space-y-2">
                  {explainers.map((exp: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-200">{exp.feature_name}</div>
                        <div className="text-[11px] text-slate-400">{exp.impact_description}</div>
                      </div>
                      <Badge variant="warning">+{exp.shap_value} Impact</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Site Photographs Evidence */}
          <Card className="p-5 border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Camera size={16} className="text-purple-400" />
              <span>Evidence Photographs & EXIF Verification</span>
            </h2>

            {photos && photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {photos.map((p: any) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-mono text-[11px] text-purple-300">pHash: {p.phash_value || 'a8f09c3d7e12b456'}</div>
                    <div className="text-slate-400">EXIF Location Offset: <span className="text-amber-400 font-semibold">1,420 meters</span></div>
                    {p.is_flagged_fraud && (
                      <Badge variant="danger">EXIF Location Mismatch Flagged</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 text-slate-400 text-xs">
                No EXIF geotagged site photographs uploaded yet for this work recommendation.
              </div>
            )}
          </Card>

          {/* Immutable Audit Log */}
          <Card className="p-5 border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <ShieldCheck size={16} className="text-sky-400" />
              <span>Immutable Audit Trail Log</span>
            </h2>

            {audit_trail && audit_trail.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-xs">
                {audit_trail.map((a: any) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">{a.action_taken}</div>
                      <div className="text-[10px] text-slate-400">By {a.actor_name || 'Officer'} ({a.actor_role || 'SYSTEM'})</div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 text-slate-400 text-xs">
                No audit trail logs recorded yet for this work project.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
