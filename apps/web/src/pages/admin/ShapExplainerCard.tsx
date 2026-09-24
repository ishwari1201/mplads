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
    <Card className="border-sky-300 bg-sky-50/40 shadow-xs">
      <CardHeader className="border-b border-sky-100 pb-3">
        <CardTitle className="flex items-center space-x-2 text-sky-800 font-bold">
          <Sparkles size={20} className="text-sky-600" />
          <span>SHAP (SHapley Additive exPlanations) AI Feature Importance Card</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <p className="text-xs text-slate-700 font-medium">
          SHAP values explain how each individual feature nudged the Isolation Forest model output away from baseline expectation.
        </p>

        <div className="space-y-3">
          {displayList.map((exp, idx) => (
            <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">{exp.feature_name}</span>
                <span className="text-xs font-extrabold text-rose-700">+{exp.shap_value} SHAP Risk Weight</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{exp.impact_description}</p>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-600 h-full rounded-full"
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
