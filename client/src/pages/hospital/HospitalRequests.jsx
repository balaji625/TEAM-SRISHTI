/**
 * HospitalRequests — CarePath AI
 * Manage patient requests directed at the hospital.
 */

import { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle, XCircle, Clock, RefreshCw, Loader2,
  AlertCircle, User, MessageSquare, X,
} from 'lucide-react';
import {
  fetchHospitalRequests, respondToRequest,
} from '../../services/hospitalService';

const STATUS_CFG = {
  PENDING:   { label: 'Pending',   cls: 'text-amber-700 bg-amber-50 border-amber-200',     icon: Clock },
  APPROVED:  { label: 'Approved',  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle },
  REJECTED:  { label: 'Rejected',  cls: 'text-red-700 bg-red-50 border-red-200',           icon: XCircle },
  RESOLVED:  { label: 'Resolved',  cls: 'text-blue-700 bg-blue-50 border-blue-200',        icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', cls: 'text-gray-600 bg-gray-50 border-gray-200',        icon: XCircle },
};

const PRIORITY_CFG = {
  LOW:      'text-gray-500',
  NORMAL:   'text-blue-600',
  HIGH:     'text-orange-600',
  URGENT:   'text-red-600',
  CRITICAL: 'text-red-700 font-bold',
};

const TYPE_LABELS = {
  APPOINTMENT:          'Appointment',
  EXPERT_ESCALATION:    'Expert Escalation',
  HOSPITAL_REQUEST:     'Hospital Request',
  PROFESSIONAL_REQUEST: 'Professional Request',
  EMERGENCY:            'Emergency',
  GENERAL:              'General',
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

// ── Respond Modal ─────────────────────────────────────────────────────────────
const RespondModal = ({ request, onClose, onResponded }) => {
  const [status, setStatus]   = useState('APPROVED');
  const [message, setMessage] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await respondToRequest(request._id, status, message);
      onResponded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Respond to Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            <p className="font-medium">{request.userId?.name}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-3">{request.description}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Response Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
              <option value="RESOLVED">Resolve</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Response Message (optional)</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a response message..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Submit Response
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Request Row ────────────────────────────────────────────────────────────────
const RequestRow = ({ request, onRespond }) => {
  const date = new Date(request.createdAt);
  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0 px-4">
      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
        <ClipboardList className="w-4 h-4 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mr-2">
              {TYPE_LABELS[request.requestType] || request.requestType}
            </span>
            <span className={`text-xs font-medium ${PRIORITY_CFG[request.priority] || ''}`}>
              {request.priority}
            </span>
          </div>
          <StatusBadge status={request.status} />
        </div>
        {request.userId && (
          <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
            <User className="w-3 h-3" /> {request.userId.name}
            {request.userId.phone && <span className="text-gray-400 ml-2">{request.userId.phone}</span>}
          </p>
        )}
        <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
        <p className="text-xs text-gray-400 mt-1">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        {request.response?.message && (
          <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
            <strong>Response:</strong> {request.response.message}
          </div>
        )}
      </div>
      {request.status === 'PENDING' && (
        <button onClick={() => onRespond(request)}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
          <MessageSquare className="w-3.5 h-3.5" /> Respond
        </button>
      )}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const HospitalRequests = () => {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [statusFilter, setStatus]   = useState('');
  const [respondTarget, setTarget]  = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await fetchHospitalRequests(params);
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Patient requests directed at your hospital.
            {pendingCount > 0 && !statusFilter && (
              <span className="ml-2 text-amber-700 font-medium">{pendingCount} pending</span>
            )}
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {s ? STATUS_CFG[s]?.label : 'All'}
            {s === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-700">No requests</p>
            <p className="text-xs text-gray-400 mt-1">Patient requests for your hospital will appear here.</p>
          </div>
        ) : (
          requests.map((r) => (
            <RequestRow key={r._id} request={r} onRespond={setTarget} />
          ))
        )}
      </div>

      {respondTarget && (
        <RespondModal
          request={respondTarget}
          onClose={() => setTarget(null)}
          onResponded={() => { setTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default HospitalRequests;
