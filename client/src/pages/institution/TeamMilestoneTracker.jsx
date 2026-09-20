import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Modal } from '../../components/Modal';
import {
  CheckCircle2,
  Clock,
  Circle,
  Upload,
  Award,
  Lightbulb,
  Users,
  Building2,
  AlertCircle,
  Plus,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export function TeamMilestoneTracker() {
  const { t } = useLanguage();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [beneficiaries, setBeneficiaries] = useState(1500);
  const [patents, setPatents] = useState(1);
  const [startups, setStartups] = useState(0);
  const [impactSummary, setImpactSummary] = useState('');

  const fetchProposals = async () => {
    try {
      const res = await api.get('/proposals/my-proposals');
      setProposals(res.data.proposals || []);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleUpdateMilestone = async (proposalId, milestoneId, newStatus) => {
    setActionLoading(milestoneId);
    setError('');
    setMessage('');

    try {
      await api.put(`/proposals/${proposalId}/milestones/${milestoneId}`, {
        status: newStatus,
        evidence_url: newStatus === 'completed' ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800' : null
      });
      setMessage('Milestone status updated successfully!');
      fetchProposals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update milestone');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogImpactSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProposal) return;

    setActionLoading('impact');
    try {
      await api.post(`/proposals/${selectedProposal.id}/impact`, {
        beneficiaries_count: Number(beneficiaries),
        patents_filed: Number(patents),
        startups_created: Number(startups),
        summary: impactSummary
      });

      setMessage('Impact & IP outcomes logged successfully! Updates reflected on the Public Impact Wall.');
      setShowImpactModal(false);
      fetchProposals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log impact');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading your active innovation projects...</p>
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

      {proposals.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">{t('noActiveClaimed')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('noActiveClaimedDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                      {prop.problem_category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                      {prop.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {prop.problem_district}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900">
                    {prop.problem_title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900">{t('techApproachLabel')}: </span>
                    {prop.approach}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedProposal(prop);
                    setShowImpactModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 self-start sm:self-auto"
                >
                  <Award className="w-4 h-4" />
                  {t('logImpactAndIP')}
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('budgetLabel')}</span>
                  <div className="font-bold text-slate-900 mt-0.5">₹{(Number(prop.budget) || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('csrFundingPledged')}</span>
                  <div className="font-bold text-emerald-700 mt-0.5">₹{(Number(prop.funding_pledged) || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('timelineLabel')}</span>
                  <div className="font-bold text-slate-900 mt-0.5">{prop.timeline_weeks} Weeks</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Team</span>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">{prop.team_name || 'Innovation Lab'}</div>
                </div>
              </div>

              {/* Milestones Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    {t('milestonesRoadmap')}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {prop.milestones?.filter(m => m.status === 'completed').length || 0} of {prop.milestones?.length || 0}
                  </span>
                </div>

                <div className="space-y-2">
                  {prop.milestones?.map((m, idx) => {
                    const isDone = m.status === 'completed';
                    const isInProg = m.status === 'in_progress';

                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDone ? 'bg-emerald-50/60 border-emerald-200' :
                          isInProg ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleUpdateMilestone(prop.id, m.id, isDone ? 'pending' : 'completed')}
                            disabled={actionLoading === m.id}
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              isDone ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 hover:border-emerald-500'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-4 h-4" />}
                          </button>

                          <div>
                            <div className={`text-xs font-bold ${isDone ? 'text-emerald-950 line-through' : 'text-slate-900'}`}>
                              {idx + 1}. {m.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Due: {new Date(m.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {m.evidence_url && (
                            <a
                              href={m.evidence_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 mr-2"
                            >
                              <ExternalLink className="w-3 h-3" /> Evidence
                            </a>
                          )}

                          <select
                            value={m.status}
                            onChange={(e) => handleUpdateMilestone(prop.id, m.id, e.target.value)}
                            disabled={actionLoading === m.id}
                            className="py-1 px-2.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showImpactModal && (
        <Modal
          isOpen={showImpactModal}
          onClose={() => setShowImpactModal(false)}
          title={t('logImpactAndIP')}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleLogImpactSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t('citizensBenefited')}
                </label>
                <input
                  type="number"
                  required
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t('patentsFiled')}
                </label>
                <input
                  type="number"
                  required
                  value={patents}
                  onChange={(e) => setPatents(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t('startupsIncubated')}
                </label>
                <input
                  type="number"
                  required
                  value={startups}
                  onChange={(e) => setStartups(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('communityOutcome')}
              </label>
              <textarea
                required
                rows={3}
                placeholder="Field outcome summary..."
                value={impactSummary}
                onChange={(e) => setImpactSummary(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImpactModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Save Impact
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
