/**
 * About — CarePath AI (Stage 5: complete)
 */
import { Link } from 'react-router-dom';
import {
  Heart, Target, Eye, Shield, Brain, Building2,
  Stethoscope, Users, ArrowRight, CheckCircle,
} from 'lucide-react';

const VALUES = [
  {
    icon: Target,
    title: 'Our Mission',
    description:
      'Make quality healthcare access simpler, safer, and more intelligent. CarePath AI removes the friction between a health concern and the right provider — through AI guidance, a verified healthcare network, and role-based access for every stakeholder.',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    description:
      'A healthcare ecosystem where every person can quickly find the right professional, hospital, or expert — guided by AI that understands their situation and prioritises their safety above everything else.',
  },
  {
    icon: Shield,
    title: 'Our Values',
    description:
      'Safety, privacy, transparency, and trust are non-negotiable. We do not make medical diagnoses. We do not store health data without consent. Every sensitive action is logged and auditable.',
  },
];

const ROLES = [
  {
    icon: Users,
    role: 'Patient (User)',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    desc: 'Searches hospitals, consults professionals, manages health records, accesses expert guidance, and uses the AI assistant for healthcare pathway navigation.',
  },
  {
    icon: Building2,
    role: 'Hospital',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    desc: 'Manages institutional profile, doctor directory, association requests from professionals, and appointment workflows — all through a verified account.',
  },
  {
    icon: Stethoscope,
    role: 'Professional',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    desc: 'Maintains a verified professional profile, manages hospital affiliations and credentials, sets availability, and handles consultations and appointment requests.',
  },
  {
    icon: Users,
    role: 'Independent Expert',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    desc: 'Verified independent specialists who accept escalated cases and complex consultations from patients routed through the AI escalation pathway.',
  },
  {
    icon: Shield,
    role: 'Administrator',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    desc: 'Reviews and verifies hospitals, professionals, and experts. Monitors platform health, reviews AI safety outputs, manages audit logs, and oversees system analytics.',
  },
];

const About = () => (
  <div className="bg-white">
    {/* Hero */}
    <section className="bg-gradient-to-br from-blue-50 to-white py-20 border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-6">
          <Heart className="w-3.5 h-3.5" aria-hidden="true" />
          About CarePath AI
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          Healthcare access, reimagined with AI intelligence
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          CarePath AI is a role-based healthcare access ecosystem that connects
          patients with verified hospitals, qualified professionals, and independent
          health experts through an intelligent AI layer.
        </p>
      </div>
    </section>

    {/* Problem & Solution */}
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The problem we address</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Navigating healthcare is unnecessarily complex. Patients struggle to identify
              the right specialist, hospital, or care pathway. Professionals lack tools to
              manage their digital presence and patient interactions in one place.
              Institutions cannot easily verify or manage their networks.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Existing solutions are fragmented — a booking platform here, a hospital
              directory there, an AI assistant somewhere else. None of them connect the
              full picture from a health concern to a verified care outcome.
            </p>
            <ul className="space-y-2">
              {[
                'No single trusted platform for the complete care pathway',
                'Verification gaps between patients and providers',
                'Health data scattered across systems without consent control',
                'AI tools that diagnose without safety guardrails',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How CarePath AI solves it</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CarePath AI creates a single connected ecosystem where every stakeholder
              — patient, hospital, professional, expert, and administrator — operates within
              their own verified, role-protected space.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              The AI layer does not replace healthcare professionals. It acts as an
              intelligent navigation layer: understanding health concerns, identifying
              appropriate pathways, and routing patients to the right verified provider
              with context they can act on.
            </p>
            <ul className="space-y-2">
              {[
                'One platform for the complete healthcare access journey',
                'Admin-verified hospitals, professionals, and experts',
                'Consent-first health data management with audit logging',
                'AI that guides safely — never diagnoses',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Mission, vision &amp; values</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-6">
              <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 mb-4">
                <Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* AI & Safety */}
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">The role of AI in CarePath</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our AI is a navigation and guidance system — not a diagnostic tool.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { title: 'What the AI does', items: ['Understands health concerns in natural language', 'Identifies appropriate care pathways', 'Routes to the right hospital, professional, or expert', 'Detects potentially urgent situations and escalates', 'Provides plain-language explanation of health reports'] },
            { title: 'What the AI never does', items: ['Diagnose medical conditions', 'Recommend specific medications', 'Replace the judgement of a qualified professional', 'Present guidance as medical advice', 'Store health data without explicit consent'], warning: true },
          ].map(({ title, items, warning }) => (
            <div key={title} className={`rounded-2xl border p-6 ${warning ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
              <h3 className={`text-sm font-bold mb-3 ${warning ? 'text-amber-800' : 'text-green-800'}`}>{title}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className={`flex items-start gap-2 text-sm ${warning ? 'text-amber-700' : 'text-green-700'}`}>
                    <span className={`mt-1 shrink-0 ${warning ? 'text-amber-500' : 'text-green-500'}`} aria-hidden="true">
                      {warning ? '✕' : '✓'}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Roles */}
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Five roles. One ecosystem.</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Every participant operates within their own verified, role-protected space.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map(({ icon: Icon, role, color, bg, border, desc }) => (
            <div key={role} className={`rounded-2xl border ${border} bg-white p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
                </span>
                <h3 className="text-sm font-bold text-gray-900">{role}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to get started?</h2>
        <p className="text-gray-600 mb-7">
          Join CarePath AI today as a patient, hospital, professional, or expert.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            How It Works
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default About;
