import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import {
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Clock,
  IndianRupee,
  Cpu,
  Users,
  AlertCircle
} from 'lucide-react';

export function SubmitProposalModal({ isOpen, onClose, problem, onSuccess }) {
  const { t } = useLanguage();
  const [approach, setApproach] = useState('');
  const [techStack, setTechStack] = useState('');
  const [budget, setBudget] = useState(250000);
  const [timelineWeeks, setTimelineWeeks] = useState(8);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [milestones, setMilestones] = useState([
    { title: 'Field Assessment, Soil/Water Testing & Requirements Sign-off', due_date: '2026-10-15' },
    { title: 'Prototyping, Fabrication & Lab Validation', due_date: '2026-11-15' },
    { title: 'Community Deployment & PRI Handover', due_date: '2026-12-15' }
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', due_date: '' }]);
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!approach || !techStack) {
      setError('Please provide technical approach and tech stack details.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/proposals', {
        problem_id: problem.id,
        approach,
        tech_stack: techStack,
        budget: Number(budget),
        timeline_weeks: Number(timelineWeeks),
        team_name: teamName || 'University Innovation Lab',
        milestones
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('submitSolutionProposal')} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Problem Header */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Target Challenge</span>
          <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{problem?.title}</h4>
          <span className="text-xs text-slate-500">{problem?.district} • {problem?.category}</span>
        </div>

        {/* Technical Approach */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            {t('techApproach')}
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe methodology, engineering design, and deployment plan..."
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Tech Stack, Budget, Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t('techStack')}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. IoT, Solar PV, LoRa, ESP32"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t('estimatedBudget')}
            </label>
            <input
              type="number"
              required
              min="0"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t('timelineWeeks')}
            </label>
            <input
              type="number"
              required
              min="1"
              max="52"
              value={timelineWeeks}
              onChange={(e) => setTimelineWeeks(Number(e.target.value))}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Milestone Roadmap */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('milestonesRoadmap')} ({milestones.length})
            </span>
            <button
              type="button"
              onClick={addMilestone}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Milestone
            </button>
          </div>

          <div className="space-y-2">
            {milestones.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  required
                  placeholder="Milestone title"
                  value={m.title}
                  onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                  className="flex-1 py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <input
                  type="date"
                  required
                  value={m.due_date}
                  onChange={(e) => updateMilestone(idx, 'due_date', e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {loading ? 'Submitting...' : 'Confirm & Claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
