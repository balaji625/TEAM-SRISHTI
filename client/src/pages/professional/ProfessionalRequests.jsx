/**
 * ProfessionalRequests — CarePath AI
 *
 * Healthcare Professional: send requests to hospitals or view request history.
 * Route: /professional/requests
 */

import { useState, useEffect } from 'react';
import {
  ClipboardList, Building2, Send, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, RefreshCw, Info,
} from 'lucide-react';
import { fetchProfessionalRequests, sendProfessionalRequest } from '../../services/professionalService';
import api from '../../services/api';

const statusColor = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  RESOLVED:  'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const SendRequestForm = ({ onSuccess }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loadingH, setLoadingH]   = useState(true);
  const [form, setForm]           = useState({ hospitalId: '', description: '', priority: 'NORMAL', requestType: 'PROFESSIONAL_REQUEST' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    api.get('/search/hospitals', { params: { limit: 100 } })
      .then((r) => setHospitals(r.data?.data?.hospitals || []))
      .catch(() => setHospitals([]))
      .finally(() => setLoadingH(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { setError('Description is required'); return; }
    setLoading(true); setError(null);
    try {
      await sendProfessionalRequest({
        hospitalId:  form.hospitalId || undefined,
        description: form.description,
        priority:    form.priority,
        requestType: form.requestType,
      });
      onSuccess('Request sent successfully!');
      setForm({ hospitalId: '', description: '', priority: 'NORMAL', requestType: 'PROFESSIONAL_REQUEST' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800 flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Send a request to a hospital about professional services, consultations, or platform queries.</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Request Type</label>
        <select value={form.requestType} onChange={(e) => setForm((f) => ({ ...f, requestType: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="PROFESSIONAL_REQUEST">Professional Request</option>
          <option value="HOSPITAL_REQUEST">Hospital Enquiry</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Target Hospital (optional)</label>
        {loadingH ? (
          <p className="text-xs text-gray-400 py-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</p>
        ) : (
          <select value={form.hospitalId} onChange={(e) => setForm((f) => ({ ...f, hospitalId: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">— No specific hospital (general request) —</option>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>{h.name}{h.city ? ` · ${h.city}` : ''}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
        <textarea required rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe your request in detail…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
        <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send Request
      </button>
    </form>
  );
};

const ProfessionalRequests = () => {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [tab, setTab]             = useState('history');
  const [success, setSuccess]     = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchProfessionalRequests();
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSuccess = (msg) => {
    setSuccess(msg); setTab('history'); load();
    setTimeout(() => setSuccess(null), 5000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send requests to hospitals or view your request history</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'history', label: 'My Requests',   icon: ClipboardList },
          { id: 'new',     label: 'Send Request',  icon: Send },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">New Request</h2>
          <SendRequestForm onSuccess={handleSuccess} />
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Request History</h2>
            <button onClick={load} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5">
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
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No requests yet</p>
              <button onClick={() => setTab('new')}
                className="mt-3 text-xs text-indigo-600 font-medium underline">
                Send your first request →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((req) => (
                <div key={req._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                          {req.requestType?.replace('_', ' ')}
                        </span>
                        {req.hospitalId && (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Building2 className="w-3 h-3" /> {req.hospitalId.name}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[req.status] || statusColor.PENDING}`}>
                          {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{req.description}</p>
                      {req.response?.message && (
                        <div className="mt-2 pl-3 border-l-2 border-gray-200">
                          <p className="text-xs text-gray-400 mb-0.5">Response:</p>
                          <p className="text-xs text-gray-600">{req.response.message}</p>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                      <p className={`text-xs mt-1 ${req.priority === 'URGENT' ? 'text-red-500' : req.priority === 'HIGH' ? 'text-amber-500' : 'text-gray-400'}`}>
                        {req.priority}
                      </p>
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

export default ProfessionalRequests;
