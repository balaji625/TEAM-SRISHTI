/**
 * HospitalAssociations — CarePath AI
 * Manage doctor association requests (approve / reject).
 */

import { useState, useEffect } from 'react';
import {
  Link2, CheckCircle, XCircle, Clock, RefreshCw, Loader2,
  AlertCircle, Stethoscope, User,
} from 'lucide-react';
import {
  fetchAssociations, approveAssociation, rejectAssociation,
} from '../../services/hospitalService';

const STATUS_CFG = {
  PENDING:  { label: 'Pending',  cls: 'text-amber-700 bg-amber-50 border-amber-200',     icon: Clock },
  APPROVED: { label: 'Approved', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Rejected', cls: 'text-red-700 bg-red-50 border-red-200',           icon: XCircle },
  REMOVED:  { label: 'Removed',  cls: 'text-gray-600 bg-gray-50 border-gray-200',        icon: XCircle },
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

const AssociationRow = ({ assoc, onApprove, onReject, loading }) => {
  const requestDate = new Date(assoc.requestedAt);
  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-emerald-700">
          {assoc.professionalName?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-900">{assoc.professionalName}</p>
          <StatusBadge status={assoc.status} />
        </div>
        <p className="text-xs text-emerald-700 font-medium">{assoc.specialization}</p>
        {assoc.department && <p className="text-xs text-gray-500">Dept: {assoc.department}</p>}
        {assoc.role && <p className="text-xs text-gray-500">Role: {assoc.role}</p>}
        {assoc.experience > 0 && <p className="text-xs text-gray-400">{assoc.experience} yrs experience</p>}
        <p className="text-xs text-gray-400 mt-1">
          Requested {requestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      {assoc.status === 'PENDING' && (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onApprove(assoc._id)}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={() => onReject(assoc._id)}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );
};

const HospitalAssociations = () => {
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]               = useState(null);
  const [statusFilter, setStatus]       = useState('');
  const [success, setSuccess]           = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await fetchAssociations(params);
      setAssociations(res.data?.associations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load associations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleApprove = async (assocId) => {
    setActionLoading(true);
    try {
      await approveAssociation(assocId);
      showSuccess('Doctor association approved');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (assocId) => {
    if (!window.confirm('Reject this association request?')) return;
    setActionLoading(true);
    try {
      await rejectAssociation(assocId);
      showSuccess('Association request rejected');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = associations.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Associations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage doctor association requests.
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

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {s || 'All'}
            {s === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 flex gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl px-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : associations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Stethoscope className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-700">No association requests</p>
            <p className="text-xs text-gray-400 mt-1">
              Doctors can request association from their professional dashboard.
            </p>
          </div>
        ) : (
          associations.map((a) => (
            <AssociationRow
              key={a._id}
              assoc={a}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={actionLoading}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default HospitalAssociations;
