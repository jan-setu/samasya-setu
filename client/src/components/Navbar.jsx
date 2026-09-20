import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardUrl } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Bell,
  LogOut,
  User,
  Shield,
  Layers,
  Map,
  PlusCircle,
  Award,
  Sparkles,
  ChevronDown,
  Building2,
  GraduationCap,
  Briefcase,
  FileCheck,
  Globe2
} from 'lucide-react';

const ROLE_LABELS = {
  citizen: { label: 'Citizen', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  admin: { label: 'State Super Admin', color: 'bg-red-100 text-red-800 border-red-300' },
  govt_dept: { label: 'Govt Department', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  faculty: { label: 'University Faculty', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  student: { label: 'Student Innovator', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  industry: { label: 'Industry / CSR', color: 'bg-amber-100 text-amber-800 border-amber-300' }
};

export function Navbar() {
  const { user, logout, login } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { lang, setLang, t, supportedLanguages, currentLangObj } = useLanguage();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const notifRef = useRef(null);
  const langRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickDemoSwitch = async (email) => {
    try {
      const result = await login(email, 'Password123!');
      setShowDemoSwitcher(false);
      navigate(result.redirectUrl);
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  const userDashboard = user ? getDashboardUrl(user) : '/login';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top SIH / Jharkhand Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 text-white text-[11px] py-1 px-4 text-center font-medium flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2">
          <span className="bg-emerald-900/60 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">Jharkhand SIH Edition</span>
          <span>{t('sihBannerTitle')}</span>
        </div>
        <div className="mx-auto sm:mx-0 flex items-center gap-3">
          <span className="text-emerald-200 font-normal hidden md:inline">{t('sihBannerSubtitle')}</span>
          <button
            onClick={() => setShowDemoSwitcher(!showDemoSwitcher)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="w-3 h-3" /> {t('oneClickSwitcher')}
          </button>
        </div>
      </div>

      {/* 1-Click Role Switcher Drawer */}
      {showDemoSwitcher && (
        <div className="bg-slate-900 text-white p-3 border-b border-slate-800 animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Instant Demo Role Login:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleQuickDemoSwitch('citizen@samsyasetu.in')}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 font-semibold text-[11px] transition-colors"
              >
                1. Citizen (Sunita)
              </button>
              <button
                onClick={() => handleQuickDemoSwitch('admin@samsyasetu.in')}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 font-semibold text-[11px] transition-colors"
              >
                2. Admin (Rajesh)
              </button>
              <button
                onClick={() => handleQuickDemoSwitch('dept.water@jharkhand.gov.in')}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 font-semibold text-[11px] transition-colors"
              >
                3. Govt Dept (Water)
              </button>
              <button
                onClick={() => handleQuickDemoSwitch('prof.sharma@bitmesra.ac.in')}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 font-semibold text-[11px] transition-colors"
              >
                4. Faculty (BIT Mesra)
              </button>
              <button
                onClick={() => handleQuickDemoSwitch('student.ananya@iitism.ac.in')}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 font-semibold text-[11px] transition-colors"
              >
                5. Student (IIT ISM)
              </button>
              <button
                onClick={() => handleQuickDemoSwitch('csr.lead@tatasteel.com')}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 font-semibold text-[11px] transition-colors"
              >
                6. Industry (Tata Steel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-7 h-7">
                <path d="M15 70 C 35 35, 65 35, 85 70" stroke="#FBBF24" strokeWidth="9" strokeLinecap="round"/>
                <line x1="32" y1="52" x2="32" y2="70" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round"/>
                <line x1="50" y1="44" x2="50" y2="70" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round"/>
                <line x1="68" y1="52" x2="68" y2="70" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="50" cy="24" r="10" fill="#FFFFFF"/>
              </svg>
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-1 font-['Plus_Jakarta_Sans']">
                <span>Samasya</span>
                <span className="text-emerald-700">Setu</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight -mt-1">{t('platformSubtitle')}</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600">
            <Link
              to="/impact-wall"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/impact-wall' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-600" />
              {t('publicImpactWall')}
            </Link>

            {user && (
              <>
                <Link
                  to={userDashboard}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    location.pathname.includes('dashboard') ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-600" />
                  {t('myDashboard')}
                </Link>

                {user.role === 'citizen' && (
                  <Link
                    to="/citizen/report"
                    className="ml-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t('reportProblem')}
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Select Regional Language"
              >
                <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline font-semibold">{currentLangObj.native}</span>
                <span className="sm:hidden font-bold uppercase">{currentLangObj.code}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Choose Language / भाषा
                  </div>
                  {supportedLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                        lang === l.code ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{l.native}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setShowNotifs(!showNotifs);
                      if (!showNotifs && unreadCount > 0) markAsRead();
                    }}
                    className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAsRead()}
                            className="text-[11px] text-emerald-700 hover:underline font-semibold"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 text-xs transition-colors ${n.is_read ? 'bg-white opacity-80' : 'bg-emerald-50/50'}`}
                            >
                              <div className="font-bold text-slate-900">{n.title}</div>
                              <p className="text-slate-600 mt-0.5">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Role Badge & Info */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${ROLE_LABELS[user.role]?.color || 'bg-slate-100 text-slate-800'}`}>
                      {ROLE_LABELS[user.role]?.label || user.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t('logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {t('signIn')}
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-sm"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
