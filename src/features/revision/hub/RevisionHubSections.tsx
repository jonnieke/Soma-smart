import React from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileSearch,
  FileText,
  Filter,
  Grid2X2,
  Home,
  Search,
  Share2,
  Target,
  Timer,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  paperAttemptStatus,
  paperContentType,
  paperDuration,
  paperHasDiagrams,
  paperPdfUrl,
  paperQuestionCount,
  RevisionPaper,
  RevisionTerminology,
} from './revisionHubModel';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2';

export const RevisionHubNav: React.FC<{
  firstName: string;
  grade?: string;
  onHome: () => void;
  onProfile: () => void;
}> = ({ firstName, grade, onHome, onProfile }) => (
  <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
    <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onHome}
        className={`flex items-center gap-2 rounded-xl text-left ${focusRing}`}
        aria-label="Go to Soma AI homepage"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg font-black text-white">
          S
        </span>
        <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
          Soma AI
        </span>
      </button>

      <nav aria-label="Revision navigation" className="hidden h-full items-center gap-7 sm:flex">
        <a
          href="#today"
          className={`flex h-full items-center gap-2 border-b-2 border-indigo-600 px-1 text-sm font-bold text-indigo-600 ${focusRing}`}
        >
          <Home className="h-4 w-4" /> Today
        </a>
        <a
          href="#papers"
          className={`flex h-full items-center gap-2 border-b-2 border-transparent px-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 ${focusRing}`}
        >
          <FileText className="h-4 w-4" /> Papers
        </a>
        <a
          href="#progress"
          className={`flex h-full items-center gap-2 border-b-2 border-transparent px-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 ${focusRing}`}
        >
          <BarChart3 className="h-4 w-4" /> Progress
        </a>
      </nav>

      <button
        type="button"
        onClick={onProfile}
        className={`flex min-h-11 items-center gap-2 rounded-full px-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-900 ${focusRing}`}
        aria-label="Open learner profile"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
          {firstName.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-sm font-bold text-slate-800 dark:text-white">
            {firstName}
          </span>
          <span className="block text-[10px] font-semibold text-slate-400">
            {grade || 'Learner'}
          </span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>
    </div>
    <nav
      aria-label="Mobile revision navigation"
      className="grid grid-cols-3 border-t border-slate-100 sm:hidden dark:border-slate-800"
    >
      <a
        href="#today"
        className="flex min-h-11 items-center justify-center gap-1.5 text-xs font-bold text-indigo-600"
      >
        <Home className="h-4 w-4" />
        Today
      </a>
      <a
        href="#papers"
        className="flex min-h-11 items-center justify-center gap-1.5 text-xs font-bold text-slate-500"
      >
        <FileText className="h-4 w-4" />
        Papers
      </a>
      <a
        href="#progress"
        className="flex min-h-11 items-center justify-center gap-1.5 text-xs font-bold text-slate-500"
      >
        <BarChart3 className="h-4 w-4" />
        Progress
      </a>
    </nav>
  </header>
);

export const RevisionHero: React.FC<{
  greeting: string;
  firstName: string;
  grade?: string;
  terminology: RevisionTerminology;
  recommendation?: RevisionPaper;
  recommendationReason: string;
  recommendedTopic?: string;
  hasHistory: boolean;
  unfinished?: RevisionPaper;
  onStart: () => void;
  onContinue: (paper: RevisionPaper) => void;
}> = ({
  greeting,
  firstName,
  grade,
  terminology,
  recommendation,
  recommendationReason,
  recommendedTopic,
  hasHistory,
  unfinished,
  onStart,
  onContinue,
}) => {
  const questions = recommendation ? paperQuestionCount(recommendation) : 0;
  const duration = recommendation ? paperDuration(recommendation) : 0;
  const progress = unfinished ? Number(unfinished.progress_completed || 0) : 0;
  const progressTotal = unfinished
    ? Number(unfinished.progress_total || paperQuestionCount(unfinished) || 0)
    : 0;
  const progressPercent =
    progressTotal > 0 ? Math.min(100, Math.round((progress / progressTotal) * 100)) : 0;

  return (
    <section
      id="today"
      aria-labelledby="revision-hero-title"
      className="relative overflow-hidden rounded-[1.5rem] bg-[#1d1758] p-5 text-white shadow-[0_18px_50px_rgba(43,31,122,0.18)] sm:p-7 lg:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl"
      />
      <div className="relative">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-violet-200">
          <TrendingUp className="h-4 w-4" /> Today&apos;s best revision
        </p>
        <h1
          id="revision-hero-title"
          className="mt-4 text-2xl font-black tracking-tight sm:text-3xl lg:text-[2.15rem]"
        >
          {hasHistory ? `${greeting}, ${firstName}.` : "Let's find your starting point."}
        </h1>
        <p className="mt-1 text-lg font-medium text-violet-100 sm:text-2xl">
          {hasHistory
            ? `Let's move you closer to your ${terminology.targetLabel}.`
            : `Start with a ${terminology.contentLabel} matched to ${grade || 'your level'}.`}
        </p>

        <div
          className={`mt-6 grid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] ${unfinished ? 'lg:grid-cols-[1.2fr_0.9fr]' : ''}`}
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-300 text-indigo-950">
                <Target className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-violet-200">
                  {hasHistory ? 'Recommended revision' : 'Recommended starting paper'}
                </p>
                <h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl">
                  {recommendedTopic || recommendation?.title || 'Browse revision papers'}
                </h2>
                {recommendation && recommendedTopic && (
                  <p className="mt-1 truncate text-xs font-semibold text-violet-200">
                    From {recommendation.title}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-violet-100">
                  {questions > 0 && <span>{questions} questions</span>}
                  {duration > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" /> About {duration} minutes
                    </span>
                  )}
                  {!questions && !duration && (
                    <span>Choose from published, curriculum-aligned papers</span>
                  )}
                </div>
                <p className="mt-3 flex items-start gap-2 text-xs font-medium text-violet-100">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {recommendationReason}
                </p>
                <button
                  type="button"
                  onClick={onStart}
                  className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl bg-indigo-500 px-6 text-sm font-black text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 sm:w-auto ${focusRing}`}
                >
                  {hasHistory
                    ? 'Start revision'
                    : recommendation
                      ? `Start ${terminology.contentLabel}`
                      : 'Browse papers'}{' '}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {unfinished && (
            <div className="border-t border-white/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <p className="text-xs font-bold text-violet-200">Continue where you left off</p>
              <h2 className="mt-2 line-clamp-2 text-sm font-black sm:text-base">
                {unfinished.title}
              </h2>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Paper completion"
              >
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-violet-100">
                {progressTotal > 0
                  ? `${progress} of ${progressTotal} questions completed`
                  : 'Your answers are saved'}
              </p>
              <button
                type="button"
                onClick={() => onContinue(unfinished)}
                className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/50 px-5 text-sm font-black hover:bg-white/10 ${focusRing}`}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const QuickRevisionActions: React.FC<{
  onExam: () => void;
  onPractice: () => void;
  onTopic: () => void;
}> = ({ onExam, onPractice, onTopic }) => {
  const actions = [
    {
      title: 'Take an Exam',
      description: 'Complete a timed paper or assessment.',
      icon: FileSearch,
      onClick: onExam,
    },
    {
      title: 'Quick Practice',
      description: 'Revise with a short question set.',
      icon: Target,
      onClick: onPractice,
    },
    {
      title: 'Choose a Topic',
      description: 'Work on a subject or skill you select.',
      icon: Grid2X2,
      onClick: onTopic,
    },
  ];
  return (
    <section aria-label="Quick revision routes" className="grid gap-3 md:grid-cols-3">
      {actions.map(({ title, description, icon: Icon, onClick }) => (
        <button
          key={title}
          type="button"
          onClick={onClick}
          className={`group flex min-h-[92px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 ${focusRing}`}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Icon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-black text-slate-950 dark:text-white">{title}</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {description}
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-indigo-500 transition group-hover:translate-x-0.5" />
        </button>
      ))}
    </section>
  );
};

export const RevisionPaperCard: React.FC<{
  paper: RevisionPaper;
  onOpen: (paper: RevisionPaper) => void;
  onViewPdf: (paper: RevisionPaper) => void;
  onShare: (paper: RevisionPaper) => void;
}> = ({ paper, onOpen, onViewPdf, onShare }) => {
  const status = paperAttemptStatus(paper);
  const questions = paperQuestionCount(paper);
  const duration = paperDuration(paper);
  const pdfUrl = paperPdfUrl(paper);
  const hasDiagrams = paperHasDiagrams(paper);
  const statusCopy =
    status === 'COMPLETED' ? 'Completed' : status === 'IN_PROGRESS' ? 'In progress' : 'Not started';
  const cta = status === 'COMPLETED' ? 'Review' : status === 'IN_PROGRESS' ? 'Continue' : 'Start';
  const statusStyle =
    status === 'COMPLETED'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'IN_PROGRESS'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-indigo-50 text-indigo-700';

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
          <BookOpen className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-indigo-600 dark:text-indigo-300">
            {String(paper.subject || 'General')}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-snug text-slate-950 dark:text-white">
            {paper.title || 'Revision paper'}
          </h3>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
        <span className={`rounded-full px-2.5 py-1 ${statusStyle}`}>{statusCopy}</span>
        <span>{paperContentType(paper)}</span>
        {paper.grade && <span>• {String(paper.grade)}</span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {pdfUrl ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">PDF ready</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">PDF coming soon</span>
        )}
        {hasDiagrams && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">Diagrams included</span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
        {duration > 0 && (
          <span className="flex items-center gap-1.5">
            <Timer className="h-4 w-4" />
            {duration} min
          </span>
        )}
        {questions > 0 && <span>{questions} questions</span>}
        {status === 'COMPLETED' && Number.isFinite(Number(paper.score)) && (
          <span className="ml-auto font-black text-emerald-600">{Number(paper.score)}%</span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onOpen(paper)}
          className={`inline-flex min-h-11 items-center justify-center rounded-xl ${status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white' : 'border border-indigo-300 text-indigo-700 dark:text-indigo-300'} px-3 text-sm font-black hover:bg-indigo-600 hover:text-white ${focusRing}`}
        >
          {cta}
        </button>
        <button
          type="button"
          onClick={() => onViewPdf(paper)}
          disabled={!pdfUrl}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black ${pdfUrl ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed border-slate-200 text-slate-300'} ${focusRing}`}
        >
          <ExternalLink className="h-4 w-4" />
          PDF
        </button>
        <button
          type="button"
          onClick={() => onShare(paper)}
          disabled={!pdfUrl}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black ${pdfUrl ? 'border-slate-200 text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed border-slate-200 text-slate-300'} ${focusRing}`}
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </article>
  );
};

export const RevisionPaperLibrary: React.FC<{
  papers: RevisionPaper[];
  totalPapers: number;
  subjects: string[];
  activeSubject: string;
  searchQuery: string;
  statusFilter: string;
  loading: boolean;
  filtersOpen: boolean;
  onFiltersOpen: () => void;
  onSearch: (value: string) => void;
  onSubject: (value: string) => void;
  onStatus: (value: string) => void;
  onClear: () => void;
  onOpen: (paper: RevisionPaper) => void;
  onViewPdf: (paper: RevisionPaper) => void;
  onShare: (paper: RevisionPaper) => void;
}> = ({
  papers,
  totalPapers,
  subjects,
  activeSubject,
  searchQuery,
  statusFilter,
  loading,
  filtersOpen,
  onFiltersOpen,
  onSearch,
  onSubject,
  onStatus,
  onClear,
  onOpen,
  onViewPdf,
  onShare,
}) => (
  <section
    id="papers"
    aria-labelledby="papers-title"
    className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5"
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2
          id="papers-title"
          className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl"
        >
          Soma Original Revision Papers
        </h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          Fresh, curriculum-aligned papers and practice sets designed to help you prepare with
          confidence.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1 lg:w-52">
          <span className="sr-only">Search revision papers</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search papers..."
            className={`min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 ${focusRing}`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg hover:bg-slate-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={onFiltersOpen}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 lg:hidden ${focusRing}`}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>
    </div>

    <div
      className={`${filtersOpen ? 'grid' : 'hidden'} mt-4 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950 lg:grid lg:grid-cols-[1fr_1fr_auto] lg:bg-transparent lg:p-0`}
    >
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
        Subject or learning area
        <select
          value={activeSubject}
          onChange={(event) => onSubject(event.target.value)}
          className={`mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 ${focusRing}`}
        >
          <option value="All">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
        Attempt status
        <select
          value={statusFilter}
          onChange={(event) => onStatus(event.target.value)}
          className={`mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 ${focusRing}`}
        >
          <option value="ALL">All statuses</option>
          <option value="NOT_STARTED">Not started</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </label>
      <button
        type="button"
        onClick={onClear}
        className={`min-h-11 self-end rounded-xl px-4 text-sm font-black text-indigo-600 hover:bg-indigo-50 ${focusRing}`}
      >
        Clear filters
      </button>
    </div>

    <p className="mt-4 text-xs font-semibold text-slate-400">
      Showing {papers.length} of {totalPapers} paper{totalPapers === 1 ? '' : 's'}
    </p>
    {loading ? (
      <div className="mt-4 grid gap-3 md:grid-cols-3" aria-label="Loading papers">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    ) : papers.length ? (
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {papers.map((paper) => (
          <RevisionPaperCard
            key={String(paper.id || paper.title)}
            paper={paper}
            onOpen={onOpen}
            onViewPdf={onViewPdf}
            onShare={onShare}
          />
        ))}
      </div>
    ) : (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
        <FileText className="mx-auto h-8 w-8 text-slate-300" />
        <h3 className="mt-3 font-black text-slate-900 dark:text-white">
          {totalPapers ? 'No papers match these filters.' : 'No revision papers are available yet.'}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          {totalPapers
            ? 'Clear the filters to return to papers matched to your profile.'
            : 'Your hub is still useful: choose a topic or return when your school publishes a paper.'}
        </p>
        {totalPapers > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white"
          >
            Clear filters
          </button>
        )}
      </div>
    )}
  </section>
);

export const ImprovementAndReadiness: React.FC<{
  heading: string;
  priorities: Array<{ topic: string; score: number }>;
  readiness: { status: string; score: number | null; sessions: number; recommendation: string };
  papersCompleted: number;
  onPractice: (topic?: string) => void;
}> = ({ heading, priorities, readiness, papersCompleted, onPractice }) => (
  <section
    id="progress"
    aria-label="Revision progress"
    className="scroll-mt-28 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"
  >
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
        {heading}
      </h2>
      {priorities.length ? (
        <div className="mt-4 space-y-2">
          {priorities.slice(0, 3).map(({ topic, score }, index) => (
            <button
              key={topic}
              type="button"
              onClick={() => onPractice(topic)}
              className={`group flex min-h-[72px] w-full items-center gap-3 rounded-xl border border-slate-100 px-3 text-left hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 ${focusRing}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-sm font-black text-indigo-700">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-slate-900 dark:text-white">{topic}</span>
                <span className="block text-xs text-slate-500">
                  Recent mastery is {score}%. Focused practice can improve consistency.
                </span>
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-black ${score < 45 ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}
              >
                {score < 45 ? 'Priority' : 'Improving'}
              </span>
              <ArrowRight className="h-4 w-4 text-indigo-500" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
          <p className="font-bold text-slate-900 dark:text-white">
            Complete your first assessment to unlock personalised improvement areas.
          </p>
          <button
            type="button"
            onClick={() => onPractice()}
            className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white"
          >
            Start an assessment
          </button>
        </div>
      )}
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
        Readiness
      </h2>
      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800">
        <div className="pr-3">
          <p className="text-[11px] font-semibold text-slate-500">Current score</p>
          <p className="mt-1 text-2xl font-black text-indigo-600">
            {readiness.score === null ? '-' : `${readiness.score}%`}
          </p>
        </div>
        <div className="px-3">
          <p className="text-[11px] font-semibold text-slate-500">Papers done</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {papersCompleted}
          </p>
        </div>
        <div className="pl-3">
          <p className="text-[11px] font-semibold text-slate-500">Status</p>
          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
            {readiness.status}
          </p>
        </div>
      </div>
      {readiness.score !== null && (
        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-label="Current readiness score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={readiness.score}
        >
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${readiness.score}%` }}
          />
        </div>
      )}
      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {readiness.recommendation}
      </p>
      <p className="mt-2 text-xs font-semibold text-emerald-600">
        {readiness.sessions} revision session{readiness.sessions === 1 ? '' : 's'} this week
      </p>
    </div>
  </section>
);
