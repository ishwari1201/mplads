import { api } from './api';
import { WorkRecommendation } from '../types/project';

export interface DaOverviewMetrics {
  pending_sanctions: number;
  active_works: number;
  sla_warnings: number;
  avg_approval_latency: number;
}

export interface RiskHistoryPoint {
  date: string;
  risk_score: number;
  risk_level: string;
  reason?: string;
}

export interface GovernmentChecksResponse {
  project_id: string;
  mplads: {
    status: string;
    records_checked: number;
    matching_count: number;
    closest_match?: {
      work_id: string;
      title: string;
      distance_meters: number;
      cost_difference_percent: number;
      similarity_percent: number;
    };
  };
  ogd: {
    status: string;
    matching_count: number;
    source: string;
    dataset_id?: string;
    external_record_id?: string;
    reason?: string;
    provenance?: any;
  };
  jansoochna: {
    status: string;
    matching_count: number;
    source: string;
    reason?: string;
    provenance?: any;
  };
}

export interface SatelliteVerificationResponse {
  project_id: string;
  observation: {
    source: string;
    acquisition_date: string;
    before_image_url: string;
    after_image_url: string;
    change_score: number;
    change_class: string;
    status: string;
    provenance?: any;
  };
}

export interface WorkAnalysisResponse {
  project_id: string;
  risk_score: number;
  risk_level: string;
  analysis: Array<{
    category: string;
    effect: string;
    explanation: string;
  }>;
}

export interface PreSanctionScreenResponse {
  proposed_work_id?: string;
  semantic_score: number;
  lexical_score: number;
  spatial_score: number;
  cost_score: number;
  final_similarity_score: number;
  is_potentially_duplicate: boolean;
  recommendation_flag: string;
  top_matches: Array<{
    work_id: string;
    title: string;
    similarity_score: number;
    distance_meters: number;
  }>;
}

export interface ExecutionStatsResponse {
  project_id: string;
  sanctioned_amount: number;
  total_disbursed: number;
  payment_percentage: number;
  physical_progress_percentage: number;
  payment_progress_divergence: number;
  signals: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}

export interface EvidenceResponse {
  project_id: string;
  photos: Array<{
    id: string;
    file_path: string;
    phash_value?: string;
    latitude?: number;
    longitude?: number;
    gps_distance_offset_meters?: number;
    is_gps_mismatch?: boolean;
    is_phash_suspicious?: boolean;
  }>;
  evidence_requests?: Array<{
    id: string;
    work_id: string;
    evidence_type: string;
    reason: string;
    deadline?: string;
    status: string;
    submitted_photo_url?: string;
    response_notes?: string;
  }>;
}

export const daService = {
  getOverviewMetrics: async (): Promise<{ metrics: DaOverviewMetrics }> => {
    const res = await api.get('/da/overview-metrics');
    return res.data;
  },

  getPriorityQueue: async (): Promise<{ priority_queue: WorkRecommendation[] }> => {
    try {
      const res = await api.get('/da/priority-queue');
      return res.data;
    } catch (err) {
      return { priority_queue: [] };
    }
  },

  getPendingRecommendations: async (): Promise<{ recommendations: WorkRecommendation[] }> => {
    try {
      const res = await api.get('/da/pending-recommendations');
      return res.data;
    } catch (err) {
      return { recommendations: [] };
    }
  },

  getRiskHistory: async (id: string): Promise<{ project_id: string; history: RiskHistoryPoint[] }> => {
    const res = await api.get(`/da/works/${id}/risk-history`);
    return res.data;
  },

  getGovernmentChecks: async (id: string): Promise<GovernmentChecksResponse> => {
    const res = await api.get(`/da/works/${id}/government-checks`);
    return res.data;
  },

  getSatelliteVerification: async (id: string): Promise<SatelliteVerificationResponse> => {
    const res = await api.get(`/da/works/${id}/satellite-verification`);
    return res.data;
  },

  getWorkAnalysis: async (id: string): Promise<WorkAnalysisResponse> => {
    const res = await api.get(`/da/works/${id}/analysis`);
    return res.data;
  },

  runPreSanctionScreen: async (id: string): Promise<PreSanctionScreenResponse> => {
    const res = await api.post(`/da/works/${id}/pre-sanction-screen`);
    return res.data;
  },

  sanctionProject: async (payload: {
    project_id: string;
    sanctioned_amount: number;
    ia_id?: string;
    target_completion_date?: string;
    sanction_order_ref?: string;
    remarks?: string;
  }) => {
    const res = await api.post('/da/sanction-project', payload);
    return res.data;
  },

  assignIA: async (id: string, payload: { ia_id: string; contract_amount?: number; target_completion_date?: string }) => {
    const res = await api.post(`/da/works/${id}/assign-ia`, payload);
    return res.data;
  },

  requestEvidence: async (id: string, payload: {
    evidence_type: string;
    reason: string;
    instructions?: string;
    deadline?: string;
    priority?: string;
  }) => {
    const res = await api.post(`/da/works/${id}/request-evidence`, payload);
    return res.data;
  },

  returnForCorrection: async (id: string, correction_reason: string) => {
    const res = await api.post(`/da/works/${id}/return-correction`, { correction_reason });
    return res.data;
  },

  getExecutionStats: async (id: string): Promise<ExecutionStatsResponse> => {
    const res = await api.get(`/da/works/${id}/execution-stats`);
    return res.data;
  },

  getWorkEvidence: async (id: string): Promise<EvidenceResponse> => {
    const res = await api.get(`/da/works/${id}/evidence`);
    return res.data;
  },

  performCaseAction: async (id: string, action: string, notes?: string, extraPayload?: any) => {
    const res = await api.post(`/da/cases/${id}/action`, { action, notes, ...extraPayload });
    return res.data;
  },

  rejectProject: async (payload: { project_id: string; rejection_reason: string }) => {
    const res = await api.post('/da/reject-project', payload);
    return res.data;
  },
};
