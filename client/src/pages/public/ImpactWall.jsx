import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { MapView } from '../../components/MapView';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Award,
  Users,
  Lightbulb,
  Building2,
  CheckCircle2,
  Sparkles,
  MapPin,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Compass
} from 'lucide-react';

export function ImpactWall() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [successStories, setSuccessStories] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImpactData = async () => {
      try {
        const [impactRes, probRes] = await Promise.all([
          api.get('/impact/stats'),
          api.get('/problems?limit=50')
        ]);
        setStats(impactRes.data.stats);
        setSuccessStories(impactRes.data.successStories || []);
        setProblems(probRes.data.problems || []);
      } catch (err) {
        console.error('Failed to load impact stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchImpactData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading statewide societal innovation impact...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Impact Banner */}
      <section className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/40">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('heroTag')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans']">
            {t('heroTitle')}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Live Counters Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center space-y-1">
            <Users className="w-6 h-6 text-emerald-400 mx-auto" />
            <div className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] text-white">
              {(stats?.totalBeneficiaries || 6050).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-emerald-200 font-semibold">{t('citizensBenefited')}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto" />
            <div className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] text-white">
              {stats?.solvedProblems || 2}
            </div>
            <div className="text-xs text-green-200 font-semibold">{t('problemsSolved')}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center space-y-1">
            <Award className="w-6 h-6 text-amber-400 mx-auto" />
            <div className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] text-white">
              {stats?.totalPatents || 2}
            </div>
            <div className="text-xs text-amber-200 font-semibold">{t('patentsFiled')}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center space-y-1">
            <Lightbulb className="w-6 h-6 text-purple-400 mx-auto" />
            <div className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans'] text-white">
              {stats?.totalStartups || 1}
            </div>
            <div className="text-xs text-purple-200 font-semibold">{t('startupsIncubated')}</div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              {t('verifiedImpactStories')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {successStories.map((story) => (
            <div
              key={story.id}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                    {story.category}
                  </span>
                  <StatusBadge status="impact_verified" />
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {story.district}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                  {story.title}
                </h3>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-slate-700 space-y-2">
                  <div>
                    <span className="font-bold text-emerald-900 block">{t('deployedInnovation')}:</span>
                    <p className="font-medium">{story.approach}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 block">{t('techStack')}:</span>
                    <p className="font-mono text-slate-600">{story.tech_stack}</p>
                  </div>
                </div>

                {story.impact_summary && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed">
                    <span className="font-bold block mb-0.5 text-emerald-900">{t('communityOutcome')}:</span>
                    {story.impact_summary}
                  </div>
                )}
              </div>

              {/* Verified Metrics Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-bold">
                <span className="text-emerald-800">
                  ⚡ {(story.beneficiaries_count || 0).toLocaleString('en-IN')} {t('citizensImpacted')}
                </span>
                <span className="text-slate-500">
                  {story.org_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Statewide Interactive Map Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-6 h-6 text-emerald-600" />
              {t('statewideExplorer')}
            </h2>
          </div>

          <MapView problems={problems} height="480px" />
        </div>
      </section>
    </div>
  );
}
