/**
 * HospitalSettings — CarePath AI
 * Hospital account settings: password, preferences, danger zone.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Bell, Shield, LogOut, Building2, ChevronRight, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Section = ({ title, description, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

const SettingRow = ({ label, description, action }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div className="shrink-0 ml-4">{action}</div>
  </div>
);

const HospitalSettings = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your hospital account preferences.</p>
      </div>

      {/* Account info */}
      <Section title="Account Information" description="Your hospital account details.">
        <SettingRow
          label="Account Email"
          description={user?.email}
          action={<span className="text-xs text-gray-400">Cannot change here</span>}
        />
        <SettingRow
          label="Role"
          description="Hospital Account"
          action={<span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">HOSPITAL</span>}
        />
        <SettingRow
          label="Hospital Profile"
          description="Update name, contact details, and capabilities"
          action={
            <Link to="/hospital/profile"
              className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">
              Edit <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications" description="Control which notifications you receive.">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          Notification preferences can be managed from your hospital profile. More granular notification settings will be available in a future update.
        </div>
      </Section>

      {/* Quick links */}
      <Section title="Quick Links">
        <SettingRow
          label="Hospital Profile"
          description="Edit hospital details and capabilities"
          action={<Link to="/hospital/profile" className="text-xs text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">Open <ChevronRight className="w-3.5 h-3.5" /></Link>}
        />
        <SettingRow
          label="Doctor Associations"
          description="Manage doctor association requests"
          action={<Link to="/hospital/associations" className="text-xs text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">Open <ChevronRight className="w-3.5 h-3.5" /></Link>}
        />
        <SettingRow
          label="Analytics"
          description="View hospital performance data"
          action={<Link to="/hospital/analytics" className="text-xs text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">Open <ChevronRight className="w-3.5 h-3.5" /></Link>}
        />
      </Section>

      {/* Danger zone */}
      <Section title="Session">
        <SettingRow
          label="Sign Out"
          description="Sign out of your hospital account"
          action={
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          }
        />
      </Section>

      <div className="text-xs text-gray-400 text-center">
        CarePath AI · Hospital Dashboard · For support, contact the system administrator.
      </div>
    </div>
  );
};

export default HospitalSettings;
