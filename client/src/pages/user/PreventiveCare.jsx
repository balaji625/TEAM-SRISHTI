/**
 * PreventiveCare — CarePath AI
 * Educational preventive care tips and reminders.
 */

import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Activity, Apple, Moon, Droplets, Calendar, ChevronRight } from 'lucide-react';

const Tip = ({ icon: Icon, color, title, description, cta, ctaTo }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        {cta && ctaTo && (
          <Link to={ctaTo} className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-2 hover:text-blue-700">
            {cta} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  </div>
);

const SCREENINGS = [
  { name: 'Blood Pressure', frequency: 'Every 1–2 years (adults)', note: 'More frequently if you have hypertension.' },
  { name: 'Blood Glucose (HbA1c)', frequency: 'Every 3 years (40+)', note: 'Annually if pre-diabetic or at risk.' },
  { name: 'Cholesterol Panel', frequency: 'Every 5 years (adults)', note: 'More frequently if risk factors present.' },
  { name: 'Cancer Screenings', frequency: 'Per your doctor\'s guidance', note: 'Mammogram, colonoscopy, PSA — age & risk based.' },
  { name: 'Eye Examination', frequency: 'Every 1–2 years', note: 'More frequently for those with vision issues.' },
  { name: 'Dental Check-up', frequency: 'Every 6 months', note: 'Regular cleaning and examination.' },
];

const PreventiveCare = () => (
  <div className="space-y-6 max-w-3xl">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Preventive Care</h1>
      <p className="text-sm text-gray-500 mt-1">Stay ahead of illness with regular health checks and a healthy lifestyle.</p>
    </div>

    {/* Tips */}
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Healthy Living Tips</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Tip icon={Activity}    color="text-red-600 bg-red-50"     title="Stay Active"
          description="Aim for at least 150 minutes of moderate-intensity aerobic activity per week. Even a 30-minute walk daily makes a significant difference to your cardiovascular health."
          cta="Track your vitals" ctaTo="/user/history" />
        <Tip icon={Apple}       color="text-emerald-600 bg-emerald-50" title="Eat Well"
          description="A balanced diet rich in fruits, vegetables, whole grains, and lean proteins supports immune function and reduces chronic disease risk." />
        <Tip icon={Moon}        color="text-indigo-600 bg-indigo-50" title="Prioritise Sleep"
          description="Adults need 7–9 hours per night. Poor sleep is linked to increased risk of heart disease, diabetes, obesity, and mental health conditions." />
        <Tip icon={Droplets}    color="text-blue-600 bg-blue-50"   title="Stay Hydrated"
          description="Drink at least 8 glasses (2 litres) of water daily. Proper hydration supports kidney function, digestion, and energy levels." />
        <Tip icon={Heart}       color="text-pink-600 bg-pink-50"   title="Manage Stress"
          description="Chronic stress harms the immune system and cardiovascular health. Practice mindfulness, deep breathing, or speak with a professional if needed."
          cta="Talk to an expert" ctaTo="/user/experts" />
        <Tip icon={ShieldCheck} color="text-violet-600 bg-violet-50" title="Vaccinations"
          description="Keep your vaccinations up to date: flu shot annually, COVID boosters per guidelines, and any travel vaccinations if applicable." />
      </div>
    </div>

    {/* Screenings */}
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Recommended Screenings</h2>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {SCREENINGS.map((s) => (
          <div key={s.name} className="px-4 py-3 flex items-start gap-3">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">{s.name}</p>
              <p className="text-xs text-blue-700 font-medium">{s.frequency}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Profile reminder */}
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 leading-relaxed">
      <strong>CarePath AI reminder:</strong> Complete your{' '}
      <Link to="/user/profile" className="underline font-medium">health profile</Link> including allergies and chronic
      conditions so we can provide more relevant preventive care suggestions.
    </div>

    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
      <strong>Disclaimer:</strong> This information is for general educational purposes only and does not constitute medical
      advice. Always consult a qualified healthcare professional for personalised guidance.
    </div>
  </div>
);

export default PreventiveCare;
