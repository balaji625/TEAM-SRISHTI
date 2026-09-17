/**
 * AdminAiSafety — CarePath AI
 * Admin: AI safety monitoring, model usage stats, flagged content overview.
 * Static display — non-dynamic.
 */

import { Brain, ShieldCheck, AlertTriangle, CheckCircle, TrendingUp, FileText, Zap, Eye } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center justify-between mb-3">
      <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs font-semibold text-gray-600 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const POLICY_CHECKS = [
  { label: 'Harmful content filtering',    status: 'active',   desc: 'All AI responses scanned for harmful medical advice' },
  { label: 'Hallucination detection',      status: 'active',   desc: 'Responses cross-referenced with medical knowledge base' },
  { label: 'Privacy data masking',         status: 'active',   desc: 'Patient PII masked before AI processing' },
  { label: 'Emergency escalation trigger', status: 'active',   desc: 'Emergency keywords trigger immediate professional escalation' },
  { label: 'Drug interaction check',       status: 'review',   desc: 'Currently in validation with clinical team' },
  { label: 'Diagnostic accuracy audit',    status: 'review',   desc: 'Quarterly audit in progress — Q4 2024' },
  { label: 'Bias monitoring',              status: 'planned',  desc: 'Demographic bias analysis planned for Q1 2025' },
];

const RECENT_FLAGS = [
  { id: 1, type: 'Low Risk',    query: 'What medication for headache?',           resolution: 'Auto-filtered — OTC guidance provided',   time: '1h ago' },
  { id: 2, type: 'Medium Risk', query: 'Chest pain with breathlessness advice',   resolution: 'Escalated to emergency flow',             time: '3h ago' },
  { id: 3, type: 'Low Risk',    query: 'Is it safe to mix ibuprofen + paracetamol?', resolution: 'Professional review appended',         time: '5h ago' },
  { id: 4, type: 'High Risk',   query: 'Self-surgery guidance request',           resolution: 'Blocked + admin notified',               time: '1d ago' },
  { id: 5, type: 'Low Risk',    query: 'Normal blood pressure range query',       resolution: 'Answered with source citation',          time: '2d ago' },
];

const riskColor = {
  'Low Risk':    'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Medium Risk': 'bg-amber-50 text-amber-700 border-amber-200',
  'High Risk':   'bg-red-50 text-red-700 border-red-200',
};

const statusConfig = {
  active:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
  review:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'In Review' },
  planned: { cls: 'bg-gray-100 text-gray-500 border-gray-200',         label: 'Planned' },
};

const AdminAiSafety = () => (
  <div className="p-6 max-w-5xl mx-auto space-y-6">
    {/* Header */}
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100">
        <Brain className="w-5 h-5 text-rose-600" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI Safety</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor AI behaviour, safety policies, and flagged content</p>
      </div>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard icon={Zap}          label="AI Queries (30d)"   value="4,821"  sub="+12% vs last month"   color="bg-blue-50 text-blue-600" />
      <StatCard icon={ShieldCheck}  label="Safety Checks"      value="4,798"  sub="99.5% pass rate"      color="bg-emerald-50 text-emerald-600" />
      <StatCard icon={AlertTriangle}label="Flagged Responses"  value="23"     sub="0.48% flag rate"      color="bg-amber-50 text-amber-600" />
      <StatCard icon={Eye}          label="High Risk Blocked"  value="4"      sub="Immediate escalation" color="bg-red-50 text-red-600" />
    </div>

    {/* Safety policies */}
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-800">Safety Policies</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {POLICY_CHECKS.map((p, i) => {
          const s = statusConfig[p.status];
          return (
            <div key={i} className="px-5 py-3.5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">{p.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 ${s.cls}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>

    {/* Recent flags */}
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-800">Recent Flagged Queries</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Risk', 'Query', 'Resolution', 'Time'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {RECENT_FLAGS.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskColor[f.type] || ''}`}>
                    {f.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">{f.query}</td>
                <td className="px-5 py-3.5 text-gray-600">{f.resolution}</td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{f.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
      <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-700">
        <strong>AI Safety Report Q4 2024</strong> is under preparation. The full audit covering model accuracy, bias metrics, and escalation performance will be published by January 2025.
      </p>
    </div>
  </div>
);

export default AdminAiSafety;
