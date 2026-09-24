import { api } from './api';
import { WorkRecommendation } from '../types/project';

export interface IaWorkItem {
  id: string;
  work_id_code?: string;
  title: string;
  sector: string;
  estimated_cost: number;
  sanctioned_amount?: number;
  status: string;
  address: string;
  latitude?: number;
  longitude?: number;
  sla_deadline?: string;
  created_at: string;
  days_remaining: number;
  is_sla_breached?: boolean;
  mp_name?: string;
  physical_progress?: number;
  payment_disbursed?: number;
}

export interface IaEvidenceRequest {
  id: string;
  work_id: string;
  work_id_code?: string;
  work_title?: string;
  evidence_type?: string;
  request_type?: string;
  status: string;
  reason?: string;
  notes?: string;
  response_notes?: string;
  requested_by?: string;
  deadline?: string;
}

export interface ProgressUpdateResponse {
  message: string;
  progress_record: {
    id: string;
    physical_percentage: number;
    milestone_name: string;
    submitted_at: string;
    remarks?: string;
  };
  new_physical_progress: number;
}

export interface PhotoUploadResponse {
  message: string;
  photo: {
    id: string;
    file_path: string;
  };
  verification?: {
    phash?: string;
    gps_distance_offset_meters?: number;
    is_gps_mismatch?: boolean;
    signals?: string[];
  };
}

export interface PaymentClaimResponse {
  message: string;
  claim_details?: any;
}

export const iaService = {
  getAssignedWorks: async (): Promise<{ works: IaWorkItem[] }> => {
    try {
      const res = await api.get('/ia/works');
      return res.data;
    } catch (err) {
      return { works: [] };
    }
  },

  getWorkDetail: async (id: string): Promise<{ work: IaWorkItem }> => {
    try {
      const res = await api.get(`/ia/works/${id}`);
      return res.data;
    } catch (err) {
      return {
        work: {
          id: id || 'r1000000-0000-0000-0000-000000000001',
          work_id_code: 'W-1042',
          title: 'Solar RO Water Purifier Plant Installation',
          sector: 'Drinking Water Facilities',
          estimated_cost: 2500000,
          sanctioned_amount: 2500000,
          status: 'SANCTIONED',
          address: 'Ward 4, Fort, Mumbai',
          latitude: 18.9220,
          longitude: 72.8347,
          created_at: new Date().toISOString(),
          days_remaining: 75,
          physical_progress: 35,
          payment_disbursed: 1950000,
        }
      };
    }
  },

  submitProgressUpdate: async (
    id: string,
    payload: { physical_progress_percentage: number; milestone_stage: string; remark?: string }
  ): Promise<ProgressUpdateResponse> => {
    const res = await api.post(`/ia/works/${id}/progress`, payload);
    return res.data;
  },

  uploadProgressPhoto: async (id: string, formData: FormData): Promise<PhotoUploadResponse> => {
    const res = await api.post(`/ia/works/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  submitPaymentClaim: async (
    id: string,
    payload: { invoice_ref: string; vendor_name: string; bill_date: string; requested_amount: number }
  ): Promise<PaymentClaimResponse> => {
    const res = await api.post(`/ia/works/${id}/payment-requests`, payload);
    return res.data;
  },

  submitCompletion: async (id: string, completion_notes?: string) => {
    const res = await api.post(`/ia/works/${id}/submit-completion`, { completion_notes });
    return res.data;
  },

  getEvidenceRequests: async (): Promise<{ evidence_requests: IaEvidenceRequest[] }> => {
    try {
      const res = await api.get('/ia/evidence-requests');
      return res.data;
    } catch (err) {
      return { evidence_requests: [] };
    }
  },

  respondEvidenceRequest: async (requestId: string, payload: FormData | { response_notes?: string }) => {
    if (payload instanceof FormData) {
      const res = await api.post(`/ia/evidence-requests/${requestId}/respond`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } else {
      const res = await api.post(`/ia/evidence-requests/${requestId}/respond`, payload);
      return res.data;
    }
  },
};

