/**
 * ExpertSettings — CarePath AI
 * Independent Expert: account and notification settings.
 * Static display — non-dynamic.
 */

import { useState } from 'react';
import { Settings, Bell, Shield, User, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Toggle = ({ checked, onChange, label, desc }) => (
  <div className="flex items-start justify-between gap-4 py-4">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none mt-0.5 ${
        checked ? 'bg-violet-600' : 'bg-gray-200'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  </div>
);

const ExpertSettings = () => {
  const { user, logout } = useAuth();

  const [notifs, setNotifs] = useState({
    consultations: true,
    requests:      true,
    updates:       false,
    email:         true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Account</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{user?.name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
              Independent Expert
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 flex-wrap">
          <Link
            to="/expert/profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" /> Edit Profile
          </Link>
          <Link
            to="/expert/credentials"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" /> Manage Credentials
          </Link>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 px-5">
        <div className="flex items-center gap-2 pt-5 mb-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Notifications</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <Toggle checked={notifs.consultations} onChange={(v) => setNotifs((p) => ({ ...p, consultations: v }))} label="Consultation Requests" desc="Notify when a patient requests your expert review" />
          <Toggle checked={notifs.requests}      onChange={(v) => setNotifs((p) => ({ ...p, requests: v }))}      label="Request Updates"        desc="Notify when a hospital or admin responds to your request" />
          <Toggle checked={notifs.updates}       onChange={(v) => setNotifs((p) => ({ ...p, updates: v }))}       label="Platform Updates"       desc="News and feature announcements from CarePath AI" />
          <Toggle checked={notifs.email}         onChange={(v) => setNotifs((p) => ({ ...p, email: v }))}         label="Email Notifications"    desc="Also receive notifications by email" />
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Security</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Password changes are managed through your account portal.</p>
        <button disabled className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-400 cursor-not-allowed">
          Change Password (coming soon)
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Settings'}
        </button>
        <button onClick={logout} className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ExpertSettings;
