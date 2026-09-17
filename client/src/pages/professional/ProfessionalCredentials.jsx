/**
 * ProfessionalCredentials — CarePath AI
 * Healthcare Professional: manage credential documents.
 * Supports both text-entry and document upload (PDF/image).
 * Route: /professional/credentials
 */

import { useState, useEffect, useRef } from 'react';
import {
  Award, Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle,
  Info, Upload, FileText, Eye,
} from 'lucide-react';
import { fetchProfessionalProfile, upsertProfessionalProfile } from '../../services/professionalService';
import api from '../../services/api';

const emptyCredential = () => ({ title: '', institution: '', year: '' });

const ProfessionalCredentials = () => {
  const [credentials, setCredentials] = useState([]);
  const [savedCredentials, setSavedCredentials] = useState([]);   // creds with documentUrl from DB
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [success, setSuccess]  = useState(null);
  const [error, setError]      = useState(null);

  // Upload state
  const [uploadTitle, setUploadTitle]         = useState('');
  const [uploadInstitution, setUploadInstitution] = useState('');
  const [uploadYear, setUploadYear]           = useState('');
  const [uploadFile, setUploadFile]           = useState(null);
  const [uploading, setUploading]             = useState(false);
  const [uploadError, setUploadError]         = useState(null);
  const [uploadSuccess, setUploadSuccess]     = useState(null);
  const [deletingId, setDeletingId]           = useState(null);
  const fileInputRef = useRef(null);

  const load = () => {
    fetchProfessionalProfile()
      .then((res) => {
        const creds = res.data.profile?.credentials || [];
        // Separate document-backed credentials from text-only ones
        const withDocs = creds.filter((c) => c.documentUrl);
        const textOnly = creds.filter((c) => !c.documentUrl);
        setSavedCredentials(withDocs);
        setCredentials(textOnly.length > 0
          ? textOnly.map((c) => ({ title: c.title || '', institution: c.institution || '', year: c.year ? String(c.year) : '' }))
          : [emptyCredential()]
        );
      })
      .catch(() => setError('Failed to load credentials'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add    = () => setCredentials((c) => [...c, emptyCredential()]);
  const remove = (idx) => setCredentials((c) => c.filter((_, i) => i !== idx));
  const update = (idx, field, value) =>
    setCredentials((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  // ── Save text credentials ─────────────────────────────────────────────────
  const handleSave = async () => {
    const valid = credentials.filter((c) => c.title.trim());
    if (valid.length === 0) { setError('At least one credential with a title is required'); return; }
    setSaving(true); setError(null); setSuccess(null);
    try {
      const payload = valid.map((c) => ({
        title:       c.title.trim(),
        institution: c.institution.trim() || undefined,
        year:        c.year ? Number(c.year) : undefined,
      }));
      await upsertProfessionalProfile({ credentials: payload });
      setSuccess('Credentials saved!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save credentials');
    } finally { setSaving(false); }
  };

  // ── Upload credential document ────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile) return;
    if (!uploadTitle.trim()) { setUploadError('Credential title is required'); return; }

    setUploading(true); setUploadError(null); setUploadSuccess(null);
    const formData = new FormData();
    formData.append('document', uploadFile);
    formData.append('title',       uploadTitle.trim());
    formData.append('institution', uploadInstitution.trim());
    if (uploadYear) formData.append('year', uploadYear);

    try {
      const res = await api.post('/professional/credentials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newCred = res.data?.data?.credential;
      if (newCred) setSavedCredentials((prev) => [...prev, newCred]);
      setUploadSuccess('Credential document uploaded!');
      setUploadTitle(''); setUploadInstitution(''); setUploadYear('');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  // ── Delete credential document ────────────────────────────────────────────
  const handleDeleteCred = async (credId) => {
    if (!window.confirm('Delete this credential document?')) return;
    setDeletingId(credId);
    try {
      await api.delete(`/professional/credentials/${credId}`);
      setSavedCredentials((prev) => prev.filter((c) => c._id !== credId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally { setDeletingId(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add your qualifications, certifications and training</p>
        </div>
        <button onClick={add}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg px-4 py-2 hover:bg-indigo-50 transition-colors">
          <Plus className="w-4 h-4" /> Add Credential
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>List your medical degrees, certifications, fellowships, and training programs. You can also upload supporting documents (PDF or image). These are shown to patients and used during admin verification.</span>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Text credentials ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {credentials.map((cred, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title / Degree <span className="text-red-500">*</span></label>
                    <input value={cred.title} onChange={(e) => update(idx, 'title', e.target.value)}
                      placeholder="e.g. MBBS, MD, FRCS, Board Certification"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                    <input type="number" value={cred.year} onChange={(e) => update(idx, 'year', e.target.value)}
                      placeholder="e.g. 2015" min="1950" max={new Date().getFullYear()}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
                  <input value={cred.institution} onChange={(e) => update(idx, 'institution', e.target.value)}
                    placeholder="e.g. Harvard Medical School, AIIMS"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <button onClick={() => remove(idx)} disabled={credentials.length === 1}
                className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={add} className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors">
          <Plus className="w-4 h-4" /> Add Another
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Credentials
        </button>
      </div>

      {/* ── Document upload section ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-500" /> Upload Credential Document
        </h2>
        <p className="text-xs text-gray-500">Attach a scanned copy of your certificate, degree, or license. Supported: PDF, JPG, PNG (max 10 MB).</p>

        {uploadSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm text-emerald-800">
            <CheckCircle className="w-4 h-4 shrink-0" /> {uploadSuccess}
          </div>
        )}
        {uploadError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {uploadError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Credential Title <span className="text-red-500">*</span></label>
            <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. MBBS Certificate"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
            <input type="number" value={uploadYear} onChange={(e) => setUploadYear(e.target.value)}
              placeholder="e.g. 2015" min="1950" max={new Date().getFullYear()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
            <input value={uploadInstitution} onChange={(e) => setUploadInstitution(e.target.value)}
              placeholder="e.g. AIIMS, Rajiv Gandhi University"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        <div>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setUploadError(null); }}
            className="hidden" id="credential-file-input" />
          <label htmlFor="credential-file-input"
            className="flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl p-4 cursor-pointer transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
              <Upload className="w-4 h-4 text-indigo-500" />
            </div>
            {uploadFile ? (
              <div>
                <p className="text-sm font-medium text-gray-800">{uploadFile.name}</p>
                <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Click to select document (PDF, JPG, PNG · max 10 MB)</p>
            )}
          </label>
        </div>

        <button onClick={handleUpload} disabled={!uploadFile || uploading}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Document</>}
        </button>
      </div>

      {/* ── Uploaded document list ───────────────────────────────────────── */}
      {savedCredentials.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Uploaded Documents</h3>
          {savedCredentials.map((cred) => (
            <div key={cred._id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{cred.title}</p>
                <p className="text-xs text-gray-500">{[cred.institution, cred.year].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {cred.documentUrl && (
                  <a href={cred.documentUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="View document">
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={() => handleDeleteCred(cred._id)} disabled={deletingId === cred._id}
                  className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-50 rounded-lg transition-colors" title="Delete">
                  {deletingId === cred._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalCredentials;
