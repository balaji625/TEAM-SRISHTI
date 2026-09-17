/**
 * HealthReports — CarePath AI
 * Full health report upload, AI analysis, and management.
 * Allows users to upload PDF/image/DOCX/TXT files, get AI analysis, view results.
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Upload, AlertCircle, Loader2, RefreshCw, Info,
  Download, Eye, Trash2, Calendar, CheckCircle, Brain,
  X, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../../services/api';

const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.docx,.txt';
const MAX_SIZE_MB = 10;

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── AI summary renderer (markdown-lite) ───────────────────────────────────────
const AISummary = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const lines = text.split('\n').filter(Boolean);
  const preview = lines.slice(0, 4);
  const hasMore = lines.length > 4;

  const renderLine = (line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-semibold text-gray-800 mt-2 mb-0.5 text-xs">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith('• ') || line.startsWith('* ')) {
      return <li key={i} className="ml-3 text-xs text-gray-700 leading-relaxed list-disc">{line.slice(2)}</li>;
    }
    if (line.startsWith('⚠️')) {
      return <p key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1.5 mt-2">{line}</p>;
    }
    return <p key={i} className="text-xs text-gray-700 leading-relaxed">{line}</p>;
  };

  const toShow = expanded ? lines : preview;

  return (
    <div className="mt-3 bg-violet-50 border border-violet-100 rounded-lg p-3">
      <p className="text-xs font-semibold text-violet-700 flex items-center gap-1.5 mb-2">
        <Brain className="w-3.5 h-3.5" /> AI Analysis
      </p>
      <div className="space-y-0.5">{toShow.map(renderLine)}</div>
      {hasMore && (
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-violet-600 mt-2 hover:text-violet-800 transition-colors">
          {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
        </button>
      )}
    </div>
  );
};

// ── Report card ────────────────────────────────────────────────────────────────
const ReportCard = ({ report, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.delete(`/user/reports/${report._id}`);
      onDelete(report._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{report.fileName}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            {report.fileSize && <span>{formatSize(report.fileSize)}</span>}
            {report.fileType && <span className="uppercase px-1.5 py-0.5 bg-gray-100 rounded text-xs">{report.fileType}</span>}
            {report.consentGiven && (
              <span className="flex items-center gap-0.5 text-emerald-600">
                <CheckCircle className="w-3 h-3" /> AI analysed
              </span>
            )}
          </div>

          {report.analysis?.plainLanguageSummary && (
            <AISummary text={report.analysis.plainLanguageSummary} />
          )}
          {!report.analysis?.plainLanguageSummary && report.summary && (
            <AISummary text={report.summary} />
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {report.fileUrl && (
            <a href={report.fileUrl} target="_blank" rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="View">
              <Eye className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title={confirmDelete ? 'Confirm delete?' : 'Delete'}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              confirmDelete ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-500'
            }`}>
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
          {confirmDelete && (
            <button onClick={() => setConfirmDelete(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const HealthReports = () => {
  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [selectedFile, setSelectedFile]   = useState(null);
  const [consentGiven, setConsentGiven]   = useState(true);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/user/reports');
      setReports(res.data?.data?.reports || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setReports([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    setUploadSuccess(null);

    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File size exceeds ${MAX_SIZE_MB} MB limit.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('consentGiven', String(consentGiven));

    try {
      const res = await api.post('/user/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newReport = res.data?.data?.report;
      const aiSource  = res.data?.data?.aiSource;
      if (newReport) {
        setReports((prev) => [newReport, ...prev]);
      }
      setUploadSuccess(
        aiSource === 'gemini'
          ? 'Report uploaded and analysed with AI successfully!'
          : aiSource === 'smart-engine'
          ? 'Report uploaded with general AI guidance added.'
          : 'Report uploaded successfully.'
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    setReports((prev) => prev.filter((r) => r._id !== id));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage your health documents with AI analysis.</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>About Health Reports:</strong> Upload your lab results, prescriptions, and medical documents.
            With your consent, CarePath AI will provide a plain-language explanation of your report.
            Supported formats: PDF, JPG, PNG, DOCX, TXT (max {MAX_SIZE_MB} MB).{' '}
            <Link to="/user/consent" className="underline font-medium">Manage your consent preferences →</Link>
          </div>
        </div>
      </div>

      {/* Upload card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-orange-500" /> Upload New Report
        </h2>

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

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS}
            onChange={handleFileSelect}
            className="hidden"
            id="report-file-input"
          />
          <label htmlFor="report-file-input"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-orange-300 rounded-xl p-6 cursor-pointer transition-colors group">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <Upload className="w-5 h-5 text-orange-500" />
            </div>
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatSize(selectedFile.size)}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Click to select a file</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG, DOCX, TXT · Max {MAX_SIZE_MB} MB</p>
              </div>
            )}
          </label>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-400"
          />
          <span className="text-xs text-gray-700 leading-relaxed">
            I consent to CarePath AI analysing this document to provide a plain-language summary.
            AI analysis is for informational purposes only and is not a medical diagnosis.
          </span>
        </label>

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading & Analysing…</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload Report</>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-xl text-center">
          <FileText className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No health reports yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload your first health document above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{reports.length} report{reports.length !== 1 ? 's' : ''} uploaded</p>
          {reports.map((r) => (
            <ReportCard key={r._id} report={r} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
        <strong>Important:</strong> AI-generated analysis of health reports is for informational purposes only.
        Always consult a qualified healthcare professional to interpret your test results and for medical advice.
      </div>
    </div>
  );
};

export default HealthReports;
