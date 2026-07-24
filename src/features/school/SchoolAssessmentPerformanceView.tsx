import React, { useState } from 'react';
import { Building2, TrendingUp, BarChart3, Users, Download, Layers } from 'lucide-react';

export const SchoolAssessmentPerformanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GRADES' | 'DEPARTMENTS' | 'REPORTS'>('OVERVIEW');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" /> School Assessment Performance
        </h1>
        <p className="text-xs text-slate-500 mt-1">Cross-grade, department, and subject performance analytics across the school.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'GRADES', label: 'Grade Reports' },
          { id: 'DEPARTMENTS', label: 'Department Insights' },
          { id: 'REPORTS', label: 'School Reports' },
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall School Mean', value: '68.4%', sub: 'Across 6 Departments', icon: TrendingUp, color: 'text-indigo-600' },
          { label: 'Total Examinations', value: '42', sub: 'Term 1 Assessments', icon: BarChart3, color: 'text-violet-600' },
          { label: 'Active Learners', value: '480', sub: 'Assessed this term', icon: Users, color: 'text-emerald-600' },
          { label: 'Pass Rate', value: '84.2%', sub: 'Target: 80.0%', icon: Layers, color: 'text-amber-600' },
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

      {/* Department Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-black text-slate-900 dark:text-white text-sm">Department Performance Summary</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { dept: 'Mathematics Department', mean: '72.1%', passRate: '88%', papers: 12 },
            { dept: 'Sciences Department', mean: '65.4%', passRate: '79%', papers: 14 },
            { dept: 'Languages Department', mean: '70.8%', passRate: '86%', papers: 10 },
            { dept: 'Humanities Department', mean: '66.2%', passRate: '81%', papers: 6 },
          ].map((d) => (
            <div key={d.dept} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{d.dept}</p>
                <p className="text-slate-500">{d.papers} examinations completed</p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div><p className="font-black text-slate-900 dark:text-white">{d.mean}</p><p className="text-[10px] text-slate-400">Mean Score</p></div>
                <div><p className="font-black text-emerald-600">{d.passRate}</p><p className="text-[10px] text-slate-400">Pass Rate</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
