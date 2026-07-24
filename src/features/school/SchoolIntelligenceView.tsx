import React, { useState } from 'react';
import { Building2, TrendingUp, BarChart3, Users, Shield, Layers, FileText, Download, AlertTriangle } from 'lucide-react';
import { benchmarkingService } from '../../services/benchmarkingService';

export const SchoolIntelligenceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INTELLIGENCE' | 'GRADES' | 'CURRICULUM' | 'BENCHMARKS' | 'REPORTS'>('INTELLIGENCE');

  const benchmark = benchmarkingService.getSchoolBenchmark('school_001');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" /> Soma School Intelligence &amp; Leadership
        </h1>
        <p className="text-xs text-slate-500 mt-1">Cross-grade, department, curriculum coverage, and internal historical benchmarking decision support.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'INTELLIGENCE', label: 'School Intelligence' },
          { id: 'GRADES', label: 'Grade Performance' },
          { id: 'CURRICULUM', label: 'Curriculum Coverage' },
          { id: 'BENCHMARKS', label: 'Historical Benchmarks' },
          { id: 'REPORTS', label: 'Leadership Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'School Mean Score', value: `${benchmark.schoolMean}%`, sub: `Confidence: ${benchmark.evidenceConfidence}`, icon: TrendingUp, color: 'text-indigo-600' },
          { label: 'Curriculum Coverage', value: '88.4%', sub: '24 Outcomes Assessed', icon: Layers, color: 'text-emerald-600' },
          { label: 'Active Interventions', value: '4 Groups', sub: '34 Learners Enrolled', icon: Users, color: 'text-violet-600' },
          { label: 'Assessment Quality', value: '91/100', sub: 'Low Miskey Warnings', icon: Shield, color: 'text-amber-600' },
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

      {activeTab === 'BENCHMARKS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Internal Historical Term-on-Term Performance</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {benchmarkingService.getHistoricalComparison('school_001').map((h) => (
              <div key={h.term} className="py-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">{h.term}</span>
                <span className="font-black text-indigo-600">Mean: {h.schoolMean}% (Pass Rate: {h.passRate}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'REPORTS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Weekly Leadership Intelligence Brief</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            School assessment performance improved by +2.4 percentage points this term. Form 4 Mathematics shows strong consolidation in Quadratic Equations, but Mensuration remains a primary intervention target.
          </p>
        </div>
      )}
    </div>
  );
};
