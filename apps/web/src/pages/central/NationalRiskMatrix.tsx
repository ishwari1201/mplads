import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Filter, RefreshCw, Eye, CheckCircle, Search } from 'lucide-react';
import { centralService, NationalWork } from '../../services/centralService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const NationalRiskMatrix: React.FC = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState<NationalWork[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<NationalWork[]>([]);
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
      const data = await centralService.getNationalRisk();
      setWorks(data.works);
    } catch (err: any) {
      setError('Unable to load All-India risk matrix directory from database.');
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
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">All-India National Risk Matrix</h1>
            <p className="text-xs text-slate-600">
              Cross-state duplicate work detection, SBERT text similarity, EXIF geotag photo anomalies & national payment divergence monitoring
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchWorks}
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

      {/* Filter Controls Bar */}
      <Card className="p-4 border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-slate-500" />
              <span className="text-slate-700 font-bold">Filters:</span>
            </div>

            {/* Risk Level Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
            >
              <option value="ALL">All Sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Divergence Only Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={divergenceOnly}
                onChange={(e) => setDivergenceOnly(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-800 font-medium">Payment/Progress Divergence Flagged Only</span>
            </label>
          </div>

          {/* Search Box */}
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search national works..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
        </div>
      </Card>

      {/* National Works Matrix Table */}
      <Card className="p-5 border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            All-India Anomaly Directory ({filteredWorks.length} Works)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 font-bold">Work Recommendation</th>
                <th className="p-3 font-bold">State & District</th>
                <th className="p-3 font-bold">Sanctioned Amount</th>
                <th className="p-3 font-bold">Payment vs Physical</th>
                <th className="p-3 font-bold">Risk Score</th>
                <th className="p-3 font-bold">National Anomaly Signals</th>
                <th className="p-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredWorks.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{w.title}</div>
                    <div className="text-[11px] text-slate-600">{w.address}</div>
                  </td>
                  <td className="p-3 text-slate-700 font-medium">
                    {w.state_name || 'Maharashtra'} / {w.district_name || 'Mumbai City'}
                  </td>
                  <td className="p-3 font-bold text-slate-900">₹{Number(w.sanctioned_amount || w.estimated_cost).toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <div className="text-slate-800 font-medium">
                      Pay: {w.payment_percentage}% | Phys: {w.physical_progress_percentage}%
                    </div>
                    {w.is_divergence_flagged && (
                      <Badge variant="danger" className="mt-1 font-semibold">
                        +{w.payment_progress_divergence}% Divergence Delta
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
                        <div className="text-rose-700 font-semibold flex items-center space-x-1">
                          <AlertTriangle size={12} />
                          <span>COST_ANOMALY & SBERT Text Similarity</span>
                        </div>
                        {w.cross_state_duplicate_signal && (
                          <div className="text-indigo-700 font-semibold">{w.cross_state_duplicate_signal}</div>
                        )}
                        {w.is_divergence_flagged && (
                          <div className="text-amber-800 font-medium">PAYMENT_PROGRESS_DIVERGENCE</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Standard baseline</span>
                    )}
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
  );
};
