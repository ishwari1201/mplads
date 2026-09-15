import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface RiskRadarProps {
  data?: Array<{ subject: string; A: number; fullMark: number }>;
}

export const RiskRadar: React.FC<RiskRadarProps> = ({ data }) => {
  const defaultData = [
    { subject: 'Cost Variance', A: 85, fullMark: 100 },
    { subject: 'SBERT Duplication', A: 92, fullMark: 100 },
    { subject: 'pHash Image Integrity', A: 45, fullMark: 100 },
    { subject: 'SLA Delay Risk', A: 70, fullMark: 100 },
    { subject: 'Citizen Feedback', A: 30, fullMark: 100 },
  ];

  const chartData = data || defaultData;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
          <Radar name="Risk Index" dataKey="A" stroke="#38bdf8" fill="#0284c7" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
