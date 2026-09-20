import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { PriorityExplainer } from '../../components/PriorityExplainer';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MapPin,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
  Building2
} from 'lucide-react';

export function MyReports() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const TIMELINE_STEPS = [
    { key: 'submitted', label: t('statusProcessing') },
    { key: 'verified', label: t('statusPendingVerification') },
    { key: 'claimed', label: t('statusClaimed') },
    { key: 'in_development', label: t('statusInDevelopment') },
    { key: 'deployed', label: t('statusImpactVerified') }
  ];

  function getTimelineIndex(status) {
    switch (status) {
      case 'processing': return 0;
      case 'pending_verification': return 1;
      case 'published': return 1;
      case 'claimed': return 2;
      case 'in_development': return 3;
      case 'deployed': return 4;
      case 'impact_verified': return 4;
      default: return 0;
    }
  }

  const fetchReports = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get('/problems/my-reports');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const interval = setInterval(() => {
      setReports(prev => {
        const hasProcessing = prev.some(r => r.status === 'processing');
        if (hasProcessing) {
          fetchReports(false);
        }
        return prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('trackMyReports')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('citizenPortalDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReports(false)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh
          </button>
          <Link
            to="/citizen/report"
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {t('reportNewProblem')}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading your reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{t('noReportsYet')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('noReportsYetDesc')}
          </p>
          <Link
            to="/citizen/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" /> {t('reportFirstProblem')}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => {
            const stepIndex = getTimelineIndex(report.status);
            const isProcessing = report.status === 'processing';

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5 transition-all hover:border-emerald-300"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                        {report.category}
                      </span>
                      <PriorityBadge band={report.priority_band} score={report.priority_score} />
                      <StatusBadge status={report.status} />
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {report.district}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                      {report.title}
                    </h2>
                  </div>

                  <Link
                    to={`/problems/${report.id}`}
                    className="self-start px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {t('viewDetails')} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* AI Translation & Description */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                  {report.description_en ? (
                    <div>
                      <span className="font-bold text-emerald-900 block mb-0.5">{t('englishTranslation')}:</span>
                      <p className="text-slate-700">{report.description_en}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-700">{report.raw_description}</p>
                    </div>
                  )}

                  {report.raw_description && report.description_en && report.raw_description !== report.description_en && (
                    <div className="pt-2 border-t border-slate-200/60 text-slate-500">
                      <span className="font-semibold block mb-0.5 text-slate-600">{t('originalSubmission')}:</span>
                      <p>{report.raw_description}</p>
                    </div>
                  )}
                </div>

                {/* Processing banner if AI pipeline is running */}
                {isProcessing && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3 text-amber-900 text-xs">
                    <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                    <div>{t('aiPipelineInProgress')}</div>
                  </div>
                )}

                {/* Status Timeline Bar */}
                <div className="py-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    {t('progressLifecycle')}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const isCompleted = idx < stepIndex || report.status === 'impact_verified';
                      const isCurrent = idx === stepIndex;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted ? 'bg-emerald-600 text-white' :
                            isCurrent ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse' :
                            'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`text-[10px] sm:text-xs font-medium leading-tight ${
                            isCompleted || isCurrent ? 'text-slate-800 font-bold' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explainable Priority Breakdown */}
                {report.priority_breakdown && (
                  <PriorityExplainer
                    breakdown={report.priority_breakdown}
                    score={report.priority_score}
                    band={report.priority_band}
                  />
                )}

                {/* Summary footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>{t('reportedOn')} {new Date(report.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="font-semibold text-slate-700">
                    {report.confirmation_count || 1} {t('confirmationsCount')} • {report.proposal_count || 0} {t('proposalsCount')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
