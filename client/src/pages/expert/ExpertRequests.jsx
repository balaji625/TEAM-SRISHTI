/**
 * ExpertRequests — CarePath AI
 *
 * Independent Expert requests page with two flows:
 *   1. Send a request to a HOSPITAL (related to a doctor / collaboration)
 *   2. Send as an Independent Expert directly to ADMIN (app founder)
 *
 * Also shows a list of submitted requests and their statuses.
 *
 * Route: /expert/requests
 */

import { useState, useEffect } from 'react';
import {
  ClipboardList, Building2, Shield, Send, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, Info,
} from 'lucide-react';
import { fetchExpertRequests, sendRequestToHospital, sendRequestToAdmin } from '../../services/expertService';
import api from '../../services/api';

const statusColor = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  RESOLVED:  'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const typeLabel = {
  HOSPITAL_REQUEST:  '→ Hospital',
  EXPERT_ESCALATION: '→ Admin',
};

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

// ── Form: send to hospital ─────────────────────────────────────────────────────
const SendToHospitalForm = ({ onSuccess }) => {
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({ hospitalId: '', description: '', priority: 'NORMAL' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingHospitals, setLoadingH] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/search/hospitals', { params: { limit: 50 } });
        setHospitals(res.data?.data?.hospitals || []);
      } catch {
        setHospitals([]);
      } finally {
        setLoadingH(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospitalId || !form.description.trim()) {
      setError('Please select a hospital and enter a description.');
      return;
    }
    setLoading(true); setError(null);
    try {
      await sendRequestToHospital(form.hospitalId, form.description, form.priority);
      onSuccess('Request sent to hospital successfully!');
      setForm({ hospitalId: '', description: '', priority: 'NORMAL' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Send a collaboration or consultation request directly to a hospital. The hospital admin will review and respond.</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Select Hospital <span className="text-red-500">*</span></label>
        {loadingHospitals ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading hospitals…
          </div>
        ) : (
          <select value={form.hospitalId} onChange={(e) => setForm((f) => ({ ...f, hospitalId: e.target.value }))}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="">— Choose a hospital —</option>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>{h.name}{h.city ? ` · ${h.city}` : ''}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Message / Description <span className="text-red-500">*</span></label>
        <textarea required rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe your request, collaboration proposal, or consultation need…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
        <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send to Hospital
      </button>
    </form>
  );
};

// ── Form: send to admin ────────────────────────────────────────────────────────
const SendToAdminForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ subject: '', description: '', priority: 'NORMAL' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      setError('Please enter a description.');
      return;
    }
    setLoading(true); setError(null);
    try {
      await sendRequestToAdmin(form.subject, form.description, form.priority);
      onSuccess('Request sent to admin (app founder) successfully!');
      setForm({ subject: '', description: '', priority: 'NORMAL' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request to admin');
    } finally {
      setLoading(false);
    }
  };

  const SUBJECTS = [
    'Independent Expert Application',
    'Escalation Support Request',
    'Platform Issue / Bug Report',
    'Collaboration Proposal',
    'Policy Clarification',
    'Other',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 text-xs text-violet-800 flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Send a request directly to the CarePath AI admin (app founder). Use this for expert applications, escalations, or platform-level queries.</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
        <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
          <option value="">— Select subject (optional) —</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
        <textarea required rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe your request in detail. Include your expertise, credentials, and what you need from the platform admin…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
        <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send to Admin
      </button>
    </form>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ExpertRequests = () => {
  const [tab, setTab]           = useState('history');   // 'history' | 'to-hospital' | 'to-admin'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [successMsg, setSuccess] = useState(null);

  const loadRequests = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchExpertRequests();
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleSuccess = (msg) => {
    setSuccess(msg);
    setTab('history');
    loadRequests();
    setTimeout(() => setSuccess(null), 5000);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send requests to hospitals or directly to the admin (app founder)</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'history',     label: 'My Requests',       icon: ClipboardList },
          { id: 'to-hospital', label: 'Send to Hospital',  icon: Building2 },
          { id: 'to-admin',    label: 'Send to Admin',     icon: Shield },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'to-hospital' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Send Request to Hospital</h2>
          </div>
          <SendToHospitalForm onSuccess={handleSuccess} />
        </div>
      )}

      {tab === 'to-admin' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-violet-600" />
            <h2 className="text-sm font-semibold text-gray-900">Send Request to Admin (App Founder)</h2>
          </div>
          <SendToAdminForm onSuccess={handleSuccess} />
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">My Request History</h2>
            <button onClick={loadRequests} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {error && (
            <div className="px-5 py-3 text-sm text-red-700 bg-red-50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No requests yet</p>
              <p className="text-xs text-gray-400 mt-1">Use the tabs above to send your first request</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((req) => (
                <div key={req._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          req.requestType === 'HOSPITAL_REQUEST' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                        }`}>
                          {typeLabel[req.requestType] || req.requestType}
                        </span>
                        {req.hospitalId && (
                          <span className="text-xs text-gray-600 font-medium">{req.hospitalId.name}</span>
                        )}
                        {req.requestType === 'EXPERT_ESCALATION' && (
                          <span className="text-xs text-gray-600 font-medium">CarePath AI Admin</span>
                        )}
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${statusColor[req.status] || statusColor.PENDING}`}>
                          {req.status === 'PENDING' && <Clock className="w-3 h-3 inline mr-0.5" />}
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{req.description}</p>
                      {req.response?.message && (
                        <div className="mt-2 pl-3 border-l-2 border-gray-200">
                          <p className="text-xs text-gray-400 mb-0.5">Response:</p>
                          <p className="text-xs text-gray-600">{req.response.message}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                      <p className={`text-xs font-medium mt-1 ${
                        req.priority === 'URGENT' || req.priority === 'CRITICAL' ? 'text-red-500' :
                        req.priority === 'HIGH' ? 'text-amber-500' : 'text-gray-400'
                      }`}>{req.priority}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertRequests;
