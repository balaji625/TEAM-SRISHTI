/**
 * Unauthorized — shown when a user tries to access a route they don't have access to.
 */
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

const Unauthorized = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="text-center max-w-sm">
      <ShieldX className="w-14 h-14 text-red-400 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-sm text-gray-600 mb-6">
        You do not have permission to access this page.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  </div>
);

export default Unauthorized;
