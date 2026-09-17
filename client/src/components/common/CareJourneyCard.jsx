/**
 * CareJourneyCard — CarePath AI
 *
 * Visual representation of "My Care Journey" on the user dashboard.
 * Fetches real data from existing APIs to determine current stage.
 * Connects: AI → Triage → Hospital/Professional → Appointment → Referral → Health Record → Follow-up
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Building2, Calendar, FileText, ArrowRight,
  CheckCircle, Circle, Clock, Loader2,
} from 'lucide-react';
import { fetchAppointments, fetchHealthRecords, fetchReferrals } from '../../services/userService';

const STAGES = [
  { key: 'ai',           label: 'AI Consultation',  icon: Brain,      to: '/user/ai' },
  { key: 'hospital',     label: 'Find Care',         icon: Building2,  to: '/user/hospitals' },
  { key: 'appointment',  label: 'Appointment',       icon: Calendar,   to: '/user/appointments' },
  { key: 'referral',     label: 'Referral',          icon: ArrowRight, to: '/user/referrals' },
  { key: 'record',       label: 'Health Record',     icon: FileText,   to: '/user/history' },
  { key: 'followup',     label: 'Follow-up',         icon: Clock,      to: '/user/appointments' },
];

const CareJourneyCard = () => {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compute = async () => {
      try {
        const [aptRes, recRes, refRes] = await Promise.allSettled([
          fetchAppointments({ limit: 5 }),
          fetchHealthRecords({ limit: 5 }),
          fetchReferrals({ limit: 5 }),
        ]);

        const appointments = aptRes.status === 'fulfilled'
          ? aptRes.value?.data?.appointments || [] : [];
        const records = recRes.status === 'fulfilled'
          ? recRes.value?.data?.records || [] : [];
        const referrals = refRes.status === 'fulfilled'
          ? refRes.value?.data?.referrals || [] : [];

        // Determine which stages are "completed" based on actual data
        const hasActiveAppt = appointments.some((a) =>
          ['PENDING', 'CONFIRMED'].includes(a.status)
        );
        const hasCompletedAppt = appointments.some((a) => a.status === 'COMPLETED');
        const hasRecord = records.length > 0;
        const hasReferral = referrals.length > 0;
        const hasFollowUp = appointments.some((a) =>
          a.status === 'PENDING' && new Date(a.date) > new Date()
        );

        // Current active stage (the first incomplete stage after any completed ones)
        let currentStage = 'ai'; // default: start AI consultation
        if (hasActiveAppt || hasCompletedAppt) currentStage = 'appointment';
        if (hasReferral) currentStage = 'referral';
        if (hasRecord) currentStage = 'record';
        if (hasFollowUp && hasCompletedAppt) currentStage = 'followup';

        const completedStages = new Set();
        if (hasActiveAppt || hasCompletedAppt) {
          completedStages.add('ai');
          completedStages.add('hospital');
        }
        if (hasCompletedAppt) completedStages.add('appointment');
        if (hasReferral && referrals.some((r) => r.status === 'COMPLETED')) {
          completedStages.add('referral');
        }
        if (hasRecord) completedStages.add('record');

        setJourney({ currentStage, completedStages });
      } catch {
        setJourney({ currentStage: 'ai', completedStages: new Set() });
      } finally {
        setLoading(false);
      }
    };
    compute();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">My Care Journey</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading journey…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">My Care Journey</h2>
      <div className="flex flex-col gap-0">
        {STAGES.map((stage, idx) => {
          const done    = journey?.completedStages?.has(stage.key);
          const active  = stage.key === journey?.currentStage && !done;
          const Icon    = stage.icon;

          return (
            <div key={stage.key} className="flex items-start gap-3">
              {/* Connector line + icon column */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors ${
                  done   ? 'border-emerald-500 bg-emerald-500 text-white' :
                  active ? 'border-blue-500 bg-blue-50 text-blue-600' :
                  'border-gray-200 bg-white text-gray-300'
                }`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`w-0.5 h-6 ${done ? 'bg-emerald-300' : 'bg-gray-100'}`} />
                )}
              </div>
              {/* Stage label */}
              <div className="pb-2 pt-0.5 min-w-0 flex-1">
                <Link to={stage.to}
                  className={`text-sm font-medium hover:underline transition-colors ${
                    done   ? 'text-emerald-700' :
                    active ? 'text-blue-700' :
                    'text-gray-400'
                  }`}
                >
                  {stage.label}
                </Link>
                {active && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                    Current
                  </span>
                )}
                {done && (
                  <span className="ml-2 text-xs text-emerald-600 font-medium">✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Link to="/user/passport"
        className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
        View Health Passport <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
};

export default CareJourneyCard;
