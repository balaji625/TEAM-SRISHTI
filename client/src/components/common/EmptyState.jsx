/**
 * EmptyState — shown when a list or table has no data.
 */
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No results', description = '', icon: Icon = Inbox, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
      <Icon className="w-7 h-7 text-gray-400" />
    </span>
    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
