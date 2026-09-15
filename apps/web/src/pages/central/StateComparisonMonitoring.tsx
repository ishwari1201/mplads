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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          {selectedState && (
            <button
              onClick={() => { setSelectedState(null); setDistricts([]); setStateWorks([]); }}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Globe size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              {selectedState ? `${selectedState.name} State Monitoring` : 'All-India State / UT Comparison'}
            </h1>
            <p className="text-xs text-slate-400">
              {selectedState ? `State Code: ${selectedState.state_code}` : 'National comparison of execution volume, SLA compliance and risk concentration across States & UTs'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchStates}
          disabled={loading}
          className="flex items-center space-x-2 text-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Selected State Drill-Down */}
      {selectedState ? (
        <div className="space-y-6">
          <Card className="p-5 border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 mb-2">State Nodal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-500">State / UT Name:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{selectedState.name}</p>
              </div>
              <div>
                <span className="text-slate-500">Total Districts:</span>
                <p className="font-semibold text-indigo-400 mt-0.5">{districts.length} Collectorates</p>
              </div>
              <div>
                <span className="text-slate-500">Total Works Registered:</span>
                <p className="font-semibold text-emerald-400 mt-0.5">{stateWorks.length} Works</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-800">
            <h2 className="text-sm font-bold text-slate-200 mb-4">Works Registered under {selectedState.name}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-3">Title & Location</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3">Estimated Cost</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Risk Score</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {stateWorks.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{w.title}</div>
                        <div className="text-[11px] text-slate-400">{w.address}</div>
                      </td>
                      <td className="p-3 text-slate-300">{w.sector}</td>
                      <td className="p-3 font-medium">₹{Number(w.sanctioned_amount || w.estimated_cost).toLocaleString('en-IN')}</td>
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
                          className="text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 ml-auto"
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
            <Card key={s.state_id} className="p-5 border-slate-800 space-y-4 hover:border-indigo-500/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{s.state_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{s.district_count} Districts</p>
                </div>
                <Badge variant="purple">{s.state_code}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-900">
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-500 text-[10px] uppercase">Total Works</span>
                  <div className="font-bold text-slate-200 mt-0.5">{s.total_works}</div>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-500 text-[10px] uppercase">Active Executing</span>
                  <div className="font-bold text-emerald-400 mt-0.5">{s.active_works}</div>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-500 text-[10px] uppercase">SLA Breached</span>
                  <div className="font-bold text-amber-400 mt-0.5">{s.delayed_works}</div>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-500 text-[10px] uppercase">High Risk Works</span>
                  <div className="font-bold text-rose-400 mt-0.5">{s.high_critical_risk_count}</div>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => handleInspectState(s.state_id)}
                className="w-full text-xs flex items-center justify-center space-x-1"
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
