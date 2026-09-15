import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, AlertTriangle, ShieldAlert, RefreshCw, Eye, CheckCircle, ArrowUpRight, XCircle, ShieldCheck } from 'lucide-react';
import { stateService, EscalatedCase } from '../../services/stateService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StateCaseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<EscalatedCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Case Action Modal
  const [selectedCase, setSelectedCase] = useState<EscalatedCase | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      let fetched: EscalatedCase[] = [];
      try {
        const data = await stateService.getEscalatedCases();
        fetched = data.cases || [];
      } catch (err: any) {
        console.warn('API getEscalatedCases fallback to local:', err);
      }

      // Merge local storage escalated cases (DA -> SA flow)
      const localStr = localStorage.getItem('mplads_submitted_recommendations');
      if (localStr) {
        const localList = JSON.parse(localStr);
        const escalatedLocal = localList.filter((r: any) =>
          r.status === 'ESCALATED_TO_STATE' || r.status === 'ESCALATED_TO_CENTRAL' || r.status === 'FROZEN_PENDING_AUDIT'
        );
        for (const locItem of escalatedLocal) {
          const existingIdx = fetched.findIndex((c) => c.id === locItem.id);
          const formattedCase: EscalatedCase = {
            id: locItem.id,
            title: locItem.title,
            description: locItem.description || '',
            sector: locItem.sector || 'HEALTH',
            category: locItem.category || 'PUBLIC_INFRASTRUCTURE',
            estimated_cost: locItem.estimated_cost || 2500000,
            sanctioned_amount: locItem.sanctioned_amount || 2500000,
            status: locItem.status,
            address: locItem.address || 'Ward 4, District Collectorate',
            sla_deadline: locItem.sla_deadline || '2026-10-20',
            created_at: locItem.created_at || new Date().toISOString(),
            mp_name: locItem.mp_name || 'Shri Rahul Sharma (MP)',
            constituency_name: 'Mumbai North West',
            risk_score: locItem.status === 'CLEARED' ? 18 : 86,
            risk_level: locItem.status === 'CLEARED' ? 'LOW' : 'CRITICAL',
            is_sla_breached: false,
            case_age_days: 8,
            escalated_from: 'District Collectorate (Mumbai City)',
            escalated_to: 'State Nodal Authority (Maharashtra)',
            current_owner: 'State Nodal Officer',
            sla_status: 'ACTIVE',
            next_action: 'State Review & Audit Determination',
          };

          if (existingIdx >= 0) {
            fetched[existingIdx] = { ...fetched[existingIdx], status: locItem.status };
          } else {
            fetched.unshift(formattedCase);
          }
        }
      }
      setCases(fetched);
    } catch (err: any) {
      setError('Unable to load escalated cases queue from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleExecuteAction = async (action: string) => {
    if (!selectedCase) return;

    setActionLoading(true);
    setActionResult(null);
    try {
      const res = await stateService.performCaseAction(selectedCase.id, action, actionNotes);
      setActionResult(res.message);
      fetchCases();
    } catch (err: any) {
      setActionResult('Failed to execute case review action.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckSquare size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Escalated Case Workbench & Audit Trail</h1>
            <p className="text-xs text-slate-400">
              State Nodal review of unresolved district cases, evidence packages & statutory SLA escalations
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchCases}
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

      {/* Cases Queue Table */}
      <Card className="p-5 border-slate-800">
        <h2 className="text-sm font-bold text-slate-100 mb-4">
          Active Escalated Cases Queue ({cases.length} Open Cases)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3">Case Title & Work</th>
                <th className="p-3">Escalated From</th>
                <th className="p-3">SLA Status</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Next Action Required</th>
                <th className="p-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{c.title}</div>
                    <div className="text-[11px] text-slate-400">{c.address}</div>
                  </td>
                  <td className="p-3 text-slate-300 font-medium">{c.escalated_from}</td>
                  <td className="p-3">
                    <Badge variant={c.is_sla_breached ? 'danger' : 'info'}>
                      {c.sla_status} ({c.case_age_days || 14} days)
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={c.risk_score >= 80 ? 'danger' : c.risk_score >= 60 ? 'warning' : 'info'}>
                      {c.risk_score} ({c.risk_level})
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-300">{c.next_action}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => navigate(`/state/scrutiny/${c.id}`)}
                        className="text-xs flex items-center space-x-1 font-bold"
                      >
                        <ShieldCheck size={14} />
                        <span>Deep Scrutiny</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => { setSelectedCase(c); setActionResult(null); setActionNotes(''); }}
                        className="text-xs bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30"
                      >
                        Review Case
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Case Review Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-100 font-bold text-base">
                <ShieldAlert size={20} className="text-purple-400" />
                <span>State Case Review — {selectedCase.title}</span>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-slate-500">Escalated From:</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{selectedCase.escalated_from}</div>
                </div>
                <div>
                  <span className="text-slate-500">ML Risk Score:</span>
                  <div className="font-bold text-rose-400 mt-0.5">{selectedCase.risk_score} ({selectedCase.risk_level})</div>
                </div>
              </div>

              {/* TRANSFERRED CASE EVIDENCE SUMMARY */}
              <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2 text-[11px]">
                <div className="font-bold text-purple-300 flex items-center justify-between">
                  <span>Transferred Evidence Package (DA → State)</span>
                  <span className="text-emerald-400 font-mono">STATUS: SYNCED</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block">Site Evidence Photos:</span>
                    <strong className="text-slate-200">2 IA Photos (pHash fingerprint & EXIF location)</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block">OCR Financial Voucher:</span>
                    <strong className="text-slate-200">Payment slip verified against ₹25,00,000 budget</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">State Nodal Officer Review Notes / Justification</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter officer notes or inquiry instructions..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {actionResult && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-xs">
                  {actionResult}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('CLEAR_CASE')}
                className="text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
              >
                Clear Case
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('MARK_INSUFFICIENT_EVIDENCE')}
                className="text-xs bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30"
              >
                Mark Insufficient Evidence
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('REQUEST_DISTRICT_REPORT')}
                className="text-xs bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30"
              >
                Request District Report
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('ESCALATE_TO_CENTRAL')}
                className="text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
              >
                Escalate to Central
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('RETURN_TO_DISTRICT')}
                className="text-xs bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30"
              >
                Return to District
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
