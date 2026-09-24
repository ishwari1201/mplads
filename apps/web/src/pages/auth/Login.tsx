import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ChevronDown,
  Globe,
  FileText,
  PhoneCall,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Landmark
} from 'lucide-react';
import { UserRole } from '../../types/user';

// State Emblem of India (Lion Capital of Ashoka) SVG Component
const AshokaEmblem: React.FC<{ className?: string }> = ({ className = "w-10 h-14" }) => (
  <svg
    viewBox="0 0 100 140"
    className={`${className} inline-block shrink-0`}
    fill="currentColor"
    aria-label="State Emblem of India"
  >
    {/* Ashoka Lions Header Graphic */}
    <path
      d="M50 8 C40 8 36 14 36 22 C36 26 38 29 41 32 C38 35 36 40 36 46 C36 50 38 54 42 56 C38 58 35 63 35 68 C35 76 42 82 50 82 C58 82 65 76 65 68 C65 63 62 58 58 56 C62 54 64 50 64 46 C64 40 62 35 59 32 C62 29 64 26 64 22 C64 14 60 8 50 8 Z"
      fill="#d97706"
    />
    <path d="M42 22 C42 17 46 13 50 13 C54 13 58 17 58 22 C58 25 56 27 54 29 C52 28 48 28 46 29 C44 27 42 25 42 22 Z" fill="#b45309" />
    <circle cx="50" cy="45" r="4" fill="#78350f" />
    <path d="M42 46 C42 42 46 39 50 39 C54 39 58 42 58 46 C58 49 56 51 50 53 C44 51 42 49 42 46 Z" fill="#f59e0b" />
    {/* Abacus Base Platform */}
    <rect x="25" y="84" width="50" height="10" rx="2" fill="#d97706" />
    {/* Ashoka Chakra in Emblem */}
    <circle cx="50" cy="89" r="4" fill="#1e3a8a" />
    <path d="M30 89 L34 89 M66 89 L70 89 M50 85 L50 87 M50 91 L50 93" stroke="#ffffff" strokeWidth="1" />
    {/* Elephant / Bull / Horse Accents */}
    <circle cx="34" cy="89" r="1.5" fill="#78350f" />
    <circle cx="66" cy="89" r="1.5" fill="#78350f" />
    {/* Plinth Base */}
    <path d="M20 96 L80 96 L75 106 L25 106 Z" fill="#b45309" />
    <rect x="18" y="106" width="64" height="6" rx="1" fill="#78350f" />
    {/* Motto: Satyameva Jayate (Sanskrit Representation) */}
    <text x="50" y="122" textAnchor="middle" fill="#d97706" fontSize="9" fontWeight="bold" fontFamily="serif">
      सत्यमेव जयते
    </text>
  </svg>
);

// Parliament Building Silhouette Background Pattern
const ParliamentBackgroundPattern: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
    {/* Subtle Hexagonal Grid Mesh */}
    <svg className="absolute w-full h-full text-slate-700/30" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <pattern id="hex-grid" width="40" height="69.282" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
          <path
            d="M 40 0 L 20 11.547 L 0 0 L 0 23.094 L 20 34.641 L 40 23.094 Z M 0 34.641 L 20 46.188 L 0 57.735 L 0 80.829 L 20 92.376 L 40 80.829 L 40 57.735 L 20 46.188 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="2 2"
          />
          <circle cx="20" cy="11.547" r="1" fill="#38bdf8" opacity="0.4" />
          <circle cx="20" cy="46.188" r="1" fill="#38bdf8" opacity="0.4" />
          <circle cx="40" cy="23.094" r="1" fill="#f59e0b" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex-grid)" />
    </svg>

    {/* Parliament Building Stylized Vector Silhouette at Bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-72 flex justify-center items-end opacity-20">
      <svg viewBox="0 0 1200 300" className="w-full max-w-7xl text-slate-300" fill="currentColor">
        {/* Outer Circular Colonnade */}
        <rect x="100" y="180" width="1000" height="20" rx="2" />
        <rect x="80" y="200" width="1040" height="15" rx="2" />
        <rect x="60" y="215" width="1080" height="85" />
        {/* Columns */}
        {Array.from({ length: 48 }).map((_, i) => (
          <rect key={i} x={110 + i * 20} y={100} width="8" height="80" rx="1" />
        ))}
        {/* Upper Entablature */}
        <rect x="100" y="90" width="1000" height="12" />
        {/* Central Dome (Samvidhan Sadan) */}
        <path d="M 500 90 A 100 100 0 0 1 700 90 Z" />
        <rect x="580" y="25" width="40" height="15" rx="1" />
        <rect x="596" y="5" width="8" height="20" />
        <circle cx="600" cy="5" r="5" />
      </svg>
    </div>
  </div>
);

// NIC Digital India Branding Emblem
const NICDigitalIndiaBadge: React.FC = () => (
  <div className="flex items-center gap-2.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
    <div className="flex items-center font-extrabold tracking-wider text-sky-400">
      <span className="text-amber-500 font-serif mr-0.5">NIC</span>
      <span className="text-slate-400 text-[10px] mx-1">|</span>
      <span className="text-emerald-400 text-[10px] tracking-tight">Digital India</span>
    </div>
  </div>
);

interface PersonaQuickSelect {
  role: UserRole;
  label: string;
  id: string;
  badge: string;
}

export const Login: React.FC = () => {
  const { loginAsRole } = useAuth();
  const navigate = useNavigate();

  // Active Tab State: 'OFFICIAL' | 'CITIZEN'
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'CITIZEN'>('OFFICIAL');

  // Form Inputs
  const [username, setUsername] = useState<string>('MP-10482-MH');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Stakeholder Role Preset
  const [selectedRole, setSelectedRole] = useState<UserRole>('MP');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);

  const personas: PersonaQuickSelect[] = [
    { role: 'MP', label: 'Member of Parliament (MP)', id: 'MP-10482-MH', badge: 'Lok Sabha / Rajya Sabha' },
    { role: 'DISTRICT_AUTHORITY', label: 'District Authority (Collector / DM)', id: 'DA-2704-MUMBAI', badge: '75-Day SLA Sanction' },
    { role: 'STATE_AUTHORITY', label: 'State Nodal Department (SNA)', id: 'SNA-MH-PUNE', badge: 'Statewide Oversight' },
    { role: 'CENTRAL_AUTHORITY', label: 'Central Nodal Ministry (MoSPI)', id: 'MOSPI-CEN-001', badge: 'National Policy & Fund' },
    { role: 'IMPLEMENTING_AGENCY', label: 'Implementing Agency (IA / PWD)', id: 'IA-PWD-MUM-88', badge: 'Geotagged Proof Upload' },
    { role: 'ADMIN', label: 'System Administrator (NIC Nodal)', id: 'NIC-ADMIN-SYS', badge: 'Full Platform Audit' },
  ];

  const handleRoleSelect = (persona: PersonaQuickSelect) => {
    setSelectedRole(persona.role);
    setUsername(persona.id);
    setIsRoleDropdownOpen(false);
  };

  const handleOfficialLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Execute authentication using auth hook
    loginAsRole(selectedRole);

    // Redirect to corresponding portal landing page
    switch (selectedRole) {
      case 'MP':
      case 'MP_MLA':
        navigate('/mp');
        break;
      case 'DISTRICT_AUTHORITY':
        navigate('/da');
        break;
      case 'STATE_AUTHORITY':
        navigate('/state');
        break;
      case 'CENTRAL_AUTHORITY':
        navigate('/central');
        break;
      case 'IMPLEMENTING_AGENCY':
        navigate('/ia');
        break;
      case 'ADMIN':
        navigate('/admin');
        break;
      default:
        navigate('/mp');
    }
  };

  const handleCitizenAccess = () => {
    loginAsRole('CITIZEN');
    navigate('/public');
  };

  return (
    <div className="min-h-screen bg-[#111827] text-slate-100 font-sans flex flex-col justify-between relative overflow-x-hidden select-none">
      {/* Background Stylized Hex Map and Parliament Silhouette */}
      <ParliamentBackgroundPattern />

      {/* Top Header Banner */}
      <header className="w-full bg-[#0d131f]/95 border-b border-slate-800 shadow-lg z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Far Left: State Emblem + Government Text */}
          <div className="flex items-center gap-3">
            <AshokaEmblem className="w-9 h-12 text-amber-500 filter drop-shadow" />
            <div className="border-l border-slate-700/80 pl-3">
              <div className="text-xs font-bold text-amber-500 tracking-wider font-serif uppercase">
                भारत सरकार
              </div>
              <div className="text-sm font-extrabold text-white tracking-wide uppercase font-serif">
                Government of India
              </div>
              <div className="text-[11px] text-slate-400">
                Ministry of Statistics & Programme Implementation (MoSPI)
              </div>
            </div>
          </div>

          {/* Main Center Header */}
          <div className="hidden md:flex flex-col items-center text-center">
            <h1 className="text-lg lg:text-xl font-serif font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <span>Member of Parliament Local Area Development Scheme</span>
              <span className="text-xs font-sans px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                MPLADS
              </span>
            </h1>
            <p className="text-xs text-slate-400 tracking-wide font-sans">
              Integrated E-Governance & Transparency Monitoring Portal
            </p>
          </div>

          {/* Top Right Quick Links & NIC Digital India Badge */}
          <div className="flex items-center gap-3 ml-auto md:ml-0">
            <NICDigitalIndiaBadge />
          </div>
        </div>
      </header>

      {/* Mobile Title Strip */}
      <div className="md:hidden bg-[#162032] border-b border-slate-800 py-2.5 px-4 text-center z-10">
        <h1 className="text-sm font-serif font-bold text-amber-400">
          Member of Parliament Local Area Development Scheme (MPLADS)
        </h1>
      </div>

      {/* Main Container - Centered Crisp Login Module Card */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center z-10">
        <div className="w-full max-w-md bg-[#f8fafc] text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
          
          {/* Card Top Title Block */}
          <div className="bg-gradient-to-r from-slate-900 via-[#1e293b] to-slate-900 text-white p-6 text-center relative border-b border-slate-800">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2 shadow-inner">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-2xl font-serif font-extrabold tracking-tight text-white">
              Secure Access Portal
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Official Login for all MPLADS Stakeholders
            </p>
          </div>

          {/* Tabbed Interface Headers */}
          <div className="grid grid-cols-2 bg-slate-200/90 border-b border-slate-300 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('OFFICIAL')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold tracking-wide transition-all rounded-lg flex items-center justify-center gap-1.5 ${
                activeTab === 'OFFICIAL'
                  ? 'bg-[#1e3a8a] text-white shadow-md font-semibold'
                  : 'bg-[#dbeafe] text-slate-700 hover:bg-blue-100 hover:text-slate-900'
              }`}
            >
              <Building2 size={16} className={activeTab === 'OFFICIAL' ? 'text-amber-400' : 'text-slate-600'} />
              <span>OFFICIAL LOGIN</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CITIZEN')}
              className={`py-3 px-3 text-xs sm:text-sm font-bold tracking-wide transition-all rounded-lg flex items-center justify-center gap-1.5 ${
                activeTab === 'CITIZEN'
                  ? 'bg-[#1e3a8a] text-white shadow-md font-semibold'
                  : 'bg-[#e0f2fe] text-slate-700 hover:bg-sky-100 hover:text-slate-900'
              }`}
            >
              <Globe size={16} className={activeTab === 'CITIZEN' ? 'text-emerald-400' : 'text-slate-600'} />
              <span>CITIZEN OVERSIGHT</span>
            </button>
          </div>

          {/* TAB 1: OFFICIAL LOGIN CONTENT */}
          {activeTab === 'OFFICIAL' ? (
            <div className="p-6 sm:p-7 bg-white">

              {/* Stakeholder Persona Quick Dropdown Selector */}
              <div className="mb-5 relative">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Official Stakeholder Role
                </label>
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl p-3 text-left transition-all flex items-center justify-between group focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {personas.find(p => p.role === selectedRole)?.label}
                      </div>
                      <div className="text-[10px] text-blue-700 font-semibold truncate">
                        {personas.find(p => p.role === selectedRole)?.badge}
                      </div>
                    </div>
                  </div>
                  <ChevronDown size={18} className={`text-slate-500 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Options Popup */}
                {isRoleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-300 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {personas.map((p) => (
                      <div
                        key={p.role}
                        onClick={() => handleRoleSelect(p)}
                        className={`p-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between ${
                          selectedRole === p.role ? 'bg-blue-50/80 font-bold' : ''
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{p.label}</div>
                          <div className="text-[10px] text-slate-500">{p.badge}</div>
                        </div>
                        {selectedRole === p.role && (
                          <CheckCircle2 size={16} className="text-blue-700 shrink-0 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Login Form */}
              <form onSubmit={handleOfficialLogin} className="space-y-4">
                
                {/* Field 1: Username / Government ID */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Username / Government ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username / Government ID"
                      required
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-700 focus:ring-2 focus:ring-blue-600/20 text-slate-900 text-sm font-semibold rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Field 2: Password with Eye Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      required
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-700 focus:ring-2 focus:ring-blue-600/20 text-slate-900 text-sm font-semibold rounded-xl pl-10 pr-11 py-3 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Log In Button & Forgot Password */}
                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 group text-base uppercase tracking-wider"
                  >
                    <Shield size={18} className="text-amber-400" />
                    <span>Log In</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-1" />
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => alert("Password reset requests are processed via your Nodal Officer or NIC Admin Helpdesk.")}
                      className="text-blue-700 hover:text-blue-900 font-bold hover:underline"
                    >
                      Forgot Password?
                    </button>
                    <span className="text-slate-400 text-[11px]">e-Gov TLS 1.3 Encrypted</span>
                  </div>
                </div>

                {/* Bottom Notification Box */}
                <div className="mt-5 bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-blue-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    Your profile and role permissions will be automatically loaded upon successful authentication.
                  </p>
                </div>

              </form>
            </div>
          ) : (
            /* TAB 2: CITIZEN OVERSIGHT CONTENT */
            <div className="p-6 sm:p-7 bg-white text-slate-800 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 inline-flex items-center justify-center shadow-sm">
                  <Globe size={24} />
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  Public Citizen Oversight Portal
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Under Government of India open data guidelines, citizens can inspect constituency project allocations, fund utilization, and GIS mapping without official credentials.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Interactive Leaflet Map of ₹5 Cr Annual Works</span>
                </div>
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Constituency Wise Search & Fund Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Public Geo-fenced Fraud Reporting Portal</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCitizenAccess}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <span>Enter Public Citizen Portal</span>
                <ExternalLink size={16} />
              </button>

              {/* Notification Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <Shield size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <span>No login required for public view. All data updated daily from MoSPI servers.</span>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Thin Footer Line at Page Bottom */}
      <footer className="w-full bg-[#0b1019] border-t border-slate-800/90 py-4 px-4 sm:px-8 z-20 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-300">
            <button onClick={() => navigate('/public')} className="hover:text-amber-400 transition-colors">
              Home
            </button>
            <span className="text-slate-600">•</span>
            <button onClick={() => alert("MPLADS: Member of Parliament Local Area Development Scheme enacted by Govt of India.")} className="hover:text-amber-400 transition-colors">
              About MPLADS
            </button>
            <span className="text-slate-600">•</span>
            <button onClick={() => alert("Contact NIC Helpdesk: support-mplads@gov.in | Toll-Free: 1800-11-2026")} className="hover:text-amber-400 transition-colors">
              Contact Us
            </button>
            <span className="text-slate-600">•</span>
            <button onClick={() => alert("Privacy Policy: National Informatics Centre (NIC) data security guidelines apply.")} className="hover:text-amber-400 transition-colors">
              Privacy Policy
            </button>
          </div>

          {/* NIC Digital India Branding & Copyright */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px]">
              Powered by <strong className="text-slate-200">National Informatics Centre (NIC)</strong> • Ministry of Electronics & IT
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
};
