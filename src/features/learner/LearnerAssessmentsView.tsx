import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  Play,
  Award,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PenTool,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { assessmentAssignmentService } from '../../services/assessmentAssignmentService';
import { AssessmentAssignment } from '../../types/assessmentDelivery';

export const LearnerAssessmentsView: React.FC = () => {
  const navigate = useNavigate();
  const { studentProfile, userId, studentCode } = useApp();
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const learnerId = studentProfile?.id || userId || studentCode || 'learner_001';

  useEffect(() => {
    assessmentAssignmentService.getLearnerAssignments(learnerId).then((res) => {
      setAssignments(res);
      setLoading(false);
    });
  }, [learnerId]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation Back Link */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/learner')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Learning
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" /> Class Assignments &amp; Assessments
        </h1>
        <p className="text-xs text-slate-500 mt-1">View examinations assigned by your teacher, complete online assessments, and review feedback.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">You are all caught up on formal assessments!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">No online assessments have been assigned by your teacher right now.</p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/learner')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <PenTool className="w-4 h-4" /> Go to Homework Help &amp; Ask Akili
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignments.map((asgn) => (
            <div key={asgn.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
                    {asgn.subject} · {asgn.grade}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{asgn.status}</span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{asgn.assessmentTitle}</h3>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {asgn.durationMinutes} Mins</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-500" /> {asgn.totalMarks} Marks</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/learner/assessments/${asgn.id}/result`)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  View Past Results
                </button>
                <button
                  onClick={() => navigate(`/learner/assessments/${asgn.id}/start`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Start Assessment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
