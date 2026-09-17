/**
 * UserProfile — CarePath AI
 *
 * Three-tab profile editor for patients:
 *  1. Basic Info     — name, phone, gender, DOB, language, location
 *  2. Health Profile — blood type, allergies, conditions, medications, emergency contact
 *  3. Consent        — data sharing and privacy preferences
 *
 * All saves hit real backend API endpoints.
 */

import { useState, useEffect } from 'react';
import { User, Heart, Shield, Loader2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchProfile,
  updateProfile,
  updateHealthProfile,
  updateConsent,
} from '../../services/userService';

// ── Reusable field components ─────────────────────────────────────────────────
const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
    {...props}
  />
);

const Select = ({ children, className = '', ...props }) => (
  <select
    className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

const TagInput = ({ value = [], onChange, placeholder }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft('');
  };

  const remove = (item) => onChange(value.filter((v) => v !== item));

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <button type="button" onClick={add}
          className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors whitespace-nowrap">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span key={item}
              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1">
              {item}
              <button type="button" onClick={() => remove(item)}
                className="ml-0.5 text-blue-400 hover:text-blue-600 font-bold leading-none">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const ConsentToggle = ({ label, description, checked, onChange }) => (
  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors">
    <div className="relative mt-0.5">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </label>
);

// ── Alert helper ──────────────────────────────────────────────────────────────
const Alert = ({ type, message }) => {
  if (!message) return null;
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error:   'bg-red-50 border-red-200 text-red-800',
  };
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
};

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'basic',   label: 'Basic Info',     icon: User },
  { id: 'health',  label: 'Health Profile', icon: Heart },
  { id: 'consent', label: 'Consent',        icon: Shield },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const UserProfile = ({ defaultTab = 'basic' }) => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [alert, setAlert]         = useState({ type: null, message: null });

  // ── Form state ──────────────────────────────────────────────────────────────
  const [basic, setBasic] = useState({
    name: '', phone: '', dateOfBirth: '', gender: '', language: 'en',
    location: { city: '', state: '', country: '' },
  });

  const [health, setHealth] = useState({
    bloodType: '', allergies: [], chronicConditions: [],
    currentMedications: [],
    emergencyContact: { name: '', phone: '', relationship: '' },
  });

  const [consent, setConsent] = useState({
    healthDataStorage: false, reportAnalysis: false, personalization: false,
    expertSharing: false, hospitalSharing: false, notifications: true,
  });

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProfile()
      .then((data) => {
        const u = data.data.user;
        setBasic({
          name:        u.name        || '',
          phone:       u.phone       || '',
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : '',
          gender:      u.gender      || '',
          language:    u.language    || 'en',
          location: {
            city:    u.location?.city    || '',
            state:   u.location?.state   || '',
            country: u.location?.country || '',
          },
        });
        const hp = u.healthProfile || {};
        setHealth({
          bloodType:           hp.bloodType          || '',
          allergies:           hp.allergies          || [],
          chronicConditions:   hp.chronicConditions  || [],
          currentMedications:  hp.currentMedications || [],
          emergencyContact: {
            name:         hp.emergencyContact?.name         || '',
            phone:        hp.emergencyContact?.phone        || '',
            relationship: hp.emergencyContact?.relationship || '',
          },
        });
        const c = u.consent || {};
        setConsent({
          healthDataStorage: c.healthDataStorage ?? false,
          reportAnalysis:    c.reportAnalysis    ?? false,
          personalization:   c.personalization   ?? false,
          expertSharing:     c.expertSharing     ?? false,
          hospitalSharing:   c.hospitalSharing   ?? false,
          notifications:     c.notifications     ?? true,
        });
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load profile. Please refresh.' }))
      .finally(() => setLoading(false));
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: null }), 4000);
  };

  // ── Save handlers ────────────────────────────────────────────────────────────
  const saveBasic = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name:        basic.name,
        phone:       basic.phone || undefined,
        dateOfBirth: basic.dateOfBirth || undefined,
        gender:      basic.gender      || undefined,
        language:    basic.language    || undefined,
        location:    basic.location,
      });
      showAlert('success', 'Profile updated successfully');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const saveHealth = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateHealthProfile({
        bloodType:          health.bloodType || undefined,
        allergies:          health.allergies,
        chronicConditions:  health.chronicConditions,
        currentMedications: health.currentMedications,
        emergencyContact:   health.emergencyContact,
      });
      showAlert('success', 'Health profile updated successfully');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update health profile');
    } finally {
      setSaving(false);
    }
  };

  const saveConsent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateConsent(consent);
      showAlert('success', 'Consent preferences saved');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save consent preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information and health data.</p>
      </div>

      {/* Alert */}
      <Alert type={alert.type} message={alert.message} />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Basic Info ────────────────────────────────────────────────── */}
      {activeTab === 'basic' && (
        <form onSubmit={saveBasic} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-blue-600">
                {basic.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{authUser?.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Patient account · {authUser?.isVerified ? 'Verified' : 'Unverified'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <Input required value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} placeholder="Your full name" />
            </Field>
            <Field label="Phone Number">
              <Input value={basic.phone} onChange={(e) => setBasic({ ...basic, phone: e.target.value })} placeholder="+1 555 000 0000" />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={basic.dateOfBirth} onChange={(e) => setBasic({ ...basic, dateOfBirth: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={basic.gender} onChange={(e) => setBasic({ ...basic, gender: e.target.value })}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
            <Field label="Language">
              <Select value={basic.language} onChange={(e) => setBasic({ ...basic, language: e.target.value })}>
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
                <option value="ar">Arabic</option>
                <option value="zh">Chinese</option>
              </Select>
            </Field>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Location</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="City">
                <Input value={basic.location.city} onChange={(e) => setBasic({ ...basic, location: { ...basic.location, city: e.target.value } })} placeholder="City" />
              </Field>
              <Field label="State / Region">
                <Input value={basic.location.state} onChange={(e) => setBasic({ ...basic, location: { ...basic.location, state: e.target.value } })} placeholder="State" />
              </Field>
              <Field label="Country">
                <Input value={basic.location.country} onChange={(e) => setBasic({ ...basic, location: { ...basic.location, country: e.target.value } })} placeholder="Country" />
              </Field>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Basic Info
            </button>
          </div>
        </form>
      )}

      {/* ── Tab: Health Profile ────────────────────────────────────────────── */}
      {activeTab === 'health' && (
        <form onSubmit={saveHealth} className="space-y-5">
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-800">
            Your health data is encrypted and only shared with healthcare providers you explicitly consent to.
          </div>

          <Field label="Blood Type">
            <Select value={health.bloodType} onChange={(e) => setHealth({ ...health, bloodType: e.target.value })}>
              <option value="">Unknown / Not set</option>
              {['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </Select>
          </Field>

          <Field label="Allergies" hint="Press Enter or click Add after each item">
            <TagInput
              value={health.allergies}
              onChange={(v) => setHealth({ ...health, allergies: v })}
              placeholder="e.g. Penicillin, Peanuts"
            />
          </Field>

          <Field label="Chronic Conditions" hint="Press Enter or click Add after each item">
            <TagInput
              value={health.chronicConditions}
              onChange={(v) => setHealth({ ...health, chronicConditions: v })}
              placeholder="e.g. Diabetes, Hypertension"
            />
          </Field>

          <Field label="Current Medications" hint="Press Enter or click Add after each item">
            <TagInput
              value={health.currentMedications}
              onChange={(v) => setHealth({ ...health, currentMedications: v })}
              placeholder="e.g. Metformin 500mg"
            />
          </Field>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Emergency Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Name">
                <Input
                  value={health.emergencyContact.name}
                  onChange={(e) => setHealth({ ...health, emergencyContact: { ...health.emergencyContact, name: e.target.value } })}
                  placeholder="Contact name"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={health.emergencyContact.phone}
                  onChange={(e) => setHealth({ ...health, emergencyContact: { ...health.emergencyContact, phone: e.target.value } })}
                  placeholder="+1 555 000 0000"
                />
              </Field>
              <Field label="Relationship">
                <Input
                  value={health.emergencyContact.relationship}
                  onChange={(e) => setHealth({ ...health, emergencyContact: { ...health.emergencyContact, relationship: e.target.value } })}
                  placeholder="e.g. Spouse, Parent"
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Health Profile
            </button>
          </div>
        </form>
      )}

      {/* ── Tab: Consent ───────────────────────────────────────────────────── */}
      {activeTab === 'consent' && (
        <form onSubmit={saveConsent} className="space-y-4">
          <p className="text-sm text-gray-600">
            Control how your health data is used. You can change these preferences at any time.
          </p>

          <div className="space-y-2">
            <ConsentToggle
              label="Health Data Storage"
              description="Allow CarePath AI to store your health reports and records securely."
              checked={consent.healthDataStorage}
              onChange={(v) => setConsent({ ...consent, healthDataStorage: v })}
            />
            <ConsentToggle
              label="Report Analysis"
              description="Allow AI models to analyse your health reports for insights and recommendations."
              checked={consent.reportAnalysis}
              onChange={(v) => setConsent({ ...consent, reportAnalysis: v })}
            />
            <ConsentToggle
              label="Personalisation"
              description="Allow CarePath AI to personalise recommendations based on your health history."
              checked={consent.personalization}
              onChange={(v) => setConsent({ ...consent, personalization: v })}
            />
            <ConsentToggle
              label="Expert Sharing"
              description="Allow your health data to be shared with verified experts when you seek help."
              checked={consent.expertSharing}
              onChange={(v) => setConsent({ ...consent, expertSharing: v })}
            />
            <ConsentToggle
              label="Hospital Sharing"
              description="Allow your health data to be shared with hospitals during appointments."
              checked={consent.hospitalSharing}
              onChange={(v) => setConsent({ ...consent, hospitalSharing: v })}
            />
            <ConsentToggle
              label="Notifications"
              description="Receive appointment reminders, health alerts, and platform updates."
              checked={consent.notifications}
              onChange={(v) => setConsent({ ...consent, notifications: v })}
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
            Your consent choices are recorded with a timestamp. Full consent history and audit trail is available to you at any time.
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Consent Preferences
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserProfile;
