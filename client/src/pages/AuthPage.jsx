import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { JHARKHAND_DISTRICTS } from '../utils/districts';
import {
  Lock,
  Mail,
  Phone,
  User,
  Building,
  GraduationCap,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe2
} from 'lucide-react';

export function AuthPage({ defaultTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regRole, setRegRole] = useState('citizen');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regOrgType, setRegOrgType] = useState('university');
  const [regDistrict, setRegDistrict] = useState('Ranchi');
  const [regDepartment, setRegDepartment] = useState('');
  const [regUniversityName, setRegUniversityName] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(loginIdentifier, loginPassword);
      const from = location.state?.from?.pathname || result.redirectUrl;
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        role: regRole,
        orgName: regOrgName,
        orgType: regOrgType,
        district: regDistrict,
        department: regDepartment,
        universityName: regUniversityName
      });

      if (result.user?.pendingApproval || (regRole === 'admin' || regRole === 'govt_dept')) {
        setSuccessMsg('Registration submitted! Since this is an Administrative/Government account, it is pending verification.');
        setTimeout(() => navigate('/pending-approval'), 1500);
      } else {
        navigate(result.redirectUrl, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email) => {
    setError('');
    setLoading(true);
    try {
      const result = await login(email, 'Password123!');
      navigate(result.redirectUrl, { replace: true });
    } catch (err) {
      setError('Demo login failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* 1-Click Demo Login Banner */}
      <div className="max-w-xl mx-auto w-full px-4 mb-6">
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border border-amber-500/40 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>SIH Quick Access (1-Click Login):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleDemoLogin('citizen@samsyasetu.in')}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-center transition-all"
            >
              1. Citizen
            </button>
            <button
              onClick={() => handleDemoLogin('admin@samsyasetu.in')}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-center transition-all"
            >
              2. State Admin
            </button>
            <button
              onClick={() => handleDemoLogin('dept.water@jharkhand.gov.in')}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-center transition-all"
            >
              3. Govt Dept
            </button>
            <button
              onClick={() => handleDemoLogin('prof.sharma@bitmesra.ac.in')}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-center transition-all"
            >
              4. Faculty (HEI)
            </button>
            <button
              onClick={() => handleDemoLogin('student.ananya@iitism.ac.in')}
              className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-center transition-all"
            >
              5. Student
            </button>
            <button
              onClick={() => handleDemoLogin('csr.lead@tatasteel.com')}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-center transition-all"
            >
              6. Industry/CSR
            </button>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-900/50 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-10 h-10">
              <path d="M15 70 C 35 35, 65 35, 85 70" stroke="#FBBF24" strokeWidth="9" strokeLinecap="round"/>
              <line x1="32" y1="52" x2="32" y2="70" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round"/>
              <line x1="50" y1="44" x2="50" y2="70" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round"/>
              <line x1="68" y1="52" x2="68" y2="70" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round"/>
              <circle cx="50" cy="24" r="10" fill="#FFFFFF"/>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
            {t('platformTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-300 font-medium">
            {t('platformSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-slate-100 p-1.5 border-b border-slate-200">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`py-2.5 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('signInTab')}
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`py-2.5 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('createAccountTab')}
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('emailOrPhone')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="citizen@samsyasetu.in or phone"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t('password')}
                    </label>
                    <Link to="/forgot-password" tabIndex={-1} className="text-xs text-emerald-700 hover:underline font-semibold">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{t('signInButton')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('registeringAs')}
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="block w-full py-2.5 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="citizen">Citizen / Community (PRI/ULB)</option>
                    <option value="govt_dept">Government Department</option>
                    <option value="admin">State Administrative Officer</option>
                    <option value="faculty">University Faculty</option>
                    <option value="student">University Student</option>
                    <option value="industry">Industry / Startup / MSME / CSR</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t('fullName')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Sunita Devi"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t('phoneNumber')}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('emailAddress')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.edu.in"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {regRole !== 'citizen' && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      Organization Credentials
                    </div>

                    {(regRole === 'faculty' || regRole === 'student') ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">University</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. BIT Mesra"
                            value={regUniversityName}
                            onChange={(e) => setRegUniversityName(e.target.value)}
                            className="w-full py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Department</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Civil Engineering"
                            value={regDepartment}
                            onChange={(e) => setRegDepartment(e.target.value)}
                            className="w-full py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Organization Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tata Steel Foundation"
                            value={regOrgName}
                            onChange={(e) => setRegOrgName(e.target.value)}
                            className="w-full py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Organization Type</label>
                          <select
                            value={regOrgType}
                            onChange={(e) => setRegOrgType(e.target.value)}
                            className="w-full py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="industry">Industry</option>
                            <option value="startup">Startup</option>
                            <option value="msme">MSME</option>
                            <option value="csr">CSR Organization</option>
                            <option value="research_lab">Research Lab</option>
                            <option value="govt_dept">Government Department</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('districtLabel')}</label>
                      <select
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        className="w-full py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        {JHARKHAND_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t('password')}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t('confirmPassword')}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="block w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{t('completeRegistration')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
