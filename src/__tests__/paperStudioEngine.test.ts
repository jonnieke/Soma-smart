import { describe, it, expect } from 'vitest';
import { questionSelectionEngine } from '../services/assessmentEngine/questionSelectionEngine';
import { paperStudioService } from '../services/paperStudioService';
import { ExamBlueprint, Question } from '../types/paperStudio';

describe('Soma Assessment Engine & Question Selection', () => {
  const sampleBlueprint: ExamBlueprint = {
    id: 'test_bp_1',
    ownerId: 'teacher_1',
    title: 'Grade 9 Mathematics CAT 1',
    grade: 'Grade 9',
    subject: 'Mathematics',
    curriculum: 'CBC_CBE',
    examType: 'CAT',
    term: 'Term 1',
    year: 2026,
    durationMinutes: 60,
    totalMarks: 30,
    difficultyDistribution: { easy: 30, medium: 50, challenging: 20 },
    cognitiveDistribution: {
      RECALL: 20,
      UNDERSTANDING: 30,
      APPLICATION: 30,
      ANALYSIS: 10,
      EVALUATION: 5,
      CREATION: 5,
    },
    sections: [
      {
        id: 'sec_a',
        title: 'Section A: MCQ',
        questionType: 'MULTIPLE_CHOICE',
        questionCount: 5,
        marksPerQuestion: 2,
        totalMarks: 10,
        difficulty: 'MEDIUM',
      },
      {
        id: 'sec_b',
        title: 'Section B: Short Answer',
        questionType: 'SHORT_ANSWER',
        questionCount: 4,
        marksPerQuestion: 5,
        totalMarks: 20,
        difficulty: 'MEDIUM',
      },
    ],
    topics: ['Algebraic Expressions', 'Pythagoras Theorem'],
  };

  const sampleBank: Question[] = [
    {
      id: 'q1',
      visibility: 'PUBLIC',
      status: 'VERIFIED',
      questionType: 'MULTIPLE_CHOICE',
      questionText: 'Simplify 2x + 3x.',
      options: [{ id: 'A', text: '5x' }],
      correctAnswer: 'A',
      markingScheme: [{ criterion: 'Simplify correctly', marks: 2 }],
      marks: 2,
      grade: 'Grade 9',
      subject: 'Mathematics',
      curriculum: 'CBC_CBE',
      topic: 'Algebraic Expressions',
      cognitiveLevel: 'APPLICATION',
      difficulty: 'MEDIUM',
      sourceType: 'SOMA_BANK',
    },
    {
      id: 'q2',
      visibility: 'PUBLIC',
      status: 'VERIFIED',
      questionType: 'SHORT_ANSWER',
      questionText: 'Calculate hyp for 3,4 right triangle.',
      correctAnswer: '5',
      markingScheme: [{ criterion: 'Apply pythagoras', marks: 5 }],
      marks: 5,
      grade: 'Grade 9',
      subject: 'Mathematics',
      curriculum: 'CBC_CBE',
      topic: 'Pythagoras Theorem',
      cognitiveLevel: 'APPLICATION',
      difficulty: 'MEDIUM',
      sourceType: 'SOMA_BANK',
    },
  ];

  it('assembles paper sections deterministically according to section rules', () => {
    const result = questionSelectionEngine.assemblePaperFromBlueprint(sampleBlueprint, sampleBank);

    expect(result.sections.length).toBe(2);
    expect(result.sections[0].title).toBe('Section A: MCQ');
    expect(result.sections[0].questions.length).toBe(1);
    expect(result.sections[1].title).toBe('Section B: Short Answer');
    expect(result.sections[1].questions.length).toBe(1);
  });

  it('deducts AI credits correctly for paper generation', () => {
    const initialCredits = paperStudioService.deductCredits(0);
    const updatedCredits = paperStudioService.deductCredits(1);

    expect(updatedCredits).toBe(initialCredits - 1);
  });
});
