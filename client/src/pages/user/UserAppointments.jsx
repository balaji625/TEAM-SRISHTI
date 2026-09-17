/**
 * UserAppointments — CarePath AI
 * List existing appointments + book a new one.
 * UPGRADED:
 *  - Hospital is REQUIRED
 *  - Professional is REQUIRED and filtered by selected hospital
 *  - Dynamic slot generation with double-booking prevention
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, Building2, Stethoscope, X, CheckSquare,
} from 'lucide-react';
import {
  fetchAppointments, bookAppointment, cancelAppointment,
  searchHospitals, searchProfessionals,
  fetchProfessionalSlots, fetchExpertSlots,
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
    if (!providerId || !date) {
      setSlots([]);
      setMessage(null);
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
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
    } catch (err) {
      setError('Could not load availability. You may enter a time manually.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [providerId, providerType, date]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  if (!providerId || !date) return null;

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading available slots…
    </div>
  );

  if (error) return (
    <p className="text-xs text-amber-600 mt-1">{error}</p>
  );

  if (message) return (
    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
      {message}
    </div>
  );

  if (slots.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500 mb-2">Available slots — select one:</p>
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
        {slots.map(({ time, available }) => (
          <button
            key={time}
            type="button"
            disabled={!available}
            onClick={() => available && onSelectTime(time)}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
              selectedTime === time
                ? 'bg-blue-600 text-white border-blue-600'
                : available
                  ? 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                  : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
            }`}
          >
            {available ? '✅' : '❌'} {time}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={loadSlots}
        className="text-xs text-gray-400 hover:text-gray-600 mt-1.5 flex items-center gap-1"
      >
        <RefreshCw className="w-3 h-3" /> Refresh slots
      </button>
    </div>
  );
};

// ── Book Appointment Modal ────────────────────────────────────────────────────
const BookModal = ({ onClose, onBooked }) => {
  const [form, setForm] = useState({
    date: '', time: '', reason: '', consultationType: 'IN_PERSON',
    hospitalId: '', professionalId: '', notes: '',
  });
  const [hospitals, setHospitals]         = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState(null);

  // Load hospitals on mount
  useEffect(() => {
    setLoadingHospitals(true);
    searchHospitals({ limit: 100 })
      .then((r) => setHospitals(r.data?.hospitals || []))
      .catch(() => {})
      .finally(() => setLoadingHospitals(false));
  }, []);

  // When hospital changes, fetch only professionals from that hospital
  useEffect(() => {
    if (!form.hospitalId) {
      setProfessionals([]);
      return;
    }
    setLoadingProfessionals(true);
    searchProfessionals({ hospitalId: form.hospitalId, limit: 100 })
      .then((r) => setProfessionals(r.data?.professionals || []))
      .catch(() => setProfessionals([]))
      .finally(() => setLoadingProfessionals(false));
  }, [form.hospitalId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // When hospital changes, clear selected professional and time
  const handleHospitalChange = (v) => {
    setForm((f) => ({ ...f, hospitalId: v, professionalId: '', time: '' }));
  };

  // When professional changes, reset the time so user picks from new slots
  const handleProfessionalChange = (v) => {
    setForm((f) => ({ ...f, professionalId: v, time: '' }));
  };

  const handleTimeSelect = (t) => set('time', t);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospitalId) {
      setError('Hospital selection is required');
      return;
    }
    if (!form.professionalId) {
      setError('Doctor/Professional selection is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        date: form.date, time: form.time, reason: form.reason,
        consultationType: form.consultationType,
        notes: form.notes || undefined,
        hospitalId: form.hospitalId,
        professionalId: form.professionalId,
      };
      await bookAppointment(payload);
      onBooked();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to book appointment';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Book Appointment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Hospital — REQUIRED */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hospital <span className="text-red-500">*</span>
            </label>
            {loadingHospitals ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading hospitals…
              </div>
            ) : (
              <select required value={form.hospitalId}
                onChange={(e) => handleHospitalChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select hospital —</option>
                {hospitals.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}{h.city ? ` — ${h.city}` : ''}{h.emergencyAvailable ? ' 🚨' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Doctor/Professional — REQUIRED, filtered by hospital */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Doctor / Professional <span className="text-red-500">*</span>
            </label>
            {!form.hospitalId ? (
              <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Select a hospital first
                </span>
              </div>
            ) : loadingProfessionals ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading professionals…
              </div>
            ) : professionals.length === 0 ? (
              <div className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2.5 text-sm text-amber-700">
                No verified professionals associated with this hospital.
              </div>
            ) : (
              <select required value={form.professionalId}
                onChange={(e) => handleProfessionalChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select professional —</option>
                {professionals.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {p.specialization}{p.experience ? ` (${p.experience}yr)` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" required value={form.date}
                onChange={(e) => { set('date', e.target.value); set('time', ''); }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input type="time" required value={form.time} onChange={(e) => set('time', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Dynamic slot picker — shows when professional + date selected */}
          {form.professionalId && form.date && (
            <SlotPicker
              providerId={form.professionalId}
              providerType="professional"
              date={form.date}
              selectedTime={form.time}
              onSelectTime={handleTimeSelect}
            />
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea required rows={2} value={form.reason} onChange={(e) => set('reason', e.target.value)}
              placeholder="Describe your reason for the appointment..."
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
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional information..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Appointment Card ──────────────────────────────────────────────────────────
const AppointmentCard = ({ appt, onCancel }) => {
  const date = new Date(appt.date);
  const isPast = date < new Date();
  const canCancel = ['PENDING', 'CONFIRMED'].includes(appt.status);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
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
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {appt.hospitalId.name}
          </span>
        )}
        {appt.professionalId && (
          <span className="flex items-center gap-1">
            <Stethoscope className="w-3 h-3" /> {appt.professionalId.name}
          </span>
        )}
      </div>

      {canCancel && !isPast && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button onClick={() => onCancel(appt._id)}
            className="text-xs text-red-600 hover:text-red-700 font-medium">
            Cancel appointment
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const UserAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showBook, setShowBook]         = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await fetchAppointments(params);
      setAppointments(res.data?.appointments || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(id, '');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your upcoming and past appointments.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setShowBook(true)}
            className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Book
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl">
          <Calendar className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No appointments found</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Book your first appointment to get started.</p>
          <button onClick={() => setShowBook(true)}
            className="text-sm text-blue-600 underline font-medium">Book an appointment</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {appointments.map((a) => (
            <AppointmentCard key={a._id} appt={a} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {showBook && (
        <BookModal
          onClose={() => setShowBook(false)}
          onBooked={() => { setShowBook(false); load(); }}
        />
      )}
    </div>
  );
};

export default UserAppointments;
