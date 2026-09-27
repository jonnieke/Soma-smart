import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listTimedExams, readTimedExam, removeTimedExam, saveTimedExam, type TimedExamRecovery } from '../features/revision/timedExamRecovery';

const draft: TimedExamRecovery = { version: 1, examId: '419', attemptId: 'attempt',
  questionIds: ['q1'], answers: { q1: 'Working' }, index: 0, startedAt: 1000,
  deadline: 61000, timeLimit: 60, submitting: false };
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
describe('timed exam browser recovery', () => {
  it('isolates accounts and lists only the current learner’s papers', () => {
    expect(saveTimedExam('learner A', draft)).toBe(true);
    expect(readTimedExam('learner B', '419')).toBeNull();
    expect(listTimedExams('learner B')).toEqual([]);
    expect(listTimedExams('learner A')).toEqual([draft]);
    removeTimedExam('learner B', '419');
    expect(readTimedExam('learner A', '419')).toEqual(draft);
    removeTimedExam('learner A', '419');
    expect(listTimedExams('learner A')).toEqual([]);
  });
  it('does not share recovery under a guest identity', () => {
    expect(saveTimedExam('guest', draft)).toBe(false);
    expect(readTimedExam('guest', '419')).toBeNull();
  });
  it('rejects malformed recovery records', () => {
    saveTimedExam('A', { ...draft, index: 9 });
    expect(readTimedExam('A', '419')).toBeNull();
    saveTimedExam('A', { ...draft, deadline: NaN });
    expect(listTimedExams('A')).toEqual([]);
  });
  it('reports storage failures without crashing the exam', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
    expect(saveTimedExam('A', draft)).toBe(false);
  });
});
