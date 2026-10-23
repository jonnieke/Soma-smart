import { beforeEach, describe, expect, it } from 'vitest';
import {
  daysUntil,
  emptyProgress,
  mergeProgress,
  parseProgress,
  phaseFor,
  planFor,
  readProgress,
  recordPractice,
  sameProgress,
  saveProgress,
  setExamDate,
  streak,
  weakTopics,
} from '../features/revision/candidatePlan';
import type { PrepSession } from '../features/revision/examPrepState';

const session = (needsHelp: boolean[], reviewed: boolean[]): PrepSession => ({
  version: 1,
  grade: 'Form 4',
  exam: 'KCSE',
  subject: 'Mathematics',
  topic: 'Algebra',
  questions: needsHelp.map((_, i) => ({
    number: i + 1,
    text: 'q',
    topic: i === 0 ? 'Quadratics' : 'Algebra',
    marks: 2,
    modelAnswerOutline: 'a',
  })) as PrepSession['questions'],
  answers: needsHelp.map(() => 'x'),
  reviewed,
  needsHelp,
  deadline: 0,
  completed: true,
});

beforeEach(() => localStorage.clear());

describe('exam countdown and phase', () => {
  it('counts whole calendar days and never drifts with the clock time', () => {
    expect(daysUntil('2026-11-10', new Date(2026, 10, 3, 23, 59))).toBe(7);
    expect(daysUntil('2026-11-10', new Date(2026, 10, 10, 0, 1))).toBe(0);
    expect(daysUntil('2026-11-10', new Date(2026, 10, 12, 9, 0))).toBe(-2);
  });
  it('chooses a study phase from days remaining', () => {
    expect([200, 90, 30, 7, 0].map(phaseFor)).toEqual(['foundation', 'practice', 'sprint', 'final', 'final']);
  });
  it('gives an honest generic plan when no date is set', () => {
    expect(planFor(null, 'KCSE').headline).toMatch(/Set your exam date/);
  });
});

describe('weak topics', () => {
  it('raises flagged topics and lowers them after a clean review', () => {
    let p = recordPractice(emptyProgress(), session([true, false], [true, true]), '2026-10-01');
    expect(weakTopics(p, 'Mathematics')).toEqual([{ topic: 'Quadratics', count: 1 }]);
    p = recordPractice(p, session([false, false], [true, true]), '2026-10-02');
    expect(weakTopics(p, 'Mathematics')).toEqual([]);
    expect(p.practisedCount).toBe(2);
  });
  it('keeps subjects separate and ranks by frequency', () => {
    let p = recordPractice(emptyProgress(), session([true, true], [false, false]), '2026-10-01');
    p = recordPractice(p, session([true, false], [false, false]), '2026-10-02');
    expect(weakTopics(p, 'Mathematics')[0]).toEqual({ topic: 'Quadratics', count: 2 });
    expect(weakTopics(p, 'Biology')).toEqual([]);
  });
});

describe('streak', () => {
  it('counts consecutive days and survives until the end of today', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03'];
    expect(streak(days, '2026-10-03')).toBe(3);
    expect(streak(days, '2026-10-04')).toBe(3);
    expect(streak(days, '2026-10-06')).toBe(0);
  });
});

describe('storage', () => {
  it('round-trips, isolates owners and rejects corrupted data', () => {
    saveProgress('a', setExamDate(emptyProgress(), '2026-11-04'));
    expect(readProgress('a').examDate).toBe('2026-11-04');
    expect(readProgress('b').examDate).toBeNull();
    localStorage.setItem('soma_candidate_progress_v1:bad', '{');
    expect(readProgress('bad')).toEqual(emptyProgress());
    expect(setExamDate(emptyProgress(), 'not-a-date').examDate).toBeNull();
  });
});

describe('syncing a device with the database', () => {
  const p = (over = {}) => ({ ...emptyProgress(), ...over });
  it('lets the newer copy decide the date and weak topics', () => {
    const local = p({ examDate: '2026-11-02', weak: { 'Mathematics||A': 1 }, updatedAt: 200 });
    const remote = p({ examDate: '2026-10-26', weak: { 'Mathematics||B': 2 }, updatedAt: 100 });
    expect(mergeProgress(local, remote)).toMatchObject({ examDate: '2026-11-02', weak: { 'Mathematics||A': 1 }, updatedAt: 200 });
    expect(mergeProgress(remote, local)).toMatchObject({ examDate: '2026-11-02' });
  });
  it('never loses a study day or a completed practice', () => {
    const merged = mergeProgress(
      p({ practisedDays: ['2026-10-01', '2026-10-03'], practisedCount: 2, updatedAt: 5 }),
      p({ practisedDays: ['2026-10-02', '2026-10-03'], practisedCount: 3, updatedAt: 9 })
    );
    expect(merged.practisedDays).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
    expect(merged.practisedCount).toBe(3);
  });
  it('keeps the device copy when the server has nothing', () => {
    const local = p({ examDate: '2026-11-02', updatedAt: 1 });
    expect(mergeProgress(local, null)).toBe(local);
  });
  it('sanitises untrusted server data', () => {
    const clean = parseProgress({ examDate: 'drop table', weak: { a: 500, b: -1, c: 'x' }, practisedDays: ['2026-10-01', 7], practisedCount: -4, updatedAt: 'now' });
    expect(clean).toMatchObject({ examDate: null, weak: { a: 99 }, practisedDays: ['2026-10-01'], practisedCount: 0, updatedAt: 0 });
    expect(parseProgress(null)).toBeNull();
  });
  it('compares progress regardless of key order', () => {
    expect(sameProgress(p({ weak: { a: 1, b: 2 } }), p({ weak: { b: 2, a: 1 } }))).toBe(true);
    expect(sameProgress(p({ examDate: '2026-11-02' }), p())).toBe(false);
  });
});