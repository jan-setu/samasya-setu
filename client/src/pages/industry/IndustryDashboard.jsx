import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Modal } from '../../components/Modal';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import {
  Briefcase,
  Sparkles,
  Award,
  Building2,
  IndianRupee,
  Users,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  HeartHandshake
} from 'lucide-react';

export function IndustryDashboard() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundingAmount, setFundingAmount] = useState(250000);
  const [mentorshipNote, setMentorshipNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchFeed = async () => {
    try {
      const res = await api.get('/proposals/matched-feed');
      setProblems(res.data.matchedProblems || []);
    } catch (err) {
      console.error('Failed to load industry feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handlePledgeFunding = async (e) => {
    e.preventDefault();
    if (!selectedProposal) return;

    try {
      const res = await api.post(`/proposals/${selectedProposal.id}/fund`, {
        amount: Number(fundingAmount),
        mentorshipNote
      });

      setMessage(res.data.message);
      setShowFundModal(false);
      fetchFeed();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to pledge CSR grant');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading industry & CSR portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Industry, Startup & CSR Innovation Collaboration Wing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans']">
            {user?.name}
          </h1>
          <p className="text-amber-100/90 text-sm max-w-xl">
            Sponsor and deploy high-impact university research proposals, provide technical mentorship, and fulfill CSR statutory impact milestones across Jharkhand.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start md:self-center">
          <Building2 className="w-8 h-8 text-amber-400" />
          <div>
            <div className="text-xs text-amber-200 font-semibold">{user?.org_name || 'Industry Partner'}</div>
            <div className="text-sm font-extrabold text-white">{user?.department || 'CSR Innovation'}</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Challenges & University Proposals for Sponsorship */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              University & Startup Solutions Seeking CSR/Industry Partnership
            </h2>
            <p className="text-xs text-slate-500">
              Verified problems with active student & faculty research proposals ready for funding and field deployment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((prob) => (
            <div
              key={prob.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                    {prob.category}
                  </span>
                  <PriorityBadge band={prob.priority_band} score={prob.priority_score} />
                  <span className="text-xs text-slate-400 font-medium">{prob.district}</span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {prob.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {prob.description_en || prob.raw_description}
                </p>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-semibold">
                  {prob.proposal_count || 1} Active University Proposals
                </span>

                <button
                  onClick={() => {
                    setSelectedProblem(prob);
                    // Mock select first proposal or prompt
                    setSelectedProposal({ id: 'prop_fluoride_filter', title: prob.title, budget: 280000 });
                    setShowFundModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <HeartHandshake className="w-4 h-4" />
                  Pledge CSR Grant & Mentorship
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funding Modal */}
      {showFundModal && (
        <Modal
          isOpen={showFundModal}
          onClose={() => setShowFundModal(false)}
          title="Pledge CSR Innovation Grant & Mentorship"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handlePledgeFunding} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-900">Target Project</span>
              <div className="font-extrabold text-slate-900">{selectedProblem?.title}</div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Grant / Funding Pledge (₹ INR)
              </label>
              <input
                type="number"
                required
                value={fundingAmount}
                onChange={(e) => setFundingAmount(Number(e.target.value))}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mentorship & Resource Support Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Offering manufacturing equipment access at our Jamshedpur plant and expert metallurgy mentorship..."
                value={mentorshipNote}
                onChange={(e) => setMentorshipNote(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFundModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md"
              >
                Confirm CSR Pledge
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
