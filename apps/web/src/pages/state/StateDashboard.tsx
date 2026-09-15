import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, AlertTriangle, ShieldAlert, CheckCircle, Clock, 
  FileText, Bot, ArrowRight, RefreshCw, ChevronRight, Layers, Eye
} from 'lucide-react';
import { stateService, StateOverviewMetrics, DistrictSummary, StateWork } from '../../services/stateService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<StateOverviewMetrics | null>(null);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [priorityWorks, setPriorityWorks] = useState<StateWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // AI Assistant drawer state
  const [aiOpen, setAiOpen] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, districtsData, worksData] = await Promise.all([
        stateService.getStateOverview(),
        stateService.getDistricts(),
        stateService.getStateWorks(),
      ]);

      setOverview(overviewData.overview);
      setDistricts(districtsData.districts);
      
      let allWorks: StateWork[] = worksData.works || [];

      // Merge local storage recommendations (for dynamic DA -> SA escalation updates)
      const localStr = localStorage.getItem('mplads_submitted_recommendations');
      if (localStr) {
        const localList = JSON.parse(localStr);
        for (const locItem of localList) {
          const idx = allWorks.findIndex((w) => w.id === locItem.id);
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
            allWorks[idx] = { ...allWorks[idx], status: locItem.status };
          } else {
            allWorks.unshift(formatted);
          }
        }
      }

      // Top 5 priority works by risk score
      const sorted = allWorks
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 5);
      setPriorityWorks(sorted);
    } catch (err: any) {
      console.error('Failed to load State Dashboard data:', err);
      setError('Unable to load State Authority dashboard metrics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAskAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await stateService.askStateAssistant(aiQuery, { overview, districtCount: districts.length });
      setAiResponse(res.response);
      setAiSource(res.source);
    } catch (err: any) {
      setAiResponse('AI Assistant currently unavailable. State core dashboard monitoring remains active.');
      setAiSource('FALLBACK');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 size={24} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-100">State Nodal Authority Overview</h1>
              <p className="text-xs text-slate-400">Maharashtra State Nodal Monitoring, Risk Concentration & SLA Oversight</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setAiOpen(!aiOpen)}
            className="flex items-center space-x-2 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30"
          >
            <Bot size={16} />
            <span>State AI Assistant</span>
          </Button>
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline hover:text-rose-200">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 glass-card rounded-xl animate-pulse bg-slate-900/50" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total State Works</p>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">{overview.total_projects}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Across {overview.active_districts_count} Active Districts</p>
              </div>
              <span className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                <Layers size={18} />
              </span>
            </div>
          </Card>

          <Card className="p-4 border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 font-medium">Sanctioned Value</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                  ₹{(overview.total_sanctioned_amount / 10000000).toFixed(2)} Cr
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{overview.active_projects} Executing Projects</p>
              </div>
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <FileText size={18} />
              </span>
            </div>
          </Card>

          <Card className="p-4 border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 font-medium">High / Critical Risk</p>
                <h3 className="text-2xl font-bold text-rose-400 mt-1">
                  {overview.risk_distribution.high + overview.risk_distribution.critical} Works
                </h3>
                <p className="text-[11px] text-rose-400/80 mt-1">Requires Priority Verification</p>
              </div>
              <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                <ShieldAlert size={18} />
              </span>
            </div>
          </Card>

          <Card className="p-4 border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 font-medium">75-Day SLA Breaches</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{overview.sla_breaches} Delayed</h3>
                <p className="text-[11px] text-amber-400/80 mt-1">Statutory Window Expired</p>
              </div>
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Clock size={18} />
              </span>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Risk Distribution Breakdown Banner */}
      {overview && (
        <Card className="p-5 border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center space-x-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span>State Risk Level Bands (ML Anomaly Distribution)</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-xs text-emerald-400 font-medium">LOW RISK (0–29)</div>
              <div className="text-xl font-bold text-slate-100 mt-1">{overview.risk_distribution.low}</div>
              <div className="text-[10px] text-slate-400">Normal execution</div>
            </div>
            <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-center">
              <div className="text-xs text-sky-400 font-medium">MEDIUM RISK (30–59)</div>
              <div className="text-xl font-bold text-slate-100 mt-1">{overview.risk_distribution.medium}</div>
              <div className="text-[10px] text-slate-400">Routine monitoring</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-xs text-amber-400 font-medium">HIGH RISK (60–79)</div>
              <div className="text-xl font-bold text-slate-100 mt-1">{overview.risk_distribution.high}</div>
              <div className="text-[10px] text-slate-400">District scrutiny</div>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="text-xs text-rose-400 font-medium">CRITICAL RISK (80–100)</div>
              <div className="text-xl font-bold text-slate-100 mt-1">{overview.risk_distribution.critical}</div>
              <div className="text-[10px] text-slate-400">State Nodal inquiry</div>
            </div>
          </div>
        </Card>
      )}

      {/* District Performance Table */}
      <Card className="p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">District Monitoring Directory</h2>
            <p className="text-xs text-slate-400">Execution and risk summary grouped by district collectorate</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/state/districts')}
            className="text-xs flex items-center space-x-1"
          >
            <span>View All Districts</span>
            <ChevronRight size={14} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3">District</th>
                <th className="p-3">District Magistrate / Collector</th>
                <th className="p-3">Total Works</th>
                <th className="p-3">Active Works</th>
                <th className="p-3">Delayed SLA</th>
                <th className="p-3">High Risk Count</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {districts.map((d) => (
                <tr key={d.district_id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-3 font-semibold text-slate-200">{d.district_name}</td>
                  <td className="p-3 text-slate-400">{d.collector_name}</td>
                  <td className="p-3 font-medium">{d.total_works}</td>
                  <td className="p-3 text-emerald-400 font-medium">{d.active_works}</td>
                  <td className="p-3">
                    {d.delayed_works > 0 ? (
                      <Badge variant="warning">{d.delayed_works} SLA Breached</Badge>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="p-3">
                    {d.high_critical_risk_count > 0 ? (
                      <Badge variant="danger">{d.high_critical_risk_count} High Risk</Badge>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => navigate(`/state/districts`)}
                      className="text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 ml-auto"
                    >
                      <span>Inspect</span>
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Priority High-Risk Works Table */}
      <Card className="p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">State Priority Risk Queue</h2>
            <p className="text-xs text-slate-400">Works flagged with severe payment/progress divergence or ML text/photo anomalies</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/state/risk')}
            className="text-xs flex items-center space-x-1"
          >
            <span>Full Risk Matrix</span>
            <ChevronRight size={14} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3">Work Recommendation</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Estimated / Sanctioned</th>
                <th className="p-3">Status</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {priorityWorks.map((w) => (
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
                      onClick={() => navigate(`/state/work/${w.id}`)}
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

      {/* AI Assistant Modal / Drawer */}
      {aiOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 p-6 flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-purple-400 font-bold">
                <Bot size={20} />
                <span>State Authority AI Assistant</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 py-4 space-y-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                Ask context-driven state monitoring questions regarding district performance, high-risk works, payment-progress divergence, or SLA delays.
              </div>

              {aiResponse && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                    <span>AI Assistant Response</span>
                    <Badge variant="info">{aiSource}</Badge>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{aiResponse}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAskAssistant} className="pt-4 border-t border-slate-800 flex space-x-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Which districts require the most attention?"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <Button
                type="submit"
                disabled={aiLoading}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white"
              >
                {aiLoading ? 'Analyzing...' : 'Ask'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
