import React, { useMemo, useRef, useState } from 'react';
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
  pickRecommendedPaper,
  RevisionPaper,
} from './hub/revisionHubModel';

interface Props {
  onStartSession: (data: File | TeacherActivity, mode: RevisionMode) => void;
  onNavigate: (view: ViewState) => void;
  onBack?: () => void;
  initialSubject?: string;
  initialSearchQuery?: string;
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

  const startPaper = (paper?: RevisionPaper, mode: RevisionMode = RevisionMode.EXAM) => {
    if (!paper) {
      libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    onStartSession(paper as unknown as TeacherActivity, mode);
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
    </div>
  );
};
