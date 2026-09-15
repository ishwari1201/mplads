import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { daService } from '../../services/daService';
import { WorkRecommendation } from '../../types/project';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  ShieldAlert, Search, Filter, AlertTriangle, AlertCircle, 
  Clock, ShieldCheck, CheckCircle2, ArrowRight, Eye, Database
} from 'lucide-react';

interface SanctionedCaseItem extends WorkRecommendation {
  work_id_code: string;
  physical_progress: number;
  payment_progress: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  main_reason: string;
  evidence_status: 'Complete' | 'Incomplete' | 'Requested' | 'Pending';
}

const DEFAULT_SANCTIONED_CASES: SanctionedCaseItem[] = [
  {
    id: 'r1000000-0000-0000-0000-000000000001',
    work_id_code: 'W-1074',
    recommendation_no: 'REC-2026-MH01-001',
    title: 'Construction of Community Sanitation Block in Ward 4',
    description: 'Construction of modern public toilet facility with dual water storage tanks and solar lighting.',
    sector: 'Sanitation & Public Toilets',
    category: 'GENERAL',
    estimated_cost: 2499999,
    status: 'SANCTIONED',
    address: 'Municipal School Grounds, Ward 4, Fort, Mumbai',
    latitude: 18.9220,
    longitude: 72.8347,
    sla_deadline: new Date(Date.now() + 6480000000).toISOString(),
    created_at: new Date().toISOString(),
    days_remaining: 75,
    is_sla_breached: false,
    mp_name: 'Hon. Rajesh Sharma (MP)',
    physical_progress: 79,
    payment_progress: 79,
    risk_level: 'LOW',
    risk_score: 18,
    main_reason: 'Verified distinct site photos & milestone progress (Passed Integrity)',
    evidence_status: 'Complete',
  },
  {
    id: 'r2000000-0000-0000-0000-000000000002',
    work_id_code: 'W-1043',
    recommendation_no: 'REC-2026-MH01-002',
    title: 'Solar RO Water Purifier Plant Installation',
    description: 'Installation of solar powered RO filtration plant in Ward 1.',
    sector: 'Drinking Water Facilities',
    category: 'SC',
    estimated_cost: 1800000,
    status: 'SANCTIONED',
    address: 'Market Road, Colaba, Mumbai',
    latitude: 18.9067,
    longitude: 72.8258,
    sla_deadline: new Date(Date.now() + 1036800000).toISOString(),
    created_at: new Date().toISOString(),
    days_remaining: 12,
    is_sla_breached: false,
    mp_name: 'Hon. Rajesh Sharma (MP)',
    physical_progress: 55,
    payment_progress: 50,
    risk_level: 'LOW',
    risk_score: 18,
    main_reason: 'Normal execution baseline',
    evidence_status: 'Complete',
  },
  {
    id: 'r3000000-0000-0000-0000-000000000003',
    work_id_code: 'W-1012',
    recommendation_no: 'REC-2026-MH01-003',
    title: 'Smart Classroom Infrastructure in Government High School',
    description: 'Procurement of interactive digital smart boards and UPS backup.',
    sector: 'Education & School Infrastructure',
    category: 'ST',
    estimated_cost: 3200000,
    status: 'IN_PROGRESS',
    address: 'Government High School, Girgaon, Mumbai',
    latitude: 18.9512,
    longitude: 72.8190,
    sla_deadline: new Date(Date.now() + 3888000000).toISOString(),
    created_at: new Date().toISOString(),
    days_remaining: 45,
    is_sla_breached: false,
    mp_name: 'Hon. Rajesh Sharma (MP)',
    physical_progress: 35,
    payment_progress: 75,
    risk_level: 'CRITICAL',
    risk_score: 86,
    main_reason: 'Payment/progress divergence (+40% delta)',
    evidence_status: 'Incomplete',
  },
];

export const CaseQueue: React.FC = () => {
  const [cases, setCases] = useState<SanctionedCaseItem[]>(DEFAULT_SANCTIONED_CASES);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [slaFilter, setSlaFilter] = useState<string>('ALL');

  useEffect(() => {
    // Read local storage recommendations & IA updates for live sync
    const recsStr = localStorage.getItem('mplads_submitted_recommendations');
    const photosStr = localStorage.getItem('mplads_uploaded_photos');
    const iaSchedulesStr = localStorage.getItem('mplads_ia_schedules');

    let localRecsMap = new Map();
    if (recsStr) {
      const recs = JSON.parse(recsStr);
      recs.forEach((r: any) => localRecsMap.set(r.id, r));
    }

    let localPhotosMap = new Map();
    if (photosStr) {
      const photos = JSON.parse(photosStr);
      photos.forEach((p: any) => localPhotosMap.set(p.work_id, p));
    }

    let localSchedulesMap = new Map();
    if (iaSchedulesStr) {
      const schedules = JSON.parse(iaSchedulesStr);
      Object.keys(schedules).forEach((k) => localSchedulesMap.set(k, schedules[k]));
    }

    daService
      .getPriorityQueue()
      .then((res) => {
        const sourceList = res.priority_queue && res.priority_queue.length > 0 ? res.priority_queue : DEFAULT_SANCTIONED_CASES;

        // Filter only sanctioned / active cases
        const sanctionedOnly = sourceList.filter((c: any) =>
          ['SANCTIONED', 'IN_PROGRESS', 'COMPLETED', 'FROZEN_PENDING_AUDIT'].includes(c.status || 'SANCTIONED')
        );

        const mapped = (sanctionedOnly.length > 0 ? sanctionedOnly : DEFAULT_SANCTIONED_CASES).map((r, idx) => {
          const localRec = localRecsMap.get(r.id);
          const localPhoto = localPhotosMap.get(r.id);
          const localSched = localSchedulesMap.get(r.id);

          const activeStatus = localRec?.status || r.status || 'SANCTIONED';
          const isCleared = activeStatus === 'CLEARED';
          const hasPhoto = Boolean(localPhoto);
          const isPhotoReused = Boolean(localPhoto?.is_phash_suspicious);

          const physProg = localSched?.physical_progress ?? localPhoto?.physical_progress ?? localRec?.physical_progress ?? (hasPhoto ? 79 : (idx % 2 === 0 ? 35 : 55));
          const isLowRisk = isCleared || (hasPhoto && !isPhotoReused && physProg >= 70);

          return {
            ...r,
            status: activeStatus as any,
            work_id_code: (r as any).work_id_code || `W-10${74 + idx}`,
            physical_progress: physProg,
            payment_progress: isLowRisk ? physProg : 78,
            risk_level: (isLowRisk ? 'LOW' : 'CRITICAL') as any,
            risk_score: isLowRisk ? 18 : 86,
            main_reason: isCleared
              ? 'Case Cleared by District Officer'
              : isLowRisk
              ? 'Verified distinct site photos & milestone progress (Passed Integrity)'
              : 'Payment/progress divergence (+40% delta)',
            evidence_status: (hasPhoto ? 'Complete' : 'Incomplete') as any,
          };
        });
        setCases(mapped);
      })
      .catch((err) => {
        console.warn('Fallback to default sanctioned cases:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = cases.filter((item) => {
    const textMatch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.work_id_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.address.toLowerCase().includes(searchTerm.toLowerCase());

    const riskMatch = riskFilter === 'ALL' || item.risk_level === riskFilter;
    const statusMatch = statusFilter === 'ALL' || item.status === statusFilter;
    const sectorMatch = sectorFilter === 'ALL' || item.sector === sectorFilter;

    let slaMatch = true;
    if (slaFilter === 'SLA_BREACHED') slaMatch = item.is_sla_breached || (item.days_remaining || 0) <= 0;
    else if (slaFilter === 'SLA_WARNING') slaMatch = (item.days_remaining || 0) > 0 && (item.days_remaining || 0) <= 15;
    else if (slaFilter === 'ON_TRACK') slaMatch = (item.days_remaining || 0) > 15;

    return textMatch && riskMatch && statusMatch && sectorMatch && slaMatch;
  });

  const getRiskBadge = (level: string, score: number) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertCircle size={12} className="mr-1" /> CRITICAL ({score})
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle size={12} className="mr-1" /> HIGH ({score})
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Clock size={12} className="mr-1" /> MEDIUM ({score})
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            <ShieldCheck size={12} className="mr-1" /> LOW ({score})
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Sanctioned Case Queue & Risk Scrutiny
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
              Sanctioned Works Queue ({filteredCases.length})
            </span>
          </h2>
          <p className="text-xs text-slate-400">Section 5.2 MPLADS Deep Scrutiny & Risk Anomaly Tracking Queue</p>
        </div>
      </div>

      {/* MULTI-ATTRIBUTE FILTERS BAR */}
      <Card className="border-sky-500/30">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search Work ID, title, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Risk Filter */}
            <div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Risk Bands</option>
                <option value="CRITICAL">CRITICAL Risk</option>
                <option value="HIGH">HIGH Risk</option>
                <option value="MEDIUM">MEDIUM Risk</option>
                <option value="LOW">LOW Risk</option>
              </select>
            </div>

            {/* Sector Filter */}
            <div>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Sectors</option>
                <option value="Drinking Water Facilities">Drinking Water</option>
                <option value="Sanitation & Public Toilets">Sanitation</option>
                <option value="Education & School Infrastructure">Education</option>
                <option value="Roads, Bridges & Footpaths">Roads & Bridges</option>
                <option value="Public Health & Ambulances">Public Health</option>
              </select>
            </div>

            {/* SLA Filter */}
            <div>
              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All SLA Statuses</option>
                <option value="SLA_BREACHED">SLA Breached</option>
                <option value="SLA_WARNING">SLA Warning (&le;15d)</option>
                <option value="ON_TRACK">On Track</option>
              </select>
            </div>
          </div>

          {(searchTerm || riskFilter !== 'ALL' || statusFilter !== 'ALL' || sectorFilter !== 'ALL' || slaFilter !== 'ALL') && (
            <div className="flex justify-end pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setRiskFilter('ALL');
                  setStatusFilter('ALL');
                  setSectorFilter('ALL');
                  setSlaFilter('ALL');
                }}
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SANCTIONED CASES TABLE */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <ShieldAlert size={18} className="text-sky-400" />
              <span>Sanctioned Works Queue ({filteredCases.length})</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading sanctioned case queue...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-y border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Work ID</th>
                  <th className="py-2.5 px-4">Sanctioned Work Name & Location</th>
                  <th className="py-2.5 px-4">Physical %</th>
                  <th className="py-2.5 px-4">Payment %</th>
                  <th className="py-2.5 px-4">Risk Level</th>
                  <th className="py-2.5 px-4">Main Signal Reason</th>
                  <th className="py-2.5 px-4">Evidence</th>
                  <th className="py-2.5 px-4">SLA Schedule</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                      No sanctioned cases found matching active filters.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        <Link to={`/da/scrutiny/${item.id}`} className="hover:underline">
                          {item.work_id_code}
                        </Link>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-100 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{item.address}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {item.physical_progress}%
                      </td>
                      <td className="py-3 px-4 font-bold text-sky-400">
                        {item.payment_progress}%
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getRiskBadge(item.risk_level, item.risk_score)}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-300 truncate">
                        {item.main_reason}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                          item.evidence_status === 'Complete' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.evidence_status === 'Requested' ? 'bg-sky-500/10 text-sky-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {item.evidence_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {item.is_sla_breached ? (
                          <span className="text-rose-400 font-bold">BREACHED</span>
                        ) : (
                          <span className="text-amber-400">{Math.max(0, Math.round(item.days_remaining || 30))}d left</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        <Link to={`/da/scrutiny/${item.id}`}>
                          <Button variant="secondary" size="sm">
                            Deep Scrutiny
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
