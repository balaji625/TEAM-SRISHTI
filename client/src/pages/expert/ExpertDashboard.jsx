/**
 * ExpertDashboard — CarePath AI
 *
 * Dashboard for independent healthcare expert accounts.
 * Shows verification status, profile summary, consultation modes, quick actions.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, Award, Clock, ClipboardList,
  MessageSquare, Bell, Settings, Heart, LogOut,
  ChevronRight, Loader2, AlertCircle, RefreshCw,
  CheckCircle, XCircle, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchExpertProfile } from '../../services/expertService';

// ── Sidebar nav ───────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/expert/dashboard' },
  { icon: User,            label: 'Profile',       to: '/expert/profile' },
  { icon: Award,           label: 'Credentials',  to: '/expert/credentials' },
  { icon: Clock,           label: 'Availability', to: '/expert/availability' },
  { icon: ClipboardList,   label: 'Requests',     to: '/expert/requests' },
  { icon: MessageSquare,   label: 'Consultations',to: '/expert/consultations' },
  { icon: TrendingUp,      label: 'Escalations',  to: '/expert/escalations' },
  { icon: Bell,            label: 'Notifications',to: '/expert/notifications' },
  { icon: Settings,        label: 'Settings',     to: '/expert/settings' },
];

export const ExpertSidebar = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col py-4">
      <div className="px-4 mb-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-violet-600">
            <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-bold text-gray-900 text-sm">
            CarePath <span className="text-violet-600">AI</span>
          </span>
        </Link>
      </div>
      {user && (
        <div className="mx-3 mb-4 px-3 py-2.5 bg-violet-50 rounded-lg">
          <p className="text-xs font-semibold text-violet-700 truncate">{user.name}</p>
          <p className="text-xs text-violet-500 truncate">{user.email}</p>
        </div>
      )}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === to ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

// ── Verification banner ───────────────────────────────────────────────────────
const VerificationBanner = ({ status }) => {
  const cfgs = {
    PENDING:   { bg: 'bg-amber-50 border-amber-200 text-amber-800',    icon: Clock,       msg: 'Pending admin verification. Complete your profile while you wait.' },
    VERIFIED:  { bg: 'bg-violet-50 border-violet-200 text-violet-800', icon: CheckCircle, msg: 'Your expert profile is verified. You can accept consultation requests.' },
    REJECTED:  { bg: 'bg-red-50 border-red-200 text-red-800',          icon: XCircle,     msg: 'Verification rejected. Update your credentials and contact support.' },
    SUSPENDED: { bg: 'bg-gray-50 border-gray-200 text-gray-700',       icon: AlertCircle, msg: 'Account suspended. Contact support.' },
  };
  const cfg = cfgs[status] || cfgs.PENDING;
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${cfg.bg}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <span><strong className="capitalize mr-1">{status?.toLowerCase()}:</strong>{cfg.msg}</span>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, to }) => {
  const inner = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}><Icon className="w-5 h-5" /></span>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

const QuickAction = ({ icon: Icon, label, to, color }) => (
  <Link to={to} className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm hover:border-gray-300 transition-all group">
    <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}><Icon className="w-5 h-5" /></span>
    <span className="text-xs font-medium text-gray-700 text-center group-hover:text-gray-900">{label}</span>
  </Link>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const ExpertDashboard = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchExpertProfile();
      setProfile(res.data.profile);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {profile?.name || authUser?.name || 'Expert'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your expert profile and consultation requests.</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {profile
        ? <VerificationBanner status={profile.verificationStatus} />
        : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Create your expert profile to start accepting consultations.{' '}
              <Link to="/expert/profile" className="underline font-medium">Complete profile →</Link>
            </span>
          </div>
        )
      }

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ClipboardList}  label="Pending Requests"    value="0" color="text-violet-600 bg-violet-50"  to="/expert/requests" />
        <StatCard icon={MessageSquare}  label="Active Consultations" value="0" color="text-blue-600 bg-blue-50"     to="/expert/consultations" />
        <StatCard icon={TrendingUp}     label="Escalations"          value="0" color="text-orange-600 bg-orange-50" to="/expert/escalations" />
      </div>

      {/* Profile summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Expert Info</h2>
          <Link to="/expert/profile" className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
            {profile ? 'Edit' : 'Create'} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {profile ? (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-violet-600">{profile.name?.charAt(0)?.toUpperCase() || '?'}</span>
            </div>
            <div className="flex-1 space-y-0">
              <p className="font-semibold text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-500 mb-3">{profile.specialization}</p>
              {[
                { label: 'Qualification',  value: profile.qualification },
                { label: 'Experience',     value: profile.experience != null ? `${profile.experience} years` : null },
                { label: 'Consult Modes',  value: profile.consultationModes?.join(', ') },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 text-right">{value || <span className="text-gray-400 italic text-xs">Not set</span>}</span>
                </div>
              ))}
              {profile.bio && (
                <p className="text-xs text-gray-600 mt-3 leading-relaxed line-clamp-3">{profile.bio}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No expert profile yet</p>
            <Link to="/expert/profile" className="mt-2 text-xs text-violet-600 underline font-medium">Create profile</Link>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <QuickAction icon={User}          label="Edit Profile"    to="/expert/profile"       color="text-violet-600 bg-violet-50" />
          <QuickAction icon={Award}         label="Credentials"     to="/expert/credentials"   color="text-indigo-600 bg-indigo-50" />
          <QuickAction icon={ClipboardList} label="Requests"        to="/expert/requests"      color="text-blue-600 bg-blue-50" />
          <QuickAction icon={MessageSquare} label="Consultations"   to="/expert/consultations" color="text-emerald-600 bg-emerald-50" />
          <QuickAction icon={TrendingUp}    label="Escalations"     to="/expert/escalations"   color="text-orange-600 bg-orange-50" />
        </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
