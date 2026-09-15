export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ShapExplainer {
  id?: string;
  feature_name: string;
  feature_value: number;
  shap_value: number;
  impact_description: string;
}

export interface RiskMatrixItem {
  id: string;
  recommendation_no: string;
  title: string;
  estimated_cost: number;
  status: string;
  risk_score: number;
  risk_level: RiskLevel;
  evaluated_at: string;
}
