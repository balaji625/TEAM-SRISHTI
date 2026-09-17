/**
 * ProfessionalDashboard — CarePath AI
 *
 * Dashboard home for professional (doctor/specialist) accounts.
 * Shows verification status, profile summary, hospital associations, quick actions.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, Award, Link2, Clock, ClipboardList,
  Calendar, MessageSquare, Bell, Settings, Heart, LogOut,
  ChevronRight, Loader2, AlertCircle, RefreshCw,
  CheckCircle, XCircle, Building2, Stethoscope, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchProfessionalProfile, fetchAssociations } from '../../services/professionalService';

// ── Sidebar nav ───────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',          to: '/professional/dashboard' },
  { icon: User,            label: 'Profile',            to: '/professional/profile' },
  { icon: Award,           label: 'Credentials',        to: '/professional/credentials' },
  { icon: Link2,           label: 'Hospital Associations', to: '/professional/associations' },
  { icon: Clock,           label: 'Availability',       to: '/professional/availability' },
  { icon: ClipboardList,   label: 'Requests',           to: '/professional/requests' },
  { icon: Calendar,        label: 'Appointments',       to: '/professional/appointments' },
  { icon: ArrowRight,      label: 'Referrals',          to: '/professional/referrals' },
  { icon: MessageSquare,   label: 'Consultations',      to: '/professional/consultations' },
  { icon: Bell,            label: 'Notifications',      to: '/professional/notifications' },
  { icon: Settings,        label: 'Settings',           to: '/professional/settings' },
];

export const ProfessionalSidebar = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col py-4">
      <div className="px-4 mb-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600">
            <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-bold text-gray-900 text-sm">
            CarePath <span className="text-indigo-600">AI</span>
          </span>
        </Link>
      </div>
      {user && (
        <div className="mx-3 mb-4 px-3 py-2.5 bg-indigo-50 rounded-lg">
          <p className="text-xs font-semibold text-indigo-700 truncate">{user.name}</p>
          <p className="text-xs text-indigo-500 truncate">{user.email}</p>
        </div>
      )}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === to ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
    PENDING:   { bg: 'bg-amber-50 border-amber-200 text-amber-800',     icon: Clock,         msg: 'Your credentials are pending admin verification. Fill in your profile while you wait.' },
    VERIFIED:  { bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',  icon: CheckCircle,   msg: 'Your professional profile is verified and visible to patients.' },
    REJECTED:  { bg: 'bg-red-50 border-red-200 text-red-800',           icon: XCircle,       msg: 'Verification was rejected. Update your credentials and contact support.' },
    SUSPENDED: { bg: 'bg-gray-50 border-gray-200 text-gray-700',        icon: AlertCircle,   msg: 'Your account has been suspended. Contact support.' },
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

// ── Stat / quick-action helpers (reused pattern) ───────────────────────────────
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

// ── Association row ───────────────────────────────────────────────────────────
const AssociationRow = ({ assoc }) => {
  const hospital = assoc.hospitalId;
  const statusColors = {
    PENDING:  'bg-amber-50 text-amber-700',
    APPROVED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-red-50 text-red-700',
    REMOVED:  'bg-gray-100 text-gray-500',
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
        <Building2 className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{hospital?.name || 'Unknown Hospital'}</p>
        <p className="text-xs text-gray-500">{hospital?.city}{hospital?.country ? `, ${hospital.country}` : ''}</p>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[assoc.status] || statusColors.PENDING}`}>
        {assoc.status}
      </span>
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const ProfessionalDashboard = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [profRes, assocRes] = await Promise.all([
        fetchProfessionalProfile(),
        fetchAssociations(),
      ]);
      setProfile(profRes.data.profile);
      setAssociations(assocRes.data.associations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, Dr. {profile?.name?.split(' ').slice(-1)[0] || authUser?.name || 'Doctor'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your profile, credentials, and consultations.</p>
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
            <span>Set up your professional profile to begin accepting consultations.{' '}
              <Link to="/professional/profile" className="underline font-medium">Complete profile →</Link>
            </span>
          </div>
        )
      }

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Building2}     label="Hospital Associations" value={associations.filter(a => a.status === 'APPROVED').length} color="text-indigo-600 bg-indigo-50" to="/professional/associations" />
        <StatCard icon={Calendar}      label="Appointments Today"    value="0" color="text-blue-600 bg-blue-50" to="/professional/appointments" />
        <StatCard icon={MessageSquare} label="Active Consultations"  value="0" color="text-emerald-600 bg-emerald-50" to="/professional/consultations" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Professional Info</h2>
            <Link to="/professional/profile" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              {profile ? 'Edit' : 'Create'} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {profile ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-600">{profile.name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.specialization}</p>
                </div>
              </div>
              {[
                { label: 'Qualification', value: profile.qualification },
                { label: 'Experience',    value: profile.experience != null ? `${profile.experience} years` : null },
                { label: 'License #',     value: profile.licenseNumber },
                { label: 'Modes',         value: profile.consultationModes?.join(', ') },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 text-right">{value || <span className="text-gray-400 italic text-xs">Not set</span>}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Stethoscope className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No profile yet</p>
              <Link to="/professional/profile" className="mt-2 text-xs text-indigo-600 underline font-medium">Create profile</Link>
            </div>
          )}
        </div>

        {/* Associations */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Hospital Associations</h2>
            <Link to="/professional/associations" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {associations.length > 0 ? (
            associations.slice(0, 5).map((a) => <AssociationRow key={a._id} assoc={a} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Link2 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No hospital associations yet</p>
              <p className="text-xs text-gray-400 mt-1">Request to associate with a hospital from the Associations page.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <QuickAction icon={User}          label="Edit Profile"    to="/professional/profile"      color="text-indigo-600 bg-indigo-50" />
          <QuickAction icon={Award}         label="Credentials"     to="/professional/credentials"  color="text-violet-600 bg-violet-50" />
          <QuickAction icon={Link2}         label="Associations"    to="/professional/associations" color="text-blue-600 bg-blue-50" />
          <QuickAction icon={Calendar}      label="Appointments"    to="/professional/appointments" color="text-emerald-600 bg-emerald-50" />
          <QuickAction icon={MessageSquare} label="Consultations"   to="/professional/consultations" color="text-orange-600 bg-orange-50" />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
