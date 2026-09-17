/**
 * HospitalDashboard — CarePath AI
 *
 * Dashboard home for hospital accounts. Shows verification status banner,
 * overview stats, doctor roster, and quick-action links.
 * All data from /api/hospital/profile and /api/hospital/doctors.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, UserPlus, Link2, Calendar,
  ClipboardList, BarChart2, Bell, Settings, Heart, LogOut,
  ChevronRight, Loader2, AlertCircle, RefreshCw, CheckCircle,
  Clock, XCircle, Stethoscope, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchHospitalProfile, fetchDoctors } from '../../services/hospitalService';

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',          to: '/hospital/dashboard' },
  { icon: Building2,       label: 'Hospital Profile',   to: '/hospital/profile' },
  { icon: Users,           label: 'Doctors',            to: '/hospital/doctors' },
  { icon: UserPlus,        label: 'Add Doctor',         to: '/hospital/doctors/add' },
  { icon: Link2,           label: 'Associations',       to: '/hospital/associations' },
  { icon: Calendar,        label: 'Appointments',       to: '/hospital/appointments' },
  { icon: ArrowRight,      label: 'Referrals',          to: '/hospital/referrals' },
  { icon: ClipboardList,   label: 'Requests',           to: '/hospital/requests' },
  { icon: BarChart2,       label: 'Analytics',          to: '/hospital/analytics' },
  { icon: Bell,            label: 'Notifications',      to: '/hospital/notifications' },
  { icon: Settings,        label: 'Settings',           to: '/hospital/settings' },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
export const HospitalSidebar = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col py-4">
      {/* Logo */}
      <div className="px-4 mb-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-600">
            <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-bold text-gray-900 text-sm">
            CarePath <span className="text-emerald-600">AI</span>
          </span>
        </Link>
      </div>

      {/* User badge */}
      {user && (
        <div className="mx-3 mb-4 px-3 py-2.5 bg-emerald-50 rounded-lg">
          <p className="text-xs font-semibold text-emerald-700 truncate">{user.name}</p>
          <p className="text-xs text-emerald-500 truncate">{user.email}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === to
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}>
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 pt-2 border-t border-gray-100">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
};

// ── Verification status banner ────────────────────────────────────────────────
const VerificationBanner = ({ status }) => {
  if (!status) return null;
  const configs = {
    PENDING: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: Clock,
      msg: 'Your hospital profile is pending admin verification. You can still fill in your details while waiting.',
    },
    VERIFIED: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      icon: CheckCircle,
      msg: 'Your hospital is verified and visible to patients on CarePath AI.',
    },
    REJECTED: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: XCircle,
      msg: 'Your hospital verification was rejected. Please update your profile and contact support.',
    },
    SUSPENDED: {
      bg: 'bg-gray-50 border-gray-200',
      text: 'text-gray-700',
      icon: AlertCircle,
      msg: 'Your hospital account has been suspended. Please contact support.',
    },
  };
  const cfg = configs[status] || configs.PENDING;
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold capitalize mr-1">{status.toLowerCase()}:</span>
        {cfg.msg}
      </div>
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, to }) => {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

// ── Quick-action card ─────────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, to, color }) => (
  <Link to={to}
    className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm hover:border-gray-300 transition-all group">
    <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}>
      <Icon className="w-5 h-5" />
    </span>
    <span className="text-xs font-medium text-gray-700 text-center group-hover:text-gray-900">{label}</span>
  </Link>
);

// ── Doctor row ────────────────────────────────────────────────────────────────
const DoctorRow = ({ doctor }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-emerald-600">
        {doctor.name?.charAt(0)?.toUpperCase() || '?'}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{doctor.name}</p>
      <p className="text-xs text-gray-500">{doctor.specialization}</p>
    </div>
    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
      {doctor.experience ? `${doctor.experience} yrs` : 'Active'}
    </span>
  </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const HospitalDashboard = () => {
  const { user: authUser } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, docRes] = await Promise.all([
        fetchHospitalProfile(),
        fetchDoctors('APPROVED'),
      ]);
      setHospital(profRes.data.hospital);
      setDoctors(docRes.data.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {hospital?.name || authUser?.name || 'Hospital'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your hospital profile, doctors, and appointments.
          </p>
        </div>
        <button onClick={loadData}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Verification banner */}
      {hospital
        ? <VerificationBanner status={hospital.verificationStatus} />
        : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              You haven't set up your hospital profile yet.{' '}
              <Link to="/hospital/profile" className="underline font-medium">Complete it now →</Link>
            </span>
          </div>
        )
      }

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users}       label="Active Doctors"        value={doctors.length} color="text-emerald-600 bg-emerald-50" to="/hospital/doctors" />
        <StatCard icon={Calendar}    label="Appointments Today"    value="0"              color="text-blue-600 bg-blue-50"    to="/hospital/appointments" />
        <StatCard icon={ClipboardList} label="Pending Requests"   value="0"              color="text-purple-600 bg-purple-50" to="/hospital/requests" />
      </div>

      {/* Two-col: profile summary + doctor list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Hospital info card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Hospital Info</h2>
            <Link to="/hospital/profile"
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              {hospital ? 'Edit' : 'Create'} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {hospital ? (
            <div className="space-y-2">
              {[
                { label: 'Name',       value: hospital.name },
                { label: 'Email',      value: hospital.email },
                { label: 'Phone',      value: hospital.phone },
                { label: 'City',       value: hospital.city },
                { label: 'Country',    value: hospital.country },
                { label: 'Emergency',  value: hospital.emergencyAvailable ? 'Available 24/7' : 'Not available' },
                { label: 'Specialties', value: hospital.specialties?.slice(0, 3).join(', ') },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 text-right">
                    {value || <span className="text-gray-400 italic text-xs">Not set</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No profile yet</p>
              <Link to="/hospital/profile"
                className="mt-2 text-xs text-emerald-600 underline font-medium">
                Create hospital profile
              </Link>
            </div>
          )}
        </div>

        {/* Doctor list */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Active Doctors</h2>
            <Link to="/hospital/doctors"
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {doctors.length > 0 ? (
            <div>
              {doctors.slice(0, 5).map((doc) => (
                <DoctorRow key={doc._id} doctor={doc} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Stethoscope className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No doctors associated yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Doctors can request association from their dashboard.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <QuickAction icon={Building2}     label="Edit Profile"      to="/hospital/profile"      color="text-emerald-600 bg-emerald-50" />
          <QuickAction icon={Users}         label="Doctors"           to="/hospital/doctors"      color="text-blue-600 bg-blue-50" />
          <QuickAction icon={Link2}         label="Associations"      to="/hospital/associations" color="text-violet-600 bg-violet-50" />
          <QuickAction icon={Calendar}      label="Appointments"      to="/hospital/appointments" color="text-orange-600 bg-orange-50" />
          <QuickAction icon={ClipboardList} label="Requests"          to="/hospital/requests"     color="text-pink-600 bg-pink-50" />
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
