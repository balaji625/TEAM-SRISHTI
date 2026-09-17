/**
 * AdminProfessionals — CarePath AI
 *
 * Admin: list all professionals, filter by status, approve/reject.
 * Admin can also directly create a new Doctor (PROFESSIONAL) account
 * (sets name, email, password, specialization, etc.) — pre-verified.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope, Search, RefreshCw, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, Plus, Eye, EyeOff, X,
} from 'lucide-react';
import { fetchProfessionals, verifyProfessional, createDoctor } from '../../services/adminService';

// ── Status badge colours ──────────────────────────────────────────────────────
const statusColor = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  SUSPENDED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const CONSULTATION_MODES = ['IN_PERSON', 'VIDEO', 'PHONE', 'CHAT'];

// ── Shared form helpers ───────────────────────────────────────────────────────
const Field = ({ label, required, children, error }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent ${className}`}
    {...props}
  />
);

// ── Add Doctor Modal ──────────────────────────────────────────────────────────
const AddDoctorModal = ({ onClose, onCreated }) => {
  const EMPTY = {
    name: '', email: '', password: '', phone: '',
    specialization: '', qualification: '', experience: '',
    licenseNumber: '', bio: '', consultationModes: [],
  };
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving]     = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const set = (field) => (e) => {
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    setApiError('');
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleMode = (mode) => {
    setForm((prev) => ({
      ...prev,
      consultationModes: prev.consultationModes.includes(mode)
        ? prev.consultationModes.filter((m) => m !== mode)
        : [...prev.consultationModes, mode],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())           errs.name           = 'Name is required';
    if (!form.email.trim())          errs.email          = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password)              errs.password       = 'Password is required';
    else if (form.password.length < 8) errs.password     = 'At least 8 characters';
    if (!form.specialization.trim()) errs.specialization = 'Specialization is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      const res = await createDoctor({
        name:              form.name.trim(),
        email:             form.email.trim(),
        password:          form.password,
        phone:             form.phone.trim() || undefined,
        specialization:    form.specialization.trim(),
        qualification:     form.qualification.trim() || undefined,
        experience:        form.experience !== '' ? Number(form.experience) : undefined,
        licenseNumber:     form.licenseNumber.trim() || undefined,
        bio:               form.bio.trim() || undefined,
        consultationModes: form.consultationModes,
      });
      onCreated(res.data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create doctor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Healthcare Professional</h2>
            <p className="text-xs text-gray-500 mt-0.5">Account will be created and immediately verified.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">

            {apiError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {apiError}
              </div>
            )}

            {/* ── Account credentials ── */}
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-3">Account Credentials</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.name}>
                  <Input value={form.name} onChange={set('name')} placeholder="Dr. Ravi Kumar" autoComplete="off" />
                </Field>
                <Field label="Email Address" required error={errors.email}>
                  <Input type="email" value={form.email} onChange={set('email')} placeholder="doctor@hospital.com" autoComplete="off" />
                </Field>
                <Field label="Password" required error={errors.password}>
                  <div className="relative">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password} onChange={set('password')}
                      placeholder="Min 8 characters"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Phone Number">
                  <Input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
                </Field>
              </div>
            </div>

            {/* ── Professional profile ── */}
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-3">Professional Profile</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Specialization" required error={errors.specialization}>
                  <Input value={form.specialization} onChange={set('specialization')} placeholder="e.g. Cardiology, Pediatrics" />
                </Field>
                <Field label="Highest Qualification">
                  <Input value={form.qualification} onChange={set('qualification')} placeholder="e.g. MBBS, MD, MS" />
                </Field>
                <Field label="Years of Experience">
                  <Input type="number" min="0" max="60" value={form.experience} onChange={set('experience')} placeholder="0" />
                </Field>
                <Field label="License / Registration Number">
                  <Input value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="e.g. MCI-12345" />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Biography / About">
                  <textarea
                    value={form.bio} onChange={(e) => { setApiError(''); setForm((p) => ({ ...p, bio: e.target.value })); }}
                    rows={3}
                    placeholder="Brief professional background and areas of expertise..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                  />
                </Field>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Consultation Modes</label>
                <div className="flex flex-wrap gap-2">
                  {CONSULTATION_MODES.map((mode) => (
                    <button type="button" key={mode} onClick={() => toggleMode(mode)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        form.consultationModes.includes(mode)
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                      }`}>
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pre-verified notice */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>This doctor account will be created with <strong>VERIFIED</strong> status — they can log in and accept appointments immediately.</span>
            </div>
          </div>

          {/* Modal footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Create Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Reject reason modal ───────────────────────────────────────────────────────
const RejectModal = ({ profId, onCancel, onConfirm, busy }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Reject Professional</h3>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(profId, 'reject', reason)} disabled={busy}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminProfessionals = () => {
  const [items, setItems]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [statusF, setStatusF]       = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [busyId, setBusyId]         = useState(null);
  const [rejectTarget, setReject]   = useState(null);
  const [showAddModal, setShowAdd]  = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: 20 };
      if (search)  params.search = search;
      if (statusF) params.status = statusF;
      const res = await fetchProfessionals(params);
      setItems(res.data.professionals || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load professionals');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusF]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id, action, reasonText) => {
    setBusyId(id);
    try {
      await verifyProfessional(id, action, reasonText);
      setItems((prev) => prev.map((p) =>
        p._id === id ? { ...p, verificationStatus: action === 'approve' ? 'VERIFIED' : 'REJECTED' } : p
      ));
      setReject(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreated = (data) => {
    setShowAdd(false);
    setSuccessMsg(`Doctor "${data.user?.name}" created successfully. They can log in with their email and password.`);
    setTimeout(() => setSuccessMsg(''), 6000);
    load();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Healthcare Professionals</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total professionals</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg px-3 py-1.5 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Doctor
          </button>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, specialization…"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 w-64" />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700">Search</button>
        </form>
        <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400">
          <option value="">All Statuses</option>
          {['PENDING','VERIFIED','REJECTED','SUSPENDED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Professionals table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-rose-500 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Stethoscope className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No professionals found</p>
            <button onClick={() => setShowAdd(true)}
              className="mt-3 text-xs text-rose-600 underline font-medium">Add the first doctor</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Specialization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Exp.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-indigo-600">{p.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      {p.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{p.specialization}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{p.experience != null ? `${p.experience} yrs` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[p.verificationStatus] || statusColor.PENDING}`}>
                      {p.verificationStatus === 'PENDING'  && <Clock className="w-3 h-3" />}
                      {p.verificationStatus === 'VERIFIED' && <CheckCircle className="w-3 h-3" />}
                      {p.verificationStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                      {p.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.verificationStatus === 'PENDING' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button disabled={busyId === p._id} onClick={() => handleVerify(p._id, 'approve')}
                          className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md font-medium disabled:opacity-50">
                          {busyId === p._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                        </button>
                        <button onClick={() => setReject(p._id)}
                          className="flex items-center gap-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-md font-medium">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                    {p.verificationStatus === 'VERIFIED' && (
                      <span className="text-xs text-gray-400 italic">Verified</span>
                    )}
                    {p.verificationStatus === 'REJECTED' && (
                      <button disabled={busyId === p._id} onClick={() => handleVerify(p._id, 'approve')}
                        className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md font-medium disabled:opacity-50">
                        Re-approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Add Doctor modal */}
      {showAddModal && (
        <AddDoctorModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          profId={rejectTarget}
          onCancel={() => setReject(null)}
          onConfirm={handleVerify}
          busy={busyId === rejectTarget}
        />
      )}
    </div>
  );
};

export default AdminProfessionals;
