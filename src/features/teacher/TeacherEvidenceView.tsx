import React, { useState } from 'react';
import { Award, BookOpen, CheckCircle2, TrendingUp, HelpCircle, Layers, Sparkles, Clock } from 'lucide-react';
import { platformEconomicsService } from '../../services/platformEconomicsService';
import { questionPaperEvidenceService } from '../../services/questionPaperEvidenceService';
import { misconceptionContentImpactService } from '../../services/misconceptionContentImpactService';

export const TeacherEvidenceView: React.FC = () => {
  const [valueReport] = useState(platformEconomicsService.getTeacherValueReport('usr_teacher_001'));
  const [questionProfiles] = useState(questionPaperEvidenceService.getQuestionProfiles());
  const [misconceptions] = useState(misconceptionContentImpactService.getMisconceptions());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
        <span className="px-3 py-1 bg-amber-400/20 text-amber-300 font-extrabold text-xs rounded-full uppercase border border-amber-400/30 flex items-center gap-1.5 w-fit">
          <Sparkles className="w-3.5 h-3.5" /> Teacher Evidence &amp; Impact Hub
        </span>
        <h1 className="text-3xl font-black">Your Classroom Evidence &amp; Time Savings</h1>
        <p className="text-xs text-indigo-200">Track how your exam papers perform, identify common learner misconceptions, and view your verified time savings.</p>
      </div>

      {/* Teacher Value Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-400 font-bold uppercase">Time Saved</p>
          <p className="text-2xl font-black text-indigo-600">~{valueReport.timeSavingHoursEstimate} Hours</p>
          <p className="text-[11px] text-slate-500">{valueReport.period}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-400 font-bold uppercase">Papers Created</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{valueReport.papersCreated} Papers</p>
          <p className="text-[11px] text-slate-500">{valueReport.questionsReused} Questions Reused</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-400 font-bold uppercase">Learners Impacted</p>
          <p className="text-2xl font-black text-emerald-600">{valueReport.learnersSupported}</p>
          <p className="text-[11px] text-slate-500">Across Active Classes</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
          <p className="text-slate-400 font-bold uppercase">Marketplace Royalties</p>
          <p className="text-2xl font-black text-amber-600">KES {valueReport.marketplaceEarningsKes.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">Verified Earnings</p>
        </div>
      </div>

      {/* Misconceptions & Question Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" /> Common Classroom Misconceptions ({misconceptions.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {misconceptions.map((m) => (
              <div key={m.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{m.title}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">{m.status}</span>
                </div>
                <p className="text-slate-500">{m.description}</p>
                <p className="text-slate-400 text-[10px]">Evidence sample: {m.learnerSampleSize} learners across {m.schoolSampleSize} schools</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Question Quality &amp; Difficulty Analytics
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {questionProfiles.map((q) => (
              <div key={q.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Question ID: {q.questionId}</p>
                  <p className="text-slate-500">Observed Difficulty: {Math.round((q.observedDifficulty || 0) * 100)}% · Discrimination: {q.discriminationEstimate}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded uppercase text-[10px]">{q.qualityStatus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
