import React, { useState } from 'react';
import { BookOpen, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { researchGovernanceService } from '../../services/researchGovernanceService';

export const ResearchPartnerPortalView: React.FC = () => {
  const [projects] = useState(researchGovernanceService.getProjects());

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" /> Institutional Research &amp; Governance Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">Research partnerships, institutional approvals, and privacy-preserving dataset governance.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" /> Approved Institutional Research Projects ({projects.length})
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {projects.map((proj) => (
            <div key={proj.id} className="py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">{proj.title}</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">{proj.status}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">PI: {proj.principalInvestigator} · Method: {proj.dataAccessMethod}</p>
              <p className="text-slate-400 text-[11px]">Approvals: {proj.approvalReferences.join(' · ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
