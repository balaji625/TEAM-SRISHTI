/**
 * FindProfessionals — CarePath AI
 * Search and browse verified healthcare professionals.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope, Search, User, Calendar, ChevronRight, Loader2,
  AlertCircle, Building2, Clock,
} from 'lucide-react';
import { searchProfessionals } from '../../services/userService';

const MODE_LABELS = {
  IN_PERSON: 'In Person',
  VIDEO: 'Video',
  PHONE: 'Phone',
  CHAT: 'Chat',
};

const ProfessionalCard = ({ professional }) => {
  const approvedHospitals = professional.hospitalAssociations?.filter((a) => a.status === 'APPROVED') || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-cyan-700">
            {professional.name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{professional.name}</p>
          <p className="text-xs text-cyan-700 font-medium">{professional.specialization}</p>
          {professional.qualification && (
            <p className="text-xs text-gray-500 mt-0.5">{professional.qualification}</p>
          )}
        </div>
        {professional.experience > 0 && (
          <span className="shrink-0 text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {professional.experience} yrs
          </span>
        )}
      </div>

      {professional.bio && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{professional.bio}</p>
      )}

      {professional.consultationModes?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {professional.consultationModes.map((m) => (
            <span key={m} className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-100 px-2 py-0.5 rounded-full">
              {MODE_LABELS[m] || m}
            </span>
          ))}
        </div>
      )}

      {approvedHospitals.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <Building2 className="w-3 h-3" />
          {approvedHospitals[0].hospitalId?.name}
          {approvedHospitals.length > 1 && ` +${approvedHospitals.length - 1} more`}
        </div>
      )}

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <Link to={`/user/professionals/${professional._id}`}
          className="flex-1 text-center text-xs font-medium text-cyan-600 hover:text-cyan-700 border border-cyan-200 rounded-lg py-1.5 transition-colors">
          View Profile
        </Link>
        <Link to="/user/appointments"
          className="flex-1 text-center text-xs font-medium bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg py-1.5 transition-colors">
          Book
        </Link>
      </div>
    </div>
  );
};

const FindProfessionals = () => {
  const [professionals, setProfessionals] = useState([]);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [query, setQuery]                 = useState('');
  const [specialization, setSpec]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 30 };
      if (query)          params.q              = query;
      if (specialization) params.specialization = specialization;

      const res = await searchProfessionals(params);
      setProfessionals(res.data?.professionals || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load professionals');
    } finally {
      setLoading(false);
    }
  }, [query, specialization]);

  useEffect(() => {
    const t = setTimeout(() => { load(); }, 400);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Healthcare Professionals</h1>
        <p className="text-sm text-gray-500 mt-1">Find and connect with verified doctors and specialists.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialization, bio..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <input value={specialization} onChange={(e) => setSpec(e.target.value)}
          placeholder="Filter by specialization (e.g. Cardiology)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <>
          {!loading && <p className="text-xs text-gray-500">{total} professional{total !== 1 ? 's' : ''} found</p>}
          {professionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-xl text-center">
              <Stethoscope className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-700">No professionals found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {professionals.map((p) => <ProfessionalCard key={p._id} professional={p} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FindProfessionals;
