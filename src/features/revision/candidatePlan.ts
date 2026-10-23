import type { PrepSession, ExamPathway } from './examPrepState';

/**
 * Candidate study planning. Everything here is derived from data the learner
 * actually provided (their own exam date) or produced (questions they flagged
 * as needing help). Nothing is guessed or invented.
 */
export type StudyPhase = 'foundation' | 'practice' | 'sprint' | 'final';

export type CandidateProgress = {
  version: 1;
  /** ISO date (YYYY-MM-DD) entered by the learner. Never defaulted. */
  examDate: string | null;
  /** "subject||topic" -> number of times flagged as needing help (net of later successes). */
  weak: Record<string, number>;
  /** Distinct local days (YYYY-MM-DD) on which a practice was completed. */
  practisedDays: string[];
  practisedCount: number;
  /** Epoch ms of the last change made by the learner; the newer copy wins when syncing. */
  updatedAt: number;
};

export const emptyProgress = (): CandidateProgress => ({
  version: 1,
  examDate: null,
  weak: {},
  practisedDays: [],
  practisedCount: 0,
  updatedAt: 0,
});

const keyFor = (owner: string) => `soma_candidate_progress_v1:${encodeURIComponent(owner)}`;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const weakKey = (subject: string, topic: string) => `${subject}||${topic}`;

export const todayKey = (now = new Date()) => {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
};

const dayNumber = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
};

/** Whole calendar days from `now` until the ISO date (0 = exam today, negative = passed). */
export const daysUntil = (iso: string, now = new Date()) => dayNumber(iso) - dayNumber(todayKey(now));

export const phaseFor = (days: number): StudyPhase =>
  days <= 7 ? 'final' : days <= 30 ? 'sprint' : days <= 90 ? 'practice' : 'foundation';

export const PHASE_LABEL: Record<StudyPhase, string> = {
  foundation: 'Build foundations',
  practice: 'Practise under pressure',
  sprint: 'Exam sprint',
  final: 'Final week',
};

/** Validate untrusted progress (from storage or the server) into a safe shape. */
export function parseProgress(raw: unknown): CandidateProgress | null {
  const s = raw as Record<string, any> | null;
  if (!s || typeof s !== 'object') return null;
  const weak: Record<string, number> = {};
  if (s.weak && typeof s.weak === 'object') {
    for (const [k, v] of Object.entries(s.weak)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) weak[k] = Math.min(Math.floor(v), 99);
    }
  }
  return {
    version: 1,
    examDate: typeof s.examDate === 'string' && DATE_RE.test(s.examDate) ? s.examDate : null,
    weak,
    practisedDays: Array.isArray(s.practisedDays)
      ? s.practisedDays.filter((d: unknown) => typeof d === 'string' && DATE_RE.test(d)).slice(-120)
      : [],
    practisedCount:
      Number.isFinite(s.practisedCount) && s.practisedCount > 0 ? Math.floor(s.practisedCount) : 0,
    updatedAt: Number.isFinite(s.updatedAt) && s.updatedAt > 0 ? Math.floor(s.updatedAt) : 0,
  };
}

export function readProgress(owner: string): CandidateProgress {
  try {
    const s = JSON.parse(localStorage.getItem(keyFor(owner)) || 'null');
    return (s && s.version === 1 && parseProgress(s)) || emptyProgress();
  } catch {
    return emptyProgress();
  }
}
export function saveProgress(owner: string, progress: CandidateProgress): boolean {
  try {
    localStorage.setItem(keyFor(owner), JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export const setExamDate = (
  progress: CandidateProgress,
  iso: string | null,
  now = Date.now()
): CandidateProgress => ({
  ...progress,
  examDate: iso && DATE_RE.test(iso) ? iso : null,
  updatedAt: now,
});

/**
 * Merge a device copy with the server copy. The more recently edited copy decides
 * the exam date and weak topics; study days are unioned so none are ever lost.
 */
export function mergeProgress(local: CandidateProgress, remote: CandidateProgress | null): CandidateProgress {
  if (!remote) return local;
  const newer = remote.updatedAt > local.updatedAt ? remote : local;
  const days = Array.from(new Set([...local.practisedDays, ...remote.practisedDays])).sort().slice(-120);
  return {
    version: 1,
    examDate: newer.examDate,
    weak: { ...newer.weak },
    practisedDays: days,
    practisedCount: Math.max(local.practisedCount, remote.practisedCount),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}

const canonical = (p: CandidateProgress) =>
  JSON.stringify([
    p.examDate,
    Object.entries(p.weak).sort(([a], [b]) => a.localeCompare(b)),
    [...p.practisedDays].sort(),
    p.practisedCount,
    p.updatedAt,
  ]);

export const sameProgress = (a: CandidateProgress, b: CandidateProgress) => canonical(a) === canonical(b);

/**
 * Fold one finished practice into the progress. Questions flagged "needs help"
 * raise a topic's weak count; reviewed questions that were not flagged lower it.
 */
export function recordPractice(
  progress: CandidateProgress,
  session: PrepSession,
  today = todayKey(),
  now = Date.now()
): CandidateProgress {
  const weak = { ...progress.weak };
  session.questions.forEach((q, i) => {
    const topic = String(q.topic || session.topic || '').trim();
    if (!topic) return;
    const key = weakKey(session.subject, topic);
    if (session.needsHelp[i]) weak[key] = Math.min((weak[key] || 0) + 1, 99);
    else if (session.reviewed[i] && weak[key]) {
      if (weak[key] <= 1) delete weak[key];
      else weak[key] -= 1;
    }
  });
  const days = progress.practisedDays.includes(today)
    ? progress.practisedDays
    : [...progress.practisedDays, today].slice(-120);
  return {
    ...progress,
    weak,
    practisedDays: days,
    practisedCount: progress.practisedCount + 1,
    updatedAt: now,
  };
}

export function weakTopics(progress: CandidateProgress, subject: string, limit = 4) {
  return Object.entries(progress.weak)
    .filter(([k]) => k.startsWith(`${subject}||`))
    .map(([k, count]) => ({ topic: k.slice(subject.length + 2), count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))
    .slice(0, limit);
}

/** Consecutive study days ending today (or yesterday, so the streak is not lost before today's session). */
export function streak(days: string[], today = todayKey()) {
  const set = new Set(days);
  let cursor = dayNumber(today);
  const iso = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
  if (!set.has(iso(cursor))) cursor -= 1;
  let count = 0;
  while (set.has(iso(cursor))) {
    count += 1;
    cursor -= 1;
  }
  return count;
}

export type DailyPlan = { headline: string; minutes: number; steps: [string, string, string] };

export function planFor(phase: StudyPhase | null, exam: ExamPathway, weakTopic?: string): DailyPlan {
  const warm = weakTopic
    ? `Warm up on your weak spot: ${weakTopic}`
    : 'Warm up with a 10-minute practice on one topic';
  const fix = 'Review every mistake with Akili and flag what you still need help with';
  const paper = exam === 'KPSEA' ? 'KPSEA-style' : exam === 'KJSEA' ? 'KJSEA-style' : 'KCSE-style';
  switch (phase) {
    case 'final':
      return {
        headline: 'Final week: stay sharp and calm',
        minutes: 45,
        steps: [warm, 'Re-read your short notes and the questions you got wrong before', 'Sleep early. Pack your ID, pens and calculator.'],
      };
    case 'sprint':
      return {
        headline: 'Exam sprint: practise like it is the real day',
        minutes: 90,
        steps: [warm, `Sit one full timed ${paper} paper this week, no notes`, fix],
      };
    case 'practice':
      return {
        headline: 'Practise under pressure, then fix the gaps',
        minutes: 75,
        steps: [warm, `Do one timed section of a ${paper} past paper`, fix],
      };
    case 'foundation':
      return {
        headline: 'Build solid foundations, one topic at a time',
        minutes: 60,
        steps: [warm, 'Read the notes for that topic, then try past-paper questions on it', fix],
      };
    default:
      return {
        headline: 'Set your exam date to get a daily plan',
        minutes: 60,
        steps: [warm, `Try a past-paper question in ${paper} style`, fix],
      };
  }
}
