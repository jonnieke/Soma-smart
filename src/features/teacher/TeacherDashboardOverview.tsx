import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Lightbulb, ChevronRight, Bell, DollarSign, Clock, Library, Brain, LayoutDashboard, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { TeacherProfile, TutoringRequest, TeacherActivity, TeacherWallet } from '../../types';
import { getTeacherCtaVariant } from '../../utils/abExperiments';

interface TeacherDashboardOverviewProps {
    teacherProfile: TeacherProfile | null;
    selectedSubject: string;
    selectedClass: string;
    availableClasses: string[];
    availableSubjects: string[];
    activeTutoringRequests: TutoringRequest[];
    teacherHistory: TeacherActivity[];
    teacherWallet: TeacherWallet | null;
    onNavigate: (tab: 'STUDENTS' | 'MARKING' | 'LIBRARY' | 'CREATION_HUB' | 'DARASA_MODE' | 'CONVERT' | 'QUIZ') => void;
    onClassChange: (value: string) => void;
    onSubjectChange: (value: string) => void;
    onRequestClick: (request: TutoringRequest) => void;
    onHistoryItemClick: (item: TeacherActivity) => void;
    onTrackEvent?: (eventName: string, params?: Record<string, unknown>) => void;
    workflowStepSignal?: { step: 'GENERATE_ASSESSMENT' | 'PUBLISH_STREAM'; message: string; at: number } | null;
    workflowProgress?: { generatedAssessment: boolean; publishedStream: boolean };
    onResetWorkflowProgress?: () => void;
    showQuickStart?: boolean;
    onDismissQuickStart?: () => void;
}

export const TeacherDashboardOverview: React.FC<TeacherDashboardOverviewProps> = ({
    teacherProfile,
    selectedSubject,
    selectedClass,
    availableClasses,
    availableSubjects,
    activeTutoringRequests,
    teacherHistory,
    teacherWallet,
    onNavigate,
    onClassChange,
    onSubjectChange,
    onRequestClick,
    onHistoryItemClick,
    onTrackEvent,
    workflowStepSignal,
    workflowProgress,
    onResetWorkflowProgress,
    showQuickStart,
    onDismissQuickStart
}) => {
    const contextStepRef = React.useRef<HTMLDivElement | null>(null);
    const [highlightContextStep, setHighlightContextStep] = React.useState(false);
    const [interventionShareStatus, setInterventionShareStatus] = React.useState<'idle' | 'copied' | 'shared'>('idle');

    const pendingRequests = activeTutoringRequests.filter(r => r.status === 'PENDING');
    const totalCreations = teacherHistory.length;
    const noteCount = teacherHistory.filter(item => item.type === 'NOTE').length;
    const quizCount = teacherHistory.filter(item => item.type === 'QUIZ').length;
    const hasCreatedResources = totalCreations > 0;
    const primaryCtaLabel = hasCreatedResources ? 'Open Content Tools' : 'Create Your First Note';
    const todayEarnings = teacherWallet?.transactions
        .filter(t => new Date(t.date).toLocaleDateString() === new Date().toLocaleDateString())
        .reduce((acc, t) => acc + (t.type === 'EARNING' ? t.amount : 0), 0) || 0;
    const normalizedClass = String(selectedClass || '').trim().toLowerCase();
    const normalizedSubject = String(selectedSubject || '').trim().toLowerCase();
    const hasPlaceholderContext =
        normalizedClass === 'selected department' ||
        normalizedClass === 'department' ||
        normalizedClass === 'classe' ||
        normalizedSubject === 'selected department' ||
        normalizedSubject === 'department' ||
        normalizedSubject === 'subject';
    const hasTeachingContext = Boolean(selectedClass?.trim()) && Boolean(selectedSubject?.trim()) && !hasPlaceholderContext;
    const hasGeneratedAssessment = workflowProgress?.generatedAssessment ?? (quizCount > 0);
    const hasAssignedToStream = workflowProgress?.publishedStream ?? false;
    const completedResponses = activeTutoringRequests.filter(r => r.status === 'COMPLETED').length;
    const completedSteps = [hasTeachingContext, hasGeneratedAssessment, hasAssignedToStream].filter(Boolean).length;
    const teacherCtaVariant = React.useMemo(() => getTeacherCtaVariant(), []);
    const isFirstRun = completedSteps < 3 && !hasCreatedResources;
    const nextStepLabel = !hasTeachingContext
        ? 'Resume: Step 1 (Set Class)'
        : !hasGeneratedAssessment
            ? 'Resume: Step 2 (Create Assessment)'
            : !hasAssignedToStream
                ? 'Resume: Step 3 (Assign to Stream)'
                : 'Workflow Complete';
    const interventionPlan = React.useMemo(() => {
        const currentContextHistory = teacherHistory.filter(item => {
            const sameSubject = !hasTeachingContext || String(item.subject || '').toLowerCase() === normalizedSubject;
            const sameClass = !hasTeachingContext || String(item.className || '').toLowerCase() === normalizedClass;
            return sameSubject && sameClass;
        });
        const recentQuiz = currentContextHistory.filter(item => item.type === 'QUIZ')[0];
        const recentNote = currentContextHistory.filter(item => item.type === 'NOTE')[0];
        const openQuestions = activeTutoringRequests
            .filter(request => request.status === 'PENDING' || request.status === 'ACCEPTED')
            .filter(request => !hasTeachingContext || String(request.subject || '').toLowerCase() === normalizedSubject)
            .slice(0, 3);

        if (!hasTeachingContext) {
            return {
                title: 'Set class context first',
                body: 'Choose class and subject so Soma can connect content, stream, marking, and follow-up.',
                actions: [
                    { label: 'Pick Class', helper: 'Start the workflow', tab: 'DASHBOARD' as const },
                    { label: 'Create Notes', helper: 'Prepare lesson material', tab: 'CONVERT' as const },
                    { label: 'Create Quiz', helper: 'Measure understanding', tab: 'QUIZ' as const }
                ],
                evidence: ['No class context selected yet.']
            };
        }

        return {
            title: `Tomorrow's ${selectedSubject} intervention`,
            body: openQuestions.length > 0
                ? `${openQuestions.length} learner question${openQuestions.length === 1 ? '' : 's'} need follow-up. Start from real confusion, then assign a short check.`
                : recentQuiz
                    ? 'You have an assessment ready. Use marking feedback to reteach the weakest idea, then assign a repair task.'
                    : recentNote
                        ? 'You have notes ready. Convert them into a short quiz so you can see who understood.'
                        : 'Create one lesson note and one short quiz so the class has a complete learning loop.',
            actions: [
                { label: openQuestions.length > 0 ? 'Open Follow-Up' : 'Post To Stream', helper: 'Give learners the next task', tab: 'STUDENTS' as const },
                { label: recentQuiz ? 'Mark Work' : 'Create Quiz', helper: recentQuiz ? 'Find weak areas' : 'Check understanding', tab: recentQuiz ? 'MARKING' as const : 'QUIZ' as const },
                { label: recentNote ? 'Improve Notes' : 'Create Notes', helper: 'Clarify the lesson', tab: 'CONVERT' as const }
            ],
            evidence: [
                `${currentContextHistory.length} resource${currentContextHistory.length === 1 ? '' : 's'} in this context`,
                `${openQuestions.length} open learner question${openQuestions.length === 1 ? '' : 's'}`,
                completedResponses > 0 ? `${completedResponses} completed response${completedResponses === 1 ? '' : 's'}` : 'No completed learner responses yet'
            ]
        };
    }, [activeTutoringRequests, completedResponses, hasTeachingContext, normalizedClass, normalizedSubject, selectedSubject, teacherHistory]);
    const shareInterventionPlan = async () => {
        const message = [
            'Soma Smart Teacher Intervention Plan',
            `Class: ${hasTeachingContext ? selectedClass : 'Not selected'}`,
            `Subject: ${hasTeachingContext ? selectedSubject : 'Not selected'}`,
            `Focus: ${interventionPlan.title}`,
            interventionPlan.body,
            '',
            'Actions:',
            ...interventionPlan.actions.map((action, index) => `${index + 1}. ${action.label} - ${action.helper}`),
            '',
            'Evidence:',
            ...interventionPlan.evidence.map(item => `- ${item}`),
            'https://somaai.co.ke'
        ].join('\n');

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Soma Smart teacher intervention plan',
                    text: message
                });
                setInterventionShareStatus('shared');
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(message);
                setInterventionShareStatus('copied');
            }
            onTrackEvent?.('teacher_intervention_plan_shared', {
                method: navigator.share ? 'native_share' : 'clipboard',
                has_context: hasTeachingContext,
                class: selectedClass,
                subject: selectedSubject
            });
        } catch (_) {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(message);
                setInterventionShareStatus('copied');
            }
        }
    };
    const handleResumeStep = () => {
        if (!hasTeachingContext) {
            contextStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightContextStep(true);
            window.setTimeout(() => setHighlightContextStep(false), 1800);
            return;
        }
        if (!hasGeneratedAssessment) {
            onNavigate('CREATION_HUB');
            return;
        }
        if (!hasAssignedToStream) {
            onNavigate('STUDENTS');
            return;
        }
        onNavigate('MARKING');
    };

    return (
        <div className="space-y-8">
            {showQuickStart && (
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-1">Quick Start</p>
                            <h3 className="text-lg font-black">Run the 3-step teaching flow</h3>
                            <p className="text-sm font-semibold text-slate-300 mt-1">Create assessment, publish to stream, then mark learner work.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onDismissQuickStart?.()}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                            aria-label="Dismiss quick start"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                        <button onClick={() => onNavigate('CONVERT')} className="min-h-[44px] rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 text-xs font-black uppercase tracking-wider text-white">1. Create Notes</button>
                        <button onClick={() => onNavigate('STUDENTS')} className="min-h-[44px] rounded-lg bg-slate-700 hover:bg-slate-600 px-3 text-xs font-black uppercase tracking-wider text-white">2. Assign</button>
                        <button onClick={() => onNavigate('MARKING')} className="min-h-[44px] rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 text-xs font-black uppercase tracking-wider text-white">3. Mark</button>
                    </div>
                    <button
                        onClick={handleResumeStep}
                        disabled={!hasTeachingContext && completedSteps < 3}
                        className={`mt-3 w-full min-h-[42px] rounded-lg border text-xs font-black uppercase tracking-wider ${!hasTeachingContext && completedSteps < 3
                            ? 'border-slate-700 bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'border-emerald-300 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
                            }`}
                    >
                        {nextStepLabel}
                    </button>
                </div>
            )}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Teacher Pain Points</p>
                        <h3 className="text-lg font-black text-slate-900">Start with the problem you need solved today</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button onClick={() => onNavigate('CONVERT')} className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50 p-4 transition-colors">
                        <Clock className="w-5 h-5 text-emerald-600 mb-3" />
                        <p className="text-sm font-black text-slate-900">I need a lesson fast</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Turn a topic, file, or voice note into class notes.</p>
                    </button>
                    <button onClick={() => onNavigate('QUIZ')} className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 p-4 transition-colors">
                        <Brain className="w-5 h-5 text-indigo-600 mb-3" />
                        <p className="text-sm font-black text-slate-900">I need to test learners</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Generate quiz or exam items with marking logic.</p>
                    </button>
                    <button onClick={() => onNavigate('STUDENTS')} className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 p-4 transition-colors">
                        <Bell className="w-5 h-5 text-blue-600 mb-3" />
                        <p className="text-sm font-black text-slate-900">I need follow-up</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Publish work to stream and keep learners moving.</p>
                    </button>
                    <button onClick={() => onNavigate('MARKING')} className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50 p-4 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-amber-600 mb-3" />
                        <p className="text-sm font-black text-slate-900">I need marking support</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Mark responses and see where the class is weak.</p>
                    </button>
                </div>
            </div>
            <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-1">Teacher Impact Loop</p>
                        <h3 className="text-lg font-black">Use AI to teach better, not to replace your judgement</h3>
                        <p className="text-sm font-semibold text-slate-300 mt-1">Soma should save planning time, reveal weak areas, and give you the next intervention.</p>
                    </div>
                    <button
                        onClick={handleResumeStep}
                        className="min-h-[42px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 text-xs font-black uppercase tracking-wider transition-colors"
                    >
                        Continue Workflow
                    </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                    {[
                        { label: 'Plan', body: 'Create notes or scheme' },
                        { label: 'Teach', body: 'Use Darasa/blackboard' },
                        { label: 'Assign', body: 'Post to stream' },
                        { label: 'Mark', body: 'Review learner work' },
                        { label: 'Intervene', body: 'Fix weak spots' }
                    ].map((step, i) => (
                        <div key={step.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-[10px] font-black mb-2">{i + 1}</div>
                            <p className="text-xs font-black text-white">{step.label}</p>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5 leading-snug">{step.body}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">Intervention Planner</p>
                        <h3 className="text-lg font-black text-slate-900">{interventionPlan.title}</h3>
                        <p className="text-sm font-semibold text-slate-500 mt-1 max-w-2xl">{interventionPlan.body}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2 min-w-[150px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Context</p>
                        <p className="text-xs font-bold text-slate-700 mt-1">{hasTeachingContext ? `${selectedClass} / ${selectedSubject}` : 'Not set'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {interventionPlan.actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => {
                                if (action.tab === 'DASHBOARD') {
                                    contextStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setHighlightContextStep(true);
                                    window.setTimeout(() => setHighlightContextStep(false), 1800);
                                    return;
                                }
                                onNavigate(action.tab);
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 p-4 text-left transition-colors"
                        >
                            <p className="text-sm font-black text-slate-900">{action.label}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1">{action.helper}</p>
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                    {interventionPlan.evidence.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                            {item}
                        </span>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={shareInterventionPlan}
                    className="mt-4 w-full md:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors"
                >
                    {interventionShareStatus === 'shared'
                        ? 'Intervention Shared'
                        : interventionShareStatus === 'copied'
                            ? 'Intervention Copied'
                            : 'Share Intervention Plan'}
                </button>
            </div>
            <div className="bg-white rounded-[2rem] p-6 border-2 border-emerald-200 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Start Here</p>
                        <h3 className="text-xl font-black text-slate-900">
                            {teacherCtaVariant === 'A' ? 'First Teaching Workflow' : 'Run Your First 3-Step Class Flow'}
                        </h3>
                        <p className="text-sm font-semibold text-slate-500 mt-1">
                            {teacherCtaVariant === 'A'
                                ? 'Choose class, generate assessment, then assign to class stream.'
                                : 'Set class context, generate one assessment, and publish to stream in minutes.'}
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Progress</p>
                        <p className="text-lg font-black text-emerald-800">{completedSteps}/3 completed</p>
                    </div>
                </div>
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={() => onResetWorkflowProgress?.()}
                        className="text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700"
                    >
                        Reset Checklist
                    </button>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Reliability Status</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className={`rounded-lg border px-3 py-2 text-xs font-bold flex items-center gap-2 ${hasCreatedResources ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            {hasCreatedResources ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            Content Generated
                        </div>
                        <div className={`rounded-lg border px-3 py-2 text-xs font-bold flex items-center gap-2 ${hasAssignedToStream ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            {hasAssignedToStream ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            Assignment Sent
                        </div>
                        <div className={`rounded-lg border px-3 py-2 text-xs font-bold flex items-center gap-2 ${completedResponses > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            {completedResponses > 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            Submissions Received
                        </div>
                    </div>
                </div>
                {workflowStepSignal && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-1">Step Completed</p>
                        <p className="text-sm font-bold text-emerald-800">{workflowStepSignal.message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                    <div
                        ref={contextStepRef}
                        className={`rounded-xl border p-4 transition-all ${highlightContextStep
                            ? 'border-emerald-400 ring-4 ring-emerald-100 bg-emerald-50/40'
                            : 'border-slate-200'
                            }`}
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">1. Choose Class & Subject</p>
                        <div className="space-y-2">
                            <select
                                value={selectedClass}
                                onChange={(e) => onClassChange(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                            >
                                <option value="">{(availableClasses || []).length === 0 ? 'No classes yet' : 'Select class'}</option>
                                {(availableClasses || []).map((cls) => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                            <select
                                value={selectedSubject}
                                onChange={(e) => onSubjectChange(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                            >
                                <option value="">{(availableSubjects || []).length === 0 ? 'No subjects yet' : 'Select subject'}</option>
                                {(availableSubjects || []).map((subj) => (
                                    <option key={subj} value={subj}>{subj}</option>
                                ))}
                            </select>
                            {!hasTeachingContext && (
                                <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                                    Choose class and subject first to unlock reliable publishing and marking.
                                </p>
                            )}
                            {highlightContextStep && !hasTeachingContext && (
                                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                                    Start here: pick class and subject, then continue with Step 2.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">2. Generate Assessment</p>
                        <p className="text-xs font-semibold text-slate-500 mb-3">Use Smart Exam Builder to generate your first quiz.</p>
                        <button
                            onClick={() => {
                                if (!hasTeachingContext) return;
                                onTrackEvent?.('teacher_cta_clicked', { variant: teacherCtaVariant, cta: 'generate_assessment' });
                                onNavigate('QUIZ');
                            }}
                            disabled={!hasTeachingContext}
                            className={`mt-auto rounded-lg text-xs font-black px-3 py-2 ${hasTeachingContext
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {teacherCtaVariant === 'A' ? 'Open Quiz Generator' : 'Generate First Assessment'}
                        </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">3. Assign To Stream</p>
                        <p className="text-xs font-semibold text-slate-500 mb-3">Publish quiz to classroom stream and share to WhatsApp.</p>
                        <button
                            onClick={() => {
                                if (!hasTeachingContext) return;
                                onTrackEvent?.('teacher_cta_clicked', { variant: teacherCtaVariant, cta: 'assign_to_stream' });
                                onNavigate('STUDENTS');
                            }}
                            disabled={!hasTeachingContext}
                            className={`mt-auto rounded-lg text-xs font-black px-3 py-2 ${hasTeachingContext
                                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {teacherCtaVariant === 'A' ? 'Open Classroom' : 'Publish To Stream'}
                        </button>
                    </div>
                </div>
                {isFirstRun && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Choose Your Goal</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => onNavigate('QUIZ')}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-3 text-left transition-colors"
                            >
                                <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">Set Exam</p>
                                <p className="text-xs font-semibold text-emerald-700 mt-1">Generate a quiz in minutes.</p>
                            </button>
                            <button
                                onClick={() => onNavigate('STUDENTS')}
                                className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-3 text-left transition-colors"
                            >
                                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Share Update</p>
                                <p className="text-xs font-semibold text-slate-600 mt-1">Post to class stream + WhatsApp.</p>
                            </button>
                            <button
                                onClick={() => onNavigate('MARKING')}
                                className="rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-3 text-left transition-colors"
                            >
                                <p className="text-xs font-black text-blue-800 uppercase tracking-wider">Mark Work</p>
                                <p className="text-xs font-semibold text-blue-700 mt-1">Grade and track performance.</p>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Smart Priority Strip (Hero Section) */}
                <div className="lg:col-span-2 bg-emerald-800 rounded-[2rem] p-8 shadow-md border-2 border-emerald-900 flex flex-col md:flex-row justify-between items-center relative overflow-hidden gap-8">
                    
                    {/* LEFT: Today's Teaching Focus */}
                    <div className="relative z-10 flex-1 w-full text-emerald-50">
                        <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-2 text-white">
                            <LayoutDashboard className="w-6 h-6 text-emerald-300" />
                            Welcome back, {teacherProfile?.name?.split(' ')[0] || 'Teacher'}
                        </h2>

                        <div className="space-y-4 font-bold text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                                    <FileText className="w-4 h-4 text-emerald-100" />
                                </div>
                                <p className="text-emerald-100">
                                    <span className="text-white font-black text-base">{noteCount}</span> note{noteCount === 1 ? '' : 's'} created in {selectedSubject}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                                    <Brain className="w-4 h-4 text-emerald-100" />
                                </div>
                                <p className="text-emerald-100">
                                    <span className="text-white font-black text-base">{quizCount}</span> assessment{quizCount === 1 ? '' : 's'} generated for {selectedClass}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                                    <Lightbulb className="w-4 h-4 text-emerald-100" />
                                </div>
                                <p className="text-emerald-100">
                                    {hasCreatedResources ? (
                                        <>Your library now has <span className="text-white font-black text-base">{totalCreations}</span> total resource{totalCreations === 1 ? '' : 's'}</>
                                    ) : (
                                        <>Start with one resource to populate your class library automatically.</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Primary CTA Panel */}
                    <div className="relative z-10 w-full md:w-auto flex flex-col gap-3 min-w-[260px]">
                        <button
                            onClick={() => onNavigate('CONVERT')}
                            className="w-full bg-white text-emerald-900 px-8 py-4 rounded-2xl font-black text-lg shadow-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 group border-2 border-emerald-900"
                        >
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                            {isFirstRun ? 'Create Notes' : primaryCtaLabel}
                            <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                        </button>
                        <button
                            onClick={() => onNavigate('QUIZ')}
                            className="w-full border-2 px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-white/90 text-emerald-900 border-emerald-200 hover:bg-white"
                        >
                            <Brain className="w-5 h-5" />
                            Create Quiz
                        </button>
                        <button
                            onClick={() => onNavigate('STUDENTS')}
                            className={`w-full border-2 px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${isFirstRun
                                ? 'bg-emerald-950/40 text-emerald-100 border-emerald-700/60 hover:bg-emerald-700 hover:text-white'
                                : 'bg-emerald-900 text-emerald-100 border-emerald-700 hover:bg-emerald-700 hover:text-white'
                                }`}
                        >
                            <Library className="w-5 h-5" />
                            {isFirstRun ? 'Then Open Classroom' : 'Open Classroom'}
                        </button>
                    </div>
                </div>

                {!isFirstRun && (
                    <div
                        onClick={() => {
                            if (pendingRequests.length > 0) {
                                onRequestClick(pendingRequests[0]);
                            }
                        }}
                        className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border-2 border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                                <div className="relative">
                                    <Bell className="w-7 h-7" />
                                    {pendingRequests.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 border-2 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                Action Required
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 mb-1">{pendingRequests.length}</h3>
                            <p className="text-slate-500 font-bold text-sm">Pending Student Requests</p>
                        </div>
                    </div>
                )}

                {/* Metrics Cards */}
                <div className={`flex flex-col sm:flex-row gap-4 col-span-1 ${isFirstRun ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-all">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border-2 border-emerald-100">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings Today</p>
                            <p className="text-2xl font-black text-slate-900">KES {todayEarnings}</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-all">
                        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border-2 border-slate-200">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library</p>
                            <p className="text-2xl font-black text-slate-900">{teacherHistory.length} <span className="text-xs text-slate-400 font-bold">Items</span></p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-all">
                        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border-2 border-slate-200">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                            <p className="text-2xl font-black text-slate-900">{pendingRequests.length} <span className="text-xs text-slate-400 font-bold">Requests</span></p>
                        </div>
                        <button
                            onClick={() => {
                                if (pendingRequests.length > 0) onRequestClick(pendingRequests[0]);
                            }}
                            className="ml-auto p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generated Library Preview */}
                <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 shadow-sm border-2 border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Library className="w-5 h-5 text-emerald-600" /> Recent Creations
                        </h3>
                        <button onClick={() => onNavigate('LIBRARY')} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {teacherHistory.length === 0 ? (
                            <div className="col-span-full p-8 text-center text-slate-500 text-sm font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                                No materials generated yet. Head to the Creation Hub!
                            </div>
                        ) : (
                            teacherHistory.slice(0, 4).map((item, i) => (
                                <div key={i} className="flex flex-col p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group" onClick={() => onHistoryItemClick(item)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${item.type === 'NOTE' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                            {item.type === 'NOTE' ? <FileText className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{item.date}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">{item.title}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-auto pt-4">{item.subject}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
