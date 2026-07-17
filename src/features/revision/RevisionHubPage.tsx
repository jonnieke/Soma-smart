import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { BookOpen, Check, ChevronLeft, ChevronRight, ExternalLink, FileText, Share2, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { RevisionMode, TeacherActivity, ViewState } from '../../types';
import {
  ImprovementAndReadiness,
  QuickRevisionActions,
  RevisionHero,
  RevisionHubNav,
  RevisionPaperLibrary,
} from './hub/RevisionHubSections';
import {
  getGreeting,
  getReadiness,
  getRecommendationReason,
  getRevisionTerminology,
  isFullPaperMode,
  loadRevisionPerformance,
  normalizePaperSubject,
  paperAttemptStatus,
  paperHasDiagrams,
  paperPdfUrl,
  pickRecommendedPaper,
  paperMarkingSchemeUrl,
  RevisionPaper,
} from './hub/revisionHubModel';

interface Props {
  onStartSession: (data: File | TeacherActivity, mode: RevisionMode) => void;
  onNavigate: (view: ViewState) => void;
  onBack?: () => void;
  initialSubject?: string;
  initialSearchQuery?: string;
  initialPreviewPaperId?: string | number | null;
}

const normalizeGrade = (value: unknown): string =>
  String(value || '')
    .toLowerCase()
    .replace(/\s*grade\s*/g, '')
    .replace(/\s*\(jss\)\s*/g, '')
    .trim();

const isPaperForLearner = (paper: RevisionPaper, learnerGrade?: string): boolean => {
  const paperGrade = normalizeGrade(paper.grade);
  const profileGrade = normalizeGrade(learnerGrade);
  if (!profileGrade || !paperGrade || paperGrade === 'all' || paperGrade === profileGrade)
    return true;
  const groups = [
    ['pp1', 'pp2', '1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['form 1', 'form 2', 'form 3', 'form 4', '10', '11', '12'],
    ['1st year', '2nd year', '3rd year', '4th year', 'university', 'college', 'campus'],
  ];
  return groups.some(
    (group) =>
      group.some((level) => profileGrade.includes(level)) &&
      group.some((level) => paperGrade.includes(level))
  );
};

const isRevisionPaper = (resource: RevisionPaper): boolean => {
  const type = String(resource.type || resource.resource_type || '')
    .toUpperCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_');
  const title = String(resource.title || '').toLowerCase();
  return (
    Array.isArray(resource.structured_questions) ||
    ['PAST_PAPER', 'REVISION_PAPER', 'EXAM', 'EXAM_PAPER'].includes(type) ||
    /\b(mock|revision paper|assessment|exam paper|practice set)\b/.test(title)
  );
};

export const RevisionHubPage: React.FC<Props> = ({
  onStartSession,
  onNavigate,
  onBack,
  initialSubject,
  initialSearchQuery,
  initialPreviewPaperId,
}) => {
  const {
    availableQuizzes,
    educationLevel,
    fetchAvailableQuizzes,
    fetchResources,
    isOnline,
    learnerHistory,
    masteryGraph,
    resources,
    studentProfile,
    weakTopics,
  } = useApp();
  const navigate = useNavigate();
  const libraryRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [activeSubject, setActiveSubject] = useState(initialSubject || 'All');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inlinePdfPaper, setInlinePdfPaper] = useState<RevisionPaper | null>(null);
  const [inlinePdfDocument, setInlinePdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [inlinePdfLoading, setInlinePdfLoading] = useState(false);
  const [inlinePdfError, setInlinePdfError] = useState<string | null>(null);
  const [inlinePdfPage, setInlinePdfPage] = useState(1);
  const [inlinePdfJump, setInlinePdfJump] = useState('1');
  const [inlinePdfSource, setInlinePdfSource] = useState<'paper' | 'marking_scheme'>('paper');
  const inlinePdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inlinePdfRenderTaskRef = useRef<any>(null);
  const performance = useMemo(() => loadRevisionPerformance(), [learnerHistory]);

  React.useEffect(() => {
    if (!isOnline) return;
    setLoading(true);
    Promise.all([fetchResources(), fetchAvailableQuizzes()]).finally(() => setLoading(false));
  }, [isOnline]);

  React.useEffect(() => {
    if (initialSubject) setActiveSubject(initialSubject);
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery, initialSubject]);

  const allPapers = useMemo(
    () =>
      resources
        .filter((resource) => isRevisionPaper(resource as RevisionPaper))
        .map(
          (resource) =>
            ({
              ...resource,
              subject: normalizePaperSubject(resource as RevisionPaper),
            }) as RevisionPaper
        )
        .filter((paper) => isPaperForLearner(paper, studentProfile?.grade)),
    [resources, studentProfile?.grade]
  );
  const subjects = useMemo(
    () => Array.from(new Set(allPapers.map((paper) => String(paper.subject || 'General')))).sort(),
    [allPapers]
  );
  const filteredPapers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allPapers
      .filter((paper) => {
        const matchesSubject = activeSubject === 'All' || paper.subject === activeSubject;
        const matchesStatus = statusFilter === 'ALL' || paperAttemptStatus(paper) === statusFilter;
        const matchesSearch =
          !query ||
          `${paper.title || ''} ${paper.subject || ''} ${paper.grade || ''}`
            .toLowerCase()
            .includes(query);
        return matchesSubject && matchesStatus && matchesSearch;
      })
      .slice(0, 9);
  }, [activeSubject, allPapers, searchQuery, statusFilter]);

  const terminology = getRevisionTerminology(educationLevel, studentProfile?.grade);
  const recommendation = pickRecommendedPaper(allPapers, performance, weakTopics);
  const recommendationReason = getRecommendationReason(recommendation, performance, weakTopics);
  const hasHistory = performance.length > 0 || Object.keys(masteryGraph).length > 0;
  const unfinished = allPapers.find((paper) => paperAttemptStatus(paper) === 'IN_PROGRESS');
  const readiness = getReadiness(performance);
  const priorities = Object.entries(masteryGraph)
    .filter(([, score]) => Number.isFinite(score) && score < 70)
    .sort(([, left], [, right]) => left - right)
    .slice(0, 3)
    .map(([topic, score]) => ({ topic, score: Math.round(score) }));
  const papersCompleted = performance.filter(isFullPaperMode).length;
  const firstName = studentProfile?.name?.trim().split(/\s+/)[0] || 'Learner';
  const inlinePdfQuestions = useMemo(
    () => (Array.isArray(inlinePdfPaper?.structured_questions) ? (inlinePdfPaper.structured_questions as Array<Record<string, any>>) : []),
    [inlinePdfPaper]
  );
  const inlinePdfSections = useMemo(
    () => Array.from(new Set(inlinePdfQuestions.map((question) => String((question as any)?.section || '').trim()).filter(Boolean))),
    [inlinePdfQuestions]
  );
  const inlinePdfGuideTips = useMemo(() => {
    const grade = String(studentProfile?.grade || '').toLowerCase();
    const isLowerPrimary = /grade\s*[1-3]|pp[123]/.test(grade);
    const isUpperPrimary = /grade\s*[4-6]|pp[456]/.test(grade);
    const isSecondary = /form\s*[1-4]|grade\s*[7-9]/.test(grade);

    if (isLowerPrimary) {
      return [
        'Read the whole question once before you answer.',
        'Look for key words like name, circle, match, count, and draw.',
        'Keep answers short, clear, and neat.',
      ];
    }

    if (isUpperPrimary) {
      return [
        'Show working for calculations even when the answer looks simple.',
        'Write units, labels, and final answers clearly.',
        'If a diagram is given, use it to guide your answer.',
      ];
    }

    if (isSecondary) {
      return [
        'Match the command word: state, explain, describe, compare, calculate.',
        'Earn method marks by showing your steps, not just the final answer.',
        'Check all parts of the question before moving on.',
      ];
    }

    return [
      'Read the whole question before you begin.',
      'Use the marking scheme to see exactly what earns marks.',
      'Switch between paper and marking guide without leaving the app.',
    ];
  }, [studentProfile?.grade]);

  useEffect(() => {
    if (!initialPreviewPaperId) return;
    const targetId = String(initialPreviewPaperId);
    const match = allPapers.find((paper) => String(paper.id) === targetId);
    if (match) {
      setInlinePdfSource('paper');
      setInlinePdfPaper(match);
    }
  }, [allPapers, initialPreviewPaperId]);

  const startPaper = (paper?: RevisionPaper, mode: RevisionMode = RevisionMode.EXAM) => {
    if (!paper) {
      libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    onStartSession(paper as unknown as TeacherActivity, mode);
  };


  const getInlinePdfUrl = (paper?: RevisionPaper) => {
    if (!paper) return '';
    return inlinePdfSource === 'marking_scheme' ? paperMarkingSchemeUrl(paper) : paperPdfUrl(paper);
  };

  const openPaperPdf = (paper?: RevisionPaper, source: 'paper' | 'marking_scheme' = 'paper') => {
    const url = source === 'marking_scheme' ? paperMarkingSchemeUrl(paper || {}) : paperPdfUrl(paper || {});
    if (!url) {
      if (paper) startPaper(paper);
      return;
    }
    setInlinePdfSource(source);
    setInlinePdfPaper(paper || null);
  };

  const closeInlinePdf = () => {
    setInlinePdfPaper(null);
    setInlinePdfSource('paper');
  };

  useEffect(() => {
    if (!inlinePdfPaper) {
      setInlinePdfDocument(null);
      setInlinePdfPage(1);
      setInlinePdfJump('1');
      setInlinePdfLoading(false);
      setInlinePdfError(null);
      inlinePdfRenderTaskRef.current?.cancel?.();
      inlinePdfRenderTaskRef.current = null;
      return;
    }

    let cancelled = false;
    const url = getInlinePdfUrl(inlinePdfPaper);

    const loadDocument = async () => {
      setInlinePdfLoading(true);
      setInlinePdfError(null);
      setInlinePdfDocument(null);
      setInlinePdfPage(1);
      setInlinePdfJump('1');
      try {
        const pdfjs = await import('pdfjs-dist');
        const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
        const loadedDocument = await pdfjs.getDocument({ url }).promise as unknown as PDFDocumentProxy;
        if (cancelled) return;
        setInlinePdfDocument(loadedDocument);
      } catch (error) {
        if (cancelled) return;
        console.error('Inline PDF preview failed:', error);
        setInlinePdfError('We could not open this paper preview. You can still open the exam paper in a new tab.');
      } finally {
        if (!cancelled) setInlinePdfLoading(false);
      }
    };

    void loadDocument();

    return () => {
      cancelled = true;
      inlinePdfRenderTaskRef.current?.cancel?.();
    };
  }, [inlinePdfPaper, inlinePdfSource]);

  useEffect(() => {
    const document = inlinePdfDocument;
    const canvas = inlinePdfCanvasRef.current;
    if (!document || !canvas) return;

    let cancelled = false;

    const renderPage = async () => {
      try {
        inlinePdfRenderTaskRef.current?.cancel?.();
        const page = await document.getPage(inlinePdfPage);
        const containerWidth = canvas.parentElement?.clientWidth ?? 640;
        const viewportWidth = Math.max(420, containerWidth);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.7, Math.max(1.05, (viewportWidth - 32) / baseViewport.width));
        const viewport = page.getViewport({ scale });
        const pixelRatio = window.devicePixelRatio || 1;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas context unavailable');

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const task = page.render({ canvas, canvasContext: context, viewport });
        inlinePdfRenderTaskRef.current = task;
        await task.promise;
      } catch (error) {
        if (cancelled) return;
        console.error('Inline PDF page render failed:', error);
        setInlinePdfError('We hit a problem rendering this page. Try opening the exam paper in a new tab.');
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      inlinePdfRenderTaskRef.current?.cancel?.();
    };
  }, [inlinePdfDocument, inlinePdfPage]);

  useEffect(() => {
    if (!inlinePdfDocument) return;
    setInlinePdfJump(String(inlinePdfPage));
  }, [inlinePdfDocument, inlinePdfPage]);

  const goToInlinePdfPage = (pageNumber: number) => {
    if (!inlinePdfDocument) return;
    const nextPage = Math.min(Math.max(pageNumber, 1), inlinePdfDocument.numPages);
    setInlinePdfPage(nextPage);
  };

  const beginPaperFromPreview = (paper?: RevisionPaper, mode: RevisionMode = RevisionMode.EXAM) => {
    if (!paper) return;
    closeInlinePdf();
    startPaper(paper, mode);
  };

  const sharePaper = async (paper?: RevisionPaper) => {
    const url = paper ? paperPdfUrl(paper) : '';
    if (!paper || !url) {
      if (paper) startPaper(paper);
      return;
    }

    const payload = {
      title: String(paper.title || 'Soma AI paper'),
      text: `${paper.title || 'Soma AI paper'} - open this paper in Soma AI revision`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${payload.title}\n${payload.url}`);
        window.alert('Paper link copied.');
        return;
      }
    } catch (error) {
      console.warn('Paper share fallback failed:', error);
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(`${payload.title}\n${payload.url}`)}`, '_blank', 'noopener,noreferrer');
  };
  const startQuickPractice = () => {
    if (recommendation) return startPaper(recommendation, RevisionMode.LEARN);
    if (availableQuizzes[0]) return onStartSession(availableQuizzes[0], RevisionMode.LEARN);
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chooseTopic = (topic?: string) => {
    setSearchQuery(topic || '');
    setActiveSubject('All');
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveSubject('All');
    setStatusFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-[#f7f7fc] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <Helmet>
        <title>Revision Hub | Soma AI</title>
        <meta
          name="description"
          content="Open your best next revision activity, practise with Soma Original papers, review mistakes, and track readiness."
        />
      </Helmet>
      <RevisionHubNav
        firstName={firstName}
        grade={studentProfile?.grade}
        onHome={() => navigate('/')}
        onProfile={() => (onBack ? onBack() : onNavigate(ViewState.DASHBOARD))}
      />
      <main className="mx-auto max-w-[1180px] space-y-4 px-4 py-5 pb-20 sm:px-6 sm:py-6 lg:px-8">
        <RevisionHero
          greeting={getGreeting()}
          firstName={firstName}
          grade={studentProfile?.grade}
          terminology={terminology}
          recommendation={recommendation}
          recommendationReason={recommendationReason}
          recommendedTopic={hasHistory ? weakTopics[0] : undefined}
          hasHistory={hasHistory}
          unfinished={unfinished}
          onStart={() => startPaper(recommendation)}
          onContinue={(paper) => startPaper(paper)}
        />
        <QuickRevisionActions
          onExam={() => startPaper(recommendation)}
          onPractice={startQuickPractice}
          onTopic={() => chooseTopic()}
        />
        <div ref={libraryRef}>
          <RevisionPaperLibrary
            papers={filteredPapers}
            totalPapers={allPapers.length}
            subjects={subjects}
            activeSubject={activeSubject}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            loading={loading}
            filtersOpen={filtersOpen}
            onFiltersOpen={() => setFiltersOpen((current) => !current)}
            onSearch={setSearchQuery}
            onSubject={setActiveSubject}
            onStatus={setStatusFilter}
            onClear={clearFilters}
            onOpen={(paper) => startPaper(paper)}
            onViewPdf={(paper) => openPaperPdf(paper)}
            onShare={(paper) => void sharePaper(paper)}
          />
        </div>
        <ImprovementAndReadiness
          heading={terminology.improvementHeading}
          priorities={priorities}
          readiness={readiness}
          papersCompleted={papersCompleted}
          onPractice={chooseTopic}
        />
      </main>

      {inlinePdfPaper && (() => {
                const totalPages = inlinePdfDocument?.numPages || 0;
        return (
          <div className="fixed inset-0 z-[80] bg-slate-950/75 px-3 py-4 backdrop-blur-sm sm:px-4">
            <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                    {inlinePdfSource === 'paper' ? 'Read first, then attempt' : 'Marking guide'}
                  </p>
                  <h2 className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white sm:text-base">
                    {inlinePdfSource === 'paper' ? (inlinePdfPaper.title || 'Revision paper') : `Marking scheme - ${inlinePdfPaper.title || 'Revision paper'}`}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void sharePaper(inlinePdfPaper)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  {paperMarkingSchemeUrl(inlinePdfPaper) ? (
                    <button
                      type="button"
                      onClick={() => setInlinePdfSource((current) => (current === 'paper' ? 'marking_scheme' : 'paper'))}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-black text-white hover:bg-indigo-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {inlinePdfSource === 'paper' ? 'View marking scheme' : 'View question paper'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeInlinePdf}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                    aria-label="Close paper preview"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid flex-1 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-900 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
                <div className="flex min-h-0 flex-col border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:border-b-0 lg:border-r lg:border-slate-200 dark:lg:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => goToInlinePdfPage(inlinePdfPage - 1)}
                        disabled={!inlinePdfDocument || inlinePdfPage <= 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {inlinePdfLoading ? 'Loading paper...' : totalPages > 0 ? `Page ${inlinePdfPage} of ${totalPages}` : 'Preparing paper...'}
                      </div>
                      <button
                        type="button"
                        onClick={() => goToInlinePdfPage(inlinePdfPage + 1)}
                        disabled={!inlinePdfDocument || inlinePdfPage >= totalPages}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Jump to page
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(totalPages, 1)}
                        value={inlinePdfJump}
                        onChange={(event) => setInlinePdfJump(event.target.value)}
                        onBlur={() => {
                          const page = Number.parseInt(inlinePdfJump, 10);
                          if (Number.isFinite(page)) goToInlinePdfPage(page);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            const page = Number.parseInt(inlinePdfJump, 10);
                            if (Number.isFinite(page)) goToInlinePdfPage(page);
                          }
                        }}
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-slate-100 px-3 py-4 dark:bg-slate-900">
                    <div className="mx-auto flex w-full justify-center">
                      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950">
                        {inlinePdfError ? (
                          <div className="flex min-h-[56vh] max-w-3xl items-center justify-center p-8 text-center text-sm font-medium text-slate-500">
                            {inlinePdfError}
                          </div>
                        ) : (
                          <canvas ref={inlinePdfCanvasRef} className="block max-w-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-900 sm:px-5">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                      What to do next
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                      Read first, then attempt.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Scan the paper, check the diagrams, and only then start the timed attempt so the learner feels guided rather than dropped into a dashboard.
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2">
                        <BookOpen className="mt-0.5 h-4 w-4 text-indigo-600" />
                        <span>Use the page controls to move through the paper without losing your place.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 text-indigo-600" />
                        <span>Switch between the question paper and marking scheme without leaving the app.</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                      Question guide
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                      {inlinePdfQuestions.length > 0
                        ? `${inlinePdfQuestions.length} question${inlinePdfQuestions.length === 1 ? '' : 's'} ? ${inlinePdfPaper.total_marks || 'unknown'} marks available`
                        : 'Quick mark-earning tips'}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Keep the paper on the left and use this rail to spot the structure, the topics, and the marks before you attempt.
                    </p>

                    {inlinePdfSections.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {inlinePdfSections.map((section) => (
                          <span key={section} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700">
                            {section}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      {inlinePdfQuestions.length > 0 ? inlinePdfQuestions.slice(0, 5).map((question, index) => {
                        const questionNumber = String((question as any)?.number || index + 1);
                        const questionText = String((question as any)?.text || '').trim();
                        const questionTopic = String((question as any)?.topic || '').trim();
                        const questionType = String((question as any)?.questionType || '').replaceAll('_', ' ').trim();
                        const questionMarks = Number((question as any)?.marks || 1) || 1;
                        return (
                          <div key={`${questionNumber}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Q{questionNumber}</p>
                                <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                                  {questionText || 'Question details loading'}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                                {questionMarks} mark{questionMarks === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                              {questionTopic && <span className="rounded-full bg-white px-2 py-1 dark:bg-slate-950">{questionTopic}</span>}
                              {questionType && <span className="rounded-full bg-white px-2 py-1 dark:bg-slate-950">{questionType}</span>}
                              {Boolean((question as any)?.diagramUrl || (question as any)?.diagram_url) && <span className="rounded-full bg-white px-2 py-1 dark:bg-slate-950">diagram</span>}
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                          No question structure is available yet. Open the marking scheme for answer guidance or start the paper to revise in exam mode.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {inlinePdfGuideTips.map((tip) => (
                        <div key={tip} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <button
                      type="button"
                      onClick={() => beginPaperFromPreview(inlinePdfPaper, RevisionMode.EXAM)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
                    >
                      Start timed exam
                    </button>
                    <button
                      type="button"
                      onClick={() => beginPaperFromPreview(inlinePdfPaper, RevisionMode.LEARN)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-950/70"
                    >
                      Practice this paper
                    </button>
                    <button
                      type="button"
                      onClick={() => setInlinePdfSource((current) => (current === 'paper' ? 'marking_scheme' : 'paper'))}
                      disabled={!paperMarkingSchemeUrl(inlinePdfPaper)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      {inlinePdfSource === 'paper' ? 'Open marking scheme' : 'Open question paper'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sharePaper(inlinePdfPaper)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <Share2 className="h-4 w-4" />
                      Share paper
                    </button>
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Paper notes
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <span>Paper format</span>
                        <span className="font-black text-slate-900 dark:text-white">{paperAttemptStatus(inlinePdfPaper)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span>Diagrams</span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {paperHasDiagrams(inlinePdfPaper) ? 'Shown in paper' : 'Not detected'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span>Learner access</span>
                        <span className="font-black text-slate-900 dark:text-white">Ready to read and share</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
