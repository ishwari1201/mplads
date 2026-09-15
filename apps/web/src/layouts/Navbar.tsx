import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, User, LogOut, Bell } from 'lucide-react';
import { UserRole } from '../types/user';

export const Navbar: React.FC = () => {
  const { user, loginAsRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveRoleFromPath = (): UserRole => {
    const path = location.pathname;
    if (path.startsWith('/mp')) return 'MP';
    if (path.startsWith('/da')) return 'DISTRICT_AUTHORITY';
    if (path.startsWith('/state')) return 'STATE_AUTHORITY';
    if (path.startsWith('/central')) return 'CENTRAL_AUTHORITY';
    if (path.startsWith('/ia')) return 'IMPLEMENTING_AGENCY';
    if (path.startsWith('/admin')) return 'ADMIN';
    if (path.startsWith('/public')) return 'CITIZEN';
    return user?.role || 'MP';
  };

  const activeRole = getActiveRoleFromPath();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value as UserRole;
    loginAsRole(selectedRole);

    switch (selectedRole) {
      case 'DISTRICT_AUTHORITY':
        navigate('/da');
        break;
      case 'STATE_AUTHORITY':
        navigate('/state');
        break;
      case 'CENTRAL_AUTHORITY':
        navigate('/central');
        break;
      case 'MP':
      case 'MP_MLA':
        navigate('/mp');
        break;
      case 'IMPLEMENTING_AGENCY':
        navigate('/ia');
        break;
      case 'ADMIN':
      case 'NODAL_OFFICER':
        navigate('/admin');
        break;
      case 'CITIZEN':
      default:
        navigate('/public');
        break;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-sky-600 flex items-center justify-center shadow-md">
          <ShieldAlert className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-slate-100 flex items-center gap-2">
            e-MPLADS <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">GOI Official</span>
          </h1>
          <p className="text-[11px] text-slate-400">Integrated Works Management & AI Transparency Portal</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Switcher for Persona Demo */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Active Portal Role:</span>
          <select
            value={activeRole}
            onChange={handleRoleChange}
            className="bg-transparent text-xs font-bold text-sky-400 focus:outline-none cursor-pointer"
          >
            <option value="MP" className="bg-slate-900 text-slate-200">1. Member of Parliament (MP)</option>
            <option value="DISTRICT_AUTHORITY" className="bg-slate-900 text-slate-200">2. District Authority (DA)</option>
            <option value="STATE_AUTHORITY" className="bg-slate-900 text-slate-200">3. State Nodal Authority (SA)</option>
            <option value="CENTRAL_AUTHORITY" className="bg-slate-900 text-slate-200">4. Central Nodal Ministry (CA)</option>
            <option value="IMPLEMENTING_AGENCY" className="bg-slate-900 text-slate-200">5. Implementing Agency (IA)</option>
            <option value="CITIZEN" className="bg-slate-900 text-slate-200">6. Citizen Oversight Portal</option>
          </select>
        </div>

        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user?.full_name}</div>
            <div className="text-[10px] text-slate-400">{user?.constituency_name || user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
