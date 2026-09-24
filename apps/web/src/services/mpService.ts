import { api } from './api';
import { WorkRecommendation } from '../types/project';
import { MOCK_CONSTITUENCY_WORKS } from '../data/mockConstituencyWorks';

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
    try {
      const res = await api.get('/mp/dashboard-stats');
      return res.data;
    } catch (err) {
      return {
        mp_id: '11111111-1111-1111-1111-111111111111',
        constituency_name: 'Mumbai South',
        party: 'Lok Sabha',
        financials: {
          total_allocation: 50000000,
          total_spent: 38500000,
          unallocated_balance: 11500000,
          quotas: {
            sc: { quota: 7500000, spent: 5000000, balance: 2500000 },
            st: { quota: 3750000, spent: 3000000, balance: 750000 },
            general: { quota: 38750000, spent: 30500000, balance: 8250000 },
          },
        },
        counts: {
          total_recommended: MOCK_CONSTITUENCY_WORKS.length,
          approved_count: MOCK_CONSTITUENCY_WORKS.filter(w => w.status === 'COMPLETED').length,
          pending_count: MOCK_CONSTITUENCY_WORKS.filter(w => w.status === 'RECOMMENDED').length,
          high_risk_count: 0,
        },
      };
    }
  },
  getRecommendations: async (): Promise<{ recommendations: WorkRecommendation[] }> => {
    const localStr = localStorage.getItem('mplads_submitted_recommendations');
    const localList: WorkRecommendation[] = localStr ? JSON.parse(localStr) : [];

    try {
      const res = await api.get('/mp/recommendations');
      const serverList = res.data.recommendations || [];
      const combined = [...localList, ...serverList];
      return { recommendations: combined.length > 0 ? combined : [...localList, ...MOCK_CONSTITUENCY_WORKS] };
    } catch (err) {
      return { recommendations: [...localList, ...MOCK_CONSTITUENCY_WORKS] };
    }
  },
  submitRecommendation: async (data: Partial<WorkRecommendation>) => {
    try {
      const res = await api.post('/mp/recommendations', data);
      return res.data;
    } catch (err) {
      // Save locally to localstorage if backend fails
      const localStr = localStorage.getItem('mplads_submitted_recommendations');
      const localList: WorkRecommendation[] = localStr ? JSON.parse(localStr) : [];
      const newWork: WorkRecommendation = {
        id: `work-local-${Date.now()}`,
        mp_id: '11111111-1111-1111-1111-111111111111',
        constituency_id: 'MUMBAI_SOUTH',
        title: data.title || 'New Constituency Work',
        sector: data.sector || 'Public Works',
        estimated_cost: Number(data.estimated_cost || 1000000),
        sanctioned_amount: Number(data.estimated_cost || 1000000),
        latitude: data.latitude || 18.9220,
        longitude: data.longitude || 72.8347,
        location_address: data.location_address || 'Mumbai South Constituency',
        status: 'RECOMMENDED',
        description: data.description || 'Recommended by MP.',
        created_at: new Date().toISOString(),
      };
      localList.unshift(newWork);
      localStorage.setItem('mplads_submitted_recommendations', JSON.stringify(localList));
      return { success: true, recommendation: newWork };
    }
  },
  checkDuplicateText: async (title: string, description: string): Promise<DuplicateCheckResponse> => {
    try {
      const res = await api.post('/mp/check-duplicate', { title, description });
      return res.data;
    } catch (err) {
      return { similarity_score: 0.12, is_duplicate: false };
    }
  },
};
