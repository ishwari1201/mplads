import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, PieChart, CheckSquare, AlertTriangle, 
  ShieldCheck, Layers, CreditCard, Building2, UserCheck,
  Briefcase, User, MapPin, LogOut, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { UserRole } from '../types/user';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar Collapse / Expand State with localStorage Persistence
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('mplads_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('mplads_sidebar_collapsed', String(next));
      return next;
    });
  };

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
        shortTitle: 'MP Portal',
        color: 'text-sky-800 bg-sky-50 border-sky-200',
        items: [
          { name: 'MP Dashboard', path: '/mp', icon: PieChart },
          { name: 'New Recommendation', path: '/mp/recommend', icon: FileText },
          { name: 'Recommended Directory', path: '/mp/recommendations', icon: Layers },
        ],
      };
    } else if (roleUpper.includes('CENTRAL')) {
      return {
        title: 'Central Nodal Ministry Menu',
        shortTitle: 'MoSPI',
        color: 'text-indigo-800 bg-indigo-50 border-indigo-200',
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
        shortTitle: 'State SNA',
        color: 'text-purple-800 bg-purple-50 border-purple-200',
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
        shortTitle: 'District DA',
        color: 'text-amber-800 bg-amber-50 border-amber-200',
        items: [
          { name: 'Dashboard', path: '/da', icon: PieChart },
          { name: 'Approval Inbox', path: '/da/recommendations', icon: CheckSquare },
          { name: 'Case Queue', path: '/da/queue', icon: AlertTriangle },
        ],
      };
    } else if (roleUpper.includes('IMPLEMENTING') || roleUpper === 'IA') {
      return {
        title: 'Implementing Agency Menu',
        shortTitle: 'IA Field',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
        items: [
          { name: 'IA Field Dashboard', path: '/ia', icon: Building2 },
        ],
      };
    } else if (roleUpper.includes('ADMIN') || roleUpper.includes('NODAL')) {
      return {
        title: 'Central Nodal Admin Menu',
        shortTitle: 'Admin',
        color: 'text-indigo-800 bg-indigo-50 border-indigo-200',
        items: [
          { name: 'Admin Anomaly Overview', path: '/admin', icon: ShieldCheck },
          { name: 'SHAP Risk Matrix Cards', path: '/admin/explainability', icon: AlertTriangle },
        ],
      };
    } else {
      return {
        title: 'Citizen Oversight Menu',
        shortTitle: 'Citizen',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
        items: [
          { name: 'Citizen Public Portal', path: '/public', icon: Layers },
        ],
      };
    }
  };

  const config = getRoleConfig();

  // Derive display initials for avatar
  const displayName = user?.full_name || 'Hon. Rajesh Sharma (MP)';
  const displayConstituency = user?.constituency_name || 'Mumbai South';
  const avatarInitials = displayName
    .replace(/^(Hon\.|Dr\.|Shri|Smt\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('') || 'MP';

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[72px]' : 'w-64'
      } bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between min-h-[calc(100vh-61px)] transition-all duration-300 ease-in-out relative select-none shadow-2xs`}
    >
      {/* Top Section: Header, Toggle & Navigation Links */}
      <div className="p-3">
        {/* Header & Toggle Button Bar */}
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed ? (
            <>
              <div
                className={`flex-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${config.color} truncate mr-2`}
                title={config.title}
              >
                {config.title}
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                title="Compress Sidebar"
              >
                <PanelLeftClose size={17} />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-slate-400 hover:text-sky-700 hover:bg-slate-100 transition-colors"
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items List */}
        <nav className="space-y-1">
          {config.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-2.5' : 'space-x-3 px-3 py-2'
                  } rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User Profile & Constituency Badge (Left Bottom) */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/80">
        {!isCollapsed ? (
          /* EXPANDED PROFILE CARD */
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between group shadow-2xs">
            <div className="flex items-center space-x-2.5 overflow-hidden min-w-0">
              {/* User Avatar with Initials & Active Status Dot */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs border border-sky-200">
                  {avatarInitials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" title="Online Active" />
              </div>

              {/* Name & Constituency Info */}
              <div className="overflow-hidden min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate" title={displayName}>
                  {displayName}
                </div>
                <div className="text-[11px] text-slate-500 truncate font-medium flex items-center gap-1 mt-0.5" title={displayConstituency}>
                  <MapPin size={11} className="text-amber-600 shrink-0" />
                  <span className="truncate">{displayConstituency}</span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 ml-1.5"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          /* COMPRESSED PROFILE BADGE */
          <div className="flex flex-col items-center space-y-2">
            <div
              className="relative cursor-pointer group"
              title={`${displayName} • ${displayConstituency}`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs border border-sky-200 group-hover:ring-2 group-hover:ring-sky-500/30 transition-all">
                {avatarInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" title="Online Active" />
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
