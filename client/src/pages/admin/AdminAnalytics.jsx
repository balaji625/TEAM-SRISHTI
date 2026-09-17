/**
 * AdminAnalytics — CarePath AI
 * Platform-wide analytics for admin.
 */

import { useState, useEffect } from 'react';
import {
  BarChart2, RefreshCw, Loader2, AlertCircle,
  Users, Building2, Stethoscope, UserCheck, Calendar, ClipboardList,
} from 'lucide-react';
import { fetchAdminAnalytics } from '../../services/adminService';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center gap-3 mb-2">
      <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </span>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const ProgressBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value} <span className="text-gray-400">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const AdminAnalytics = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  const load = async () => {
    setLoad(true); setError(null);
    try {
      const res = await fetchAdminAnalytics();
      setData(res.data.analytics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
    </div>
  );

  const a = data || {};

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live overview of CarePath AI platform activity</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Top-level stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users}       label="Total Users"        value={a.users?.total}         sub={`${a.users?.active || 0} active · +${a.users?.newLast30Days || 0} last 30 days`} color="text-rose-600 bg-rose-50" />
        <StatCard icon={Building2}   label="Hospitals"          value={a.hospitals?.total}      sub={`${a.hospitals?.verified || 0} verified · ${a.hospitals?.pending || 0} pending`}   color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={Stethoscope} label="Professionals"      value={a.professionals?.total}  sub={`${a.professionals?.verified || 0} verified · ${a.professionals?.pending || 0} pending`} color="text-indigo-600 bg-indigo-50" />
        <StatCard icon={UserCheck}   label="Experts"            value={a.experts?.total}        sub={`${a.experts?.verified || 0} verified · ${a.experts?.pending || 0} pending`}        color="text-violet-600 bg-violet-50" />
        <StatCard icon={Calendar}    label="Total Appointments" value={a.appointments?.total}   sub={`${a.appointments?.last7Days || 0} last 7 days`}                                    color="text-blue-600 bg-blue-50" />
        <StatCard icon={ClipboardList} label="Requests"         value={a.requests?.total}       sub={`${a.requests?.pending || 0} pending`}                                              color="text-orange-600 bg-orange-50" />
      </div>

      {/* User roles breakdown */}
      {a.users?.byRole && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Users by Role</h2>
          <div className="space-y-3">
            {Object.entries(a.users.byRole).map(([role, count]) => {
              const colors = { USER: 'bg-rose-400', HOSPITAL: 'bg-emerald-400', PROFESSIONAL: 'bg-indigo-400', EXPERT: 'bg-violet-400', ADMIN: 'bg-gray-400' };
              return (
                <ProgressBar key={role} label={role} value={count} max={a.users.total} color={colors[role] || 'bg-gray-400'} />
              );
            })}
          </div>
        </div>
      )}

      {/* Verification overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Hospital Verification', data: a.hospitals, color: 'bg-emerald-400' },
          { label: 'Professional Verification', data: a.professionals, color: 'bg-indigo-400' },
          { label: 'Expert Verification', data: a.experts, color: 'bg-violet-400' },
        ].map(({ label, data: d, color }) => d && (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">{label}</h3>
            <div className="space-y-2">
              <ProgressBar label="Verified"  value={d.verified || 0} max={d.total || 0} color="bg-emerald-400" />
              <ProgressBar label="Pending"   value={d.pending || 0}  max={d.total || 0} color="bg-amber-400" />
              <ProgressBar label="Other"     value={Math.max(0, (d.total || 0) - (d.verified || 0) - (d.pending || 0))} max={d.total || 0} color="bg-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalytics;
