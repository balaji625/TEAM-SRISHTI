/**
 * HospitalAnalytics — CarePath AI
 * Summary analytics dashboard for the hospital.
 */

import { useState, useEffect } from 'react';
import {
  BarChart2, Calendar, Users, ClipboardList, CheckCircle, Clock,
  XCircle, Loader2, AlertCircle, RefreshCw, TrendingUp,
} from 'lucide-react';
import { fetchHospitalAnalytics } from '../../services/hospitalService';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center gap-3 mb-2">
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </span>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const ProgressBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value} <span className="text-gray-400">({pct}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const HospitalAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHospitalAnalytics();
      setAnalytics(res.data?.analytics || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your hospital's activity and performance.</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {!analytics ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-xl text-center">
          <BarChart2 className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No data available</p>
          <p className="text-xs text-gray-400 mt-1">Create your hospital profile to start tracking analytics.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Calendar}     label="Total Appointments"  value={analytics.appointments?.total}
              color="text-blue-600 bg-blue-50" sub={`${analytics.appointments?.last7Days} in last 7 days`} />
            <StatCard icon={Users}        label="Active Doctors"       value={analytics.doctors?.total}
              color="text-emerald-600 bg-emerald-50" sub={`${analytics.doctors?.pendingAssociations} pending`} />
            <StatCard icon={ClipboardList} label="Total Requests"      value={analytics.requests?.total}
              color="text-purple-600 bg-purple-50" sub={`${analytics.requests?.pending} pending`} />
            <StatCard icon={TrendingUp}   label="Completed"            value={analytics.appointments?.completed}
              color="text-orange-600 bg-orange-50" sub="all time" />
          </div>

          {/* Appointment breakdown */}
          {analytics.appointments?.total > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Appointment Breakdown
              </h2>
              <ProgressBar label="Pending"   value={analytics.appointments.pending}   total={analytics.appointments.total} color="bg-amber-400" />
              <ProgressBar label="Confirmed" value={analytics.appointments.confirmed} total={analytics.appointments.total} color="bg-emerald-500" />
              <ProgressBar label="Completed" value={analytics.appointments.completed} total={analytics.appointments.total} color="bg-blue-500" />
              <ProgressBar label="Cancelled" value={analytics.appointments.cancelled} total={analytics.appointments.total} color="bg-gray-400" />
            </div>
          )}

          {/* Doctors summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Doctors Summary
            </h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-emerald-700">{analytics.doctors?.total}</p>
                <p className="text-xs text-emerald-600 mt-1">Active Doctors</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-700">{analytics.doctors?.pendingAssociations}</p>
                <p className="text-xs text-amber-600 mt-1">Pending Requests</p>
              </div>
            </div>
          </div>

          {/* Verification status */}
          <div className={`rounded-xl p-4 text-sm ${
            analytics.verificationStatus === 'VERIFIED'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : analytics.verificationStatus === 'PENDING'
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <strong>Verification Status:</strong> {analytics.verificationStatus}
            {analytics.verificationStatus === 'PENDING' && ' — Your hospital is awaiting admin verification.'}
            {analytics.verificationStatus === 'VERIFIED' && ' — Your hospital is verified and visible to patients.'}
          </div>
        </>
      )}
    </div>
  );
};

export default HospitalAnalytics;
