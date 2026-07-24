import React, { useState } from 'react';
import { Building2, Layers, CheckCircle, Shield, Folder, FileText } from 'lucide-react';
import { schoolContentLibraryService } from '../../services/schoolContentLibraryService';

export const SchoolContentLibraryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIBRARY' | 'DEPARTMENTS' | 'REVIEW' | 'COVERAGE'>('LIBRARY');

  const requests = schoolContentLibraryService.getContentRequests('school_001');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" /> School Content Library &amp; Editorial Repository
        </h1>
        <p className="text-xs text-slate-500 mt-1">Department collections, resource approval queue, and curriculum coverage governance.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'LIBRARY', label: 'School Repository' },
          { id: 'DEPARTMENTS', label: 'Department Collections' },
          { id: 'REVIEW', label: `Resource Approval Queue (${requests.length})` },
          { id: 'COVERAGE', label: 'Curriculum Coverage' },
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
          { label: 'Approved School Resources', value: '148 Items', sub: 'Verified & Print-Ready', icon: FileText, color: 'text-indigo-600' },
          { label: 'Department Collections', value: '6 Subjects', sub: 'Math, Science, Languages', icon: Folder, color: 'text-emerald-600' },
          { label: 'Pending HOD Approvals', value: '2 Resources', sub: 'In Review Queue', icon: CheckCircle, color: 'text-violet-600' },
          { label: 'Rights Enforcement', value: '100% Verified', sub: 'No Licensing Infringements', icon: Shield, color: 'text-amber-600' },
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
