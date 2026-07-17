import { EducationLevel, ExamPracticeMode, PerformanceRecord } from '../../../types';

export type RevisionPaper = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  subject?: string;
  grade?: string;
  type?: string;
  exam_type?: string;
  fileUrl?: string;
  file_url?: string;
  filePath?: string;
  file_path?: string;
  markingSchemeUrl?: string;
  marking_scheme_url?: string;
  duration_minutes?: number;
  total_marks?: number;
  structured_questions?: unknown[];
  attempt_status?: string;
  progress_completed?: number;
  progress_total?: number;
  score?: number;
};

export type RevisionTerminology = {
  programmeLabel: string;
  subjectLabel: string;
  contentLabel: string;
  targetLabel: string;
  improvementHeading: string;
};

const PERFORMANCE_STORAGE_KEY = 'somo_performance_records';

export const loadRevisionPerformance = (): PerformanceRecord[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PERFORMANCE_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getRevisionTerminology = (
  educationLevel: EducationLevel,
  grade?: string
): RevisionTerminology => {
  const normalizedGrade = String(grade || '').toLowerCase();
  const isCampus = educationLevel === EducationLevel.CAMPUS;
  const isCompetency = /pp|grade\s*[1-9]|kpsea|kjsea/.test(normalizedGrade);

  if (isCampus) {
    return {
      programmeLabel: 'programme',
      subjectLabel: 'course',
      contentLabel: 'assessment',
      targetLabel: 'target score',
      improvementHeading: 'Your Best Improvement Opportunities',
    };
  }

  if (isCompetency) {
    return {
      programmeLabel: 'grade',
      subjectLabel: 'learning area',
      contentLabel: 'assessment',
      targetLabel: 'target level',
      improvementHeading: 'Your Priority Skills',
    };
  }

  return {
    programmeLabel: 'level',
    subjectLabel: 'subject',
    contentLabel: 'paper',
    targetLabel: 'target grade',
    improvementHeading: 'Marks You Can Recover',
  };
};

export const normalizePaperSubject = (paper: RevisionPaper): string => {
  const raw = String(paper.subject || '').trim();
  if (raw && !/^(all|general|null|undefined|none)$/i.test(raw)) return raw;

  const searchable = `${paper.title || ''}`;
  const knownSubjects = [
    'Mathematics',
    'English',
    'Kiswahili',
    'Science',
    'Integrated Science',
    'Biology',
    'Chemistry',
    'Physics',
    'Geography',
    'History',
    'Agriculture',
    'Business Studies',
    'Religious Education',
    'Computer Studies',
  ];
  return (
    knownSubjects.find((subject) => searchable.toLowerCase().includes(subject.toLowerCase())) ||
    'General'
  );
};

export const paperQuestionCount = (paper: RevisionPaper): number => {
  if (Array.isArray(paper.structured_questions)) return paper.structured_questions.length;
  const value = Number(paper.question_count || 0);
  return Number.isFinite(value) ? value : 0;
};

export const paperDuration = (paper: RevisionPaper): number => {
  const value = Number(paper.duration_minutes || paper.durationMinutes || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export const paperContentType = (paper: RevisionPaper): string => {
  const title = String(paper.title || '').toLowerCase();
  const rawType = String(paper.exam_type || paper.type || '')
    .replaceAll('_', ' ')
    .trim();
  if (title.includes('mock')) return 'Original mock';
  if (title.includes('practice')) return 'Practice set';
  if (title.includes('assessment')) return 'Assessment';
  return rawType && rawType.toUpperCase() !== 'PAST PAPER' ? rawType : 'Revision paper';
};


export const paperPdfUrl = (paper: RevisionPaper): string =>
  String(paper.file_url || paper.fileUrl || '').trim();

export const paperHasDiagrams = (paper: RevisionPaper): boolean =>
  Array.isArray(paper.structured_questions) &&
  paper.structured_questions.some((question) =>
    Boolean(String((question as any)?.diagramUrl || (question as any)?.diagram_url || '').trim())
  );
export const paperAttemptStatus = (
  paper: RevisionPaper
): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' => {
  const status = String(paper.attempt_status || '').toUpperCase();
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
  return 'NOT_STARTED';
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const pickRecommendedPaper = (
  papers: RevisionPaper[],
  performance: PerformanceRecord[],
  weakTopics: string[]
): RevisionPaper | undefined => {
  if (!papers.length) return undefined;
  const latest = [...performance].sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
  const topic = weakTopics[0]?.toLowerCase();

  return (
    papers.find(
      (paper) =>
        topic &&
        String(paper.title || '')
          .toLowerCase()
          .includes(topic)
    ) ||
    papers.find(
      (paper) =>
        latest?.subject &&
        normalizePaperSubject(paper).toLowerCase() === latest.subject.toLowerCase()
    ) ||
    papers[0]
  );
};

export const getRecommendationReason = (
  paper: RevisionPaper | undefined,
  performance: PerformanceRecord[],
  weakTopics: string[]
): string => {
  if (!performance.length) {
    return paper
      ? 'This is a suitable starting point for your current level.'
      : 'Choose a subject to begin building your revision plan.';
  }
  if (weakTopics[0]) return `${weakTopics[0]} needs attention based on your recent attempts.`;
  return 'This follows the subject from your most recent assessment.';
};

export const getReadiness = (performance: PerformanceRecord[]) => {
  if (!performance.length) {
    return {
      status: 'Getting Started',
      score: null as number | null,
      sessions: 0,
      recommendation:
        'Complete one assessment to unlock an honest readiness estimate and personalised next steps.',
    };
  }

  const recent = [...performance].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5);
  const score = Math.round(recent.reduce((sum, item) => sum + item.score, 0) / recent.length);
  const status =
    score >= 80
      ? 'Exam Ready'
      : score >= 65
        ? 'On Track'
        : score >= 45
          ? 'Building'
          : 'Getting Started';
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sessions = performance.filter((item) => +new Date(item.date) >= weekAgo).length;

  return {
    status,
    score,
    sessions,
    recommendation:
      score >= 65
        ? 'Keep your momentum: complete one full assessment and one focused practice set this week.'
        : 'Your next best step is one full assessment followed by practice on the mistakes it reveals.',
  };
};

export const isFullPaperMode = (record: PerformanceRecord): boolean =>
  record.mode === ExamPracticeMode.FULL_PAPER;
