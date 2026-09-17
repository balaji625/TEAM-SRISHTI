/**
 * ProfessionalSettings — CarePath AI
 * Healthcare Professional: account settings.
 * Route: /professional/settings
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Info, LogOut } from 'lucide-react';
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

const link = (to) => (
  <Link to={to} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
    Open <ChevronRight className="w-3.5 h-3.5" />
  </Link>
);

const ProfessionalSettings = () => {
  const { user, logout } = useAuth();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your professional account preferences.</p>
      </div>

      <Section title="Account Information">
        <SettingRow label="Account Email" description={user?.email}
          action={<span className="text-xs text-gray-400">Cannot change here</span>} />
        <SettingRow label="Role" description="Healthcare Professional"
          action={<span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">PROFESSIONAL</span>} />
      </Section>

      <Section title="Profile" description="Update your professional details.">
        <SettingRow label="Professional Profile"  description="Name, specialization, bio"   action={link('/professional/profile')} />
        <SettingRow label="Credentials"           description="Degrees and certifications"  action={link('/professional/credentials')} />
        <SettingRow label="Availability"          description="Weekly consultation hours"   action={link('/professional/availability')} />
        <SettingRow label="Hospital Associations" description="Manage hospital affiliations" action={link('/professional/associations')} />
      </Section>

      <Section title="Notifications">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          Notification preferences will be available in a future update. View your notifications from the sidebar.
        </div>
      </Section>

      <Section title="Session">
        <SettingRow label="Sign Out" description="Sign out of your professional account"
          action={
            <button onClick={logout}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          } />
      </Section>

      <p className="text-xs text-gray-400 text-center">CarePath AI · Professional Dashboard</p>
    </div>
  );
};

export default ProfessionalSettings;
