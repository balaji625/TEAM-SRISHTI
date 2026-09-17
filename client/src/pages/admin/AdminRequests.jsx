/**
 * AdminRequests — CarePath AI
 *
 * Admin view of ALL platform requests including:
 *   1. HOSPITAL_REQUEST — sent to hospital (doctor related)
 *   2. EXPERT_ESCALATION — independent expert sends consultation to admin (app founder)
 *
 * Admin can respond (approve/reject/resolve) any request.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, RefreshCw, Loader2, AlertCircle, CheckCircle, XCircle,
  Clock, MessageSquare, Building2, UserCheck,
} from 'lucide-react';
import { fetchAdminRequests, respondAdminRequest } from '../../services/adminService';

const statusColor = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  RESOLVED:  'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const typeColor = {
  HOSPITAL_REQUEST:     'bg-emerald-50 text-emerald-700',
  EXPERT_ESCALATION:    'bg-violet-50 text-violet-700',
  APPOINTMENT:          'bg-blue-50 text-blue-700',
  PROFESSIONAL_REQUEST: 'bg-indigo-50 text-indigo-700',
  EMERGENCY:            'bg-red-50 text-red-700',
  GENERAL:              'bg-gray-100 text-gray-600',
};

const priorityColor = {
  LOW:      'text-gray-400',
  NORMAL:   'text-blue-500',
  HIGH:     'text-amber-500',
  URGENT:   'text-orange-500',
  CRITICAL: 'text-red-600',
};

const AdminRequests = () => {
  const [items, setItems]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [statusF, setStatusF]     = useState('');
  const [typeF, setTypeF]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [responding, setResp]     = useState(null);  // { id, message }
  const [busyId, setBusy]         = useState(null);
  const [expandedId, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: 20 };
      if (statusF) params.status      = statusF;
      if (typeF)   params.requestType = typeF;
      const res = await fetchAdminRequests(params);
      setItems(res.data.requests || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [page, statusF, typeF]);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async (id, status) => {
    setBusy(id);
    try {
      await respondAdminRequest(id, status, responding?.message || '');
      setItems((prev) => prev.map((r) => r._id === id ? { ...r, status } : r));
      setResp(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond');
    } finally {
      setBusy(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total requests · includes expert-to-admin escalations</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400">
          <option value="">All Statuses</option>
          {['PENDING','APPROVED','REJECTED','RESOLVED','CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeF} onChange={(e) => { setTypeF(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400">
          <option value="">All Types</option>
          {['HOSPITAL_REQUEST','EXPERT_ESCALATION','APPOINTMENT','PROFESSIONAL_REQUEST','EMERGENCY','GENERAL'].map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Respond modal */}
      {responding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Respond to Request</h3>
            <textarea rows={3} value={responding.message}
              onChange={(e) => setResp((r) => ({ ...r, message: e.target.value }))}
              placeholder="Optional message to requester…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setResp(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleRespond(responding.id, 'REJECTED')} disabled={busyId === responding.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                Reject
              </button>
              <button onClick={() => handleRespond(responding.id, 'APPROVED')} disabled={busyId === responding.id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                {busyId === responding.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Approve'}
              </button>
            </div>
            <button onClick={() => handleRespond(responding.id, 'RESOLVED')} disabled={busyId === responding.id}
              className="w-full mt-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 text-sm font-medium disabled:opacity-50">
              Mark Resolved
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white border border-gray-200 rounded-xl">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-xl">
            <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No requests found</p>
          </div>
        ) : items.map((req) => (
          <div key={req._id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-rose-600">{req.userId?.name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{req.userId?.name || 'Unknown'}</span>
                  <span className="text-xs text-gray-400">{req.userId?.email}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeColor[req.requestType] || typeColor.GENERAL}`}>
                    {req.requestType?.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-bold ${priorityColor[req.priority] || priorityColor.NORMAL}`}>
                    {req.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {expandedId === req._id ? req.description : req.description?.substring(0, 120) + (req.description?.length > 120 ? '…' : '')}
                </p>
                {req.description?.length > 120 && (
                  <button onClick={() => setExpanded((id) => id === req._id ? null : req._id)}
                    className="text-xs text-rose-600 mt-1 hover:text-rose-700">
                    {expandedId === req._id ? 'Show less' : 'Show more'}
                  </button>
                )}
                {/* Target info */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {req.hospitalId && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      <Building2 className="w-3 h-3" /> {req.hospitalId.name}
                    </span>
                  )}
                  {req.expertId && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      <UserCheck className="w-3 h-3" /> Expert assigned
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[req.status] || statusColor.PENDING}`}>
                  {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                  {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                  {req.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                  {req.status}
                </span>
                <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                {req.status === 'PENDING' && (
                  <button onClick={() => setResp({ id: req._id, message: '' })}
                    className="flex items-center gap-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-md font-medium transition-colors">
                    <MessageSquare className="w-3 h-3" /> Respond
                  </button>
                )}
              </div>
            </div>
            {/* Response */}
            {req.response?.message && (
              <div className="mt-3 ml-11 pl-3 border-l-2 border-gray-200">
                <p className="text-xs text-gray-500 mb-0.5">Response:</p>
                <p className="text-xs text-gray-700">{req.response.message}</p>
              </div>
            )}
          </div>
        ))}
      </div>

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
    </div>
  );
};

export default AdminRequests;
