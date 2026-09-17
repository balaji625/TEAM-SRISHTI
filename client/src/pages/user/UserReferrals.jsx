/**
 * UserReferrals — CarePath AI
 *
 * Smart Referral Journey page.
 * Patients can view their referrals and create new referral requests.
 * All data is fetched from the backend — nothing is hardcoded.
 */

import { useState, useEffect } from 'react';
import {
  ArrowRight, Plus, RefreshCw, AlertCircle, Loader2, X,
  Building2, Stethoscope, CheckCircle, Clock, XCircle,
  TrendingUp, ChevronDown, ChevronUp, CalendarDays, User,
} from 'lucide-react';
import { fetchReferrals, createReferral, cancelReferral, searchHospitals } from '../../services/userService';

const STATUS_CONFIG = {
  CREATED:     { color: 'text-blue-700 bg-blue-50 border-blue-200',       label: 'Created',     icon: Clock },
  ACCEPTED:    { color: 'text-cyan-700 bg-cyan-50 border-cyan-200',       label: 'Accepted',    icon: CheckCircle },
  SCHEDULED:   { color: 'text-amber-700 bg-amber-50 border-amber-200',    label: 'Scheduled',   icon: Clock },
  IN_PROGRESS: { color: 'text-purple-700 bg-purple-50 border-purple-200', label: 'In Progress', icon: TrendingUp },
  COMPLETED:   { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Completed', icon: CheckCircle },
  REJECTED:    { color: 'text-red-700 bg-red-50 border-red-200',          label: 'Rejected',    icon: XCircle },
  CANCELLED:   { color: 'text-gray-600 bg-gray-50 border-gray-200',       label: 'Cancelled',   icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

// ── Journey steps visualization ───────────────────────────────────────────────
const JOURNEY_STEPS = ['CREATED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];

const JourneyProgress = ({ status }) => {
  const currentIdx = JOURNEY_STEPS.indexOf(status);
  const isCancelled = status === 'CANCELLED' || status === 'REJECTED';

  return (
    <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
      {JOURNEY_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx && !isCancelled;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
              isCancelled ? 'bg-gray-100 text-gray-400' :
              done   ? 'bg-emerald-100 text-emerald-700' :
              active ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-400' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done ? '✓' : active ? '●' : '○'} {step.replace('_', ' ')}
            </div>
            {idx < JOURNEY_STEPS.length - 1 && (
              <ArrowRight className={`w-3 h-3 shrink-0 ${
                done && !isCancelled ? 'text-emerald-400' : 'text-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Status History Timeline ───────────────────────────────────────────────────
const StatusTimeline = ({ history }) => {
  if (!history || history.length === 0) return null;
  return (
    <div className="space-y-2 mt-2">
      {[...history].reverse().map((h, idx) => {
        const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.CREATED;
        const Icon = cfg.icon;
        return (
          <div key={idx} className="flex gap-3 items-start">
            <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${cfg.color}`}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800">{cfg.label}</p>
              {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
              <p className="text-xs text-gray-400 mt-0.5">
                {h.changedAt ? new Date(h.changedAt).toLocaleString() : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Create Referral Modal ─────────────────────────────────────────────────────
const CreateModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    reason: '', category: '', priority: 'NORMAL',
    destinationHospitalId: '', destinationName: '', notes: '',
  });
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoadingHospitals(true);
    searchHospitals({ limit: 100 })
      .then((r) => setHospitals(r.data?.hospitals || []))
      .catch(() => {})
      .finally(() => setLoadingHospitals(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      setError('Please describe your reason for the referral');
      return;
    }
    if (!form.destinationHospitalId && !form.destinationName.trim()) {
      setError('Please select a destination hospital or enter a facility name');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        reason: form.reason.trim(),
        category: form.category || undefined,
        priority: form.priority,
        destinationHospitalId: form.destinationHospitalId || undefined,
        destinationName: form.destinationName.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      await createReferral(payload);
      onCreate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create referral request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Request Referral</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Referral *</label>
            <textarea required rows={3} value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
              placeholder="Describe why you need a referral (symptoms, condition, specialist needed…)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Specialty Category</label>
              <input type="text" value={form.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="e.g. Cardiology, Ortho"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Destination Hospital *</label>
            {loadingHospitals ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading hospitals…
              </div>
            ) : (
              <select value={form.destinationHospitalId}
                onChange={(e) => set('destinationHospitalId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select from verified hospitals —</option>
                {hospitals.map((h) => (
                  <option key={h._id} value={h._id}>{h.name}{h.city ? ` — ${h.city}` : ''}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Or enter facility name (if not listed)
            </label>
            <input type="text" value={form.destinationName}
              onChange={(e) => set('destinationName', e.target.value)}
              placeholder="e.g. District Hospital Vizag, PHC Nellore"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any relevant context for the referral…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Referral Card ─────────────────────────────────────────────────────────────
const ReferralCard = ({ referral, onCancel }) => {
  const [expanded, setExpanded] = useState(false);

  const dest =
    referral.destinationHospitalId?.name ||
    referral.destinationProfessionalId?.name ||
    referral.destinationName ||
    'Destination TBD';

  const source =
    referral.sourceHospitalId?.name ||
    referral.sourceProfessionalId?.name ||
    referral.sourceName ||
    null;

  const assignedProf = referral.destinationProfessionalId;

  const canCancel = ['CREATED', 'ACCEPTED'].includes(referral.status);
  const isCancelled = referral.status === 'CANCELLED' || referral.status === 'REJECTED';

  // Short referral ID for display
  const shortId = referral._id?.slice(-8).toUpperCase();

  return (
    <div className={`bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow ${
      isCancelled ? 'border-gray-200 opacity-75' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isCancelled ? 'bg-gray-50' : 'bg-purple-50'
          }`}>
            <ArrowRight className={`w-4 h-4 ${isCancelled ? 'text-gray-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">→ {dest}</p>
            <p className="text-xs text-gray-400 font-mono">#{shortId}</p>
          </div>
        </div>
        <StatusBadge status={referral.status} />
      </div>

      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{referral.reason}</p>

      {!isCancelled && <JourneyProgress status={referral.status} />}

      {isCancelled && (
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-medium">
          This referral has been {referral.status.toLowerCase()}.
        </div>
      )}

      {referral.nextAction && !isCancelled && (
        <div className="mt-2.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
          <span className="font-medium">Next:</span> {referral.nextAction}
        </div>
      )}

      {/* Assigned professional badge */}
      {assignedProf && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
          <Stethoscope className="w-3.5 h-3.5 shrink-0" />
          <span>Assigned: <strong>{assignedProf.name}</strong>{assignedProf.specialization ? ` — ${assignedProf.specialization}` : ''}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400">
            {new Date(referral.createdAt).toLocaleDateString()}
          </p>
          {referral.priority && referral.priority !== 'NORMAL' && (
            <span className={`text-xs font-medium ${
              referral.priority === 'URGENT' ? 'text-red-600' :
              referral.priority === 'HIGH' ? 'text-amber-600' : 'text-gray-500'
            }`}>
              {referral.priority}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {canCancel && (
            <button onClick={() => onCancel(referral._id)}
              className="text-xs text-red-500 hover:text-red-700 font-medium">
              Cancel
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Less</> : <><ChevronDown className="w-3.5 h-3.5" /> Details</>}
          </button>
        </div>
      </div>

      {/* Expanded detail view */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          {/* Key info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-400 mb-0.5">Referral ID</p>
              <p className="font-mono text-gray-700">#{shortId}</p>
            </div>
            {referral.category && (
              <div>
                <p className="text-gray-400 mb-0.5">Category</p>
                <p className="text-gray-700">{referral.category}</p>
              </div>
            )}
            {source && (
              <div>
                <p className="text-gray-400 mb-0.5">Referred From</p>
                <p className="text-gray-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {source}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-400 mb-0.5">Referred To</p>
              <p className="text-gray-700 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {dest}
              </p>
            </div>
            {assignedProf && (
              <div>
                <p className="text-gray-400 mb-0.5">Assigned Doctor</p>
                <p className="text-gray-700 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" /> {assignedProf.name}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-400 mb-0.5">Last Updated</p>
              <p className="text-gray-700 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {new Date(referral.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {referral.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Notes</p>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{referral.notes}</p>
            </div>
          )}

          {referral.statusHistory && referral.statusHistory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Status History</p>
              <StatusTimeline history={referral.statusHistory} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const UserReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await fetchReferrals(params);
      setReferrals(res.data?.referrals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load referrals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this referral?')) return;
    try {
      await cancelReferral(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel referral');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Journey</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your referrals from PHC to specialist.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Request Referral
          </button>
        </div>
      </div>

      {/* Pathway info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
        <p className="font-semibold mb-1">How the Referral Journey works:</p>
        <div className="flex items-center gap-1 flex-wrap">
          {['PHC', 'Rural Hospital', 'District Hospital', 'Specialist'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1">
              <span className="font-medium">{s}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-blue-400" />}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-blue-600">
          Request a referral below. The destination hospital will accept and assign a specialist. Track every step here.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'CREATED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((s) => (
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
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl">
          <ArrowRight className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No referrals yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Request a referral to a specialist or hospital.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="text-sm text-blue-600 underline font-medium">
            Request a referral
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {referrals.map((r) => (
            <ReferralCard key={r._id} referral={r} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
};

export default UserReferrals;
