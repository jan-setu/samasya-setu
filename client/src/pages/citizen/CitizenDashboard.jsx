import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MapView } from '../../components/MapView';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import {
  PlusCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

export function CitizenDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [problems, setProblems] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, myRes] = await Promise.all([
          api.get('/problems?limit=30'),
          api.get('/problems/my-reports')
        ]);
        setProblems(allRes.data.problems || []);
        setMyReports(myRes.data.reports || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Quick Action Hero */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('citizenPortalTag')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans']">
            {t('welcomeUser')}, {user?.name}!
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            {t('citizenPortalDesc')}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/citizen/report"
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold rounded-2xl shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              {t('reportNewProblem')}
            </Link>
            <Link
              to="/citizen/my-reports"
              className="px-5 py-3 bg-emerald-900/70 hover:bg-emerald-900 text-white font-bold rounded-2xl border border-emerald-600/50 transition-all flex items-center gap-2 text-sm"
            >
              <Layers className="w-4 h-4" />
              {t('trackMyReports')} ({myReports.length})
            </Link>
          </div>
        </div>

        {/* Decorative graphic */}
        <div className="hidden lg:block absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
          <svg width="350" height="350" viewBox="0 0 100 100" fill="currentColor">
            <path d="M15 70 C 35 35, 65 35, 85 70" stroke="white" strokeWidth="6"/>
          </svg>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('myReportsLogged')}</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{myReports.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('activeChallenges')}</div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1">{problems.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('solutionsInField')}</div>
          <div className="text-3xl font-extrabold text-blue-700 mt-1">
            {problems.filter(p => ['in_development', 'deployed', 'impact_verified'].includes(p.status)).length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('impactVerified')}</div>
          <div className="text-3xl font-extrabold text-green-600 mt-1">
            {problems.filter(p => p.status === 'impact_verified').length}
          </div>
        </div>
      </div>

      {/* Interactive Map View */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              {t('statewideExplorer')}
            </h2>
          </div>
          <Link
            to="/impact-wall"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            {t('publicImpactWall')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <MapView problems={problems} height="420px" />
      </div>

      {/* Recent Community Problems Feed */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">{t('recentSocietalReports')}</h2>
          <span className="text-xs text-slate-500 font-medium">{t('sortedByPriority')}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {problems.slice(0, 6).map((prob) => (
            <Link
              key={prob.id}
              to={`/problems/${prob.id}`}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 rounded-xl px-3 transition-colors group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {prob.category}
                  </span>
                  <PriorityBadge band={prob.priority_band} score={prob.priority_score} />
                  <StatusBadge status={prob.status} />
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {prob.district}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {prob.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {prob.description_en || prob.raw_description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 self-end sm:self-center">
                <div className="text-right">
                  <div className="font-bold text-slate-800">{prob.confirmation_count || 1} {t('confirmationsCount')}</div>
                  <div className="text-[11px] text-slate-400">{prob.proposal_count || 0} {t('proposalsCount')}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
