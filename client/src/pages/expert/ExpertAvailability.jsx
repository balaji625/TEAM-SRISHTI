/**
 * ExpertAvailability — CarePath AI
 * Independent Expert: set weekly availability schedule.
 * Static display — non-dynamic (no API calls).
 */

import { useState } from 'react';
import { Clock, CheckCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE = {
  Monday:    { enabled: true,  from: '09:00', to: '17:00' },
  Tuesday:   { enabled: true,  from: '09:00', to: '17:00' },
  Wednesday: { enabled: true,  from: '09:00', to: '13:00' },
  Thursday:  { enabled: true,  from: '09:00', to: '17:00' },
  Friday:    { enabled: true,  from: '09:00', to: '15:00' },
  Saturday:  { enabled: false, from: '10:00', to: '13:00' },
  Sunday:    { enabled: false, from: '10:00', to: '12:00' },
};

const ExpertAvailability = () => {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [saved, setSaved]       = useState(false);

  const toggle = (day) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));

  const setTime = (day, field, value) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Availability</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set your weekly consultation hours</p>
      </div>

      {/* Consultation modes */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-violet-700 mb-2 uppercase tracking-wide">Consultation Modes</p>
        <div className="flex flex-wrap gap-2">
          {['Video Call', 'Chat', 'In-Person'].map((mode) => (
            <span key={mode} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-violet-200 text-xs font-medium text-violet-700">
              <CheckCircle className="w-3 h-3" /> {mode}
            </span>
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
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggle(day)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    s.enabled ? 'bg-violet-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                    s.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>

                {/* Day name */}
                <span className="w-24 text-sm font-medium text-gray-700">{day}</span>

                {/* Time pickers */}
                {s.enabled ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={s.from}
                      onChange={(e) => setTime(day, 'from', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={s.to}
                      onChange={(e) => setTime(day, 'to', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
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
      <button
        onClick={handleSave}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Availability'}
      </button>
    </div>
  );
};

export default ExpertAvailability;
