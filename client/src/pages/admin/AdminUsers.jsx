/**
 * AdminUsers — CarePath AI
 * Admin: list, search, filter, toggle-active, view, edit and remove platform users.
 */

import { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, Loader2, AlertCircle, CheckCircle, XCircle, Shield, UserCheck, Building2, Stethoscope, Pencil, Trash2, User, X } from 'lucide-react';
import { fetchUsers, toggleUserActive, fetchUserById, updateUser, deleteUser } from '../../services/adminService';

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

// ── View User Modal ───────────────────────────────────────────────────────────
const ViewUserModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserById(userId).then((r) => setData(r.data?.user)).catch(() => {}).finally(() => setLoading(false));
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [userId, onClose]);

  const roleColor = { USER: 'bg-blue-50 text-blue-700', HOSPITAL: 'bg-emerald-50 text-emerald-700', PROFESSIONAL: 'bg-indigo-50 text-indigo-700', EXPERT: 'bg-violet-50 text-violet-700', ADMIN: 'bg-rose-50 text-rose-700' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-bold text-gray-900">User Profile</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-rose-500" /></div>}
          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-400">Name</p><p className="text-sm font-medium text-gray-900">{data.name}</p></div>
                <div><p className="text-xs text-gray-400">Email</p><p className="text-sm text-gray-700">{data.email}</p></div>
                <div><p className="text-xs text-gray-400">Phone</p><p className="text-sm text-gray-700">{data.phone || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Role</p><span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${roleColor[data.role] || 'bg-gray-100 text-gray-600'}`}>{data.role}</span></div>
                <div><p className="text-xs text-gray-400">Gender</p><p className="text-sm text-gray-700">{data.gender || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Language</p><p className="text-sm text-gray-700">{data.language || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Verified</p><p className="text-sm text-gray-700">{data.isVerified ? 'Yes' : 'No'}</p></div>
                <div><p className="text-xs text-gray-400">Active</p><p className="text-sm text-gray-700">{data.isActive ? 'Yes' : 'No'}</p></div>
                <div><p className="text-xs text-gray-400">Joined</p><p className="text-sm text-gray-700">{new Date(data.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-gray-400">Last Login</p><p className="text-sm text-gray-700">{data.lastLogin ? new Date(data.lastLogin).toLocaleString() : 'Never'}</p></div>
              </div>
              {data.location && (data.location.city || data.location.country) && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-400 mb-1">Location</p>
                  <p className="text-sm text-gray-700">{[data.location.city, data.location.state, data.location.country].filter(Boolean).join(', ')}</p>
                </div>
              )}
              {data.healthProfile && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-400 mb-2">Health Profile</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {data.healthProfile.bloodType && <div><span className="text-gray-400">Blood Type: </span><span className="text-gray-700 font-medium">{data.healthProfile.bloodType}</span></div>}
                    {data.healthProfile.allergies?.length > 0 && <div><span className="text-gray-400">Allergies: </span><span className="text-gray-700">{data.healthProfile.allergies.join(', ')}</span></div>}
                    {data.healthProfile.chronicConditions?.length > 0 && <div className="col-span-2"><span className="text-gray-400">Conditions: </span><span className="text-gray-700">{data.healthProfile.chronicConditions.join(', ')}</span></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Edit User Modal ───────────────────────────────────────────────────────────
const EditUserModal = ({ user, onClose, onUpdated }) => {
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '', gender: user.gender || '', language: user.language || 'en', isActive: user.isActive !== false, isVerified: user.isVerified !== false });
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setApiError('');
    try {
      await updateUser(user._id, form);
      onUpdated();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-bold text-gray-900">Edit User — {user.name}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {apiError && <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {apiError}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input value={form.name} onChange={set('name')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={set('phone')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
            <select value={form.gender} onChange={set('gender')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
              <option value="">Not specified</option>
              {['MALE','FEMALE','NON_BINARY','PREFER_NOT_TO_SAY','OTHER'].map((g) => <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Active</label>
              <select value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'true' }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Verified</label>
              <select value={form.isVerified ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.value === 'true' }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
          </div>
        </form>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [viewId, setViewId]     = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

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
    } finally { setToggle(null); }
  };

  const handleDelete = async (id) => {
    setToggle(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setTotal((t) => t - 1);
      setDeleteTarget(null);
      setSuccessMsg('User removed.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally { setToggle(null); }
  };

  const handleUpdated = () => {
    setEditUser(null);
    setSuccessMsg('User updated.');
    setTimeout(() => setSuccessMsg(''), 4000);
    load();
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

      {successMsg && <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}</div>}

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
                   <div className="flex items-center justify-end gap-1">
                     <button onClick={() => setViewId(u._id)} title="View profile" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><User className="w-3.5 h-3.5" /></button>
                     {u.role !== 'ADMIN' && (
                       <>
                         <button onClick={() => setEditUser(u)} title="Edit" className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                         <button disabled={togglingId === u._id} onClick={() => handleToggle(u._id)}
                           className={`text-xs font-medium px-2 py-1 rounded-md border transition-colors disabled:opacity-50 ${u.isActive ? 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100' : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'}`}>
                           {togglingId === u._id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : (u.isActive ? 'Deactivate' : 'Activate')}
                         </button>
                         <button onClick={() => setDeleteTarget(u)} title="Remove" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                       </>
                     )}
                   </div>
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
      {viewId && <ViewUserModal userId={viewId} onClose={() => setViewId(null)} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onUpdated={handleUpdated} />}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Remove User</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to permanently remove <strong>{deleteTarget.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget._id)} disabled={togglingId === deleteTarget._id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                {togglingId === deleteTarget._id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
