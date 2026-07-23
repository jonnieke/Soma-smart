import { describe, it, expect } from 'vitest';
import { paperUploadExtractor } from '../services/assessmentEngine/paperUploadExtractor';

describe('Paper Upload Extractor Service', () => {
  it('detects subject accurately from exam text', () => {
    expect(paperUploadExtractor.detectSubject('KENYA MATHEMATICS FORM 4 CAT 1')).toBe('Mathematics');
    expect(paperUploadExtractor.detectSubject('CHEMISTRY PAPER 3 PRACTICAL')).toBe('Chemistry');
    expect(paperUploadExtractor.detectSubject('PHYSICS FORCE AND MOTION')).toBe('Physics');
  });

  it('detects grade level accurately from exam text', () => {
    expect(paperUploadExtractor.detectGrade('KCSE FORM 4 MATHEMATICS')).toBe('Form 4');
    expect(paperUploadExtractor.detectGrade('KJSEA GRADE 9 SCIENCE')).toBe('Grade 9');
    expect(paperUploadExtractor.detectGrade('KPSEA GRADE 6 KISWAHILI')).toBe('Grade 6');
  });

  it('extracts questions from structured exam text', () => {
    const rawText = `1. Solve 2x + 4 = 10 [2 Marks]\n2. Calculate area of circle (3m)`;
    const questions = paperUploadExtractor.parseQuestionsFromText(rawText, 'Mathematics', 'Form 4');

    expect(questions.length).toBe(2);
    expect(questions[0].marks).toBe(2);
    expect(questions[1].marks).toBe(3);
  });
});
