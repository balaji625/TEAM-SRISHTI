/**
 * HealthHistory — CarePath AI
 * View and manage structured health records (vitals, lab results, symptoms, history).
 */

import { useState, useEffect } from 'react';
import {
  Activity, Plus, Loader2, AlertCircle, RefreshCw, Trash2,
  Edit2, X, Save, ChevronDown,
} from 'lucide-react';
import {
  fetchHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord,
} from '../../services/userService';

const RECORD_TYPES = [
  { value: 'LAB_REPORT',             label: 'Lab Report',          color: 'text-blue-700 bg-blue-50' },
  { value: 'MEDICAL_HISTORY',        label: 'Medical History',     color: 'text-emerald-700 bg-emerald-50' },
  { value: 'SYMPTOM',                label: 'Symptom',             color: 'text-amber-700 bg-amber-50' },
  { value: 'VITAL',                  label: 'Vital Sign',          color: 'text-red-700 bg-red-50' },
  { value: 'DIAGNOSIS_REFERENCE',    label: 'Diagnosis',           color: 'text-purple-700 bg-purple-50' },
  { value: 'PRESCRIPTION_REFERENCE', label: 'Prescription',        color: 'text-orange-700 bg-orange-50' },
  { value: 'OTHER',                  label: 'Other',               color: 'text-gray-700 bg-gray-50' },
];

const TYPE_MAP = Object.fromEntries(RECORD_TYPES.map((t) => [t.value, t]));

const RecordBadge = ({ type }) => {
  const t = TYPE_MAP[type] || TYPE_MAP.OTHER;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
  );
};

// ── Record Form Modal ─────────────────────────────────────────────────────────
const RecordModal = ({ record, onClose, onSaved }) => {
  const editing = Boolean(record?._id);
  const [form, setForm] = useState({
    recordType: record?.recordType || 'VITAL',
    title: record?.title || '',
    description: record?.description || '',
    source: record?.source || '',
    date: record?.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateHealthRecord(record._id, form);
      } else {
        await createHealthRecord(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editing ? 'Edit Record' : 'Add Health Record'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Record Type *</label>
            <select value={form.recordType} onChange={(e) => set('recordType', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {RECORD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Blood glucose test result"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Details, observations, or notes..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
              <input value={form.source} onChange={(e) => set('source', e.target.value)}
                placeholder="e.g. City Lab"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Record Row ────────────────────────────────────────────────────────────────
const RecordRow = ({ record, onEdit, onDelete }) => {
  const date = new Date(record.date);
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <RecordBadge type={record.recordType} />
          {record.source && <span className="text-xs text-gray-400">{record.source}</span>}
        </div>
        <p className="text-sm font-medium text-gray-900">{record.title}</p>
        {record.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{record.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onEdit(record)}
          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(record._id)}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const HealthHistory = () => {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal]           = useState(null); // null | { record } | { record: null }

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = typeFilter ? { recordType: typeFilter } : {};
      const res = await fetchHealthRecords(params);
      setRecords(res.data?.records || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [typeFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this health record?')) return;
    try {
      await deleteHealthRecord(id);
      load();
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health History</h1>
          <p className="text-sm text-gray-500 mt-1">Keep a log of your health records, vitals, and test results.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setModal({ record: null })}
            className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter('')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            !typeFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}>All</button>
        {RECORD_TYPES.slice(0, 5).map((t) => (
          <button key={t.value} onClick={() => setTypeFilter(t.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              typeFilter === t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>{t.label}</button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl px-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-700">No health records</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Start tracking your health by adding a record.</p>
            <button onClick={() => setModal({ record: null })}
              className="text-sm text-blue-600 underline font-medium">Add first record</button>
          </div>
        ) : (
          records.map((r) => (
            <RecordRow key={r._id} record={r} onEdit={(r) => setModal({ record: r })} onDelete={handleDelete} />
          ))
        )}
      </div>

      {modal !== null && (
        <RecordModal
          record={modal.record}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
};

export default HealthHistory;
