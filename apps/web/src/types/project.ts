export type ProjectStatus = 
  | 'RECOMMENDED'
  | 'IN_FEASIBILITY'
  | 'SANCTIONED' 
  | 'REJECTED' 
  | 'AGENCY_ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'AUDITED'
  | 'FROZEN_PENDING_AUDIT';

export type CategoryType = 'SC' | 'ST' | 'GENERAL';

export interface WorkRecommendation {
  id: string;
  recommendation_no?: string;
  work_id?: string;
  mp_id?: string;
  mp_name?: string;
  constituency_id?: string;
  constituency_name?: string;
  district_id?: string;
  district?: string;
  block?: string;
  village?: string;
  sector_id?: number;
  sector: string;
  sector_name?: string;
  category?: CategoryType;
  title: string;
  description?: string;
  estimated_cost: number;
  sanctioned_amount?: number;
  location_address?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: ProjectStatus;
  implementing_agency?: string;
  risk_level?: string;
  recommended_date?: string;
  created_at?: string;
  sla_deadline?: string;
  is_sla_breached?: boolean;
  days_remaining?: number;
  distance_meters?: number;
}

export interface FundTracker {
  entitlement: number;
  recommended: number;
  sanctioned: number;
  disbursed: number;
  unallocated_balance: number;
}
