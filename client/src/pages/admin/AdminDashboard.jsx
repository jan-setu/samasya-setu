import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { VerificationQueue } from './VerificationQueue';
import { AccountApprovalQueue } from './AccountApprovalQueue';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import {
  Shield,
  CheckCircle2,
  Users,
  BarChart3,
  Layers,
  Sparkles,
  Building2
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('verification');
  const [queueCount, setQueueCount] = useState(0);
  const [pendingUserCount, setPendingUserCount] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>{t('adminCommandCenter')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans']">
            {user?.name}
          </h1>
          <p className="text-slate-300 text-sm max-w-xl">
            {t('adminDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start md:self-center">
          <Building2 className="w-8 h-8 text-emerald-400" />
          <div>
            <div className="text-xs text-slate-300 font-semibold">{user?.org_name || 'State Government'}</div>
            <div className="text-sm font-extrabold text-white">{user?.department || 'Executive Department'}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-2xl">
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'verification' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>{t('verificationQueueTab')}</span>
          {queueCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
              {queueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('account_approvals')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'account_approvals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span>{t('accountApprovalsTab')}</span>
          {pendingUserCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
              {pendingUserCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>{t('analyticsTab')}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'verification' && (
        <VerificationQueue onCountChange={setQueueCount} />
      )}

      {activeTab === 'account_approvals' && (
        <AccountApprovalQueue onCountChange={setPendingUserCount} />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsDashboard />
      )}
    </div>
  );
}
