import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Administrative Account Pending Approval</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Welcome, <span className="font-bold text-slate-800">{user?.name}</span>. Your registration for <span className="font-semibold text-emerald-800">{user?.org_name || 'Government / Administrative Department'}</span> has been successfully received.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 text-left space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Security Protocol
          </div>
          <p>
            To maintain governance integrity, all Government & Administrative credentials require secondary approval from an authorized State Super Administrator.
          </p>
          <p className="font-semibold text-slate-700">
            You will receive access as soon as your account is verified.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out & Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}
