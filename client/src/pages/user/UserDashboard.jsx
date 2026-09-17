/**
 * UserDashboard — CarePath AI
 *
 * Patient dashboard home page. Shows a personalised welcome, live stats,
 * a quick-actions panel, and a health profile summary. All data is fetched
 * from the real backend via /api/user/profile.
 *
 * UPGRADED: Adds NearbyHealthcare, CareJourney, ConnectivityBanner, Referrals nav.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Brain, Building2, Stethoscope, Calendar, FileText,
  Heart, Users, Bell, User, Shield, LogOut, Activity, AlertCircle,
  ChevronRight, Loader2, RefreshCw, ArrowRight, BookOpen, MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchProfile } from '../../services/userService';
import NearbyHealthcare from '../../components/common/NearbyHealthcare';
import CareJourneyCard from '../../components/common/CareJourneyCard';
import ConnectivityBanner from '../../components/common/ConnectivityBanner';

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',         to: '/user/dashboard' },
  { icon: Brain,           label: 'AI Assistant',      to: '/user/ai' },
  { icon: Building2,       label: 'Find Hospitals',    to: '/user/hospitals' },
  { icon: Stethoscope,     label: 'Professionals',     to: '/user/professionals' },
  { icon: Calendar,        label: 'Appointments',      to: '/user/appointments' },
  { icon: ArrowRight,      label: 'Referrals',         to: '/user/referrals' },
  { icon: BookOpen,        label: 'Health Passport',   to: '/user/passport' },
  { icon: FileText,        label: 'Health Reports',    to: '/user/reports' },
  { icon: Activity,        label: 'Health History',    to: '/user/history' },
  { icon: Heart,           label: 'Preventive Care',   to: '/user/preventive' },
  { icon: Users,           label: 'Expert Help',       to: '/user/experts' },
  { icon: AlertCircle,     label: 'Emergency',         to: '/user/emergency' },
  { icon: Bell,            label: 'Notifications',     to: '/user/notifications' },
  { icon: User,            label: 'Profile',           to: '/user/profile' },
  { icon: Shield,          label: 'Consent & Privacy', to: '/user/consent' },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
export const UserSidebar = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col py-4">
      {/* Logo */}
      <div className="px-4 mb-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600">
            <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-bold text-gray-900 text-sm">
            CarePath <span className="text-blue-600">AI</span>
          </span>
        </Link>
      </div>

      {/* User badge */}
      {user && (
        <div className="mx-3 mb-4 px-3 py-2.5 bg-blue-50 rounded-lg">
          <p className="text-xs font-semibold text-blue-700 truncate">{user.name}</p>
          <p className="text-xs text-blue-500 truncate">{user.email}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === to
                ? 'bg-blue-50 text-blue-700'
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

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, to }) => {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

// ── Health profile summary row ────────────────────────────────────────────────
const ProfileRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
    <span className="text-sm text-gray-800 text-right">{value || <span className="text-gray-400 italic">Not set</span>}</span>
  </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const UserDashboard = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfile();
      setProfile(data.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const displayUser = profile || authUser;
  const hp = profile?.healthProfile || {};

  // Greeting by time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Connectivity banner — non-blocking, shows only when offline */}
      <ConnectivityBanner />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {displayUser?.name?.split(' ')[0] || 'Patient'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's your health overview for today.
          </p>
        </div>
        <button onClick={loadProfile}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Calendar}  label="Upcoming Appointments" value="0" color="text-blue-600 bg-blue-50"    to="/user/appointments" />
        <StatCard icon={FileText}  label="Health Reports"        value="0" color="text-emerald-600 bg-emerald-50" to="/user/reports" />
        <StatCard icon={Bell}      label="Notifications"         value="0" color="text-purple-600 bg-purple-50"  to="/user/notifications" />
      </div>

      {/* Two-col: profile summary + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Profile summary card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Your Profile</h2>
            <Link to="/user/profile"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              Edit <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Avatar row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">
                {displayUser?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{displayUser?.name}</p>
              <p className="text-xs text-gray-500">{displayUser?.email}</p>
              {displayUser?.isVerified
                ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-0.5">✓ Verified</span>
                : <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">Pending verification</span>
              }
            </div>
          </div>

          <div className="space-y-0">
            <ProfileRow label="Phone"       value={profile?.phone} />
            <ProfileRow label="Gender"      value={profile?.gender?.replace(/_/g, ' ')} />
            <ProfileRow label="Location"    value={[profile?.location?.city, profile?.location?.country].filter(Boolean).join(', ')} />
            <ProfileRow label="Language"    value={profile?.language} />
          </div>
        </div>

        {/* Health profile summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Health Profile</h2>
            <Link to="/user/profile"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              Update <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-0">
            <ProfileRow label="Blood Type"           value={hp.bloodType} />
            <ProfileRow label="Allergies"            value={hp.allergies?.join(', ')} />
            <ProfileRow label="Chronic Conditions"   value={hp.chronicConditions?.join(', ')} />
            <ProfileRow label="Current Medications"  value={hp.currentMedications?.join(', ')} />
            <ProfileRow label="Emergency Contact"
              value={hp.emergencyContact?.name
                ? `${hp.emergencyContact.name} (${hp.emergencyContact.relationship || 'Contact'})`
                : null}
            />
          </div>

          {!hp.bloodType && !hp.allergies?.length && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
              Complete your health profile so CarePath AI can give you better recommendations.{' '}
              <Link to="/user/profile" className="underline font-medium">Fill it in →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <QuickAction icon={Brain}       label="Ask AI"           to="/user/ai"            color="text-violet-600 bg-violet-50" />
          <QuickAction icon={Building2}   label="Find Hospital"    to="/user/hospitals"     color="text-blue-600 bg-blue-50" />
          <QuickAction icon={Stethoscope} label="Professionals"    to="/user/professionals" color="text-cyan-600 bg-cyan-50" />
          <QuickAction icon={Calendar}    label="Appointments"     to="/user/appointments"  color="text-emerald-600 bg-emerald-50" />
          <QuickAction icon={ArrowRight}  label="Referrals"        to="/user/referrals"     color="text-cyan-600 bg-cyan-50" />
          <QuickAction icon={BookOpen}    label="Health Passport"  to="/user/passport"      color="text-indigo-600 bg-indigo-50" />
          <QuickAction icon={FileText}    label="Health Reports"   to="/user/reports"       color="text-orange-600 bg-orange-50" />
          <QuickAction icon={Users}       label="Expert Help"      to="/user/experts"       color="text-pink-600 bg-pink-50" />
        </div>
      </div>

      {/* New: Care Journey + Nearby Healthcare — two-column below quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CareJourneyCard />
        <NearbyHealthcare />
      </div>

      {/* AI disclaimer */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 leading-relaxed">
        <strong>CarePath AI reminder:</strong> AI-generated health information is for educational purposes only.
        Always consult a qualified healthcare professional before making medical decisions.
      </div>
    </div>
  );
};

export default UserDashboard;
