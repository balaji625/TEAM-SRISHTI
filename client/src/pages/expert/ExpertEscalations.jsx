/**
 * ExpertEscalations — CarePath AI
 *
 * Expert view of INCOMING requests from users directed at this expert.
 * Shows requests where expertId = this expert's profile, created by users.
 * Expert can accept (APPROVED), reject (REJECTED), or resolve (RESOLVED).
 *
 * Route: /expert/escalations
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp, RefreshCw, Loader2, AlertCircle, CheckCircle,
  XCircle, Clock, MessageSquare,
} from 'lucide-react';
import { fetchIncomingExpertRequests, updateIncomingExpertRequest } from '../../services/expertService';

const statusColor = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  RESOLVED:  'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const priorityColor = {
  LOW:      'text-gray-400',
  NORMAL:   'text-blue-500',
  HIGH:     'text-amber-500',
  URGENT:   'text-orange-500',
  CRITICAL: 'text-red-600',
};

const ExpertEscalations = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [responding, setResp]   = useState(null);  // { id, message }
  const [busyId, setBusy]       = useState(null);
  const [expandedId, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchIncomingExpertRequests();
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incoming requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRespond = async (id, status) => {
    setBusy(id);
    try {
      const res = await updateIncomingExpertRequest(id, status, responding?.message || '');
      setRequests((prev) => prev.map((r) => r._id === id ? { ...r, ...res.data?.request, status } : r));
      setResp(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escalations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Consultation requests from patients directed to you</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Respond modal */}
      {responding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg mx-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Respond to Request</h3>
            <textarea rows={3} value={responding.message}
              onChange={(e) => setResp((r) => ({ ...r, message: e.target.value }))}
              placeholder="Optional message to patient…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setResp(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleRespond(responding.id, 'REJECTED')} disabled={busyId === responding.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                Reject
              </button>
              <button onClick={() => handleRespond(responding.id, 'APPROVED')} disabled={busyId === responding.id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center">
                {busyId === responding.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
              </button>
            </div>
            <button onClick={() => handleRespond(responding.id, 'RESOLVED')} disabled={busyId === responding.id}
              className="w-full mt-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 text-sm font-medium disabled:opacity-50">
              Mark Resolved
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-dashed border-gray-200 rounded-xl text-center">
          <TrendingUp className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No incoming requests</p>
          <p className="text-xs text-gray-400 mt-1">When patients request a consultation with you, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req._id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-pink-600">
                    {req.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{req.userId?.name || 'Patient'}</span>
                    <span className="text-xs text-gray-400">{req.userId?.email}</span>
                    <span className={`text-xs font-bold ${priorityColor[req.priority] || priorityColor.NORMAL}`}>
                      {req.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {expandedId === req._id ? req.description : req.description?.substring(0, 150) + (req.description?.length > 150 ? '…' : '')}
                  </p>
                  {req.description?.length > 150 && (
                    <button onClick={() => setExpanded((id) => id === req._id ? null : req._id)}
                      className="text-xs text-violet-600 mt-1 hover:text-violet-700">
                      {expandedId === req._id ? 'Show less' : 'Show more'}
                    </button>
                  )}
                  {req.response?.message && (
                    <div className="mt-2 pl-3 border-l-2 border-gray-200">
                      <p className="text-xs text-gray-400 mb-0.5">Your response:</p>
                      <p className="text-xs text-gray-600">{req.response.message}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[req.status] || statusColor.PENDING}`}>
                    {req.status === 'PENDING'   && <Clock className="w-3 h-3" />}
                    {req.status === 'APPROVED'  && <CheckCircle className="w-3 h-3" />}
                    {req.status === 'REJECTED'  && <XCircle className="w-3 h-3" />}
                    {req.status === 'RESOLVED'  && <CheckCircle className="w-3 h-3" />}
                    {req.status}
                  </span>
                  <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                  {req.status === 'PENDING' && (
                    <button onClick={() => setResp({ id: req._id, message: '' })}
                      className="flex items-center gap-1 text-xs text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-1 rounded-md font-medium transition-colors">
                      <MessageSquare className="w-3 h-3" /> Respond
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpertEscalations;
