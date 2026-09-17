/**
 * HospitalProfile — CarePath AI
 *
 * Two-tab profile editor for hospital accounts:
 *  1. Hospital Details  — name, email, phone, address, emergency availability
 *  2. Capabilities      — specialties, services, facilities
 *
 * On first save, creates the Hospital document (upsert).
 * On subsequent saves, updates in place.
 */

import { useState, useEffect } from 'react';
import { Building2, Stethoscope, Loader2, CheckCircle, AlertCircle, Save, Clock, XCircle } from 'lucide-react';
import { fetchHospitalProfile, upsertHospitalProfile } from '../../services/hospitalService';

// ── Shared field components ───────────────────────────────────────────────────
const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${className}`}
    {...props}
  />
);

const Textarea = ({ className = '', ...props }) => (
  <textarea
    rows={3}
    className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none ${className}`}
    {...props}
  />
);

const TagInput = ({ value = [], onChange, placeholder }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
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
              className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-1">
              {item}
              <button type="button" onClick={() => remove(item)}
                className="ml-0.5 text-emerald-400 hover:text-emerald-600 font-bold leading-none">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const Alert = ({ type, message }) => {
  if (!message) return null;
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error:   'bg-red-50 border-red-200 text-red-800',
  };
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0" /> {message}
    </div>
  );
};

// ── Verification status pill ──────────────────────────────────────────────────
const VerificationPill = ({ status }) => {
  if (!status) return null;
  const cfgs = {
    PENDING:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock,         label: 'Pending Verification' },
    VERIFIED:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Verified' },
    REJECTED:  { cls: 'bg-red-50 text-red-700 border-red-200',         icon: XCircle,       label: 'Rejected' },
    SUSPENDED: { cls: 'bg-gray-100 text-gray-600 border-gray-200',     icon: AlertCircle,   label: 'Suspended' },
  };
  const cfg = cfgs[status] || cfgs.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" /> {cfg.label}
    </span>
  );
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'details',      label: 'Hospital Details', icon: Building2 },
  { id: 'capabilities', label: 'Capabilities',     icon: Stethoscope },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const HospitalProfile = ({ defaultTab = 'details' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [alert, setAlert]         = useState({ type: null, message: null });
  const [verificationStatus, setVerificationStatus] = useState(null);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [details, setDetails] = useState({
    name: '', description: '', email: '', phone: '',
    city: '', state: '', country: '',
    address: { street: '', city: '', state: '', country: '', zip: '' },
    emergencyAvailable: false,
  });

  const [capabilities, setCapabilities] = useState({
    specialties: [], services: [], facilities: [],
  });

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchHospitalProfile()
      .then((data) => {
        const h = data.data.hospital;
        if (!h) return; // no profile yet — form stays blank
        setVerificationStatus(h.verificationStatus);
        setDetails({
          name:               h.name        || '',
          description:        h.description || '',
          email:              h.email       || '',
          phone:              h.phone       || '',
          city:               h.city        || '',
          state:              h.state       || '',
          country:            h.country     || '',
          address: {
            street:  h.address?.street  || '',
            city:    h.address?.city    || '',
            state:   h.address?.state   || '',
            country: h.address?.country || '',
            zip:     h.address?.zip     || '',
          },
          emergencyAvailable: h.emergencyAvailable ?? false,
        });
        setCapabilities({
          specialties: h.specialties || [],
          services:    h.services    || [],
          facilities:  h.facilities  || [],
        });
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load hospital profile.' }))
      .finally(() => setLoading(false));
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: null, message: null }), 4000);
  };

  // ── Save details ─────────────────────────────────────────────────────────────
  const saveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await upsertHospitalProfile({
        name:               details.name,
        description:        details.description || undefined,
        email:              details.email,
        phone:              details.phone       || undefined,
        city:               details.city        || undefined,
        state:              details.state       || undefined,
        country:            details.country     || undefined,
        address:            details.address,
        emergencyAvailable: details.emergencyAvailable,
      });
      setVerificationStatus(res.data.hospital?.verificationStatus);
      showAlert('success', res.message || 'Hospital details saved');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  // ── Save capabilities ────────────────────────────────────────────────────────
  const saveCapabilities = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await upsertHospitalProfile({
        specialties: capabilities.specialties,
        services:    capabilities.services,
        facilities:  capabilities.facilities,
      });
      showAlert('success', res.message || 'Capabilities saved');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save capabilities');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            {verificationStatus ? 'Update your hospital information.' : 'Create your hospital profile to appear on CarePath AI.'}
          </p>
        </div>
        {verificationStatus && <VerificationPill status={verificationStatus} />}
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
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Hospital Details ──────────────────────────────────────────── */}
      {activeTab === 'details' && (
        <form onSubmit={saveDetails} className="space-y-5">
          {!verificationStatus && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
              Filling in your profile will submit it for admin verification. Once verified, your hospital will be visible to patients.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Hospital Name *">
              <Input required value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} placeholder="General Hospital" />
            </Field>
            <Field label="Official Email *">
              <Input required type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} placeholder="info@hospital.com" />
            </Field>
            <Field label="Phone Number">
              <Input value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="+1 555 000 0000" />
            </Field>
          </div>

          <Field label="Description">
            <Textarea value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} placeholder="Brief description of the hospital..." />
          </Field>

          {/* Emergency */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only"
                checked={details.emergencyAvailable}
                onChange={(e) => setDetails({ ...details, emergencyAvailable: e.target.checked })} />
              <div className={`w-9 h-5 rounded-full transition-colors ${details.emergencyAvailable ? 'bg-emerald-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${details.emergencyAvailable ? 'translate-x-4' : ''}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Emergency Services Available 24/7</p>
              <p className="text-xs text-gray-500">Patients will see an emergency badge on your listing.</p>
            </div>
          </label>

          {/* Location */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Location</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Field label="City">
                <Input value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} placeholder="City" />
              </Field>
              <Field label="State / Region">
                <Input value={details.state} onChange={(e) => setDetails({ ...details, state: e.target.value })} placeholder="State" />
              </Field>
              <Field label="Country">
                <Input value={details.country} onChange={(e) => setDetails({ ...details, country: e.target.value })} placeholder="Country" />
              </Field>
            </div>

            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Street Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Street">
                <Input
                  value={details.address.street}
                  onChange={(e) => setDetails({ ...details, address: { ...details.address, street: e.target.value } })}
                  placeholder="123 Main St"
                />
              </Field>
              <Field label="Postal Code">
                <Input
                  value={details.address.zip}
                  onChange={(e) => setDetails({ ...details, address: { ...details.address, zip: e.target.value } })}
                  placeholder="ZIP / Postal Code"
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Details
            </button>
          </div>
        </form>
      )}

      {/* ── Tab: Capabilities ──────────────────────────────────────────────── */}
      {activeTab === 'capabilities' && (
        <form onSubmit={saveCapabilities} className="space-y-5">
          <Field label="Medical Specialties" hint="Press Enter or click Add after each specialty">
            <TagInput
              value={capabilities.specialties}
              onChange={(v) => setCapabilities({ ...capabilities, specialties: v })}
              placeholder="e.g. Cardiology, Neurology"
            />
          </Field>

          <Field label="Services Offered" hint="Press Enter or click Add after each service">
            <TagInput
              value={capabilities.services}
              onChange={(v) => setCapabilities({ ...capabilities, services: v })}
              placeholder="e.g. MRI Scanning, Blood Tests"
            />
          </Field>

          <Field label="Facilities" hint="Press Enter or click Add after each facility">
            <TagInput
              value={capabilities.facilities}
              onChange={(v) => setCapabilities({ ...capabilities, facilities: v })}
              placeholder="e.g. ICU, Operating Theatre, Pharmacy"
            />
          </Field>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Capabilities
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HospitalProfile;
