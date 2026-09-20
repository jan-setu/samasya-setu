import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { HelpCircle, ChevronDown, ChevronUp, ShieldAlert, Users, School, Clock, MapPin } from 'lucide-react';

export function PriorityExplainer({ breakdown, score, band }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();

  if (!breakdown) return null;

  const bandLabel = band === 'Critical' ? t('criticalPriority') :
                    band === 'High' ? t('highPriority') :
                    band === 'Medium' ? t('mediumPriority') : t('lowPriority');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 my-2">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
            score >= 80 ? 'bg-red-100 text-red-700' :
            score >= 60 ? 'bg-orange-100 text-orange-700' :
            score >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
          }`}>
            {score}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('priorityEngine')}</div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>{bandLabel}</span>
              <span className="text-xs text-slate-400 font-normal">({score}/100)</span>
            </div>
          </div>
        </div>

        <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
          <div className="text-slate-600 font-medium mb-1">{t('scoreBreakdown')}</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-700">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                {t('safetyRisk')}
              </span>
              <span className="font-bold text-red-600">+{breakdown.safetyRiskPoints || 0} pts</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                {t('citizenVolume')}
              </span>
              <span className="font-bold text-blue-600">+{breakdown.volumePoints || 0} pts</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-700">
                <School className="w-3.5 h-3.5 text-purple-500" />
                {t('schoolClinicProximity')}
              </span>
              <span className="font-bold text-purple-600">+{breakdown.vulnerableGroupPoints || 0} pts</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {t('daysPending')}
              </span>
              <span className="font-bold text-amber-600">+{breakdown.pendingAgePoints || 0} pts</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-100 sm:col-span-2">
              <span className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                {t('districtTier')}
              </span>
              <span className="font-bold text-emerald-600">+{breakdown.districtIndexPoints || 0} pts</span>
            </div>
          </div>

          {Array.isArray(breakdown.explanations) && breakdown.explanations.length > 0 && (
            <div className="mt-2 bg-blue-50/70 p-2 rounded text-blue-900 leading-relaxed">
              <div className="font-semibold text-blue-950 mb-0.5">{t('auditTrail')}</div>
              <ul className="list-disc list-inside space-y-0.5">
                {breakdown.explanations.map((exp, idx) => (
                  <li key={idx}>{exp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
