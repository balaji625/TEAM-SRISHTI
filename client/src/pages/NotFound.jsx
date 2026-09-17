/**
 * NotFound (404) page
 */
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div className="text-center max-w-sm">
      <p className="text-8xl font-extrabold text-blue-100">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-2">Page not found</h1>
      <p className="text-sm text-gray-600 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  </div>
);

export default NotFound;
