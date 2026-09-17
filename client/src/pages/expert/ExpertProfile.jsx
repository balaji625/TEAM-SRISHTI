/**
 * ExpertProfile — CarePath AI
 *
 * Profile editor for independent healthcare experts.
 * Two tabs: Basic Info and Expertise.
 */

import { useState, useEffect } from 'react';
import { User, Award, Loader2, CheckCircle, AlertCircle, Save, Clock, XCircle } from 'lucide-react';
import { fetchExpertProfile, upsertExpertProfile } from '../../services/expertService';

const CONSULTATION_MODES = ['IN_PERSON', 'VIDEO', 'PHONE', 'CHAT'];

const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = ({ ...props }) => (
  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors" {...props} />
);

const Textarea = ({ ...props }) => (
  <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors resize-none" {...props} />
);

const VerificationPill = ({ status }) => {
  if (!status) return null;
  const cfgs = {
    PENDING:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',     icon: Clock,       label: 'Pending' },
    VERIFIED:  { cls: 'bg-violet-50 text-violet-700 border-violet-200',  icon: CheckCircle, label: 'Verified' },
    REJECTED:  { cls: 'bg-red-50 text-red-700 border-red-200',           icon: XCircle,     label: 'Rejected' },
    SUSPENDED: { cls: 'bg-gray-100 text-gray-600 border-gray-200',       icon: AlertCircle, label: 'Suspended' },
  };
  const cfg = cfgs[status] || cfgs.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" /> {cfg.label}
    </span>
  );
};

const AlertBox = ({ type, message }) => {
  if (!message) return null;
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const styles = { success: 'bg-emerald-50 border-emerald-200 text-emerald-800', error: 'bg-red-50 border-red-200 text-red-800' };
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0" /> {message}
    </div>
  );
};

const TABS = [
  { id: 'basic',    label: 'Basic Info', icon: User },
  { id: 'expertise',label: 'Expertise',  icon: Award },
];

const ExpertProfile = ({ defaultTab = 'basic' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [alert, setAlert]         = useState({ type: null, message: null });
  const [verStatus, setVerStatus] = useState(null);

  const [basic, setBasic] = useState({ name: '', email: '', phone: '' });
  const [expertise, setExpertise] = useState({
    specialization: '', qualification: '', experience: '',
    bio: '', consultationModes: [],
  });

  useEffect(() => {
    fetchExpertProfile()
      .then((data) => {
        const p = data.data.profile;
        if (!p) return;
        setVerStatus(p.verificationStatus);
        setBasic({ name: p.name || '', email: p.email || '', phone: p.phone || '' });
        setExpertise({
          specialization:   p.specialization   || '',
          qualification:    p.qualification    || '',
          experience:       p.experience != null ? String(p.experience) : '',
          bio:              p.bio              || '',
          consultationModes: p.consultationModes || [],
        });
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load profile.' }))
      .finally(() => setLoading(false));
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: null }), 4000);
  };

  const saveBasic = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await upsertExpertProfile({
        name:           basic.name,
        email:          basic.email          || undefined,
        phone:          basic.phone          || undefined,
        specialization: expertise.specialization || undefined,
      });
      showAlert('success', 'Basic info saved');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const saveExpertise = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await upsertExpertProfile({
        name:             basic.name             || undefined,
        specialization:   expertise.specialization,
        qualification:    expertise.qualification || undefined,
        experience:       expertise.experience !== '' ? Number(expertise.experience) : undefined,
        bio:              expertise.bio            || undefined,
        consultationModes: expertise.consultationModes,
      });
      setVerStatus(res.data.profile?.verificationStatus);
      showAlert('success', 'Expertise saved');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggleMode = (mode) => {
    setExpertise((prev) => ({
      ...prev,
      consultationModes: prev.consultationModes.includes(mode)
        ? prev.consultationModes.filter((m) => m !== mode)
        : [...prev.consultationModes, mode],
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expert Profile</h1>
          <p className="text-sm text-gray-500 mt-1">{verStatus ? 'Update your expert details.' : 'Create your expert profile to start accepting consultations.'}</p>
        </div>
        {verStatus && <VerificationPill status={verStatus} />}
      </div>

      <AlertBox type={alert.type} message={alert.message} />

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === id ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'basic' && (
        <form onSubmit={saveBasic} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <Input required value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} placeholder="Your full name" />
            </Field>
            <Field label="Professional Email">
              <Input type="email" value={basic.email} onChange={(e) => setBasic({ ...basic, email: e.target.value })} placeholder="expert@example.com" />
            </Field>
            <Field label="Phone Number">
              <Input value={basic.phone} onChange={(e) => setBasic({ ...basic, phone: e.target.value })} placeholder="+1 555 000 0000" />
            </Field>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Basic Info
            </button>
          </div>
        </form>
      )}

      {activeTab === 'expertise' && (
        <form onSubmit={saveExpertise} className="space-y-4">
          {!verStatus && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
              Providing your expertise details will submit your profile for admin verification.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Area of Expertise *">
              <Input required value={expertise.specialization} onChange={(e) => setExpertise({ ...expertise, specialization: e.target.value })} placeholder="e.g. Mental Health, Nutrition" />
            </Field>
            <Field label="Qualification">
              <Input value={expertise.qualification} onChange={(e) => setExpertise({ ...expertise, qualification: e.target.value })} placeholder="e.g. PhD, MSc" />
            </Field>
            <Field label="Years of Experience">
              <Input type="number" min="0" max="60" value={expertise.experience} onChange={(e) => setExpertise({ ...expertise, experience: e.target.value })} placeholder="0" />
            </Field>
          </div>
          <Field label="Biography" hint="Describe your background and areas of focus">
            <Textarea value={expertise.bio} onChange={(e) => setExpertise({ ...expertise, bio: e.target.value })} placeholder="Tell patients about your expertise..." />
          </Field>
          <Field label="Consultation Modes">
            <div className="flex flex-wrap gap-2 mt-1">
              {CONSULTATION_MODES.map((mode) => (
                <button type="button" key={mode} onClick={() => toggleMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${expertise.consultationModes.includes(mode) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Expertise
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ExpertProfile;
