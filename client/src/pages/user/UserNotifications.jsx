/**
 * UserNotifications — CarePath AI
 * In-app notification feed for the patient.
 */

import { useState, useEffect } from 'react';
import {
  Bell, BellOff, Check, CheckCheck, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
} from '../../services/userService';

const TYPE_COLORS = {
  APPOINTMENT_REQUEST:   'bg-blue-100 text-blue-700',
  APPOINTMENT_CONFIRMED: 'bg-emerald-100 text-emerald-700',
  APPOINTMENT_REJECTED:  'bg-red-100 text-red-700',
  APPOINTMENT_CANCELLED: 'bg-gray-100 text-gray-600',
  APPOINTMENT_COMPLETED: 'bg-blue-100 text-blue-700',
  VERIFICATION_APPROVED: 'bg-emerald-100 text-emerald-700',
  VERIFICATION_REJECTED: 'bg-red-100 text-red-700',
  HEALTH_REPORT_READY:   'bg-orange-100 text-orange-700',
  EMERGENCY:             'bg-red-100 text-red-700',
  SYSTEM:                'bg-gray-100 text-gray-600',
};

const NotificationItem = ({ notif, onRead }) => {
  const color = TYPE_COLORS[notif.type] || TYPE_COLORS.SYSTEM;
  const date = new Date(notif.createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const timeAgo =
    diffMins < 1    ? 'Just now' :
    diffMins < 60   ? `${diffMins}m ago` :
    diffHours < 24  ? `${diffHours}h ago` :
    diffDays < 7    ? `${diffDays}d ago` :
    date.toLocaleDateString();

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
        notif.read ? 'bg-white' : 'bg-blue-50/40'
      }`}
    >
      <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${color}`}>
        <Bell className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>
      {!notif.read && (
        <button onClick={() => onRead(notif._id)}
          className="shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title="Mark as read">
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [unreadOnly, setUnreadOnly]       = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNotifications({ unreadOnly: unreadOnly ? 'true' : 'false' });
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [unreadOnly]);

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {unreadCount > 0 && (
            <button onClick={handleReadAll}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex gap-2">
        {[false, true].map((v) => (
          <button key={String(v)} onClick={() => setUnreadOnly(v)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              unreadOnly === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {v ? 'Unread only' : 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <BellOff className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-700">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up. Notifications will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n._id} notif={n} onRead={handleRead} />
          ))
        )}
      </div>
    </div>
  );
};

export default UserNotifications;
