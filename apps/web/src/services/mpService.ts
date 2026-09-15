import { api } from './api';
import { WorkRecommendation } from '../types/project';

export interface MpDashboardStatsResponse {
  mp_id: string;
  constituency_name: string;
  party: string;
  financials: {
    total_allocation: number;
    total_spent: number;
    unallocated_balance: number;
    quotas: {
      sc: { quota: number; spent: number; balance: number };
      st: { quota: number; spent: number; balance: number };
      general: { quota: number; spent: number; balance: number };
    };
  };
  counts: {
    total_recommended: number;
    approved_count: number;
    pending_count: number;
    high_risk_count: number;
  };
}

export interface DuplicateCheckResponse {
  similarity_score: number;
  is_duplicate: boolean;
}

export const mpService = {
  getDashboardStats: async (): Promise<MpDashboardStatsResponse> => {
    const res = await api.get('/mp/dashboard-stats');
    return res.data;
  },
  getRecommendations: async (): Promise<{ recommendations: WorkRecommendation[] }> => {
    try {
      const res = await api.get('/mp/recommendations');
      const localStr = localStorage.getItem('mplads_submitted_recommendations');
      const localList: WorkRecommendation[] = localStr ? JSON.parse(localStr) : [];
      return { recommendations: [...localList, ...(res.data.recommendations || [])] };
    } catch (err) {
      const localStr = localStorage.getItem('mplads_submitted_recommendations');
      const localList: WorkRecommendation[] = localStr ? JSON.parse(localStr) : [];
      return { recommendations: localList };
    }
  },
  submitRecommendation: async (data: Partial<WorkRecommendation>) => {
    const res = await api.post('/mp/recommendations', data);
    return res.data;
  },
  checkDuplicateText: async (title: string, description: string): Promise<DuplicateCheckResponse> => {
    const res = await api.post('/mp/check-duplicate', { title, description });
    return res.data;
  },
};
