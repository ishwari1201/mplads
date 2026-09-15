import { api } from './api';
import { RiskMatrixItem, ShapExplainer } from '../types/risk';

export const adminService = {
  getRiskMatrix: async (): Promise<{ matrix: RiskMatrixItem[] }> => {
    const res = await api.get('/admin/risk-matrix');
    return res.data;
  },
  getShapExplainer: async (recId: string): Promise<{ recommendation_id: string; explainers: ShapExplainer[] }> => {
    const res = await api.get(`/admin/shap-explainer/${recId}`);
    return res.data;
  },
  getNationalStats: async () => {
    const res = await api.get('/admin/national-stats');
    return res.data;
  }
};
