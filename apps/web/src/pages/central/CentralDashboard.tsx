import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, AlertTriangle, ShieldAlert, CheckCircle, Clock, 
  FileText, Bot, ArrowRight, RefreshCw, ChevronRight, Layers, Eye, Globe
} from 'lucide-react';
import { centralService, NationalOverviewMetrics, StateSummary, NationalWork } from '../../services/centralService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const CentralDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<NationalOverviewMetrics | null>(null);
  const [states, setStates] = useState<StateSummary[]>([]);
  const [priorityWorks, setPriorityWorks] = useState<NationalWork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // MoSPI AI Assistant Drawer
  const [aiOpen, setAiOpen] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, statesData, worksData] = await Promise.all([
        centralService.getNationalOverview(),
        centralService.getStates(),
        centralService.getNationalRisk(),
      ]);

      setOverview(overviewData.overview);
      setStates(statesData.states);
      
      let allWorks: NationalWork[] = worksData.works || [];

      // Merge local storage recommendations (for dynamic SA -> Central escalation updates)
      const localStr = localStorage.getItem('mplads_submitted_recommendations');
      if (localStr) {
        const localList = JSON.parse(localStr);
        for (const locItem of localList) {
          const idx = allWorks.findIndex((w) => w.id === locItem.id);
          const formatted: NationalWork = {
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
            constituency_name: 'Mumbai North West',
            state_name: 'Maharashtra',
            district_name: 'Mumbai City',
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

      const sorted = allWorks
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 5);
      setPriorityWorks(sorted);
    } catch (err: any) {
      console.error('Failed to load Central Dashboard data:', err);
      setError('Unable to load Central Nodal Authority dashboard metrics from database.');
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
      const res = await centralService.askCentralAssistant(aiQuery, { overview, statesCount: states.length });
      setAiResponse(res.response);
      setAiSource(res.source);
    } catch (err: any) {
      setAiResponse('MoSPI AI Assistant currently unavailable. National core monitoring remains active.');
      setAiSource('FALLBACK');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Globe size={24} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Central Nodal Ministry (MoSPI) Overview</h1>
              <p className="text-xs text-slate-600">Government of India — National e-MPLADS Oversight, All-India Risk Matrix & Policy Execution</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate('/central/cases')}
            className="flex items-center space-x-2 text-xs font-bold"
          >
            <ShieldAlert size={16} />
            <span>State Escalated Cases</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => setAiOpen(!aiOpen)}
            className="flex items-center space-x-2 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
          >
            <Bot size={16} />
            <span>MoSPI AI Assistant</span>
          </Button>
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline font-semibold hover:text-rose-950">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse bg-slate-200" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-slate-200 bg-white shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">All-India National Works</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{overview.total_projects}</h3>
                <p className="text-[11px] text-slate-500 mt-1">Across {overview.active_states_count} States & UTs</p>
              </div>
              <span className="p-2.5 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
                <Globe size={18} />
              </span>
            </div>
          </Card>

          <Card className="p-4 border-slate-200 bg-white shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">National Sanctioned Value</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                  ₹{(overview.total_sanctioned_amount / 10000000).toFixed(2)} Cr
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">{overview.active_projects} Executing Projects</p>
              </div>
              <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <FileText size={18} />
              </span>
            </div>
          </Card>

          <Card className="p-4 border-slate-200 bg-white shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">High / Critical Risk</p>
                <h3 className="text-2xl font-bold text-rose-700 mt-1">
                  {overview.risk_distribution.high + overview.risk_distribution.critical} Works
                </h3>
                <p className="text-[11px] text-rose-700 font-semibold mt-1">Ministry Oversight Required</p>
              </div>
              <span className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
                <ShieldAlert size={18} />
              </span>
            </div>
          </Card>

          <Card className="p-4 border-slate-200 bg-white shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">National 75-Day SLA Breaches</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-1">{overview.sla_breaches} Delayed</h3>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">Statutory Window Expired</p>
              </div>
              <span className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                <Clock size={18} />
              </span>
            </div>
          </Card>
        </div>
      ) : null}

      {/* STATE ESCALATED CASES QUICK ACCESS BANNER */}
      <Card className="border-amber-300 bg-amber-50/70 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
              <ShieldAlert size={22} />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-amber-950">State Escalated Cases Queue (MoSPI National Workbench)</h3>
                <Badge variant="danger" className="font-mono text-[10px]">
                  ACTION REQUIRED
                </Badge>
              </div>
              <p className="text-xs text-slate-700 mt-0.5">
                Review critical cases escalated by State Nodal Authorities, inspect transferred digital evidence (pHash photos, OCR vouchers), freeze installment funds, or issue CAG national audit orders.
              </p>
            </div>
          </div>

          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate('/central/cases')}
            className="shrink-0 flex items-center space-x-2 text-xs font-bold shadow-xs"
          >
            <CheckCircle size={15} />
            <span>Open State Escalated Cases Queue</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </Card>

      {/* National Risk Band Banner */}
      {overview && (
        <Card className="p-5 border-slate-200 bg-white shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <span>All-India ML Risk Level Distribution</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">LOW RISK (0–29)</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{overview.risk_distribution.low}</div>
              <div className="text-[11px] text-slate-600 font-medium">Normal execution</div>
            </div>
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-center">
              <div className="text-xs text-sky-800 font-bold uppercase tracking-wider">MEDIUM RISK (30–59)</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{overview.risk_distribution.medium}</div>
              <div className="text-[11px] text-slate-600 font-medium">State monitoring</div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-xs text-amber-800 font-bold uppercase tracking-wider">HIGH RISK (60–79)</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{overview.risk_distribution.high}</div>
              <div className="text-[11px] text-slate-600 font-medium">State Nodal inquiry</div>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <div className="text-xs text-rose-800 font-bold uppercase tracking-wider">CRITICAL RISK (80–100)</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{overview.risk_distribution.critical}</div>
              <div className="text-[11px] text-slate-600 font-medium">MoSPI Ministry inquiry</div>
            </div>
          </div>
        </Card>
      )}

      {/* State / UT Comparison Table */}
      <Card className="p-5 border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">State & Union Territory Performance Summary</h2>
            <p className="text-xs text-slate-600">All-India programme execution and SLA compliance grouped by State/UT</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/central/states')}
            className="text-xs flex items-center space-x-1 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <span>View All States</span>
            <ChevronRight size={14} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 font-bold">State / UT</th>
                <th className="p-3 font-bold">Districts Count</th>
                <th className="p-3 font-bold">Total Works</th>
                <th className="p-3 font-bold">Active Works</th>
                <th className="p-3 font-bold">Delayed SLA</th>
                <th className="p-3 font-bold">High Risk Count</th>
                <th className="p-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {states.map((s) => (
                <tr key={s.state_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">
                    {s.state_name} <span className="text-[10px] text-slate-500 font-mono font-normal">({s.state_code})</span>
                  </td>
                  <td className="p-3 text-slate-600">{s.district_count} Districts</td>
                  <td className="p-3 font-semibold text-slate-800">{s.total_works}</td>
                  <td className="p-3 text-emerald-700 font-bold">{s.active_works}</td>
                  <td className="p-3">
                    {s.delayed_works > 0 ? (
                      <Badge variant="warning">{s.delayed_works} SLA Breached</Badge>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="p-3">
                    {s.high_critical_risk_count > 0 ? (
                      <Badge variant="danger">{s.high_critical_risk_count} High Risk</Badge>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => navigate(`/central/states`)}
                      className="text-sky-600 hover:text-sky-800 font-semibold flex items-center space-x-1 ml-auto"
                    >
                      <span>Drill Down</span>
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Priority National Risk Queue Table */}
      <Card className="p-5 border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">National Ministry Priority Queue</h2>
            <p className="text-xs text-slate-600">Works flagged for severe payment/progress divergence or cross-state similarity match</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/central/risk')}
            className="text-xs flex items-center space-x-1 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            <span>Full Risk Matrix</span>
            <ChevronRight size={14} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 font-bold">Work Recommendation</th>
                <th className="p-3 font-bold">State & District</th>
                <th className="p-3 font-bold">Sanctioned Amount</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold">Risk Score</th>
                <th className="p-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {priorityWorks.map((w) => (
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

      {/* MoSPI AI Assistant Drawer */}
      {aiOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white border-l border-slate-200 p-6 flex flex-col h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold">
                <Bot size={20} />
                <span>MoSPI Central AI Assistant</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="text-slate-500 hover:text-slate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 py-4 space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-medium">
                Ask national policy, state comparison, cross-state duplicate anomaly, or fund utilization questions.
              </div>

              {aiResponse && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                    <span>MoSPI AI Assistant Response</span>
                    <Badge variant="purple">{aiSource}</Badge>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-normal">{aiResponse}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAskAssistant} className="pt-4 border-t border-slate-200 flex space-x-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Which states have the highest risk concentration?"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
              <Button
                type="submit"
                disabled={aiLoading}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
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
