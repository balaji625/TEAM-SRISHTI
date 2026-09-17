/**
 * AdminAuditLogs — CarePath AI
 * Admin: browse and filter platform audit logs.
 */

import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search, RefreshCw, Loader2, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { fetchAuditLogs } from '../../services/adminService';

const outcomeColor = {
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  FAILURE: 'bg-red-50 text-red-700',
  BLOCKED: 'bg-amber-50 text-amber-700',
};

const OutcomeIcon = ({ outcome }) => {
  if (outcome === 'SUCCESS') return <CheckCircle className="w-3.5 h-3.5" />;
  if (outcome === 'FAILURE') return <XCircle className="w-3.5 h-3.5" />;
  return <AlertTriangle className="w-3.5 h-3.5" />;
};

const AdminAuditLogs = () => {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [action, setAction]   = useState('');
  const [resource, setRes]    = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: 30 };
      if (action)   params.action   = action;
      if (resource) params.resource = resource;
      const res = await fetchAuditLogs(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, action, resource]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 30);

  const ACTIONS = ['LOGIN','LOGOUT','REGISTER','HOSPITAL_VERIFY','HOSPITAL_REJECT','PROFESSIONAL_VERIFY','PROFESSIONAL_REJECT','EXPERT_VERIFY','EXPERT_REJECT','USER_SUSPEND','USER_ACTIVATE','RECORD_ACCESS','REPORT_UPLOAD','APPOINTMENT_CREATE'];
  const RESOURCES = ['USER','HOSPITAL','PROFESSIONAL','EXPERT','APPOINTMENT','REQUEST','HEALTH_REPORT','HEALTH_RECORD','CONSENT','SYSTEM'];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total entries — immutable security trail</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400">
          <option value="">All Actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={resource} onChange={(e) => { setRes(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400">
          <option value="">All Resources</option>
          {RESOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-rose-500 animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ScrollText className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Outcome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.userId ? (
                      <div>
                        <p className="text-xs font-medium text-gray-800">{log.userId.name || '—'}</p>
                        <p className="text-xs text-gray-400">{log.userId.email || log.role}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">{log.role || 'SYSTEM'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{log.action}</code>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">{log.resource}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${outcomeColor[log.outcome] || outcomeColor.SUCCESS}`}>
                      <OutcomeIcon outcome={log.outcome} /> {log.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
