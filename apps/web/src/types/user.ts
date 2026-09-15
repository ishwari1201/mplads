export type UserRole = 
  | 'MP_MLA' 
  | 'MP' 
  | 'DISTRICT_AUTHORITY' 
  | 'STATE_AUTHORITY'
  | 'CENTRAL_AUTHORITY'
  | 'IMPLEMENTING_AGENCY' 
  | 'NODAL_OFFICER' 
  | 'ADMIN' 
  | 'CITIZEN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  constituency_name?: string;
  constituency_id?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
