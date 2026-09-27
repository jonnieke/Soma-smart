import type { ExplanationResult } from '../types';

export function buildSubjectLessonRequest(topic: string, subject: string, grade: string): string {
  return `TOPIC LESSON REQUEST (not a submitted homework problem)
Topic: ${JSON.stringify(topic.trim())}
Subject: ${JSON.stringify(subject)}
Grade: ${JSON.stringify(grade)}
Teach this topic directly to the learner. Give one worked example, then CREATE a different, concrete practice question on the same skill.
Set practice.isProblem=true, practice.originalQuestion to ONLY that new question, and practice.workedExample to the solved example with different numbers or details. Do not solve the new question.
Never copy this request, its instructions, or the topic title into practice.originalQuestion. The learner must receive a question they can actually answer.`;
}

export function safeLearnerPractice(practice: ExplanationResult['practice']): ExplanationResult['practice'] {
  if (!practice?.isProblem) return practice;
  const question = practice.originalQuestion?.trim() || '';
  const isInstruction = /TOPIC LESSON REQUEST|practice\.(?:originalQuestion|isProblem)|Explain the key ideas directly to me as a learner|^Teach me about\b|^Teach this topic\b|Startup rule:/i.test(question);
  return question && !isInstruction ? practice : undefined;
}
