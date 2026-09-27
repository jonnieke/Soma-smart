import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeGeneratedText, validateGeneratedQuestions, validatePaperRequest } from '../services/assessmentEngine/generatedPaperValidation';
import { generatePaperDraft, recoverGeneratedPaper } from '../services/assessmentEngine/paperGeneration';
import { paperStudioService } from '../services/paperStudioService';
import { generateTeacherPaperJson } from '../services/geminiService';
import { paperUploadExtractor } from '../services/assessmentEngine/paperUploadExtractor';
import { assessmentAIProvider } from '../services/assessmentEngine/assessmentAIProvider';
import { assessmentAnswerGuidance } from '../services/assessmentEngine/assessmentAnswerGuidance';

vi.mock('../services/paperStudioService', () => ({ paperStudioService: { getOwnerId: vi.fn(), savePaper: vi.fn() } }));
vi.mock('../services/geminiService', () => ({ generateTeacherPaperJson: vi.fn() }));
const request = { grade: 'Grade 6', subject: 'Science', topics: 'Soil erosion', questionCount: 1, totalMarks: 2, durationMinutes: 20, schoolName: '' };
const question = { questionText: 'State two ways of reducing soil erosion.', questionType: 'SHORT_ANSWER', marks: 2,
  correctAnswer: 'Plant cover crops and build terraces.', explanation: 'Roots bind soil while terraces slow runoff.',
  markingScheme: [{ criterion: 'Plant cover crops', marks: 1 }, { criterion: 'Build terraces', marks: 1 }] };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(paperStudioService.getOwnerId).mockResolvedValue('teacher-1');
  vi.mocked(paperStudioService.savePaper).mockImplementation(async paper => paper);
  vi.mocked(generateTeacherPaperJson).mockResolvedValue(JSON.stringify({ questions: [question] }));
});
describe('Real paper generation', () => {
  it('preserves server allowance details after retaining a failed request', async () => {
    const allowance = { plan: 'FREE', usageCount: 3, limit: 3 };
    vi.mocked(generateTeacherPaperJson).mockRejectedValue(Object.assign(new Error('teacher ai daily limit reached'), { allowance }));
    await expect(generatePaperDraft(request, vi.fn())).rejects.toMatchObject({ allowance });
    expect(vi.mocked(paperStudioService.savePaper).mock.calls.at(-1)?.[0].generation?.status).toBe('failed');
  });
  it('sends substantive answer guidance to full-paper generation', async () => {
    await generatePaperDraft(request, vi.fn());
    expect(vi.mocked(generateTeacherPaperJson).mock.calls[0][0]).toContain(assessmentAnswerGuidance);
    expect(assessmentAnswerGuidance).toContain('WHY the answer is correct');
    expect(assessmentAnswerGuidance).toContain('Other acceptable answers');
    expect(assessmentAnswerGuidance).toContain('actual knowledge or working');
  });
  it('uses the same answer guidance for generated question variations', async () => {
    const [original] = validateGeneratedQuestions([{ ...question, questionText: 'Explain how roots protect soil.' }], request, 'teacher-1');
    await assessmentAIProvider.generateVariation({ originalQuestion: original });
    expect(vi.mocked(generateTeacherPaperJson).mock.calls[0][0]).toContain(assessmentAnswerGuidance);
  });
  it('normalizes escaped model equations and bare formula answers without changing content', () => {
    expect(normalizeGeneratedText(String.raw`\\frac{5}{8}`)).toBe(String.raw`$\frac{5}{8}$`);
    expect(normalizeGeneratedText(String.raw`Find $\\frac{3}{8}$.\nShow working.`)).toBe('Find $\\frac{3}{8}$.\nShow working.');
    expect(() => normalizeGeneratedText(String.raw`\unsupported{x}`)).toThrow('not supported');
    expect(() => normalizeGeneratedText(String.raw`Find \frac{3}{8}`)).toThrow('complete formula');
  });
  it('accepts half-mark criteria only when their sum matches', () => {
    const q = { ...question, markingScheme: [{ criterion: 'Method', marks: 0.5 }, { criterion: 'Answer', marks: 1.5 }] };
    expect(validateGeneratedQuestions([q], request, 't')[0].marks).toBe(2);
  });
  it('removes matching model option labels because the editor supplies them', () => {
    const q = { ...question, questionType: 'MULTIPLE_CHOICE', correctAnswer: 'B', markingScheme: [{ criterion: 'Select option B', marks: 2 }], options: ['A) One', 'B) Two', 'C) Three', 'D) Four'].map(text => ({ text })) };
    expect(validateGeneratedQuestions([q], request, 't')[0].options?.map(o => o.text)).toEqual(['One', 'Two', 'Three', 'Four']);
  });
  it('rejects MCQ marks for an unrequested explanation but allows an unmarked explanation field', () => {
    const q = { ...question, questionText: 'Which activity reduces erosion?', questionType: 'MULTIPLE_CHOICE', correctAnswer: 'B', options: ['Clearing trees', 'Planting grass', 'Overgrazing', 'Leaving soil bare'].map(text => ({ text })),
      markingScheme: [{ criterion: 'Select B', marks: 1 }, { criterion: 'Explanation of roots binding soil', marks: 1 }] };
    expect(() => validateGeneratedQuestions([q], request, 't')).toThrow('selection-only');
    expect(() => validateGeneratedQuestions([{ ...q, markingScheme: [{ criterion: 'Correct choice and explanation', marks: 2 }] }], request, 't')).toThrow('selection-only');
    expect(validateGeneratedQuestions([{ ...q, markingScheme: [{ criterion: 'Select B', marks: 2 }] }], request, 't')[0].explanation).toBe(question.explanation);
  });
  it('rejects hidden explanation requirements on a naming question, but accepts explicit explanation requests', () => {
    const q = { ...question, questionText: 'Suggest two methods to prevent soil erosion.', markingScheme: [{ criterion: 'Explaining how roots bind soil', marks: 1 }, { criterion: 'Explaining how terraces slow runoff', marks: 1 }] };
    expect(() => validateGeneratedQuestions([q], request, 't')).toThrow('does not request');
    expect(validateGeneratedQuestions([{ ...q, questionText: 'Suggest two methods and explain how each prevents soil erosion.' }], request, 't')).toHaveLength(1);
    expect(validateGeneratedQuestions([question], request, 't')).toHaveLength(1);
  });
  it('recovers a retained response without another AI call', async () => {
    const paper = await generatePaperDraft(request, vi.fn());
    vi.mocked(generateTeacherPaperJson).mockClear();
    const recovered = await recoverGeneratedPaper({ ...paper, sections: [], generation: { ...paper.generation!, status: 'failed' } });
    expect(recovered.id).toBe(paper.id);
    expect(recovered.sections[0].questions).toHaveLength(1);
    expect(generateTeacherPaperJson).not.toHaveBeenCalled();
    vi.mocked(paperStudioService.getOwnerId).mockResolvedValue('other');
    await expect(recoverGeneratedPaper({ ...paper, sections: [] })).rejects.toThrow('original account');
  });
  it('saves the request before AI and the raw response before validation', async () => {
    const stages: string[] = [];
    vi.mocked(paperStudioService.savePaper).mockImplementation(async p => { stages.push(p.generation!.status); return p; });
    vi.mocked(generateTeacherPaperJson).mockImplementation(async () => { expect(stages).toEqual(['pending']); return JSON.stringify({ questions: [question] }); });
    const paper = await generatePaperDraft(request, vi.fn());
    expect(stages).toEqual(['pending', 'received', 'complete']);
    expect(paper.ownerId).toBe('teacher-1');
    expect(paper.totalMarks).toBe(2);
    expect(paper.sections[0].questions[0].status).toBe('DRAFT');
  });
  it('does not call AI if saving the initial request fails', async () => {
    vi.mocked(paperStudioService.savePaper).mockRejectedValue(new Error('offline'));
    await expect(generatePaperDraft(request, vi.fn())).rejects.toThrow('offline');
    expect(generateTeacherPaperJson).not.toHaveBeenCalled();
  });
  it('retains invalid returned content and reports failure without placeholders', async () => {
    vi.mocked(generateTeacherPaperJson).mockResolvedValue('{"questions":[]}');
    await expect(generatePaperDraft(request, vi.fn())).rejects.toThrow('wrong number');
    const last = vi.mocked(paperStudioService.savePaper).mock.calls.at(-1)![0];
    expect(last.generation?.rawResponse).toContain('questions');
    expect(last.generation?.status).toBe('failed');
    expect(last.sections).toEqual([]);
  });
  it('refuses a result when the account changes', async () => {
    vi.mocked(paperStudioService.getOwnerId).mockResolvedValueOnce('teacher-1').mockResolvedValue('teacher-2');
    await expect(generatePaperDraft(request, vi.fn())).rejects.toThrow('account changed');
  });
  it('rejects mismatched marking points and duplicate questions', () => {
    expect(() => validateGeneratedQuestions([{ ...question, markingScheme: [{ criterion: 'Cover crops', marks: 1 }] }], request, 't')).toThrow('marking guide');
    expect(() => validateGeneratedQuestions([question, question], { ...request, questionCount: 2, totalMarks: 4 }, 't')).toThrow('Duplicate');
  });
  it('rejects missing answers, wrong totals and invalid request sizes', () => {
    expect(() => validateGeneratedQuestions([{ ...question, correctAnswer: '' }], request, 't')).toThrow('answer');
    expect(() => validateGeneratedQuestions([question], { ...request, totalMarks: 5 }, 't')).toThrow('total');
    expect(() => validatePaperRequest({ ...request, questionCount: 200 })).toThrow('1–20');
  });
  it('never fabricates content from an uploaded paper', async () => {
    await expect(paperUploadExtractor.extractPaperBlueprint(new File(['real biology'], 'biology.pdf'))).rejects.toThrow('not available');
  });
});
