import type { PracticeQuestion } from '../../services/geminiService';
export const GRADES = [
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Form 1',
  'Form 2',
  'Form 3',
  'Form 4',
];
export type ExamPathway = 'KPSEA' | 'KJSEA' | 'KCSE' | 'CBC';
export const pathwayForGrade = (grade: string): ExamPathway =>
  /^Grade [4-6]$/.test(grade) ? 'KPSEA' : /^Grade [7-9]$/.test(grade) ? 'KJSEA' : /^Grade 1[0-2]$/.test(grade) ? 'CBC' : 'KCSE';
export const subjectsFor = (exam: ExamPathway) =>
  exam === 'KCSE' || exam === 'CBC'
    ? [
        'Mathematics',
        'English',
        'Kiswahili',
        'Biology',
        'Chemistry',
        'Physics',
        'Geography',
        'History',
        'CRE',
        'IRE',
        'Agriculture',
        'Business Studies',
        'Computer Studies',
      ]
    : [
        'Mathematics',
        'English',
        'Kiswahili',
        exam === 'KJSEA' ? 'Integrated Science' : 'Science and Technology',
        'Social Studies',
        'CRE',
        'IRE',
        'Agriculture',
        'Creative Arts',
      ];
export type PrepSession = {
  version: 1;
  grade: string;
  subject: string;
  exam: ExamPathway;
  topic: string;
  questions: PracticeQuestion[];
  answers: string[];
  reviewed: boolean[];
  needsHelp: boolean[];
  deadline: number;
  completed: boolean;
};
const keyFor = (owner: string) => `soma_exam_prep_v1:${encodeURIComponent(owner)}`;
export function readPrepSession(owner: string): PrepSession | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(keyFor(owner)) || 'null');
    if (
      !s ||
      s.version !== 1 ||
      !GRADES.includes(s.grade) ||
      !['KPSEA', 'KJSEA', 'KCSE', 'CBC'].includes(s.exam) ||
      typeof s.subject !== 'string' ||
      typeof s.topic !== 'string' ||
      !Number.isFinite(s.deadline) ||
      typeof s.completed !== 'boolean' ||
      !Array.isArray(s.questions) ||
      !s.questions.length ||
      s.questions.length > 10 ||
      !s.questions.every(
        (q: PracticeQuestion) =>
          q &&
          typeof q.text === 'string' &&
          typeof q.modelAnswerOutline === 'string' &&
          Number.isFinite(q.marks)
      ) ||
      !['answers', 'reviewed', 'needsHelp'].every(
        (k) => Array.isArray(s[k]) && s[k].length === s.questions.length
      ) ||
      !s.answers.every((a: unknown) => typeof a === 'string') ||
      !s.reviewed.every((a: unknown) => typeof a === 'boolean') ||
      !s.needsHelp.every((a: unknown) => typeof a === 'boolean')
    )
      return null;
    return s;
  } catch {
    return null;
  }
}
export function savePrepSession(owner: string, session: PrepSession): boolean {
  try {
    sessionStorage.setItem(keyFor(owner), JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}
export function remainingSeconds(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
