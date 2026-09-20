import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, getDashboardUrl } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth Pages
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';

// Citizen Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { ReportProblem } from './pages/citizen/ReportProblem';
import { MyReports } from './pages/citizen/MyReports';
import { ProblemDetail } from './pages/citizen/ProblemDetail';

// Admin & Govt Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Institution (Faculty & Student)
import { InstitutionDashboard } from './pages/institution/InstitutionDashboard';

// Industry & CSR
import { IndustryDashboard } from './pages/industry/IndustryDashboard';

// Public
import { ImpactWall } from './pages/public/ImpactWall';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading SamasyaSetu...</p>
      </div>
    );
  }
  if (user) {
    return <Navigate to={getDashboardUrl(user)} replace />;
  }
  return <ImpactWall />;
}

export function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/impact-wall" element={<ImpactWall />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />

          {/* Auth Routes */}
          <Route path="/login" element={<AuthPage defaultTab="login" />} />
          <Route path="/register" element={<AuthPage defaultTab="register" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* Citizen Protected Routes */}
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/report"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <ReportProblem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/my-reports"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <MyReports />
              </ProtectedRoute>
            }
          />

          {/* Admin & Govt Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'govt_dept']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Institution (Faculty & Student) Routes */}
          <Route
            path="/institution/dashboard"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'student']}>
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          />

          {/* Industry & CSR Routes */}
          <Route
            path="/industry/dashboard"
            element={
              <ProtectedRoute allowedRoles={['industry']}>
                <IndustryDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
