/**
 * HowItWorks — CarePath AI (Stage 5: complete)
 * Full user journey + all role explanations
 */
import { Link } from 'react-router-dom';
import {
  UserPlus, Brain, Building2, Stethoscope, Users, Calendar,
  FileText, Activity, ArrowRight, Heart, Shield, CheckCircle,
} from 'lucide-react';

const USER_STEPS = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create your account',
    desc: 'Register as a patient, hospital, professional, or expert. Your role determines your access level and capabilities across the platform.',
  },
  {
    icon: Brain,
    step: '02',
    title: 'Describe your health concern',
    desc: 'Use the AI assistant to describe your concern in plain language. No medical jargon needed — the AI understands context and helps identify the right pathway.',
  },
  {
    icon: Building2,
    step: '03',
    title: 'AI identifies your care pathway',
    desc: 'Based on your concern, the AI routes you toward a hospital, specialist, expert, or emergency pathway — always with safety as the primary consideration.',
  },
  {
    icon: Stethoscope,
    step: '04',
    title: 'Discover verified providers',
    desc: 'Browse admin-verified hospitals and professionals filtered by specialty, location, and availability. Every provider has been reviewed before listing.',
  },
  {
    icon: Calendar,
    step: '05',
    title: 'Request an appointment or consultation',
    desc: 'Submit an appointment request directly. All parties receive real-time notifications at each stage of the booking lifecycle.',
  },
  {
    icon: FileText,
    step: '06',
    title: 'Manage your health information',
    desc: 'Upload health reports and receive plain-language AI explanations — with your explicit consent. Your data is never shared without your permission.',
  },
  {
    icon: Activity,
    step: '07',
    title: 'Track your health history',
    desc: 'Maintain a structured record of vitals, lab results, symptoms, and appointments over time for a complete picture of your health journey.',
  },
  {
    icon: Heart,
    step: '08',
    title: 'Continue your care journey',
    desc: 'Return for follow-up consultations, preventive care guidance, or expert escalation. CarePath AI supports the full care continuum.',
  },
];

const ROLE_DESCRIPTIONS = [
  {
    icon: Users,
    role: 'Patient',
    color: 'bg-blue-50 border-blue-100',
    iconClass: 'text-blue-600',
    flow: [
      'Register account',
      'Use AI assistant to describe health concern',
      'Discover verified hospitals and professionals',
      'Request appointment',
      'Receive confirmation and notifications',
      'Upload and manage health reports',
      'Access health history and preventive care',
      'Request expert help if needed',
    ],
  },
  {
    icon: Building2,
    role: 'Hospital',
    color: 'bg-emerald-50 border-emerald-100',
    iconClass: 'text-emerald-600',
    flow: [
      'Register hospital account',
      'Submit for admin verification',
      'Complete hospital profile',
      'Add doctors and specialists',
      'Receive and review association requests from professionals',
      'Manage appointment requests',
      'Access hospital analytics',
    ],
  },
  {
    icon: Stethoscope,
    role: 'Professional',
    color: 'bg-indigo-50 border-indigo-100',
    iconClass: 'text-indigo-600',
    flow: [
      'Register professional account',
      'Complete profile and add credentials',
      'Request hospital association',
      'Await hospital approval',
      'Set availability',
      'Receive patient appointment requests',
      'Manage consultations',
    ],
  },
  {
    icon: Users,
    role: 'Expert',
    color: 'bg-purple-50 border-purple-100',
    iconClass: 'text-purple-600',
    flow: [
      'Register expert account',
      'Submit credentials for admin verification',
      'Set expertise area and availability',
      'Receive escalated requests from AI pathway',
      'Accept or decline consultations',
      'Conduct expert consultation',
    ],
    note: 'Unverified experts cannot accept consultations until admin verification is complete.',
  },
  {
    icon: Shield,
    role: 'Administrator',
    color: 'bg-rose-50 border-rose-100',
    iconClass: 'text-rose-600',
    flow: [
      'Access admin dashboard',
      'Review and verify hospital registrations',
      'Verify professional credentials',
      'Verify expert qualifications',
      'Monitor platform analytics',
      'Review AI safety outputs',
      'Access immutable audit logs',
    ],
  },
];

const HowItWorks = () => (
  <div className="bg-white">
    {/* Hero */}
    <section className="bg-gradient-to-br from-blue-50 to-white py-20 border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          From health concern to care outcome
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          A step-by-step walkthrough of the complete CarePath AI experience —
          from registration to ongoing care management.
        </p>
      </div>
    </section>

    {/* User journey steps */}
    <section className="py-20" aria-labelledby="journey-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 id="journey-heading" className="text-3xl font-bold text-gray-900 mb-3">
            The patient journey
          </h2>
          <p className="text-gray-600">Eight steps from registration to ongoing care.</p>
        </div>

        <ol className="relative border-l-2 border-blue-100 space-y-0" aria-label="Patient journey steps">
          {USER_STEPS.map(({ icon: Icon, step, title, desc }) => (
            <li key={step} className="ml-8 pb-10 last:pb-0">
              {/* Step circle on the timeline */}
              <span className="absolute -left-[1.1rem] flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
                {step}
              </span>
              <div className="flex items-start gap-4 pt-1">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-blue-600" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>

    {/* AI safety reminder */}
    <section className="py-10 bg-amber-50 border-y border-amber-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-sm text-amber-800 font-medium">
          <strong>Important:</strong> The CarePath AI assistant provides healthcare navigation
          and pathway guidance only. It does not diagnose medical conditions or replace the
          advice of a qualified healthcare professional. If you are experiencing a medical
          emergency, contact emergency services immediately.
        </p>
      </div>
    </section>

    {/* Role flows */}
    <section className="py-20 bg-gray-50" aria-labelledby="roles-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 id="roles-heading" className="text-3xl font-bold text-gray-900 mb-3">
            Workflows for every role
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Each role in CarePath AI has its own purpose-built workflow. Here is how
            each participant experiences the platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ROLE_DESCRIPTIONS.map(({ icon: Icon, role, color, iconClass, flow, note }) => (
            <div key={role} className={`rounded-2xl border p-6 ${color}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white shadow-sm">
                  <Icon className={`w-4 h-4 ${iconClass}`} aria-hidden="true" />
                </span>
                <h3 className="text-sm font-bold text-gray-900">{role}</h3>
              </div>
              <ol className="space-y-1.5">
                {flow.map((step, i) => (
                  <li key={step} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="font-bold text-gray-400 shrink-0 w-4">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              {note && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  ⚠ {note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to begin?</h2>
        <p className="text-gray-600 mb-7">
          Register your free account and start your care journey today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            About CarePath AI
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default HowItWorks;
