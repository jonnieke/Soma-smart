import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Lightbulb, ChevronRight, Bell, Clock, Library, Brain, LayoutDashboard, CheckCircle2 } from 'lucide-react';
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
    onNavigate: (tab: 'STUDENTS' | 'MARKING' | 'LIBRARY' | 'CREATION_HUB' | 'DARASA_MODE' | 'CONVERT' | 'QUIZ' | 'SCHEMES' | 'LESSON_PLAN_GENERATOR') => void;
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
}) => {
    const [interventionShareStatus, setInterventionShareStatus] = React.useState<'idle' | 'copied' | 'shared'>('idle');

    const totalCreations = teacherHistory.length;
    const noteCount = teacherHistory.filter(item => item.type === 'NOTE').length;
    const quizCount = teacherHistory.filter(item => item.type === 'QUIZ').length;
    const hasCreatedResources = totalCreations > 0;
    const primaryCtaLabel = hasCreatedResources ? 'Open Content Tools' : 'Create Your First Note';
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

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Quick Fixes</p>
                        <h3 className="text-lg font-black text-slate-900">Jump straight to the teacher task you need now</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button onClick={() => onNavigate('CONVERT')} className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50 p-4 transition-colors">
                        <Clock className="w-5 h-5 text-emerald-600 mb-3" />
                        <p className="text-sm font-black text-slate-900">I need a lesson fast</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Turn a topic, file, or voice note into class notes.</p>
                    </button>
                    <button onClick={() => onNavigate('LESSON_PLAN_GENERATOR')} className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 p-4 transition-colors">
                        <Brain className="w-5 h-5 text-indigo-600 mb-3" />
                        <p className="text-sm font-black text-slate-900">I need a lesson plan</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Turn a topic into a structured lesson flow.</p>
                    </button>
                    <button onClick={() => onNavigate('SCHEMES')} className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 p-4 transition-colors">
                        <Bell className="w-5 h-5 text-blue-600 mb-3" />
                        <p className="text-sm font-black text-slate-900">I need scheme of work</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Map topics across the term without starting from scratch.</p>
                    </button>
                    <button onClick={() => onNavigate('DARASA_MODE')} className="text-left rounded-xl border border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50 p-4 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-amber-600 mb-3" />
                        <p className="text-sm font-black text-slate-900">I need live teaching mode</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Teach from a clean board with guided class delivery.</p>
                    </button>
                </div>
            </div>
                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">Intervention</p>
                    <h3 className="text-sm font-black text-slate-900 truncate">{interventionPlan.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">{interventionPlan.body}</p>
                </div>
                <button
                    type="button"
                    onClick={() => onNavigate(interventionPlan.actions[0].tab)}
                    className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors"
                >
                    {interventionPlan.actions[0].label}
                </button>
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
                            onClick={() => onNavigate('STUDENTS')}
                            className={`w-full border-2 px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${isFirstRun
                                ? 'bg-emerald-950/40 text-emerald-100 border-emerald-700/60 hover:bg-emerald-700 hover:text-white'
                                : 'bg-emerald-900 text-emerald-100 border-emerald-700 hover:bg-emerald-700 hover:text-white'
                                }`}
                        >
                            <Library className="w-5 h-5" />
                            Open Classroom
                        </button>
                    </div>
                </div>


                {/* Metrics Cards */}
                <div className="flex flex-col sm:flex-row gap-4 col-span-1 lg:col-span-3">
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-all">
                        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border-2 border-slate-200">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library</p>
                            <p className="text-2xl font-black text-slate-900">{teacherHistory.length} <span className="text-xs text-slate-400 font-bold">Items</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Library className="w-5 h-5 text-emerald-600" /> Recent Creations
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Pick up where you left off.</p>
                    </div>
                    <button onClick={() => onNavigate('LIBRARY')} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1">
                        View Library <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2">
                    {teacherHistory.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm font-bold bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            No materials generated yet. Start with Create Notes.
                        </div>
                    ) : (
                        teacherHistory.slice(0, 2).map((item, i) => (
                            <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 transition-colors text-left" onClick={() => onHistoryItemClick(item)}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.type === 'NOTE' ? 'bg-white border-slate-200 text-slate-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                    {item.type === 'NOTE' ? <FileText className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 text-sm truncate">{item.title}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{item.subject} ? {item.date}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
