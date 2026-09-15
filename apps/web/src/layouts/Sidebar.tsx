import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, PieChart, CheckSquare, AlertTriangle, 
  ShieldCheck, Layers, CreditCard, Building2, UserCheck,
  Briefcase
} from 'lucide-react';
import { UserRole } from '../types/user';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Determine active role dynamically from URL path prefix so sidebar matches the current portal route
  const getActiveRole = (): UserRole => {
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

  const role = getActiveRole();

  const getRoleConfig = () => {
    const roleUpper = String(role).toUpperCase();

    if (roleUpper === 'MP' || roleUpper === 'MP_MLA') {
      return {
        title: 'Member of Parliament Menu',
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        items: [
          { name: 'MP Dashboard', path: '/mp', icon: PieChart },
          { name: 'New Recommendation', path: '/mp/recommend', icon: FileText },
          { name: 'Recommended Directory', path: '/mp/recommendations', icon: Layers },
        ],
      };
    } else if (roleUpper.includes('CENTRAL')) {
      return {
        title: 'Central Nodal Ministry Menu',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        items: [
          { name: 'National Overview', path: '/central', icon: PieChart },
          { name: 'State / UT Monitoring', path: '/central/states', icon: Building2 },
          { name: 'All-India Risk Matrix', path: '/central/risk', icon: AlertTriangle },
          { name: 'State Escalated Cases', path: '/central/cases', icon: CheckSquare },
          { name: 'National Funds', path: '/central/funds', icon: CreditCard },
          { name: 'Contractor Network', path: '/central/contractors', icon: Briefcase },
        ],
      };
    } else if (roleUpper.includes('STATE')) {
      return {
        title: 'State Authority Nodal Menu',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        items: [
          { name: 'State Overview', path: '/state', icon: PieChart },
          { name: 'District Monitoring', path: '/state/districts', icon: Building2 },
          { name: 'Risk & Anomaly Matrix', path: '/state/risk', icon: AlertTriangle },
          { name: 'Escalated Cases', path: '/state/cases', icon: CheckSquare },
          { name: 'Contractor Oversight', path: '/state/contractors', icon: Briefcase },
        ],
      };
    } else if (roleUpper.includes('DISTRICT') || roleUpper === 'DA') {
      return {
        title: 'District Collectorate Menu',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        items: [
          { name: 'Dashboard', path: '/da', icon: PieChart },
          { name: 'Approval Inbox', path: '/da/recommendations', icon: CheckSquare },
          { name: 'Case Queue', path: '/da/queue', icon: AlertTriangle },
        ],
      };
    } else if (roleUpper.includes('IMPLEMENTING') || roleUpper === 'IA') {
      return {
        title: 'Implementing Agency Menu',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        items: [
          { name: 'IA Field Dashboard', path: '/ia', icon: Building2 },
        ],
      };
    } else if (roleUpper.includes('ADMIN') || roleUpper.includes('NODAL')) {
      return {
        title: 'Central Nodal Admin Menu',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        items: [
          { name: 'Admin Anomaly Overview', path: '/admin', icon: ShieldCheck },
          { name: 'SHAP Risk Matrix Cards', path: '/admin/explainability', icon: AlertTriangle },
        ],
      };
    } else {
      return {
        title: 'Citizen Oversight Menu',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        items: [
          { name: 'Citizen Public Portal', path: '/public', icon: Layers },
        ],
      };
    }
  };

  const config = getRoleConfig();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 shrink-0 flex flex-col justify-between min-h-[calc(100vh-61px)]">
      <div className="p-4">
        <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${config.color} mb-3 flex items-center justify-between`}>
          <span>{config.title}</span>
        </div>

        <nav className="space-y-1">
          {config.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
