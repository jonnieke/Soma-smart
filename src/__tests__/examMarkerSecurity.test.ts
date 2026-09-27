import { describe, expect, it } from 'vitest';
import { mayMarkAttempt, validateMarking } from '../../supabase/functions/mark-exam-response/validation';
const attempt = { status: 'IN_PROGRESS', learner_id: 'owner', exam_id: 419, mode: 'TIMED_QUIZ', selected_questions: ['Q1'] };
const exam = { id: 419, type: 'PAST_PAPER', review_status: 'PUBLISHED' };
describe('exam marking authorization', () => {
  it('allows only a selected question on an owned open published attempt', () => {
    expect(mayMarkAttempt(attempt, exam, 'owner', false, 'Q1')).toBe(true);
    expect(mayMarkAttempt(attempt, exam, 'stranger', true, 'Q1')).toBe(false);
    expect(mayMarkAttempt(attempt, exam, 'owner', false, 'Q2')).toBe(false);
    expect(mayMarkAttempt({ ...attempt, status: 'SUBMITTED' }, exam, 'owner', true, 'Q1')).toBe(false);
    expect(mayMarkAttempt(attempt, { ...exam, id: 420 }, 'owner', true, 'Q1')).toBe(false);
  });
  it('allows drafts only for verified admins in their own admin test', () => {
    const draft = { ...exam, review_status: 'DRAFT' };
    expect(mayMarkAttempt(attempt, draft, 'owner', true, 'Q1')).toBe(false);
    expect(mayMarkAttempt({ ...attempt, mode: 'ADMIN_TEST' }, draft, 'owner', false, 'Q1')).toBe(false);
    expect(mayMarkAttempt({ ...attempt, mode: 'ADMIN_TEST' }, draft, 'owner', true, 'Q1')).toBe(true);
  });
});
describe('marking result validation', () => {
  const result = { marksAwarded: 2, feedback: 'Correct method; calculation error.', modelAnswer: '3' };
  it('retains partial marks and uses the paper allocation, not the model allocation', () => {
    expect(validateMarking({ ...result, marksAvailable: 100, isCorrect: true }, 4)).toMatchObject({ marksAwarded: 2, marksAvailable: 4, isCorrect: false });
  });
  it.each([undefined, null, NaN, -1, 5, '4', Infinity])('rejects invalid marks %s rather than silently awarding zero', marksAwarded => {
    expect(() => validateMarking({ ...result, marksAwarded }, 4)).toThrow();
  });
  it('rejects missing feedback and accepts a valid zero', () => {
    expect(() => validateMarking({ ...result, feedback: '' }, 4)).toThrow();
    expect(validateMarking({ ...result, marksAwarded: 0 }, 4).marksAwarded).toBe(0);
  });
});
