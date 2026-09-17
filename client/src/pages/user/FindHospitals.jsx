/**
 * FindHospitals — CarePath AI
 * Search and browse verified hospitals.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Search, MapPin, Phone, Stethoscope, AlertCircle,
  Loader2, RefreshCw, Shield, ChevronRight,
} from 'lucide-react';
import { searchHospitals } from '../../services/userService';

const HospitalCard = ({ hospital }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{hospital.name}</p>
          {(hospital.city || hospital.country) && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {[hospital.city, hospital.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>
      {hospital.emergencyAvailable && (
        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          <Shield className="w-3 h-3" /> Emergency
        </span>
      )}
    </div>

    {hospital.description && (
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{hospital.description}</p>
    )}

    {hospital.specialties?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {hospital.specialties.slice(0, 4).map((s) => (
          <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{s}</span>
        ))}
        {hospital.specialties.length > 4 && (
          <span className="text-xs text-gray-400">+{hospital.specialties.length - 4} more</span>
        )}
      </div>
    )}

    <div className="flex items-center justify-between text-xs text-gray-500">
      {hospital.phone && (
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {hospital.phone}</span>
      )}
      <Link to={`/user/hospitals/${hospital._id}`}
        className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-700 ml-auto">
        View details <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  </div>
);

const FindHospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const [query, setQuery]       = useState('');
  const [city, setCity]         = useState('');
  const [specialty, setSpec]    = useState('');
  const [emergency, setEmerg]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 30 };
      if (query)    params.q         = query;
      if (city)     params.city      = city;
      if (specialty) params.specialty = specialty;
      if (emergency) params.emergency = 'true';

      const res = await searchHospitals(params);
      setHospitals(res.data?.hospitals || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  }, [query, city, specialty, emergency]);

  useEffect(() => {
    const t = setTimeout(() => { load(); }, 400);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Hospitals</h1>
        <p className="text-sm text-gray-500 mt-1">Browse verified hospitals near you.</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialty..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <input value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={specialty} onChange={(e) => setSpec(e.target.value)}
            placeholder="Specialty"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={emergency} onChange={(e) => setEmerg(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded" />
            Emergency only
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : (
        <>
          {!loading && (
            <p className="text-xs text-gray-500">{total} hospital{total !== 1 ? 's' : ''} found</p>
          )}
          {hospitals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-xl">
              <Building2 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-700">No hospitals found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hospitals.map((h) => <HospitalCard key={h._id} hospital={h} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FindHospitals;
