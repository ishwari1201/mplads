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

const cleanWorkId = (s: string) => s.toLowerCase().replace(/^(r-|w-100|w-10|w-|rec-2026-mh01-00|rec-)/i, '').replace(/^0+/, '');

const getMatchingMapValue = (map: Map<string, any>, targetId: string) => {
  if (!targetId) return undefined;
  if (map.has(targetId)) return map.get(targetId);
  const targetClean = cleanWorkId(targetId);
  for (const [key, val] of map.entries()) {
    if (cleanWorkId(key) === targetClean) return val;
  }
  return undefined;
};

const mapToRealCaseMetrics = (
  r: any,
  idx: number,
  localRecsMap: Map<string, any>,
  localPhotosMap: Map<string, any>,
  localSchedulesMap: Map<string, any>,
  localClaimsMap: Map<string, any>
) => {
  const localRec = getMatchingMapValue(localRecsMap, r.id) || r;
  const localPhoto = getMatchingMapValue(localPhotosMap, r.id);
  const localSched = getMatchingMapValue(localSchedulesMap, r.id);
  const localClaim = getMatchingMapValue(localClaimsMap, r.id);

  // 1. Real Work ID Code
  const workIdCode = localRec.recommendation_no || r.recommendation_no || (r as any).work_id_code || `REC-2026-MH01-${String(100 + idx).padStart(3, '0')}`;

  // 2. Status & Cleared Flag
  const activeStatus = localRec.status || r.status || 'SANCTIONED';
  const isCleared = activeStatus === 'CLEARED';

  // 3. Real Physical Progress % (0% for newly sanctioned works)
  let physicalProg = 0;
  if (localSched?.physical_progress !== undefined) {
    physicalProg = Number(localSched.physical_progress);
  } else if (localPhoto?.physical_progress !== undefined) {
    physicalProg = Number(localPhoto.physical_progress);
  } else if (localRec.physical_progress !== undefined) {
    physicalProg = Number(localRec.physical_progress);
  } else if (r.physical_progress !== undefined) {
    physicalProg = Number(r.physical_progress);
  }

  // 4. Real Payment Progress % (0% for newly sanctioned works)
  let paymentProg = 0;
  if (localClaim?.payment_progress !== undefined) {
    paymentProg = Number(localClaim.payment_progress);
  } else if (localRec.payment_progress !== undefined) {
    paymentProg = Number(localRec.payment_progress);
  } else if (r.payment_progress !== undefined) {
    paymentProg = Number(r.payment_progress);
  }

  // 5. Evidence Status
  const hasPhoto = Boolean(localPhoto);
  const isPhotoReused = Boolean(localPhoto?.is_phash_suspicious);
  const isGpsMismatch = Boolean(localPhoto?.is_gps_mismatch);

  let evidenceStatus: 'Complete' | 'Incomplete' | 'Requested' | 'Pending' = 'Pending';
  if (isPhotoReused) {
    evidenceStatus = 'Incomplete';
  } else if (hasPhoto) {
    evidenceStatus = 'Complete';
  } else if (r.evidence_status) {
    evidenceStatus = r.evidence_status;
  } else {
    evidenceStatus = 'Pending';
  }

  // 6. SLA Countdown
  const deadlineDateStr = localRec.target_completion_date || localRec.sla_deadline || r.target_completion_date || r.sla_deadline || new Date(Date.now() + 75 * 86400000).toISOString();
  const deadlineTime = new Date(deadlineDateStr).getTime();
  const daysRem = Math.round((deadlineTime - Date.now()) / (1000 * 3600 * 24));
  const isSlaBreached = daysRem <= 0 || Boolean(r.is_sla_breached);

  // 7. Real Risk Score & Level Calculation
  let riskScore = 15;
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let mainReason = 'Initial Sanction — Clean Baseline Awaiting IA Progress';

  if (isCleared) {
    riskScore = 10;
    riskLevel = 'LOW';
    mainReason = 'Case Cleared by District Officer';
  } else if (isPhotoReused) {
    riskScore = 88;
    riskLevel = 'CRITICAL';
    mainReason = 'Perceptual Hash Duplicate Photo Flag — Image Re-use Detected';
  } else if (isGpsMismatch) {
    riskScore = 65;
    riskLevel = 'HIGH';
    mainReason = 'GPS Geotag Offset — Uploaded photo taken >500m from site coordinates';
  } else {
    const delta = paymentProg - physicalProg;
    if (delta > 25) {
      riskScore = 85;
      riskLevel = 'CRITICAL';
      mainReason = `Payment/progress divergence (+${Math.round(delta)}% delta)`;
    } else if (isSlaBreached) {
      riskScore = 70;
      riskLevel = 'HIGH';
      mainReason = 'SLA Schedule Overrun — Statutory deadline elapsed';
    } else if (hasPhoto && physicalProg >= 70) {
      riskScore = 18;
      riskLevel = 'LOW';
      mainReason = 'Verified EXIF & Geotag Site Photo — Passed Integrity Checks';
    } else if (hasPhoto) {
      riskScore = 25;
      riskLevel = 'LOW';
      mainReason = 'EXIF Photo Received — Milestone Execution in Progress';
    } else if (r.risk_score !== undefined && r.risk_level && r.main_reason) {
      riskScore = r.risk_score;
      riskLevel = r.risk_level;
      mainReason = r.main_reason;
    } else {
      riskScore = 15;
      riskLevel = 'LOW';
      mainReason = 'Initial Sanction — Clean Baseline Awaiting IA Progress';
    }
  }

  return {
    ...r,
    id: r.id,
    work_id_code: workIdCode,
    recommendation_no: workIdCode,
    title: localRec.title || r.title,
    description: localRec.description || r.description || '',
    sector: localRec.sector || r.sector,
    category: localRec.category || r.category || 'GENERAL',
    estimated_cost: localRec.estimated_cost || r.estimated_cost,
    sanctioned_amount: localRec.sanctioned_amount || r.sanctioned_amount || localRec.estimated_cost || r.estimated_cost,
    address: localRec.address || r.address,
    latitude: localRec.latitude || r.latitude,
    longitude: localRec.longitude || r.longitude,
    mp_name: localRec.mp_name || r.mp_name || 'Hon. Rajesh Sharma (MP)',
    status: activeStatus,
    physical_progress: physicalProg,
    payment_progress: paymentProg,
    risk_level: riskLevel,
    risk_score: riskScore,
    main_reason: mainReason,
    evidence_status: evidenceStatus,
    days_remaining: daysRem,
    is_sla_breached: isSlaBreached,
    target_completion_date: deadlineDateStr,
  };
};

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
    // Read local storage recommendations, IA updates & claims for live sync
    const recsStr = localStorage.getItem('mplads_submitted_recommendations');
    const photosStr = localStorage.getItem('mplads_uploaded_photos');
    const iaSchedulesStr = localStorage.getItem('mplads_ia_schedules');
    const claimsStr = localStorage.getItem('mplads_payment_claims');

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

    let localClaimsMap = new Map();
    if (claimsStr) {
      const claims = JSON.parse(claimsStr);
      claims.forEach((c: any) => localClaimsMap.set(c.work_id, c));
    }

    daService
      .getPriorityQueue()
      .then((res) => {
        const backendList = res.priority_queue || [];
        const combinedMap = new Map<string, any>();

        // 1. Add DEFAULT_SANCTIONED_CASES
        DEFAULT_SANCTIONED_CASES.forEach((c) => combinedMap.set(c.id, c));

        // 2. Add backend cases
        backendList.forEach((c: any) => combinedMap.set(c.id, c));

        // 3. Add local recommendations that have been sanctioned
        localRecsMap.forEach((r: any) => {
          if (['SANCTIONED', 'IN_PROGRESS', 'COMPLETED', 'FROZEN_PENDING_AUDIT'].includes(r.status)) {
            combinedMap.set(r.id, r);
          }
        });

        const sourceList = Array.from(combinedMap.values());
        const mapped = sourceList.map((r, idx) =>
          mapToRealCaseMetrics(r, idx, localRecsMap, localPhotosMap, localSchedulesMap, localClaimsMap)
        );
        setCases(mapped);
      })
      .catch((err) => {
        console.warn('Fallback to local and default sanctioned cases:', err);
        const combinedMap = new Map<string, any>();
        DEFAULT_SANCTIONED_CASES.forEach((c) => combinedMap.set(c.id, c));
        localRecsMap.forEach((r: any) => {
          if (['SANCTIONED', 'IN_PROGRESS', 'COMPLETED', 'FROZEN_PENDING_AUDIT'].includes(r.status)) {
            combinedMap.set(r.id, r);
          }
        });
        const sourceList = Array.from(combinedMap.values());
        const mapped = sourceList.map((r, idx) =>
          mapToRealCaseMetrics(r, idx, localRecsMap, localPhotosMap, localSchedulesMap, localClaimsMap)
        );
        setCases(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = cases.filter((item) => {
    const textMatch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.work_id_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.address || item.location_address || '').toLowerCase().includes(searchTerm.toLowerCase());

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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <AlertCircle size={12} className="mr-1" /> CRITICAL ({score})
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
            <AlertTriangle size={12} className="mr-1" /> HIGH ({score})
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
            <Clock size={12} className="mr-1" /> MEDIUM ({score})
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
            <ShieldCheck size={12} className="mr-1" /> LOW ({score})
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Sanctioned Case Queue & Risk Scrutiny
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              Sanctioned Works Queue ({filteredCases.length})
            </span>
          </h2>
          <p className="text-xs text-slate-600">Section 5.2 MPLADS Deep Scrutiny & Risk Anomaly Tracking Queue</p>
        </div>
      </div>

      {/* MULTI-ATTRIBUTE FILTERS BAR */}
      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Work ID, title, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>

            {/* Risk Filter */}
            <div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
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
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
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
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
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
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <ShieldAlert size={18} className="text-sky-700" />
              <span>Sanctioned Works Queue ({filteredCases.length})</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading sanctioned case queue...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
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
              <tbody className="divide-y divide-slate-200">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                      No sanctioned cases found matching active filters.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-700">
                        <Link to={`/da/scrutiny/${item.id}`} className="hover:underline">
                          {item.work_id_code}
                        </Link>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-600 truncate">{item.address}</div>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {item.physical_progress > 0 ? (
                          <span className="text-emerald-700">{item.physical_progress}%</span>
                        ) : (
                          <span className="text-slate-500 font-normal">0%</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {item.payment_progress > 0 ? (
                          <span className="text-sky-700">{item.payment_progress}%</span>
                        ) : (
                          <span className="text-slate-500 font-normal">0%</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getRiskBadge(item.risk_level, item.risk_score)}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-700 truncate" title={item.main_reason}>
                        {item.main_reason}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.evidence_status === 'Complete' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          item.evidence_status === 'Requested' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                          item.evidence_status === 'Incomplete' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {item.evidence_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {item.is_sla_breached ? (
                          <span className="text-rose-700 font-bold px-2 py-0.5 rounded bg-rose-50 border border-rose-200">BREACHED</span>
                        ) : (
                          <span className="text-amber-800 font-bold">{Math.max(0, Math.round(item.days_remaining || 30))}d left</span>
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
