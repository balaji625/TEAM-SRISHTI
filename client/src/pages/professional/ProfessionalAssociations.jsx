/**
 * ProfessionalAssociations — CarePath AI
 *
 * Healthcare Professional: view all hospital associations and request to join new hospitals.
 * Route: /professional/associations
 */

import { useState, useEffect } from 'react';
import {
  Link2, Building2, CheckCircle, XCircle, Clock, Search, Send,
  Loader2, AlertCircle, RefreshCw, Info,
} from 'lucide-react';
import { fetchAssociations, requestHospitalAssociation } from '../../services/professionalService';
import api from '../../services/api';

const statusColor = {
  PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  REMOVED:  'bg-gray-100 text-gray-500 border-gray-200',
};

const AssocRow = ({ assoc }) => {
  const hospital = assoc.hospitalId;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
        <Building2 className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{hospital?.name || 'Unknown Hospital'}</p>
        <p className="text-xs text-gray-500">{[hospital?.city, hospital?.country].filter(Boolean).join(', ')}</p>
        {assoc.department && <p className="text-xs text-gray-400">Dept: {assoc.department}</p>}
      </div>
      <div className="text-right shrink-0">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[assoc.status] || statusColor.PENDING}`}>
          {assoc.status === 'PENDING' && <Clock className="w-3 h-3" />}
          {assoc.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
          {assoc.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
          {assoc.status}
        </span>
        <p className="text-xs text-gray-400 mt-0.5">{new Date(assoc.requestedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

const RequestForm = ({ onSuccess }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loadingH, setLoadingH]   = useState(true);
  const [form, setForm]           = useState({ hospitalId: '', department: '', role: '' });
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
    if (!form.hospitalId) { setError('Please select a hospital'); return; }
    setLoading(true); setError(null);
    try {
      await requestHospitalAssociation(form.hospitalId, form.department, form.role);
      onSuccess('Association request sent! The hospital will review it.');
      setForm({ hospitalId: '', department: '', role: '' });
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
        <span>Select a hospital and submit your association request. The hospital admin will approve or reject it.</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Select Hospital <span className="text-red-500">*</span></label>
        {loadingH ? (
          <p className="text-xs text-gray-400 py-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading hospitals…</p>
        ) : (
          <select required value={form.hospitalId} onChange={(e) => setForm((f) => ({ ...f, hospitalId: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">— Choose a hospital —</option>
            {hospitals.map((h) => (
              <option key={h._id} value={h._id}>{h.name}{h.city ? ` · ${h.city}` : ''}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
          <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="e.g. Cardiology"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Role / Position</label>
          <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="e.g. Consultant"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send Association Request
      </button>
    </form>
  );
};

const ProfessionalAssociations = () => {
  const [associations, setAssoc]   = useState([]);
  const [loading, setLoading]      = useState(true);
  const [error, setError]          = useState(null);
  const [tab, setTab]              = useState('list');
  const [success, setSuccess]      = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchAssociations();
      setAssoc(res.data.associations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSuccess = (msg) => {
    setSuccess(msg); setTab('list'); load();
    setTimeout(() => setSuccess(null), 5000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Associations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your hospital affiliations and request new ones</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'list',    label: 'My Associations', icon: Link2 },
          { id: 'request', label: 'Request to Join',  icon: Building2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'request' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Request Hospital Association</h2>
          <RequestForm onSuccess={handleSuccess} />
        </div>
      )}

      {tab === 'list' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Your Associations <span className="text-gray-400 font-normal">({associations.length})</span>
            </h2>
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
          ) : associations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Link2 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No hospital associations yet</p>
              <button onClick={() => setTab('request')}
                className="mt-3 text-xs text-indigo-600 font-medium underline">
                Request to join a hospital →
              </button>
            </div>
          ) : (
            <div className="px-5">
              {associations.map((a) => <AssocRow key={a._id} assoc={a} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalAssociations;
