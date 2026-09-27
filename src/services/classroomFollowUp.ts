import type { ExplanationResult } from '../types';

/** Paragraph boundaries are application-owned, not dependent on generated newlines. */
export function parseClassroomFollowUp(raw: unknown, level: 'Simple' | 'Exam'): ExplanationResult {
  const value = raw as Record<string, unknown> | null;
  if (
    !value ||
    typeof value.topic !== 'string' ||
    !value.topic.trim() ||
    !Array.isArray(value.explanationParagraphs) ||
    value.explanationParagraphs.length === 0 ||
    value.explanationParagraphs.some((part) => typeof part !== 'string' || !part.trim())
  ) {
    throw new Error('Akili returned an incomplete lesson. Please try again.');
  }
  const strings = (input: unknown): string[] =>
    Array.isArray(input)
      ? input.filter((item): item is string => typeof item === 'string' && !!item.trim())
      : [];
  return {
    topic: value.topic.trim(),
    // A paragraph must not accidentally become a Markdown heading containing the entire answer.
    explanation: (value.explanationParagraphs as string[])
      .map((part) => part.trim().replace(/^#{1,6}\s+/, ''))
      .join('\n\n'),
    summaryPoints: strings(value.summaryPoints),
    relatedTopics: strings(value.relatedTopics),
    level,
  };
}
