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

    // Read stored recommendations & IA evidence uploads for live Risk Level Sync
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
      Object.keys(schedules).forEach(k => localSchedulesMap.set(k, schedules[k]));
    }

    daService.getPriorityQueue().then((res) => {
      const sourceWorks = (res.priority_queue && res.priority_queue.length > 0) ? res.priority_queue : SANCTIONED_PRIORITY_WORKS;
      
      const mapped = sourceWorks.map((r, idx) => {
        const localRec = localRecsMap.get(r.id);
        const localPhoto = localPhotosMap.get(r.id);
        const localSched = localSchedulesMap.get(r.id);

        const activeStatus = localRec?.status || r.status || 'SANCTIONED';
        const isCleared = activeStatus === 'CLEARED';
        const hasPhoto = Boolean(localPhoto);
        const isPhotoReused = Boolean(localPhoto?.is_phash_suspicious);

        const physProg = localSched?.physical_progress ?? localPhoto?.physical_progress ?? localRec?.physical_progress ?? (hasPhoto ? 79 : (idx % 2 === 0 ? 31 : 55));
        const isLowRisk = isCleared || (hasPhoto && !isPhotoReused && physProg >= 70);

        return {
          ...r,
          status: activeStatus as any,
          work_id_code: (r as any).work_id_code || `W-10${74 + idx}`,
          physical_progress: physProg,
          payment_progress: isLowRisk ? physProg : 78,
          risk_level: (isLowRisk ? 'LOW' : 'CRITICAL') as any,
          risk_score: isLowRisk ? 18 : 86,
          main_reason: isCleared ? 'Case Cleared by District Officer' : isLowRisk ? 'Verified distinct site photos & milestone progress (Passed Integrity)' : 'Payment/progress divergence (+47% delta)',
          evidence_status: (hasPhoto ? 'Complete' : 'Incomplete') as any,
        };
      });
      setWorks(mapped);
    }).catch(() => {
      // Fallback
    });
  }, []);

  const pendingCount = metrics ? metrics.pending_sanctions : 2;
  const activeCount = metrics ? metrics.active_works : works.length;
  const highRiskCount = works.filter((w) => ['HIGH', 'CRITICAL'].includes(w.risk_level)).length;
  const evidenceRequestsCount = works.filter((w) => w.evidence_status === 'Requested' || w.evidence_status === 'Incomplete').length;
  const verificationPendingCount = works.filter((w) => w.risk_level === 'CRITICAL' || w.is_sla_breached).length;
  const slaAtRiskCount = metrics ? metrics.sla_warnings : works.filter((w) => (w.days_remaining || 30) <= 15).length;

  const filteredWorks = works.filter((w) => {
    const matchText = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      w.work_id_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      w.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || w.risk_level === riskFilter;
    const matchStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchText && matchRisk && matchStatus;
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
      {/* Officer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            District Collectorate Command Center
            <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
              Mumbai City District
            </span>
          </h2>
          <p className="text-xs text-slate-400">Section 5.2 MPLADS Statutory Review Protocol • 75-Day SLA Countdown Active</p>
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
          className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all space-y-1"
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Review</div>
          <div className="text-xl font-extrabold text-amber-400">{pendingCount}</div>
          <div className="text-[10px] text-slate-500">Awaiting sanction</div>
        </div>

        <div 
          onClick={() => setStatusFilter('SANCTIONED')} 
          className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all space-y-1"
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Under Execution</div>
          <div className="text-xl font-extrabold text-slate-100">{activeCount}</div>
          <div className="text-[10px] text-slate-500">Active district works</div>
        </div>

        <div 
          onClick={() => setRiskFilter('HIGH')} 
          className="p-3 bg-slate-950 rounded-xl border border-rose-500/30 hover:border-rose-500/60 cursor-pointer transition-all space-y-1"
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">High/Critical Risk</div>
          <div className="text-xl font-extrabold text-rose-400">{highRiskCount}</div>
          <div className="text-[10px] text-slate-500 font-medium">Requires scrutiny</div>
        </div>

        <div 
          onClick={() => navigate('/da/inbox')} 
          className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all space-y-1"
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evidence Requests</div>
          <div className="text-xl font-extrabold text-sky-400">{evidenceRequestsCount}</div>
          <div className="text-[10px] text-slate-500">Awaiting IA response</div>
        </div>

        <div 
          onClick={() => setRiskFilter('CRITICAL')} 
          className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all space-y-1"
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verification Pending</div>
          <div className="text-xl font-extrabold text-amber-300">{verificationPendingCount}</div>
          <div className="text-[10px] text-slate-500">Human decision required</div>
        </div>

        <div 
          onClick={() => navigate('/da/inbox')} 
          className="p-3 bg-slate-950 rounded-xl border border-rose-500/30 hover:border-rose-500/60 cursor-pointer transition-all space-y-1"
        >
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SLA At Risk</div>
          <div className="text-xl font-extrabold text-rose-400">{slaAtRiskCount}</div>
          <div className="text-[10px] text-slate-500">&le; 15 days remaining</div>
        </div>
      </div>

      {/* PRIORITY WORK / CASE QUEUE TABLE (SANCTIONED WORKS ONLY) */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3">
          <CardTitle className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <ShieldAlert size={18} className="text-sky-400" />
            <span>District Priority Work & Case Queue (Sanctioned Works)</span>
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-48">
              <Search size={14} className="absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Search Work ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
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
            <thead className="bg-slate-900 border-y border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Work ID</th>
                <th className="py-2.5 px-4">Sanctioned Work Name & Location</th>
                <th className="py-2.5 px-4">Physical %</th>
                <th className="py-2.5 px-4">Payment %</th>
                <th className="py-2.5 px-4">Risk Level</th>
                <th className="py-2.5 px-4">Main Signal Reason</th>
                <th className="py-2.5 px-4">Evidence</th>
                <th className="py-2.5 px-4">SLA</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWorks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">
                    No sanctioned works matching filters.
                  </td>
                </tr>
              ) : (
                filteredWorks.map((item) => (
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
        </CardContent>
      </Card>

      {/* GIS DISTRICT MAP & SPATIAL SUMMARY (REDUCED WIDTH & FUNCTIONAL LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center justify-between">
              <span>District Work Locations (PostGIS GIS Plotting)</span>
              <span className="text-xs text-sky-400 font-mono font-bold">{works.length} Active Work Pins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistrictPostGisMap points={works as any} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-bold text-slate-100">GIS Spatial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Jurisdiction Boundary</div>
              <div className="font-bold text-slate-200">Mumbai City Collectorate District</div>
              <div className="text-[11px] text-sky-400 font-mono">PostGIS SRID 4326 (WGS 84)</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-slate-400">Total GIS Pins</div>
                <div className="text-base font-extrabold text-slate-100">{works.length}</div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-slate-400">Risk Anomaly Flags</div>
                <div className="text-base font-extrabold text-rose-400">{highRiskCount}</div>
              </div>
            </div>

            <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl text-[11px] text-sky-200 leading-relaxed">
              <strong>POSTGIS SPATIAL CORROBORATION:</strong> Interactive pins render site progress buffers (250m radius). Click any pin marker to view physical progress, estimated cost, and SLA status.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
