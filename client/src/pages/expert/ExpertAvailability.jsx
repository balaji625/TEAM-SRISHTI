/**
 * ExpertAvailability — CarePath AI
 * Independent Expert: set weekly availability schedule.
 * DYNAMIC — loads from and saves to /api/expert/availability.
 */

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { fetchExpertAvailability, saveExpertAvailability } from '../../services/expertService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ENUM = {
  Monday: 'MONDAY', Tuesday: 'TUESDAY', Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY', Friday: 'FRIDAY', Saturday: 'SATURDAY', Sunday: 'SUNDAY',
};
const ENUM_TO_DAY = Object.fromEntries(Object.entries(DAY_ENUM).map(([k, v]) => [v, k]));

const DEFAULT_SCHEDULE = {
  Monday:    { enabled: true,  from: '09:00', to: '17:00' },
  Tuesday:   { enabled: true,  from: '09:00', to: '17:00' },
  Wednesday: { enabled: true,  from: '09:00', to: '13:00' },
  Thursday:  { enabled: true,  from: '09:00', to: '17:00' },
  Friday:    { enabled: true,  from: '09:00', to: '15:00' },
  Saturday:  { enabled: false, from: '10:00', to: '13:00' },
  Sunday:    { enabled: false, from: '10:00', to: '12:00' },
};

const CONSULTATION_MODE_OPTIONS = [
  { value: 'VIDEO',      label: 'Video Call' },
  { value: 'CHAT',       label: 'Chat' },
  { value: 'IN_PERSON',  label: 'In-Person' },
  { value: 'PHONE',      label: 'Phone' },
];

const ExpertAvailability = () => {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [modes, setModes]       = useState(['VIDEO', 'CHAT', 'IN_PERSON']);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);

  // Load availability from backend on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchExpertAvailability();
        const avail = res.data?.availability || [];
        const savedModes = res.data?.consultationModes || [];

        if (avail.length > 0) {
          const rebuilt = { ...DEFAULT_SCHEDULE };
          // Reset all to disabled first
          for (const day of DAYS) rebuilt[day] = { ...rebuilt[day], enabled: false };
          for (const slot of avail) {
            const dayName = ENUM_TO_DAY[slot.day];
            if (dayName) {
              rebuilt[dayName] = {
                enabled: slot.available !== false,
                from:    slot.startTime || '09:00',
                to:      slot.endTime   || '17:00',
              };
            }
          }
          setSchedule(rebuilt);
        }

        if (savedModes.length > 0) setModes(savedModes);
      } catch {
        // If no profile yet, keep defaults silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (day) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));

  const setTime = (day, field, value) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const toggleMode = (value) =>
    setModes((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      // Convert schedule to the AvailabilitySchema array format
      const availability = DAYS.map((day) => ({
        day:       DAY_ENUM[day],
        startTime: schedule[day].from,
        endTime:   schedule[day].to,
        available: schedule[day].enabled,
      }));

      await saveExpertAvailability(availability, modes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Availability</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set your weekly consultation hours — patients will see only your available slots.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Consultation modes */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-violet-700 mb-2 uppercase tracking-wide">Consultation Modes</p>
        <div className="flex flex-wrap gap-2">
          {CONSULTATION_MODE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleMode(value)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                modes.includes(value)
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-white border-violet-200 text-violet-700 hover:bg-violet-50'
              }`}
            >
              {modes.includes(value) && <CheckCircle className="w-3 h-3" />} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Weekly Schedule</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {DAYS.map((day) => {
            const s = schedule[day];
            return (
              <div key={day} className={`px-5 py-4 flex items-center gap-4 ${s.enabled ? '' : 'opacity-60'}`}>
                <button type="button" onClick={() => toggle(day)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${s.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}>
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${s.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="w-24 text-sm font-medium text-gray-700">{day}</span>
                {s.enabled ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" value={s.from} onChange={(e) => setTime(day, 'from', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    <span className="text-gray-400">to</span>
                    <input type="time" value={s.to} onChange={(e) => setTime(day, 'to', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Availability'}
      </button>
    </div>
  );
};

export default ExpertAvailability;
