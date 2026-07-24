import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { learnerMasteryRevisionService } from '../../services/learnerMasteryRevisionService';
import { LearnerRevisionPlan } from '../../types/assessmentDelivery';

const LEARNER_ID = 'learner_001';

export const LearnerRevisionPlanView: React.FC = () => {
  const [plan, setPlan] = useState<LearnerRevisionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    learnerMasteryRevisionService.generateRevisionPlan(LEARNER_ID, 'Mathematics').then((res) => {
      setPlan(res);
      setLoading(false);
    });
  }, []);

  const handleToggleComplete = (recId: string) => {
    if (!plan) return;
    learnerMasteryRevisionService.markRecommendationComplete(LEARNER_ID, recId);
    learnerMasteryRevisionService.generateRevisionPlan(LEARNER_ID, 'Mathematics').then(setPlan);
  };

  if (loading || !plan) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-600" /> Personalized Revision Plan
        </h1>
        <p className="text-xs text-slate-500 mt-1">SomaAI continuous revision activities generated to target weak assessment concepts.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-black text-slate-900 dark:text-white text-sm">Recommended Revision Activities</h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {plan.recommendations.map((rec) => (
            <div key={rec.id} className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${rec.priority === 'HIGH' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {rec.priority} PRIORITY
                  </span>
                  <span className="text-xs text-slate-400">{rec.topic}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rec.resourceTitle}</h4>
                <p className="text-xs text-slate-500">{rec.reason}</p>
              </div>

              <button
                onClick={() => handleToggleComplete(rec.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  rec.isCompleted
                    ? 'bg-emerald-50 text-emerald-700 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {rec.isCompleted ? <CheckCircle className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                {rec.isCompleted ? 'Completed' : 'Start Revision'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
