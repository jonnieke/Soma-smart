import React, { useState } from 'react';
import { Building2, FileCheck, CheckCircle2, ShieldCheck, Clock, Award, BarChart3 } from 'lucide-react';
import { platformEconomicsService } from '../../services/platformEconomicsService';
import { questionPaperEvidenceService } from '../../services/questionPaperEvidenceService';

export const SchoolEvidenceView: React.FC = () => {
  const [report] = useState(platformEconomicsService.getSchoolValueReport('tenant_school_001'));
  const [paperProfiles] = useState(questionPaperEvidenceService.getPaperProfiles());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" /> School Assessment Quality &amp; Value Report
        </h1>
        <p className="text-xs text-slate-500 mt-1">Verified school-level assessment reliability, curriculum coverage, and automated marking efficiency.</p>
      </div>

      {/* School Value Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-400 font-bold uppercase">Teacher Hours Saved</p>
          <p className="text-2xl font-black text-indigo-600">~{report.teacherHoursSavedEstimate} Hours</p>
          <p className="text-[11px] text-slate-500">{report.period}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-400 font-bold uppercase">Curriculum Coverage</p>
          <p className="text-2xl font-black text-emerald-600">{report.curriculumCoveragePct}%</p>
          <p className="text-[11px] text-slate-500">CBC / KCSE Outcomes</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-400 font-bold uppercase">Assessments Delivered</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{report.assessmentsDeliveredCount}</p>
          <p className="text-[11px] text-slate-500">{report.papersCreatedCount} Original Papers</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-400 font-bold uppercase">Marking Automated</p>
          <p className="text-2xl font-black text-amber-600">{report.markingAutomatedCount.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">Responses Graded</p>
        </div>
      </div>

      {/* Paper Quality Evidence Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-indigo-600" /> Exam Paper Quality &amp; Blueprint Compliance Evidence
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {paperProfiles.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Paper ID: {p.paperId}</p>
                <p className="text-slate-500">Blueprint Compliance: {p.blueprintComplianceScore}% · Marking Consistency: {p.markingConsistencyScore}%</p>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded uppercase text-[10px]">{p.overallEvidenceScore}/100 Quality</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
