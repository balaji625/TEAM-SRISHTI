/**
 * ProfessionalAvailability — CarePath AI
 * Healthcare Professional: set weekly availability schedule.
 * Route: /professional/availability
 */

import { useState, useEffect } from 'react';
import { Clock, Save, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { fetchProfessionalProfile, updateAvailability } from '../../services/professionalService';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const defaultSlot = (day) => ({ day, startTime: '09:00', endTime: '17:00', available: false });

const ProfessionalAvailability = () => {
  const [slots, setSlots]     = useState(DAYS.map(defaultSlot));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetchProfessionalProfile()
      .then((res) => {
        const avail = res.data.profile?.availability;
        if (avail && avail.length > 0) {
          const merged = DAYS.map((day) => {
            const existing = avail.find((s) => s.day === day);
            return existing || defaultSlot(day);
          });
          setSlots(merged);
        }
      })
      .catch(() => setError('Failed to load availability'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (day) => {
    setSlots((prev) => prev.map((s) => s.day === day ? { ...s, available: !s.available } : s));
  };

  const setTime = (day, field, value) => {
    setSlots((prev) => prev.map((s) => s.day === day ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      await updateAvailability(slots.filter((s) => s.available));
      setSuccess('Availability saved successfully!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set your weekly consultation hours</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Toggle a day to mark it as available, then set your start and end times. Patients can book appointments during these hours.</span>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        {slots.map((slot) => (
          <div key={slot.day} className={`px-5 py-4 transition-colors ${slot.available ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-4">
              {/* Toggle */}
              <button type="button" onClick={() => toggle(slot.day)}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${slot.available ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${slot.available ? 'translate-x-5' : ''}`} />
              </button>

              {/* Day name */}
              <span className={`text-sm font-medium w-24 shrink-0 ${slot.available ? 'text-gray-900' : 'text-gray-400'}`}>
                {slot.day.charAt(0) + slot.day.slice(1).toLowerCase()}
              </span>

              {/* Time inputs */}
              {slot.available ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={slot.startTime} onChange={(e) => setTime(slot.day, 'startTime', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <span className="text-xs text-gray-400">to</span>
                  <input type="time" value={slot.endTime} onChange={(e) => setTime(slot.day, 'endTime', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">Not available</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Availability
        </button>
      </div>
    </div>
  );
};

export default ProfessionalAvailability;
