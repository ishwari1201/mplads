import React, { useEffect, useState } from 'react';
import { Briefcase, RefreshCw, AlertTriangle, ShieldCheck, Search } from 'lucide-react';
import { stateService, ContractorAnalytics } from '../../services/stateService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StateContractorMonitoring: React.FC = () => {
  const [contractors, setContractors] = useState<ContractorAnalytics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stateService.getContractorAnalytics();
      setContractors(data.contractors);
    } catch (err: any) {
      setError('Unable to load contractor concentration analytics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Briefcase size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Contractor & Implementing Agency Oversight</h1>
            <p className="text-xs text-slate-600 font-medium">
              Statewide concentration index, expenditure share & potential relationship monitoring
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchContractors}
          disabled={loading}
          className="flex items-center space-x-2 text-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Contractor Analytics Table */}
      <Card className="p-5 border-slate-200 bg-white shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Implementing Agency & Contractor Directory
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-y border-slate-200 tracking-wider">
              <tr>
                <th className="p-3">Agency / Contractor Name</th>
                <th className="p-3">Agency Type</th>
                <th className="p-3">Primary District</th>
                <th className="p-3">Total Projects</th>
                <th className="p-3">Total Sanctioned Value</th>
                <th className="p-3">High Risk Projects</th>
                <th className="p-3">Concentration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {contractors.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">{c.contractor_name}</td>
                  <td className="p-3 text-slate-600">{c.agency_type}</td>
                  <td className="p-3 text-slate-700 font-medium">{c.district_name || 'Mumbai City'}</td>
                  <td className="p-3 font-bold text-slate-900">{c.project_count}</td>
                  <td className="p-3 font-bold text-slate-900">₹{Number(c.total_value).toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    {c.high_risk_projects > 0 ? (
                      <Badge variant="warning">{c.high_risk_projects} High Risk</Badge>
                    ) : (
                      <span className="text-slate-500 font-medium">0</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant="info">
                      {c.verification_status || 'Requires Verification'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
