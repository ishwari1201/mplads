import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, ChevronDown, ChevronRight, Lock, Key, Sparkles, Check, User, ArrowRight, Landmark } from 'lucide-react';
import { UserRole } from '../../types/user';

const IndiaFlagIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-5" }) => (
  <svg
    viewBox="0 0 900 600"
    className={`inline-block shadow-sm rounded-xs border border-slate-300/40 align-middle ${className}`}
  >
    <rect width="900" height="200" fill="#FF9933" />
    <rect y="200" width="900" height="200" fill="#FFFFFF" />
    <rect y="400" width="900" height="200" fill="#138808" />
    <g transform="translate(450, 300)">
      <circle r="90" fill="none" stroke="#000080" strokeWidth="10" />
      <circle r="18" fill="#000080" />
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="0"
          y1="0"
          x2="0"
          y2="-90"
          stroke="#000080"
          strokeWidth="6"
          transform={`rotate(${i * 15})`}
        />
      ))}
    </g>
  </svg>
);

interface RoleOption {
  role: UserRole;
  num: string;
  title: string;
  desc: string;
  demoEmail: string;
}

export const Login: React.FC = () => {
  const { loginAsRole } = useAuth();
  const navigate = useNavigate();

  const roles: RoleOption[] = [
    {
      role: 'MP',
      num: '01',
      title: 'Member of Parliament',
      desc: 'Submit recommendations and track your ₹5 Cr allocation.',
      demoEmail: 'sharma.mp@mplads.gov.in',
    },
    {
      role: 'DISTRICT_AUTHORITY',
      num: '02',
      title: 'District Authority',
      desc: 'Scrutinise proposals and issue administrative sanctions.',
      demoEmail: 'da.mumbai@mplads.gov.in',
    },
    {
      role: 'STATE_AUTHORITY',
      num: '03',
      title: 'State Nodal Authority',
      desc: 'Monitor district execution, high-risk works, and escalations.',
      demoEmail: 'nodal.mh@mplads.gov.in',
    },
    {
      role: 'CENTRAL_AUTHORITY',
      num: '04',
      title: 'Central Nodal Ministry (MoSPI)',
      desc: 'National programme oversight, cross-state anomalies & fund releases.',
      demoEmail: 'admin.mospi@mplads.gov.in',
    },
    {
      role: 'IMPLEMENTING_AGENCY',
      num: '05',
      title: 'Implementing Agency',
      desc: 'Upload EXIF progress photos & milestone billing.',
      demoEmail: 'pwd.agency@mplads.gov.in',
    },
    {
      role: 'CITIZEN',
      num: '06',
      title: 'Citizen Oversight Portal',
      desc: 'Public transparency map & geotagged fraud reporting.',
      demoEmail: 'citizen.public@mplads.gov.in',
    },
  ];

  const [selectedRole, setSelectedRole] = useState<RoleOption>(roles[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>(roles[0].demoEmail);
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [viewMode, setViewMode] = useState<'dropdown' | 'list'>('dropdown');

  const handleSelectRole = (r: RoleOption) => {
    setSelectedRole(r);
    setEmailInput(r.demoEmail);
    setIsDropdownOpen(false);
  };

  const handleExecuteLogin = (role: UserRole) => {
    loginAsRole(role);
    switch (role) {
      case 'MP': navigate('/mp'); break;
      case 'DISTRICT_AUTHORITY': navigate('/da'); break;
      case 'STATE_AUTHORITY': navigate('/state'); break;
      case 'CENTRAL_AUTHORITY': navigate('/central'); break;
      case 'IMPLEMENTING_AGENCY': navigate('/ia'); break;
      case 'ADMIN': navigate('/admin'); break;
      case 'CITIZEN': navigate('/public'); break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      handleExecuteLogin(selectedRole.role);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Landmark size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 font-serif">
              <span>e-MPLADS Platform</span>
              <IndiaFlagIcon className="w-6 h-4" />
              <span className="text-[10px] uppercase font-sans tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MoSPI AI Oversight
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Member of Parliament Local Area Development Scheme • Govt. of India
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setViewMode('dropdown')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'dropdown'
                ? 'bg-amber-100 text-amber-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dropdown Select
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-amber-100 text-amber-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Role Cards List
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto my-8 z-10 grid grid-cols-1 gap-8">

        {/* Top Summary Metrics Strip */}
        <div className="bg-[#0b1326]/90 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-sm font-medium text-slate-300">Allocation per MP</span>
              <span className="text-lg font-mono font-bold text-emerald-400 tracking-tight">₹5.00 Cr</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-sm font-medium text-slate-300">Works under monitoring</span>
              <span className="text-lg font-mono font-bold text-emerald-400 tracking-tight">18,406</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-sm font-medium text-slate-300">Flagged for review</span>
              <span className="text-lg font-mono font-bold text-emerald-400 tracking-tight">212</span>
            </div>

            <p className="text-xs text-slate-400 pt-1 leading-relaxed flex items-start gap-2">
              <Lock size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <span>Every login is logged. Access is scoped to your assigned constituency, district, or state.</span>
            </p>
          </div>
        </div>

        {/* Sign In Card */}
        {viewMode === 'dropdown' ? (
          /* DROPDOWN SELECT MODE */
          <div className="bg-[#FBF9F1] text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#EBE6D5] transition-all">
            {/* Title Block Header */}
            <div className="mb-6 pb-4 border-b border-[#E6E0CE]">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 tracking-widest uppercase mb-1">
                <Landmark size={14} className="text-amber-800" />
                Government of India • MoSPI
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E293B] tracking-tight flex items-center gap-3">
                <span>e-MPLADS Portal Sign in</span>
                <IndiaFlagIcon className="w-9 h-6 shadow-md" />
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] mt-1.5 font-sans">
                Member of Parliament Local Area Development Scheme — Select your role to log in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dropdown Field */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                  Select Role / Portal Persona
                </label>

                {/* Selected Role Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full text-left bg-white border-2 border-[#DCD7C5] hover:border-[#1E293B] focus:border-[#1E293B] p-4 rounded-xl shadow-sm transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 pr-2">
                    <span className="w-8 h-8 rounded-md bg-[#F2EFE3] border border-[#D5CFBC] text-[#1E293B] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {selectedRole.num}
                    </span>
                    <div>
                      <div className="text-base font-bold text-[#1E293B]">
                        {selectedRole.title}
                      </div>
                      <div className="text-xs text-[#64748B] line-clamp-1">
                        {selectedRole.desc}
                      </div>
                    </div>
                  </div>

                  <ChevronDown
                    size={22}
                    className={`text-[#64748B] transition-transform duration-200 shrink-0 ${
                      isDropdownOpen ? 'rotate-180 text-[#1E293B]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Options Popup List */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#D5CFBC] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#F2EFE3] max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                    {roles.map((r) => (
                      <div
                        key={r.role}
                        onClick={() => handleSelectRole(r)}
                        className={`p-3.5 hover:bg-[#F8F6ED] cursor-pointer transition-all flex items-center justify-between ${
                          selectedRole.role === r.role ? 'bg-[#F2EFE3]' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 pr-2">
                          <span className="w-7 h-7 rounded-md bg-[#EBE6D5] text-[#1E293B] font-mono text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                            {r.num}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-[#1E293B]">
                              {r.title}
                            </div>
                            <div className="text-xs text-[#64748B] mt-0.5">
                              {r.desc}
                            </div>
                          </div>
                        </div>

                        {selectedRole.role === r.role && (
                          <Check size={18} className="text-emerald-700 shrink-0 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Username / Email Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                  Official Email / Portal ID
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-white border border-[#DCD7C5] focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] text-[#1E293B] text-sm font-medium rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                    placeholder="Enter official email..."
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                  Password / Security Key
                </label>
                <div className="relative">
                  <Key size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white border border-[#DCD7C5] focus:border-[#1E293B] focus:ring-1 focus:ring-[#1E293B] text-[#1E293B] text-sm font-medium rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                    placeholder="Enter password..."
                    required
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group text-base"
              >
                <span>Sign in as {selectedRole.title}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-[#64748B]">
                  Demo Credentials Pre-loaded • Click <strong>Sign in</strong> to access portal.
                </span>
              </div>
            </form>
          </div>
        ) : (
          /* ROLE CARDS LIST MODE */
          <div className="bg-[#FBF9F1] text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-[#EBE6D5] transition-all">
            {/* Title Block Header */}
            <div className="mb-6 pb-4 border-b border-[#E6E0CE]">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 tracking-widest uppercase mb-1">
                <Landmark size={14} className="text-amber-800" />
                Government of India • MoSPI
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E293B] tracking-tight flex items-center gap-3">
                <span>e-MPLADS Portal Sign in</span>
                <IndiaFlagIcon className="w-9 h-6 shadow-md" />
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] mt-1.5 font-sans">
                Member of Parliament Local Area Development Scheme — Choose your registered role.
              </p>
            </div>

            <div className="divide-y divide-[#EDE8D8]">
              {roles.map((r) => (
                <div
                  key={r.role}
                  onClick={() => handleExecuteLogin(r.role)}
                  className="group py-4 px-3 -mx-3 rounded-xl hover:bg-[#F2EFE3] transition-all duration-200 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-start gap-4 pr-3">
                    <span className="w-8 h-8 rounded-md bg-[#EEEAD9] border border-[#D9D3BF] text-[#475569] font-mono text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {r.num}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-emerald-800 transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#475569] mt-0.5 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    size={20}
                    className="text-[#64748B] group-hover:text-emerald-800 group-hover:translate-x-1 transition-all shrink-0 ml-2"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-4xl w-full mx-auto text-center pt-6 border-t border-slate-800/80 z-10 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Ministry of Statistics and Programme Implementation (MoSPI), Govt. of India</p>
        <p className="text-slate-400 flex items-center gap-1">
          <Sparkles size={12} className="text-emerald-400" /> Powered by SBERT & pHash Fraud AI Engine
        </p>
      </footer>
    </div>
  );
};
