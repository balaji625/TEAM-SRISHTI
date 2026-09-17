/**
 * AdminAppointments — CarePath AI
 * Admin: view all appointments across the platform.
 */

import { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { fetchAdminAppointments } from '../../services/adminService';

const statusColor = {
  PENDING:     'bg-amber-50 text-amber-700',
  CONFIRMED:   'bg-blue-50 text-blue-700',
  COMPLETED:   'bg-emerald-50 text-emerald-700',
  CANCELLED:   'bg-gray-100 text-gray-500',
  REJECTED:    'bg-red-50 text-red-700',
  RESCHEDULED: 'bg-violet-50 text-violet-700',
};

const AdminAppointments = () => {
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [statusF, setStatusF] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: 20 };
      if (statusF) params.status = statusF;
      const res = await fetchAdminAppointments(params);
      setItems(res.data.appointments || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [page, statusF]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total appointments</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex gap-3">
        <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400">
          <option value="">All Statuses</option>
          {['PENDING','CONFIRMED','COMPLETED','CANCELLED','REJECTED','RESCHEDULED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-rose-500 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No appointments found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((apt) => (
                <tr key={apt._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm">
                    <p>{apt.userId?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{apt.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{apt.hospitalId?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{apt.professionalId?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : new Date(apt.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

export default AdminAppointments;
