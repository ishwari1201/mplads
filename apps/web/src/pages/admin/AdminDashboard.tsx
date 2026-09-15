import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { RiskMatrixItem, ShapExplainer } from '../../types/risk';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { RiskRadar } from '../../components/charts/RiskRadar';
import { ShieldAlert, AlertTriangle, Cpu, Activity } from 'lucide-react';
import { ShapExplainerCard } from './ShapExplainerCard';

export const AdminDashboard: React.FC = () => {
  const [matrix, setMatrix] = useState<RiskMatrixItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedRecId, setSelectedRecId] = useState<string | null>('r1000000-0000-0000-0000-000000000002');
  const [explainers, setExplainers] = useState<ShapExplainer[]>([]);

  useEffect(() => {
    adminService.getRiskMatrix().then((res) => setMatrix(res.matrix)).catch(console.error);
    adminService.getNationalStats().then((res) => setStats(res.summary)).catch(console.error);
    adminService.getShapExplainer('r1000000-0000-0000-0000-000000000002')
      .then((res) => setExplainers(res.explainers))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Central Nodal Authority AI Oversight</h2>
        <p className="text-xs text-slate-400">National MPLADS Anomaly Detection & SHAP Explainability Matrix</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hoverEffect={false}>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total National Works</div>
              <div className="text-xl font-extrabold text-slate-100">{stats?.total_projects || 3}</div>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect={false}>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">High Risk Flagged</div>
              <div className="text-xl font-extrabold text-rose-400">1 Critical</div>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect={false}>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Cpu size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Isolation Forest Engine</div>
              <div className="text-xl font-extrabold text-amber-400">Active (v1.4)</div>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect={false}>
          <CardContent className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">pHash Fraud Detection</div>
              <div className="text-xl font-extrabold text-indigo-400">99.4% Accuracy</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ML Isolation Forest Risk Matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {matrix.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-xl text-xs text-slate-400">
                Default Sample Matrix: REC-2026-MH01-002 (Smart Classroom Computer Lab) - Risk Score 76.40 (HIGH)
              </div>
            ) : (
              matrix.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedRecId(item.id);
                    adminService.getShapExplainer(item.id).then((res) => setExplainers(res.explainers));
                  }}
                  className={`glass-card p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedRecId === item.id ? 'border-sky-500 bg-sky-950/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-slate-100">{item.title}</div>
                      <div className="text-xs text-slate-400">{item.recommendation_no} | Est. Cost: ₹{Number(item.estimated_cost).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-rose-400">{item.risk_score} Score</div>
                      <Badge variant={item.risk_level === 'HIGH' ? 'danger' : 'info'}>{item.risk_level}</Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Multidimensional Risk Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskRadar />
          </CardContent>
        </Card>
      </div>

      {/* SHAP AI Explainability Card */}
      <ShapExplainerCard explainers={explainers} />
    </div>
  );
};
