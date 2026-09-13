import type { ExamPaper } from '../../types/paperStudio';
export const exportPaper: ExamPaper = {
  id: 'export-fixture', ownerId: 'test-only', title: 'Science revision', status: 'DRAFT', visibility: 'PRIVATE',
  grade: 'Grade 6', subject: 'Science', examType: 'QUIZ', term: '3', year: 2026,
  durationMinutes: 20, totalMarks: 4, version: 1, createdAt: '', updatedAt: '',
  schoolBranding: { schoolName: 'Test School', candidateNameField: true, admissionNoField: true },
  instructions: ['Answer all questions.'], sections: [{
    id: 'section-a', title: 'Section A', instructions: 'Write clearly.', totalMarks: 4,
    questions: [{ id: 'question-1', visibility: 'PRIVATE', status: 'TEACHER_REVIEWED',
      questionType: 'SHORT_ANSWER', questionText: 'What is soil erosion?\nGive one cause.',
      correctAnswer: 'Removal of topsoil.', explanation: 'Water can carry soil away.',
      markingScheme: [{ criterion: 'Correct definition', marks: 2 }, { criterion: 'Valid cause', marks: 2 }],
      marks: 4, grade: 'Grade 6', subject: 'Science', curriculum: 'CBC_CBE',
      cognitiveLevel: 'UNDERSTANDING', difficulty: 'EASY', sourceType: 'MANUAL',
    }],
  }],
};
