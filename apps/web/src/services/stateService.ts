import { api } from './api';

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface StateOverviewMetrics {
  total_projects: number;
  total_sanctioned_amount: number;
  active_projects: number;
  completed_projects: number;
  pending_review: number;
  sla_breaches: number;
  active_districts_count: number;
  risk_distribution: RiskDistribution;
}

export interface DistrictSummary {
  district_id: string;
  district_name: string;
  collector_name: string;
  state_name: string;
  total_works: number;
  active_works: number;
  completed_works: number;
  delayed_works: number;
  total_sanctioned_amount: number;
  high_critical_risk_count: number;
  open_cases: number;
}

export interface StateWork {
  id: string;
  title: string;
  description: string;
  sector: string;
  category: string;
  estimated_cost: number;
  sanctioned_amount: number;
  payment_disbursed: number;
  payment_percentage: number;
  physical_progress_percentage: number;
  payment_progress_divergence: number;
  is_divergence_flagged: boolean;
  status: string;
  address: string;
  sla_deadline: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  mp_name?: string;
  constituency_name?: string;
  risk_score: number;
  risk_level: string;
  is_sla_breached?: boolean;
}

export interface EscalatedCase {
  id: string;
  title: string;
  description: string;
  sector: string;
  category: string;
  estimated_cost: number;
  sanctioned_amount: number;
  status: string;
  address: string;
  sla_deadline: string;
  created_at: string;
  mp_name: string;
  constituency_name: string;
  risk_score: number;
  risk_level: string;
  is_sla_breached: boolean;
  case_age_days: number;
  escalated_from: string;
  escalated_to: string;
  current_owner: string;
  sla_status: string;
  next_action: string;
}

export interface ContractorAnalytics {
  contractor_name: string;
  agency_type: string;
  district_name: string;
  project_count: number;
  total_value: number;
  high_risk_projects: number;
  concentration_index?: string;
  verification_status?: string;
}

export interface StateAssistantResponse {
  response: string;
  source: string;
  data_context?: any;
}

export const stateService = {
  getStateOverview: async (): Promise<{ overview: StateOverviewMetrics }> => {
    const res = await api.get('/state/overview');
    return res.data;
  },

  getDistricts: async (): Promise<{ districts: DistrictSummary[] }> => {
    const res = await api.get('/state/districts');
    return res.data;
  },

  getDistrictDetail: async (districtId: string): Promise<{ district: any; works: StateWork[] }> => {
    const res = await api.get(`/state/districts/${districtId}`);
    return res.data;
  },

  getStateWorks: async (params?: {
    status?: string;
    risk_level?: string;
    sector?: string;
    search?: string;
  }): Promise<{ works: StateWork[] }> => {
    const res = await api.get('/state/works', { params });
    return res.data;
  },

  getWorkDetail: async (id: string): Promise<{
    work: StateWork & { signals: Array<{ type: string; severity: string; message: string }> };
    explainers: any[];
    photos: any[];
    audit_trail: any[];
  }> => {
    const res = await api.get(`/state/works/${id}`);
    return res.data;
  },

  getEscalatedCases: async (): Promise<{ cases: EscalatedCase[] }> => {
    const res = await api.get('/state/cases');
    return res.data;
  },

  performCaseAction: async (id: string, action: string, notes?: string) => {
    const res = await api.post(`/state/cases/${id}/action`, { action, notes });
    return res.data;
  },

  getContractorAnalytics: async (): Promise<{ contractors: ContractorAnalytics[] }> => {
    const res = await api.get('/state/contractors');
    return res.data;
  },

  askStateAssistant: async (question: string, context?: any): Promise<StateAssistantResponse> => {
    const res = await api.post('/state/ai-assistant', { question, context });
    return res.data;
  },
};
