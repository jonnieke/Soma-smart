import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Award, Sparkles, BookOpen, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { revisionImpactService } from '../../services/revisionImpactService';
import { RevisionImpactRecord, IntelligenceRecommendation } from '../../types/educationIntelligence';

export const LearnerProgressView: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RevisionImpactRecord[]>([]);
  const [nextActivity, setNextActivity] = useState<IntelligenceRecommendation | null>(null);

  useEffect(() => {
    setRecords(revisionImpactService.getRevisionImpactRecords('learner_001'));
    setNextActivity(revisionImpactService.getNextBestActivity('learner_001', 'Mathematics'));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" /> My Educational Growth &amp; Progress
        </h1>
        <p className="text-xs text-slate-500 mt-1">Track learning growth, measured revision impact, and recommended next activities.</p>
      </div>

      {/* Next Best Activity Banner */}
      {nextActivity && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-violet-950 text-white rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Recommended Next Activity
          </div>

          <div>
            <h3 className="text-lg font-black">{nextActivity.title}</h3>
            <p className="text-xs text-slate-300 mt-1">{nextActivity.reason}</p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">{nextActivity.evidenceSummary}</span>
            <button
              onClick={() => navigate('/learner/revision-plan')}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              Start Activity <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Revision Impact History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white text-sm">Measured Revision Impact</h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {records.map((r) => (
            <div key={r.id} className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{r.topic}</span>
                  <span className="text-xs text-slate-400">Completed {new Date(r.completedAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{r.activityTitle}</h4>
                <p className="text-xs text-slate-500">Pre-Assessment: {r.preAssessmentScore}% → Post-Assessment: {r.postAssessmentScore}%</p>
              </div>

              <div className="text-right">
                <span className={`text-xl font-black ${r.scoreGainPercentage && r.scoreGainPercentage > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {r.scoreGainPercentage && r.scoreGainPercentage > 0 ? `+${r.scoreGainPercentage}%` : `${r.scoreGainPercentage}%`}
                </span>
                <p className="text-[10px] text-slate-400 font-bold">Score Gain</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
