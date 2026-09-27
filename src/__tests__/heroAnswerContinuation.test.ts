import { describe, expect, it } from 'vitest';
import { heroAnswerContinuation } from '../features/learner/answer/heroAnswerContinuation';

const answer = { query: 'What is erosion?', answer: 'Erosion transports loosened material.\n\n**Agents:** water and wind.', isGenerating: false, show: true };

describe('homepage answer continuation', () => {
  it('preserves the exact topic and full answer for the learning screen', () => {
    expect(heroAnswerContinuation(true, answer)).toEqual({ topic: answer.query, explanation: answer.answer, summaryPoints: [], level: 'Simple', relatedTopics: [] });
  });
  it('waits for sign-in then resumes the same answer', () => {
    expect(heroAnswerContinuation(false, answer)).toBeNull();
    expect(heroAnswerContinuation(true, answer)?.explanation).toBe(answer.answer);
  });
  it('does not interrupt generation, dismissed answers or auto-practice', () => {
    expect(heroAnswerContinuation(true, { ...answer, isGenerating: true })).toBeNull();
    expect(heroAnswerContinuation(true, { ...answer, show: false })).toBeNull();
    expect(heroAnswerContinuation(true, { ...answer, answer: null })).toBeNull();
    expect(heroAnswerContinuation(true, { ...answer, answer: ' ' })).toBeNull();
  });
});
