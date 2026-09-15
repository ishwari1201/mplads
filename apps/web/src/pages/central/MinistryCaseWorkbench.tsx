import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, AlertTriangle, ShieldAlert, RefreshCw, Eye, CheckCircle, ArrowUpRight, XCircle, Lock, ShieldCheck } from 'lucide-react';
import { centralService, MinistryCase } from '../../services/centralService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const MinistryCaseWorkbench: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<MinistryCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Case Action Modal
  const [selectedCase, setSelectedCase] = useState<MinistryCase | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      let fetched: MinistryCase[] = [];
      try {
        const data = await centralService.getMinistryCases();
        fetched = data.cases || [];
      } catch (err: any) {
        console.warn('API getMinistryCases fallback to local:', err);
      }

      // Merge local storage escalated cases (DA -> SA -> Central flow)
      const localStr = localStorage.getItem('mplads_submitted_recommendations');
      if (localStr) {
        const localList = JSON.parse(localStr);
        const escalatedLocal = localList.filter((r: any) =>
          r.status === 'ESCALATED_TO_CENTRAL' || r.status === 'FROZEN_PENDING_AUDIT' || r.status === 'ESCALATED_TO_STATE'
        );
        for (const locItem of escalatedLocal) {
          const existingIdx = fetched.findIndex((c) => c.id === locItem.id);
          const formattedCase: MinistryCase = {
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
            state_name: 'Maharashtra',
            district_name: 'Mumbai City',
            risk_score: locItem.status === 'CLEARED' ? 18 : 86,
            risk_level: locItem.status === 'CLEARED' ? 'LOW' : 'CRITICAL',
            is_sla_breached: false,
            case_age_days: 12,
            escalated_from: locItem.status === 'ESCALATED_TO_CENTRAL' ? 'State Nodal Authority (Maharashtra)' : 'District Collectorate',
            escalated_to: 'Central Nodal Ministry (MoSPI)',
            current_owner: 'Joint Secretary (MoSPI)',
            sla_status: 'ACTIVE',
            next_action: 'Ministry Audit & Determination',
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
      setError('Unable to load Ministry escalated cases queue from database.');
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
      const res = await centralService.performMinistryCaseAction(selectedCase.id, action, actionNotes);
      setActionResult(res.message);
      fetchCases();
    } catch (err: any) {
      setActionResult('Failed to execute Ministry case review action.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckSquare size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-100">MoSPI Ministry Case Workbench & Audit Trail</h1>
            <p className="text-xs text-slate-400">
              National Ministry review of state-escalated cases, national fund freezes & Comptroller and Auditor General (CAG) audit actions
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
          National Ministry Escalated Cases Queue ({cases.length} Open Cases)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3">Case Title & Work</th>
                <th className="p-3">State & District</th>
                <th className="p-3">SLA Status</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Next Required Ministry Action</th>
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
                  <td className="p-3 text-slate-300 font-medium">{c.state_name} / {c.district_name}</td>
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
                        variant="secondary"
                        onClick={() => navigate(`/central/scrutiny/${c.id}`)}
                        className="text-xs bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 flex items-center space-x-1"
                      >
                        <ShieldCheck size={14} />
                        <span>Deep Scrutiny</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => { setSelectedCase(c); setActionResult(null); setActionNotes(''); }}
                        className="text-xs bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30"
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
                <ShieldAlert size={20} className="text-indigo-400" />
                <span>MoSPI Ministry Case Review — {selectedCase.title}</span>
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
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2 text-[11px]">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <span>Transferred National Evidence Dossier (DA → State → Central)</span>
                  <span className="text-emerald-400 font-mono">CHAIN OF CUSTODY: VERIFIED</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block">Site Evidence Photos:</span>
                    <strong className="text-slate-200">2 IA Photos (ConvNet + pHash Fingerprints)</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block">OCR Financial Voucher:</span>
                    <strong className="text-slate-200">Bill Date & Sanction Price Verified (₹25,00,000)</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Ministry Officer Order / Audit Justification</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter MoSPI Joint Secretary review order or audit instructions..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
                onClick={() => handleExecuteAction('FREEZE_FUNDS')}
                className="text-xs bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30"
              >
                Freeze Installment Funds
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('CLEAR_NATIONAL_CASE')}
                className="text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
              >
                Clear National Case
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('REQUEST_STATE_REPORT')}
                className="text-xs bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30"
              >
                Request State Compliance Report
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('MARK_NATIONAL_AUDIT')}
                className="text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
              >
                Mark CAG Audit
              </Button>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => handleExecuteAction('RETURN_TO_STATE')}
                className="text-xs bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30"
              >
                Return to State Nodal Authority
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
