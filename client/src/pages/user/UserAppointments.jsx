/**
 * UserAppointments — CarePath AI
 *
 * THREE completely separate appointment flows:
 *  A. HSPL Appointment  — Hospital + Professional (existing, unchanged)
 *  B. Expert Appointment — Direct Expert booking (new separate flow)
 *  C. Professional Appointment — Direct Professional booking (new separate flow)
 *
 * HSPL flow is untouched. Expert and Professional flows are brand new.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, Clock, AlertCircle,
  Loader2, RefreshCw, Building2, Stethoscope, X, UserCheck,
} from 'lucide-react';
import {
  fetchAppointments, bookAppointment, cancelAppointment,
  searchHospitals, searchProfessionals,
  fetchProfessionalSlots, fetchExpertSlots,
  fetchExpertAppointments, bookExpertAppointment,
  fetchProfessionalAppointments, bookProfessionalAppointment,
  searchExperts,
} from '../../services/userService';

const STATUS_COLORS = {
  PENDING:     'text-amber-700 bg-amber-50 border-amber-200',
  CONFIRMED:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  COMPLETED:   'text-blue-700 bg-blue-50 border-blue-200',
  CANCELLED:   'text-gray-600 bg-gray-50 border-gray-200',
  REJECTED:    'text-red-700 bg-red-50 border-red-200',
  RESCHEDULED: 'text-purple-700 bg-purple-50 border-purple-200',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] || STATUS_COLORS.PENDING}`}>
    {status?.charAt(0) + status?.slice(1).toLowerCase()}
  </span>
);

const CONSULTATION_TYPES = [
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'VIDEO',     label: 'Video Call' },
  { value: 'PHONE',     label: 'Phone Call' },
  { value: 'CHAT',      label: 'Chat' },
];

// ── Dynamic Slot Picker ───────────────────────────────────────────────────────
const SlotPicker = ({ providerId, providerType, date, selectedTime, onSelectTime }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadSlots = useCallback(async () => {
    if (!providerId || !date) { setSlots([]); setMessage(null); return; }
    setLoading(true); setError(null); setMessage(null);
    try {
      const fn = providerType === 'expert' ? fetchExpertSlots : fetchProfessionalSlots;
      const res = await fn(providerId, date);
      if (res.data?.available === false) {
        setMessage(res.data?.message || 'Not available on this date');
        setSlots([]);
      } else {
        setSlots(res.data?.slots || []);
        if (!(res.data?.slots || []).some((s) => s.available)) {
          setMessage('No slots available for this date. Please choose another date.');
        }
      }
    } catch {
      setError('Could not load availability. You may enter a time manually.');
      setSlots([]);
    } finally { setLoading(false); }
  }, [providerId, providerType, date]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  if (!providerId || !date) return null;
  if (loading) return <div className="flex items-center gap-2 text-xs text-gray-500 mt-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading available slots…</div>;
  if (error) return <p className="text-xs text-amber-600 mt-1">{error}</p>;
  if (message) return <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">{message}</div>;
  if (slots.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500 mb-2">Available slots — select one:</p>
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
        {slots.map(({ time, available }) => (
          <button key={time} type="button" disabled={!available} onClick={() => available && onSelectTime(time)}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${selectedTime === time ? 'bg-blue-600 text-white border-blue-600' : available ? 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'}`}>
            {available ? '✅' : '❌'} {time}
          </button>
        ))}
      </div>
      <button type="button" onClick={loadSlots} className="text-xs text-gray-400 hover:text-gray-600 mt-1.5 flex items-center gap-1">
        <RefreshCw className="w-3 h-3" /> Refresh slots
      </button>
    </div>
  );
};

// ── A. HSPL Book Modal (existing, unchanged) ──────────────────────────────────
const HSPLBookModal = ({ onClose, onBooked }) => {
  const [form, setForm] = useState({ date: '', time: '', reason: '', consultationType: 'IN_PERSON', hospitalId: '', professionalId: '', notes: '' });
  const [hospitals, setHospitals]         = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    setLoadingHospitals(true);
    searchHospitals({ limit: 100 }).then((r) => setHospitals(r.data?.hospitals || [])).catch(() => {}).finally(() => setLoadingHospitals(false));
  }, []);

  useEffect(() => {
    if (!form.hospitalId) { setProfessionals([]); return; }
    setLoadingProfessionals(true);
    searchProfessionals({ hospitalId: form.hospitalId, limit: 100 })
      .then((r) => setProfessionals(r.data?.professionals || []))
      .catch(() => setProfessionals([]))
      .finally(() => setLoadingProfessionals(false));
  }, [form.hospitalId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospitalId) { setError('Hospital selection is required'); return; }
    if (!form.professionalId) { setError('Doctor/Professional selection is required'); return; }
    setSaving(true); setError(null);
    try {
      await bookAppointment({ date: form.date, time: form.time, reason: form.reason, consultationType: form.consultationType, notes: form.notes || undefined, hospitalId: form.hospitalId, professionalId: form.professionalId });
      onBooked();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Book HSPL Appointment</h2>
            <p className="text-xs text-gray-400 mt-0.5">Hospital + Professional required</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hospital <span className="text-red-500">*</span></label>
            {loadingHospitals ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</div>
            ) : (
              <select required value={form.hospitalId} onChange={(e) => setForm((f) => ({ ...f, hospitalId: e.target.value, professionalId: '', time: '' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select hospital —</option>
                {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}{h.city ? ` — ${h.city}` : ''}{h.emergencyAvailable ? ' 🚨' : ''}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Doctor / Professional <span className="text-red-500">*</span></label>
            {!form.hospitalId ? (
              <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-400 flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> Select a hospital first</div>
            ) : loadingProfessionals ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</div>
            ) : professionals.length === 0 ? (
              <div className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2.5 text-sm text-amber-700">No verified professionals associated with this hospital.</div>
            ) : (
              <select required value={form.professionalId} onChange={(e) => setForm((f) => ({ ...f, professionalId: e.target.value, time: '' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select professional —</option>
                {professionals.map((p) => <option key={p._id} value={p._id}>{p.name} — {p.specialization}{p.experience ? ` (${p.experience}yr)` : ''}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" required value={form.date} onChange={(e) => { set('date', e.target.value); set('time', ''); }} min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
              <input type="time" required value={form.time} onChange={(e) => set('time', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {form.professionalId && form.date && (
            <SlotPicker providerId={form.professionalId} providerType="professional" date={form.date} selectedTime={form.time} onSelectTime={(t) => set('time', t)} />
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea required rows={2} value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Describe your reason for the appointment..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Consultation Type</label>
            <select value={form.consultationType} onChange={(e) => set('consultationType', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CONSULTATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any additional information..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── B. Expert Book Modal (separate, no hospital) ──────────────────────────────
const ExpertBookModal = ({ onClose, onBooked }) => {
  const [form, setForm] = useState({ date: '', time: '', reason: '', consultationType: 'VIDEO', expertId: '', notes: '' });
  const [experts, setExperts]   = useState([]);
  const [loadingExperts, setLoadingExperts] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoadingExperts(true);
    searchExperts({ limit: 100, status: 'VERIFIED' })
      .then((r) => setExperts(r.data?.experts || []))
      .catch(() => {})
      .finally(() => setLoadingExperts(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.expertId) { setError('Expert selection is required'); return; }
    setSaving(true); setError(null);
    try {
      await bookExpertAppointment({ date: form.date, time: form.time, reason: form.reason, consultationType: form.consultationType, expertId: form.expertId, notes: form.notes || undefined });
      onBooked();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book expert appointment');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Book Expert Consultation</h2>
            <p className="text-xs text-gray-400 mt-0.5">Direct consultation with an independent expert</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expert <span className="text-red-500">*</span></label>
            {loadingExperts ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading experts…</div>
            ) : experts.length === 0 ? (
              <div className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2.5 text-sm text-amber-700">No verified experts available at this time.</div>
            ) : (
              <select required value={form.expertId} onChange={(e) => setForm((f) => ({ ...f, expertId: e.target.value, time: '' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">— Select expert —</option>
                {experts.map((ex) => <option key={ex._id} value={ex._id}>{ex.name} — {ex.specialization}{ex.experience ? ` (${ex.experience}yr)` : ''}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" required value={form.date} onChange={(e) => { set('date', e.target.value); set('time', ''); }} min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
              <input type="time" required value={form.time} onChange={(e) => set('time', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          {form.expertId && form.date && (
            <SlotPicker providerId={form.expertId} providerType="expert" date={form.date} selectedTime={form.time} onSelectTime={(t) => set('time', t)} />
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea required rows={2} value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Describe what you need consultation for..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Consultation Type</label>
            <select value={form.consultationType} onChange={(e) => set('consultationType', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {CONSULTATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any additional information..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              Book Consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── C. Professional (Direct) Book Modal (separate, no hospital) ───────────────
const ProfessionalBookModal = ({ onClose, onBooked }) => {
  const [form, setForm] = useState({ date: '', time: '', reason: '', consultationType: 'IN_PERSON', professionalId: '', notes: '' });
  const [professionals, setProfessionals] = useState([]);
  const [loadingProfs, setLoadingProfs]   = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    setLoadingProfs(true);
    searchProfessionals({ limit: 100, status: 'VERIFIED' })
      .then((r) => setProfessionals(r.data?.professionals || []))
      .catch(() => {})
      .finally(() => setLoadingProfs(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.professionalId) { setError('Professional selection is required'); return; }
    setSaving(true); setError(null);
    try {
      await bookProfessionalAppointment({ date: form.date, time: form.time, reason: form.reason, consultationType: form.consultationType, professionalId: form.professionalId, notes: form.notes || undefined });
      onBooked();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Book Individual Professional</h2>
            <p className="text-xs text-gray-400 mt-0.5">Direct appointment with a healthcare professional</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Professional <span className="text-red-500">*</span></label>
            {loadingProfs ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading professionals…</div>
            ) : professionals.length === 0 ? (
              <div className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2.5 text-sm text-amber-700">No verified professionals available at this time.</div>
            ) : (
              <select required value={form.professionalId} onChange={(e) => setForm((f) => ({ ...f, professionalId: e.target.value, time: '' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Select professional —</option>
                {professionals.map((p) => <option key={p._id} value={p._id}>{p.name} — {p.specialization}{p.experience ? ` (${p.experience}yr)` : ''}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" required value={form.date} onChange={(e) => { set('date', e.target.value); set('time', ''); }} min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
              <input type="time" required value={form.time} onChange={(e) => set('time', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {form.professionalId && form.date && (
            <SlotPicker providerId={form.professionalId} providerType="professional" date={form.date} selectedTime={form.time} onSelectTime={(t) => set('time', t)} />
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea required rows={2} value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Describe your reason for the appointment..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Consultation Type</label>
            <select value={form.consultationType} onChange={(e) => set('consultationType', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {CONSULTATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any additional information..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Appointment Card ──────────────────────────────────────────────────────────
const AppointmentCard = ({ appt, onCancel, type }) => {
  const date = new Date(appt.date);
  const isPast = date < new Date();
  const canCancel = ['PENDING', 'CONFIRMED'].includes(appt.status);

  const accent = type === 'expert' ? 'bg-violet-50' : type === 'professional' ? 'bg-indigo-50' : 'bg-blue-50';
  const iconColor = type === 'expert' ? 'text-violet-600' : type === 'professional' ? 'text-indigo-600' : 'text-blue-600';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center shrink-0`}>
            <Calendar className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {appt.time}
              {appt.consultationType && <span className="ml-2 text-gray-400">· {appt.consultationType.replace('_', ' ')}</span>}
            </p>
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{appt.reason}</p>

      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {appt.hospitalId && (
          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {appt.hospitalId.name}</span>
        )}
        {appt.professionalId && (
          <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {appt.professionalId.name}</span>
        )}
        {appt.expertId && (
          <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {appt.expertId.name}</span>
        )}
      </div>

      {canCancel && !isPast && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button onClick={() => onCancel(appt._id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Cancel appointment</button>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const UserAppointments = () => {
  // Tab state: 'hspl' | 'expert' | 'professional'
  const [activeTab, setActiveTab]  = useState('hspl');

  // HSPL appointments
  const [hsplAppts, setHsplAppts] = useState([]);
  const [hsplTotal, setHsplTotal] = useState(0);
  const [hsplLoading, setHsplLoading] = useState(true);
  const [hsplError, setHsplError] = useState(null);
  const [hsplStatusFilter, setHsplStatusFilter] = useState('');
  const [showHsplBook, setShowHsplBook] = useState(false);

  // Expert appointments
  const [expertAppts, setExpertAppts] = useState([]);
  const [expertTotal, setExpertTotal] = useState(0);
  const [expertLoading, setExpertLoading] = useState(false);
  const [expertError, setExpertError] = useState(null);
  const [expertStatusFilter, setExpertStatusFilter] = useState('');
  const [showExpertBook, setShowExpertBook] = useState(false);

  // Professional (direct) appointments
  const [profAppts, setProfAppts] = useState([]);
  const [profTotal, setProfTotal] = useState(0);
  const [profLoading, setProfLoading] = useState(false);
  const [profError, setProfError] = useState(null);
  const [profStatusFilter, setProfStatusFilter] = useState('');
  const [showProfBook, setShowProfBook] = useState(false);

  const loadHspl = async () => {
    setHsplLoading(true); setHsplError(null);
    try {
      const params = hsplStatusFilter ? { status: hsplStatusFilter } : {};
      const res = await fetchAppointments(params);
      setHsplAppts(res.data?.appointments || []);
      setHsplTotal(res.data?.total || 0);
    } catch (err) {
      setHsplError(err.response?.data?.message || 'Failed to load appointments');
    } finally { setHsplLoading(false); }
  };

  const loadExpert = async () => {
    setExpertLoading(true); setExpertError(null);
    try {
      const params = expertStatusFilter ? { status: expertStatusFilter } : {};
      const res = await fetchExpertAppointments(params);
      setExpertAppts(res.data?.appointments || []);
      setExpertTotal(res.data?.total || 0);
    } catch (err) {
      setExpertError(err.response?.data?.message || 'Failed to load expert appointments');
    } finally { setExpertLoading(false); }
  };

  const loadProf = async () => {
    setProfLoading(true); setProfError(null);
    try {
      const params = profStatusFilter ? { status: profStatusFilter } : {};
      const res = await fetchProfessionalAppointments(params);
      setProfAppts(res.data?.appointments || []);
      setProfTotal(res.data?.total || 0);
    } catch (err) {
      setProfError(err.response?.data?.message || 'Failed to load professional appointments');
    } finally { setProfLoading(false); }
  };

  useEffect(() => { loadHspl(); }, [hsplStatusFilter]);
  useEffect(() => { if (activeTab === 'expert') loadExpert(); }, [activeTab, expertStatusFilter]);
  useEffect(() => { if (activeTab === 'professional') loadProf(); }, [activeTab, profStatusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(id, '');
      if (activeTab === 'hspl') loadHspl();
      else if (activeTab === 'expert') loadExpert();
      else loadProf();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const STATUS_FILTERS = ['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

  const TabBtn = ({ tab, label, count, color }) => (
    <button onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeTab === tab ? `${color} border-current` : 'text-gray-600 bg-white border-gray-200 hover:border-gray-300'}`}>
      {label}
      {count > 0 && <span className="text-xs bg-current/10 px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your upcoming and past appointments across all types.</p>
        </div>
      </div>

      {/* ── Tab Selector ── */}
      <div className="flex flex-wrap gap-2">
        <TabBtn tab="hspl" label="🏥 Hospital (HSPL)" count={hsplTotal} color="text-blue-600 bg-blue-50" />
        <TabBtn tab="expert" label="👨‍⚕️ Expert" count={expertTotal} color="text-violet-600 bg-violet-50" />
        <TabBtn tab="professional" label="🩺 Individual Professional" count={profTotal} color="text-indigo-600 bg-indigo-50" />
      </div>

      {/* ── A: HSPL Tab ── */}
      {activeTab === 'hspl' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800">
            <strong>HSPL Appointment</strong> — Book through a hospital. Select a hospital, then a doctor from that hospital.
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button key={s} onClick={() => setHsplStatusFilter(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${hsplStatusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {s || 'All'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={loadHspl} className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700"><RefreshCw className="w-3.5 h-3.5" /></button>
              <button onClick={() => setShowHsplBook(true)} className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> Book</button>
            </div>
          </div>
          {hsplError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {hsplError}</div>}
          {hsplLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : hsplAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl">
              <Building2 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-700">No HSPL appointments</p>
              <button onClick={() => setShowHsplBook(true)} className="mt-3 text-sm text-blue-600 underline font-medium">Book a hospital appointment</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hsplAppts.map((a) => <AppointmentCard key={a._id} appt={a} onCancel={handleCancel} type="hspl" />)}
            </div>
          )}
        </div>
      )}

      {/* ── B: Expert Tab ── */}
      {activeTab === 'expert' && (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-xs text-violet-800">
            <strong>Expert Consultation</strong> — Book directly with an independent expert. No hospital required.
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button key={s} onClick={() => setExpertStatusFilter(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${expertStatusFilter === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {s || 'All'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={loadExpert} className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700"><RefreshCw className="w-3.5 h-3.5" /></button>
              <button onClick={() => setShowExpertBook(true)} className="flex items-center gap-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> Book Expert</button>
            </div>
          </div>
          {expertError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {expertError}</div>}
          {expertLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
          ) : expertAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl">
              <UserCheck className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-700">No expert consultations</p>
              <button onClick={() => setShowExpertBook(true)} className="mt-3 text-sm text-violet-600 underline font-medium">Book an expert consultation</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {expertAppts.map((a) => <AppointmentCard key={a._id} appt={a} onCancel={handleCancel} type="expert" />)}
            </div>
          )}
        </div>
      )}

      {/* ── C: Individual Professional Tab ── */}
      {activeTab === 'professional' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-xs text-indigo-800">
            <strong>Individual Professional</strong> — Book directly with a verified professional. No hospital required.
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button key={s} onClick={() => setProfStatusFilter(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${profStatusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {s || 'All'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={loadProf} className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700"><RefreshCw className="w-3.5 h-3.5" /></button>
              <button onClick={() => setShowProfBook(true)} className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> Book Professional</button>
            </div>
          </div>
          {profError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {profError}</div>}
          {profLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
          ) : profAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl">
              <Stethoscope className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-700">No direct professional appointments</p>
              <button onClick={() => setShowProfBook(true)} className="mt-3 text-sm text-indigo-600 underline font-medium">Book a professional appointment</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profAppts.map((a) => <AppointmentCard key={a._id} appt={a} onCancel={handleCancel} type="professional" />)}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showHsplBook && <HSPLBookModal onClose={() => setShowHsplBook(false)} onBooked={() => { setShowHsplBook(false); loadHspl(); }} />}
      {showExpertBook && <ExpertBookModal onClose={() => setShowExpertBook(false)} onBooked={() => { setShowExpertBook(false); loadExpert(); }} />}
      {showProfBook && <ProfessionalBookModal onClose={() => setShowProfBook(false)} onBooked={() => { setShowProfBook(false); loadProf(); }} />}
    </div>
  );
};

export default UserAppointments;
