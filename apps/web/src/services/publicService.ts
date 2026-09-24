import { api } from './api';
import { WorkRecommendation } from '../types/project';
import { MOCK_CONSTITUENCY_WORKS } from '../data/mockConstituencyWorks';

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

const DEFAULT_STATES: StateItem[] = [
  { id: 1, state_code: 'MH', name: 'Maharashtra' },
  { id: 2, state_code: 'DL', name: 'Delhi' },
  { id: 3, state_code: 'KA', name: 'Karnataka' },
  { id: 4, state_code: 'TS', name: 'Telangana' },
  { id: 5, state_code: 'TN', name: 'Tamil Nadu' },
];

const DEFAULT_DISTRICTS: DistrictItem[] = [
  { id: 'dist-mumbai', district_name: 'Mumbai City / South', state_id: 1 },
  { id: 'dist-delhi', district_name: 'New Delhi District', state_id: 2 },
  { id: 'dist-blr', district_name: 'Bengaluru Urban', state_id: 3 },
];

const DEFAULT_CONSTITUENCIES: ConstituencyItem[] = [
  { id: 101, name: 'Mumbai South Constituency (MH-31)', state_id: 1, house_type: 'LOK_SABHA' },
  { id: 102, name: 'New Delhi Constituency (DL-04)', state_id: 2, house_type: 'LOK_SABHA' },
  { id: 103, name: 'Bengaluru Central Constituency (KA-25)', state_id: 3, house_type: 'LOK_SABHA' },
];

export const publicService = {
  getConfig: async (): Promise<{ success: boolean; config: PortalConfig }> => {
    try {
      const res = await api.get('/citizen/config');
      return res.data;
    } catch (err) {
      return {
        success: true,
        config: {
          nearby_radius_meters: 5000,
          nearby_radius_km: 5,
          max_nearby_results: 50,
          allowed_photo_types: ['image/jpeg', 'image/png'],
          max_photo_size_mb: 10,
        },
      };
    }
  },

  getStates: async (): Promise<{ success: boolean; states: StateItem[] }> => {
    try {
      const res = await api.get('/citizen/geographies/states');
      return res.data;
    } catch (err) {
      return { success: true, states: DEFAULT_STATES };
    }
  },

  getDistricts: async (stateId?: number | string): Promise<{ success: boolean; districts: DistrictItem[] }> => {
    try {
      const res = await api.get('/citizen/geographies/districts', {
        params: stateId ? { state_id: stateId } : {},
      });
      return res.data;
    } catch (err) {
      return { success: true, districts: DEFAULT_DISTRICTS };
    }
  },

  getConstituencies: async (stateId?: number | string, districtId?: string): Promise<{ success: boolean; constituencies: ConstituencyItem[] }> => {
    try {
      const res = await api.get('/citizen/geographies/constituencies', {
        params: { state_id: stateId, district_id: districtId },
      });
      return res.data;
    } catch (err) {
      return { success: true, constituencies: DEFAULT_CONSTITUENCIES };
    }
  },

  // Helper to get unified list of all works across backend API, localStorage submitted works, and mock datasets
  getAllWorksCombined: (): WorkRecommendation[] => {
    const combinedMap = new Map<string, WorkRecommendation>();

    // 1. Load mock constituency works first as baseline
    MOCK_CONSTITUENCY_WORKS.forEach((w) => {
      combinedMap.set(w.id, { ...w });
    });

    // 2. Load submitted recommendations from localStorage
    try {
      const recsStr = localStorage.getItem('mplads_submitted_recommendations');
      if (recsStr) {
        const localRecs: WorkRecommendation[] = JSON.parse(recsStr);
        localRecs.forEach((r) => {
          let lat = Number(r.latitude);
          let lng = Number(r.longitude);
          // Default to Mumbai South / Naval Base area coordinates if coordinates are missing or invalid
          if (isNaN(lat) || lat === 0) lat = 18.9250;
          if (isNaN(lng) || lng === 0) lng = 72.8350;

          const updatedRec: WorkRecommendation = {
            ...r,
            latitude: lat,
            longitude: lng,
            location_address: r.location_address || r.address || 'Mumbai South, Maharashtra',
            address: r.address || r.location_address || 'Mumbai South, Maharashtra',
            constituency_name: r.constituency_name || 'Mumbai South Constituency (MH-31)',
            constituency_id: r.constituency_id || 'MUMBAI_SOUTH',
            implementing_agency: r.implementing_agency || 'PWD Division 1',
          };
          combinedMap.set(r.id, updatedRec);
        });
      }
    } catch (e) {
      console.warn('Error reading submitted recommendations:', e);
    }

    // 3. Sync dynamic completion / progress state from mplads_ia_schedules
    try {
      const schedStr = localStorage.getItem('mplads_ia_schedules');
      if (schedStr) {
        const schedules = JSON.parse(schedStr);
        combinedMap.forEach((work, id) => {
          if (schedules[id]) {
            const sc = schedules[id];
            if (sc.is_completed || sc.overall_progress === 100) {
              work.status = 'COMPLETED';
            } else if (sc.overall_progress > 0 && work.status === 'SANCTIONED') {
              work.status = 'IN_PROGRESS';
            }
          }
        });
      }
    } catch (e) {
      console.warn('Error reading IA schedules:', e);
    }

    return Array.from(combinedMap.values());
  },

  searchWorks: async (params?: {
    q?: string;
    state_id?: string | number;
    district_id?: string | number;
    constituency_id?: string | number;
    status?: string;
  }): Promise<{ success: boolean; count: number; works: WorkRecommendation[] }> => {
    let baseWorks: WorkRecommendation[] = [];
    try {
      const res = await api.get('/citizen/works', { params });
      if (res.data?.works && res.data.works.length > 0) {
        baseWorks = res.data.works;
      }
    } catch (err) {
      // Backend unavailable or empty; continue with unified local set
    }

    const allCombined = publicService.getAllWorksCombined();
    // Merge any API works with allCombined
    const mergedMap = new Map<string, WorkRecommendation>();
    allCombined.forEach(w => mergedMap.set(w.id, w));
    baseWorks.forEach(w => mergedMap.set(w.id, { ...mergedMap.get(w.id), ...w }));

    let result = Array.from(mergedMap.values());

    // Apply Filters
    if (params) {
      // 1. Keyword search (q)
      if (params.q && params.q.trim().length > 0) {
        const queryTerms = params.q.toLowerCase().trim().split(/\s+/);
        result = result.filter((w) => {
          const searchCorpus = [
            w.id,
            (w as any).recommendation_no,
            w.title,
            w.description,
            w.sector,
            w.category,
            w.address,
            w.location_address,
            w.constituency_name,
            w.implementing_agency,
            w.mp_name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return queryTerms.every((term) => searchCorpus.includes(term));
        });
      }

      // 2. Status filter
      if (params.status && params.status !== 'all') {
        const targetStatus = params.status.toUpperCase();
        result = result.filter((w) => (w.status || '').toUpperCase() === targetStatus);
      }

      // 3. State filter
      if (params.state_id && params.state_id !== 'all') {
        const stateIdStr = String(params.state_id);
        result = result.filter((w) => {
          if (stateIdStr === '1' || stateIdStr.toUpperCase() === 'MH') {
            return (
              (w.address && w.address.toLowerCase().includes('mumbai')) ||
              (w.address && w.address.toLowerCase().includes('maharashtra')) ||
              (w.constituency_name && w.constituency_name.toLowerCase().includes('mumbai')) ||
              (w.constituency_id === 'MUMBAI_SOUTH' || w.constituency_id === 'PUNE')
            );
          }
          if (stateIdStr === '2' || stateIdStr.toUpperCase() === 'DL') {
            return (
              (w.address && w.address.toLowerCase().includes('delhi')) ||
              (w.constituency_id === 'NEW_DELHI')
            );
          }
          if (stateIdStr === '3' || stateIdStr.toUpperCase() === 'KA') {
            return (
              (w.address && w.address.toLowerCase().includes('bengaluru')) ||
              (w.constituency_id === 'BENGALURU_CENTRAL')
            );
          }
          return true;
        });
      }

      // 4. District filter
      if (params.district_id && params.district_id !== 'all') {
        const distId = String(params.district_id).toLowerCase();
        result = result.filter((w) => {
          if (distId.includes('mumbai')) {
            return (w.address && w.address.toLowerCase().includes('mumbai')) || (w.constituency_id === 'MUMBAI_SOUTH');
          }
          if (distId.includes('delhi')) {
            return (w.address && w.address.toLowerCase().includes('delhi')) || (w.constituency_id === 'NEW_DELHI');
          }
          if (distId.includes('blr') || distId.includes('bengaluru')) {
            return (w.address && w.address.toLowerCase().includes('bengaluru')) || (w.constituency_id === 'BENGALURU_CENTRAL');
          }
          return true;
        });
      }

      // 5. Constituency filter
      if (params.constituency_id && params.constituency_id !== 'all') {
        const constId = String(params.constituency_id);
        result = result.filter((w) => {
          if (constId === '101' || constId === 'MUMBAI_SOUTH') {
            return w.constituency_id === 'MUMBAI_SOUTH' || (w.address && w.address.toLowerCase().includes('mumbai'));
          }
          if (constId === '102' || constId === 'NEW_DELHI') {
            return w.constituency_id === 'NEW_DELHI' || (w.address && w.address.toLowerCase().includes('delhi'));
          }
          if (constId === '103' || constId === 'BENGALURU_CENTRAL') {
            return w.constituency_id === 'BENGALURU_CENTRAL' || (w.address && w.address.toLowerCase().includes('bengaluru'));
          }
          return true;
        });
      }
    }

    return {
      success: true,
      count: result.length,
      works: result,
    };
  },

  getNearbyWorks: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000
  ): Promise<{
    success: boolean;
    citizen_location: { latitude: number; longitude: number };
    radius_meters: number;
    count: number;
    nearby_works: (WorkRecommendation & { distance_meters?: number })[];
  }> => {
    const allWorks = publicService.getAllWorksCombined();

    // Calculate spherical Haversine distance for each work
    const calculated = allWorks.map((w) => {
      const wLat = Number(w.latitude);
      const wLng = Number(w.longitude);

      if (isNaN(wLat) || isNaN(wLng)) {
        return { ...w, distance_meters: 999999 };
      }

      const dLat = (wLat - latitude) * (Math.PI / 180);
      const dLon = (wLng - longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latitude * (Math.PI / 180)) *
          Math.cos(wLat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dMeters = Math.round(6371000 * c);
      return { ...w, distance_meters: dMeters };
    });

    // Sort by closest distance first
    calculated.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));

    // Filter within radius; if none are strictly within radius, return the closest available works
    let filtered = calculated.filter((w) => (w.distance_meters || 0) <= radiusMeters);
    if (filtered.length === 0) {
      // Return top 10 closest works so user always sees relevant constituency works with distance tags
      filtered = calculated.slice(0, 10);
    }

    return {
      success: true,
      citizen_location: { latitude, longitude },
      radius_meters: radiusMeters,
      count: filtered.length,
      nearby_works: filtered,
    };
  },

  getWorkDetail: async (id: string): Promise<{ success: boolean; work: WorkRecommendation }> => {
    const allWorks = publicService.getAllWorksCombined();
    const found = allWorks.find((w) => w.id === id) || allWorks[0];
    return { success: true, work: found };
  },

  submitCitizenReport: async (formData: FormData) => {
    try {
      const res = await api.post('/citizen/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      return { success: true, message: 'Report submitted successfully (Mock Mode).' };
    }
  },

  getCitizenReports: async (params?: { work_id?: string; category?: string }) => {
    try {
      const res = await api.get('/citizen/reports', { params });
      return res.data;
    } catch (err) {
      return { success: true, reports: [] };
    }
  },
};
