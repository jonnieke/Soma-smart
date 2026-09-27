import type { ExplanationResult } from '../../../types';

export function heroAnswerContinuation(isRegistered: boolean, answer: {
  query: string;
  answer: string | null;
  isGenerating: boolean;
  show: boolean;
}): ExplanationResult | null {
  if (!isRegistered || !answer.show || answer.isGenerating || !answer.answer?.trim()) return null;
  return {
    topic: answer.query,
    explanation: answer.answer,
    summaryPoints: [],
    level: 'Simple',
    relatedTopics: [],
  };
}
