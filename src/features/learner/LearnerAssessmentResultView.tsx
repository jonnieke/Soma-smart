import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { assessmentAttemptService } from '../../services/assessmentAttemptService';
import { learnerMasteryRevisionService } from '../../services/learnerMasteryRevisionService';
import { AssessmentAttempt } from '../../types/assessmentDelivery';

const LEARNER_ID = 'learner_001';

export const LearnerAssessmentResultView: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;
    assessmentAttemptService.getAssignmentAttempts(assignmentId).then((attempts) => {
      const myAttempt = attempts.find((a) => a.learnerId === LEARNER_ID) || attempts[0];
      if (myAttempt) {
        setAttempt(myAttempt);
        // Trigger mastery update from attempt
        void learnerMasteryRevisionService.updateMasteryFromAttempt(myAttempt.id);
      }
      setLoading(false);
    });
  }, [assignmentId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const score = attempt?.totalScore ?? 78;
  const percentage = attempt?.percentage ?? 78;
  const grade = attempt?.grade ?? 'A';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Result Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-300">
          <Award className="w-4 h-4" /> Assessment Results Released
        </div>
        <h1 className="text-3xl font-black">{attempt?.learnerName || 'Learner'}, Great Effort!</h1>

        <div className="flex justify-center items-baseline gap-2 pt-2">
          <span className="text-6xl font-black text-emerald-400">{score}</span>
          <span className="text-xl text-slate-300">/ 100 Marks ({percentage}%)</span>
        </div>

        <div className="inline-block bg-emerald-500/20 text-emerald-300 px-6 py-2 rounded-2xl border border-emerald-500/40 text-sm font-bold">
          Performance Grade: <strong>{grade}</strong> (Exceeding Expectations)
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
            <BookOpen className="w-5 h-5" /> Step-by-Step Corrections Mode
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review detailed question explanations, marking scheme guidance, and correct answers.
          </p>
          <button
            onClick={() => navigate('/learner/corrections')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Open Question Corrections <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-violet-600 font-bold text-sm">
            <Sparkles className="w-5 h-5" /> AI Revision Plan
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Target weak curriculum outcomes identified during this assessment with customized SomaAI activities.
          </p>
          <button
            onClick={() => navigate('/learner/revision-plan')}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            View Revision Plan <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
