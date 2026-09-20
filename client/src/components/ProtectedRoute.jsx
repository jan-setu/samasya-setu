import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardUrl } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Restoring session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if admin/govt user is unverified
  if ((user.role === 'admin' || user.role === 'govt_dept') && !user.is_verified) {
    if (location.pathname !== '/pending-approval') {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  // If specific roles are required, verify access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect user to their own authorized dashboard
    const homeUrl = getDashboardUrl(user);
    return <Navigate to={homeUrl} replace />;
  }

  return children;
}
