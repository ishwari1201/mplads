import React, { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { centralService, NationalFund } from '../../services/centralService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const NationalFundTracker: React.FC = () => {
  const [funds, setFunds] = useState<NationalFund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await centralService.getNationalFunds();
      setFunds(data.funds);
    } catch (err: any) {
      setError('Unable to load All-India entitlement release analytics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CreditCard size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-100">National Fund Allocation & Entitlement Releases</h1>
            <p className="text-xs text-slate-400">
              MoSPI annual entitlement release monitoring, statutory 15% SC / 7.5% ST allocation compliance & unallocated balance tracking
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchFunds}
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

      {/* Funds Table */}
      <Card className="p-5 border-slate-800">
        <h2 className="text-sm font-bold text-slate-100 mb-4">
          All-India MP Entitlement Ledger Directory
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3">Member of Parliament</th>
                <th className="p-3">Constituency & State</th>
                <th className="p-3">Annual Entitlement</th>
                <th className="p-3">Expenditure Sanctioned</th>
                <th className="p-3">Unallocated Balance</th>
                <th className="p-3">Utilization Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {funds.map((f) => (
                <tr key={f.mp_id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-3 font-semibold text-slate-200">
                    {f.mp_name} <span className="text-[10px] text-slate-500">({f.party})</span>
                  </td>
                  <td className="p-3 text-slate-300 font-medium">{f.constituency_name}</td>
                  <td className="p-3 font-medium">₹{Number(f.total_allocation).toLocaleString('en-IN')}</td>
                  <td className="p-3 text-emerald-400 font-medium">₹{Number(f.total_spent).toLocaleString('en-IN')}</td>
                  <td className="p-3 font-medium">₹{Number(f.unallocated_balance).toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <Badge variant={f.utilization_percentage >= 50 ? 'success' : 'warning'}>
                      {f.utilization_percentage}% Utilized
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
