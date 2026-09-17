/**
 * StatusBadge — coloured pill badge for status values.
 */

const colorMap = {
  // Appointment / request statuses
  PENDING:      'bg-yellow-100 text-yellow-800',
  CONFIRMED:    'bg-green-100 text-green-800',
  APPROVED:     'bg-green-100 text-green-800',
  REJECTED:     'bg-red-100 text-red-800',
  CANCELLED:    'bg-gray-100 text-gray-600',
  COMPLETED:    'bg-blue-100 text-blue-800',
  RESCHEDULED:  'bg-purple-100 text-purple-800',
  // Verification
  VERIFIED:     'bg-green-100 text-green-800',
  UNVERIFIED:   'bg-yellow-100 text-yellow-800',
  SUSPENDED:    'bg-red-100 text-red-800',
  // Roles
  USER:         'bg-gray-100 text-gray-700',
  HOSPITAL:     'bg-blue-100 text-blue-700',
  PROFESSIONAL: 'bg-indigo-100 text-indigo-700',
  EXPERT:       'bg-purple-100 text-purple-700',
  ADMIN:        'bg-rose-100 text-rose-700',
};

const StatusBadge = ({ status, className = '' }) => {
  const label = status?.replace(/_/g, ' ') ?? '—';
  const color = colorMap[status?.toUpperCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
