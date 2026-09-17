/**
 * NearbyHealthcare — CarePath AI
 *
 * Location-aware widget for UserDashboard.
 * Requests geolocation permission, finds nearby verified hospitals.
 * Fails silently — never blocks the dashboard.
 *
 * Privacy: location is used only for the current search and NOT stored permanently.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Loader2, RefreshCw, Building2, AlertCircle,
  Navigation, Shield, Phone, ChevronRight,
} from 'lucide-react';
import { fetchNearbyHospitals } from '../../services/userService';

const NearbyHealthcare = () => {
  const [state, setState] = useState('idle'); // idle | requesting | loading | done | denied | error
  const [hospitals, setHospitals] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const findNearby = useCallback(async (lat, lng) => {
    setState('loading');
    try {
      const res = await fetchNearbyHospitals({ lat, lng, radius: 50 });
      setHospitals(res.data?.hospitals || []);
      setState('done');
    } catch {
      setErrorMsg('Could not load nearby facilities.');
      setState('error');
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setState('error');
      return;
    }
    setState('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        findNearby(latitude, longitude);
      },
      (err) => {
        if (err.code === 1) {
          setState('denied');
        } else {
          setErrorMsg('Could not determine your location.');
          setState('error');
        }
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [findNearby]);

  const refresh = () => {
    if (userCoords) {
      findNearby(userCoords.lat, userCoords.lng);
    } else {
      requestLocation();
    }
  };

  // ── Render states ─────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Nearby Healthcare</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Find verified hospitals and clinics near your current location.
        </p>
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Your location is used only to find nearby healthcare services and is not stored.
        </p>
        <button
          onClick={requestLocation}
          className="flex items-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Navigation className="w-4 h-4" /> Find Nearby Hospitals
        </button>
      </div>
    );
  }

  if (state === 'requesting' || state === 'loading') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Nearby Healthcare</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          {state === 'requesting' ? 'Requesting location permission…' : 'Finding nearby hospitals…'}
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Nearby Healthcare</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Location permission was denied. You can still search hospitals manually.
        </p>
        <Link
          to="/user/hospitals"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Building2 className="w-3.5 h-3.5" /> Search Hospitals <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Nearby Healthcare</h2>
        </div>
        <p className="text-xs text-red-600 mb-2">{errorMsg}</p>
        <Link to="/user/hospitals" className="text-sm text-blue-600 hover:underline font-medium">
          Search hospitals manually →
        </Link>
      </div>
    );
  }

  // state === 'done'
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Nearby Healthcare</h2>
        </div>
        <button
          onClick={refresh}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
        <Shield className="w-3 h-3" />
        Your location is used only to find nearby services and is not stored.
      </p>

      {hospitals.length === 0 ? (
        <div className="text-center py-4">
          <Building2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No verified hospitals found within 50 km.</p>
          <p className="text-xs text-gray-400 mt-1">
            Hospitals need coordinates in their profile to appear here.
          </p>
          <Link to="/user/hospitals" className="text-sm text-blue-600 hover:underline mt-2 block font-medium">
            Search all hospitals →
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {hospitals.slice(0, 5).map((h) => (
            <div key={h._id} className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  h.emergencyAvailable ? 'bg-red-50' : 'bg-blue-50'
                }`}>
                  <Building2 className={`w-4 h-4 ${h.emergencyAvailable ? 'text-red-600' : 'text-blue-600'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
                  <p className="text-xs text-gray-500">
                    📍 {h.distanceKm} km
                    {h.city ? ` · ${h.city}` : ''}
                    {h.emergencyAvailable && <span className="ml-1 text-red-600 font-medium">· 🚨 Emergency</span>}
                  </p>
                  {h.specialties?.length > 0 && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{h.specialties.slice(0, 3).join(', ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {h.phone && (
                  <a href={`tel:${h.phone}`}
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  </a>
                )}
                <Link to={`/user/hospitals/${h._id}`}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                </Link>
              </div>
            </div>
          ))}
          {hospitals.length > 5 && (
            <Link to="/user/hospitals"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1">
              View all {hospitals.length} nearby hospitals <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyHealthcare;
