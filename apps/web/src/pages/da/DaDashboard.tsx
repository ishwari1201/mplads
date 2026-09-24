import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { daService, DaOverviewMetrics } from '../../services/daService';
import { WorkRecommendation } from '../../types/project';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DistrictPostGisMap } from '../../components/map/DistrictPostGisMap';
import { 
  CheckSquare, AlertTriangle, Clock, Activity, FileCheck, ShieldAlert, 
  ArrowRight, Search, Filter, ShieldCheck, Camera, UserCheck, AlertCircle
} from 'lucide-react';

interface PriorityWorkItem extends WorkRecommendation {
  work_id_code: string;
  physical_progress: number;
  payment_progress: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  main_reason: string;
  evidence_status: 'Complete' | 'Incomplete' | 'Requested' | 'Pending';
}

const SANCTIONED_PRIORITY_WORKS: PriorityWorkItem[] = [
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
    description: 'Installation of solar powered RO filtration plant.',
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
];

export const DaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DaOverviewMetrics | null>(null);
  const [works, setWorks] = useState<PriorityWorkItem[]>(SANCTIONED_PRIORITY_WORKS);

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    daService.getOverviewMetrics().then((res) => setMetrics(res.metrics)).catch(console.error);

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
      Object.keys(schedules).forEach(k => localSchedulesMap.set(k, schedules[k]));
    }

    let localClaimsMap = new Map();
    if (claimsStr) {
      const claims = JSON.parse(claimsStr);
      claims.forEach((c: any) => localClaimsMap.set(c.work_id, c));
    }

    daService.getPriorityQueue().then((res) => {
      const backendWorks = res.priority_queue || [];
      const combinedMap = new Map<string, any>();

      SANCTIONED_PRIORITY_WORKS.forEach((w) => combinedMap.set(w.id, w));
      backendWorks.forEach((w: any) => combinedMap.set(w.id, w));
      localRecsMap.forEach((r: any) => {
        if (['SANCTIONED', 'IN_PROGRESS', 'COMPLETED', 'FROZEN_PENDING_AUDIT'].includes(r.status)) {
          combinedMap.set(r.id, r);
        }
      });

      const sourceWorks = Array.from(combinedMap.values());
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

      const mapped = sourceWorks.map((r, idx) => {
        const localRec = getMatchingMapValue(localRecsMap, r.id) || r;
        const localPhoto = getMatchingMapValue(localPhotosMap, r.id);
        const localSched = getMatchingMapValue(localSchedulesMap, r.id);
        const localClaim = getMatchingMapValue(localClaimsMap, r.id);

        const workIdCode = localRec.recommendation_no || r.recommendation_no || (r as any).work_id_code || `REC-2026-MH01-${String(100 + idx).padStart(3, '0')}`;
        const activeStatus = localRec.status || r.status || 'SANCTIONED';
        const isCleared = activeStatus === 'CLEARED';

        let physicalProg = 0;
        if (localSched?.physical_progress !== undefined) physicalProg = Number(localSched.physical_progress);
        else if (localPhoto?.physical_progress !== undefined) physicalProg = Number(localPhoto.physical_progress);
        else if (localRec.physical_progress !== undefined) physicalProg = Number(localRec.physical_progress);
        else if (r.physical_progress !== undefined) physicalProg = Number(r.physical_progress);

        let paymentProg = 0;
        if (localClaim?.payment_progress !== undefined) paymentProg = Number(localClaim.payment_progress);
        else if (localRec.payment_progress !== undefined) paymentProg = Number(localRec.payment_progress);
        else if (r.payment_progress !== undefined) paymentProg = Number(r.payment_progress);

        const hasPhoto = Boolean(localPhoto);
        const isPhotoReused = Boolean(localPhoto?.is_phash_suspicious);
        const isGpsMismatch = Boolean(localPhoto?.is_gps_mismatch);

        let evidenceStatus: 'Complete' | 'Incomplete' | 'Requested' | 'Pending' = 'Pending';
        if (isPhotoReused) evidenceStatus = 'Incomplete';
        else if (hasPhoto) evidenceStatus = 'Complete';
        else if (r.evidence_status) evidenceStatus = r.evidence_status;

        const deadlineDateStr = localRec.target_completion_date || localRec.sla_deadline || r.target_completion_date || r.sla_deadline || new Date(Date.now() + 75 * 86400000).toISOString();
        const daysRem = Math.round((new Date(deadlineDateStr).getTime() - Date.now()) / (1000 * 3600 * 24));
        const isSlaBreached = daysRem <= 0 || Boolean(r.is_sla_breached);

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
          address: localRec.address || r.address,
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
      });
      setWorks(mapped);
    }).catch(() => {
      // Fallback
    });
  }, []);

  const recsStr = localStorage.getItem('mplads_submitted_recommendations');
  const localRecs: any[] = recsStr ? JSON.parse(recsStr) : [];
  const localPendingCount = localRecs.filter((r) => ['RECOMMENDED', 'IN_FEASIBILITY'].includes(r.status)).length;
  const pendingCount = metrics ? Math.max(metrics.pending_sanctions, localPendingCount) : (localPendingCount || 2);
  const activeCount = metrics ? metrics.active_works : works.length;
  const highRiskCount = works.filter((w) => ['HIGH', 'CRITICAL'].includes(w.risk_level)).length;
  const evidenceRequestsCount = works.filter((w) => w.evidence_status === 'Requested' || w.evidence_status === 'Incomplete').length;
  const verificationPendingCount = works.filter((w) => w.risk_level === 'CRITICAL' || w.is_sla_breached).length;
  const slaAtRiskCount = metrics ? metrics.sla_warnings : works.filter((w) => (w.days_remaining || 30) <= 15).length;

  const filteredWorks = works.filter((w) => {
    const matchText = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      w.work_id_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (w.address || w.location_address || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || w.risk_level === riskFilter;
    const matchStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchText && matchRisk && matchStatus;
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
      {/* Officer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            District Collectorate Command Center
            <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
              Mumbai City District
            </span>
          </h2>
          <p className="text-xs text-slate-600">Section 5.2 MPLADS Statutory Review Protocol • 75-Day SLA Countdown Active</p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/da/inbox">
            <Button variant="primary" size="md">
              <CheckSquare size={16} className="mr-2" /> Open Approval Inbox ({pendingCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* TOP SUMMARY AREA - 6 Compact KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div 
          onClick={() => navigate('/da/inbox')} 
          className="p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer transition-all space-y-1 shadow-xs"
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pending Review</div>
          <div className="text-xl font-extrabold text-amber-700">{pendingCount}</div>
          <div className="text-[10px] text-slate-600">Awaiting sanction</div>
        </div>

        <div 
          onClick={() => setStatusFilter('SANCTIONED')} 
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-sky-400 cursor-pointer transition-all space-y-1 shadow-xs"
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Under Execution</div>
          <div className="text-xl font-extrabold text-slate-900">{activeCount}</div>
          <div className="text-[10px] text-slate-600">Active district works</div>
        </div>

        <div 
          onClick={() => setRiskFilter('HIGH')} 
          className="p-3 bg-white rounded-xl border border-rose-200 hover:border-rose-400 cursor-pointer transition-all space-y-1 shadow-xs"
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">High/Critical Risk</div>
          <div className="text-xl font-extrabold text-rose-700">{highRiskCount}</div>
          <div className="text-[10px] text-slate-600 font-medium">Requires scrutiny</div>
        </div>

        <div 
          onClick={() => navigate('/da/inbox')} 
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-sky-400 cursor-pointer transition-all space-y-1 shadow-xs"
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Evidence Requests</div>
          <div className="text-xl font-extrabold text-sky-700">{evidenceRequestsCount}</div>
          <div className="text-[10px] text-slate-600">Awaiting IA response</div>
        </div>

        <div 
          onClick={() => setRiskFilter('CRITICAL')} 
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-sky-400 cursor-pointer transition-all space-y-1 shadow-xs"
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Verification Pending</div>
          <div className="text-xl font-extrabold text-amber-700">{verificationPendingCount}</div>
          <div className="text-[10px] text-slate-600">Human decision required</div>
        </div>

        <div 
          onClick={() => navigate('/da/inbox')} 
          className="p-3 bg-white rounded-xl border border-rose-200 hover:border-rose-400 cursor-pointer transition-all space-y-1 shadow-xs"
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">SLA At Risk</div>
          <div className="text-xl font-extrabold text-rose-700">{slaAtRiskCount}</div>
          <div className="text-[10px] text-slate-600">&le; 15 days remaining</div>
        </div>
      </div>

      {/* PRIORITY WORK / CASE QUEUE TABLE (SANCTIONED WORKS ONLY) */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert size={18} className="text-sky-600" />
            <span>District Priority Work & Case Queue (Sanctioned Works)</span>
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-48">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Work ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs font-medium"
            >
              <option value="ALL">All Risk Bands</option>
              <option value="CRITICAL">CRITICAL Risk</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="LOW">LOW Risk</option>
            </select>

            {(searchTerm || riskFilter !== 'ALL') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setRiskFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
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
              {filteredWorks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">
                    No sanctioned works matching filters.
                  </td>
                </tr>
              ) : (
                filteredWorks.map((item) => (
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
        </CardContent>
      </Card>

      {/* GIS DISTRICT MAP & SPATIAL SUMMARY (REDUCED WIDTH & FUNCTIONAL LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>District Work Locations (PostGIS GIS Plotting)</span>
              <span className="text-xs text-sky-700 font-mono font-bold">{works.length} Active Work Pins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistrictPostGisMap points={works as any} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-bold text-slate-900">GIS Spatial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Jurisdiction Boundary</div>
              <div className="font-bold text-slate-800">Mumbai City Collectorate District</div>
              <div className="text-[11px] text-sky-700 font-mono font-semibold">PostGIS SRID 4326 (WGS 84)</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-600 font-medium">Total GIS Pins</div>
                <div className="text-base font-extrabold text-slate-900">{works.length}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-600 font-medium">Risk Anomaly Flags</div>
                <div className="text-base font-extrabold text-rose-700">{highRiskCount}</div>
              </div>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 leading-relaxed font-medium">
              <strong className="text-sky-950 font-bold">POSTGIS SPATIAL CORROBORATION:</strong> Interactive pins render site progress buffers (250m radius). Click any pin marker to view physical progress, estimated cost, and SLA status.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
