/**
 * AdminUsers — CarePath AI
 * Admin: list, search, filter and toggle-active all platform users.
 */

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, Loader2, AlertCircle, CheckCircle, XCircle, Shield, UserCheck, Building2, Stethoscope } from 'lucide-react';
import { fetchUsers, toggleUserActive } from '../../services/adminService';

const ROLES = ['USER', 'HOSPITAL', 'PROFESSIONAL', 'EXPERT', 'ADMIN'];

const roleColor = {
  USER:         'bg-blue-50 text-blue-700',
  HOSPITAL:     'bg-emerald-50 text-emerald-700',
  PROFESSIONAL: 'bg-indigo-50 text-indigo-700',
  EXPERT:       'bg-violet-50 text-violet-700',
  ADMIN:        'bg-rose-50 text-rose-700',
};

const RoleIcon = ({ role }) => {
  const icons = { USER: Users, HOSPITAL: Building2, PROFESSIONAL: Stethoscope, EXPERT: UserCheck, ADMIN: Shield };
  const Icon = icons[role] || Users;
  return <Icon className="w-3.5 h-3.5" />;
};

const AdminUsers = () => {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [togglingId, setToggle] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: 20 };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const res = await fetchUsers(params);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const handleToggle = async (id) => {
    setToggle(id);
    try {
      await toggleUserActive(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: !u.isActive } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle user');
    } finally {
      setToggle(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total accounts</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 w-64"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors">Search</button>
        </form>
        <select
          value={roleFilter} onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">No users found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      <RoleIcon role={u.role} /> {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive
                      ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Inactive</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        disabled={togglingId === u._id}
                        onClick={() => handleToggle(u._id)}
                        className={`text-xs font-medium px-3 py-1 rounded-md border transition-colors disabled:opacity-50 ${
                          u.isActive
                            ? 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {togglingId === u._id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : (u.isActive ? 'Deactivate' : 'Activate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
