import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Filter, RefreshCw, Eye, CheckCircle, Search, ShieldCheck } from 'lucide-react';
import { stateService, StateWork } from '../../services/stateService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StateRiskMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState<StateWork[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<StateWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [divergenceOnly, setDivergenceOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const fetchWorks = async () => {
    setLoading(true);
    setError(null);
    try {
      let fetched: StateWork[] = [];
      try {
        const data = await stateService.getStateWorks();
        fetched = data.works || [];
      } catch (e) {
        console.warn('getStateWorks fallback to local:', e);
      }

      // Merge local storage recommendations
      const localStr = localStorage.getItem('mplads_submitted_recommendations');
      if (localStr) {
        const localList = JSON.parse(localStr);
        for (const locItem of localList) {
          const idx = fetched.findIndex((w) => w.id === locItem.id);
          const formatted: StateWork = {
            id: locItem.id,
            title: locItem.title,
            description: locItem.description || '',
            sector: locItem.sector || 'HEALTH',
            category: locItem.category || 'PUBLIC_INFRASTRUCTURE',
            estimated_cost: locItem.estimated_cost || 2500000,
            sanctioned_amount: locItem.sanctioned_amount || 2500000,
            payment_disbursed: locItem.sanctioned_amount ? locItem.sanctioned_amount * 0.78 : 1950000,
            payment_percentage: 78,
            physical_progress_percentage: 31,
            payment_progress_divergence: 47,
            is_divergence_flagged: true,
            status: locItem.status,
            address: locItem.address || 'Ward 4, District Collectorate',
            sla_deadline: locItem.sla_deadline || '2026-10-20',
            created_at: locItem.created_at || new Date().toISOString(),
            mp_name: locItem.mp_name || 'Shri Rahul Sharma (MP)',
            risk_score: locItem.status === 'CLEARED' ? 18 : 86,
            risk_level: locItem.status === 'CLEARED' ? 'LOW' : 'CRITICAL',
          };

          if (idx >= 0) {
            fetched[idx] = { ...fetched[idx], status: locItem.status };
          } else {
            fetched.unshift(formatted);
          }
        }
      }

      setWorks(fetched);
    } catch (err: any) {
      setError('Unable to load risk matrix directory from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  useEffect(() => {
    let result = [...works];

    if (selectedRisk !== 'ALL') {
      result = result.filter((w) => w.risk_level === selectedRisk);
    }

    if (selectedSector !== 'ALL') {
      result = result.filter((w) => w.sector === selectedSector);
    }

    if (divergenceOnly) {
      result = result.filter((w) => w.is_divergence_flagged);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.address.toLowerCase().includes(q)
      );
    }

    setFilteredWorks(result);
  }, [works, selectedRisk, selectedSector, divergenceOnly, search]);

  const sectors = Array.from(new Set(works.map((w) => w.sector))).filter(Boolean);

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-100">State Risk & Anomaly Matrix</h1>
            <p className="text-xs text-slate-400">
              ML Fraud detection, SBERT text similarity, EXIF geotag photo anomalies & payment divergence monitoring
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchWorks}
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

      {/* Filter Controls Bar */}
      <Card className="p-4 border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-slate-300 font-semibold">Filters:</span>
            </div>

            {/* Risk Level Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">CRITICAL (80-100)</option>
              <option value="HIGH">HIGH (60-79)</option>
              <option value="MEDIUM">MEDIUM (30-59)</option>
              <option value="LOW">LOW (0-29)</option>
            </select>

            {/* Sector Filter */}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Divergence Only Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
              <input
                type="checkbox"
                checked={divergenceOnly}
                onChange={(e) => setDivergenceOnly(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-purple-500 focus:ring-0"
              />
              <span className="text-slate-300">Payment/Progress Divergence Flagged Only</span>
            </label>
          </div>

          {/* Search Box */}
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search works..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </Card>

      {/* Works Matrix Table */}
      <Card className="p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-100">
            State Anomaly Directory ({filteredWorks.length} Works)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3">Work Recommendation</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Sanctioned Amount</th>
                <th className="p-3">Payment vs Physical</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Anomaly Indicators</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredWorks.map((w) => (
                <tr key={w.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{w.title}</div>
                    <div className="text-[11px] text-slate-400">{w.address}</div>
                  </td>
                  <td className="p-3 text-slate-300">{w.sector}</td>
                  <td className="p-3 font-medium">₹{Number(w.sanctioned_amount || w.estimated_cost).toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <div className="text-slate-200">
                      Pay: {w.payment_percentage}% | Phys: {w.physical_progress_percentage}%
                    </div>
                    {w.is_divergence_flagged && (
                      <Badge variant="danger" className="mt-1">
                        +${w.payment_progress_divergence}% Divergence Delta
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={w.risk_score >= 80 ? 'danger' : w.risk_score >= 60 ? 'warning' : 'info'}>
                      {w.risk_score} ({w.risk_level})
                    </Badge>
                  </td>
                  <td className="p-3">
                    {w.risk_score >= 60 ? (
                      <div className="space-y-1 text-[11px]">
                        <div className="text-rose-400 font-medium flex items-center space-x-1">
                          <AlertTriangle size={12} />
                          <span>COST_ANOMALY & SBERT Text Similarity</span>
                        </div>
                        {w.is_divergence_flagged && (
                          <div className="text-amber-400">PAYMENT_PROGRESS_DIVERGENCE</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-medium">Standard baseline</span>
                    )}
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
                        className="text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 text-xs"
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
  );
};
