import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { PriorityExplainer } from '../../components/PriorityExplainer';
import { SubmitProposalModal } from './SubmitProposalModal';
import {
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Building2,
  Cpu
} from 'lucide-react';

export function MatchedProblemsFeed({ onProposalSuccess }) {
  const { t } = useLanguage();
  const [matchedProblems, setMatchedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMatchedProblems = async () => {
    try {
      const res = await api.get('/proposals/matched-feed');
      setMatchedProblems(res.data.matchedProblems || []);
    } catch (err) {
      console.error('Failed to fetch matched problem feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchedProblems();
  }, []);

  const handleOpenProposal = (prob) => {
    setSelectedProblem(prob);
    setShowModal(true);
  };

  const handleSuccess = () => {
    setSuccessMsg('Your proposal and roadmap have been recorded! Track progress in the Milestones tab.');
    fetchMatchedProblems();
    if (onProposalSuccess) onProposalSuccess();
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Matching societal problems to your research expertise...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs font-bold text-emerald-900">Dismiss</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            {t('matchedChallengesTab')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('heiDesc')}
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {matchedProblems.length} {t('activeChallenges')}
        </span>
      </div>

      {matchedProblems.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Cpu className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">{t('noMatchedOpen')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('noMatchedOpenDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {matchedProblems.map((prob) => (
            <div
              key={prob.id}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5 transition-all hover:border-emerald-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      {prob.orgMatchScore || 85}% Match
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                      {prob.category}
                    </span>

                    <PriorityBadge band={prob.priority_band} score={prob.priority_score} />
                    <StatusBadge status={prob.status} />

                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {prob.district}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    {prob.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleOpenProposal(prob)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
                >
                  <Cpu className="w-4 h-4" />
                  {t('claimAndPropose')}
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {prob.description_en || prob.raw_description}
              </div>

              {prob.priority_breakdown && (
                <PriorityExplainer
                  breakdown={prob.priority_breakdown}
                  score={prob.priority_score}
                  band={prob.priority_band}
                />
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-medium">{t('reportedBy')} {prob.reporter_name}</span>
                <span className="font-semibold text-slate-700">
                  {prob.proposal_count || 0} {t('proposalsCount')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProblem && showModal && (
        <SubmitProposalModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          problem={selectedProblem}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
