/**
 * HospitalReferrals — CarePath AI
 *
 * Hospital staff can view incoming referrals, accept/reject them,
 * assign a professional, and update referral status.
 * All data is fetched from the backend — fully persistent.
 */

import { useState, useEffect } from 'react';
import {
  ArrowRight, RefreshCw, AlertCircle, Loader2, X,
  Building2, Stethoscope, CheckCircle, Clock, XCircle,
  TrendingUp, ChevronDown, ChevronUp, User, CalendarDays,
} from 'lucide-react';
import {
  fetchHospitalReferrals,
  updateHospitalReferralStatus,
  assignProfessionalToReferral,
  fetchDoctors,
} from '../../services/hospitalService';

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

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

// ── Status Timeline ───────────────────────────────────────────────────────────
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

// ── Assign Professional Modal ─────────────────────────────────────────────────
const AssignModal = ({ referral, doctors, onClose, onAssigned }) => {
  const [professionalId, setProfessionalId] = useState(
    referral.destinationProfessionalId?._id || referral.destinationProfessionalId || ''
  );
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!professionalId) { setError('Please select a professional'); return; }
    setSaving(true);
    setError(null);
    try {
      await assignProfessionalToReferral(referral._id, professionalId, note || undefined);
      onAssigned();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign professional');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Assign Professional</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Referral from: <span className="font-medium text-gray-800">
                {referral.patientId?.name || 'Patient'}
              </span>
            </p>
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Doctor / Professional *</label>
            {doctors.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                No approved doctors associated with this hospital. Add doctors first.
              </p>
            ) : (
              <select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">— Select a professional —</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} — {d.specialization}{d.experience ? ` (${d.experience}yr)` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for assignment, instructions…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || doctors.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Update Status Modal ───────────────────────────────────────────────────────
const StatusModal = ({ referral, onClose, onUpdated }) => {
  const transitions = ALLOWED_TRANSITIONS[referral.status] || [];
  const [status, setStatus] = useState(transitions[0] || '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (transitions.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) { setError('Please select a status'); return; }
    setSaving(true);
    setError(null);
    try {
      await updateHospitalReferralStatus(referral._id, status, note || undefined);
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
            Current status: <StatusBadge status={referral.status} />
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Status *</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {transitions.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Reason or additional information…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Referral Row ──────────────────────────────────────────────────────────────
const ReferralRow = ({ referral, doctors, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const patient = referral.patientId;
  const assignedProf = referral.destinationProfessionalId;
  const canUpdateStatus = (ALLOWED_TRANSITIONS[referral.status] || []).length > 0;
  const shortId = referral._id?.slice(-8).toUpperCase();

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {patient?.name || 'Patient'}
              </p>
              <p className="text-xs text-gray-400 font-mono">#{shortId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={referral.status} />
            {referral.priority && referral.priority !== 'NORMAL' && (
              <span className={`text-xs font-medium ${
                referral.priority === 'URGENT' ? 'text-red-600' :
                referral.priority === 'HIGH' ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {referral.priority}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{referral.reason}</p>

        {referral.category && (
          <p className="text-xs text-gray-500 mb-2">Category: <span className="font-medium">{referral.category}</span></p>
        )}

        {assignedProf && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
            <Stethoscope className="w-3.5 h-3.5 shrink-0" />
            <span>Assigned: <strong>{assignedProf.name}</strong>{assignedProf.specialization ? ` — ${assignedProf.specialization}` : ''}</span>
          </div>
        )}

        {!assignedProf && ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(referral.status) && (
          <div className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
            No professional assigned yet.
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {new Date(referral.createdAt).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2">
            {canUpdateStatus && (
              <button
                onClick={() => setShowStatus(true)}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1 font-medium">
                Update Status
              </button>
            )}
            {['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(referral.status) && (
              <button
                onClick={() => setShowAssign(true)}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg px-2.5 py-1 font-medium">
                {assignedProf ? 'Reassign' : 'Assign Doctor'}
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
                <p className="text-gray-400 mb-0.5">Received</p>
                <p className="text-gray-700 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> {new Date(referral.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Last Updated</p>
                <p className="text-gray-700">{new Date(referral.updatedAt).toLocaleString()}</p>
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

      {showAssign && (
        <AssignModal
          referral={referral}
          doctors={doctors}
          onClose={() => setShowAssign(false)}
          onAssigned={() => { setShowAssign(false); onRefresh(); }}
        />
      )}

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
const HospitalReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [total, setTotal] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [refRes, docRes] = await Promise.all([
        fetchHospitalReferrals(params),
        fetchDoctors('APPROVED'),
      ]);
      setReferrals(refRes.data?.referrals || []);
      setTotal(refRes.data?.total || 0);
      setDoctors(docRes.data?.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage incoming referrals · Accept, assign professionals, and update status.
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
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {s || 'All'} {!s && total > 0 ? `(${total})` : ''}
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
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl">
          <ArrowRight className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No referrals</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter
              ? `No ${statusFilter.toLowerCase()} referrals found.`
              : 'No referrals directed to your hospital yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {referrals.map((r) => (
            <ReferralRow
              key={r._id}
              referral={r}
              doctors={doctors}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalReferrals;
