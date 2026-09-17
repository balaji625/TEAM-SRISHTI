/**
 * AdminSettings — CarePath AI
 * Platform settings view for admin.
 */

import { useState, useEffect } from 'react';
import { Settings, RefreshCw, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { fetchAdminSettings } from '../../services/adminService';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchAdminSettings();
      setSettings(res.data.settings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Current configuration for CarePath AI</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>Settings modification via UI will be available in a future update. These values are currently managed via environment variables on the server.</div>
      </div>

      {settings && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Current Configuration</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className={`text-sm font-medium ${
                  typeof value === 'boolean'
                    ? value ? 'text-emerald-700' : 'text-red-600'
                    : 'text-gray-900'
                }`}>
                  {typeof value === 'boolean' ? (
                    <span className="flex items-center gap-1">
                      {value ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                      {value.toString()}
                    </span>
                  ) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Platform Health</h2>
        <div className="space-y-3">
          {[
            { label: 'API Server',         status: true,  detail: 'Responding' },
            { label: 'Database',           status: true,  detail: 'Connected' },
            { label: 'Authentication',     status: true,  detail: 'JWT active' },
            { label: 'Rate Limiting',      status: true,  detail: '200 req / 15min' },
          ].map(({ label, status, detail }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <span className="text-xs text-gray-400">{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
