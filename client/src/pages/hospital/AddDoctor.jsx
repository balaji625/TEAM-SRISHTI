/**
 * AddDoctor — CarePath AI
 *
 * Hospital-side form to add a doctor directly to the hospital roster.
 * Creates a Professional record with a pre-approved association.
 *
 * Route: /hospital/doctors/add
 */

import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, Loader2, CheckCircle, AlertCircle, Info, Upload, FileText,
} from 'lucide-react';
import api from '../../services/api';

const CONSULTATION_MODES = [
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'VIDEO',     label: 'Video Call' },
  { value: 'PHONE',     label: 'Phone Call' },
  { value: 'CHAT',      label: 'Chat' },
];

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
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
    className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-colors ${className}`}
    {...props}
  />
);

const AddDoctor = () => {
  const navigate = useNavigate();
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);
  const [createdDoctorId, setCreatedDoctorId] = useState(null);

  // Certificate upload
  const [certFile, setCertFile]             = useState(null);
  const [certTitle, setCertTitle]           = useState('');
  const [certUploading, setCertUploading]   = useState(false);
  const [certSuccess, setCertSuccess]       = useState(null);
  const [certError, setCertError]           = useState(null);
  const certInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    licenseNumber: '',
    bio: '',
    consultationModes: [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleMode = (mode) => {
    setForm((f) => ({
      ...f,
      consultationModes: f.consultationModes.includes(mode)
        ? f.consultationModes.filter((m) => m !== mode)
        : [...f.consultationModes, mode],
    }));
  };

  const [createdCreds, setCreatedCreds] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name:              form.name,
        email:             form.email,
        phone:             form.phone           || undefined,
        specialization:    form.specialization,
        qualification:     form.qualification   || undefined,
        experience:        form.experience      ? Number(form.experience) : undefined,
        licenseNumber:     form.licenseNumber   || undefined,
        bio:               form.bio             || undefined,
        consultationModes: form.consultationModes.length > 0 ? form.consultationModes : undefined,
      };

      const res = await api.post('/hospital/doctors/invite', payload);
      // Server may return login credentials if new account was created
      setCreatedCreds(res.data?.data?.loginCredentials || null);
      const doctorId = res.data?.data?.doctor?._id;
      if (doctorId) setCreatedDoctorId(doctorId);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add doctor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCertUpload = async () => {
    if (!certFile || !createdDoctorId) return;
    setCertUploading(true); setCertError(null); setCertSuccess(null);
    const formData = new FormData();
    formData.append('certificate', certFile);
    formData.append('title', certTitle.trim() || 'Doctor Certificate');
    try {
      await api.post(`/hospital/doctors/${createdDoctorId}/certificate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCertSuccess('Certificate uploaded successfully!');
      setCertFile(null);
      if (certInputRef.current) certInputRef.current.value = '';
    } catch (err) {
      setCertError(err.response?.data?.message || 'Certificate upload failed');
    } finally {
      setCertUploading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl space-y-6">
        <Link to="/hospital/doctors" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Doctors
        </Link>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Doctor Added Successfully</h2>
          <p className="text-sm text-gray-600 mb-4">
            A CarePath AI Professional account has been created for this doctor.
          </p>
          {createdCreds && (
            <div className="bg-white border border-emerald-200 rounded-lg p-4 text-left mb-4">
              <p className="text-xs font-semibold text-emerald-800 mb-2 uppercase tracking-wide">🔑 Login Credentials (share with doctor)</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-mono font-medium text-gray-900">{createdCreds.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Password:</span>
                  <span className="font-mono font-medium text-gray-900">{createdCreds.password}</span>
                </div>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1.5 mt-3">
                ⚠️ Password is the hospital name. Ask the doctor to change it after first login.
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500 mb-4">
            The doctor can log in at <strong>CarePath AI → Healthcare Professional</strong> using the credentials above.
          </p>

          {/* Certificate upload */}
          {createdDoctorId && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-left mb-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" /> Upload Doctor Certificate (Optional)
              </h3>
              {certSuccess && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">{certSuccess}</p>
              )}
              {certError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">{certError}</p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Certificate Label</label>
                <input value={certTitle} onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="e.g. MBBS Certificate, Medical License"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <input ref={certInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => { setCertFile(e.target.files?.[0] || null); setCertError(null); }}
                  className="hidden" id="cert-file-input" />
                <label htmlFor="cert-file-input"
                  className="flex items-center gap-2 border border-dashed border-gray-200 hover:border-emerald-300 rounded-lg p-3 cursor-pointer transition-colors text-sm text-gray-500">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  {certFile ? certFile.name : 'Click to select certificate (PDF, JPG, PNG)'}
                </label>
              </div>
              <button onClick={handleCertUpload} disabled={!certFile || certUploading}
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                {certUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Certificate</>}
              </button>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSuccess(false); setCreatedCreds(null); setCreatedDoctorId(null); setForm({ name:'',email:'',phone:'',specialization:'',qualification:'',experience:'',licenseNumber:'',bio:'',consultationModes:[] }); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Add Another
            </button>
            <Link to="/hospital/doctors"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
              View Doctors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/hospital/doctors" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Doctors
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Doctor</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a doctor profile. They can log in and update their own details once registered.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Tip:</strong> Doctors can also self-register on CarePath AI and request association with your hospital directly from their dashboard.
          Use this form to manually add a doctor directly to your roster.
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Doctor Information</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <Input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Dr. Jane Smith"
              />
            </Field>
            <Field label="Email Address" required hint="Used as login username for the doctor">
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="doctor@example.com"
              />
            </Field>
            <Field label="Phone Number">
              <Input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 555 000 0000"
              />
            </Field>
            <Field label="License Number" hint="Medical council registration number">
              <Input
                value={form.licenseNumber}
                onChange={(e) => set('licenseNumber', e.target.value)}
                placeholder="e.g. MCI-123456"
              />
            </Field>
          </div>
        </div>

        {/* Professional details */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Professional Details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Specialization" required>
              <Input
                required
                value={form.specialization}
                onChange={(e) => set('specialization', e.target.value)}
                placeholder="e.g. Cardiology"
              />
            </Field>
            <Field label="Qualification">
              <Input
                value={form.qualification}
                onChange={(e) => set('qualification', e.target.value)}
                placeholder="e.g. MBBS, MD"
              />
            </Field>
            <Field label="Years of Experience">
              <Input
                type="number"
                min="0"
                max="60"
                value={form.experience}
                onChange={(e) => set('experience', e.target.value)}
                placeholder="e.g. 10"
              />
            </Field>
          </div>

          <Field label="Bio / About">
            <Textarea
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Brief description of the doctor's background and expertise..."
            />
          </Field>
        </div>

        {/* Consultation modes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Consultation Modes</p>
          <div className="flex flex-wrap gap-2">
            {CONSULTATION_MODES.map(({ value, label }) => {
              const active = form.consultationModes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleMode(value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/hospital/doctors"
            className="flex-1 text-center border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add Doctor
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDoctor;
