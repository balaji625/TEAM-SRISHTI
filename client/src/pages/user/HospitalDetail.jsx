/**
 * HospitalDetail — CarePath AI
 * View a single hospital's full profile, including Google Maps integration.
 * Uses real lat/lng from MongoDB when available, falls back to static map link.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Building2, MapPin, Phone, Mail, Shield, Stethoscope,
  ArrowLeft, Loader2, AlertCircle, CheckCircle, Calendar, ExternalLink,
  Map,
} from 'lucide-react';
import { fetchHospitalById } from '../../services/userService';

// ── Google Maps component ──────────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const HospitalMap = ({ hospital }) => {
  const mapRef  = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | loaded | error | no-coords

  const lat = hospital?.location?.latitude;
  const lng = hospital?.location?.longitude;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  useEffect(() => {
    if (!hasCoords) { setStatus('no-coords'); return; }
    if (!GOOGLE_MAPS_API_KEY) { setStatus('no-key'); return; }
    if (!mapRef.current) return;

    // Prevent double-loading the script
    const SCRIPT_ID = 'google-maps-script';
    const initMap = () => {
      try {
        setStatus('loading');
        // eslint-disable-next-line no-undef
        const map = new window.google.maps.Map(mapRef.current, {
          center:    { lat, lng },
          zoom:      15,
          mapTypeId: 'roadmap',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        // eslint-disable-next-line no-undef
        new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: hospital.name,
          // eslint-disable-next-line no-undef
          animation: window.google.maps.Animation.DROP,
        });
        setStatus('loaded');
      } catch (err) {
        console.error('[HospitalMap] Error initializing map:', err);
        setStatus('error');
      }
    };

    if (window.google?.maps) {
      initMap();
      return;
    }

    // Attach a unique callback name to avoid collision
    const callbackName = `initMap_${Date.now()}`;
    window[callbackName] = () => {
      initMap();
      delete window[callbackName];
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id   = SCRIPT_ID;
      script.src  = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=${callbackName}&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => { setStatus('error'); delete window[callbackName]; };
      document.head.appendChild(script);
    } else {
      // Script already in DOM, wait for it
      const wait = setInterval(() => {
        if (window.google?.maps) { clearInterval(wait); initMap(); }
      }, 100);
      return () => clearInterval(wait);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Google Maps URL for the location (works without API key as fallback link)
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [hospital.name, hospital.city, hospital.country].filter(Boolean).join(', ')
      )}`;

  if (status === 'no-coords') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-600" /> Location
        </h2>
        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl border border-gray-100 text-center">
          <MapPin className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-xs text-gray-500 mb-3">Map coordinates not available for this hospital.</p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Search on Google Maps
          </a>
        </div>
      </div>
    );
  }

  if (status === 'no-key') {
    // No API key — render a static embedded map via Google Maps iframe (no API key needed for basic embed)
    const query = encodeURIComponent([hospital.name, hospital.city, hospital.country].filter(Boolean).join(', '));
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Map className="w-4 h-4 text-blue-600" /> Location
          </h2>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
            <ExternalLink className="w-3 h-3" /> Open in Maps
          </a>
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <iframe
            title="Hospital Location"
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${query}&output=embed`}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Map shown for "{hospital.city || hospital.name}". Add coordinates in the hospital profile for a precise pin.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-600" /> Location
        </h2>
        <div className="flex flex-col items-center justify-center py-6 bg-red-50 rounded-xl border border-red-100 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <p className="text-xs text-red-600 mb-2">Failed to load map.</p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Open in Google Maps
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-600" /> Location
        </h2>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
          <ExternalLink className="w-3 h-3" /> Open in Maps
        </a>
      </div>
      <div ref={mapRef} className="w-full h-72 rounded-xl overflow-hidden border border-gray-100 bg-gray-100">
        {status === 'loading' && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

const Tag = ({ label, color = 'blue' }) => {
  const colors = {
    blue:    'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    orange:  'bg-orange-50 text-orange-700 border-orange-100',
  };
  return (
    <span className={`text-xs border rounded-full px-2.5 py-1 ${colors[color]}`}>{label}</span>
  );
};

const HospitalDetail = () => {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchHospitalById(id)
      .then((r) => setHospital(r.data?.hospital))
      .catch((err) => setError(err.response?.data?.message || 'Hospital not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  );

  if (error || !hospital) return (
    <div className="space-y-4">
      <Link to="/user/hospitals" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to hospitals
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" /> {error || 'Hospital not found'}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/user/hospitals" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to hospitals
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{hospital.name}</h1>
              {(hospital.city || hospital.country) && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {[hospital.city, hospital.state, hospital.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
            {hospital.emergencyAvailable && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                <Shield className="w-3 h-3" /> Emergency 24/7
              </span>
            )}
          </div>
        </div>

        {hospital.description && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{hospital.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {hospital.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {hospital.phone}</span>}
          {hospital.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> {hospital.email}</span>}
        </div>
      </div>

      {/* Specialties */}
      {hospital.specialties?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600" /> Medical Specialties
          </h2>
          <div className="flex flex-wrap gap-2">
            {hospital.specialties.map((s) => <Tag key={s} label={s} color="blue" />)}
          </div>
        </div>
      )}

      {/* Services */}
      {hospital.services?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Services Offered</h2>
          <div className="flex flex-wrap gap-2">
            {hospital.services.map((s) => <Tag key={s} label={s} color="emerald" />)}
          </div>
        </div>
      )}

      {/* Facilities */}
      {hospital.facilities?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Facilities</h2>
          <div className="flex flex-wrap gap-2">
            {hospital.facilities.map((f) => <Tag key={f} label={f} color="orange" />)}
          </div>
        </div>
      )}

      {/* Google Maps */}
      <HospitalMap hospital={hospital} />

      {/* CTA */}
      <Link to="/user/appointments"
        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors">
        <Calendar className="w-4 h-4" /> Book an Appointment at this Hospital
      </Link>
    </div>
  );
};

export default HospitalDetail;
