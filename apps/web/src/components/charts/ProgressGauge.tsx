import React from 'react';

interface ProgressGaugeProps {
  percentage: number;
  label: string;
  sublabel?: string;
}

export const ProgressGauge: React.FC<ProgressGaugeProps> = ({ percentage, label, sublabel }) => {
  const normalized = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = 283 - (283 * normalized) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-slate-800 fill-none"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-sky-500 fill-none transition-all duration-1000 ease-out"
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-100">{normalized.toFixed(1)}%</span>
          <span className="text-[10px] text-slate-400 font-medium">UTILIZED</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-sm font-semibold text-slate-200">{label}</div>
        {sublabel && <div className="text-xs text-slate-400 mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
};
