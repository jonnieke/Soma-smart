import type { Question, CurriculumFramework } from '../../types/paperStudio';
import { parsePaperEquation, splitPaperEquations } from '../paperEquationContent';

// Model JSON sometimes double-escapes commands or omits delimiters on answer-only formulas.
// Normalize syntax only; never invent or change mathematical content.
export function normalizeGeneratedText(value: string): string {
  let result = value.trim().replace(/\\{2,}(?=[a-zA-Z])/g, '\\').replace(/\\n(?=[A-Z]|[a-z]\)|\s|$)/g, '\n');
  if (result.startsWith('\\') && !/[\s$]/.test(result) && !/^\\[([]/.test(result)) {
    parsePaperEquation(result);
    result = `$${result}$`;
  }
  splitPaperEquations(result);
  return result;
}

export interface PaperRequest {
  grade: string; subject: string; topics: string; questionCount: number; totalMarks: number;
  durationMinutes: number; schoolName: string;
  curriculum?: CurriculumFramework;
}
export function validatePaperRequest(input: PaperRequest) {
  if (![input.grade, input.subject, input.topics].every(s => s.trim() && s.length <= 2000)) throw new Error('Enter a class, subject and topics.');
  if (!Number.isInteger(input.questionCount) || input.questionCount < 1 || input.questionCount > 20) throw new Error('Choose 1–20 questions.');
  if (!Number.isInteger(input.totalMarks) || input.totalMarks < input.questionCount || input.totalMarks > 100) throw new Error('Choose a total between the number of questions and 100 marks.');
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 5 || input.durationMinutes > 180) throw new Error('Choose 5–180 minutes.');
}
export function validateGeneratedQuestions(raw: unknown, input: PaperRequest, ownerId: string): Question[] {
  if (!Array.isArray(raw) || raw.length !== input.questionCount) throw new Error('Soma returned the wrong number of questions. No incomplete paper was accepted.');
  const seen = new Set<string>();
  const text = (value: unknown, name: string) => {
    if (typeof value !== 'string' || !value.trim() || value.length > 8000) throw new Error(`Missing or invalid ${name}.`);
    if (/Variation B|Varied Figures|Answer working step|Option A - Primary Principle/i.test(value)) throw new Error('The response contains placeholder content.');
    return normalizeGeneratedText(value);
  };
  const questions = raw.map((value): Question => {
    if (!value || typeof value !== 'object') throw new Error('Invalid question returned.');
    const q = value as Record<string, unknown>;
    const questionText = text(q.questionText, 'question');
    const normalized = questionText.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(normalized)) throw new Error('Duplicate questions were returned.');
    seen.add(normalized);
    if (!Number.isInteger(q.marks) || Number(q.marks) < 1 || Number(q.marks) > 30) throw new Error('Invalid question marks.');
    const questionType = q.questionType;
    if (!['SHORT_ANSWER', 'MULTIPLE_CHOICE', 'CALCULATION', 'ESSAY', 'STRUCTURED'].includes(String(questionType))) throw new Error('Unsupported question type.');
    const answer = text(q.correctAnswer, 'answer');
    if (!Array.isArray(q.markingScheme) || !q.markingScheme.length) throw new Error('Missing marking guide.');
    const markingScheme = q.markingScheme.map((m: { criterion: unknown; marks: unknown }) => {
      if (!m || typeof m.marks !== 'number' || !Number.isInteger(m.marks * 2) || m.marks < 0.5) throw new Error('Invalid marking criterion.');
      return { criterion: text(m.criterion, 'marking criterion'), marks: Number(m.marks) };
    });
    if (markingScheme.reduce((sum, m) => sum + m.marks, 0) !== q.marks) throw new Error('The marking guide does not match the question marks.');
    // Bounded checks for observed grading failures, not a semantic/curriculum certification.
    const rewardsExplanation = markingScheme.some(m => /\b(?:explain(?:s|ing|ed)?|explanation|justif(?:y|ies|ying|ication)|describ(?:e|es|ing)|description)\b/i.test(m.criterion));
    if (/\b(?:name|list|state|suggest|identify)\b/i.test(questionText)
      && !/\b(?:explain|describe|justify|discuss|why|how|reason|reasons|working)\b/i.test(questionText)
      && rewardsExplanation) {
      throw new Error('The marking guide awards explanation marks that the question does not request. The response needs review.');
    }
    let options: Question['options'];
    if (questionType === 'MULTIPLE_CHOICE') {
      if (markingScheme.length !== 1 || rewardsExplanation) throw new Error('A selection-only multiple-choice question must award all marks for the chosen answer, not an explanation.');
      if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error('A multiple-choice question needs four options.');
      options = q.options.map((o: { text: unknown }, i) => ({ id: 'ABCD'[i], text: text(text(o?.text, 'option').replace(new RegExp(`^${'ABCD'[i]}[.)]\\s+`), ''), 'option') }));
      if (!['A', 'B', 'C', 'D'].includes(answer) || new Set(options.map(o => o.text.toLowerCase())).size !== 4) throw new Error('Invalid multiple-choice answer or duplicate options.');
    }
    return { id: crypto.randomUUID(), ownerId, visibility: 'PRIVATE', status: 'DRAFT', sourceType: 'AI_GENERATED',
      grade: input.grade, subject: input.subject, curriculum: input.curriculum || 'CBC_CBE', topic: input.topics,
      questionType: questionType as Question['questionType'], questionText, correctAnswer: answer,
      explanation: text(q.explanation, 'explanation'), marks: Number(q.marks), markingScheme, options,
      difficulty: 'MEDIUM', cognitiveLevel: 'APPLICATION', workingSpaceLines: questionType === 'MULTIPLE_CHOICE' ? 0 : Math.min(12, Number(q.marks) * 2),
    };
  });
  if (questions.reduce((sum, q) => sum + q.marks, 0) !== input.totalMarks) throw new Error('The generated marks do not match your requested total.');
  return questions;
}
