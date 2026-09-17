/**
 * ProfessionalDetail — CarePath AI
 * View a single professional's full profile.
 */

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Stethoscope, ArrowLeft, Loader2, AlertCircle, Building2,
  Phone, Mail, Clock, Award, Calendar,
} from 'lucide-react';
import { fetchProfessionalById } from '../../services/userService';

const DAY_LABELS = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const MODE_LABELS = {
  IN_PERSON: 'In Person', VIDEO: 'Video', PHONE: 'Phone', CHAT: 'Chat',
};

const ProfessionalDetail = () => {
  const { id } = useParams();
  const [pro, setPro]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchProfessionalById(id)
      .then((r) => setPro(r.data?.professional))
      .catch((err) => setError(err.response?.data?.message || 'Professional not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
    </div>
  );

  if (error || !pro) return (
    <div className="space-y-4">
      <Link to="/user/professionals" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to professionals
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
        {error || 'Professional not found'}
      </div>
    </div>
  );

  const approvedHospitals = pro.hospitalAssociations?.filter((a) => a.status === 'APPROVED') || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/user/professionals" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to professionals
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-cyan-700">
              {pro.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{pro.name}</h1>
            <p className="text-sm text-cyan-700 font-medium">{pro.specialization}</p>
            {pro.qualification && <p className="text-sm text-gray-500 mt-0.5">{pro.qualification}</p>}
            {pro.experience > 0 && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {pro.experience} years experience
              </p>
            )}
          </div>
        </div>

        {pro.bio && (
          <p className="text-sm text-gray-600 leading-relaxed">{pro.bio}</p>
        )}

        {pro.phone && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-3">
            <Phone className="w-4 h-4 text-gray-400" /> {pro.phone}
          </div>
        )}
        {pro.email && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
            <Mail className="w-4 h-4 text-gray-400" /> {pro.email}
          </div>
        )}
      </div>

      {/* Consultation modes */}
      {pro.consultationModes?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Consultation Modes</h2>
          <div className="flex flex-wrap gap-2">
            {pro.consultationModes.map((m) => (
              <span key={m} className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-100 px-2.5 py-1 rounded-full">
                {MODE_LABELS[m] || m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      {pro.availability?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Weekly Availability</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {pro.availability.filter((a) => a.available).map((a) => (
              <div key={a.day} className="bg-cyan-50 rounded-lg p-2 text-center">
                <p className="text-xs font-semibold text-cyan-700">{DAY_LABELS[a.day] || a.day}</p>
                {a.startTime && <p className="text-xs text-gray-500">{a.startTime} – {a.endTime}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital associations */}
      {approvedHospitals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Associated Hospitals
          </h2>
          <div className="space-y-2">
            {approvedHospitals.map((a) => (
              <div key={a._id} className="flex items-center gap-3 text-sm text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{a.hospitalId?.name}</span>
                {a.hospitalId?.city && <span className="text-gray-400">— {a.hospitalId.city}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link to="/user/appointments"
        className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm rounded-xl transition-colors">
        <Calendar className="w-4 h-4" /> Book Appointment with Dr. {pro.name?.split(' ')[0]}
      </Link>
    </div>
  );
};

export default ProfessionalDetail;
