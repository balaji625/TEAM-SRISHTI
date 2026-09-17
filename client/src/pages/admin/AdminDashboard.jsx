/**
 * AdminDashboard — CarePath AI
 *
 * Platform administration dashboard.
 * Shows live platform stats, pending verification queues for hospitals,
 * professionals, and experts with approve/reject actions.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Stethoscope, UserCheck,
  Calendar, ClipboardList, ShieldCheck, BarChart2, ScrollText,
  Settings, Heart, LogOut, Brain,
  Loader2, AlertCircle, RefreshCw, CheckCircle, XCircle,
  ChevronRight, Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOverview,
  fetchPendingHospitals,
  fetchPendingProfessionals,
  fetchPendingExperts,
  verifyHospital,
  verifyProfessional,
  verifyExpert,
} from '../../services/adminService';

// ── Sidebar nav ───────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',            to: '/admin/dashboard' },
  { icon: Users,           label: 'Users',                to: '/admin/users' },
  { icon: Building2,       label: 'Hospitals',            to: '/admin/hospitals' },
  { icon: ShieldCheck,     label: 'Hospital Verify',      to: '/admin/hospitals/verify' },
  { icon: Stethoscope,     label: 'Professionals',        to: '/admin/professionals' },
  { icon: ShieldCheck,     label: 'Prof. Verify',         to: '/admin/professionals/verify' },
  { icon: UserCheck,       label: 'Experts',              to: '/admin/experts' },
  { icon: ShieldCheck,     label: 'Expert Verify',        to: '/admin/experts/verify' },
  { icon: Calendar,        label: 'Appointments',         to: '/admin/appointments' },
  { icon: ClipboardList,   label: 'Requests',             to: '/admin/requests' },
  { icon: Brain,           label: 'AI Safety',            to: '/admin/ai-safety' },
  { icon: BarChart2,       label: 'Analytics',            to: '/admin/analytics' },
  { icon: ScrollText,      label: 'Audit Logs',           to: '/admin/audit-logs' },
  { icon: Settings,        label: 'Settings',             to: '/admin/settings' },
];

export const AdminSidebar = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col py-4">
      <div className="px-4 mb-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-rose-600">
            <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-bold text-gray-900 text-sm">
            CarePath <span className="text-rose-600">AI</span>
          </span>
        </Link>
        <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-700">
          Admin Panel
        </span>
      </div>
      {user && (
        <div className="mx-3 mb-4 px-3 py-2 bg-rose-50 rounded-lg">
          <p className="text-xs font-semibold text-rose-700 truncate">{user.name}</p>
          <p className="text-xs text-rose-400 truncate">{user.email}</p>
        </div>
      )}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === to ? 'bg-rose-50 text-rose-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            <Icon className="w-4 h-4 shrink-0" />{label}
          </Link>
        ))}
      </nav>
      <div className="px-2 pt-2 border-t border-gray-100">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, to }) => {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-1">
        <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${color}`}><Icon className="w-5 h-5" /></span>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
      {sub != null && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

// ── Pending item row ──────────────────────────────────────────────────────────
const PendingRow = ({ item, type, onVerify }) => {
  const [busy, setBusy] = useState(false);

  const act = async (action) => {
    setBusy(true);
    try { await onVerify(item._id, action); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-rose-600">{(item.name || '?').charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {type === 'hospital' ? (item.email || item.city) : item.specialization}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button disabled={busy} onClick={() => act('approve')}
          className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md font-medium transition-colors disabled:opacity-50">
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
        </button>
        <button disabled={busy} onClick={() => act('reject')}
          className="flex items-center gap-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-md font-medium transition-colors disabled:opacity-50">
          <XCircle className="w-3 h-3" /> Reject
        </button>
      </div>
    </div>
  );
};

// ── Pending section card ──────────────────────────────────────────────────────
const PendingCard = ({ title, icon: Icon, items, type, onVerify, to }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-rose-600" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {items.length > 0 && (
          <span className="text-xs font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">{items.length}</span>
        )}
      </div>
      <Link to={to} className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium">
        View all <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
    {items.length > 0 ? (
      items.slice(0, 4).map((item) => (
        <PendingRow key={item._id} item={item} type={type} onVerify={onVerify} />
      ))
    ) : (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <CheckCircle className="w-8 h-8 text-emerald-200 mb-2" />
        <p className="text-sm text-gray-400">All caught up!</p>
      </div>
    )}
  </div>
);

// ── Main Admin Dashboard ───────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user: authUser } = useAuth();
  const [overview, setOverview]     = useState(null);
  const [pendingH, setPendingH]     = useState([]);
  const [pendingP, setPendingP]     = useState([]);
  const [pendingE, setPendingE]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const loadAll = async () => {
    setLoading(true); setError(null);
    try {
      const [ov, ph, pp, pe] = await Promise.all([
        fetchOverview(),
        fetchPendingHospitals(),
        fetchPendingProfessionals(),
        fetchPendingExperts(),
      ]);
      setOverview(ov.data.overview);
      setPendingH(ph.data.hospitals || []);
      setPendingP(pp.data.professionals || []);
      setPendingE(pe.data.experts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // After an approve/reject action, reload pending queues + overview
  const handleVerifyHospital = async (id, action) => {
    await verifyHospital(id, action);
    const [ov, ph] = await Promise.all([fetchOverview(), fetchPendingHospitals()]);
    setOverview(ov.data.overview);
    setPendingH(ph.data.hospitals || []);
  };

  const handleVerifyProfessional = async (id, action) => {
    await verifyProfessional(id, action);
    const [ov, pp] = await Promise.all([fetchOverview(), fetchPendingProfessionals()]);
    setOverview(ov.data.overview);
    setPendingP(pp.data.professionals || []);
  };

  const handleVerifyExpert = async (id, action) => {
    await verifyExpert(id, action);
    const [ov, pe] = await Promise.all([fetchOverview(), fetchPendingExperts()]);
    setOverview(ov.data.overview);
    setPendingE(pe.data.experts || []);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {authUser?.name || 'Admin'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview, verifications, and audit.</p>
        </div>
        <button onClick={loadAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Pending alert banner */}
      {overview?.totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span><strong>{overview.totalPending}</strong> items are awaiting verification.</span>
        </div>
      )}

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Total Users"        value={overview?.users.total}         sub={`${overview?.users.active} active`}     color="text-rose-600 bg-rose-50" to="/admin/users" />
        <StatCard icon={Building2}   label="Hospitals"          value={overview?.hospitals.total}      sub={`${overview?.hospitals.pendingVerification} pending`} color="text-blue-600 bg-blue-50" to="/admin/hospitals" />
        <StatCard icon={Stethoscope} label="Professionals"      value={overview?.professionals.total}  sub={`${overview?.professionals.pendingVerification} pending`} color="text-indigo-600 bg-indigo-50" to="/admin/professionals" />
        <StatCard icon={UserCheck}   label="Experts"            value={overview?.experts.total}        sub={`${overview?.experts.pendingVerification} pending`} color="text-violet-600 bg-violet-50" to="/admin/experts" />
      </div>

      {/* Pending verification queues — 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PendingCard
          title="Pending Hospitals" icon={Building2}
          items={pendingH} type="hospital" onVerify={handleVerifyHospital}
          to="/admin/hospitals/verify"
        />
        <PendingCard
          title="Pending Professionals" icon={Stethoscope}
          items={pendingP} type="professional" onVerify={handleVerifyProfessional}
          to="/admin/professionals/verify"
        />
        <PendingCard
          title="Pending Experts" icon={UserCheck}
          items={pendingE} type="expert" onVerify={handleVerifyExpert}
          to="/admin/experts/verify"
        />
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,      label: 'Manage Users',    to: '/admin/users',      color: 'text-rose-600 bg-rose-50' },
          { icon: ScrollText, label: 'Audit Logs',      to: '/admin/audit-logs', color: 'text-gray-600 bg-gray-100' },
          { icon: Brain,      label: 'AI Safety',       to: '/admin/ai-safety',  color: 'text-violet-600 bg-violet-50' },
          { icon: BarChart2,  label: 'Analytics',       to: '/admin/analytics',  color: 'text-blue-600 bg-blue-50' },
        ].map(({ icon: Icon, label, to, color }) => (
          <Link key={to} to={to} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow">
            <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${color}`}><Icon className="w-4 h-4" /></span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
