import { api } from './api';

export interface NationalRiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface NationalOverviewMetrics {
  total_projects: number;
  total_sanctioned_amount: number;
  active_projects: number;
  completed_projects: number;
  pending_review: number;
  sla_breaches: number;
  active_states_count: number;
  active_districts_count: number;
  risk_distribution: NationalRiskDistribution;
}

export interface StateSummary {
  state_id: number;
  state_name: string;
  state_code: string;
  district_count: number;
  total_works: number;
  active_works: number;
  completed_works: number;
  delayed_works: number;
  total_sanctioned_amount: number;
  high_critical_risk_count: number;
  open_cases: number;
}

export interface NationalWork {
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
  state_name?: string;
  district_name?: string;
  risk_score: number;
  risk_level: string;
  is_sla_breached?: boolean;
  cross_state_duplicate_signal?: string | null;
}

export interface MinistryCase {
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
  state_name: string;
  district_name: string;
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

export interface NationalFund {
  mp_id: string;
  mp_name: string;
  party: string;
  constituency_name: string;
  total_allocation: number;
  total_spent: number;
  unallocated_balance: number;
  utilization_percentage: number;
  project_count: number;
}

export interface ContractorNetwork {
  contractor_name: string;
  agency_type: string;
  district_name: string;
  project_count: number;
  total_value: number;
  high_risk_projects: number;
  concentration_index?: string;
  verification_status?: string;
}

export interface CentralAssistantResponse {
  response: string;
  source: string;
  data_context?: any;
}

export const centralService = {
  getNationalOverview: async (): Promise<{ overview: NationalOverviewMetrics }> => {
    const res = await api.get('/central/overview');
    return res.data;
  },

  getStates: async (): Promise<{ states: StateSummary[] }> => {
    const res = await api.get('/central/states');
    return res.data;
  },

  getStateDetail: async (stateId: string): Promise<{ state: any; districts: any[]; works: NationalWork[] }> => {
    const res = await api.get(`/central/states/${stateId}`);
    return res.data;
  },

  getNationalRisk: async (params?: {
    status?: string;
    risk_level?: string;
    sector?: string;
    search?: string;
  }): Promise<{ works: NationalWork[] }> => {
    const res = await api.get('/central/risk', { params });
    return res.data;
  },

  getWorkDetail: async (id: string): Promise<{
    work: NationalWork & { signals: Array<{ type: string; severity: string; message: string }> };
    explainers: any[];
    photos: any[];
    audit_trail: any[];
  }> => {
    const res = await api.get(`/state/works/${id}`);
    return res.data;
  },

  getMinistryCases: async (): Promise<{ cases: MinistryCase[] }> => {
    const res = await api.get('/central/cases');
    return res.data;
  },

  performMinistryCaseAction: async (id: string, action: string, notes?: string) => {
    const res = await api.post(`/central/cases/${id}/action`, { action, notes });
    return res.data;
  },

  getNationalFunds: async (): Promise<{ funds: NationalFund[] }> => {
    const res = await api.get('/central/funds');
    return res.data;
  },

  getContractorNetwork: async (): Promise<{ contractors: ContractorNetwork[] }> => {
    const res = await api.get('/central/contractors');
    return res.data;
  },

  askCentralAssistant: async (question: string, context?: any): Promise<CentralAssistantResponse> => {
    const res = await api.post('/central/ai-assistant', { question, context });
    return res.data;
  },
};
