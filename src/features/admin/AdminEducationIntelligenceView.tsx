import React, { useState } from 'react';
import { Shield, Activity, Layers, Database, CheckCircle } from 'lucide-react';

export const AdminEducationIntelligenceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'QUALITY' | 'MODELS' | 'BENCHMARKS' | 'GOVERNANCE'>('QUALITY');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> Platform Intelligence Monitoring &amp; Governance
        </h1>
        <p className="text-xs text-slate-500 mt-1">Admin oversight for data quality snapshots, model performance, and small-cohort privacy suppression.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'QUALITY', label: 'Data Quality' },
          { id: 'MODELS', label: 'Model Performance' },
          { id: 'BENCHMARKS', label: 'Benchmark Governance' },
          { id: 'GOVERNANCE', label: 'Privacy & Retention' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Data Confidence Rate', value: '94.2%', sub: 'High/Moderate Rating', icon: Database, color: 'text-indigo-600' },
          { label: 'Suppressed Cohorts', value: '3', sub: 'Learners < 10 threshold', icon: Shield, color: 'text-emerald-600' },
          { label: 'Intervention Outcomes', value: '86%', sub: 'Improved/Partially Improved', icon: Activity, color: 'text-violet-600' },
          { label: 'Rule Engine Version', value: 'v6.1.0', sub: 'Deterministic & Audited', icon: Layers, color: 'text-amber-600' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
            <p className="text-[11px] text-slate-500">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
