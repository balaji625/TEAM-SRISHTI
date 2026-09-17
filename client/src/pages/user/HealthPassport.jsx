/**
 * HealthPassport — CarePath AI
 *
 * Unified "CarePath Health Passport" — a consolidated view of the patient's
 * existing health data: appointments, health records, reports, and referrals.
 *
 * Does NOT duplicate or replace existing systems.
 * Uses existing endpoints and health record/report data.
 * Respects existing RBAC and consent architecture.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Calendar, FileText, Activity, ArrowRight,
  Loader2, RefreshCw, AlertCircle, ChevronRight, Heart,
  Shield, User,
} from 'lucide-react';
import {
  fetchAppointments, fetchHealthRecords, fetchReferrals,
} from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const Section = ({ icon: Icon, title, color, children, to, toLabel }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
          {toLabel || 'View all'} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
    {children}
  </div>
);

const EmptyRow = ({ message }) => (
  <p className="text-xs text-gray-400 text-center py-3">{message}</p>
);

const HealthPassport = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords]           = useState([]);
  const [referrals, setReferrals]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aptRes, recRes, refRes] = await Promise.allSettled([
        fetchAppointments({ limit: 5 }),
        fetchHealthRecords({ limit: 5 }),
        fetchReferrals({ limit: 5 }),
      ]);

      setAppointments(aptRes.status === 'fulfilled' ? aptRes.value?.data?.appointments || [] : []);
      setRecords(recRes.status === 'fulfilled' ? recRes.value?.data?.records || [] : []);
      setReferrals(refRes.status === 'fulfilled' ? refRes.value?.data?.referrals || [] : []);
    } catch {
      setError('Failed to load health passport data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Passport</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your unified health journey — appointments, records, and referrals in one place.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:text-gray-700">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Consent notice */}
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
        <Shield className="w-4 h-4 shrink-0" />
        <span>
          Your health passport is only visible to you. Healthcare professionals can only access
          information you have explicitly consented to share.{' '}
          <Link to="/user/consent" className="underline font-medium">Manage consent →</Link>
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Identity summary */}
      <Section icon={User} title="Identity" color="text-blue-600 bg-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-blue-600">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <Link to="/user/profile"
              className="text-xs text-blue-600 hover:underline mt-0.5 inline-block">
              View full profile →
            </Link>
          </div>
        </div>
      </Section>

      {/* Recent appointments */}
      <Section icon={Calendar} title="Recent Appointments" color="text-emerald-600 bg-emerald-50" to="/user/appointments" toLabel="All appointments">
        {appointments.length === 0 ? (
          <EmptyRow message="No appointments yet" />
        ) : (
          <div className="space-y-2">
            {appointments.slice(0, 3).map((a) => (
              <div key={a._id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 font-medium truncate">{a.reason}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(a.date).toLocaleDateString()} · {a.time}
                    {a.professionalId && ` · ${a.professionalId.name}`}
                    {a.hospitalId && ` · ${a.hospitalId.name}`}
                  </p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  a.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                  a.status === 'PENDING'   ? 'bg-amber-100 text-amber-700' :
                  a.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Health records */}
      <Section icon={Activity} title="Health Records" color="text-purple-600 bg-purple-50" to="/user/history" toLabel="All records">
        {records.length === 0 ? (
          <EmptyRow message="No health records yet" />
        ) : (
          <div className="space-y-2">
            {records.slice(0, 3).map((r) => (
              <div key={r._id} className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    {r.recordType?.replace(/_/g, ' ')} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Health reports */}
      <Section icon={FileText} title="Health Reports" color="text-orange-600 bg-orange-50" to="/user/reports" toLabel="All reports">
        <p className="text-xs text-gray-500">
          View your uploaded health reports and AI-analysed results.
        </p>
        <Link to="/user/reports"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
          Open Health Reports <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </Section>

      {/* Referrals */}
      <Section icon={ArrowRight} title="Referral Journey" color="text-cyan-600 bg-cyan-50" to="/user/referrals" toLabel="All referrals">
        {referrals.length === 0 ? (
          <EmptyRow message="No referrals yet" />
        ) : (
          <div className="space-y-2">
            {referrals.slice(0, 3).map((r) => (
              <div key={r._id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    → {r.destinationHospitalId?.name || r.destinationName || 'Destination TBD'}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">{r.reason}</p>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium shrink-0">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* AI assistant link */}
      <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Ask AI about your health</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Get health information, understand your records, and find the right care.
          </p>
        </div>
        <Link to="/user/ai"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition-colors">
          <Heart className="w-4 h-4" /> Ask AI
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600">
        <strong>CarePath Health Passport</strong> is a summary view of your existing health data.
        It does not replace official medical records. For complete clinical records, always consult your healthcare provider.
      </div>
    </div>
  );
};

export default HealthPassport;
