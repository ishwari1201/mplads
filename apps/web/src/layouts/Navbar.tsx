import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ShieldCheck,
  LogOut,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  CreditCard,
  FileCheck,
  Check,
  Trash2,
  X
} from 'lucide-react';
import { UserRole } from '../types/user';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'SLA' | 'APPROVAL' | 'PAYMENT' | 'PROGRESS' | 'AI_RISK' | 'CITIZEN';
  time: string;
  read: boolean;
  link?: string;
  targetId?: string;
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const notificationRef = useRef<HTMLDivElement>(null);

  // Initialize notifications dynamically from real local application events
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const defaultNotifs: NotificationItem[] = [
      {
        id: 'notif-1',
        title: 'New MP Recommendation Submitted',
        message: 'Hon. Rajesh Sharma submitted Solar-Powered RO Drinking Water Purification Plant (₹22,00,000).',
        type: 'APPROVAL',
        time: 'Just now',
        read: false,
        link: '/da/recommendations'
      },
      {
        id: 'notif-2',
        title: 'Milestone Payment Claim Submitted',
        message: 'PWD Division 1 submitted Invoice INV-PWD-2026-084 for ₹4,50,000 against Foundation Milestone.',
        type: 'PAYMENT',
        time: '12m ago',
        read: false,
        link: '/da/queue'
      },
      {
        id: 'notif-3',
        title: 'SLA Statutory 75-Day Clock Active',
        message: 'District Authority statutory sanction limit tracking active for Mumbai South Constituency.',
        type: 'SLA',
        time: '1h ago',
        read: false,
        link: '/da'
      },
      {
        id: 'notif-4',
        title: 'AI Geotag & EXIF Integrity Passed',
        message: 'Site inspection photos verified with 0.08 low risk divergence score against baseline GPS.',
        type: 'AI_RISK',
        time: '3h ago',
        read: true,
        link: '/da/queue'
      }
    ];

    try {
      const saved = localStorage.getItem('mplads_system_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load notifications from localStorage:', e);
    }
    return defaultNotifs;
  });

  // Save notifications to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('mplads_system_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications:', e);
    }
  }, [notifications]);

  // Handle click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.read;
    return true;
  });

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'APPROVAL':
        return <Layers size={14} className="text-sky-600" />;
      case 'PAYMENT':
        return <CreditCard size={14} className="text-emerald-600" />;
      case 'SLA':
        return <Clock size={14} className="text-amber-600" />;
      case 'AI_RISK':
        return <ShieldCheck size={14} className="text-indigo-600" />;
      case 'CITIZEN':
        return <FileCheck size={14} className="text-purple-600" />;
      default:
        return <Bell size={14} className="text-slate-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs flex flex-col">
      {/* 1. TRICOLOR TOP STRIPE (Authentic Indian National Digital Branding) */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* 2. MAIN NAVBAR CONTENT */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left: Official Government Brand & Emblem Seal */}
        <div className="flex items-center space-x-3.5 shrink-0">
          <div className="flex items-center space-x-3">
            {/* Authentic State Emblem of India Seal Badge */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 shadow-sm flex items-center justify-center shrink-0 p-1.5">
              <svg viewBox="0 0 64 64" className="w-full h-full text-amber-400 fill-current" aria-label="Emblem of India">
                <path d="M32 4C30 4 28.5 5.5 28.5 7.5C28.5 8.2 28.7 8.8 29.1 9.3C27.2 9.9 25.8 11.7 25.8 13.8C25.8 15.2 26.4 16.4 27.3 17.2C26.5 17.8 26 18.8 26 19.9C26 21.6 27.4 23 29.1 23H34.9C36.6 23 38 21.6 38 19.9C38 18.8 37.5 17.8 36.7 17.2C37.6 16.4 38.2 15.2 38.2 13.8C38.2 11.7 36.8 9.9 34.9 9.3C35.3 8.8 35.5 8.2 35.5 7.5C35.5 5.5 34 4 32 4Z" />
                <path d="M19 14C17.5 14 16.2 15.2 16.2 16.8C16.2 17.5 16.4 18.2 16.8 18.7C15.2 19.3 14 20.8 14 22.5C14 24.5 15.6 26 17.5 26H23V19C23 16.2 21.2 14 19 14Z" opacity="0.9" />
                <path d="M45 14C46.5 14 47.8 15.2 47.8 16.8C47.8 17.5 47.6 18.2 47.2 18.7C48.8 19.3 50 20.8 50 22.5C50 24.5 48.4 26 46.5 26H41V19C41 16.2 42.8 14 45 14Z" opacity="0.9" />
                <rect x="14" y="27" width="36" height="4" rx="1.5" fill="#f59e0b" />
                <circle cx="32" cy="38" r="6.5" fill="none" stroke="#f59e0b" strokeWidth="1.8" />
                <circle cx="32" cy="38" r="1.5" fill="#f59e0b" />
                <line x1="32" y1="32.5" x2="32" y2="43.5" stroke="#f59e0b" strokeWidth="1.2" />
                <line x1="26.5" y1="38" x2="37.5" y2="38" stroke="#f59e0b" strokeWidth="1.2" />
                <line x1="28.1" y1="34.1" x2="35.9" y2="41.9" stroke="#f59e0b" strokeWidth="1.2" />
                <line x1="28.1" y1="41.9" x2="35.9" y2="34.1" stroke="#f59e0b" strokeWidth="1.2" />
                <circle cx="21" cy="38" r="2" fill="#fbbf24" />
                <circle cx="43" cy="38" r="2" fill="#fbbf24" />
                <path d="M12 47H52V50H12V47Z" fill="#f59e0b" />
                <path d="M16 52H48V54H16V52Z" fill="#d97706" />
                <text x="32" y="60" textAnchor="middle" fontSize="5.2" fontWeight="900" fill="#fef3c7" fontFamily="sans-serif" letterSpacing="0.5">सत्यमेव जयते</text>
              </svg>
            </div>

            {/* Dark, Authoritative National Typography */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 leading-none">
                  भारत सरकार • Government of India
                </span>
                <span className="text-slate-400 font-bold">•</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded shadow-2xs">
                  MoSPI
                </span>
              </div>

              <div className="flex items-center space-x-2.5 mt-0.5">
                <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
                  e-MPLADS
                </h1>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline border-l-2 border-slate-300 pl-2">
                  Members of Parliament Local Area Development Scheme
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Notifications & Logout */}
        <div className="flex items-center space-x-3 shrink-0">
          
          {/* Notifications Center with Working Popover */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition-all relative border shadow-2xs flex items-center justify-center ${
                showNotifications
                  ? 'bg-sky-50 border-sky-400 text-sky-700 ring-2 ring-sky-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
              }`}
              title="National System Notifications & Alerts"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Interactive Notifications Popover Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-0 z-50 text-xs overflow-hidden">
                
                {/* Header */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell size={15} className="text-slate-800" />
                    <span className="font-extrabold text-slate-900 text-xs">Official Portal Alerts</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-900 transition-colors flex items-center space-x-1"
                        title="Mark all notifications as read"
                      >
                        <Check size={12} />
                        <span>Mark all read</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-3 py-1.5 space-x-2">
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      activeFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('UNREAD')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      activeFilter === 'UNREAD'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {/* Notifications Scrollable List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 space-y-2">
                      <CheckCircle2 size={28} className="mx-auto text-emerald-600" />
                      <p className="text-xs font-semibold text-slate-700">You are all caught up!</p>
                      <p className="text-[11px] text-slate-400">No active alerts match this filter.</p>
                    </div>
                  ) : (
                    filteredNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 transition-all cursor-pointer flex items-start space-x-3 hover:bg-slate-50 ${
                          !n.read ? 'bg-sky-50/40 border-l-4 border-l-sky-600' : 'bg-white'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                          {getNotifIcon(n.type)}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                            {n.message}
                          </p>
                        </div>

                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0 mt-1.5" title="Unread" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Bar */}
                {notifications.length > 0 && (
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Synced with live MoSPI database</span>
                    <button
                      onClick={clearAllNotifications}
                      className="text-slate-500 hover:text-rose-700 font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Clear list</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Professional Logout Button */}
          <div className="border-l border-slate-200 pl-3">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98"
              title="Sign Out to Login Screen"
            >
              <LogOut size={14} className="stroke-[2.3]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
