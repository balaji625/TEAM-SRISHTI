/**
 * AdminLogin — CarePath AI
 *
 * 2-Step admin login:
 *   Step 1 — local if-check: email + password must match hardcoded values
 *   Step 2 — local if-check: co-founder name must be "VSLS"
 *             then calls login() API to set auth token + user in context
 *             then navigates to /admin/dashboard
 *
 * Fields start empty. No defaults shown.
 * Route: /admin/login  (public, no auth required)
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Heart, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Hardcoded Step-1 credentials ─────────────────────────────────────────────
const ADMIN_EMAIL    = 'bathalabalji50@gmail.com';
const ADMIN_PASSWORD = 'IBM01Balaji';

// ── Step-2 co-founder key ─────────────────────────────────────────────────────
const CO_FOUNDER_KEY = 'VSLS';

const AdminLogin = () => {
  const navigate    = useNavigate();
  const { login }   = useAuth();

  // Step 1
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Step 2
  const [step, setStep]           = useState(1);
  const [coFounder, setCoFounder] = useState('');
  const [cfError, setCfError]     = useState('');
  const [cfLoading, setCfLoading] = useState(false);

  // ── Step 1: local credential check only ──────────────────────────────────────
  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Please enter your admin email and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (
        form.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
        form.password === ADMIN_PASSWORD
      ) {
        setStep(2);
      } else {
        setError('Invalid email or password. Access denied.');
      }
      setLoading(false);
    }, 400);
  };

  // ── Step 2: local co-founder check → then real login() to get token ───────────
  const handleStep2 = async (e) => {
    e.preventDefault();
    setCfError('');

    if (!coFounder.trim()) {
      setCfError('Please enter the co-founder verification name.');
      return;
    }

    if (coFounder.trim() !== CO_FOUNDER_KEY) {
      setCfError('Incorrect co-founder name. Access denied.');
      return;
    }

    // Both checks passed — now do the real API login to establish the auth session
    setCfLoading(true);
    try {
      const user = await login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
      if (user.role !== 'ADMIN') {
        setCfError('Access denied. Account is not an admin.');
        setCfLoading(false);
        return;
      }
      toast.success(`Welcome, ${user.name}. Admin Dashboard loaded.`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      // Backend not available or account not seeded — show helpful message
      const msg = err?.response?.data?.message || 'Login failed. Ensure the admin account exists in the database.';
      setCfError(msg);
      setCfLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-600">
              <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-xl font-bold text-gray-900">
              CarePath <span className="text-rose-600">AI</span>
            </span>
          </Link>

          {/* Icon changes per step */}
          <div className="flex items-center justify-center mb-4">
            <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 border-2 border-rose-200">
              {step === 1
                ? <ShieldCheck className="w-8 h-8 text-rose-600" strokeWidth={2} />
                : <KeyRound    className="w-8 h-8 text-rose-600" strokeWidth={2} />
              }
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Platform Admin Access' : 'Co-Founder Verification'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1
              ? 'Restricted to CarePath AI Founder & Administrators'
              : 'Step 2 of 2 — Enter the co-founder name to proceed'
            }
          </p>

          {/* Step pills */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
              step >= 1 ? 'bg-rose-600 border-rose-600 text-white' : 'border-gray-300 text-gray-400'
            }`}>1</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
              step >= 2 ? 'bg-rose-600 border-rose-600 text-white' : 'border-gray-300 text-gray-400'
            }`}>2</span>
          </div>
        </div>

        {/* ── STEP 1 ───────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-8">
            <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Restricted access area. Only authorised platform administrators may proceed.
                Unauthorised access attempts are logged.
              </span>
            </div>

            {error && (
              <div className="flex items-start gap-2 mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleStep1} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setError(''); setForm((p) => ({ ...p, email: e.target.value })); }}
                  autoComplete="email"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Enter admin email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { setError(''); setForm((p) => ({ ...p, password: e.target.value })); }}
                    autoComplete="current-password"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPwd((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm"
              >
                {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Verifying…' : 'Continue to Step 2'}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 2 ───────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-8">
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
              <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Credentials verified ✓ — Enter the co-founder verification name to unlock the Admin Panel.
              </span>
            </div>

            {cfError && (
              <div className="flex items-start gap-2 mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{cfError}</span>
              </div>
            )}

            <form onSubmit={handleStep2} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Co-Founder Verification Name
                </label>
                <input
                  type="text"
                  value={coFounder}
                  onChange={(e) => { setCfError(''); setCoFounder(e.target.value); }}
                  autoComplete="off"
                  autoFocus
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent tracking-widest font-mono"
                  placeholder="Enter verification name"
                  maxLength={20}
                />
                <p className="text-xs text-gray-400 mt-1">Case-sensitive. Enter exactly as registered.</p>
              </div>

              <button
                type="submit"
                disabled={cfLoading}
                className="w-full inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm"
              >
                {cfLoading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {cfLoading ? 'Unlocking…' : 'Access Admin Panel'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setCoFounder(''); setCfError(''); }}
                className="w-full text-sm text-gray-500 hover:text-rose-600 transition-colors pt-1"
              >
                ← Back to Step 1
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Not an admin?{' '}
          <Link to="/login" className="text-rose-600 font-medium hover:underline">
            Go to standard login
          </Link>
        </p>

      </div>
    </div>
  );
};

export default AdminLogin;
