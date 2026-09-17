/**
 * ExpertHelp — CarePath AI
 * Find and request help from verified individual health experts (EXPERT role).
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, Clock, Loader2, AlertCircle, ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

const ExpertCard = ({ expert }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-pink-700">
          {expert.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{expert.name}</p>
        <p className="text-xs text-pink-600 font-medium">{expert.specialization}</p>
        {expert.qualification && <p className="text-xs text-gray-500 mt-0.5">{expert.qualification}</p>}
      </div>
      {expert.experience > 0 && (
        <span className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" /> {expert.experience} yrs
        </span>
      )}
    </div>

    {expert.bio && (
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{expert.bio}</p>
    )}

    <Link to="/user/appointments"
      className="flex items-center justify-center gap-1.5 text-xs font-medium text-pink-600 border border-pink-200 rounded-lg py-2 hover:bg-pink-50 transition-colors mt-2">
      Request Consultation <ChevronRight className="w-3.5 h-3.5" />
    </Link>
  </div>
);

const ExpertHelp = () => {
  const [experts, setExperts]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [query, setQuery]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 30, verified: true };
      if (query) params.q = query;
      // Fetch from expert search endpoint — returns only EXPERT-role profiles
      const res = await api.get('/search/experts', { params });
      setExperts(res.data?.data?.experts || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load experts');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => load(), 400);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expert Help</h1>
        <p className="text-sm text-gray-500 mt-1">Get specialist guidance from verified healthcare experts.</p>
      </div>

      {/* How it works */}
      <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-pink-800 mb-2">How Expert Consultations Work</h3>
        <ol className="space-y-1.5 text-xs text-pink-800">
          <li className="flex items-start gap-2"><span className="font-bold shrink-0">1.</span> Browse experts below and find one with your needed specialty.</li>
          <li className="flex items-start gap-2"><span className="font-bold shrink-0">2.</span> Click "Request Consultation" to book an appointment.</li>
          <li className="flex items-start gap-2"><span className="font-bold shrink-0">3.</span> The expert will review your case and confirm.</li>
          <li className="flex items-start gap-2"><span className="font-bold shrink-0">4.</span> Join your session at the scheduled time via your preferred mode.</li>
        </ol>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or specialty..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
        </div>
      ) : experts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-xl text-center">
          <Users className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No experts found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">{total} expert{total !== 1 ? 's' : ''} available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {experts.map((e) => <ExpertCard key={e._id} expert={e} />)}
          </div>
        </>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
        <strong>Note:</strong> Expert consultations on CarePath AI are for professional guidance only and do not replace
        in-person medical examination or emergency services.
      </div>
    </div>
  );
};

export default ExpertHelp;
