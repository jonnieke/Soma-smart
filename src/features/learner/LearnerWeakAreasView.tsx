import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { learnerMasteryRevisionService } from '../../services/learnerMasteryRevisionService';
import { LearnerMastery } from '../../types/assessmentDelivery';

const LEARNER_ID = 'learner_001';

export const LearnerWeakAreasView: React.FC = () => {
  const navigate = useNavigate();
  const [masteries, setMasteries] = useState<LearnerMastery[]>([]);

  useEffect(() => {
    let list = learnerMasteryRevisionService.getLearnerMastery(LEARNER_ID);
    if (list.length === 0) {
      list = [
        { learnerId: LEARNER_ID, subject: 'Mathematics', topic: 'Mensuration & Cylinder Area', masteryScore: 35, confidence: 0.8, evidenceCount: 2, lastAssessedAt: new Date().toISOString(), trend: 'declining', recommendedAction: 'Review formula 2πr(r+h)' },
        { learnerId: LEARNER_ID, subject: 'Mathematics', topic: 'Quadratic Equations & Roots', masteryScore: 78, confidence: 0.9, evidenceCount: 4, lastAssessedAt: new Date().toISOString(), trend: 'improving', recommendedAction: 'Consolidate formula substitution' },
      ];
    }
    setMasteries(list);
  }, []);

  const weakList = masteries.filter((m) => m.masteryScore < 60);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" /> Weak Areas &amp; Mastery Engine
        </h1>
        <p className="text-xs text-slate-500 mt-1">Topic-level mastery tracking computed from your assessment performance.</p>
      </div>

      <div className="space-y-4">
        {weakList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No critical weak areas detected! Excellent work.</p>
          </div>
        ) : (
          weakList.map((m) => (
            <div key={m.topic} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">Needs Attention</span>
                  <span className="text-xs text-slate-400">{m.subject}</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{m.topic}</h3>
                <p className="text-xs text-slate-500">{m.recommendedAction}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-600">{m.masteryScore}%</span>
                  <p className="text-[10px] text-slate-400">Mastery Score</p>
                </div>
                <button
                  onClick={() => navigate('/learner/revision-plan')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  Start Revision <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
