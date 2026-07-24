import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Library,
  Sparkles,
  Target,
  Users,
  BarChart2,
  Clock,
  Layers,
  GraduationCap,
  Zap,
} from 'lucide-react';
import { TeacherProfile, TutoringRequest, TeacherActivity, TeacherWallet } from '../../types';
import { fetchTeacherWorkflowAnalytics, type TeacherWorkflowAnalyticsSummary } from '../../services/analyticsEventService';
import { SyllabusTracker } from './SyllabusTracker';
import { TeacherDashboardTab } from './teacherNavigation';

interface TeacherDashboardOverviewProps {
  teacherProfile: TeacherProfile | null;
  selectedSubject: string;
  teacherId?: string;
  selectedClass: string;
  availableClasses: string[];
  availableSubjects: string[];
  activeTutoringRequests: TutoringRequest[];
  teacherHistory: TeacherActivity[];
  teacherWallet: TeacherWallet | null;
  onNavigate: (tab: TeacherDashboardTab) => void;
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

const n = (v: string) => v.trim().toLowerCase();

export const TeacherDashboardOverview: React.FC<TeacherDashboardOverviewProps> = ({
  teacherProfile,
  teacherId,
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
  onDismissQuickStart,
}) => {
  const navigate = useNavigate();
  const [activeOverviewTab, setActiveOverviewTab] = useState<'ACTIONS' | 'SYLLABUS' | 'ANALYTICS'>('ACTIONS');
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [workflowAnalytics, setWorkflowAnalytics] = useState<TeacherWorkflowAnalyticsSummary | null>(null);
  const [workflowAnalyticsLoading, setWorkflowAnalyticsLoading] = useState(false);

  const c = n(String(selectedClass || ''));
  const s = n(String(selectedSubject || ''));
  const isPlaceholder =
    ['selected department', 'department', 'classe'].includes(c) ||
    ['selected department', 'department', 'subject'].includes(s);
  const hasContext = Boolean(selectedClass?.trim()) && Boolean(selectedSubject?.trim()) && !isPlaceholder;

  const contextHistory = React.useMemo(
    () => (hasContext ? teacherHistory.filter((item) => n(String(item.subject || '')) === s && n(String(item.className || '')) === c) : teacherHistory),
    [c, hasContext, s, teacherHistory]
  );
  const noteCount = contextHistory.filter((i) => i.type === 'NOTE').length;
  const quizCount = contextHistory.filter((i) => i.type === 'QUIZ').length;
  const completedResponses = activeTutoringRequests.filter((r) => r.status === 'COMPLETED').length;
  const pendingResponses = activeTutoringRequests.filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED').length;
  const hasAssessment = workflowProgress?.generatedAssessment ?? quizCount > 0;
  const hasStream = workflowProgress?.publishedStream ?? false;
  const hasMarked = completedResponses > 0;
  const loopSteps = [hasContext, noteCount > 0, hasAssessment, hasStream, hasMarked].filter(Boolean).length;
  const loopPercent = Math.round((loopSteps / 5) * 100);
  const walletBalance = typeof teacherWallet?.balance === 'number' ? teacherWallet.balance : null;
  const recent = contextHistory.slice(0, 4);
  const requests = activeTutoringRequests.slice(0, 3);

  React.useEffect(() => {
    let cancelled = false;
    const loadAnalytics = async () => {
      if (!teacherId) {
        setWorkflowAnalytics(null);
        return;
      }
      setWorkflowAnalyticsLoading(true);
      try {
        const summary = await fetchTeacherWorkflowAnalytics(teacherId);
        if (!cancelled) setWorkflowAnalytics(summary);
      } finally {
        if (!cancelled) setWorkflowAnalyticsLoading(false);
      }
    };
    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  const nav = (tab?: TeacherDashboardTab, route?: string) => {
    if (route) {
      navigate(route);
      return;
    }
    if (tab) {
      onTrackEvent?.('teacher_dashboard_quick_action', { tab });
      onNavigate(tab);
    }
  };

  const sharePlan = async () => {
    const text = [
      'Somo Smart Teacher Intervention Plan',
      `Class: ${hasContext ? selectedClass : 'Not selected'}`,
      `Subject: ${hasContext ? selectedSubject : 'Not selected'}`,
      `Focus: ${intervention.title}`,
      intervention.body,
      '',
      'Actions:',
      ...intervention.actions.map((a, i) => `${i + 1}. ${a.label} - ${a.helper}`),
      '',
      'Evidence:',
      ...intervention.evidence.map((x) => `- ${x}`),
      'https://somaai.co.ke',
    ].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Somo Smart teacher intervention plan', text });
        setShareState('shared');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setShareState('copied');
      }
    } catch {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setShareState('copied');
      }
    }
  };

  const primaryHubCards = [
    {
      title: 'Exam Paper Generator',
      subtitle: 'Soma Paper Studio',
      desc: 'Create CBC, KCSE & KPSEA exam papers with instant KNEC marking schemes.',
      route: '/teacher/paper-studio',
      badge: 'Popular',
      badgeBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      icon: <FileText className="w-6 h-6 text-indigo-600" />,
      btnText: 'Open Paper Studio',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      title: 'CBC Schemes & Lesson Maker',
      subtitle: 'Lesson Creation Studio',
      desc: 'Generate complete KICD-compliant schemes of work and structured lesson plans.',
      tab: 'CREATION_HUB' as TeacherDashboardTab,
      badge: 'CBC / CBE',
      badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
      btnText: 'Launch Lesson Maker',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      title: 'Darasa Mode & Marking',
      subtitle: 'Classroom & Assessment',
      desc: 'Live board teaching mode, voice recaps, and automated assignment marking.',
      tab: 'DARASA_MODE' as TeacherDashboardTab,
      badge: 'Interactive',
      badgeBg: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: <CheckCircle2 className="w-6 h-6 text-purple-600" />,
      btnText: 'Open Darasa Mode',
      btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      title: 'Syllabus Tracker',
      subtitle: 'Curriculum Progress',
      desc: 'Track KICD topic progress, term milestones, and student mastery.',
      tab: 'SYLLABUS_TRACKER' as TeacherDashboardTab,
      badge: 'KICD Aligned',
      badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: <BookOpen className="w-6 h-6 text-amber-600" />,
      btnText: 'View Syllabus',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  ];

  const secondaryQuickTools = [
    { title: 'Lesson Notes', tab: 'CONVERT' as TeacherDashboardTab, icon: <FileText className="w-4 h-4 text-emerald-600" /> },
    { title: 'Lesson Plan', tab: 'LESSON_PLAN_GENERATOR' as TeacherDashboardTab, icon: <BookOpen className="w-4 h-4 text-indigo-600" /> },
    { title: 'Scheme of Work', tab: 'SCHEMES' as TeacherDashboardTab, icon: <ClipboardList className="w-4 h-4 text-amber-600" /> },
    { title: 'Homework Draft', tab: 'HOMEWORK' as TeacherDashboardTab, icon: <Target className="w-4 h-4 text-rose-600" /> },
    { title: 'Auto-Marking', tab: 'MARKING' as TeacherDashboardTab, icon: <CheckCircle2 className="w-4 h-4 text-purple-600" /> },
  ];

  const teachingLoop = [
    { title: 'Class & subject selected', done: hasContext, hint: hasContext ? `${selectedClass} / ${selectedSubject}` : 'Choose class & subject' },
    { title: 'Lesson notes created', done: noteCount > 0, hint: noteCount > 0 ? `${noteCount} note${noteCount === 1 ? '' : 's'}` : 'Create notes' },
    { title: 'Assessment ready', done: hasAssessment, hint: hasAssessment ? `${quizCount} quiz${quizCount === 1 ? '' : 'zes'}` : 'Generate quiz' },
    { title: 'Posted to stream', done: hasStream, hint: hasStream ? 'Published' : 'Share to class' },
    { title: 'Marked & analyzed', done: hasMarked, hint: hasMarked ? `${completedResponses} responses` : 'Mark work' },
  ];

  const intervention = React.useMemo(() => {
    const q = requests;
    const rq = contextHistory.find((i) => i.type === 'QUIZ');
    const rn = contextHistory.find((i) => i.type === 'NOTE');
    if (!hasContext) {
      return {
        title: 'Select Class & Subject to Unlock Recommendations',
        body: 'Choose your active class and subject above to connect syllabus tracking, automated marking, and personalized recommendations.',
        actions: [
          { label: 'Create Notes', helper: 'Start lesson flow', tab: 'CONVERT' as TeacherDashboardTab },
          { label: 'Create Quiz', helper: 'Check understanding', tab: 'QUIZ' as TeacherDashboardTab },
          { label: 'Generate Scheme', helper: 'Plan term', tab: 'SCHEMES' as TeacherDashboardTab },
        ],
        evidence: ['Classroom context not set'],
      };
    }
    return {
      title: `Next Move for ${selectedSubject}`,
      body:
        q.length > 0
          ? `${q.length} learner request${q.length === 1 ? '' : 's'} pending follow-up. Resolve student questions first.`
          : rq
          ? 'Assessment ready. Review automated marking feedback and assign targeted intervention tasks.'
          : rn
          ? 'Lesson notes generated. Convert them into a quick quiz to check student understanding.'
          : 'Create a lesson note and quiz to complete the active learning cycle.',
      actions: [
        { label: q.length > 0 ? 'Open Requests' : 'Classroom Stream', helper: 'Assign next task', tab: 'STUDENTS' as TeacherDashboardTab },
        { label: rq ? 'Marking Manager' : 'Create Quiz', helper: rq ? 'Find weak areas' : 'Check mastery', tab: rq ? 'MARKING' as TeacherDashboardTab : 'QUIZ' as TeacherDashboardTab },
        { label: rn ? 'Polish Notes' : 'Create Notes', helper: 'Enhance lesson', tab: 'CONVERT' as TeacherDashboardTab },
      ],
      evidence: [
        `${contextHistory.length} resource${contextHistory.length === 1 ? '' : 's'} in context`,
        `${q.length} open learner request${q.length === 1 ? '' : 's'}`,
        completedResponses > 0 ? `${completedResponses} marked response${completedResponses === 1 ? '' : 's'}` : 'No responses marked yet',
      ],
    };
  }, [completedResponses, contextHistory, hasContext, requests, selectedSubject]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* --- CLASSROOM CONTEXT & COMMAND BAR --- */}
      <section className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Educator Command Desk
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, {teacherProfile?.name?.split(' ')[0] || 'Mwalimu'}
            </h1>
            <p className="text-slate-300 text-sm font-medium max-w-2xl leading-relaxed">
              Select your class and subject below to unlock tailored KICD lesson notes, exam blueprints, automated marking, and syllabus tracking.
            </p>
          </div>

          {/* Context Selector Pill Container */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-3 shrink-0 lg:w-80">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-300">Active Classroom Context</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1 block">Class</span>
                <select
                  value={selectedClass}
                  onChange={(e) => onClassChange(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/80 border border-white/20 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">Select Class</option>
                  {availableClasses.map((item) => (
                    <option key={item} value={item} className="bg-slate-900 text-white">
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1 block">Subject</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => onSubjectChange(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/80 border border-white/20 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map((item) => (
                    <option key={item} value={item} className="bg-slate-900 text-white">
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {walletBalance !== null && (
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs font-bold text-slate-300">
                <span>Wallet Balance</span>
                <span className="text-emerald-400">KES {walletBalance.toFixed(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Signals / Alerts */}
        {showQuickStart && (
          <div className="mt-6 rounded-2xl bg-emerald-900/60 border border-emerald-500/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs font-medium text-emerald-100">
                <strong className="text-white">Quick Start:</strong> Select a Class &amp; Subject above, then click <strong>Paper Studio</strong> or <strong>Lesson Maker</strong> below.
              </p>
            </div>
            <button
              onClick={onDismissQuickStart}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {workflowStepSignal && (
          <div className="mt-4 rounded-2xl bg-indigo-900/60 border border-indigo-500/40 p-4 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-indigo-100">{workflowStepSignal.message}</p>
            {onResetWorkflowProgress && (
              <button onClick={onResetWorkflowProgress} className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/20">
                Reset
              </button>
            )}
          </div>
        )}
      </section>

      {/* --- PRIMARY 4 FEATURE HUBS --- */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryHubCards.map((card) => (
          <div
            key={card.title}
            onClick={() => nav(card.tab, card.route)}
            className="group cursor-pointer bg-white rounded-3xl p-5 border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${card.badgeBg}`}>
                  {card.badge}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.subtitle}</p>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight mt-0.5">
                  {card.title}
                </h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{card.desc}</p>
            </div>

            <button
              type="button"
              className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${card.btnBg}`}
            >
              <span>{card.btnText}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </section>

      {/* --- QUICK ACTION TOOL STRIP --- */}
      <section className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-3 flex items-center gap-2 overflow-x-auto border border-slate-200/80">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 px-2">Quick Tools:</span>
        {secondaryQuickTools.map((tool) => (
          <button
            key={tool.title}
            onClick={() => nav(tool.tab)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/60 shadow-sm transition-colors shrink-0"
          >
            {tool.icon}
            <span>{tool.title}</span>
          </button>
        ))}
      </section>

      {/* --- SECONDARY DASHBOARD NAVIGATION TABS --- */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveOverviewTab('ACTIONS')}
          className={`pb-2 px-3 text-sm font-black transition-colors border-b-2 ${
            activeOverviewTab === 'ACTIONS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Teaching Loop &amp; Next Move
        </button>
        <button
          onClick={() => setActiveOverviewTab('SYLLABUS')}
          className={`pb-2 px-3 text-sm font-black transition-colors border-b-2 ${
            activeOverviewTab === 'SYLLABUS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Syllabus Tracker
        </button>
        <button
          onClick={() => setActiveOverviewTab('ANALYTICS')}
          className={`pb-2 px-3 text-sm font-black transition-colors border-b-2 ${
            activeOverviewTab === 'ANALYTICS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Analytics &amp; Recent Activity
        </button>
      </div>

      {/* --- TAB 1: TEACHING LOOP & NEXT MOVE --- */}
      {activeOverviewTab === 'ACTIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Teaching Loop & Intervention */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teaching Loop Status */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Classroom Workflow</p>
                  <h3 className="text-lg font-black text-slate-900">Active Teaching Loop</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
                  {loopPercent}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${loopPercent}%` }} />
              </div>

              {/* Loop Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {teachingLoop.map((step, idx) => (
                  <div
                    key={step.title}
                    className={`p-3 rounded-2xl border text-left transition-colors ${
                      step.done ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      <span>Step {idx + 1}</span>
                      {step.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{step.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{step.hint}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended Intervention Card */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Smart Recommendation</p>
                  <h3 className="text-lg font-black text-slate-900">{intervention.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={sharePlan}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                >
                  {shareState === 'shared' ? 'Shared' : shareState === 'copied' ? 'Copied' : 'Share Plan'}
                </button>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">{intervention.body}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                {intervention.actions.map((act) => (
                  <button
                    key={act.label}
                    onClick={() => nav(act.tab)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>{act.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Context Evidence</p>
                {intervention.evidence.map((ev) => (
                  <p key={ev} className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{ev}</span>
                  </p>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Classroom Follow-Ups & Quick Tools */}
          <div className="space-y-6">
            {/* Student Requests */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Classroom Requests</p>
                  <h3 className="text-base font-black text-slate-900">Student Follow-up</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {pendingResponses} Open
                </span>
              </div>

              <div className="space-y-2">
                {requests.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs font-medium text-slate-500">
                    No active student requests right now.
                  </div>
                ) : (
                  requests.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => onRequestClick(req)}
                      className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{req.studentName || req.studentId || 'Learner Request'}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {req.subject || selectedSubject} / {req.grade || selectedClass}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        {req.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            {/* Recent Creations Quick List */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recent Materials</p>
                  <h3 className="text-base font-black text-slate-900">Pick Up Work</h3>
                </div>
                <button onClick={() => nav('LIBRARY')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {recent.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs font-medium text-slate-500">
                    No recent materials generated yet.
                  </div>
                ) : (
                  recent.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onHistoryItemClick(item)}
                      className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-3 text-left"
                    >
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shrink-0">
                        {item.type === 'NOTE' ? <FileText className="w-4 h-4" /> : <Brain className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{item.subject} • {item.date}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* --- TAB 2: SYLLABUS TRACKER --- */}
      {activeOverviewTab === 'SYLLABUS' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <SyllabusTracker teacherId={teacherId} selectedClass={selectedClass} selectedSubject={selectedSubject} onNavigate={nav} />
        </section>
      )}

      {/* --- TAB 3: ANALYTICS & ACTIVITY --- */}
      {activeOverviewTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Teacher Workflow</p>
                <h3 className="text-lg font-black text-slate-900">7-Day Activity Analytics</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {workflowAnalyticsLoading ? 'Loading...' : `${workflowAnalytics?.totalEvents || 0} Events`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Schemes</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{workflowAnalytics?.schemeGenerated || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Homework</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{workflowAnalytics?.homeworkGenerated || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Notes</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{workflowAnalytics?.noteGenerated || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Steps</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{workflowAnalytics?.stepCompleted || 0}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recent Workflow Events</p>
              {workflowAnalytics?.recentEvents?.length ? (
                workflowAnalytics.recentEvents.map((item) => (
                  <div key={`${item.eventName}-${item.time}`} className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span className="capitalize">{item.eventName.replace(/_/g, ' ')}</span>
                    <span className="text-slate-400 text-[10px]">{item.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 font-medium">No workflow events recorded yet.</p>
              )}
            </div>
          </section>

          {/* Desk Health Summary */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Desk Metrics</p>
              <h3 className="text-base font-black text-slate-900">Resource Health</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">Active Requests</span>
                </div>
                <span className="text-sm font-black text-slate-900">{activeTutoringRequests.length}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Library className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Saved Resources</span>
                </div>
                <span className="text-sm font-black text-slate-900">{contextHistory.length}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold text-slate-700">Marked Responses</span>
                </div>
                <span className="text-sm font-black text-slate-900">{completedResponses}</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
