/**
 * ProfessionalConsultations — CarePath AI
 * Healthcare Professional: view consultation history and status.
 * Dynamic — fetches real data from /api/professional/appointments.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Calendar, User, Clock, CheckCircle, Loader2,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

const statusConfig = {
  PENDING:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED:   { label: 'Confirmed',   cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  ACTIVE:      { label: 'Active',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED:   { label: 'Cancelled',   cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  REJECTED:    { label: 'Rejected',    cls: 'bg-red-50 text-red-600 border-red-200' },
  RESCHEDULED: { label: 'Rescheduled', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const ALLOWED_TRANSITIONS = {
  PENDING:   ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  ACTIVE:    ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED:  [],
  RESCHEDULED: ['CONFIRMED', 'CANCELLED'],
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
    <span className={`flex items-center justify-center w-11 h-11 rounded-xl ${color}`}>
      <Icon className="w-5 h-5" />
    </span>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const ProfessionalConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/professional/appointments');
      setConsultations(res.data?.data?.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.put(`/professional/appointments/${id}/status`, { status: newStatus });
      setConsultations((prev) =>
        prev.map((c) => c._id === id ? { ...c, status: newStatus } : c)
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const total     = consultations.length;
  const completed = consultations.filter((c) => c.status === 'COMPLETED').length;
  const active    = consultations.filter((c) => ['ACTIVE', 'CONFIRMED'].includes(c.status)).length;
  const pending   = consultations.filter((c) => c.status === 'PENDING').length;

  const formatDateTime = (date, time) => {
    if (!date) return '—';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return time ? `${dateStr} · ${time}` : dateStr;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Consultations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your consultation history and upcoming sessions</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Total"     value={total}     color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={CheckCircle}   label="Completed" value={completed} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Loader2}       label="Active"    value={active}    color="bg-blue-50 text-blue-600" />
        <StatCard icon={Clock}         label="Pending"   value={pending}   color="bg-amber-50 text-amber-600" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Recent Consultations</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : consultations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-700">No consultations yet</p>
            <p className="text-xs text-gray-400 mt-1">Consultations will appear here once patients book with you.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Patient', 'Reason', 'Date & Time', 'Mode', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consultations.map((c) => {
                  const s = statusConfig[c.status] || statusConfig.PENDING;
                  const transitions = ALLOWED_TRANSITIONS[c.status] || [];
                  const patientName = c.userId?.name || 'Unknown Patient';
                  return (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                            {patientName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800">{patientName}</p>
                            {c.userId?.email && <p className="text-xs text-gray-400">{c.userId.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">{c.reason || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {formatDateTime(c.date, c.time)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {c.consultationType?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {transitions.length > 0 ? (
                          <select
                            disabled={updating === c._id}
                            onChange={(e) => e.target.value && handleStatusChange(c._id, e.target.value)}
                            value=""
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer disabled:opacity-50"
                          >
                            <option value="" disabled>Change…</option>
                            {transitions.map((t) => (
                              <option key={t} value={t}>{statusConfig[t]?.label || t}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalConsultations;
