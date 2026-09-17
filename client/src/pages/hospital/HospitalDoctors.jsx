/**
 * HospitalDoctors — CarePath AI
 * Hospital manages its associated doctors (professionals).
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Stethoscope, RefreshCw, Loader2, AlertCircle,
  Clock, CheckCircle, XCircle, UserMinus,
} from 'lucide-react';
import { fetchDoctors } from '../../services/hospitalService';

const STATUS_CFG = {
  APPROVED:  { label: 'Active',    cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle },
  PENDING:   { label: 'Pending',   cls: 'text-amber-700 bg-amber-50 border-amber-200',       icon: Clock },
  REJECTED:  { label: 'Rejected',  cls: 'text-red-700 bg-red-50 border-red-200',             icon: XCircle },
  REMOVED:   { label: 'Removed',   cls: 'text-gray-600 bg-gray-50 border-gray-200',          icon: UserMinus },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.APPROVED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

const DoctorCard = ({ doctor, assocStatus }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-emerald-700">
          {doctor.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">{doctor.name}</p>
          <StatusBadge status={assocStatus || 'APPROVED'} />
        </div>
        <p className="text-xs text-emerald-700 font-medium">{doctor.specialization}</p>
        {doctor.qualification && <p className="text-xs text-gray-500 mt-0.5">{doctor.qualification}</p>}
        {doctor.experience > 0 && (
          <p className="text-xs text-gray-400 mt-1">{doctor.experience} years experience</p>
        )}
        {doctor.email && <p className="text-xs text-gray-400 truncate">{doctor.email}</p>}
        {doctor.phone && <p className="text-xs text-gray-400">{doctor.phone}</p>}
      </div>
    </div>

    {doctor.consultationModes?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {doctor.consultationModes.map((m) => (
          <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {m.replace('_', ' ')}
          </span>
        ))}
      </div>
    )}
  </div>
);

const HospitalDoctors = () => {
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [statusFilter, setStatus] = useState('APPROVED');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDoctors(statusFilter);
      setDoctors(res.data?.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500 mt-1">Healthcare professionals associated with your hospital.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link to="/hospital/associations"
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors">
            Manage Associations
          </Link>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['APPROVED', 'PENDING', 'REJECTED', 'REMOVED'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {STATUS_CFG[s]?.label || s}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-xl text-center">
          <Stethoscope className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No doctors with {STATUS_CFG[statusFilter]?.label} status</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter === 'PENDING'
              ? 'No pending association requests from doctors.'
              : 'Doctors can request to associate with your hospital from their own dashboard.'}
          </p>
          {statusFilter !== 'PENDING' && (
            <Link to="/hospital/associations" className="mt-3 text-xs text-emerald-600 underline font-medium">
              View all association requests
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doctors.map((d) => (
              <DoctorCard key={d._id} doctor={d} assocStatus={statusFilter} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HospitalDoctors;
