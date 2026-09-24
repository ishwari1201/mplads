import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, RefreshCw, Eye, ArrowLeft, Layers, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { stateService, DistrictSummary, StateWork } from '../../services/stateService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DistrictMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
  const [districtWorks, setDistrictWorks] = useState<StateWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDistricts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stateService.getDistricts();
      setDistricts(data.districts);
    } catch (err: any) {
      setError('Unable to load state districts list from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  const handleInspectDistrict = async (districtId: string) => {
    setLoading(true);
    try {
      const res = await stateService.getDistrictDetail(districtId);
      setSelectedDistrict(res.district);
      setDistrictWorks(res.works);
    } catch (err: any) {
      setError('Failed to load district detail data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          {selectedDistrict && (
            <button
              onClick={() => { setSelectedDistrict(null); setDistrictWorks([]); }}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Building2 size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {selectedDistrict ? `${selectedDistrict.district_name} Collectorate Monitoring` : 'District Monitoring Directory'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {selectedDistrict ? `Collector: ${selectedDistrict.collector_name} | State: ${selectedDistrict.state_name}` : 'Statewide performance, SLA compliance and risk concentration by district'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchDistricts}
          disabled={loading}
          className="flex items-center space-x-2 text-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* District Drill-down View */}
      {selectedDistrict ? (
        <div className="space-y-6">
          <Card className="p-5 border-slate-200 bg-white shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-2">District Collectorate Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
              <div>
                <span className="text-slate-500 font-semibold">District Office Address:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedDistrict.office_address || 'District Collectorate Office, Fort, Mumbai'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Collector Name:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedDistrict.collector_name}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Total Assigned Works:</span>
                <p className="font-bold text-purple-800 mt-0.5">{districtWorks.length} Works</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 bg-white shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Works Registered under {selectedDistrict.district_name}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-y border-slate-200 tracking-wider">
                  <tr>
                    <th className="p-3">Title & Location</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3">Estimated Cost</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Risk Score</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {districtWorks.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{w.title}</div>
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
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => navigate(`/state/scrutiny/${w.id}`)}
                            className="text-[11px] px-2.5 py-1 flex items-center space-x-1 font-bold"
                          >
                            <ShieldCheck size={12} />
                            <span>Deep Scrutiny</span>
                          </Button>
                          <button
                            onClick={() => navigate(`/state/work/${w.id}`)}
                            className="text-sky-700 hover:text-sky-900 font-bold flex items-center space-x-1 text-xs"
                          >
                            <span>Work Detail</span>
                            <Eye size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Districts Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {districts.map((d) => (
            <Card key={d.district_id} className="p-5 border-slate-200 bg-white space-y-4 hover:border-purple-400 transition-all shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{d.district_name}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{d.collector_name}</p>
                </div>
                <Badge variant="purple">{d.state_name}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Total Works</span>
                  <div className="font-bold text-slate-900 mt-0.5">{d.total_works}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Active Executing</span>
                  <div className="font-bold text-emerald-700 mt-0.5">{d.active_works}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">SLA Breached</span>
                  <div className="font-bold text-amber-800 mt-0.5">{d.delayed_works}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">High Risk Works</span>
                  <div className="font-bold text-rose-700 mt-0.5">{d.high_critical_risk_count}</div>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => handleInspectDistrict(d.district_id)}
                className="w-full text-xs flex items-center justify-center space-x-1"
              >
                <span>Drill Down District</span>
                <Eye size={14} />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
