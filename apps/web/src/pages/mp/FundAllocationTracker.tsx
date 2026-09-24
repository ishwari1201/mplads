import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ShieldCheck, Info } from 'lucide-react';

interface QuotaData {
  quota: number;
  spent: number;
  balance: number;
}

interface FundAllocationTrackerProps {
  financials?: {
    total_allocation: number;
    total_spent: number;
    unallocated_balance: number;
    quotas: {
      sc: QuotaData;
      st: QuotaData;
      general: QuotaData;
    };
  };
}

export const FundAllocationTracker: React.FC<FundAllocationTrackerProps> = ({ financials }) => {
  const sc = financials?.quotas?.sc || { quota: 7500000, spent: 2500000, balance: 5000000 };
  const st = financials?.quotas?.st || { quota: 3750000, spent: 1000000, balance: 2750000 };
  const general = financials?.quotas?.general || { quota: 38750000, spent: 15000000, balance: 23750000 };

  const scPct = Math.min(100, (sc.spent / sc.quota) * 100);
  const stPct = Math.min(100, (st.spent / st.quota) * 100);
  const genPct = Math.min(100, (general.spent / general.quota) * 100);

  return (
    <Card className="border-sky-200 bg-white shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="flex items-center justify-between text-slate-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={20} className="text-sky-700" />
            <span>Statutory Fund Allocation & Quota Tracker</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">Section 4.1 MPLADS Guidelines</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-3">
        {/* 1. SC Reserved Fund (15%) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="font-semibold text-slate-800 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>SC Statutory Reserved Quota (15%)</span>
            </div>
            <div className="text-slate-600 font-mono font-bold">
              ₹{(sc.spent / 100000).toFixed(2)}L / ₹{(sc.quota / 100000).toFixed(2)}L ({scPct.toFixed(1)}%)
            </div>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${scPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Remaining Balance: ₹{(sc.balance / 100000).toFixed(2)} Lakhs</span>
            <span>Mandatory minimum: ₹75.00 Lakhs</span>
          </div>
        </div>

        {/* 2. ST Reserved Fund (7.5%) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="font-semibold text-slate-800 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
              <span>ST Statutory Reserved Quota (7.5%)</span>
            </div>
            <div className="text-slate-600 font-mono font-bold">
              ₹{(st.spent / 100000).toFixed(2)}L / ₹{(st.quota / 100000).toFixed(2)}L ({stPct.toFixed(1)}%)
            </div>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${stPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Remaining Balance: ₹{(st.balance / 100000).toFixed(2)} Lakhs</span>
            <span>Mandatory minimum: ₹37.50 Lakhs</span>
          </div>
        </div>

        {/* 3. General Public Works (77.5%) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="font-semibold text-slate-800 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
              <span>General Public Infrastructure (77.5%)</span>
            </div>
            <div className="text-slate-600 font-mono font-bold">
              ₹{(general.spent / 10000000).toFixed(2)}Cr / ₹{(general.quota / 10000000).toFixed(2)}Cr ({genPct.toFixed(1)}%)
            </div>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${genPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Remaining Balance: ₹{(general.balance / 10000000).toFixed(2)} Crores</span>
            <span>Unallocated Entitlement Cap: ₹3.875 Crores</span>
          </div>
        </div>

        {/* Quota Compliance Notice */}
        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-start space-x-3 text-xs text-sky-900">
          <Info size={16} className="text-sky-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Constitutional Statutory Compliance:</span> Under revised MPLADS 2023 Guidelines, MPs must recommend at least 15% of their entitlement for SC inhabited areas and 7.5% for ST inhabited areas before unallocated balances roll over.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
