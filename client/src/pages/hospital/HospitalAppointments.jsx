/**
 * HospitalAppointments — CarePath AI
 * Hospital view of all appointments — list, filter, and update statuses.
 */

import { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle, XCircle, Clock, RefreshCw, Loader2,
  AlertCircle, User, Stethoscope, ChevronDown,
} from 'lucide-react';
import {
  fetchHospitalAppointments, updateAppointmentStatus,
} from '../../services/hospitalService';

const STATUS_CFG = {
  PENDING:     { label: 'Pending',     cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  CONFIRMED:   { label: 'Confirmed',   cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  COMPLETED:   { label: 'Completed',   cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  CANCELLED:   { label: 'Cancelled',   cls: 'text-gray-600 bg-gray-50 border-gray-200' },
  REJECTED:    { label: 'Rejected',    cls: 'text-red-700 bg-red-50 border-red-200' },
  RESCHEDULED: { label: 'Rescheduled', cls: 'text-purple-700 bg-purple-50 border-purple-200' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
  );
};

const AppointmentRow = ({ appt, onStatusUpdate }) => {
  const [open, setOpen] = useState(false);
  const date = new Date(appt.date);

  const nextStatuses = {
    PENDING:   ['CONFIRMED', 'REJECTED'],
    CONFIRMED: ['COMPLETED', 'CANCELLED'],
  };

  const actions = nextStatuses[appt.status] || [];

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 py-4 px-4">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                <span className="text-gray-500 font-normal ml-2">at {appt.time}</span>
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                {appt.userId && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {appt.userId.name}
                  </span>
                )}
                {appt.professionalId && (
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> {appt.professionalId.name}
                  </span>
                )}
                <span className="text-gray-400">{appt.consultationType?.replace('_', ' ')}</span>
              </p>
            </div>
            <StatusBadge status={appt.status} />
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{appt.reason}</p>

          {actions.length > 0 && (
            <div className="flex gap-2 mt-2">
              {actions.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusUpdate(appt._id, s)}
                  className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                    s === 'CONFIRMED' || s === 'COMPLETED'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'border border-red-200 text-red-600 hover:bg-red-50'
                  }`}>
                  {STATUS_CFG[s]?.label || s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HospitalAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusFilter, setStatus]       = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await fetchHospitalAppointments(params);
      setAppointments(res.data?.appointments || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">{total} appointment{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {s ? STATUS_CFG[s]?.label : 'All'}
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
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Calendar className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-700">No appointments</p>
            <p className="text-xs text-gray-400 mt-1">Appointments booked by patients will appear here.</p>
          </div>
        ) : (
          appointments.map((a) => (
            <AppointmentRow key={a._id} appt={a} onStatusUpdate={handleStatusUpdate} />
          ))
        )}
      </div>
    </div>
  );
};

export default HospitalAppointments;
