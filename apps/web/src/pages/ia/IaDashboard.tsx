import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { iaService, IaWorkItem } from '../../services/iaService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Building2, Camera, CreditCard, Clock, AlertTriangle, CheckCircle2, 
  ArrowRight, Search, FileText, Layers, ShieldAlert, Flame, MapPin, ExternalLink
} from 'lucide-react';

export const IaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState<IaWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Read local submitted recommendations from MP proposals for dynamic SLA target schedules
    const recsStr = localStorage.getItem('mplads_submitted_recommendations');
    const iaSchedulesStr = localStorage.getItem('mplads_ia_schedules');
    const iaSchedules = iaSchedulesStr ? JSON.parse(iaSchedulesStr) : {};

    let localWorks: any[] = [];
    if (recsStr) {
      const recs = JSON.parse(recsStr);
      localWorks = recs.map((r: any, idx: number) => {
        const sched = iaSchedules[r.id] || iaSchedules[`r-${r.id}`] || iaSchedules[`W-10${74 + idx}`];
        return {
          id: r.id,
          work_id_code: `W-10${74 + idx}`,
          title: r.title,
          description: r.description,
          address: r.address,
          sanctioned_amount: r.sanctioned_amount || r.estimated_cost,
          estimated_cost: r.estimated_cost,
          physical_progress: sched?.physical_progress !== undefined 
            ? sched.physical_progress 
            : (r.physical_progress !== undefined ? r.physical_progress : 0),
          status: r.status || 'SANCTIONED',
          sla_target_days: r.sla_target_days || r.days_remaining || (45 + (idx % 4) * 15),
          days_remaining: r.sla_target_days || r.days_remaining || (45 + (idx % 4) * 15),
        };
      });
    }

    iaService.getAssignedWorks()
      .then(res => {
        const enrichedApiWorks = (res.works || []).map((w: any, idx: number) => {
          const sched = iaSchedules[w.id] || iaSchedules[`r-${w.id}`] || (w.work_id_code ? iaSchedules[w.work_id_code] : null);
          return {
            ...w,
            physical_progress: sched?.physical_progress !== undefined 
              ? sched.physical_progress 
              : (w.physical_progress !== undefined ? w.physical_progress : 0)
          };
        });
        const combined = [...localWorks, ...enrichedApiWorks];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        setWorks(unique);
      })
      .catch(() => {
        if (localWorks.length > 0) setWorks(localWorks);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredWorks = works.filter(w =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.work_id_code && w.work_id_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    w.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hotWorkId = works[0]?.id || 'r1000000-0000-0000-0000-000000000001';

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hoverEffect={false}>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-sky-50 text-sky-700 rounded-xl border border-sky-200">
              <Building2 size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-600 font-medium">Assigned Works</div>
              <div className="text-xl font-extrabold text-slate-900">{works.length} Active</div>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect={false}>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-600 font-medium">Executing Works</div>
              <div className="text-xl font-extrabold text-emerald-800">{works.filter(w => ['SANCTIONED', 'IN_PROGRESS', 'RECOMMENDED'].includes(w.status)).length} Executing</div>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect={false}>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
              <Flame size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-600 font-medium">Active Hot Topics</div>
              <div className="text-xl font-extrabold text-rose-700">2 High Priority</div>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect={false}>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-600 font-medium">Avg Completion SLA</div>
              <div className="text-xl font-extrabold text-indigo-800">60 Days</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2 HOT TOPICS SECTION */}
      <Card className="border-rose-200 bg-rose-50/30">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-rose-800 flex items-center space-x-2">
            <Flame size={18} className="text-rose-600" />
            <span>Implementing Agency Hot Topics & Critical Work Signals</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hot Topic 1 */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sky-700 text-xs">W-1042</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                  <AlertTriangle size={12} className="mr-1" /> HIGH DIVERGENCE (+47% DELTA)
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Financial Payment vs Physical Progress Mismatch</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Disbursement velocity (78% paid, ₹19.5L) significantly leads reported physical construction progress (31%). Field engineer must upload current milestone verification.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <Link to={`/ia/work/${hotWorkId}`}>
                <Button variant="gold" size="sm">
                  Execute & Sync Milestone <ExternalLink size={12} className="ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Hot Topic 2 */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sky-700 text-xs">W-1042</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                  <MapPin size={12} className="mr-1" /> EXIF GPS OFFSET (1,420m)
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Site Evidence Geotag Location Mismatch</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Uploaded site photograph contains EXIF GPS coordinates located 1,420 meters away from registered PostGIS project site coordinates. Requires re-upload at site.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <Link to={`/ia/work/${hotWorkId}`}>
                <Button variant="secondary" size="sm">
                  Re-upload Site Geotag <Camera size={12} className="ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Works Directory Table */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Layers size={18} className="text-emerald-700" />
            <span>Assigned District Works Directory</span>
          </CardTitle>

          <div className="relative w-64">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assigned works..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Work ID</th>
                <th className="py-2.5 px-4">Work Name & Locality</th>
                <th className="py-2.5 px-4">Sanction Amount</th>
                <th className="py-2.5 px-4">Physical Progress</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">SLA Deadline</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWorks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">No assigned works found.</td>
                </tr>
              ) : (
                filteredWorks.map((work: any, idx: number) => {
                  const targetSlaDays = work.sla_target_days || work.days_remaining || (45 + (idx % 4) * 15);
                  return (
                    <tr key={work.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-700">
                        {work.work_id_code || `W-10${74 + idx}`}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{work.title}</div>
                        <div className="text-[11px] text-slate-600 truncate">{work.address}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{Number(work.sanctioned_amount || work.estimated_cost).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-600 h-full" style={{ width: `${work.physical_progress || 0}%` }} />
                          </div>
                          <span className="font-bold text-slate-800">{work.physical_progress || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success">{work.status || 'SANCTIONED'}</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-amber-800 font-bold">
                        {targetSlaDays} Days Target Schedule
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/ia/work/${work.id}`}>
                          <Button variant="secondary" size="sm">
                            Execute Work <ArrowRight size={12} className="ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
