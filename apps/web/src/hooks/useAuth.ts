import { useState, useEffect } from 'react';
import { User, UserRole } from '../types/user';

const AUTH_EVENT_NAME = 'mplads_auth_change';

export function useAuth() {
  const getSavedUser = (): User | null => {
    const saved = localStorage.getItem('mplads_user');
    return saved ? JSON.parse(saved) : {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'mp.mumbai@mplads.gov.in',
      full_name: 'Hon. Rajesh Sharma (MP)',
      role: 'MP',
      constituency_name: 'Mumbai South'
    };
  };

  const [user, setUser] = useState<User | null>(getSavedUser);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getSavedUser());
    };
    window.addEventListener(AUTH_EVENT_NAME, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const loginAsRole = (role: UserRole) => {
    let mockUser: User;
    switch (role) {
      case 'MP':
      case 'MP_MLA':
        mockUser = { id: '11111111-1111-1111-1111-111111111111', email: 'mp.mumbai@mplads.gov.in', full_name: 'Hon. Rajesh Sharma (MP)', role: 'MP', constituency_name: 'Mumbai South' };
        break;
      case 'DISTRICT_AUTHORITY':
        mockUser = { id: '22222222-2222-2222-2222-222222222222', email: 'da.mumbai@mplads.gov.in', full_name: 'District Magistrate Mumbai', role: 'DISTRICT_AUTHORITY', constituency_name: 'District Collectorate' };
        break;
      case 'STATE_AUTHORITY':
        mockUser = { id: '66666666-6666-6666-6666-666666666666', email: 'state.mh@mplads.gov.in', full_name: 'State Nodal Officer (Maharashtra)', role: 'STATE_AUTHORITY', constituency_name: 'Maharashtra State Nodal Office' };
        break;
      case 'CENTRAL_AUTHORITY':
        mockUser = { id: '77777777-7777-7777-7777-777777777777', email: 'central.mospi@mplads.gov.in', full_name: 'Joint Secretary (MoSPI / Central Nodal Authority)', role: 'CENTRAL_AUTHORITY', constituency_name: 'Ministry of Statistics & Programme Implementation' };
        break;
      case 'IMPLEMENTING_AGENCY':
        mockUser = { id: '33333333-3333-3333-3333-333333333333', email: 'pwd.agency@mplads.gov.in', full_name: 'Public Works Dept (PWD)', role: 'IMPLEMENTING_AGENCY' };
        break;
      case 'ADMIN':
      case 'NODAL_OFFICER':
        mockUser = { id: '44444444-4444-4444-4444-444444444444', email: 'admin.nodal@mplads.gov.in', full_name: 'Central Nodal Authority', role: 'ADMIN' };
        break;
      default:
        mockUser = { id: '55555555-5555-5555-5555-555555555555', email: 'citizen.user@mplads.gov.in', full_name: 'Aarav Patel (Citizen)', role: 'CITIZEN' };
        break;
    }

    localStorage.setItem('mplads_user', JSON.stringify(mockUser));
    localStorage.setItem('mplads_token', 'mock_jwt_token_2026');
    setUser(mockUser);
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  };

  const logout = () => {
    localStorage.removeItem('mplads_user');
    localStorage.removeItem('mplads_token');
    setUser(null);
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  };

  return { user, loginAsRole, logout, isAuthenticated: !!user };
}
