import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mpService } from '../../services/mpService';
import { WorkRecommendation } from '../../types/project';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PlusCircle, MapPin, Clock, AlertTriangle, Search, DollarSign, Briefcase, Calendar, Info, ShieldCheck, UserCheck } from 'lucide-react';

export const RecommendationList: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<WorkRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  useEffect(() => {
    // Merge backend recommendations with any dynamically submitted local storage items
    const localStr = localStorage.getItem('mplads_submitted_recommendations');
    const localList: WorkRecommendation[] = localStr ? JSON.parse(localStr) : [];

    mpService
      .getRecommendations()
      .then((res) => {
        const mergedMap = new Map<string, WorkRecommendation>();
        localList.forEach((item) => mergedMap.set(item.id, item));
        (res.recommendations || []).forEach((item) => {
          if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
        });
        setRecommendations(Array.from(mergedMap.values()));
      })
      .catch((err) => {
        console.warn('Fallback to local recommendations:', err);
        setRecommendations(localList);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SANCTIONED': return <Badge variant="success">SANCTIONED</Badge>;
      case 'IN_PROGRESS': return <Badge variant="info">IN PROGRESS</Badge>;
      case 'COMPLETED': return <Badge variant="purple">COMPLETED</Badge>;
      case 'REJECTED': return <Badge variant="danger">REJECTED</Badge>;
      case 'FROZEN_PENDING_AUDIT': return <Badge variant="danger">FROZEN (AUDIT FLAG)</Badge>;
      case 'RECOMMENDED':
      default:
        return <Badge variant="warning">RECOMMENDED</Badge>;
    }
  };

  const filtered = recommendations.filter((r) =>
    r.title.toLowerCase().includes(filterText.toLowerCase()) ||
    r.sector.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Recommended Works Directory</h2>
          <p className="text-xs text-slate-400">Track Sanction Lifecycle, SLA Deadlines & Financials</p>
        </div>
        <Link to="/mp/recommend">
          <Button variant="primary" size="md">
            <PlusCircle size={16} className="mr-2" /> New Recommendation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Submitted Projects ({filtered.length})</span>
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter works..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading recommendations...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No project recommendations found.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((item: any) => {
                const daysRem = item.days_remaining !== undefined ? Math.max(0, Math.round(item.days_remaining)) : 65;
                const isBreached = item.is_sla_breached || false;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProject(item)}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-sky-500/60 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-100 group-hover:text-sky-300 transition-colors">
                          {item.title}
                        </span>
                        {getStatusBadge(item.status)}
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.category || 'GENERAL'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center space-x-1">
                          <MapPin size={13} className="text-sky-400" />
                          <span>{item.address}</span>
                        </span>
                        <span>Sector: {item.sector}</span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-between items-end shrink-0 border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-medium">Estimated Budget</div>
                        <div className="text-base font-extrabold text-sky-400">
                          ₹{Number(item.estimated_cost).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-xs mt-2">
                        <Clock size={13} className={isBreached ? 'text-rose-400' : 'text-amber-400'} />
                        <span className={isBreached ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {isBreached ? 'SLA Breached' : `SLA: ${daysRem} Days Left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PROJECT BASIC INFORMATION MODAL */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={`Project Details — ${selectedProject.title}`}
        >
          <div className="space-y-4 text-xs">
            {/* STATUS & HEADER BADGES */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Project Identifier</div>
                <div className="font-mono text-sky-400 font-bold">{selectedProject.id}</div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(selectedProject.status)}
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 font-mono text-[11px] font-bold">
                  {selectedProject.category || 'GENERAL'} QUOTA
                </span>
              </div>
            </div>

            {/* BASIC FINANCIALS CARD */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-sky-400 uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                <DollarSign size={14} />
                <span>Basic Financial Overview</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Estimated Budget</div>
                  <div className="text-sm font-extrabold text-slate-100">
                    ₹{Number(selectedProject.estimated_cost || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Sanctioned Allocation</div>
                  <div className="text-sm font-extrabold text-emerald-400">
                    ₹{Number(selectedProject.sanctioned_amount || selectedProject.estimated_cost || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Disbursed Installment</div>
                  <div className="text-sm font-extrabold text-sky-400">
                    ₹{Number((selectedProject.estimated_cost || 0) * 0.5).toLocaleString('en-IN')} (First Tranche)
                  </div>
                </div>
              </div>
            </div>

            {/* IMPLEMENTING AGENCY & ASSIGNED CONTRACTOR NAME */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-purple-400 uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                <Briefcase size={14} />
                <span>Implementing Agency & Execution Contractor</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400">Nodal Implementing Agency (IA):</span>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {selectedProject.ia_name || 'Maharashtra Public Works Dept (PWD) / Municipal Corp'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Assigned Execution Contractor:</span>
                  <div className="font-bold text-purple-300 mt-0.5">
                    {selectedProject.contractor_name || 'National Building Construction Corp (NBCC India Ltd)'}
                  </div>
                </div>
              </div>
            </div>

            {/* SLA TARGET DEADLINE & SCHEDULE */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-amber-400 uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                <Calendar size={14} />
                <span>Statutory SLA Schedule & Target Deadline</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400">Proposal Date:</span>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString('en-IN') : '2026-08-12'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Statutory SLA Target Days:</span>
                  <div className="font-bold text-amber-300 mt-0.5">
                    {selectedProject.sla_target_days || 75} Days Statutory Window
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Target Completion Deadline:</span>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {selectedProject.target_completion_date || selectedProject.sla_deadline ? (
                      new Date(selectedProject.target_completion_date || selectedProject.sla_deadline).toLocaleDateString('en-IN')
                    ) : '2026-10-26'}
                  </div>
                </div>
              </div>
            </div>

            {/* LOCATION SPECS & TECHNICAL DESCRIPTION */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-[11px]">
              <div className="font-bold text-sky-400 uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                <MapPin size={14} />
                <span>Location & Technical Description</span>
              </div>
              <div><span className="text-slate-400">Address:</span> <strong className="text-slate-200">{selectedProject.address}</strong></div>
              <div>
                <span className="text-slate-400">GIS Coordinates:</span>{' '}
                <strong className="font-mono text-sky-300">
                  {selectedProject.latitude || 18.9067}° N, {selectedProject.longitude || 72.8258}° E
                </strong>
              </div>
              <div><span className="text-slate-400">Scope:</span> <span className="text-slate-300 italic">"{selectedProject.description}"</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedProject(null)}>Close Details</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
