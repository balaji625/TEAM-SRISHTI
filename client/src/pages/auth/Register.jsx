/**
 * Register page — CarePath AI
 *
 * Two tabs:
 *   Patient  — standard USER registration, direct dashboard access
 *   Hospital — HOSPITAL registration, then auto-submits an onboarding
 *              request to admin for approval. Hospital can log in
 *              immediately but stays PENDING until admin approves.
 *
 * Professionals and Experts are created only by the admin.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Eye, EyeOff, AlertCircle, CheckCircle, User, Building2,
} from 'lucide-react';
import { useAuth, ROLE_DASHBOARD } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Password strength hint ────────────────────────────────────────────────────
const PwdRule = ({ met, text }) => (
  <span className={`flex items-center gap-1 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
    <CheckCircle className="w-3 h-3" /> {text}
  </span>
);

// ── Shared input ──────────────────────────────────────────────────────────────
const Field = ({ label, optional, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT FORM
// ─────────────────────────────────────────────────────────────────────────────
const PatientForm = () => {
  const navigate     = useNavigate();
  const { register } = useAuth();

  const [form, setForm]         = useState({ name: '', email: '', password: '', phone: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');

  const pwd = form.password;
  const pwdRules = { length: pwd.length >= 8, uppercase: /[A-Z]/.test(pwd), number: /[0-9]/.test(pwd) };
  const pwdOk    = Object.values(pwdRules).every(Boolean);

  const handleChange = (e) => {
    setErrors({}); setApiError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name     = 'Name is required';
    if (!form.email.trim()) errs.email    = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!pwdOk)             errs.password = 'Password does not meet requirements';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setApiError('');
    try {
      const user = await register({
        name: form.name.trim(), email: form.email.trim(),
        password: form.password, role: 'USER',
        phone: form.phone?.trim() || undefined,
      });
      toast.success('Account created!');
      navigate(ROLE_DASHBOARD[user.role] ?? '/', { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors?.length) {
        const s = {}; data.errors.forEach(({ field, message }) => { s[field] = message; }); setErrors(s);
      } else { setApiError(data?.message || 'Registration failed. Please try again.'); }
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {apiError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{apiError}</span>
        </div>
      )}

      <Field label="Full Name" error={errors.name}>
        <input type="text" name="name" value={form.name} onChange={handleChange} autoComplete="name"
          className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="Your full name" />
      </Field>

      <Field label="Email address" error={errors.email}>
        <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email"
          className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="you@example.com" />
      </Field>

      <Field label="Phone" optional>
        <input type="tel" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+91 98765 43210" />
      </Field>

      <Field label="Password" error={errors.password}>
        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
            autoComplete="new-password"
            className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Min 8 chars, 1 uppercase, 1 number" />
          <button type="button" tabIndex={-1} onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.password && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <PwdRule met={pwdRules.length}    text="8+ characters" />
            <PwdRule met={pwdRules.uppercase} text="1 uppercase letter" />
            <PwdRule met={pwdRules.number}    text="1 number" />
          </div>
        )}
      </Field>

      <Button type="submit" className="w-full" loading={loading} disabled={!pwdOk && form.password.length > 0}>
        Create Patient Account
      </Button>
      <p className="text-center text-xs text-gray-500">By registering you agree to our terms of service.</p>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITAL FORM
// ─────────────────────────────────────────────────────────────────────────────
const HospitalForm = () => {
  const navigate     = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    hospitalName: '', contactName: '', email: '', password: '', phone: '', city: '', state: '', country: '',
  });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [done, setDone]         = useState(false);

  const pwd = form.password;
  const pwdRules = { length: pwd.length >= 8, uppercase: /[A-Z]/.test(pwd), number: /[0-9]/.test(pwd) };
  const pwdOk    = Object.values(pwdRules).every(Boolean);

  const handleChange = (e) => {
    setErrors({}); setApiError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.hospitalName.trim()) errs.hospitalName = 'Hospital name is required';
    if (!form.contactName.trim())  errs.contactName  = 'Contact name is required';
    if (!form.email.trim())        errs.email        = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!pwdOk)                    errs.password     = 'Password does not meet requirements';
    if (!form.city.trim())         errs.city         = 'City is required';
    if (!form.country.trim())      errs.country      = 'Country is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setApiError('');

    try {
      // 1. Create HOSPITAL user account
      const user = await register({
        name:     form.hospitalName.trim(),   // hospital name is the account name
        email:    form.email.trim(),
        password: form.password,
        role:     'HOSPITAL',
        phone:    form.phone?.trim() || undefined,
      });

      // 2. Auto-submit a registration request to admin
      //    We call the API directly with the token that register() just stored
      try {
        await api.post('/hospital/registration-request', {
          hospitalName: form.hospitalName.trim(),
          contactName:  form.contactName.trim(),
          city:         form.city.trim(),
          state:        form.state.trim() || undefined,
          country:      form.country.trim(),
          phone:        form.phone?.trim() || undefined,
          email:        form.email.trim(),
        });
      } catch {
        // Non-fatal: registration request failure doesn't block login
      }

      // 3. Show success screen (don't navigate to dashboard yet — show instructions)
      setDone(true);
      toast.success('Hospital registration submitted!');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors?.length) {
        const s = {}; data.errors.forEach(({ field, message }) => { s[field] = message; }); setErrors(s);
      } else { setApiError(data?.message || 'Registration failed. Please try again.'); }
    } finally { setLoading(false); }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Registration Submitted!</h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Your hospital registration request has been sent to the CarePath AI admin for review.
            You will be notified once your hospital is approved.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 text-left leading-relaxed">
          <strong>What happens next?</strong><br />
          1. Our admin team reviews your registration.<br />
          2. You'll receive approval or a message with next steps.<br />
          3. Once approved, your hospital becomes visible to patients.<br /><br />
          You can already log in to your hospital dashboard and set up your profile while waiting.
        </div>
        <button
          onClick={() => navigate(ROLE_DASHBOARD['HOSPITAL'], { replace: true })}
          className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Go to Hospital Dashboard →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {apiError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{apiError}</span>
        </div>
      )}

      {/* Hospital info */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital Information</p>

        <Field label="Hospital / Organisation Name" error={errors.hospitalName}>
          <input type="text" name="hospitalName" value={form.hospitalName} onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.hospitalName ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="City General Hospital" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City" error={errors.city}>
            <input type="text" name="city" value={form.city} onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.city ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Hyderabad" />
          </Field>
          <Field label="State" optional error={errors.state}>
            <input type="text" name="state" value={form.state} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Telangana" />
          </Field>
          <Field label="Country" error={errors.country}>
            <input type="text" name="country" value={form.country} onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.country ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="India" />
          </Field>
        </div>
      </div>

      {/* Account credentials */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact & Login Details</p>

        <Field label="Contact Person Name" error={errors.contactName}>
          <input type="text" name="contactName" value={form.contactName} onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.contactName ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Dr. Ravi Kumar" />
        </Field>

        <Field label="Official Email" error={errors.email}>
          <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="admin@yourhospital.com" />
        </Field>

        <Field label="Phone" optional>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="+91 40 1234 5678" />
        </Field>

        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
              autoComplete="new-password"
              className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Min 8 chars, 1 uppercase, 1 number" />
            <button type="button" tabIndex={-1} onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              <PwdRule met={pwdRules.length}    text="8+ characters" />
              <PwdRule met={pwdRules.uppercase} text="1 uppercase letter" />
              <PwdRule met={pwdRules.number}    text="1 number" />
            </div>
          )}
        </Field>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
        After registration, a request is automatically sent to our admin team. You can log in and prepare your
        hospital profile while your application is under review.
      </div>

      <Button type="submit" className="w-full" loading={loading}
        disabled={!pwdOk && form.password.length > 0}
        style={{ '--btn-bg': '#059669', '--btn-hover': '#047857' }}>
        Submit Hospital Registration
      </Button>
      <p className="text-center text-xs text-gray-500">By registering you agree to our terms of service.</p>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN REGISTER PAGE
// ─────────────────────────────────────────────────────────────────────────────
const Register = () => {
  const [tab, setTab] = useState('patient');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600">
              <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-xl font-bold text-gray-900">
              CarePath <span className="text-blue-600">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-600 mt-1">Join the CarePath AI healthcare platform</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 mb-6">
          <button
            onClick={() => setTab('patient')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === 'patient'
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" /> Patient
          </button>
          <button
            onClick={() => setTab('hospital')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === 'hospital'
                ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" /> Hospital
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {tab === 'patient' ? <PatientForm /> : <HospitalForm />}
        </div>

        {/* Info box for professionals / experts */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 text-center leading-relaxed">
          <strong>Healthcare Professional or Expert?</strong><br />
          Professional and Expert accounts are created by our admin team.
          Please <Link to="/contact" className="underline font-medium">contact us</Link> to get onboarded.
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
