import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  Clock,
  AlertCircle
} from 'lucide-react';

export function AccountApprovalQueue({ onCountChange }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPendingUsers = async () => {
    try {
      const res = await api.get('/admin/pending-users');
      setUsers(res.data.users || []);
      if (onCountChange) onCountChange(res.data.users?.length || 0);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    setError('');
    setMessage('');
    try {
      const res = await api.post(`/admin/approve-user/${userId}`);
      setMessage(res.data.message);
      fetchPendingUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    setError('');
    setMessage('');
    try {
      const res = await api.post(`/admin/reject-user/${userId}`);
      setMessage(res.data.message);
      fetchPendingUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-500">Loading pending account registrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {users.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">{t('noPendingAccounts')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('noPendingAccountsDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">
                    {u.role === 'admin' ? 'State Admin Request' : 'Govt Department Request'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Registered on {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{u.name}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{u.org_name || u.department || 'Govt Wing'} ({u.org_district || 'Ranchi'})</span>
                  </div>
                </div>
              </div>

              {/* Approve / Reject Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleApprove(u.id)}
                  disabled={actionLoading === u.id}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('approveAccount')}
                </button>
                <button
                  onClick={() => handleReject(u.id)}
                  disabled={actionLoading === u.id}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {t('reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
