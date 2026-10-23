import type { ExamPathway } from './examPrepState';

/**
 * KNEC 2026 timetable data, as supplied by the Soma team from the published
 * KNEC timetables (e.g. https://www.knec.ac.ke/wp-content/uploads/2026/02/2026-KPSEA-TIMETABLE.pdf).
 * Dates are ISO calendar days in Kenya. Update here when KNEC publishes changes.
 */
export type TimetableDay = { date: string; label: string; subjects: string[] };
export type OfficialExam = {
  pathway: ExamPathway;
  title: string;
  /** Learner-facing "main exam starts" date used for the countdown. */
  start: string;
  end: string;
  rehearsal?: string;
  /** Per-day papers, when KNEC publishes them. */
  days: TimetableDay[];
  notes?: string[];
};

export const OFFICIAL_2026: Partial<Record<ExamPathway, OfficialExam>> = {
  KPSEA: {
    pathway: 'KPSEA',
    title: 'KPSEA 2026',
    start: '2026-10-26',
    end: '2026-10-28',
    rehearsal: '2026-10-23',
    days: [
      { date: '2026-10-26', label: 'Day 1', subjects: ['Mathematics', 'English'] },
      { date: '2026-10-27', label: 'Day 2', subjects: ['Integrated Science', 'Kiswahili / Kenyan Sign Language'] },
      { date: '2026-10-28', label: 'Day 3', subjects: ['Creative Arts', 'Social Studies'] },
    ],
  },
  KJSEA: {
    pathway: 'KJSEA',
    title: 'KJSEA 2026',
    start: '2026-10-26',
    end: '2026-10-30',
    rehearsal: '2026-10-23',
    days: [
      { date: '2026-10-26', label: 'Monday', subjects: ['English'] },
      { date: '2026-10-27', label: 'Tuesday', subjects: ['Kiswahili / Kenyan Sign Language'] },
      { date: '2026-10-28', label: 'Wednesday', subjects: ['Mathematics', 'Agriculture'] },
      { date: '2026-10-29', label: 'Thursday', subjects: ['Integrated Science', 'Social Studies', 'Creative Arts & Sport'] },
      { date: '2026-10-30', label: 'Friday', subjects: ['Pre-technical Studies', 'Religious Education (CRE/HRE)', 'Integrated Science'] },
    ],
  },
  KCSE: {
    pathway: 'KCSE',
    title: 'KCSE 2026',
    start: '2026-11-02',
    end: '2026-11-20',
    rehearsal: '2026-10-16',
    days: [],
    notes: [
      'Oral and practical papers: 19 to 26 October 2026 (including French, German, Arabic, Kenyan Sign Language and Music).',
      'Main written papers: 2 to 20 November 2026. Check your school’s timetable for your exact paper dates.',
    ],
  },
};

export const officialExam = (pathway: ExamPathway) => OFFICIAL_2026[pathway] || null;

/** Match the app's subject names to the names KNEC uses on its timetable. */
const normal = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ALIASES: Record<string, string[]> = {
  'science and technology': ['integrated science'],
  kiswahili: ['kiswahili kenyan sign language'],
  'creative arts': ['creative arts and sport', 'creative arts'],
  cre: ['religious education'],
};

export function paperDates(pathway: ExamPathway, subject: string): TimetableDay[] {
  const exam = officialExam(pathway);
  if (!exam) return [];
  const wanted = [normal(subject), ...(ALIASES[normal(subject)] || [])];
  return exam.days.filter((d) =>
    d.subjects.some((s) => {
      const n = normal(s);
      return wanted.some((w) => n === w || n.startsWith(`${w} `) || w.startsWith(`${n} `));
    })
  );
}

export const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
