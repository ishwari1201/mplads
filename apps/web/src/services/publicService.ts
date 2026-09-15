import { api } from './api';
import { WorkRecommendation } from '../types/project';

export interface CitizenReportPayload {
  work_id?: string;
  category: string;
  description: string;
  reporter_name?: string;
  reporter_email?: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  photo?: File;
}

export interface StateItem {
  id: number;
  state_code: string;
  name: string;
}

export interface DistrictItem {
  id: string | number;
  district_name: string;
  state_id: number;
}

export interface ConstituencyItem {
  id: number;
  name: string;
  state_id: number;
  house_type: string;
}

export interface PortalConfig {
  nearby_radius_meters: number;
  nearby_radius_km: number;
  max_nearby_results: number;
  allowed_photo_types: string[];
  max_photo_size_mb: number;
}

export const publicService = {
  getConfig: async (): Promise<{ success: boolean; config: PortalConfig }> => {
    const res = await api.get('/citizen/config');
    return res.data;
  },

  getStates: async (): Promise<{ success: boolean; states: StateItem[] }> => {
    const res = await api.get('/citizen/geographies/states');
    return res.data;
  },

  getDistricts: async (stateId?: number | string): Promise<{ success: boolean; districts: DistrictItem[] }> => {
    const res = await api.get('/citizen/geographies/districts', {
      params: stateId ? { state_id: stateId } : {}
    });
    return res.data;
  },

  getConstituencies: async (stateId?: number | string, districtId?: string): Promise<{ success: boolean; constituencies: ConstituencyItem[] }> => {
    const res = await api.get('/citizen/geographies/constituencies', {
      params: { state_id: stateId, district_id: districtId }
    });
    return res.data;
  },

  searchWorks: async (params?: {
    q?: string;
    state_id?: string | number;
    district_id?: string | number;
    constituency_id?: string | number;
    status?: string;
  }): Promise<{ success: boolean; count: number; works: WorkRecommendation[] }> => {
    const res = await api.get('/citizen/works', { params });
    return res.data;
  },

  getNearbyWorks: async (
    latitude: number,
    longitude: number,
    radiusMeters?: number
  ): Promise<{
    success: boolean;
    citizen_location: { latitude: number; longitude: number };
    radius_meters: number;
    count: number;
    nearby_works: (WorkRecommendation & { distance_meters?: number })[];
  }> => {
    const res = await api.get('/citizen/works/nearby', {
      params: { latitude, longitude, radius_meters: radiusMeters }
    });
    return res.data;
  },

  getWorkDetail: async (id: string): Promise<{ success: boolean; work: WorkRecommendation }> => {
    const res = await api.get(`/citizen/works/${id}`);
    return res.data;
  },

  submitCitizenReport: async (formData: FormData) => {
    const res = await api.post('/citizen/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getCitizenReports: async (params?: { work_id?: string; category?: string }) => {
    const res = await api.get('/citizen/reports', { params });
    return res.data;
  }
};
