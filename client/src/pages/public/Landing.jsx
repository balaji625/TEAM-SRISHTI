/**
 * Landing — CarePath AI (Stage 5: complete premium page)
 * "Your Health. One Intelligent Path."
 */
import { Link } from 'react-router-dom';
import {
  Brain, Building2, Stethoscope, Users, Shield, FileText,
  Heart, ArrowRight, CheckCircle, ChevronRight, Star,
  Calendar, Activity, AlertCircle, Lock, Zap, ClipboardList,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ── Section: Hero ─────────────────────────────────────────────────────────────
const Hero = ({ isAuthenticated, dashboardPath }) => (
  <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-white">
    {/* Subtle background grid */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" aria-hidden="true" />

    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
        AI-Powered Healthcare Access Platform
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
        Your Health.{' '}
        <span className="text-blue-600">One Intelligent</span> Path.
      </h1>

      {/* Sub-headline */}
      <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
        CarePath AI connects you with verified hospitals, qualified healthcare
        professionals, and independent health experts — guided by an AI layer
        that understands your needs before you arrive.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
        {isAuthenticated ? (
          <Link
            to={dashboardPath}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get Started — Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              How It Works
              <ChevronRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500">
        {[
          'No credit card required',
          'Verified healthcare providers',
          'Privacy-first architecture',
          'Role-based access control',
        ].map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
            {t}
          </span>
        ))}
      </div>
    </div>
  </section>
);

// ── Section: Stats ────────────────────────────────────────────────────────────
const STATS = [
  { value: '5 Roles',  label: 'Patients · Hospitals · Professionals · Experts · Admins' },
  { value: 'AI-First', label: 'Intelligent pathway routing, not a generic chatbot' },
  { value: 'Verified', label: 'Every hospital and professional reviewed by our admin team' },
  { value: 'Secure',   label: 'JWT auth · RBAC · consent management · audit logging' },
];

const Stats = () => (
  <section className="border-y border-gray-100 bg-white" aria-label="Platform highlights">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        {STATS.map(({ value, label }) => (
          <div key={value} className="p-4">
            <dt className="text-2xl font-extrabold text-gray-900 mb-1">{value}</dt>
            <dd className="text-xs text-gray-500 leading-relaxed">{label}</dd>
          </div>
        ))}
      </dl>
    </div>
  </section>
);

// ── Section: AI Introduction ──────────────────────────────────────────────────
const AIIntro = () => (
  <section className="py-20 bg-white" aria-labelledby="ai-intro-heading">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
            <Brain className="w-3.5 h-3.5" aria-hidden="true" />
            AI Intelligence Layer
          </span>
          <h2 id="ai-intro-heading" className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            Healthcare guidance that understands context, not just keywords
          </h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            The CarePath AI assistant is not a generic chatbot. It processes your health
            concerns with context-aware intelligence, identifies appropriate care pathways,
            and routes you toward the right healthcare resource — whether that is a hospital,
            a specialist, or an independent expert.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            When a concern may require urgent attention, the AI recognises this and guides
            you toward emergency or expert escalation — always prioritising your safety.
          </p>
          {/* AI capabilities */}
          <ul className="space-y-2.5">
            {[
              'Understands health concerns in plain language',
              'Identifies appropriate healthcare pathways',
              'Routes to hospitals, professionals, or experts',
              'Recognises and escalates urgent concerns',
              'Operates with provider-independent architecture',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual: AI disclaimer card */}
        <div className="relative">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 shrink-0">
                <Brain className="w-5 h-5 text-white" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">CarePath AI Assistant</p>
                <p className="text-xs text-gray-500">Healthcare pathway intelligence</p>
              </div>
            </div>

            {/* Mock conversation snippet — clearly labelled */}
            <div className="space-y-3 mb-5">
              <div className="bg-gray-100 rounded-xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 max-w-xs">
                "I have been experiencing persistent headaches and difficulty sleeping for two weeks."
              </div>
              <div className="bg-blue-600 rounded-xl rounded-tr-sm px-4 py-3 text-sm text-white ml-8">
                "I understand. Based on what you have described, speaking with a general practitioner or neurologist would be appropriate.
                Would you like me to help you find a verified specialist nearby?"
              </div>
            </div>

            {/* Safety disclaimer */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Important:</strong> CarePath AI provides healthcare navigation guidance only.
                It does not diagnose conditions or replace professional medical advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── Section: How CarePath Works ───────────────────────────────────────────────
const FLOW_STEPS = [
  { icon: Users,      label: 'You describe your health concern',         desc: 'In plain language — no medical jargon required.' },
  { icon: Brain,      label: 'AI understands and analyses',              desc: 'Intent detection, context analysis, and care-pathway routing.' },
  { icon: Building2,  label: 'Pathway identified',                       desc: 'Hospital, professional, expert, or emergency — the right route.' },
  { icon: UserCheck,  label: 'Verified provider matched',                desc: 'Every hospital and professional is reviewed by our admin team.' },
  { icon: Calendar,   label: 'Appointment or consultation',              desc: 'Request, confirm, and manage — all in one place.' },
];

const HowItWorksFlow = () => (
  <section className="py-20 bg-gray-50" aria-labelledby="flow-heading">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 id="flow-heading" className="text-3xl font-bold text-gray-900 mb-3">
          From concern to care — in one intelligent flow
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          CarePath AI eliminates the friction between a health concern and the right provider.
        </p>
      </div>

      {/* Flow steps */}
      <div className="relative">
        {/* Connector line — desktop only */}
        <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-blue-100" aria-hidden="true" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative">
          {FLOW_STEPS.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className="flex flex-col items-center text-center group">
              <div className="relative mb-4">
                <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white border-2 border-blue-100 group-hover:border-blue-300 transition-colors shadow-sm z-10 relative">
                  <Icon className="w-7 h-7 text-blue-600" aria-hidden="true" />
                </span>
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {i + 1}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{label}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          See the complete journey <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </section>
);

// ── Section: Verified Healthcare Network ─────────────────────────────────────
const NETWORK_TYPES = [
  {
    icon: Building2,
    title: 'Verified Hospitals',
    color: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    points: [
      'Manual admin review before listing',
      'Institution profile and specialty data',
      'Emergency availability indicator',
      'Doctor and specialist directory',
    ],
  },
  {
    icon: Stethoscope,
    title: 'Verified Professionals',
    color: 'bg-indigo-50 border-indigo-100',
    iconColor: 'text-indigo-600',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    points: [
      'Credential and licence verification',
      'Hospital affiliation confirmation',
      'Specialisation and availability',
      'Consultation mode preferences',
    ],
  },
  {
    icon: Users,
    title: 'Independent Experts',
    color: 'bg-purple-50 border-purple-100',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    points: [
      'Verified before accepting escalations',
      'Accessible via expert escalation flow',
      'Supports complex and specialist cases',
      'Independent of hospital networks',
    ],
  },
];

const VerifiedNetwork = () => (
  <section className="py-20 bg-white" aria-labelledby="network-heading">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
          Verified Healthcare Network
        </span>
        <h2 id="network-heading" className="text-3xl font-bold text-gray-900 mb-3">
          Trust the providers you connect with
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Every institution and professional on CarePath AI is reviewed by our
          administrative team before they can interact with patients.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {NETWORK_TYPES.map(({ icon: Icon, title, color, iconColor, badgeBg, badgeText, points }) => (
          <div key={title} className={`rounded-2xl border p-6 ${color}`}>
            <div className="flex items-center gap-3 mb-5">
              <span className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white ${iconColor} shadow-sm`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>
                  Admin Verified
                </span>
              </div>
            </div>
            <ul className="space-y-2">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Section: Key Features ─────────────────────────────────────────────────────
const FEATURES = [
  { icon: Brain,         label: 'AI Assistant',         desc: 'Context-aware healthcare pathway guidance.' },
  { icon: Building2,     label: 'Hospital Discovery',   desc: 'Search and filter verified hospitals near you.' },
  { icon: Stethoscope,   label: 'Professional Search',  desc: 'Find specialists by area, availability, and hospital.' },
  { icon: Users,         label: 'Expert Help',          desc: 'Access independent experts for complex needs.' },
  { icon: Calendar,      label: 'Appointments',         desc: 'Request, confirm, and manage appointments.' },
  { icon: FileText,      label: 'Health Reports',       desc: 'Upload reports with AI plain-language explanation.' },
  { icon: Activity,      label: 'Health History',       desc: 'Structured record of your health journey.' },
  { icon: Heart,         label: 'Preventive Care',      desc: 'Personalised health and wellness guidance.' },
  { icon: AlertCircle,   label: 'Emergency Pathway',    desc: 'Rapid escalation when urgent care is needed.' },
  { icon: Lock,          label: 'Privacy & Consent',    desc: 'You control what is stored and who can see it.' },
  { icon: ClipboardList, label: 'Audit Logging',        desc: 'Every sensitive action is recorded for safety.' },
  { icon: Zap,           label: 'Notifications',        desc: 'Real-time updates across all roles and workflows.' },
];

const Features = () => (
  <section className="py-20 bg-gray-50" aria-labelledby="features-heading">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 id="features-heading" className="text-3xl font-bold text-gray-900 mb-3">
          A complete healthcare access ecosystem
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          CarePath AI is not a single feature — it is an end-to-end system connecting
          every step of the healthcare access journey.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-100 hover:shadow-sm transition-all">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 mb-3">
              <Icon className="w-4 h-4 text-blue-600" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Section: Trust & Safety ───────────────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: Shield,    title: 'Role-Based Access Control',  desc: 'Every API endpoint enforces server-side RBAC. Users, hospitals, professionals, experts, and admins each operate within their own permission boundary.' },
  { icon: Lock,      title: 'Privacy & Consent',          desc: 'Sensitive health data is never stored without explicit consent. You can review, update, or revoke consent at any time.' },
  { icon: UserCheck, title: 'Verified Providers Only',    desc: 'Hospitals, professionals, and experts must pass admin verification before participating in the platform.' },
  { icon: FileText,  title: 'Audit Trail',                desc: 'Every sensitive action — report access, consent changes, admin decisions — is logged immutably for accountability.' },
];

const Trust = () => (
  <section className="py-20 bg-white" aria-labelledby="trust-heading">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold mb-4">
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          Security &amp; Trust
        </span>
        <h2 id="trust-heading" className="text-3xl font-bold text-gray-900 mb-3">
          Built with safety at every layer
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Healthcare data demands the highest standards. CarePath AI is designed
          with security and patient privacy as first-class requirements.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 shrink-0">
              <Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ── Section: CTA ──────────────────────────────────────────────────────────────
const CTA = ({ isAuthenticated, dashboardPath }) => (
  <section className="py-20 bg-blue-600" aria-labelledby="cta-heading">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
      <Heart className="w-10 h-10 text-blue-200 mx-auto mb-5" strokeWidth={1.5} aria-hidden="true" />
      <h2 id="cta-heading" className="text-3xl font-bold text-white mb-4">
        Start your care journey today
      </h2>
      <p className="text-blue-100 mb-8 text-lg leading-relaxed">
        Register for free and experience AI-guided access to verified healthcare.
        No credit card required.
      </p>
      {isAuthenticated ? (
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
        >
          Go to your dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-blue-200 border border-blue-400 rounded-xl hover:bg-blue-500 transition-colors"
          >
            Log in
          </Link>
        </div>
      )}
      <p className="mt-5 text-xs text-blue-200">
        CarePath AI provides healthcare navigation only. Not a substitute for professional medical advice.
      </p>
    </div>
  </section>
);

// ── Main Landing component ────────────────────────────────────────────────────
const Landing = () => {
  const { isAuthenticated, dashboardPath } = useAuth();
  return (
    <div className="bg-white">
      <Hero isAuthenticated={isAuthenticated} dashboardPath={dashboardPath} />
      <Stats />
      <AIIntro />
      <HowItWorksFlow />
      <VerifiedNetwork />
      <Features />
      <Trust />
      <CTA isAuthenticated={isAuthenticated} dashboardPath={dashboardPath} />
    </div>
  );
};

export default Landing;
