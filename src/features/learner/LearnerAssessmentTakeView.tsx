import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Lock,
  Sparkles,
  ShieldAlert,
  Save,
  Check
} from 'lucide-react';
import { assessmentAssignmentService } from '../../services/assessmentAssignmentService';
import { assessmentAttemptService } from '../../services/assessmentAttemptService';
import { assessmentMarkingEngineService } from '../../services/assessmentMarkingEngineService';
import { AssessmentAssignment, AssessmentAttempt, AssessmentResponse } from '../../types/assessmentDelivery';
import { useApp } from '../../context/AppContext';

export const LearnerAssessmentTakeView: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { studentProfile, studentCode, userId } = useApp();

  const learnerId = studentProfile?.id || userId || studentCode || 'learner_candidate';
  const learnerName = studentProfile?.name || 'Candidate';
  const admissionNo = studentCode || 'SOMA-EXAM';

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
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Access Code Gate
  const [enteredCode, setEnteredCode] = useState(() => searchParams.get('code') || '');
  const [isCodeLocked, setIsCodeLocked] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Initialize assignment & attempt
  useEffect(() => {
    if (!assignmentId) return;

    const init = async () => {
      const asgn = await assessmentAssignmentService.getAssignmentById(assignmentId);
      setAssignment(asgn);

      if (asgn) {
        setSecondsRemaining((asgn.durationMinutes || 60) * 60);

        // Check if access code is required
        if (asgn.accessCode && asgn.accessCode.trim().toUpperCase() !== enteredCode.trim().toUpperCase()) {
          setIsCodeLocked(true);
          setLoading(false);
          return;
        }
      }

      await startOrResumeAttempt(asgn);
    };

    void init();
  }, [assignmentId]);

  const startOrResumeAttempt = async (asgn: AssessmentAssignment | null) => {
    if (!assignmentId) return;
    try {
      const res = await assessmentAttemptService.startAttempt(assignmentId, learnerId, learnerName, admissionNo);
      setAttempt(res.attempt);
      setResponses(res.responses);
    } catch {
      // Fetch existing attempt if already started
      const attempts = await assessmentAttemptService.getAssignmentAttempts(assignmentId);
      const existing = attempts.find((a) => a.learnerId === learnerId);
      if (existing) {
        setAttempt(existing);
        const resps = await assessmentAttemptService.getAttemptResponses(existing.id);
        setResponses(resps);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment?.accessCode) {
      setIsCodeLocked(false);
      return;
    }
    if (enteredCode.trim().toUpperCase() !== assignment.accessCode.trim().toUpperCase()) {
      setCodeError('Incorrect examination access code. Please check with your teacher or invigilator.');
      return;
    }
    setCodeError('');
    setIsCodeLocked(false);
    setLoading(true);
    await startOrResumeAttempt(assignment);
  };

  // Anti-cheating: tab visibility / blur detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isCodeLocked && attempt && !submitting) {
        setTabSwitchCount(prev => {
          const next = prev + 1;
          setShowTabWarning(true);
          setTimeout(() => setShowTabWarning(false), 5000);
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isCodeLocked, attempt, submitting]);

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
    if (loading || isCodeLocked || secondsRemaining <= 0 || submitting) return;
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
  }, [loading, isCodeLocked, secondsRemaining, submitting]);

  const currentResp = responses[currentIndex];

  const handleResponseChange = async (val: unknown) => {
    if (!attempt || !currentResp) return;
    setAutoSaveStatus('saving');
    const updated = [...responses];
    updated[currentIndex] = { ...currentResp, responseValue: val };
    setResponses(updated);

    try {
      await assessmentAttemptService.autoSaveResponse(attempt.id, currentResp.questionId, val, currentResp.isFlagged);
      setAutoSaveStatus('saved');
    } catch {
      setAutoSaveStatus('error');
    }
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
        grade: assignment?.grade || 'Form 4',
        subject: assignment?.subject || 'Mathematics',
        curriculum: 'CBC_CBE' as const,
        cognitiveLevel: 'APPLICATION' as const,
        difficulty: 'MEDIUM' as const,
        sourceType: 'SOMA_BANK' as const,
      }));

      await assessmentMarkingEngineService.autoMarkAttempt(attempt.id, mockQuestions);
      navigate(`/exam/take/${assignmentId}/result`);
    } catch {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Access Code Gate UI
  if (isCodeLocked) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-black">{assignment?.assessmentTitle || 'Protected Assessment'}</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              This examination requires an invigilator access code to begin.
            </p>
          </div>

          <form onSubmit={handleUnlockWithCode} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Examination Access Code
              </label>
              <input
                type="text"
                autoFocus
                required
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder="e.g. EXAM-4021"
                className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white font-mono text-center font-bold text-lg tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {codeError && <p className="text-xs text-rose-400 font-medium text-center">{codeError}</p>}

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-indigo-600/20"
            >
              Unlock & Start Examination
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || !currentResp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preparing Exam Room...</p>
        </div>
      </div>
    );
  }

  const answeredCount = responses.filter((r) => r.responseValue !== undefined && r.responseValue !== null && r.responseValue !== '').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Tab Switch Warning Toast */}
      {showTabWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-black animate-bounce">
          <ShieldAlert className="w-5 h-5" />
          <span>Warning: Window blur detected ({tabSwitchCount} switch{tabSwitchCount > 1 ? 'es' : ''} recorded for invigilation log).</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-40 shadow-sm gap-3">
        <div>
          <h2 className="font-black text-slate-900 dark:text-white text-base">{assignment?.assessmentTitle}</h2>
          <p className="text-xs text-slate-500 font-medium">
            {assignment?.subject} · Candidate: <strong>{learnerName}</strong> ({admissionNo}) · Q{currentIndex + 1} of {responses.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-save heartbeat */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
            autoSaveStatus === 'saved' ? 'bg-emerald-50 text-emerald-700' : autoSaveStatus === 'saving' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
          }`}>
            {autoSaveStatus === 'saved' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5 animate-pulse text-amber-600" />}
            <span>{autoSaveStatus === 'saved' ? 'Saved to Cloud' : autoSaveStatus === 'saving' ? 'Autosaving...' : 'Save Error'}</span>
          </div>

          {/* Connection status */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${isOnline ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700 animate-pulse'}`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Countdown Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black ${
            secondsRemaining < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" /> Submit
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
                Question {currentIndex + 1} ({currentResp.maxMarks} Marks)
              </span>
              <button
                type="button"
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  currentResp.isFlagged ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Flag className="w-3.5 h-3.5" /> {currentResp.isFlagged ? 'Flagged for Review' : 'Flag Question'}
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              Solve or provide a detailed answer for Question {currentIndex + 1}. Show all working steps and key formulations where applicable.
            </h3>

            {/* Answer Input */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Response</label>

              {currentIndex % 2 === 0 ? (
                // Multiple choice simulation
                <div className="grid grid-cols-1 gap-2.5">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleResponseChange(opt)}
                      className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center gap-3.5 ${
                        String(currentResp.responseValue) === opt
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                        String(currentResp.responseValue) === opt ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}>
                        {opt}
                      </span>
                      <span>Option {opt}: Core curriculum response formulation</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Open text area simulation
                <textarea
                  value={String(currentResp.responseValue || '')}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  placeholder="Type your working and solution here..."
                  rows={7}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(responses.length - 1, prev + 1))}
              disabled={currentIndex === responses.length - 1}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar Navigator */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Question Navigator</h4>

            <div className="grid grid-cols-5 gap-2">
              {responses.map((r, i) => {
                const isCurrent = i === currentIndex;
                const isAnswered = r.responseValue !== undefined && r.responseValue !== null && r.responseValue !== '';
                return (
                  <button
                    key={r.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-10 rounded-xl font-black text-xs transition-all relative ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-sm'
                        : isAnswered
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                    {r.isFlagged && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span>Answered:</span>
                <strong className="text-slate-900 dark:text-white">{answeredCount} / {responses.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Flagged:</span>
                <strong className="text-amber-600">{responses.filter((r) => r.isFlagged).length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-5 text-center">
            <AlertTriangle className="w-12 h-12 text-indigo-600 mx-auto" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Submit Examination?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You have completed <strong>{answeredCount} out of {responses.length}</strong> questions. Once submitted, your responses will be submitted for scoring and grading.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Review Answers
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
