import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ShapExplainer } from '../../types/risk';
import { Sparkles, HelpCircle } from 'lucide-react';

interface ShapExplainerCardProps {
  explainers: ShapExplainer[];
}

export const ShapExplainerCard: React.FC<ShapExplainerCardProps> = ({ explainers }) => {
  const sampleExplainers: ShapExplainer[] = [
    {
      feature_name: 'SBERT Text Similarity Score',
      feature_value: 0.9400,
      shap_value: 35.20,
      impact_description: '94% textual similarity to previously funded recommendation REC-2024-MH01-084.'
    },
    {
      feature_name: 'Estimated Cost Variance',
      feature_value: 1.4500,
      shap_value: 22.80,
      impact_description: 'Cost estimated 45% above regional benchmark for smart classroom computer labs.'
    }
  ];

  const displayList = explainers.length > 0 ? explainers : sampleExplainers;

  return (
    <Card className="border-sky-500/30 bg-slate-950/80">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-sky-400">
          <Sparkles size={20} />
          <span>SHAP (SHapley Additive exPlanations) AI Feature Importance Card</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-400">
          SHAP values explain how each individual feature nudged the Isolation Forest model output away from baseline expectation.
        </p>

        <div className="space-y-3">
          {displayList.map((exp, idx) => (
            <div key={idx} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-slate-200">{exp.feature_name}</span>
                <span className="text-xs font-extrabold text-rose-400">+{exp.shap_value} SHAP Risk Weight</span>
              </div>
              <p className="text-xs text-slate-400">{exp.impact_description}</p>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, exp.shap_value * 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
