/**
 * ExpertHelp — CarePath AI
 * Find and request help from verified individual health experts (EXPERT role).
 * Supports sending a consultation request directly to a specific expert,
 * and tracking the status of sent requests.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Clock, Loader2, AlertCircle, ChevronRight, Send, X, CheckCircle,
  ClipboardList, RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { createUserExpertRequest, fetchUserExpertRequests } from '../../services/userService';

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

// ── Request Modal ─────────────────────────────────────────────────────────────
const RequestModal = ({ expert, onClose, onSuccess }) => {
  const [form, setForm] = useState({ description: '', priority: 'NORMAL' });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { setError('Please describe your consultation need'); return; }
    setSaving(true); setError(null);
    try {
      await createUserExpertRequest(expert._id, form.description, form.priority);
      onSuccess(`Request sent to ${expert.name}!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Request Consultation</h2>
            <p className="text-xs text-gray-400 mt-0.5">with {expert.name} · {expert.specialization}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Describe your consultation need <span className="text-red-500">*</span>
            </label>
            <textarea required rows={4} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe your health concern or what you need guidance with…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Expert Card ───────────────────────────────────────────────────────────────
const ExpertCard = ({ expert, onRequest }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-pink-700">
          {expert.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{expert.name}</p>
        <p className="text-xs text-pink-600 font-medium">{expert.specialization}</p>
        {expert.qualification && <p className="text-xs text-gray-500 mt-0.5">{expert.qualification}</p>}
      </div>
      {expert.experience > 0 && (
        <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" /> {expert.experience} yrs
        </span>
      )}
    </div>

    {expert.bio && (
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{expert.bio}</p>
    )}

    <button
      onClick={() => onRequest(expert)}
      className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-pink-600 border border-pink-200 rounded-lg py-2 hover:bg-pink-50 transition-colors mt-2"
    >
      Request Consultation <ChevronRight className="w-3.5 h-3.5" />
    </button>
  </div>
);

const reqStatusColor = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  RESOLVED:  'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ExpertHelp = () => {
  const [tab, setTab]           = useState('browse');  // 'browse' | 'my-requests'
  const [experts, setExperts]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [query, setQuery]       = useState('');
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [successMsg, setSuccess]            = useState(null);

  // My requests state
  const [myRequests, setMyRequests]         = useState([]);
  const [reqLoading, setReqLoading]         = useState(false);
  const [reqError, setReqError]             = useState(null);

  const loadExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 30, verified: true };
      if (query) params.q = query;
      const res = await api.get('/search/experts', { params });
      setExperts(res.data?.data?.experts || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load experts');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => loadExperts(), 400);
    return () => clearTimeout(t);
  }, [loadExperts]);

  const loadMyRequests = useCallback(async () => {
    setReqLoading(true); setReqError(null);
    try {
      const res = await fetchUserExpertRequests();
      setMyRequests(res.data?.requests || []);
    } catch (err) {
      setReqError(err.response?.data?.message || 'Failed to load your requests');
    } finally {
      setReqLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'my-requests') loadMyRequests();
  }, [tab, loadMyRequests]);

  const handleRequestSuccess = (msg) => {
    setSelectedExpert(null);
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expert Help</h1>
        <p className="text-sm text-gray-500 mt-1">Get specialist guidance from verified healthcare experts.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'browse',      label: 'Browse Experts', icon: Users },
          { id: 'my-requests', label: 'My Requests',    icon: ClipboardList },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-pink-600 text-pink-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <>
          {/* How it works */}
          <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-pink-800 mb-2">How Expert Consultations Work</h3>
            <ol className="space-y-1.5 text-xs text-pink-800">
              <li className="flex items-start gap-2"><span className="font-bold shrink-0">1.</span> Browse experts below and find one with your needed specialty.</li>
              <li className="flex items-start gap-2"><span className="font-bold shrink-0">2.</span> Click "Request Consultation" and describe your concern.</li>
              <li className="flex items-start gap-2"><span className="font-bold shrink-0">3.</span> The expert will review your request and accept or respond.</li>
              <li className="flex items-start gap-2"><span className="font-bold shrink-0">4.</span> Once accepted, book an appointment via My Appointments.</li>
            </ol>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
            </div>
          ) : experts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-xl text-center">
              <Users className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-700">No experts found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">{total} expert{total !== 1 ? 's' : ''} available</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {experts.map((e) => (
                  <ExpertCard key={e._id} expert={e} onRequest={setSelectedExpert} />
                ))}
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
            <strong>Note:</strong> Expert consultations on CarePath AI are for professional guidance only and do not replace
            in-person medical examination or emergency services.
          </div>
        </>
      )}

      {/* My Requests tab */}
      {tab === 'my-requests' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">My Expert Consultation Requests</h2>
            <button onClick={loadMyRequests}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {reqError && (
            <div className="px-5 py-3 bg-red-50 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {reqError}
            </div>
          )}

          {reqLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
            </div>
          ) : myRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No requests yet</p>
              <p className="text-xs text-gray-400 mt-1">Browse experts and send a consultation request.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myRequests.map((req) => (
                <div key={req._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {req.expertId?.name || 'Expert'}
                        </span>
                        <span className="text-xs text-pink-600 font-medium">
                          {req.expertId?.specialization}
                        </span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${reqStatusColor[req.status] || reqStatusColor.PENDING}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                      {req.response?.message && (
                        <div className="mt-2 pl-3 border-l-2 border-gray-200">
                          <p className="text-xs text-gray-400 mb-0.5">Expert's response:</p>
                          <p className="text-xs text-gray-700">{req.response.message}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{req.priority}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedExpert && (
        <RequestModal
          expert={selectedExpert}
          onClose={() => setSelectedExpert(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};

export default ExpertHelp;
