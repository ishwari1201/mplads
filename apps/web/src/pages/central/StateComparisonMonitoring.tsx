import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, RefreshCw, Eye, ArrowLeft, Layers, Globe, Clock, ShieldAlert } from 'lucide-react';
import { centralService, StateSummary, NationalWork } from '../../services/centralService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StateComparisonMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [states, setStates] = useState<StateSummary[]>([]);
  const [selectedState, setSelectedState] = useState<any | null>(null);
  const [districts, setDistricts] = useState<any[]>([]);
  const [stateWorks, setStateWorks] = useState<NationalWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await centralService.getStates();
      setStates(data.states);
    } catch (err: any) {
      setError('Unable to load All-India states directory from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleInspectState = async (stateId: string | number) => {
    setLoading(true);
    try {
      const res = await centralService.getStateDetail(String(stateId));
      setSelectedState(res.state);
      setDistricts(res.districts);
      setStateWorks(res.works);
    } catch (err: any) {
      setError('Failed to load state detail metrics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center space-x-3">
          {selectedState && (
            <button
              onClick={() => { setSelectedState(null); setDistricts([]); setStateWorks([]); }}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border border-slate-200"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Globe size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {selectedState ? `${selectedState.name} State Monitoring` : 'All-India State / UT Comparison'}
            </h1>
            <p className="text-xs text-slate-600">
              {selectedState ? `State Code: ${selectedState.state_code}` : 'National comparison of execution volume, SLA compliance and risk concentration across States & UTs'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchStates}
          disabled={loading}
          className="flex items-center space-x-2 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Selected State Drill-Down */}
      {selectedState ? (
        <div className="space-y-6">
          <Card className="p-5 border-slate-200 bg-white shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-2">State Nodal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
              <div>
                <span className="text-slate-500 font-semibold block">State / UT Name:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedState.name}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Total Districts:</span>
                <p className="font-bold text-indigo-700 mt-0.5">{districts.length} Collectorates</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Total Works Registered:</span>
                <p className="font-bold text-emerald-700 mt-0.5">{stateWorks.length} Works</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 bg-white shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Works Registered under {selectedState.name}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold">Title & Location</th>
                    <th className="p-3 font-bold">Sector</th>
                    <th className="p-3 font-bold">Estimated Cost</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold">Risk Score</th>
                    <th className="p-3 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {stateWorks.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{w.title}</div>
                        <div className="text-[11px] text-slate-600">{w.address}</div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{w.sector}</td>
                      <td className="p-3 font-bold text-slate-900">₹{Number(w.sanctioned_amount || w.estimated_cost).toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <Badge variant={w.status === 'SANCTIONED' || w.status === 'IN_PROGRESS' ? 'success' : 'warning'}>
                          {w.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={w.risk_score >= 80 ? 'danger' : w.risk_score >= 60 ? 'warning' : 'info'}>
                          {w.risk_score} ({w.risk_level})
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => navigate(`/central/work/${w.id}`)}
                          className="text-sky-600 hover:text-sky-800 font-semibold flex items-center space-x-1 ml-auto"
                        >
                          <span>Work Detail</span>
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* State Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {states.map((s) => (
            <Card key={s.state_id} className="p-5 border-slate-200 bg-white shadow-xs space-y-4 hover:border-indigo-400 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{s.state_name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{s.district_count} Districts</p>
                </div>
                <Badge variant="purple">{s.state_code}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Total Works</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">{s.total_works}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-emerald-700 text-[10px] uppercase font-bold">Active Executing</span>
                  <div className="font-extrabold text-emerald-800 mt-0.5">{s.active_works}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="text-amber-700 text-[10px] uppercase font-bold">SLA Breached</span>
                  <div className="font-extrabold text-amber-800 mt-0.5">{s.delayed_works}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
                  <span className="text-rose-700 text-[10px] uppercase font-bold">High Risk Works</span>
                  <div className="font-extrabold text-rose-800 mt-0.5">{s.high_critical_risk_count}</div>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => handleInspectState(s.state_id)}
                className="w-full text-xs flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              >
                <span>Drill Down State</span>
                <Eye size={14} />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
