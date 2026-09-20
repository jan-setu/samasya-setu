import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MatchedProblemsFeed } from './MatchedProblemsFeed';
import { TeamMilestoneTracker } from './TeamMilestoneTracker';
import {
  GraduationCap,
  Sparkles,
  Layers,
  Building2,
  Cpu,
  BookOpen
} from 'lucide-react';

export function InstitutionDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('matched_feed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Institution Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-400/30 text-blue-200 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('heiPortalTag')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans']">
            {user?.name}
          </h1>
          <p className="text-blue-100 text-sm max-w-xl">
            {t('heiDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start md:self-center">
          <Building2 className="w-8 h-8 text-amber-400" />
          <div>
            <div className="text-xs text-blue-200 font-semibold">{user?.org_name || 'State University'}</div>
            <div className="text-sm font-extrabold text-white">{user?.department || 'Department of Innovation'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('matched_feed')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'matched_feed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{t('matchedChallengesTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'tracker' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>{t('myProjectsTab')}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'matched_feed' ? (
        <MatchedProblemsFeed onProposalSuccess={() => setActiveTab('tracker')} />
      ) : (
        <TeamMilestoneTracker />
      )}
    </div>
  );
}
