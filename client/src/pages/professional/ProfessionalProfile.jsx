/**
 * ProfessionalProfile — CarePath AI
 *
 * Profile editor for healthcare professionals.
 * Tabs: Basic Info, Specialization
 */

import { useState, useEffect } from 'react';
import { User, Stethoscope, Loader2, CheckCircle, AlertCircle, Save, Clock, XCircle } from 'lucide-react';
import { fetchProfessionalProfile, upsertProfessionalProfile } from '../../services/professionalService';

const CONSULTATION_MODES = ['IN_PERSON', 'VIDEO', 'PHONE', 'CHAT'];

const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = ({ ...props }) => (
  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors" {...props} />
);

const Textarea = ({ ...props }) => (
  <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none" {...props} />
);

const VerificationPill = ({ status }) => {
  if (!status) return null;
  const cfgs = {
    PENDING:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',      icon: Clock,         label: 'Pending' },
    VERIFIED:  { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',   icon: CheckCircle,   label: 'Verified' },
    REJECTED:  { cls: 'bg-red-50 text-red-700 border-red-200',            icon: XCircle,       label: 'Rejected' },
    SUSPENDED: { cls: 'bg-gray-100 text-gray-600 border-gray-200',        icon: AlertCircle,   label: 'Suspended' },
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
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'spec',  label: 'Specialization', icon: Stethoscope },
];

const ProfessionalProfile = ({ defaultTab = 'basic' }) => {
  const [activeTab, setActiveTab]   = useState(defaultTab);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [alert, setAlert]           = useState({ type: null, message: null });
  const [verStatus, setVerStatus]   = useState(null);

  const [basic, setBasic] = useState({ name: '', email: '', phone: '' });
  const [spec, setSpec]   = useState({
    specialization: '', qualification: '', experience: '',
    licenseNumber: '', bio: '', consultationModes: [],
  });

  useEffect(() => {
    fetchProfessionalProfile()
      .then((data) => {
        const p = data.data.profile;
        if (!p) return;
        setVerStatus(p.verificationStatus);
        setBasic({ name: p.name || '', email: p.email || '', phone: p.phone || '' });
        setSpec({
          specialization:   p.specialization   || '',
          qualification:    p.qualification    || '',
          experience:       p.experience != null ? String(p.experience) : '',
          licenseNumber:    p.licenseNumber    || '',
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
      await upsertProfessionalProfile({
        name:  basic.name,
        email: basic.email || undefined,
        phone: basic.phone || undefined,
        // ensure name+specialization always present for new records
        specialization: spec.specialization || undefined,
      });
      showAlert('success', 'Basic info saved');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const saveSpec = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await upsertProfessionalProfile({
        name:             basic.name || undefined,
        specialization:   spec.specialization,
        qualification:    spec.qualification || undefined,
        experience:       spec.experience !== '' ? Number(spec.experience) : undefined,
        licenseNumber:    spec.licenseNumber  || undefined,
        bio:              spec.bio            || undefined,
        consultationModes: spec.consultationModes,
      });
      setVerStatus(res.data.profile?.verificationStatus);
      showAlert('success', 'Specialization saved');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggleMode = (mode) => {
    setSpec((prev) => ({
      ...prev,
      consultationModes: prev.consultationModes.includes(mode)
        ? prev.consultationModes.filter((m) => m !== mode)
        : [...prev.consultationModes, mode],
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Professional Profile</h1>
          <p className="text-sm text-gray-500 mt-1">{verStatus ? 'Update your professional details.' : 'Create your professional profile.'}</p>
        </div>
        {verStatus && <VerificationPill status={verStatus} />}
      </div>

      <AlertBox type={alert.type} message={alert.message} />

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'basic' && (
        <form onSubmit={saveBasic} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <Input required value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} placeholder="Dr. Jane Smith" />
            </Field>
            <Field label="Professional Email">
              <Input type="email" value={basic.email} onChange={(e) => setBasic({ ...basic, email: e.target.value })} placeholder="dr.smith@example.com" />
            </Field>
            <Field label="Phone Number">
              <Input value={basic.phone} onChange={(e) => setBasic({ ...basic, phone: e.target.value })} placeholder="+1 555 000 0000" />
            </Field>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Basic Info
            </button>
          </div>
        </form>
      )}

      {activeTab === 'spec' && (
        <form onSubmit={saveSpec} className="space-y-4">
          {!verStatus && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
              Filling in your specialization will submit your profile for admin verification.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Specialization *">
              <Input required value={spec.specialization} onChange={(e) => setSpec({ ...spec, specialization: e.target.value })} placeholder="e.g. Cardiologist" />
            </Field>
            <Field label="Qualification">
              <Input value={spec.qualification} onChange={(e) => setSpec({ ...spec, qualification: e.target.value })} placeholder="e.g. MBBS, MD" />
            </Field>
            <Field label="Years of Experience">
              <Input type="number" min="0" max="60" value={spec.experience} onChange={(e) => setSpec({ ...spec, experience: e.target.value })} placeholder="0" />
            </Field>
            <Field label="License Number">
              <Input value={spec.licenseNumber} onChange={(e) => setSpec({ ...spec, licenseNumber: e.target.value })} placeholder="Medical license #" />
            </Field>
          </div>
          <Field label="Biography" hint="Describe your background, expertise, and approach">
            <Textarea value={spec.bio} onChange={(e) => setSpec({ ...spec, bio: e.target.value })} placeholder="Tell patients about yourself..." />
          </Field>
          <Field label="Consultation Modes">
            <div className="flex flex-wrap gap-2 mt-1">
              {CONSULTATION_MODES.map((mode) => (
                <button type="button" key={mode} onClick={() => toggleMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${spec.consultationModes.includes(mode) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Specialization
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfessionalProfile;
