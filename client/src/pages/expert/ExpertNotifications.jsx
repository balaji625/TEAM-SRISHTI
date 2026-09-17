/**
 * ExpertNotifications — CarePath AI
 * Independent Expert: notification feed.
 * Static display — non-dynamic.
 */

import { Bell, CheckCircle, Clock, AlertCircle, Info, MessageSquare } from 'lucide-react';

const typeConfig = {
  info:    { icon: Info,         cls: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-500' },
  success: { icon: CheckCircle,  cls: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  warning: { icon: AlertCircle,  cls: 'bg-amber-50 text-amber-600',  dot: 'bg-amber-500' },
  message: { icon: MessageSquare,cls: 'bg-violet-50 text-violet-600', dot: 'bg-violet-500' },
};

const SAMPLE = [
  { id: 1, type: 'success', title: 'Profile Verified',         body: 'Your expert profile has been verified by the platform admin.', time: '2 hours ago',   read: false },
  { id: 2, type: 'message', title: 'New Consultation Request', body: 'Patient Sneha Reddy has requested an expert consultation.',    time: '5 hours ago',   read: false },
  { id: 3, type: 'info',    title: 'Request Approved',         body: 'Your request to Apollo Hospitals has been approved.',          time: 'Yesterday',     read: true  },
  { id: 4, type: 'warning', title: 'Availability Reminder',    body: 'You have no availability set for next week.',                  time: '2 days ago',    read: true  },
  { id: 5, type: 'info',    title: 'Platform Update',          body: 'New consultation modes are now available on CarePath AI.',     time: '3 days ago',    read: true  },
  { id: 6, type: 'success', title: 'Request to Admin Sent',    body: 'Your independent expert escalation request was received.',     time: '1 week ago',    read: true  },
];

const ExpertNotifications = () => {
  const unread = SAMPLE.filter((n) => !n.read).length;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Notifications
            {unread > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-bold">
                {unread}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        <Bell className="w-5 h-5 text-gray-400" />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {SAMPLE.map((n) => {
          const cfg = typeConfig[n.type] || typeConfig.info;
          const Icon = cfg.icon;
          return (
            <div key={n.id} className={`flex items-start gap-4 px-5 py-4 ${!n.read ? 'bg-violet-50/40' : ''}`}>
              <span className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${cfg.cls}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                  {!n.read && <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {n.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Showing sample notifications. Live notifications will appear as platform activity occurs.
      </p>
    </div>
  );
};

export default ExpertNotifications;
