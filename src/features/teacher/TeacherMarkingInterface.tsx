import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Zap,
  ArrowLeft,
  ArrowRight,
  Shield,
  Save,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { assessmentAttemptService } from '../../services/assessmentAttemptService';
import { assessmentMarkingEngineService } from '../../services/assessmentMarkingEngineService';
import { AssessmentAttempt, AssessmentResponse } from '../../types/assessmentDelivery';

export const TeacherMarkingInterface: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teacherScoreInput, setTeacherScoreInput] = useState<number>(0);
  const [teacherCommentInput, setTeacherCommentInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    assessmentAttemptService.getAttemptById(attemptId).then((att) => {
      setAttempt(att);
      assessmentAttemptService.getAttemptResponses(attemptId).then((resps) => {
        // Inject mock responses if empty
        let currentResps = resps;
        if (currentResps.length === 0) {
          currentResps = [
            {
              id: 'resp_demo_1',
              attemptId: attemptId,
              assessmentId: 'paper_kcse_math_2026',
              assignmentId: 'asgn_math_f4_t1_2026',
              learnerId: 'learner_001',
              questionId: 'q1',
              questionVersionId: 'q1',
              responseType: 'STRUCTURED',
              responseValue: 'Using the quadratic formula x = (-b ± √(b² - 4ac)) / (2a), we get x = 3 or x = -0.5.',
              isFlagged: false,
              autoSaveVersion: 1,
              maxMarks: 10,
              markingStatus: 'NOT_MARKED',
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'resp_demo_2',
              attemptId: attemptId,
              assessmentId: 'paper_kcse_math_2026',
              assignmentId: 'asgn_math_f4_t1_2026',
              learnerId: 'learner_001',
              questionId: 'q2',
              questionVersionId: 'q2',
              responseType: 'ESSAY',
              responseValue: 'The process of photosynthesis converts light energy into chemical energy stored in glucose molecules. Carbon dioxide and water are key inputs.',
              isFlagged: false,
              autoSaveVersion: 1,
              maxMarks: 15,
              markingStatus: 'NOT_MARKED',
              updatedAt: new Date().toISOString(),
            },
          ];
        }
        setResponses(currentResps);
        setTeacherScoreInput(currentResps[0]?.teacherScore ?? 0);
        setTeacherCommentInput(currentResps[0]?.teacherComment ?? '');
        setLoading(false);
      });
    });
  }, [attemptId]);

  const currentResp = responses[currentIndex];

  const handleNext = () => {
    if (currentIndex < responses.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setTeacherScoreInput(responses[nextIdx].teacherScore ?? 0);
      setTeacherCommentInput(responses[nextIdx].teacherComment ?? '');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setTeacherScoreInput(responses[prevIdx].teacherScore ?? 0);
      setTeacherCommentInput(responses[prevIdx].teacherComment ?? '');
    }
  };

  const handleSaveScore = async () => {
    if (!currentResp) return;
    const updatedResps = [...responses];
    updatedResps[currentIndex] = {
      ...currentResp,
      teacherScore: teacherScoreInput,
      awardedMarks: teacherScoreInput,
      teacherComment: teacherCommentInput,
      markingStatus: 'TEACHER_REVIEWED',
    };
    setResponses(updatedResps);

    if (currentIndex < responses.length - 1) {
      handleNext();
    } else {
      // Finalize attempt total
      const totalScore = updatedResps.reduce((s, r) => s + (r.teacherScore ?? 0), 0);
      const maxTotal = updatedResps.reduce((s, r) => s + r.maxMarks, 0);
      const percentage = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;
      await assessmentAttemptService.updateAttemptStatus(attemptId!, 'marked', {
        totalScore,
        percentage,
        grade: percentage >= 80 ? 'A' : percentage >= 65 ? 'B' : percentage >= 50 ? 'C' : 'D',
      });
      navigate('/teacher/marking');
    }
  };

  const handleRequestAISuggestion = async () => {
    if (!currentResp) return;
    setAiLoading(true);
    const mockQuestion = {
      id: currentResp.questionId,
      visibility: 'PRIVATE' as const,
      status: 'VERIFIED' as const,
      questionType: currentResp.responseType as any,
      questionText: 'Solve quadratic equation or explain biological process.',
      correctAnswer: 'Correct working using formula.',
      explanation: 'Key steps: quadratic formula, substitution, final roots.',
      markingScheme: [{ criterion: 'Formula statement', marks: 2 }, { criterion: 'Correct working', marks: 8 }],
      marks: currentResp.maxMarks,
      grade: 'Form 4',
      subject: 'Mathematics',
      curriculum: 'CBC_CBE' as const,
      cognitiveLevel: 'APPLICATION' as const,
      difficulty: 'MEDIUM' as const,
      sourceType: 'SOMA_BANK' as const,
    };

    const aiRes = await assessmentMarkingEngineService.generateAIMarkingSuggestion(
      mockQuestion,
      String(currentResp.responseValue),
    );

    const updated = [...responses];
    updated[currentIndex] = {
      ...currentResp,
      aiSuggestedScore: aiRes.suggestedScore,
      aiConfidence: aiRes.confidence,
      aiJustification: aiRes.justification,
      markingStatus: 'AI_SUGGESTED',
    };
    setResponses(updated);
    setTeacherScoreInput(aiRes.suggestedScore);
    setTeacherCommentInput(aiRes.justification);
    setAiLoading(false);
  };

  if (loading || !currentResp) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button onClick={() => navigate('/teacher/marking')} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Marking Centre
        </button>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Question {currentIndex + 1} of {responses.length} · Learner: <strong>{attempt?.learnerName || 'Juma Omondi'}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Response Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Question Prompt</h3>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Solve the equation or explain the core curriculum outcome clearly showing all steps.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Learner Response</h4>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-sm font-medium text-slate-900 dark:text-white leading-relaxed border border-slate-100 dark:border-slate-700">
              {String(currentResp.responseValue)}
            </div>
          </div>

          {/* Marking scheme reference */}
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 space-y-2">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Marking Scheme Criteria</h4>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
              <li>Statement of formula / correct approach (2 Marks)</li>
              <li>Substitution and intermediate steps (4 Marks)</li>
              <li>Correct final answer / conclusion (4 Marks)</li>
            </ul>
          </div>
        </div>

        {/* Teacher Score Input Panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-sm">Award Score</h3>
              <span className="text-xs text-slate-400">Max: {currentResp.maxMarks} Marks</span>
            </div>

            {/* AI Suggestion CTA */}
            <button
              onClick={handleRequestAISuggestion}
              disabled={aiLoading}
              className="w-full py-2.5 px-3 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-violet-200 dark:border-violet-800"
            >
              {aiLoading ? <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Request AI Marking Suggestion
            </button>

            {currentResp.aiJustification && (
              <div className="bg-violet-50 dark:bg-violet-950/40 rounded-xl p-3 text-xs space-y-1 border border-violet-200 dark:border-violet-800">
                <p className="font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Suggested Score: {currentResp.aiSuggestedScore} / {currentResp.maxMarks}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{currentResp.aiJustification}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teacher Score</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={currentResp.maxMarks}
                  value={teacherScoreInput}
                  onChange={(e) => setTeacherScoreInput(Math.max(0, Math.min(currentResp.maxMarks, Number(e.target.value))))}
                  className="w-24 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setTeacherScoreInput(currentResp.maxMarks)}
                  className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100"
                >
                  Full Marks
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherScoreInput(0)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100"
                >
                  Zero
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Feedback Comment
              </label>
              <textarea
                value={teacherCommentInput}
                onChange={(e) => setTeacherCommentInput(e.target.value)}
                placeholder="Enter specific feedback or common comment..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-bold disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={handleSaveScore}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {currentIndex === responses.length - 1 ? 'Finalize Attempt' : 'Save & Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
