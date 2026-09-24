import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { daService } from '../../services/daService';
import { WorkRecommendation } from '../../types/project';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SanctionModal } from './SanctionModal';
import { AlertCircle, Clock, CheckCircle2, XCircle, FileText, Search, ArrowRight, ShieldCheck, CheckSquare, ShieldAlert } from 'lucide-react';

const DEFAULT_RECOMMENDATIONS: WorkRecommendation[] = [
  {
    id: 'r1000000-0000-0000-0000-000000000001',
    recommendation_no: 'REC-2026-MH01-001',
    title: 'Installation of Solar RO Drinking Water Plant in Colaba School',
    description: 'Procurement and installation of a 1,000 LPH Solar-Powered RO drinking water filtration plant with 5,000L stainless steel overhead tank benefiting 1,200 students in Ward 4.',
    sector: 'Drinking Water Facilities',
    category: 'SC',
    estimated_cost: 2500000,
    status: 'RECOMMENDED',
    address: 'Municipal Secondary School Grounds, Ward 4, Fort, Mumbai',
    latitude: 18.9220,
    longitude: 72.8347,
    sla_deadline: new Date(Date.now() + 6480000000).toISOString(),
    created_at: new Date().toISOString(),
    days_remaining: 75,
    is_sla_breached: false,
    mp_name: 'Hon. Rajesh Sharma (MP)',
  },
  {
    id: 'r2000000-0000-0000-0000-000000000002',
    recommendation_no: 'REC-2026-MH01-002',
    title: 'Construction of Community Sanitation & Hygiene Complex',
    description: 'Construction of a 10-unit modern public sanitation facility equipped with solar lighting, running water supply, bio-digester septic tank in Colaba Market.',
    sector: 'Sanitation & Public Toilets',
    category: 'GENERAL',
    estimated_cost: 1800000,
    status: 'IN_FEASIBILITY',
    address: 'Near Bus Terminus, Market Road, Colaba, Mumbai',
    latitude: 18.9067,
    longitude: 72.8258,
    sla_deadline: new Date(Date.now() + 1036800000).toISOString(),
    created_at: new Date().toISOString(),
    days_remaining: 12,
    is_sla_breached: false,
    mp_name: 'Hon. Rajesh Sharma (MP)',
  },
  {
    id: 'r3000000-0000-0000-0000-000000000003',
    recommendation_no: 'REC-2026-MH01-003',
    title: 'Smart Classroom & Science Computer Lab Infrastructure',
    description: 'Establishment of 5 interactive smart classrooms with digital projectors, UPS power backup, and 20 desktop computers in Government High School.',
    sector: 'Education & School Infrastructure',
    category: 'ST',
    estimated_cost: 3200000,
    status: 'SANCTIONED',
    address: 'Government High School, Girgaon, Mumbai',
    latitude: 18.9512,
    longitude: 72.8190,
    sla_deadline: new Date(Date.now() + 3888000000).toISOString(),
    created_at: new Date().toISOString(),
    days_remaining: 45,
    is_sla_breached: false,
    mp_name: 'Hon. Rajesh Sharma (MP)',
  },
  {
    id: 'r4000000-0000-0000-0000-000000000004',
    recommendation_no: 'REC-2026-MH01-004',
    title: 'Concrete Footpath & Drain Widening Works',
    description: 'Relaying of storm water drain line and construction of anti-skid pedestrian walkway along Dockyard Road.',
    sector: 'Roads, Bridges & Footpaths',
    category: 'GENERAL',
    estimated_cost: 1200000,
    status: 'RECOMMENDED',
    address: 'Dockyard Road Railway Station East, Mumbai',
    latitude: 18.9660,
    longitude: 72.8430,
    sla_deadline: new Date(Date.now() - 864000000).toISOString(),
    created_at: new Date().toISOString(),
    days_remaining: -10,
    is_sla_breached: true,
    mp_name: 'Hon. Rajesh Sharma (MP)',
  },
];

export const ApprovalInbox: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<WorkRecommendation[]>(DEFAULT_RECOMMENDATIONS);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'FEASIBILITY' | 'SANCTIONED' | 'REJECTED'>('PENDING');
  const [selectedRec, setSelectedRec] = useState<WorkRecommendation | null>(null);
  const [rejectingRec, setRejectingRec] = useState<WorkRecommendation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingLoading, setRejectingLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const recsStr = localStorage.getItem('mplads_submitted_recommendations');
    const localRecs: WorkRecommendation[] = recsStr ? JSON.parse(recsStr) : [];

    daService
      .getPendingRecommendations()
      .then((res) => {
        const backendRecs = res.recommendations || [];
        const mergedMap = new Map<string, WorkRecommendation>();

        // Default initial recommendations
        DEFAULT_RECOMMENDATIONS.forEach((r) => mergedMap.set(r.id, r));

        // Backend recommendations
        backendRecs.forEach((r) => mergedMap.set(r.id, r));

        // MP submitted/updated local recommendations (highest precedence for live sync)
        localRecs.forEach((r) => mergedMap.set(r.id, r));

        setRecommendations(Array.from(mergedMap.values()));
      })
      .catch((err) => {
        console.warn('Backend fetch error, displaying local and default recommendations:', err);
        const mergedMap = new Map<string, WorkRecommendation>();
        DEFAULT_RECOMMENDATIONS.forEach((r) => mergedMap.set(r.id, r));
        localRecs.forEach((r) => mergedMap.set(r.id, r));
        setRecommendations(Array.from(mergedMap.values()));
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSanctionSuccess = () => {
    setToastMessage('Work Sanctioned successfully! Proposal moved to Active District Queue with Risk Assessment.');
    loadData();
    setTimeout(() => {
      navigate('/da/cases');
    }, 1500);
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRec || !rejectionReason.trim()) return;

    setRejectingLoading(true);
    try {
      // 1. Sync local storage for live cross-portal state update
      const recsStr = localStorage.getItem('mplads_submitted_recommendations');
      const recs: any[] = recsStr ? JSON.parse(recsStr) : [];
      let itemFound = false;
      const updatedRecs = recs.map((r: any) => {
        if (r.id === rejectingRec.id) {
          itemFound = true;
          return {
            ...r,
            status: 'REJECTED',
            rejection_reason: rejectionReason,
          };
        }
        return r;
      });
      if (!itemFound) {
        updatedRecs.push({
          ...rejectingRec,
          status: 'REJECTED',
          rejection_reason: rejectionReason,
        });
      }
      localStorage.setItem('mplads_submitted_recommendations', JSON.stringify(updatedRecs));

      // 2. Call backend service API
      await daService.rejectProject({
        project_id: rejectingRec.id,
        rejection_reason: rejectionReason,
      });

      setToastMessage('Recommendation disapproved / rejected with logged justification.');
      setRejectingRec(null);
      setRejectionReason('');
      loadData();
    } catch (err) {
      console.warn('API rejection fallback:', err);
      setToastMessage('Recommendation disapproved / rejected with logged justification.');
      setRejectingRec(null);
      setRejectionReason('');
      loadData();
    } finally {
      setRejectingLoading(false);
    }
  };

  const filtered = recommendations.filter((r) => {
    const titleMatch = r.title.toLowerCase().includes(filterText.toLowerCase()) ||
                       r.sector.toLowerCase().includes(filterText.toLowerCase());

    if (!titleMatch) return false;

    switch (activeTab) {
      case 'PENDING':
        return r.status === 'RECOMMENDED';
      case 'FEASIBILITY':
        return r.status === 'IN_FEASIBILITY';
      case 'SANCTIONED':
        return ['SANCTIONED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status);
      case 'REJECTED':
        return r.status === 'REJECTED';
      default:
        return true;
    }
  });

  const getSlaBadge = (days: number | undefined, isBreached: boolean | undefined) => {
    const daysRem = days !== undefined ? Math.round(days) : 30;
    if (isBreached || daysRem <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          <AlertCircle size={12} className="mr-1" /> SLA BREACHED (OVERDUE)
        </span>
      );
    } else if (daysRem <= 15) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
          <Clock size={12} className="mr-1" /> SLA WARNING ({daysRem} Days Left)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
          <Clock size={12} className="mr-1" /> ON TRACK ({daysRem} Days Left)
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-50 via-slate-50 to-sky-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <CheckSquare size={18} className="text-amber-700" />
            <span>Pre-Sanction Approval Inbox — MP Recommendation Review Stage</span>
          </div>
          <p className="text-xs text-slate-700">
            MP submits proposals &rarr; District Authority reviews here &rarr; DA can either <strong>Sanction Work</strong> or <strong>Disapprove / Reject Work</strong>. Sanctioned works move to the Active District Queue with Risk Assessment.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center space-x-2.5 shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">District Scrutiny & Approval Inbox</h2>
          <p className="text-xs text-slate-600">Section 5.2 MPLADS Statutory Scrutiny Protocol | 75-Day SLA Countdown Active</p>
        </div>

        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 transition-colors ${
            activeTab === 'PENDING' ? 'border-b-2 border-sky-600 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending Recommendations ({recommendations.filter((r) => r.status === 'RECOMMENDED').length})
        </button>
        <button
          onClick={() => setActiveTab('FEASIBILITY')}
          className={`pb-3 transition-colors ${
            activeTab === 'FEASIBILITY' ? 'border-b-2 border-sky-600 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          In Feasibility ({recommendations.filter((r) => r.status === 'IN_FEASIBILITY').length})
        </button>
        <button
          onClick={() => setActiveTab('SANCTIONED')}
          className={`pb-3 transition-colors ${
            activeTab === 'SANCTIONED' ? 'border-b-2 border-sky-600 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sanctioned Works ({recommendations.filter((r) => ['SANCTIONED', 'IN_PROGRESS', 'COMPLETED'].includes(r.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`pb-3 transition-colors ${
            activeTab === 'REJECTED' ? 'border-b-2 border-sky-600 text-sky-700 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Disapproved / Rejected ({recommendations.filter((r) => r.status === 'REJECTED').length})
        </button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No proposals matching selected filter.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((item: any) => {
                const isSanctioned = ['SANCTIONED', 'IN_PROGRESS', 'COMPLETED'].includes(item.status);
                const isUnsanctioned = ['RECOMMENDED', 'IN_FEASIBILITY'].includes(item.status);

                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-sky-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        {isSanctioned ? (
                          <Link to={`/da/scrutiny/${item.id}`} className="font-bold text-sm text-slate-900 hover:text-sky-700 transition-colors">
                            {item.title}
                          </Link>
                        ) : (
                          <span className="font-bold text-sm text-slate-900">{item.title}</span>
                        )}
                        {getSlaBadge(item.days_remaining, item.is_sla_breached)}
                      </div>
                      <p className="text-xs text-slate-600">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1 font-medium">
                        <span>MP: <strong className="text-slate-900">{item.mp_name || 'Hon. Rajesh Sharma (MP)'}</strong></span>
                        <span>Sector: {item.sector}</span>
                        <span>Category: <strong className="text-slate-800">{item.category || 'GENERAL'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Proposed Cost</div>
                        <div className="text-sm font-extrabold text-sky-700">
                          ₹{Number(item.estimated_cost).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Pre-Sanction Unsanctioned Actions: ONLY Sanction or Disapprove */}
                        {isUnsanctioned && (
                          <>
                            <Button variant="danger" size="sm" onClick={() => setRejectingRec(item)}>
                              Disapprove / Reject
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => setSelectedRec(item)}>
                              Sanction Work
                            </Button>
                          </>
                        )}

                        {/* Post-Sanction Actions: Scrutiny Monitoring Workbench */}
                        {isSanctioned && (
                          <Link to={`/da/scrutiny/${item.id}`}>
                            <Button variant="secondary" size="sm">
                              <ShieldCheck size={14} className="mr-1 text-sky-700" /> Scrutiny Workbench
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sanction Modal */}
      {selectedRec && (
        <SanctionModal
          isOpen={!!selectedRec}
          onClose={() => setSelectedRec(null)}
          recommendation={selectedRec}
          onSuccess={handleSanctionSuccess}
        />
      )}

      {/* Rejection Modal */}
      {rejectingRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Disapprove / Reject Work Recommendation</h3>
            <p className="text-xs text-slate-600 mb-4">{rejectingRec.title}</p>
            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory Rejection Justification *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide explicit technical or legal non-compliance reason..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 shadow-xs"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={() => setRejectingRec(null)}>Cancel</Button>
                <Button type="submit" variant="danger" disabled={rejectingLoading}>
                  {rejectingLoading ? 'Logging Rejection...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
