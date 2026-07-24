import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  Flag,
  Wifi,
  WifiOff,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { assessmentAssignmentService } from '../../services/assessmentAssignmentService';
import { assessmentAttemptService } from '../../services/assessmentAttemptService';
import { assessmentMarkingEngineService } from '../../services/assessmentMarkingEngineService';
import { AssessmentAssignment, AssessmentAttempt, AssessmentResponse } from '../../types/assessmentDelivery';

const LEARNER_ID = 'learner_001';

export const LearnerAssessmentTakeView: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<AssessmentAssignment | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(3600);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize assignment & attempt
  useEffect(() => {
    if (!assignmentId) return;

    const init = async () => {
      const asgn = await assessmentAssignmentService.getAssignmentById(assignmentId);
      setAssignment(asgn);

      if (asgn) {
        setSecondsRemaining((asgn.durationMinutes || 60) * 60);
      }

      try {
        const res = await assessmentAttemptService.startAttempt(assignmentId, LEARNER_ID, 'Juma Omondi', 'ADM-401');
        setAttempt(res.attempt);
        setResponses(res.responses);
      } catch {
        // Fetch existing attempt if max attempts reached
        const attempts = await assessmentAttemptService.getAssignmentAttempts(assignmentId);
        const existing = attempts.find((a) => a.learnerId === LEARNER_ID);
        if (existing) {
          setAttempt(existing);
          const resps = await assessmentAttemptService.getAttemptResponses(existing.id);
          setResponses(resps);
        }
      }
      setLoading(false);
    };

    void init();
  }, [assignmentId]);

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (loading || secondsRemaining <= 0 || submitting) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleSubmit(true); // Auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, secondsRemaining, submitting]);

  const currentResp = responses[currentIndex];

  const handleResponseChange = async (val: unknown) => {
    if (!attempt || !currentResp) return;
    setAutoSaveStatus('saving');
    const updated = [...responses];
    updated[currentIndex] = { ...currentResp, responseValue: val };
    setResponses(updated);

    await assessmentAttemptService.autoSaveResponse(attempt.id, currentResp.questionId, val, currentResp.isFlagged);
    setAutoSaveStatus('saved');
  };

  const handleToggleFlag = async () => {
    if (!attempt || !currentResp) return;
    const updated = [...responses];
    const newFlag = !currentResp.isFlagged;
    updated[currentIndex] = { ...currentResp, isFlagged: newFlag };
    setResponses(updated);

    await assessmentAttemptService.autoSaveResponse(attempt.id, currentResp.questionId, currentResp.responseValue, newFlag);
  };

  const handleSubmit = async (isTimeout = false) => {
    if (!attempt) return;
    setSubmitting(true);
    try {
      await assessmentAttemptService.submitAttempt(attempt.id, isTimeout);

      // Auto-mark objective questions
      const mockQuestions = responses.map((r, i) => ({
        id: r.questionId,
        visibility: 'PRIVATE' as const,
        status: 'VERIFIED' as const,
        questionType: i % 2 === 0 ? ('MULTIPLE_CHOICE' as const) : ('STRUCTURED' as const),
        questionText: `Question ${i + 1}`,
        correctAnswer: 'A',
        explanation: 'Correct choice is A.',
        markingScheme: [{ criterion: 'Core idea', marks: r.maxMarks }],
        marks: r.maxMarks,
        grade: 'Form 4',
        subject: assignment?.subject || 'Mathematics',
        curriculum: 'CBC_CBE' as const,
        cognitiveLevel: 'APPLICATION' as const,
        difficulty: 'MEDIUM' as const,
        sourceType: 'SOMA_BANK' as const,
      }));

      await assessmentMarkingEngineService.autoMarkAttempt(attempt.id, mockQuestions);
      navigate(`/learner/assessments/${assignmentId}/result`);
    } catch {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !currentResp) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const answeredCount = responses.filter((r) => r.responseValue !== undefined && r.responseValue !== null && r.responseValue !== '').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div>
          <h2 className="font-black text-slate-900 dark:text-white text-base">{assignment?.assessmentTitle}</h2>
          <p className="text-xs text-slate-500">{assignment?.subject} · Question {currentIndex + 1} of {responses.length}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700 animate-pulse'}`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online (Autosaving)' : 'Offline (Draft Saved Locally)'}</span>
          </div>

          {/* Countdown Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black ${secondsRemaining < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'}`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Submit Assessment
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Question {currentIndex + 1} ({currentResp.maxMarks} Marks)</span>
              <button
                type="button"
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  currentResp.isFlagged ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Flag className="w-3.5 h-3.5" /> {currentResp.isFlagged ? 'Flagged' : 'Flag Question'}
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              Solve or provide a detailed answer for Question {currentIndex + 1}. Show all working steps where applicable.
            </h3>

            {/* Answer Input */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Answer</label>

              {currentIndex % 2 === 0 ? (
                // Multiple choice simulation
                <div className="grid grid-cols-1 gap-2">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleResponseChange(opt)}
                      className={`p-4 rounded-xl border text-left font-bold text-sm transition-colors flex items-center gap-3 ${
                        String(currentResp.responseValue) === opt
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">{opt}</span>
                      <span>Option {opt}: Core curriculum response choice</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Open text area simulation
                <textarea
                  value={String(currentResp.responseValue || '')}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 disabled:opacity-40 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(responses.length - 1, prev + 1))}
              disabled={currentIndex === responses.length - 1}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar Navigator */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Question Navigator</h4>

            <div className="grid grid-cols-5 gap-2">
              {responses.map((r, i) => {
                const isCurrent = i === currentIndex;
                const isAnswered = r.responseValue !== undefined && r.responseValue !== null && r.responseValue !== '';
                return (
                  <button
                    key={r.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-9 rounded-xl font-bold text-xs transition-colors relative ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {i + 1}
                    {r.isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
              <p>Answered: <strong>{answeredCount} / {responses.length}</strong></p>
              <p>Flagged: <strong>{responses.filter((r) => r.isFlagged).length}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-5 text-center">
            <AlertTriangle className="w-12 h-12 text-indigo-600 mx-auto" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Submit Assessment?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You have answered <strong>{answeredCount} out of {responses.length}</strong> questions. Once submitted, you cannot change your answers.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-bold rounded-xl">
                Continue Test
              </button>
              <button onClick={() => handleSubmit(false)} disabled={submitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl">
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
