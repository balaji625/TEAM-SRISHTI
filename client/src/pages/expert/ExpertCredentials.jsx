/**
 * ExpertCredentials — CarePath AI
 * Independent Expert: manage professional credentials and certifications.
 * DYNAMIC — loads from and saves to /api/expert/credentials.
 */

import { useState, useEffect } from 'react';
import {
  Award, BookOpen, Calendar, CheckCircle, Plus, Loader2,
  AlertCircle, Trash2, X, Upload,
} from 'lucide-react';
import {
  fetchExpertCredentials,
  addExpertCredential,
  deleteExpertCredential,
} from '../../services/expertService';

const CREDENTIAL_TYPES = ['Degree', 'Fellowship', 'Certification', 'Diploma', 'License', 'Training', 'Other'];

const typeColor = {
  Degree:        'bg-indigo-50 text-indigo-700 border-indigo-200',
  Fellowship:    'bg-violet-50 text-violet-700 border-violet-200',
  Certification: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Diploma:       'bg-blue-50 text-blue-700 border-blue-200',
  License:       'bg-orange-50 text-orange-700 border-orange-200',
  Training:      'bg-teal-50 text-teal-700 border-teal-200',
  Other:         'bg-gray-100 text-gray-600 border-gray-200',
};

/** Extract credentialType and title from stored title string like "[Degree] MD – Medicine" */
const parseTitle = (raw = '') => {
  const match = raw.match(/^\[([^\]]+)\]\s*(.*)/);
  if (match) return { credentialType: match[1], title: match[2] };
  return { credentialType: 'Other', title: raw };
};

// ── Add Credential Modal ──────────────────────────────────────────────────────
const AddCredentialModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({
    title: '', institution: '', year: '', credentialType: 'Certification',
  });
  const [file, setFile]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Credential name is required'); return; }
    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('title',          form.title.trim());
      fd.append('credentialType', form.credentialType);
      if (form.institution) fd.append('institution', form.institution.trim());
      if (form.year)        fd.append('year',        form.year);
      if (file)             fd.append('document',    file);

      await addExpertCredential(fd);
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add credential');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Credential</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Credential / Degree Name <span className="text-red-500">*</span></label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. MD — Internal Medicine"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Credential Type</label>
            <select value={form.credentialType} onChange={(e) => set('credentialType', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
              {CREDENTIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Institution / Issuing Organisation</label>
            <input value={form.institution} onChange={(e) => set('institution', e.target.value)}
              placeholder="e.g. AIIMS, American Heart Association"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
            <input type="number" value={form.year} onChange={(e) => set('year', e.target.value)}
              placeholder="e.g. 2020" min="1950" max={new Date().getFullYear()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Certificate / Document (optional)</label>
            <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-3 cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 truncate">
                {file ? file.name : 'Click to upload PDF, JPG, or PNG'}
              </span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)} />
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Credential
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ExpertCredentials = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [successMsg, setSuccess]      = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchExpertCredentials();
      setCredentials(res.data?.credentials || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdded = () => {
    setShowModal(false);
    setSuccess('Credential added successfully!');
    setTimeout(() => setSuccess(null), 4000);
    load();
  };

  const handleDelete = async (credId) => {
    if (!window.confirm('Remove this credential?')) return;
    setDeletingId(credId);
    try {
      await deleteExpertCredential(credId);
      setCredentials((prev) => prev.filter((c) => c._id !== credId));
    } catch {
      setError('Failed to remove credential');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Credentials</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your degrees, fellowships, and certifications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Credential
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Credential cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-xl text-center">
          <Award className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No credentials yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Credential" to add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map((c) => {
            const { credentialType, title } = parseTitle(c.title);
            return (
              <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 shrink-0">
                  <Award className="w-5 h-5 text-violet-600" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{title}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor[credentialType] || typeColor.Other}`}>
                      {credentialType}
                    </span>
                  </div>
                  {c.institution && (
                    <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" /> {c.institution}
                    </p>
                  )}
                  {c.year && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" /> {c.year}
                    </p>
                  )}
                  {c.documentUrl && (
                    <a href={c.documentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 mt-1">
                      <Upload className="w-3 h-3" /> View document
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <button onClick={() => handleDelete(c._id)} disabled={deletingId === c._id}
                    className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40" title="Remove credential">
                    {deletingId === c._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Credential verification is reviewed by the platform admin before display to patients.
      </p>

      {showModal && <AddCredentialModal onClose={() => setShowModal(false)} onAdded={handleAdded} />}
    </div>
  );
};

export default ExpertCredentials;
