import type { ExplanationResult } from '../types';
import { safeLearnerPractice } from './learnerPractice';

type LessonContext = { subject?: string; grade?: string; documentSubject?: string; documentGrade?: string; profileGrade?: string };

/** Snapshot the lesson being read, not the learner's unrelated profile defaults. */
export function buildLessonNotebookEntry(answer: ExplanationResult, context: LessonContext) {
  const practice = safeLearnerPractice(answer.practice);
  const section = (heading: string, body?: string) => body?.trim() ? `${heading}\n${body.trim()}` : '';
  const content = [
    section('EXPLANATION', answer.explanation),
    section('KEY POINTS', answer.summaryPoints?.map(point => `- ${point}`).join('\n')),
    ...(answer.subtopics || []).map(topic => section(topic.title,
      topic.blocks?.map(block => block.type === 'list' ? block.items?.map(item => `- ${item}`).join('\n') : block.text).filter(Boolean).join('\n\n') || topic.content)),
    ...(answer.recapNodes || []).map(node => section(node.point, node.details)),
    section('WORKED EXAMPLE', practice?.workedExample),
    section('YOUR TURN', practice?.originalQuestion),
    section('PRACTICE GUIDANCE', practice?.yourTurnPrompt),
    section('RELATED TOPICS', answer.relatedTopics?.map(topic => `- ${topic}`).join('\n')),
  ].filter(Boolean).join('\n\n');
  return {
    title: answer.topic, topic: answer.topic, content,
    subject: context.subject?.trim() || context.documentSubject?.trim() || 'General',
    grade: context.grade?.trim() || context.documentGrade?.trim() || context.profileGrade?.trim() || '',
    source: 'ai_answer' as const, masteryStatus: 'learning' as const,
  };
}
