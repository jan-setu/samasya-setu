import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { PriorityExplainer } from '../../components/PriorityExplainer';
import {
  CheckCircle2,
  XCircle,
  Layers,
  MapPin,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react';

export function VerificationQueue({ onCountChange }) {
  const { t } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchQueue = async () => {
    try {
      const res = await api.get('/admin/verification-queue');
      setQueue(res.data.queue || []);
      if (onCountChange) onCountChange(res.data.queue?.length || 0);
    } catch (err) {
      console.error('Failed to fetch verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleVerify = async (problemId, action) => {
    setActionLoading(problemId);
    setError('');
    setMessage('');

    try {
      const res = await api.post(`/admin/verify-problem/${problemId}`, { action });
      setMessage(res.data.message);
      fetchQueue();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process verification action');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading verification queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-xs font-bold text-emerald-900">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {queue.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">{t('verificationQueueClear')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('verificationQueueClearDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {queue.map((prob) => (
            <div
              key={prob.id}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5 transition-all hover:border-emerald-300"
            >
              {/* Header info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      {prob.category}
                    </span>
                    <PriorityBadge band={prob.priority_band} score={prob.priority_score} />
                    <StatusBadge status={prob.status} />
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {prob.district}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    {prob.title}
                  </h3>
                  
                  <p className="text-xs text-slate-400">
                    {t('reportedBy')} <span className="font-semibold text-slate-700">{prob.reporter_name}</span> ({prob.reporter_email})
                  </p>
                </div>

                {/* 1-Click Verification Action Group */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleVerify(prob.id, 'approve')}
                    disabled={actionLoading === prob.id}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t('oneClickApprove')}
                  </button>

                  <button
                    onClick={() => handleVerify(prob.id, 'reject')}
                    disabled={actionLoading === prob.id}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {t('reject')}
                  </button>
                </div>
              </div>

              {/* AI Extraction Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> {t('englishTranslation')}
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {prob.description_en || prob.raw_description}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">
                    {t('originalSubmission')}
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {prob.raw_description}
                  </p>
                </div>
              </div>

              {/* Explainable Priority Breakdown */}
              {prob.priority_breakdown && (
                <PriorityExplainer
                  breakdown={prob.priority_breakdown}
                  score={prob.priority_score}
                  band={prob.priority_band}
                />
              )}

              {/* Media attachments */}
              {prob.media && prob.media.length > 0 && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-bold text-slate-500">Attachments ({prob.media.length}):</span>
                  <div className="flex gap-2">
                    {prob.media.map((m, idx) => (
                      <a key={idx} href={m.url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={m.url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
