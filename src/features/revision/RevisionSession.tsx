import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
    ArrowLeft, ArrowRight, Clock, CheckCircle, XCircle, Sparkles, Target,
    Trophy, TrendingUp, ChevronRight, AlertTriangle, BarChart3, Zap,
    FileText, Brain, Timer, Star, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import {
    RevisionMode, ExamAnalysis, ExamQuestion, TeacherActivity,
    ExamPracticeMode, AnswerAttempt, ExamPracticeResult, PerformanceRecord, MarkingResult,
    QuestionExplanation
} from '../../types';
import {
    analyzeExamPaper, fileToGenerativePart, markStudentAnswer,
    predictLikelyQuestions, getPaperGuidance, explainQuestion
} from '../../services/geminiService';
import { examService } from '../../services/examService';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    data: File | TeacherActivity;
    mode: RevisionMode;
    initialAnalysis?: ExamAnalysis;
    onExit: () => void;
}

type SessionPhase = 'LOADING' | 'PRE_EXAM' | 'DASHBOARD' | 'QUIZ_ACTIVE' | 'EXPLAINING' | 'MARKING' | 'RESULTS';

const STORAGE_KEY = 'somo_performance_records';

const loadPerformanceRecords = (): PerformanceRecord[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
};

const savePerformanceRecord = (record: PerformanceRecord) => {
    const records = loadPerformanceRecords();
    records.push(record);
    // Keep last 50 records
    if (records.length > 50) records.splice(0, records.length - 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const shuffleQuestions = <T,>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export const RevisionSession: React.FC<Props> = ({ data, mode, initialAnalysis, onExit }) => {
    const { language, isPro, studentCode, studentProfile, userId } = useApp();
    const isLimited = !isPro;

    // Core state
    const [phase, setPhase] = useState<SessionPhase>('LOADING');
    const [analysis, setAnalysis] = useState<ExamAnalysis | null>(initialAnalysis || null);
    const [loadingText, setLoadingText] = useState('Scanning exam paper...');

    // Quiz state
    const [practiceMode, setPracticeMode] = useState<ExamPracticeMode>(ExamPracticeMode.FULL_PAPER);
    const [quizQuestions, setQuizQuestions] = useState<ExamQuestion[]>([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [answerByQuestion, setAnswerByQuestion] = useState<Record<string, string>>({});
    const [attempts, setAttempts] = useState<AnswerAttempt[]>([]);
    const [isMarking, setIsMarking] = useState(false);
    const [currentMarking, setCurrentMarking] = useState<MarkingResult | null>(null);
    const [showModelAnswer, setShowModelAnswer] = useState(false);

    // Explanation mode state
    const [explainFirst, setExplainFirst] = useState(true); // Toggle: explain first vs answer directly
    const [currentExplanation, setCurrentExplanation] = useState<QuestionExplanation | null>(null);
    const [loadingExplanation, setLoadingExplanation] = useState(false);
    const [readyToAnswer, setReadyToAnswer] = useState(false);

    // Per-question timer
    const [questionTimerActive, setQuestionTimerActive] = useState(false);
    const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
    const [questionTimerChoice, setQuestionTimerChoice] = useState<'timed' | 'untimed'>('untimed');
    const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedAnswerRef = useRef('');
    const [serverAttemptId, setServerAttemptId] = useState<string | null>(null);
    const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'offline' | 'error'>('idle');

    // Confidence rating
    const [showConfidence, setShowConfidence] = useState(false);
    const [confidenceLevel, setConfidenceLevel] = useState<number>(0); // 1-5

    // Timer state
    const [timeLimit, setTimeLimit] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [quizStartTime, setQuizStartTime] = useState(0);

    // Pre-exam setup
    const [preExamMinutes, setPreExamMinutes] = useState(120); // default 2 hrs
    const [customMinutes, setCustomMinutes] = useState('');
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

    // Dashboard state
    const [predictions, setPredictions] = useState<ExamAnalysis | null>(null);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    const [strategy, setStrategy] = useState<string | null>(null);
    const [loadingStrategy, setLoadingStrategy] = useState(false);
    const [pastPerformance, setPastPerformance] = useState<PerformanceRecord[]>([]);
    const [expandedSection, setExpandedSection] = useState<string | null>('questions');

    // Refs
    const answerInputRef = useRef<HTMLTextAreaElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const activeExamId = React.useMemo(() => {
        if (data instanceof File) return null;
        const payload = data as any;
        if (payload?.content) return null;
        if (!Array.isArray(payload?.structured_questions)) return null;
        return payload?.id ? String(payload.id) : null;
    }, [data]);
    const learnerId = studentCode || studentProfile?.id || userId || 'guest';

    // ==================== INITIAL LOAD ====================
    useEffect(() => {
        const init = async () => {
            try {
                if (initialAnalysis) {
                    setAnalysis(initialAnalysis);
                    setPreExamMinutes(initialAnalysis.durationMinutes || 120);
                    setSelectedQuestionIds((initialAnalysis.questions || []).filter(question => normalizeSection(question.section) === 'II').slice(0, 5).map(question => String(question.id)));
                    setPhase('DASHBOARD');
                    setPastPerformance(loadPerformanceRecords());
                    return;
                }

                if (data instanceof File) {
                    const base64 = await fileToGenerativePart(data);
                    setLoadingText('AI is analyzing your exam paper...');
                    const result = await analyzeExamPaper(base64, data.type);
                    setAnalysis(result);
                    setPreExamMinutes(result.durationMinutes || 120);
                    setSelectedQuestionIds((result.questions || []).filter(question => normalizeSection(question.section) === 'II').slice(0, 5).map(question => String(question.id)));
                } else if (Array.isArray((data as any)?.structured_questions) || 'file_path' in (data as any) || (data as any)?.fileUrl || (data as any)?.file_url) {
                    const res = data as any;
                    const savedQuestions = Array.isArray(res.structured_questions) ? res.structured_questions : [];

                    if (savedQuestions.length === 0) {
                        throw new Error('This exam has not been structured yet. Ask an administrator to analyze and publish it.');
                    }

                    setLoadingText('Opening structured exam...');
                    setAnalysis({
                        subject: res.subject || 'General',
                        grade: res.grade || 'KCSE',
                        examType: res.exam_type || undefined,
                        year: res.exam_year || undefined,
                        paperCode: res.paper_code || undefined,
                        paperNumber: res.paper_number || undefined,
                        durationMinutes: res.duration_minutes || undefined,
                        totalMarks: res.total_marks || undefined,
                        instructions: Array.isArray(res.exam_instructions) ? res.exam_instructions : [],
                        markingSchemeSource: res.marking_scheme_source || 'AI_DRAFT',
                        questions: savedQuestions
                    });
                    setPreExamMinutes(res.duration_minutes || 120);
                    setSelectedQuestionIds(savedQuestions.filter((question: any) => normalizeSection(question.section) === 'II').slice(0, 5).map((question: any) => String(question.id)));
                } else {
                    // Quiz data from teacher
                    const quiz = (data as any).content;
                    setAnalysis({
                        subject: (data as any).subject,
                        grade: (data as any).className,
                        questions: (quiz?.questions || []).map((q: any, idx: number) => ({
                            id: idx, number: (idx + 1).toString(),
                            text: q.question, topic: quiz?.topic || (data as any).title,
                            marks: 5
                        }))
                    });
                    setSelectedQuestionIds([]);
                }

                setPastPerformance(loadPerformanceRecords());
                setPhase('DASHBOARD');
            } catch (error) {
                console.error(error);
                alert('Failed to load exam content.');
                onExit();
            }
        };
        init();
    }, [data, initialAnalysis]);

    // ==================== TIMER ====================
    useEffect(() => {
        if (timerActive && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setTimerActive(false);
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timerActive]);

    // Per-question timer
    useEffect(() => {
        if (questionTimerActive && questionTimeRemaining > 0) {
            questionTimerRef.current = setInterval(() => {
                setQuestionTimeRemaining(prev => {
                    if (prev <= 1) {
                        setQuestionTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
    }, [questionTimerActive]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const normalizeSection = (section?: string) => String(section || '').trim().toUpperCase();
    const hasSectionTwo = Boolean(analysis?.questions?.some(question => normalizeSection(question.section) === 'II'));
    const sectionOneQuestions = (analysis?.questions || []).filter(question => normalizeSection(question.section) === 'I');
    const sectionTwoQuestions = (analysis?.questions || []).filter(question => normalizeSection(question.section) === 'II');
    const selectedSectionTwoQuestions = sectionTwoQuestions.filter(question => selectedQuestionIds.includes(String(question.id)));
    const selectedQuestionCount = selectedSectionTwoQuestions.length;
    const canStartSectionedPaper = !hasSectionTwo || selectedQuestionCount === 5;
    const toggleSectionTwoQuestion = (questionId: string) => {
        setSelectedQuestionIds(current => {
            if (current.includes(questionId)) {
                return current.filter(id => id !== questionId);
            }
            if (current.length >= 5) return current;
            return [...current, questionId];
        });
    };

    const persistCurrentAnswer = useCallback(async (answerOverride?: string) => {
        if (!activeExamId || !serverAttemptId || quizQuestions.length === 0) return;
        const question = quizQuestions[currentQuestionIdx];
        if (!question) return;
        const answerText = (answerOverride ?? userAnswer).trim();
        if (!answerText) return;
        if (lastSavedAnswerRef.current === `${question.id}:${answerText}`) return;

        setAutosaveStatus('saving');
        try {
            await examService.saveResponse({
                attemptId: serverAttemptId,
                questionId: question.id,
                answerText,
                timeSpentSeconds: Math.max(0, Math.round((Date.now() - quizStartTime) / 1000))
            });
            lastSavedAnswerRef.current = `${question.id}:${answerText}`;
            setAutosaveStatus('saved');
        } catch (error) {
            console.error('Autosave failed:', error);
            setAutosaveStatus(navigator.onLine ? 'error' : 'offline');
        }
    }, [activeExamId, currentQuestionIdx, quizQuestions, quizStartTime, serverAttemptId, userAnswer]);

    // ==================== QUIZ CONTROL ====================

    useEffect(() => {
        if (!activeExamId || !serverAttemptId) return;
        if (!userAnswer.trim()) return;

        if (autosaveRef.current) clearTimeout(autosaveRef.current);
        autosaveRef.current = setTimeout(() => {
            void persistCurrentAnswer();
        }, 15000);

        return () => {
            if (autosaveRef.current) clearTimeout(autosaveRef.current);
        };
    }, [activeExamId, currentQuestionIdx, persistCurrentAnswer, serverAttemptId, userAnswer]);

    const startQuiz = async (mode: ExamPracticeMode, questions?: ExamQuestion[], overrideSecs?: number) => {
        const qs = questions || analysis?.questions || [];
        const sectionedQuestions = !questions && hasSectionTwo
            ? qs.filter(question => normalizeSection(question.section) !== 'II' || selectedQuestionIds.includes(String(question.id)))
            : qs;
        const preparedQuestions = mode === ExamPracticeMode.PRACTICE_BY_TOPIC && sectionedQuestions.length > 1 ? shuffleQuestions(sectionedQuestions) : sectionedQuestions;
        setQuizQuestions(preparedQuestions);
        setPracticeMode(mode);
        setCurrentQuestionIdx(0);
        setAttempts([]);
        setUserAnswer('');
        setAnswerByQuestion({});
        setCurrentMarking(null);
        setShowModelAnswer(false);
        setQuizStartTime(Date.now());
        setCurrentExplanation(null);
        setReadyToAnswer(false);
        setShowConfidence(false);
        setConfidenceLevel(0);
        setAutosaveStatus('idle');
        setServerAttemptId(null);
        lastSavedAnswerRef.current = '';

        if (activeExamId) {
            try {
                const attempt = await examService.startAttempt({
                    examId: activeExamId,
                    learnerId,
                    mode,
                    selectedQuestions: preparedQuestions.map(question => String(question.id))
                });
                const attemptId = String((attempt as any)?.id || (attempt as any)?.attempt_id || (Array.isArray(attempt) ? attempt[0]?.id : '') || '');
                if (attemptId) {
                    setServerAttemptId(attemptId);
                    setAutosaveStatus('saved');
                }
            } catch (error) {
                console.warn('Secure exam attempt could not be opened, continuing locally:', error);
                setAutosaveStatus('offline');
            }
        }

        if (mode === ExamPracticeMode.TIMED_QUIZ) {
            const totalTime = overrideSecs ?? preparedQuestions.length * 120;
            setTimeLimit(totalTime);
            setTimeRemaining(totalTime);
            setTimerActive(true);
        }

        // Timed exams never reveal explanations before or during an attempt.
        const shouldExplainFirst = mode !== ExamPracticeMode.TIMED_QUIZ && explainFirst;
        if (mode === ExamPracticeMode.TIMED_QUIZ) setExplainFirst(false);
        if (shouldExplainFirst && preparedQuestions.length > 0) {
            setPhase('EXPLAINING');
            await loadExplanation(preparedQuestions[0]);
        } else {
            setPhase('QUIZ_ACTIVE');
            setTimeout(() => answerInputRef.current?.focus(), 300);
        }
    };

    const loadExplanation = async (question: ExamQuestion) => {
        setLoadingExplanation(true);
        setCurrentExplanation(null);
        setReadyToAnswer(false);
        try {
            const explanation = await explainQuestion(question, language);
            setCurrentExplanation(explanation);
        } catch (e) {
            console.error('Error loading explanation:', e);
            // If explanation fails, go straight to answering
            setPhase('QUIZ_ACTIVE');
            setTimeout(() => answerInputRef.current?.focus(), 200);
        } finally {
            setLoadingExplanation(false);
        }
    };

    const handleReadyToAnswer = () => {
        setReadyToAnswer(true);
        setPhase('QUIZ_ACTIVE');
        // Start per-question timer if chosen
        if (questionTimerChoice === 'timed') {
            const question = quizQuestions[currentQuestionIdx];
            const timePerMark = 90; // 1.5 min per mark
            setQuestionTimeRemaining((question?.marks || 2) * timePerMark);
            setQuestionTimerActive(true);
        }
        setTimeout(() => answerInputRef.current?.focus(), 200);
    };

    const updateAnswer = (value: string) => {
        setUserAnswer(value);
        const question = quizQuestions[currentQuestionIdx];
        if (question) setAnswerByQuestion(current => ({ ...current, [String(question.id)]: value }));
    };

    const handleSaveTimedAnswer = async () => {
        const question = quizQuestions[currentQuestionIdx];
        if (!question) return;
        if (userAnswer.trim()) await persistCurrentAnswer(userAnswer).catch(() => null);
        if (currentQuestionIdx >= quizQuestions.length - 1) {
            await finishQuiz();
            return;
        }
        const nextIndex = currentQuestionIdx + 1;
        setCurrentQuestionIdx(nextIndex);
        setUserAnswer(answerByQuestion[String(quizQuestions[nextIndex].id)] || '');
        setCurrentMarking(null);
        setShowModelAnswer(false);
        lastSavedAnswerRef.current = '';
    };

    const handleSubmitAnswer = async () => {
        if (!userAnswer.trim() || isMarking) return;
        const question = quizQuestions[currentQuestionIdx];
        if (!question) return;

        setIsMarking(true);
        setPhase('MARKING');

        try {
            const result = activeExamId
                ? await examService.markResponse(activeExamId, question.id, userAnswer, language)
                : await markStudentAnswer(question, userAnswer, language);
            setCurrentMarking(result);

            const attempt: AnswerAttempt = {
                questionId: question.id,
                questionNumber: question.number,
                questionText: question.text,
                learnerAnswer: userAnswer,
                marksAwarded: result.marksAwarded,
                marksAvailable: result.marksAvailable,
                modelAnswer: result.modelAnswer,
                feedback: result.feedback,
                examTip: result.examTip,
                isCorrect: result.isCorrect,
                topic: question.topic,
                timeTakenSeconds: Math.round((Date.now() - quizStartTime) / 1000)
            };

            setAttempts(prev => [...prev, attempt]);
            void persistCurrentAnswer(userAnswer);
            setShowModelAnswer(true);
        } catch (error) {
            console.error('Error marking answer:', error);
            // Fallback marking
            setCurrentMarking({
                marksAwarded: 0,
                marksAvailable: question.marks || 2,
                isCorrect: false,
                modelAnswer: 'AI could not generate a model answer at this time.',
                feedback: activeExamId
                    ? 'We could not contact the exam marker right now. Please try again.'
                    : 'We encountered an error while marking. Please try again.',
                examTip: 'Write clear, structured answers.'
            });
            setShowModelAnswer(true);
        } finally {
            setIsMarking(false);
        }
    };

    const handleNextQuestion = () => {
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
        setQuestionTimerActive(false);
        setShowConfidence(false);
        setConfidenceLevel(0);
        void persistCurrentAnswer();

        if (currentQuestionIdx < quizQuestions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            const nextQuestion = quizQuestions[currentQuestionIdx + 1];
            setUserAnswer(nextQuestion ? (answerByQuestion[String(nextQuestion.id)] || '') : '');
            setCurrentMarking(null);
            setShowModelAnswer(false);
            setCurrentExplanation(null);
            setReadyToAnswer(false);
            lastSavedAnswerRef.current = '';

            const nextQ = quizQuestions[currentQuestionIdx + 1];
            if (explainFirst && nextQ) {
                setPhase('EXPLAINING');
                loadExplanation(nextQ);
            } else {
                setPhase('QUIZ_ACTIVE');
                setTimeout(() => answerInputRef.current?.focus(), 200);
            }
        } else {
            finishQuiz();
        }
    };

    const handleAutoSubmit = () => {
        setTimerActive(false);
        finishQuiz();
    };

    const finishQuiz = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerActive(false);
        if (activeExamId) await persistCurrentAnswer().catch(() => null);

        let completedAttempts = attempts;
        if (practiceMode === ExamPracticeMode.TIMED_QUIZ) {
            setPhase('MARKING');
            setIsMarking(true);
            const timedAttempts: AnswerAttempt[] = [];
            for (const question of quizQuestions) {
                const learnerAnswer = answerByQuestion[String(question.id)]?.trim() || '';
                if (!learnerAnswer) {
                    timedAttempts.push({ questionId: question.id, questionNumber: question.number, questionText: question.text, learnerAnswer: '', marksAwarded: 0, marksAvailable: question.marks || 1, modelAnswer: '', feedback: 'This question was not answered.', isCorrect: false, topic: question.topic });
                    continue;
                }
                try {
                    const result = activeExamId
                        ? await examService.markResponse(activeExamId, question.id, learnerAnswer, language)
                        : await markStudentAnswer(question, learnerAnswer, language);
                    timedAttempts.push({ questionId: question.id, questionNumber: question.number, questionText: question.text, learnerAnswer, marksAwarded: result.marksAwarded, marksAvailable: result.marksAvailable, modelAnswer: result.modelAnswer, feedback: result.feedback, examTip: result.examTip, isCorrect: result.isCorrect, topic: question.topic });
                } catch (error) {
                    console.error('Could not mark timed response:', error);
                    timedAttempts.push({ questionId: question.id, questionNumber: question.number, questionText: question.text, learnerAnswer, marksAwarded: 0, marksAvailable: question.marks || 1, modelAnswer: '', feedback: 'This response is awaiting marking.', isCorrect: false, topic: question.topic });
                }
            }
            completedAttempts = timedAttempts;
            setAttempts(timedAttempts);
            setIsMarking(false);
        }

        const totalMarks = completedAttempts.reduce((sum, a) => sum + a.marksAvailable, 0);
        const marksObtained = completedAttempts.reduce((sum, a) => sum + a.marksAwarded, 0);
        const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;

        // Find weak/strong topics
        const topicScores: Record<string, { total: number; obtained: number }> = {};
        completedAttempts.forEach(a => {
            if (!topicScores[a.topic]) topicScores[a.topic] = { total: 0, obtained: 0 };
            topicScores[a.topic].total += a.marksAvailable;
            topicScores[a.topic].obtained += a.marksAwarded;
        });

        const weakTopics = Object.entries(topicScores)
            .filter(([_, s]) => s.total > 0 && (s.obtained / s.total) < 0.5)
            .map(([t]) => t);
        const strongTopics = Object.entries(topicScores)
            .filter(([_, s]) => s.total > 0 && (s.obtained / s.total) >= 0.7)
            .map(([t]) => t);

        const timeSpentSeconds = Math.round((Date.now() - quizStartTime) / 1000);
        const record: PerformanceRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            subject: analysis?.subject || '',
            grade: analysis?.grade || '',
            score: percentage,
            totalQuestions: completedAttempts.length,
            correctAnswers: completedAttempts.filter(a => a.isCorrect).length,
            timeSpentSeconds,
            weakTopics,
            mode: practiceMode
        };
        savePerformanceRecord(record);
        setPastPerformance(loadPerformanceRecords());

        if (activeExamId && serverAttemptId) {
            try {
                await examService.submitAttempt(serverAttemptId, timeSpentSeconds);
                setAutosaveStatus('saved');
            } catch (error) {
                console.error('Could not submit exam attempt:', error);
                setAutosaveStatus(navigator.onLine ? 'error' : 'offline');
            }
        }

        setPhase('RESULTS');
    };

    // ==================== DASHBOARD ACTIONS ====================
    const handlePredictions = async () => {
        if (!analysis || loadingPredictions) return;
        setLoadingPredictions(true);
        try {
            const predicted = await predictLikelyQuestions(analysis, language);
            setPredictions(predicted);
        } catch (e) { console.error(e); }
        finally { setLoadingPredictions(false); }
    };

    const handleStrategy = async () => {
        if (!analysis || loadingStrategy) return;
        setLoadingStrategy(true);
        try {
            const text = await getPaperGuidance(analysis, undefined, language);
            setStrategy(text);
        } catch (e) { console.error(e); }
        finally { setLoadingStrategy(false); }
    };

    // ==================== RENDER ====================

    // --- LOADING ---
    if (phase === 'LOADING') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="w-16 h-16 relative mb-6">
                    <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-slate-700 dark:text-white font-bold text-lg mb-1">Analyzing Paper</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm animate-pulse">{loadingText}</p>
            </div>
        );
    }

    // --- PRE-EXAM SETUP ---
    if (phase === 'PRE_EXAM' && analysis) {
        const totalMarks = analysis.questions.reduce((sum, q) => sum + (q.marks || 2), 0);
        const PRESETS = [
            { label: '1 hour', mins: 60, hint: 'KPSEA / short paper' },
            { label: '2 hours', mins: 120, hint: 'KCSE Paper 1 & 2' },
            { label: '2.5 hours', mins: 150, hint: 'History / English essays' },
            { label: '3 hours', mins: 180, hint: 'KCSE Maths / Sciences' },
        ];
        const hasOfficialDuration = Boolean(analysis.durationMinutes);
        const finalMins = analysis.durationMinutes || (customMinutes ? parseInt(customMinutes) : preExamMinutes);
        return (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
                <div className="w-full max-w-sm space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-900/40 border border-indigo-700/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Timer className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-white font-black text-xl">{hasOfficialDuration ? 'Official Exam Setup' : 'Set Exam Time'}</h2>
                        <p className="text-slate-400 text-sm mt-1 font-medium">
                            {analysis.subject}  -  {analysis.questions.length} questions  -  {totalMarks} marks
                        </p>
                    </div>

                    {hasOfficialDuration && (
                        <div className="rounded-2xl border border-indigo-700/60 bg-indigo-900/30 p-5 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Official paper duration</p>
                            <p className="mt-2 text-3xl font-black text-white">{analysis.durationMinutes} minutes</p>
                            <p className="mt-1 text-xs text-slate-400">Timed Exam uses the duration approved with this paper.</p>
                        </div>
                    )}

                    {/* Time presets */}
                    <div className={hasOfficialDuration ? 'hidden' : 'grid grid-cols-2 gap-3'}>
                        {PRESETS.map(p => (
                            <button
                                key={p.mins}
                                onClick={() => { setPreExamMinutes(p.mins); setCustomMinutes(''); }}
                                className={`p-4 rounded-2xl border text-left transition-all ${
                                    preExamMinutes === p.mins && !customMinutes
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                }`}
                            >
                                <p className="font-black text-sm">{p.label}</p>
                                <p className={`text-[10px] mt-0.5 ${preExamMinutes === p.mins && !customMinutes ? 'text-indigo-200' : 'text-slate-500'}`}>{p.hint}</p>
                            </button>
                        ))}
                    </div>

                    {/* Custom time */}
                    <div className={hasOfficialDuration ? 'hidden' : ''}>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Custom (minutes)</label>
                        <input
                            type="number"
                            value={customMinutes}
                            onChange={e => setCustomMinutes(e.target.value)}
                            placeholder="e.g. 90"
                            min="10" max="300"
                            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600"
                        />
                    </div>

                    {hasSectionTwo && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">KCSE section choice</p>
                                    <p className="text-sm text-slate-300 font-medium">Section I is compulsory. Section II: choose any 5 questions.</p>
                                </div>
                                <span className={`text-xs font-black px-3 py-1 rounded-full ${canStartSectionedPaper ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {selectedQuestionCount}/5 selected
                                </span>
                            </div>

                            {sectionOneQuestions.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Section I ? compulsory</p>
                                    <div className="flex flex-wrap gap-2">
                                        {sectionOneQuestions.map(question => (
                                            <span key={String(question.id)} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-black text-slate-300">
                                                Q{question.number}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sectionTwoQuestions.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Section II ? pick 5</p>
                                    <div className="flex flex-wrap gap-2">
                                        {sectionTwoQuestions.map(question => {
                                            const isSelected = selectedQuestionIds.includes(String(question.id));
                                            return (
                                                <button
                                                    key={String(question.id)}
                                                    type="button"
                                                    onClick={() => toggleSectionTwoQuestion(String(question.id))}
                                                    className={`rounded-xl border px-3 py-1.5 text-xs font-black transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'}`}
                                                >
                                                    Q{question.number}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400 font-medium">Time per question (avg)</span>
                            <span className="text-white font-black">{formatTime(Math.floor((finalMins * 60) / analysis.questions.length))}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span className="text-slate-400 font-medium">Total exam time</span>
                            <span className="text-white font-black">{finalMins} min</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span className="text-slate-400 font-medium">Time per mark (avg)</span>
                            <span className="text-white font-black">{Math.round((finalMins * 60) / totalMarks)}s</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { void startQuiz(ExamPracticeMode.TIMED_QUIZ, undefined, finalMins * 60); }}
                        disabled={!finalMins || finalMins < 10 || !canStartSectionedPaper}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-base flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                    >
                        <Timer className="w-5 h-5" /> {hasSectionTwo && !canStartSectionedPaper ? 'Select 5 Section II questions' : 'Start Exam'}  -  {finalMins} min
                    </motion.button>
                    <button onClick={() => setPhase('DASHBOARD')} className="w-full text-slate-500 text-sm font-bold hover:text-slate-300 transition-colors">
                        â† Back to Paper
                    </button>
                </div>
            </div>
        );
    }

    // --- DASHBOARD ---
    if (phase === 'DASHBOARD' && analysis) {
        const totalMarks = analysis.questions.reduce((sum, q) => sum + (q.marks || 2), 0);
        const recentScores = pastPerformance
            .filter(p => p.subject === analysis.subject)
            .slice(-5);
        const avgScore = recentScores.length > 0
            ? Math.round(recentScores.reduce((s, p) => s + p.score, 0) / recentScores.length)
            : null;

        return (
            <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans transition-colors duration-300">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm transition-colors">
                    <div className="flex items-center gap-3">
                        <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-slate-900 dark:text-white">{analysis.subject}  -  {analysis.grade}</h1>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{analysis.questions.length} questions â€¢ {totalMarks} marks</p>
                        </div>
                    </div>
                    {avgScore !== null && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl">
                            <p className="text-[10px] text-indigo-400 dark:text-indigo-400/80 font-bold">YOUR AVERAGE</p>
                            <p className={`text-lg font-black ${avgScore >= 70 ? 'text-emerald-600 dark:text-emerald-400' : avgScore >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                                {avgScore}%
                            </p>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto p-4 space-y-4">

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setPhase('PRE_EXAM')}
                                className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-5 rounded-2xl text-left shadow-lg"
                            >
                                <Timer className="w-6 h-6 mb-3 opacity-80" />
                                <p className="font-black text-sm mb-1">Timed Exam</p>
                                <p className="text-blue-200 text-[10px]">{analysis.questions.length} Qs  -  {analysis.durationMinutes ? `${analysis.durationMinutes} min official` : 'Set your time'}</p>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { void startQuiz(ExamPracticeMode.FULL_PAPER); }}
                                className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl text-left shadow-lg"
                            >
                                <FileText className="w-6 h-6 mb-3 opacity-80" />
                                <p className="font-black text-sm mb-1">Full Paper</p>
                                <p className="text-emerald-200 text-[10px]">No time limit â€¢ AI marks each answer</p>
                            </motion.button>
                        </div>

                        {/* Strategy & Predictions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleStrategy}
                                disabled={loadingStrategy}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-left hover:border-indigo-300 dark:hover:border-indigo-700 transition-all disabled:opacity-60"
                            >
                                {loadingStrategy ? (
                                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mb-2" />
                                ) : (
                                    <Target className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-2" />
                                )}
                                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Exam Strategy</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Time allocation & tips</p>
                            </button>

                            <button
                                onClick={handlePredictions}
                                disabled={loadingPredictions}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-left hover:border-amber-300 dark:hover:border-amber-700 transition-all disabled:opacity-60"
                            >
                                {loadingPredictions ? (
                                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin mb-2" />
                                ) : (
                                    <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400 mb-2" />
                                )}
                                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">High-Yield Practice</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Frequently tested skills to practise next</p>
                            </button>
                        </div>

                        {/* Strategy Display */}
                        {strategy && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-5"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Target className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                    <span className="font-bold text-sm text-indigo-800 dark:text-indigo-300">Exam Strategy</span>
                                </div>
                                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                    {strategy}
                                </div>
                            </motion.div>
                        )}

                        {/* Predictions Display */}
                        {predictions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl overflow-hidden shadow-sm"
                            >
                                <div className="bg-amber-50 dark:bg-amber-950/30 px-5 py-3 border-b border-amber-100 dark:border-amber-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                        <span className="font-bold text-sm text-amber-800 dark:text-amber-300">High-Yield Practice</span>
                                    </div>
                                    <button
                                        onClick={() => { void startQuiz(ExamPracticeMode.PRACTICE_BY_TOPIC, predictions.questions); }}
                                        className="text-[10px] font-black bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-full transition-colors"
                                    >
                                        Attempt These
                                    </button>
                                </div>
                                <div className="p-4 space-y-3">
                                    {predictions.questions.map(q => (
                                        <div key={q.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded shrink-0 mt-0.5">Q{q.number}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{q.text}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">{q.topic}</span>
                                                    <span className="text-[9px] text-indigo-400 dark:text-indigo-500 font-bold">{q.marks} marks</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Questions List */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
                            <button
                                onClick={() => setExpandedSection(expandedSection === 'questions' ? null : 'questions')}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Paper Questions ({analysis.questions.length})</span>
                                </div>
                                {expandedSection === 'questions' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedSection === 'questions' && (
                                <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-2 max-h-64 overflow-y-auto">
                                    {analysis.questions.map(q => (
                                        <div
                                            key={q.id}
                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                            onClick={() => { void startQuiz(ExamPracticeMode.PRACTICE_BY_TOPIC, [q]); }}
                                        >
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded shrink-0">Q{q.number}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 font-medium">{q.text}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">{q.topic}</span>
                                                    {q.marks && <span className="text-[9px] text-slate-400 dark:text-slate-500">{q.marks}m</span>}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Performance History */}
                        {pastPerformance.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'performance' ? null : 'performance')}
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Your Performance</span>
                                    </div>
                                    {expandedSection === 'performance' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </button>
                                {expandedSection === 'performance' && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-2 max-h-64 overflow-y-auto">
                                        {pastPerformance.slice(-10).reverse().map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                <div>
                                                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">{p.subject}  -  {p.grade}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{new Date(p.date).toLocaleDateString()} â€¢ {p.correctAnswers}/{p.totalQuestions} correct</p>
                                                </div>
                                                <div className={`text-lg font-black ${p.score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : p.score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    {p.score}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- EXPLAINING PHASE ---
    if (phase === 'EXPLAINING' && quizQuestions.length > 0) {
        const question = quizQuestions[currentQuestionIdx];
        const progress = (currentQuestionIdx / quizQuestions.length) * 100;

        return (
            <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans transition-colors duration-300">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={onExit} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Question {currentQuestionIdx + 1} of {quizQuestions.length}
                        </p>
                        <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                            ?? Explain First
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                        <motion.div className="bg-purple-600 dark:bg-purple-500 h-1.5 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto p-5 space-y-5">
                        {/* Question Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-sm font-black">Q{question.number}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase font-bold">{question.topic}</span>
                                    {question.section && (
                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded uppercase font-bold">Section {question.section}</span>
                                    )}
                                </div>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-500">{question.marks || 2} marks</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-black">{question.text}</p>
                            {question.diagramUrl && <img src={question.diagramUrl} alt={`Diagram for question ${question.number}`} className="mt-4 max-h-80 w-full rounded-2xl border border-slate-200 object-contain dark:border-slate-700" />}
                        </motion.div>

                        {/* Loading Explanation */}
                        {loadingExplanation && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-6 text-center"
                            >
                                <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-3" />
                                <p className="font-bold text-sm text-purple-800 dark:text-purple-300">Analyzing this question for you...</p>
                                <p className="text-xs text-purple-500 dark:text-purple-500 mt-1 font-medium">Understanding what it tests and how to approach it</p>
                            </motion.div>
                        )}

                        {/* Explanation Content */}
                        {currentExplanation && !loadingExplanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {/* What It Tests */}
                                <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/60 rounded-lg flex items-center justify-center">
                                            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="font-bold text-sm text-blue-800 dark:text-blue-300">What This Tests</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{currentExplanation.whatItTests}</p>
                                </div>

                                {/* Key Concepts */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Brain className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Key Concepts You Need</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {currentExplanation.keyConcepts.map((concept, i) => (
                                            <span key={i} className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-black">
                                                {concept}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Approach Strategy */}
                                <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg flex items-center justify-center">
                                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">How to Approach This</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{currentExplanation.approachStrategy}</p>
                                </div>

                                {/* Common Pitfalls */}
                                <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                        <span className="font-bold text-sm text-amber-800 dark:text-amber-300">Watch Out For</span>
                                    </div>
                                    <div className="space-y-2">
                                        {currentExplanation.commonPitfalls.map((pitfall, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <XCircle className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600 mt-0.5 shrink-0" />
                                                <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">{pitfall}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Exam Context */}
                                <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                        <span className="font-bold text-xs text-slate-600 dark:text-slate-300">KPSEA/KCSE Exam Context</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{currentExplanation.examContext}</p>
                                </div>

                                {/* Timer Choice */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">How do you want to answer?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setQuestionTimerChoice('untimed')}
                                            className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${questionTimerChoice === 'untimed'
                                                ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-300 dark:border-indigo-700'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-2 border-transparent'
                                                }`}
                                        >
                                            <FileText className="w-4 h-4" />
                                            No Time Limit
                                        </button>
                                        <button
                                            onClick={() => setQuestionTimerChoice('timed')}
                                            className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${questionTimerChoice === 'timed'
                                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-2 border-transparent'
                                                }`}
                                        >
                                            <Timer className="w-4 h-4" />
                                            Timed ({formatTime((question.marks || 2) * 90)})
                                        </button>
                                    </div>
                                </div>

                                {/* Ready Button */}
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleReadyToAnswer}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-lg"
                                >
                                    ?? I&apos;m Ready - Answer This Question
                                    <ArrowRight className="w-5 h-5" />
                                </motion.button>

                                {/* Skip explanation */}
                                <button
                                    onClick={() => {
                                        setExplainFirst(false);
                                        setPhase('QUIZ_ACTIVE');
                                        setTimeout(() => answerInputRef.current?.focus(), 200);
                                    }}
                                    className="w-full text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-300 py-2 transition-colors"
                                >
                                    Skip explanations for remaining questions
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- QUIZ ACTIVE / MARKING ---
    if ((phase === 'QUIZ_ACTIVE' || phase === 'MARKING') && quizQuestions.length > 0) {
        const question = quizQuestions[currentQuestionIdx];
        const progress = ((currentQuestionIdx + (showModelAnswer ? 1 : 0)) / quizQuestions.length) * 100;
        const answerFormatOptions = (question.answerFormat as any)?.options;
        const questionOptions = Array.isArray(question.options) ? question.options : Array.isArray(answerFormatOptions) ? answerFormatOptions.map(String) : [];
        const isMultipleChoice = question.questionType === 'multiple_choice' || questionOptions.length > 0;

        return (
            <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans transition-colors duration-300">
                {/* Quiz Header */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={onExit} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Question {currentQuestionIdx + 1} of {quizQuestions.length}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Per-question timer */}
                            {questionTimerActive && (
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black ${questionTimeRemaining < 30 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse' :
                                    questionTimeRemaining < 60 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                                        'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    <Timer className="w-3 h-3" />
                                    {formatTime(questionTimeRemaining)}
                                </div>
                            )}
                            {/* Overall timed quiz timer */}
                            {practiceMode === ExamPracticeMode.TIMED_QUIZ && (
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black ${timeRemaining < 60 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse' :
                                    timeRemaining < 300 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
                                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatTime(timeRemaining)}
                                </div>
                            )}
                            {/* Explain-first belongs to guided practice only. */}
                            {practiceMode !== ExamPracticeMode.TIMED_QUIZ && (
                                <button onClick={() => setExplainFirst(!explainFirst)} className={`text-[9px] font-black px-2 py-1 rounded-full uppercase transition-all ${explainFirst ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`} title={explainFirst ? 'Explain first: ON' : 'Explain first: OFF'}>
                                    Explain {explainFirst ? 'ON' : 'OFF'}
                                </button>
                            )}
                            {activeExamId && (
                                <span className={autosaveStatus === 'saved'
                                    ? 'text-[9px] font-black px-2 py-1 rounded-full uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                    : autosaveStatus === 'saving'
                                        ? 'text-[9px] font-black px-2 py-1 rounded-full uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                        : autosaveStatus === 'offline'
                                            ? 'text-[9px] font-black px-2 py-1 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                            : 'text-[9px] font-black px-2 py-1 rounded-full uppercase bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'}>
                                    {autosaveStatus === 'saving' ? 'Saving?' : autosaveStatus === 'saved' ? 'Saved' : autosaveStatus === 'offline' ? 'Saved offline' : 'Sync required'}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                        <motion.div
                            className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Question & Answer Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto p-5 space-y-5">
                        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-1">Paper Snapshot</p>
                                    <p className="text-sm font-black">{analysis?.subject} / {analysis?.grade}</p>
                                    <p className="text-[11px] text-slate-300 mt-1">Answer like an exam paper: short points, full working, and clear final lines.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Question</p>
                                    <p className="text-lg font-black text-white">{currentQuestionIdx + 1}/{quizQuestions.length}</p>
                                </div>
                            </div>
                        </div>
                        {quizQuestions.length > 1 && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Navigator</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Answered {Object.values(answerByQuestion).filter(answer => answer.trim()).length}/{quizQuestions.length}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {quizQuestions.map((item, index) => {
                                        const isCurrent = index === currentQuestionIdx;
                                        const isAnswered = Boolean(answerByQuestion[String(item.id)]?.trim()) || attempts.some(attempt => String(attempt.questionId) === String(item.id));
                                        return (
                                            <button
                                                key={String(item.id)}
                                                type="button"
                                                onClick={() => {
                                                    if (index === currentQuestionIdx) return;
                                                    void persistCurrentAnswer();
                                                    setCurrentQuestionIdx(index);
                                                    setUserAnswer(answerByQuestion[String(item.id)] || '');
                                                    setCurrentMarking(null);
                                                    setShowModelAnswer(false);
                                                    setReadyToAnswer(false);
                                                    setPhase('QUIZ_ACTIVE');
                                                }}
                                                className={`h-9 min-w-9 rounded-xl px-3 text-xs font-black transition-colors ${isCurrent ? 'bg-indigo-600 text-white' : isAnswered ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                {item.number}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* Question Card */}
                        <motion.div
                            key={currentQuestionIdx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg text-sm font-black">Q{question.number}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase font-bold">{question.topic}</span>
                                    {question.section && (
                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded uppercase font-bold">Section {question.section}</span>
                                    )}
                                </div>
                                <span className="text-xs font-black text-slate-500 dark:text-slate-500">{question.marks || 2} marks</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-black">{question.text}</p>
                            {question.diagramUrl && <img src={question.diagramUrl} alt={`Diagram for question ${question.number}`} className="mt-4 max-h-80 w-full rounded-2xl border border-slate-200 object-contain dark:border-slate-700" />}
                        </motion.div>

                        {/* Answer Input */}
                        {!showModelAnswer && (
                            <div className="space-y-3">
                                <div className="relative">
                                    {isMultipleChoice ? (
                                        <div className="grid gap-3">
                                            {questionOptions.map((option, index) => (
                                                <button key={`${question.id}-${index}`} type="button" onClick={() => updateAnswer(option)} disabled={isMarking} className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${userAnswer === option ? 'border-indigo-600 bg-indigo-50 text-indigo-950 dark:bg-indigo-950/40 dark:text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'}`}>
                                                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${userAnswer === option ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-500'}`}>{String.fromCharCode(65 + index)}</span>
                                                    <span className="text-sm font-bold leading-relaxed">{option}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <textarea
                                            ref={answerInputRef}
                                            value={userAnswer}
                                            onChange={(e) => updateAnswer(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey && practiceMode !== ExamPracticeMode.TIMED_QUIZ) handleSubmitAnswer(); }}
                                            placeholder="Write your answer in exam style. Use points, working, and a clear final answer."
                                            className="w-full min-h-[150px] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none resize-none transition-all"
                                            disabled={isMarking}
                                        />
                                    )}
                                    {isMarking && (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                            <div className="text-center">
                                                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-2" />
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Exam marker is checking...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase transition-colors">{practiceMode === ExamPracticeMode.TIMED_QUIZ ? 'No hints or marking until submission' : 'Ctrl+Enter to submit'}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold text-right">Answer in marks, not a long essay.</p>
                                    <button
                                        onClick={practiceMode === ExamPracticeMode.TIMED_QUIZ ? handleSaveTimedAnswer : handleSubmitAnswer}
                                        disabled={(practiceMode !== ExamPracticeMode.TIMED_QUIZ && !userAnswer.trim()) || isMarking}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20"
                                    >
                                        {practiceMode === ExamPracticeMode.TIMED_QUIZ ? (currentQuestionIdx === quizQuestions.length - 1 ? 'Submit Exam' : 'Save & Next') : 'Submit Answer'} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Marking Result */}
                        {showModelAnswer && currentMarking && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {/* Score Banner */}
                                <div className={`rounded-2xl p-5 transition-colors ${currentMarking.isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40'
                                    : currentMarking.marksAwarded > 0
                                        ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40'
                                        : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40'
                                    }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {currentMarking.isCorrect ? (
                                                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                            ) : currentMarking.marksAwarded > 0 ? (
                                                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                                            )}
                                            <span className={`font-black text-lg ${currentMarking.isCorrect ? 'text-emerald-900 dark:text-emerald-300' : currentMarking.marksAwarded > 0 ? 'text-amber-900 dark:text-amber-300' : 'text-red-900 dark:text-red-300'}`}>
                                                {currentMarking.marksAwarded}/{currentMarking.marksAvailable} marks
                                            </span>
                                        </div>
                                        {currentMarking.isCorrect && <Star className="w-5 h-5 text-amber-400 fill-current" />}
                                    </div>
                                    <p className={`text-sm leading-relaxed font-medium ${currentMarking.isCorrect ? 'text-emerald-800 dark:text-emerald-400/90' : currentMarking.marksAwarded > 0 ? 'text-amber-800 dark:text-amber-400/90' : 'text-red-800 dark:text-red-400/90'}`}>{currentMarking.feedback}</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Before moving on, compare your answer to the marking scheme and fix the missing point.</p>
                                </div>

                                {/* Model Answer */}
                                <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-5 shadow-sm transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/60 rounded-lg flex items-center justify-center">
                                            <CheckCircle className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <span className="font-bold text-sm text-indigo-800 dark:text-indigo-300">Model Answer (Marking Scheme)</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">{currentMarking.modelAnswer}</p>
                                </div>

                                {/* Exam Tip */}
                                {currentMarking.examTip && (
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                            <span className="font-bold text-xs text-amber-800 dark:text-amber-300">KCSE/KPSEA Exam Tip</span>
                                        </div>
                                        <p className="text-xs text-amber-700 dark:text-amber-500/90 leading-relaxed font-medium">{currentMarking.examTip}</p>
                                    </div>
                                )}

                                {/* Confidence Self-Rating */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">How confident do you feel about this topic now?</p>
                                    <div className="flex gap-2 justify-center">
                                        {[1, 2, 3, 4, 5].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setConfidenceLevel(level)}
                                                className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${confidenceLevel === level
                                                    ? level <= 2 ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/20'
                                                        : level === 3 ? 'bg-amber-500 text-white scale-110 shadow-lg shadow-amber-500/20'
                                                            : 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Need more study</span>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Fully confident</span>
                                    </div>
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={handleNextQuestion}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    {currentQuestionIdx < quizQuestions.length - 1 ? (
                                        <>Next Question <ArrowRight className="w-5 h-5" /></>
                                    ) : (
                                        <>View Results <Trophy className="w-5 h-5" /></>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- RESULTS ---
    if (phase === 'RESULTS') {
        const totalMarks = attempts.reduce((s, a) => s + a.marksAvailable, 0);
        const marksObtained = attempts.reduce((s, a) => s + a.marksAwarded, 0);
        const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
        const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);
        const correctCount = attempts.filter(a => a.isCorrect).length;

        // Topic breakdown
        const topicMap: Record<string, { correct: number; total: number; marks: number; available: number }> = {};
        attempts.forEach(a => {
            if (!topicMap[a.topic]) topicMap[a.topic] = { correct: 0, total: 0, marks: 0, available: 0 };
            topicMap[a.topic].total++;
            topicMap[a.topic].marks += a.marksAwarded;
            topicMap[a.topic].available += a.marksAvailable;
            if (a.isCorrect) topicMap[a.topic].correct++;
        });

        const sectionMap: Record<string, { answered: number; marks: number; available: number }> = {};
        (analysis?.questions || []).forEach(question => {
            const section = String(question.section || 'GENERAL').trim().toUpperCase() || 'GENERAL';
            if (!sectionMap[section]) sectionMap[section] = { answered: 0, marks: 0, available: 0 };
            sectionMap[section].available += question.marks || 0;
        });
        attempts.forEach(attempt => {
            const question = (analysis?.questions || []).find(item => String(item.id) === String(attempt.questionId));
            const section = String(question?.section || 'GENERAL').trim().toUpperCase() || 'GENERAL';
            if (!sectionMap[section]) sectionMap[section] = { answered: 0, marks: 0, available: 0 };
            sectionMap[section].answered += 1;
            sectionMap[section].marks += attempt.marksAwarded;
        });

        const weakTopicList = Object.entries(topicMap)
            .filter(([_, data]) => data.available > 0 && (data.marks / data.available) < 0.5)
            .map(([topic]) => topic)
            .slice(0, 4);
        const recoveryMarks = Math.max(0, Math.round(totalMarks * 0.12));

        const gradeLabel = percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' :
            percentage >= 50 ? 'C+' : percentage >= 40 ? 'C' : percentage >= 30 ? 'D+' : 'D';

        return (
            <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans transition-colors duration-300">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm transition-colors">
                    <button onClick={() => setPhase('DASHBOARD')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <h2 className="font-black text-slate-800 dark:text-white">Exam Results</h2>
                    <button onClick={onExit} className="text-xs text-indigo-600 dark:text-indigo-400 font-black hover:underline uppercase tracking-tight">
                        Exit
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto p-5 space-y-5">
                        {/* Score Hero */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`rounded-3xl p-8 text-center text-white relative overflow-hidden shadow-xl ${percentage >= 70 ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
                                percentage >= 50 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                                    'bg-gradient-to-br from-red-500 to-rose-700'
                                }`}
                        >
                            <div className="relative z-10">
                                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-80" />
                                <p className="text-6xl font-black mb-2 tracking-tighter">{percentage}%</p>
                                <p className="text-2xl font-black opacity-90 mb-1">Grade {gradeLabel}</p>
                                <p className="text-sm opacity-80 font-medium">
                                    {marksObtained}/{totalMarks} marks â€¢ {correctCount}/{attempts.length} correct â€¢ {formatTime(timeSpent)}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16" />
                        </motion.div>

                        {/* Topic Breakdown */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors shadow-sm">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Topic Performance</span>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                {Object.entries(topicMap).map(([topic, data]) => {
                                    const pct = data.available > 0 ? Math.round((data.marks / data.available) * 100) : 0;
                                    return (
                                        <div key={topic} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{topic}</span>
                                                <span className={`text-xs font-black ${pct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    {pct}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section Breakdown */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors shadow-sm">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Section Breakdown</span>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                {Object.entries(sectionMap).map(([section, stats]) => {
                                    const pct = stats.available > 0 ? Math.round((stats.marks / stats.available) * 100) : 0;
                                    return (
                                        <div key={section} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">Section {section}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{stats.answered} answered ? {stats.available} available marks</p>
                                                </div>
                                                <span className="text-xs font-black ${pct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}">{pct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                <div className="h-2 rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recovery Revision */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors shadow-sm">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Revision Set ? Recover {recoveryMarks} Marks</span>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Focus on the areas that lost marks first. This is your fastest route back up the grade ladder.</p>
                                <div className="flex flex-wrap gap-2">
                                    {weakTopicList.length > 0 ? weakTopicList.map(topic => (
                                        <span key={topic} className="rounded-full bg-rose-50 dark:bg-rose-950/30 px-3 py-1 text-[10px] font-black text-rose-700 dark:text-rose-300">{topic}</span>
                                    )) : (
                                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">No weak topics detected</span>
                                    )}
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                    Retry the questions you missed, then do one short drill per weak topic before another timed run.
                                </div>
                            </div>
                        </div>

                        {/* Question-by-Question Review */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors shadow-sm">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Answer Review</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {attempts.map((a, idx) => (
                                    <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-black text-xs text-slate-600 dark:text-slate-400">Q{a.questionNumber}</span>
                                            <div className="flex items-center gap-1">
                                                {a.isCorrect ? (
                                                    <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                                                )}
                                                <span className={`text-xs font-black ${a.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{a.marksAwarded}/{a.marksAvailable}</span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 line-clamp-1 font-medium">{a.questionText}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase">YOUR ANSWER</p>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2 font-medium">{a.learnerAnswer}</p>
                                            </div>
                                            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg p-2.5">
                                                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 mb-1 uppercase">MODEL ANSWER</p>
                                                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 line-clamp-2 font-medium">{a.modelAnswer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 pb-8">
                            <button
                                onClick={() => {
                                    setAttempts([]);
                                    void startQuiz(practiceMode);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Retry Paper
                            </button>
                            <button
                                onClick={() => setPhase('DASHBOARD')}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback
    return (
        <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
            <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400 font-black">Something went wrong</p>
                <button onClick={onExit} className="mt-4 text-indigo-600 dark:text-indigo-400 font-black hover:underline text-sm uppercase tracking-tight">Go back</button>
            </div>
        </div>
    );
};
