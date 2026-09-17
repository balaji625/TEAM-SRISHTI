/**
 * ProfessionalReferrals — CarePath AI
 *
 * Professional can see referrals they created or are assigned to.
 * Can update referral status according to allowed transitions.
 * All data is fetched from the backend — fully persistent.
 */

import { useState, useEffect } from 'react';
import {
  ArrowRight, RefreshCw, AlertCircle, Loader2, X,
  Building2, Stethoscope, CheckCircle, Clock, XCircle,
  TrendingUp, ChevronDown, ChevronUp, User, CalendarDays,
} from 'lucide-react';
import {
  fetchProfessionalReferrals,
  updateProfessionalReferralStatus,
} from '../../services/professionalService';

const STATUS_CONFIG = {
  CREATED:     { color: 'text-blue-700 bg-blue-50 border-blue-200',       label: 'Created',     icon: Clock },
  ACCEPTED:    { color: 'text-cyan-700 bg-cyan-50 border-cyan-200',       label: 'Accepted',    icon: CheckCircle },
  SCHEDULED:   { color: 'text-amber-700 bg-amber-50 border-amber-200',    label: 'Scheduled',   icon: Clock },
  IN_PROGRESS: { color: 'text-purple-700 bg-purple-50 border-purple-200', label: 'In Progress', icon: TrendingUp },
  COMPLETED:   { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Completed', icon: CheckCircle },
  REJECTED:    { color: 'text-red-700 bg-red-50 border-red-200',          label: 'Rejected',    icon: XCircle },
  CANCELLED:   { color: 'text-gray-600 bg-gray-50 border-gray-200',       label: 'Cancelled',   icon: XCircle },
};

const ALLOWED_TRANSITIONS = {
  CREATED:     ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED:    ['SCHEDULED', 'CANCELLED'],
  SCHEDULED:   ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED:   [],
  REJECTED:    [],
  CANCELLED:   [],
};

const JOURNEY_STEPS = ['CREATED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

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
              active ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done ? '✓' : active ? '●' : '○'} {step.replace('_', ' ')}
            </div>
            {idx < JOURNEY_STEPS.length - 1 && (
              <ArrowRight className={`w-3 h-3 shrink-0 ${done && !isCancelled ? 'text-emerald-400' : 'text-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const StatusTimeline = ({ history }) => {
  if (!history || history.length === 0) return null;
  return (
    <div className="space-y-2">
      {[...history].reverse().map((h, idx) => {
        const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.CREATED;
        const Icon = cfg.icon;
        return (
          <div key={idx} className="flex gap-2.5 items-start">
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

// ── Update Status Modal ───────────────────────────────────────────────────────
const StatusModal = ({ referral, onClose, onUpdated }) => {
  const transitions = ALLOWED_TRANSITIONS[referral.status] || [];
  const [status, setStatus] = useState(transitions[0] || '');
  const [note, setNote] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (transitions.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) { setError('Please select a status'); return; }
    setSaving(true);
    setError(null);
    try {
      await updateProfessionalReferralStatus(
        referral._id,
        status,
        note || undefined,
        nextAction || undefined
      );
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Update Referral Status</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Current: <StatusBadge status={referral.status} />
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Status *</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {transitions.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Notes for the status change…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Next Action for Patient (optional)</label>
            <input type="text" value={nextAction} onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g. Attend appointment on 20 May, 10:00 AM"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Referral Card ─────────────────────────────────────────────────────────────
const ReferralCard = ({ referral, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const patient = referral.patientId;
  const dest =
    referral.destinationHospitalId?.name ||
    (referral.destinationProfessionalId && typeof referral.destinationProfessionalId === 'object'
      ? referral.destinationProfessionalId.name
      : null) ||
    referral.destinationName ||
    'TBD';

  const canUpdateStatus = (ALLOWED_TRANSITIONS[referral.status] || []).length > 0;
  const isCancelled = referral.status === 'CANCELLED' || referral.status === 'REJECTED';
  const shortId = referral._id?.slice(-8).toUpperCase();

  return (
    <>
      <div className={`bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow ${
        isCancelled ? 'border-gray-200 opacity-75' : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isCancelled ? 'bg-gray-50' : 'bg-indigo-50'
            }`}>
              <ArrowRight className={`w-4 h-4 ${isCancelled ? 'text-gray-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {patient?.name || 'Patient'}
              </p>
              <p className="text-xs text-gray-400 font-mono">#{shortId} → {dest}</p>
            </div>
          </div>
          <StatusBadge status={referral.status} />
        </div>

        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{referral.reason}</p>

        {!isCancelled && <JourneyProgress status={referral.status} />}

        {referral.nextAction && !isCancelled && (
          <div className="mt-2.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
            <span className="font-medium">Next:</span> {referral.nextAction}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">{new Date(referral.createdAt).toLocaleDateString()}</p>
          <div className="flex items-center gap-2">
            {canUpdateStatus && (
              <button
                onClick={() => setShowStatus(true)}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-2.5 py-1 font-medium">
                Update Status
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-0.5">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400 mb-0.5">Patient</p>
                <p className="text-gray-800 flex items-center gap-1">
                  <User className="w-3 h-3" /> {patient?.name}
                </p>
                {patient?.phone && <p className="text-gray-500">{patient.phone}</p>}
              </div>
              {referral.category && (
                <div>
                  <p className="text-gray-400 mb-0.5">Category</p>
                  <p className="text-gray-700">{referral.category}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 mb-0.5">Priority</p>
                <p className={`font-medium ${
                  referral.priority === 'URGENT' ? 'text-red-600' :
                  referral.priority === 'HIGH' ? 'text-amber-600' : 'text-gray-700'
                }`}>{referral.priority || 'NORMAL'}</p>
              </div>
              {referral.notes && (
                <div className="col-span-2">
                  <p className="text-gray-400 mb-0.5">Notes</p>
                  <p className="text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{referral.notes}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 mb-0.5">Last Updated</p>
                <p className="text-gray-700 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {new Date(referral.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {referral.statusHistory && referral.statusHistory.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Status History</p>
                <StatusTimeline history={referral.statusHistory} />
              </div>
            )}
          </div>
        )}
      </div>

      {showStatus && (
        <StatusModal
          referral={referral}
          onClose={() => setShowStatus(false)}
          onUpdated={() => { setShowStatus(false); onRefresh(); }}
        />
      )}
    </>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const ProfessionalReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await fetchProfessionalReferrals(params);
      setReferrals(res.data?.referrals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Referrals assigned to you or created by you. Update status as care progresses.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'CREATED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
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
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl">
          <ArrowRight className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No referrals</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter
              ? `No ${statusFilter.toLowerCase()} referrals.`
              : 'No referrals assigned to or created by you.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {referrals.map((r) => (
            <ReferralCard key={r._id} referral={r} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalReferrals;
