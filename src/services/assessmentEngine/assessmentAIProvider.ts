import type { Question, QuestionType, CognitiveLevel, DifficultyLevel, CurriculumFramework } from '../../types/paperStudio';
import { parseModelJson } from '../jsonResponse';
import { paperStudioService } from '../paperStudioService';
import { validateGeneratedQuestions } from './generatedPaperValidation';
import { assessmentAnswerGuidance } from './assessmentAnswerGuidance';

export interface QuestionGenerationInput {
  subject: string; grade: string; curriculum?: CurriculumFramework; topic?: string; strand?: string; subStrand?: string;
  questionType: QuestionType; difficulty: DifficultyLevel; cognitiveLevel?: CognitiveLevel; marks: number; existingQuestionsToAvoid?: string[];
}
export interface VariationInput { originalQuestion: Question; instruction?: string }
export interface MarkingSchemeInput { examTitle: string; grade: string; subject: string; questions: Array<{ id: string; text: string; marks: number; questionType: string }> }
export interface QuestionValidation { isValid: boolean; qualityScore: number; warnings: string[]; suggestions: string[] }

export const assessmentAIProvider = {
  async generateQuestion(input: QuestionGenerationInput): Promise<Question> {
    const owner = await paperStudioService.getOwnerId();
    const { generateTeacherPaperJson } = await import('../geminiService');
    const raw = await generateTeacherPaperJson(`Create one teacher assessment question matching these requirements: ${JSON.stringify(input)}.
${assessmentAnswerGuidance}
Return JSON {"questions":[{"questionText":"...","questionType":"${input.questionType}","marks":${input.marks},"correctAnswer":"...","explanation":"worked solution","markingScheme":[{"criterion":"specific point","marks":1}],"options":[{"text":"..."}]}]}.
The marking criteria must sum to ${input.marks}. No placeholders, no external diagrams. MCQ requires four options and answer A/B/C/D. Use plain text or $...$ equations with fractions, roots, powers and subscripts only. JSON-escape backslashes.`);
    if (await paperStudioService.getOwnerId() !== owner) throw new Error('Your account changed. No question was replaced.');
    const data = parseModelJson<{ questions: unknown }>(raw);
    const [question] = validateGeneratedQuestions(data.questions, { ...input, topics: input.topic || input.subject, questionCount: 1, totalMarks: input.marks, durationMinutes: 10, schoolName: '' }, owner);
    if (question.questionType !== input.questionType) throw new Error('The generated question type does not match. Your question is unchanged.');
    return { ...question, curriculum: input.curriculum || 'CBC_CBE', difficulty: input.difficulty };
  },
  async generateVariation({ originalQuestion: original, instruction }: VariationInput): Promise<Question> {
    const question = await this.generateQuestion({ ...original, topic: `${original.topic || original.subject}. Create an equivalent but different question. ${instruction || ''}`, existingQuestionsToAvoid: [original.questionText] });
    if (question.questionText.trim().toLowerCase() === original.questionText.trim().toLowerCase()) throw new Error('Soma returned the same question. Your original is unchanged.');
    return question;
  },
  async generateMarkingScheme(_input: MarkingSchemeInput): Promise<Record<string, Question['markingScheme']>> {
    throw new Error('Generate a paper with its marking guide, or enter teacher-reviewed criteria. Standalone marking-guide generation is not available yet.');
  },
  async validateQuestion(q: Question): Promise<QuestionValidation> {
    const warnings: string[] = [];
    if (!q.questionText?.trim()) warnings.push('Question text is missing.');
    if (!q.correctAnswer?.trim()) warnings.push('Expected answer is missing.');
    if (!q.markingScheme?.length || q.markingScheme.reduce((sum, m) => sum + m.marks, 0) !== q.marks) warnings.push('Marking criteria must match the question marks.');
    return { isValid: warnings.length === 0, qualityScore: 0, warnings, suggestions: ['Structural checks only. A teacher must review subject accuracy.'] };
  },
};
