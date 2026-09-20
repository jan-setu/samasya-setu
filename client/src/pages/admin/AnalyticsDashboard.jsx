import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Lightbulb,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  Compass
} from 'lucide-react';

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Compiling statewide analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, domainDistribution, priorityDistribution, districtBreakdown, organizationBreakdown } = analytics;

  return (
    <div className="space-y-8">
      {/* Top Aggregated Impact Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-800 to-green-900 rounded-3xl p-6 text-white shadow-md space-y-1">
          <div className="text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-300" /> Beneficiaries Reached
          </div>
          <div className="text-3xl font-extrabold font-['Plus_Jakarta_Sans']">
            {(summary.totalBeneficiaries || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-200/80">Citizens positively impacted</p>
        </div>

        <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-3xl p-6 text-white shadow-md space-y-1">
          <div className="text-blue-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-300" /> Patents & IP Filed
          </div>
          <div className="text-3xl font-extrabold font-['Plus_Jakarta_Sans']">
            {summary.patentsFiled || 0}
          </div>
          <p className="text-[11px] text-blue-200/80">Indigenous university patents</p>
        </div>

        <div className="bg-gradient-to-br from-purple-800 to-violet-900 rounded-3xl p-6 text-white shadow-md space-y-1">
          <div className="text-purple-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-300" /> Startups Incubated
          </div>
          <div className="text-3xl font-extrabold font-['Plus_Jakarta_Sans']">
            {summary.startupsCreated || 0}
          </div>
          <p className="text-[11px] text-purple-200/80">Spun off from problem solving</p>
        </div>

        <div className="bg-gradient-to-br from-amber-700 to-orange-800 rounded-3xl p-6 text-white shadow-md space-y-1">
          <div className="text-amber-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" /> CSR Grants Pledged
          </div>
          <div className="text-3xl font-extrabold font-['Plus_Jakarta_Sans']">
            ₹{(summary.fundingPledged || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-200/80">Industry tech deployment funding</p>
        </div>
      </div>

      {/* Domain Breakdown & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Domain Distribution */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Societal Domain Breakdown (Jharkhand Themes)
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {domainDistribution.map((item) => {
              const total = summary.totalReports || 1;
              const percent = Math.round((item.count / total) * 100);

              return (
                <div key={item.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>{item.domain}</span>
                    <span>{item.count} reports ({percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Organization Breakdown */}
        <div className="space-y-8">
          {/* Priority Bands */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Priority Tiers & Urgency Distribution
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {['Critical', 'High', 'Medium', 'Low'].map((band) => {
                const count = priorityDistribution.find(p => p.priority_band === band)?.count || 0;
                let bg = 'bg-slate-100 text-slate-700';
                if (band === 'Critical') bg = 'bg-red-50 text-red-700 border border-red-200';
                if (band === 'High') bg = 'bg-orange-50 text-orange-700 border border-orange-200';
                if (band === 'Medium') bg = 'bg-amber-50 text-amber-800 border border-amber-200';

                return (
                  <div key={band} className={`p-4 rounded-2xl text-center ${bg}`}>
                    <div className="text-[11px] font-bold uppercase tracking-wider">{band}</div>
                    <div className="text-2xl font-extrabold mt-1">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Institutional Participation */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Registered Stakeholder Ecosystem
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {organizationBreakdown.map((org) => (
                <div key={org.type} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">{org.type}</div>
                  <div className="text-lg font-extrabold text-slate-800 mt-0.5">{org.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* District Impact Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-600" />
          District-wise Challenge Density & Resolution Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4 text-center">Total Reports</th>
                <th className="py-3 px-4 text-center">Avg Priority Score</th>
                <th className="py-3 px-4 text-center">Solved / Deployed</th>
                <th className="py-3 px-4 text-right">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {districtBreakdown.map((dist) => {
                const total = dist.problem_count || 1;
                const solved = dist.solved_count || 0;
                const rate = Math.round((solved / total) * 100);

                return (
                  <tr key={dist.district} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {dist.district}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{dist.problem_count}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                        {Math.round(dist.avg_priority || 0)}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{solved}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-800">
                      {rate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
