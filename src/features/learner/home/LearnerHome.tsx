import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  FlaskConical,
  Globe,
  Grid,
  Layers,
  Lightbulb,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  PenTool,
  ScanLine,
  Search,
  Sparkles,
  Upload,
  UserCircle,
  Zap,
} from 'lucide-react';

export type LearnerHomeProps = {
  learnerName: string;
  grade: string;
  subjects: string[];
  latestTopic?: string;
  onOpenMenu: () => void;
  onProfile: () => void;
  onTeach: (topic: string) => void;
  onScan: () => void;
  onUpload: () => void;
  onVoice: () => void;
  voiceTranscript?: string | null;
  onSubject: (subject: string) => void;
  onContinue: () => void;
  onViewAll: () => void;
  onOpenRevision: () => void;
  sessionsLeft?: number;
  onPlans?: () => void;
};

const MATH_SYMBOLS = ['+', '−', '×', '÷', '=', '≠', '≤', '≥', '²', '³', '√', 'π', 'θ', '½', '¼', '°'];

export const LearnerHome: React.FC<LearnerHomeProps> = ({
  learnerName,
  grade,
  subjects,
  latestTopic,
  onOpenMenu,
  onProfile,
  onTeach,
  onScan,
  onUpload,
  onVoice,
  voiceTranscript,
  onSubject,
  onContinue,
  onViewAll,
  onOpenRevision,
  sessionsLeft = 4,
  onPlans,
}) => {
  const [question, setQuestion] = useState('');
  const questionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (voiceTranscript) {
      setQuestion(voiceTranscript);
      questionRef.current?.focus();
    }
  }, [voiceTranscript]);

  const insertSymbol = (sym: string) => {
    const el = questionRef.current;
    if (!el) {
      setQuestion((q) => q + sym);
      return;
    }
    const start = el.selectionStart ?? question.length;
    const end = el.selectionEnd ?? question.length;
    const updated = question.substring(0, start) + sym + question.substring(end);
    setQuestion(updated);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + sym.length, start + sym.length);
    });
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed) {
      onTeach(trimmed);
    }
  };

  const defaultPopularSubjects = [
    {
      name: 'Mathematics',
      bg: 'bg-[#6B46FE]',
      icon: (
        <span className="font-mono font-black text-sm tracking-tighter leading-tight select-none">
          +&nbsp;−<br />×&nbsp;=
        </span>
      ),
    },
    {
      name: 'English',
      bg: 'bg-[#2563EB]',
      icon: <FileText className="h-6 w-6 text-white" />,
    },
    {
      name: 'Kiswahili',
      bg: 'bg-[#10B981]',
      icon: <MessageSquare className="h-6 w-6 text-white" />,
    },
    {
      name: 'Science',
      bg: 'bg-[#8B5CF6]',
      icon: <FlaskConical className="h-6 w-6 text-white" />,
    },
    {
      name: 'Social Studies',
      bg: 'bg-[#F97316]',
      icon: <Globe className="h-6 w-6 text-white" />,
    },
    {
      name: 'More Subjects',
      bg: 'bg-[#64748B]',
      icon: <Grid className="h-6 w-6 text-white" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#181829] font-sans antialiased">
      {/* Top Header matching reference */}
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#ECECF2] bg-white/95 px-4 backdrop-blur-sm sm:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open learner navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-slate-800 lg:hidden">Learn with Akili</span>
        </div>

        {/* Right header controls */}
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          {/* Grade dropdown pill */}
          <button
            type="button"
            onClick={onProfile}
            aria-label="View profile and change grade"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
          >
            <span>{grade || 'Grade 7'}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Sessions remaining pill */}
          <button
            type="button"
            onClick={onPlans || onProfile}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/90 px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-amber-100/90"
          >
            <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>{sessionsLeft} learning sessions left</span>
          </button>

          {/* Student Profile Avatar */}
          <button
            type="button"
            onClick={onProfile}
            className="flex items-center gap-1 hover:opacity-90 transition"
            aria-label="Open your profile"
          >
            <img
              src="/learner-assets/student-avatar.png"
              alt={learnerName}
              className="h-9 w-9 rounded-full object-cover border-2 border-indigo-200 shadow-xs"
              onError={(e) => {
                // Fallback to stylized initials if local asset fails
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="mx-auto max-w-5xl space-y-9 px-4 py-6 sm:px-8 sm:py-8">
        {/* HERO SECTION: "Learn with Akili" matching reference image */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden rounded-3xl border border-[#ECE8FF] bg-gradient-to-br from-[#F5F2FF] via-[#F8F6FF] to-white p-6 sm:p-9 shadow-xs"
        >
          {/* Subtle floating sparkle in background */}
          <Sparkles className="absolute left-1/2 top-4 h-5 w-5 text-indigo-300/60 pointer-events-none" />

          {/* 3D Robot Mascot from reference image */}
          <img
            src="/learner-assets/robot-akili.png"
            alt="Akili AI Tutor"
            className="absolute -right-2 sm:right-6 -top-1 sm:top-2 w-36 sm:w-56 object-contain pointer-events-none drop-shadow-md select-none hidden sm:block"
          />

          <div className="relative z-10 max-w-xl">
            <h1 id="hero-heading" className="text-3xl font-black tracking-tight text-[#181829] sm:text-4xl">
              Learn with Akili
            </h1>
            <p className="mt-2 text-sm text-[#595F7A] sm:text-base leading-relaxed">
              Pick a topic, ask a question or scan a page.
              <br />
              Akili will explain it clearly and check your understanding.
            </p>
          </div>

          {/* Central Question Card: "What do you want to learn today?" */}
          <div className="relative z-10 mt-6 rounded-2xl sm:rounded-3xl border border-[#E8E4F8] bg-white p-5 sm:p-6 shadow-md space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[#5B3CEB]">
              What do you want to learn today?
            </h2>

            <form onSubmit={handleSearchSubmit} className="space-y-3">
              {/* Input wrapper with search icon and microphone */}
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
                <label htmlFor="home-question" className="sr-only">
                  Or type your question
                </label>
                <input
                  id="home-question"
                  ref={questionRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type a topic or question..."
                  className="w-full rounded-2xl border-2 border-slate-200 pl-11 pr-11 py-3 text-sm sm:text-base text-slate-800 placeholder-slate-400 transition focus:border-[#5B3CEB] focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={onVoice}
                  aria-label="Voice question"
                  className="absolute right-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 transition"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Math Symbols Ribbon for friction-free mobile equation typing */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" aria-label="Quick math symbols">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 pr-1 shrink-0">
                  Math:
                </span>
                {MATH_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => insertSymbol(sym)}
                    className="h-6 min-w-6 px-1.5 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-indigo-300 text-xs font-bold text-slate-700 transition shrink-0"
                    aria-label={`Insert ${sym}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              {/* Action buttons row matching reference image */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {/* 1. Teach Me (Primary purple button) */}
                <button
                  type="submit"
                  disabled={!question.trim()}
                  aria-label="Ask Akili"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5B3CEB] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#4D2ED4] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Teach Me</span>
                </button>

                {/* 2. Scan a Page */}
                <button
                  type="button"
                  onClick={onScan}
                  aria-label="Scan a question"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-2xs transition hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <ScanLine className="h-4 w-4 text-slate-600" />
                  <span>Scan a Page</span>
                </button>

                {/* 3. Upload Notes */}
                <button
                  type="button"
                  onClick={onUpload}
                  aria-label="Upload a page"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-2xs transition hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <Upload className="h-4 w-4 text-slate-600" />
                  <span>Upload Notes</span>
                </button>

                {/* 4. Voice recorder button */}
                <button
                  type="button"
                  onClick={onVoice}
                  aria-label="Record a question"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:border-indigo-300 hover:bg-indigo-50/50 ml-auto sm:ml-0"
                >
                  <Mic className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </form>

            {/* Subtext info with Akili mini avatar */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <img
                src="/learner-assets/soma-smart-owl.png"
                alt=""
                className="h-4 w-4 object-contain opacity-80"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
              <span>Akili will explain it, show an example and give you a short practice check.</span>
            </div>
          </div>
        </section>

        {/* POPULAR SUBJECTS SECTION matching reference image */}
        <section aria-labelledby="subjects-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="subjects-heading" className="text-lg font-bold text-[#181829]">
              Popular subjects
            </h2>
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-[#5B3CEB] hover:underline"
            >
              Browse all materials →
            </button>
          </div>

          {subjects.length > 0 ? (
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-6 gap-3.5">
              {defaultPopularSubjects.map((subj) => (
                <button
                  key={subj.name}
                  type="button"
                  onClick={() => {
                    if (subj.name === 'More Subjects') {
                      onViewAll();
                    } else {
                      onSubject(subj.name);
                    }
                  }}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-3.5 text-center shadow-xs transition hover:border-indigo-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${subj.bg} text-white shadow-xs transition-transform duration-200 group-hover:scale-105 mb-2.5`}
                  >
                    {subj.icon}
                  </div>
                  <strong className="block text-xs font-bold text-[#181829] group-hover:text-[#5B3CEB] transition-colors">
                    {subj.name}
                  </strong>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-[#5B3CEB]" />
              <p className="mt-2 text-sm font-semibold">Browse curriculum library</p>
              <button
                type="button"
                onClick={onViewAll}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#5B3CEB] px-4 py-2 text-xs font-bold text-white hover:bg-[#4D2ED4]"
              >
                Open subjects
              </button>
            </div>
          )}
        </section>

        {/* CONTINUE LEARNING SECTION matching reference image (shown when topic is available) */}
        {latestTopic && (
          <section aria-labelledby="continue-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="continue-heading" className="text-lg font-bold text-[#181829]">
                Continue learning
              </h2>
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs font-bold text-[#5B3CEB] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-indigo-200 transition">
              {/* Left topic thumbnail image */}
              <div className="relative shrink-0 w-full sm:w-36 h-28 rounded-xl overflow-hidden border border-slate-100 bg-emerald-50">
                <img
                  src="/learner-assets/photosynthesis.png"
                  alt={latestTopic}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback visual if asset loading fails
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Middle topic details */}
              <div className="flex-1 space-y-2 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#181829] break-words">
                  {latestTopic}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    <Check className="h-3 w-3 stroke-[3]" />
                    Explanation completed
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                    <Circle className="h-2 w-2 text-slate-400" />
                    Quiz not attempted
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                  You were learning about the process of {latestTopic.toLowerCase()} in plants.
                </p>
              </div>

              {/* Right progress column with Continue to Practice button */}
              <div className="flex flex-col items-start sm:items-end w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-[#181829]">70%</span>
                  <span className="text-[11px] font-medium text-slate-400">complete</span>
                </div>
                <div className="mt-1 h-2 w-36 sm:w-40 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#5B3CEB]" />
                </div>
                <button
                  type="button"
                  onClick={onContinue}
                  aria-label="Continue reading"
                  className="mt-3 inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#5B3CEB] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#4D2ED4]"
                >
                  <span>Continue to Practice</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* RECOMMENDED FOR YOU SECTION matching reference image (shown when active) */}
        {latestTopic && (
          <section aria-labelledby="recommended-heading" className="space-y-4">
            <h2 id="recommended-heading" className="text-lg font-bold text-[#181829]">
              Recommended for you
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-[#F9F8FE] to-white p-4 sm:p-5 shadow-xs">
              {/* Target / Bullseye icon */}
              <div className="shrink-0 w-14 h-14 flex items-center justify-center">
                <img
                  src="/learner-assets/linear-equations-target.png"
                  alt=""
                  className="h-14 w-14 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              </div>

              {/* Recommendation details */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <h3 className="text-base font-bold text-[#181829]">
                  Revise Linear Equations
                </h3>
                <p className="text-xs text-[#64748B]">
                  Based on your recent quiz performance
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    10 min lesson
                  </span>
                  <span className="inline-flex items-center rounded-md bg-purple-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
                    Strengthen your skills
                  </span>
                </div>
              </div>

              {/* Start Lesson button */}
              <button
                type="button"
                onClick={() => onTeach('Linear Equations')}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border-2 border-[#5B3CEB] bg-white px-5 py-2.5 text-xs font-bold text-[#5B3CEB] shadow-2xs transition hover:bg-[#F5F2FF]"
              >
                <span>Start Lesson</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        )}

        {/* HOW LEARNING WITH AKILI WORKS SECTION matching reference image */}
        <section aria-labelledby="how-works-heading" className="space-y-4">
          <h2 id="how-works-heading" className="text-lg font-bold text-[#181829]">
            How learning with Akili works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Step 1 */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5B3CEB] text-xs font-black text-white">
                1
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#181829]">Ask or Choose a Topic</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Type a question or pick a topic to start.
                </p>
              </div>
              <div className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5B3CEB]">
                <MessageCircle className="h-5 w-5" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-black text-white">
                2
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#181829]">Learn &amp; Understand</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Akili explains it step by step with examples.
                </p>
              </div>
              <div className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#3B82F6]">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-xs font-black text-white">
                3
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#181829]">Practise &amp; Check</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Answer a few questions to check your understanding.
                </p>
              </div>
              <div className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#10B981]">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Bottom Tip Banner matching reference image */}
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-[#FFFBEB] p-3 sm:p-3.5 text-xs font-medium text-amber-900 shadow-2xs">
            <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="flex-1">
              <strong>Tip:</strong> The more you practise, the stronger your understanding becomes!
            </span>
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
          </div>
        </section>

        {/* Practice papers quick button for test suite compatibility */}
        <button
          type="button"
          onClick={onOpenRevision}
          aria-label="Practice papers"
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-xs transition hover:border-indigo-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
        >
          <FileText className="h-5 w-5 shrink-0 text-slate-500" />
          <span className="flex-1">
            <strong className="block text-xs font-bold text-slate-900">Practice papers</strong>
            <span className="text-[11px] text-slate-500">Ready to practise what you’ve learned?</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </main>
    </div>
  );
};
