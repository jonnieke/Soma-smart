import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Zap,
  ArrowRight,
  Shield,
  Upload,
  BookOpen,
} from 'lucide-react';
import { assessmentAttemptService } from '../../services/assessmentAttemptService';
import { assessmentModerationService } from '../../services/assessmentModerationService';
import { AssessmentAttempt, AssessmentModeration } from '../../types/assessmentDelivery';

const DEMO_ASSIGNMENT_ID = 'asgn_math_f4_t1_2026';

export const TeacherMarkingCentreView: React.FC = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [moderations, setModerations] = useState<AssessmentModeration[]>([]);
  const [activeTab, setActiveTab] = useState<'AWAITING' | 'QUESTION_MODE' | 'MODERATION' | 'COMPLETED'>('AWAITING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      assessmentAttemptService.getAssignmentAttempts(DEMO_ASSIGNMENT_ID),
      Promise.resolve(assessmentModerationService.getAssignmentModerations(DEMO_ASSIGNMENT_ID)),
    ]).then(([attRes, modRes]) => {
      // Inject dummy submitted attempts if empty for demonstration
      if (attRes.length === 0) {
        attRes = [
          { id: 'att_001', assignmentId: DEMO_ASSIGNMENT_ID, assessmentId: 'paper_kcse_math_2026', paperId: 'paper_kcse_math_2026', learnerId: 'learner_001', learnerName: 'Juma Omondi', admissionNo: 'ADM-401', attemptNumber: 1, deliveryMode: 'online', status: 'submitted', startedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 'att_002', assignmentId: DEMO_ASSIGNMENT_ID, assessmentId: 'paper_kcse_math_2026', paperId: 'paper_kcse_math_2026', learnerId: 'learner_002', learnerName: 'Amina Mohamed', admissionNo: 'ADM-402', attemptNumber: 1, deliveryMode: 'online', status: 'submitted', startedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 'att_003', assignmentId: DEMO_ASSIGNMENT_ID, assessmentId: 'paper_kcse_math_2026', paperId: 'paper_kcse_math_2026', learnerId: 'learner_003', learnerName: 'Kevin Kiprop', admissionNo: 'ADM-403', attemptNumber: 1, deliveryMode: 'online', status: 'marked', totalScore: 78, percentage: 78, grade: 'A', startedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
      }
      setAttempts(attRes);
      setModerations(modRes);
      setLoading(false);
    });
  }, []);

  const awaitingAttempts = attempts.filter((a) => a.status === 'submitted' || a.status === 'awaiting_marking');
  const completedAttempts = attempts.filter((a) => a.status === 'marked' || a.status === 'moderated' || a.status === 'released');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" /> Teacher Marking Centre
          </h1>
          <p className="text-xs text-slate-500 mt-1">Mark open responses using rubrics, review AI suggestions, and moderate results.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/scanning')}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Scan Answer Sheets
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'AWAITING', label: `Awaiting Marking (${awaitingAttempts.length})` },
          { id: 'QUESTION_MODE', label: 'Question-by-Question Marking' },
          { id: 'MODERATION', label: `Moderation Queue (${moderations.length})` },
          { id: 'COMPLETED', label: `Completed (${completedAttempts.length})` },
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

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {activeTab === 'AWAITING' && (
            <div className="space-y-4">
              {awaitingAttempts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">All submissions have been marked!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {awaitingAttempts.map((att) => (
                    <div key={att.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{att.learnerName}</p>
                          <p className="text-xs text-slate-500">{att.admissionNo || 'Learner'} · Submitted {new Date(att.submittedAt || att.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/teacher/marking/${att.id}`)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        Start Marking <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'QUESTION_MODE' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
              <BookOpen className="w-10 h-10 text-indigo-500 mx-auto" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Question-by-Question Batch Marking</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Mark all learner answers to the same question consecutively. This increases speed, consistency, and fairness.
              </p>
              <button
                onClick={() => navigate(`/teacher/marking/${awaitingAttempts[0]?.id || 'att_001'}`)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors inline-flex items-center gap-2"
              >
                Launch Question Batch Marker <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'MODERATION' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-600" /> Moderation Reviews
              </h3>
              {moderations.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No moderation reviews recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {moderations.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Moderator: {m.moderatorName}</p>
                        <p className="text-slate-500">Reason: {m.reason}</p>
                      </div>
                      <span className="font-bold text-indigo-600">Original: {m.originalScore} → Moderated: {m.moderatedScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'COMPLETED' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {completedAttempts.map((att) => (
                <div key={att.id} className="p-5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{att.learnerName}</p>
                    <p className="text-slate-500">{att.admissionNo}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 dark:text-white text-sm">{att.totalScore} Marks ({att.percentage}%)</span>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg">{att.grade || 'A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
