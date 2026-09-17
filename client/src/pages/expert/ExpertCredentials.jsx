/**
 * ExpertCredentials — CarePath AI
 * Independent Expert: manage professional credentials and certifications.
 * Static display page — non-dynamic.
 */

import { Award, BookOpen, Calendar, CheckCircle, Plus } from 'lucide-react';

const SAMPLE_CREDENTIALS = [
  {
    id: 1,
    title: 'MD — Internal Medicine',
    institution: 'All India Institute of Medical Sciences (AIIMS)',
    year: '2012',
    type: 'Degree',
  },
  {
    id: 2,
    title: 'Fellowship — Cardiology',
    institution: 'Post Graduate Institute of Medical Education & Research',
    year: '2015',
    type: 'Fellowship',
  },
  {
    id: 3,
    title: 'Board Certification — Cardiovascular Disease',
    institution: 'National Board of Examinations',
    year: '2016',
    type: 'Certification',
  },
  {
    id: 4,
    title: 'Advanced Cardiac Life Support (ACLS)',
    institution: 'American Heart Association',
    year: '2023',
    type: 'Certification',
  },
];

const typeColor = {
  Degree:        'bg-indigo-50 text-indigo-700 border-indigo-200',
  Fellowship:    'bg-violet-50 text-violet-700 border-violet-200',
  Certification: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const ExpertCredentials = () => (
  <div className="p-6 max-w-3xl mx-auto space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Credentials</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your degrees, fellowships, and certifications</p>
      </div>
      <button
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        disabled
        title="Credential upload coming soon"
      >
        <Plus className="w-4 h-4" /> Add Credential
      </button>
    </div>

    {/* Credential cards */}
    <div className="space-y-3">
      {SAMPLE_CREDENTIALS.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 shrink-0">
            <Award className="w-5 h-5 text-violet-600" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm">{c.title}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor[c.type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {c.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              {c.institution}
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              {c.year}
            </p>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        </div>
      ))}
    </div>

    <p className="text-xs text-gray-400 text-center">
      Credential verification is reviewed by the platform admin before display to patients.
    </p>
  </div>
);

export default ExpertCredentials;
