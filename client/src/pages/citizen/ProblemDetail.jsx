import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { PriorityExplainer } from '../../components/PriorityExplainer';
import { MapView } from '../../components/MapView';
import { SubmitProposalModal } from '../institution/SubmitProposalModal';
import {
  MapPin,
  Clock,
  ShieldAlert,
  Users,
  Building2,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  FileText,
  ThumbsUp,
  Award,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check
} from 'lucide-react';

export function ProblemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const fetchProblem = async () => {
    try {
      const res = await api.get(`/problems/${id}`);
      setProblem(res.data.problem);
      if (user && res.data.problem?.confirmations) {
        const hasConfirmed = res.data.problem.confirmations.some(c => c.user_id === user.id);
        setConfirmed(hasConfirmed);
      }
    } catch (err) {
      console.error('Failed to fetch problem detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblem();
  }, [id, user]);

  const handleConfirmProblem = async () => {
    if (!user) {
      alert('Please log in to confirm this problem.');
      return;
    }
    setConfirming(true);
    try {
      await api.post(`/problems/${id}/confirm`, { comment: 'Confirmed by citizen' });
      setConfirmed(true);
      setSuccessBanner('Thank you! Your confirmation has been recorded.');
      fetchProblem();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record confirmation');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading problem details...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-800">Problem Not Found</h2>
        <Link to="/" className="inline-block px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold">
          Return Home
        </Link>
      </div>
    );
  }

  const isEligibleToPropose = user && ['faculty', 'student', 'industry'].includes(user.role);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-600 hover:text-emerald-950 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Header & Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700">
                {problem.category}
              </span>
              <PriorityBadge band={problem.priority_band} score={problem.priority_score} />
              <StatusBadge status={problem.status} />
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {problem.district}, Jharkhand
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {problem.title}
            </h1>

            <p className="text-xs text-slate-400">
              {t('reportedBy')} <span className="font-semibold text-slate-700">{problem.reporter_name}</span> on {new Date(problem.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
            <button
              onClick={handleConfirmProblem}
              disabled={confirming || confirmed}
              className={`py-3 px-5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                confirmed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-900 hover:scale-[1.02]'
              }`}
            >
              {confirmed ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  {t('confirmedBy')} ({problem.confirmations?.length || 1})
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  {t('iHaveThisProblemToo')} ({problem.confirmations?.length || 1})
                </>
              )}
            </button>

            {isEligibleToPropose && (
              <button
                onClick={() => setShowProposalModal(true)}
                className="py-3 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {t('submitSolutionProposal')}
              </button>
            )}
          </div>
        </div>

        {/* Problem Description Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> {t('englishTranslation')}
            </span>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {problem.description_en || problem.raw_description}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> {t('originalSubmission')}
            </span>
            <p className="text-sm text-slate-700 leading-relaxed">
              {problem.raw_description}
            </p>
          </div>
        </div>

        {/* Explainable Priority Score Breakdown */}
        {problem.priority_breakdown && (
          <PriorityExplainer
            breakdown={problem.priority_breakdown}
            score={problem.priority_score}
            band={problem.priority_band}
          />
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                {t('solutionsAndProposals')} ({problem.proposals?.length || 0})
              </h2>
            </div>

            {(!problem.proposals || problem.proposals.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">{t('noProposalsYet')}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('noProposalsDesc')}
                </p>
                {isEligibleToPropose && (
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
                  >
                    {t('beFirstToSubmit')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {problem.proposals.map((prop) => (
                  <div key={prop.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                          {prop.org_name || 'Innovator Team'}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                          {t('techApproachLabel')}
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase self-start sm:self-auto">
                        {prop.status}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      {prop.approach}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('techStack')}</span>
                        <span className="font-bold text-slate-800 truncate block">{prop.tech_stack}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('budgetLabel')}</span>
                        <span className="font-bold text-slate-800">₹{(Number(prop.budget) || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('timelineLabel')}</span>
                        <span className="font-bold text-slate-800">{prop.timeline_weeks} Weeks</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('csrFundingPledged')}</span>
                        <span className="font-bold text-emerald-700">₹{(Number(prop.funding_pledged) || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        to={`/institution/dashboard`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        <span>{t('myProjectsTab')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> {t('problemLocation')}
            </h3>
            <MapView
              problems={[problem]}
              center={[problem.lat, problem.lng]}
              zoom={13}
              height="240px"
            />
          </div>

          {problem.media && problem.media.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" /> {t('photoFieldEvidence')}
              </h3>
              <div className="space-y-3">
                {problem.media.map((m) => (
                  <div key={m.id} className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
                    <img src={m.url} alt={m.caption || 'Field evidence'} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {problem.matchedOrgs && problem.matchedOrgs.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> {t('aiMatchedInstitutions')}
              </h3>
              <div className="space-y-2">
                {problem.matchedOrgs.map((org) => (
                  <div key={org.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{org.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">{org.type} • {org.district}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showProposalModal && (
        <SubmitProposalModal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          problem={problem}
          onSuccess={() => {
            setShowProposalModal(false);
            setSuccessBanner('Your solution proposal and milestone roadmap have been successfully submitted!');
            fetchProblem();
          }}
        />
      )}
    </div>
  );
}
