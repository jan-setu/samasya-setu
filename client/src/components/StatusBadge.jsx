import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export function StatusBadge({ status, className = '' }) {
  const { t } = useLanguage();

  const STATUS_CONFIG = {
    processing: { label: t('statusProcessing'), bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    pending_verification: { label: t('statusPendingVerification'), bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    published: { label: t('statusPublished'), bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    claimed: { label: t('statusClaimed'), bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    in_development: { label: t('statusInDevelopment'), bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    deployed: { label: t('statusDeployed'), bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    impact_verified: { label: t('statusImpactVerified'), bg: 'bg-green-100 text-green-800 border-green-300 font-semibold' },
    rejected: { label: t('statusRejected'), bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    merged: { label: t('statusMerged'), bg: 'bg-slate-100 text-slate-700 border-slate-300' }
  };

  const config = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100 text-gray-800 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ band, score, showScore = true, className = '' }) {
  const { t } = useLanguage();

  const PRIORITY_CONFIG = {
    Critical: { label: t('criticalPriority'), bg: 'bg-red-600 text-white shadow-sm' },
    High: { label: t('highPriority'), bg: 'bg-orange-500 text-white shadow-sm' },
    Medium: { label: t('mediumPriority'), bg: 'bg-amber-400 text-slate-900' },
    Low: { label: t('lowPriority'), bg: 'bg-slate-200 text-slate-800' }
  };

  const config = PRIORITY_CONFIG[band] || { label: band || 'Normal', bg: 'bg-gray-200 text-gray-800' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${config.bg} ${className}`}>
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-90 ml-0.5 font-mono">({score})</span>
      )}
    </span>
  );
}
