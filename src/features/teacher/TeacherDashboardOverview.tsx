import React from 'react';
import { AlertCircle, ArrowRight, BookOpen, Brain, CheckCircle2, ChevronRight, ClipboardList, FileText, Library, Sparkles, Target, Users } from 'lucide-react';
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

export const TeacherDashboardOverview: React.FC<TeacherDashboardOverviewProps> = ({ teacherProfile, teacherId, selectedSubject, selectedClass, availableClasses, availableSubjects, activeTutoringRequests, teacherHistory, teacherWallet, onNavigate, onClassChange, onSubjectChange, onRequestClick, onHistoryItemClick, onTrackEvent, workflowStepSignal, workflowProgress, onResetWorkflowProgress, showQuickStart, onDismissQuickStart }) => {
  const [shareState, setShareState] = React.useState<'idle' | 'copied' | 'shared'>('idle');
  const [workflowAnalytics, setWorkflowAnalytics] = React.useState<TeacherWorkflowAnalyticsSummary | null>(null);
  const [workflowAnalyticsLoading, setWorkflowAnalyticsLoading] = React.useState(false);
  const c = n(String(selectedClass || '')); const s = n(String(selectedSubject || ''));
  const isPlaceholder = ['selected department', 'department', 'classe'].includes(c) || ['selected department', 'department', 'subject'].includes(s);
  const hasContext = Boolean(selectedClass?.trim()) && Boolean(selectedSubject?.trim()) && !isPlaceholder;
  const contextHistory = React.useMemo(() => hasContext ? teacherHistory.filter(item => n(String(item.subject || '')) === s && n(String(item.className || '')) === c) : teacherHistory, [c, hasContext, s, teacherHistory]);
  const noteCount = contextHistory.filter(i => i.type === 'NOTE').length;
  const quizCount = contextHistory.filter(i => i.type === 'QUIZ').length;
  const completedResponses = activeTutoringRequests.filter(r => r.status === 'COMPLETED').length;
  const pendingResponses = activeTutoringRequests.filter(r => r.status === 'PENDING' || r.status === 'ACCEPTED').length;
  const hasAssessment = workflowProgress?.generatedAssessment ?? quizCount > 0;
  const hasStream = workflowProgress?.publishedStream ?? false;
  const hasMarked = completedResponses > 0;
  const loopSteps = [hasContext, noteCount > 0, hasAssessment, hasStream, hasMarked].filter(Boolean).length;
  const loopPercent = Math.round((loopSteps / 5) * 100);
  const walletBalance = typeof teacherWallet?.balance === 'number' ? teacherWallet.balance : null;
  const recent = contextHistory.slice(0, 3);
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
        if (!cancelled) {
          setWorkflowAnalytics(summary);
        }
      } finally {
        if (!cancelled) {
          setWorkflowAnalyticsLoading(false);
        }
      }
    };

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  const actions: Array<{ title: string; body: string; tab: TeacherDashboardTab; icon: React.ReactNode }> = [
    { title: 'Open Lesson Maker', body: 'Start where teachers actually work: notes, plans, quizzes, and live teaching.', tab: 'CREATION_HUB', icon: <Sparkles className="w-5 h-5" /> },
    { title: 'I need a lesson fast', body: 'Turn a topic, file, or voice note into class notes.', tab: 'CONVERT', icon: <FileText className="w-5 h-5" /> },
    { title: 'I need a lesson plan', body: 'Create a structured lesson flow the class can follow.', tab: 'LESSON_PLAN_GENERATOR', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'I need scheme of work', body: 'Map the term without starting from scratch.', tab: 'SCHEMES', icon: <ClipboardList className="w-5 h-5" /> },
    { title: 'Track syllabus progress', body: 'Open the syllabus tracker and see what is covered, in progress, or behind.', tab: 'SYLLABUS_TRACKER', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'I need live teaching mode', body: 'Teach from a clean, guided classroom board.', tab: 'DARASA_MODE', icon: <Sparkles className="w-5 h-5" /> },
    { title: 'I need to mark work', body: 'Open marking and intervention tools quickly.', tab: 'MARKING', icon: <CheckCircle2 className="w-5 h-5" /> },
    { title: 'I need homework', body: 'Create practice work that fits the lesson.', tab: 'HOMEWORK', icon: <Target className="w-5 h-5" /> },
  ];

  const teachingLoop = [
    { title: 'Class & subject selected', done: hasContext, hint: hasContext ? `${selectedClass} / ${selectedSubject}` : 'Choose the class and subject first.' },
    { title: 'Lesson / notes created', done: noteCount > 0, hint: noteCount > 0 ? `${noteCount} note${noteCount === 1 ? '' : 's'} in this context.` : 'Create notes or upload a lesson file.' },
    { title: 'Assessment generated', done: hasAssessment, hint: hasAssessment ? `${quizCount} assessment${quizCount === 1 ? '' : 's'} available.` : 'Create a quiz or short check first.' },
    { title: 'Posted to classroom stream', done: hasStream, hint: hasStream ? 'Learners can now see the learning activity.' : 'Share the work to the class stream.' },
    { title: 'Marked / intervention ready', done: hasMarked, hint: hasMarked ? `${completedResponses} learner response${completedResponses === 1 ? '' : 's'} handled.` : 'Mark work and open the next intervention.' },
  ];

  const intervention = React.useMemo(() => {
    const q = requests;
    const rq = contextHistory.find(i => i.type === 'QUIZ');
    const rn = contextHistory.find(i => i.type === 'NOTE');
    if (!hasContext) {
      return { title: 'Set class context first', body: 'Choose class and subject so Soma can connect content, syllabus, marking, and follow-up.', actions: [
        { label: 'Create Notes', helper: 'Start the lesson flow', tab: 'CONVERT' as TeacherDashboardTab },
        { label: 'Create Quiz', helper: 'Check understanding', tab: 'QUIZ' as TeacherDashboardTab },
        { label: 'Generate Scheme', helper: 'Plan the term', tab: 'SCHEMES' as TeacherDashboardTab },
      ], evidence: ['No class context selected yet.'] };
    }
    return {
      title: `Next move for ${selectedSubject}`,
      body: q.length > 0 ? `${q.length} learner request${q.length === 1 ? '' : 's'} need follow-up. Start from the confusion, then assign a short check.` : rq ? 'You have an assessment ready. Use marking feedback to reteach the weakest idea, then assign a repair task.' : rn ? 'You have notes ready. Convert them into a short quiz so you can see who understood.' : 'Create one lesson note and one short quiz so the class has a complete learning loop.',
      actions: [
        { label: q.length > 0 ? 'Open Requests' : 'Post To Stream', helper: 'Give learners the next task', tab: 'STUDENTS' as TeacherDashboardTab },
        { label: rq ? 'Mark Work' : 'Create Quiz', helper: rq ? 'Find weak areas' : 'Check understanding', tab: rq ? 'MARKING' as TeacherDashboardTab : 'QUIZ' as TeacherDashboardTab },
        { label: rn ? 'Improve Notes' : 'Create Notes', helper: 'Clarify the lesson', tab: 'CONVERT' as TeacherDashboardTab },
      ],
      evidence: [`${contextHistory.length} resource${contextHistory.length === 1 ? '' : 's'} in this context`, `${q.length} open learner request${q.length === 1 ? '' : 's'}`, completedResponses > 0 ? `${completedResponses} completed response${completedResponses === 1 ? '' : 's'}` : 'No completed learner responses yet'],
    };
  }, [completedResponses, contextHistory, hasContext, requests, selectedSubject]);

  const nav = (tab: TeacherDashboardTab) => { onTrackEvent?.('teacher_dashboard_quick_action', { tab }); onNavigate(tab); };
  const sharePlan = async () => {
    const text = ['Somo Smart Teacher Intervention Plan', `Class: ${hasContext ? selectedClass : 'Not selected'}`, `Subject: ${hasContext ? selectedSubject : 'Not selected'}`, `Focus: ${intervention.title}`, intervention.body, '', 'Actions:', ...intervention.actions.map((a, i) => `${i + 1}. ${a.label} - ${a.helper}`), '', 'Evidence:', ...intervention.evidence.map(x => `- ${x}`), 'https://somaai.co.ke'].join('\n');
    try { if (navigator.share) { await navigator.share({ title: 'Somo Smart teacher intervention plan', text }); setShareState('shared'); } else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); setShareState('copied'); } } catch { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); setShareState('copied'); } }
  };

  return <div className="space-y-6">
    <section className="bg-emerald-950 text-white rounded-[2rem] p-6 shadow-sm border border-emerald-900/60 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">Teacher Command Center</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Plan lessons, track the syllabus, and keep your class moving.</h2>
          <p className="text-sm font-semibold text-emerald-100 max-w-2xl">This is your working desk for CBC, CBE, and KCSE delivery. Pick a class and subject, then open Lesson Maker or move straight into the next teaching task.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider">{teacherProfile?.name?.split(' ')[0] || 'Teacher'}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider">{selectedClass || 'Set class'}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider">{selectedSubject || 'Set subject'}</span>
          {walletBalance !== null ? <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider">Wallet KES {walletBalance.toFixed(0)}</span> : null}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Next best action</p>
          <p className="mt-1 text-sm font-semibold text-emerald-50">{hasContext ? intervention.body : 'Choose a class and subject first, then open Lesson Maker to start the lesson flow.'}</p>
        </div>
        <button type="button" onClick={() => nav(hasContext ? intervention.actions[0].tab : 'CREATION_HUB')} className="rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-900 hover:bg-emerald-50 transition-colors shrink-0">{hasContext ? intervention.actions[0].label : 'Open Lesson Maker'}</button>
      </div>
      {showQuickStart ? <div className="rounded-2xl border border-emerald-700 bg-emerald-900/60 p-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Quick start</p><p className="text-sm font-semibold text-emerald-50 mt-1">1. Choose a class. 2. Choose a subject. 3. Open Lesson Maker and create the first lesson.</p></div><div className="flex flex-wrap gap-2 shrink-0"><button type="button" onClick={() => nav('CREATION_HUB')} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/15 transition-colors">Open Lesson Maker</button><button type="button" onClick={onDismissQuickStart} className="rounded-full border border-emerald-600 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-100 hover:bg-white/10 transition-colors">Dismiss</button></div></div> : null}
      {workflowStepSignal ? <div className="rounded-2xl border border-emerald-700 bg-emerald-900/50 p-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Teaching loop update</p><p className="text-sm font-semibold text-emerald-50 mt-1">{workflowStepSignal.message}</p></div>{onResetWorkflowProgress ? <button type="button" onClick={onResetWorkflowProgress} className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/15 transition-colors">Reset</button> : null}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Class</span><select value={selectedClass} onChange={e => onClassChange(e.target.value)} className="w-full rounded-2xl border border-emerald-700 bg-emerald-900/40 px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/20"><option value="">Choose class</option>{availableClasses.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Subject</span><select value={selectedSubject} onChange={e => onSubjectChange(e.target.value)} className="w-full rounded-2xl border border-emerald-700 bg-emerald-900/40 px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/20"><option value="">Choose subject</option>{availableSubjects.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      {!hasContext ? <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-emerald-50">Select a class and subject first. That unlocks syllabus tracking, lesson history, marking, and the teaching loop.</div> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{actions.map(action => <button key={action.title} type="button" onClick={() => nav(action.tab)} className="group text-left rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-white/20 transition-colors"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><span className="rounded-2xl border border-white/10 bg-white/10 p-2 text-emerald-100">{action.icon}</span><span className="text-sm font-black text-white">{action.title}</span></div><ChevronRight className="w-4 h-4 text-emerald-200 group-hover:text-white transition-colors shrink-0" /></div><p className="mt-3 text-xs font-semibold text-emerald-100/90">{action.body}</p></button>)}</div>
    </section>

    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <SyllabusTracker teacherId={teacherId} selectedClass={selectedClass} selectedSubject={selectedSubject} onNavigate={nav} />
        <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Teaching Loop</p><h3 className="text-lg font-black text-slate-900">The whole lesson cycle in one view</h3></div><div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-600">{loopPercent}% complete</div></div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${loopPercent}%` }} /></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{teachingLoop.map((step, i) => <div key={step.title} className={`rounded-2xl border p-4 ${step.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Step {i + 1}</p><div className={`rounded-full p-1 ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}><CheckCircle2 className="w-4 h-4" /></div></div><h4 className="mt-3 text-sm font-black text-slate-900">{step.title}</h4><p className="mt-1 text-xs font-semibold text-slate-600">{step.hint}</p></div>)}</div>
        </section>
      </div>
      <div className="space-y-6">
        <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-5 space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Intervention</p><h3 className="text-lg font-black text-slate-900">{intervention.title}</h3></div><button type="button" onClick={sharePlan} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-emerald-200 hover:text-emerald-700 transition-colors">{shareState === 'shared' ? 'Shared' : shareState === 'copied' ? 'Copied' : 'Share'}</button></div><p className="text-sm font-semibold text-slate-600">{intervention.body}</p><div className="flex flex-wrap gap-2">{intervention.actions.map(action => <button key={action.label} type="button" onClick={() => nav(action.tab)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition-colors">{action.label}</button>)}</div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Why this is next</p>{intervention.evidence.map(item => <p key={item} className="text-xs font-semibold text-slate-600 flex items-start gap-2"><ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /><span>{item}</span></p>)}</div></section>
        <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Teacher analytics</p>
              <h3 className="text-lg font-black text-slate-900">Last 7 days of teacher workflow</h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-600">
              {workflowAnalyticsLoading ? 'Loading' : `${workflowAnalytics?.totalEvents || 0} events`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Schemes</p>
              <p className="mt-1 text-lg font-black text-slate-900">{workflowAnalytics?.schemeGenerated || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Homework</p>
              <p className="mt-1 text-lg font-black text-slate-900">{workflowAnalytics?.homeworkGenerated || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Notes</p>
              <p className="mt-1 text-lg font-black text-slate-900">{workflowAnalytics?.noteGenerated || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Steps</p>
              <p className="mt-1 text-lg font-black text-slate-900">{workflowAnalytics?.stepCompleted || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Resets</p>
              <p className="mt-1 text-lg font-black text-slate-900">{workflowAnalytics?.resetCount || 0}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Recent events</p>
            {workflowAnalytics?.recentEvents?.length ? workflowAnalytics.recentEvents.map(item => (
              <div key={`${item.eventName}-${item.time}`} className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                <span className="truncate">{item.eventName.replace(/_/g, ' ')}</span>
                <span className="shrink-0 text-slate-400">{item.time}</span>
              </div>
            )) : <p className="text-xs font-semibold text-slate-500">No teacher workflow events yet. Generate a scheme or homework to start the signal.</p>}
          </div>
        </section>
        <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-5 space-y-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Classroom requests</p><h3 className="text-lg font-black text-slate-900">Active follow-up</h3></div><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-600">{pendingResponses} open</span></div><div className="space-y-2">{requests.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">No active learner requests right now. Keep moving with the lesson loop.</div> : requests.map(request => <button key={request.id} type="button" onClick={() => onRequestClick(request)} className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-black text-slate-900 truncate">{request.studentName || request.studentId || 'Learner request'}</p><p className="mt-1 text-xs font-semibold text-slate-600 truncate">{request.subject || selectedSubject || 'Subject'} / {request.grade || selectedClass || 'Class'}</p></div><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{request.status}</span></div></button>)}</div></section>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2 bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-5 space-y-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Recent creations</p><h3 className="text-lg font-black text-slate-900">Pick up where you left off</h3></div><button type="button" onClick={() => nav('LIBRARY')} className="text-sm font-black text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1">View Library <ChevronRight className="w-4 h-4" /></button></div><div className="space-y-2">{recent.length === 0 ? <div className="p-4 text-center text-slate-500 text-sm font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-300">No materials generated yet. Start with Create Notes.</div> : recent.map(item => <button key={item.id} type="button" className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 transition-colors text-left" onClick={() => onHistoryItemClick(item)}><div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${item.type === 'NOTE' ? 'bg-white border-slate-200 text-slate-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>{item.type === 'NOTE' ? <FileText className="w-5 h-5" /> : <Brain className="w-5 h-5" />}</div><div className="min-w-0 flex-1"><p className="font-bold text-slate-900 text-sm truncate">{item.title}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{item.subject} / {item.date}</p></div></button>)}</div></section>
      <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-5 space-y-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Resource health</p><h3 className="text-lg font-black text-slate-900">What the desk can already do</h3></div><div className="grid gap-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><Users className="w-5 h-5 text-emerald-600 shrink-0" /><span className="text-sm font-semibold text-slate-700 truncate">Learner requests</span></div><span className="text-sm font-black text-slate-900">{activeTutoringRequests.length}</span></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><Library className="w-5 h-5 text-emerald-600 shrink-0" /><span className="text-sm font-semibold text-slate-700 truncate">Context resources</span></div><span className="text-sm font-black text-slate-900">{contextHistory.length}</span></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><AlertCircle className="w-5 h-5 text-amber-600 shrink-0" /><span className="text-sm font-semibold text-slate-700 truncate">Marked for intervention</span></div><span className="text-sm font-black text-slate-900">{completedResponses}</span></div></div></section>
    </div>
  </div>;
};
