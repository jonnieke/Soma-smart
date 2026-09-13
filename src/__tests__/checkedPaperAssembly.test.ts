import { describe, expect, it } from 'vitest';
import { assembleCheckedPaper } from '../services/assessmentEngine/checkedPaperAssembly';
import { questionSelectionEngine } from '../services/assessmentEngine/questionSelectionEngine';
import type { ExamBlueprint, Question } from '../types/paperStudio';

const blueprint: ExamBlueprint = {
    id: 'bp', ownerId: 'teacher-1', title: 'Fractions', grade: 'Grade 1', subject: 'Maths', curriculum: 'CBC_CBE',
    examType: 'CAT', term: 'Term 1', year: 2026, durationMinutes: 30, totalMarks: 2,
    difficultyDistribution: { easy: 0, medium: 100, challenging: 0 },
    cognitiveDistribution: { RECALL: 100, UNDERSTANDING: 0, APPLICATION: 0, ANALYSIS: 0, EVALUATION: 0, CREATION: 0 },
    sections: [{ id: 'a', title: 'Section A', questionType: 'SHORT_ANSWER', questionCount: 1, marksPerQuestion: 2, totalMarks: 2, difficulty: 'MEDIUM' }],
    topics: ['Fractions'],
};
const question: Question = { id: 'q1', visibility: 'PUBLIC', status: 'VERIFIED', sourceType: 'SOMA_BANK',
    questionType: 'SHORT_ANSWER', questionText: 'Half of eight?', correctAnswer: '4', marks: 2,
    markingScheme: [{ criterion: 'Correct answer', marks: 2 }], grade: 'Grade 1', subject: 'Maths', curriculum: 'CBC_CBE',
    topic: 'Fractions', cognitiveLevel: 'RECALL', difficulty: 'MEDIUM' };
describe('checked paper assembly', () => {
    it('uses actual question totals and calculated coverage', () => {
        const result = assembleCheckedPaper(blueprint, [question], 'SOMA_BANK');
        expect(result.report).toMatchObject({ totalMarksSelected: 2, difficultyMatchPercent: 100, cognitiveMatchPercent: 100 });
    });
    it('blocks an incomplete paper with a useful shortage message', () => {
        expect(() => assembleCheckedPaper(blueprint, [], 'SOMA_BANK')).toThrow('Only 0 of 2 marks');
    });
    it.each([
        { grade: 'Grade 10' }, { subject: 'Advanced Maths' }, { topic: 'Geometry' }, { curriculum: 'IGCSE' },
        { marks: 5 }, { markingScheme: [{ criterion: 'Wrong total', marks: 1 }] },
    ])('rejects a mismatched question without rewriting its marks: %j', change => {
        const candidate = { ...question, ...change } as Question;
        expect(() => assembleCheckedPaper(blueprint, [candidate], 'SOMA_BANK')).toThrow('Paper not created');
        expect(candidate.marks).toBe(change.marks ?? 2);
    });
    it('keeps personal bank selection scoped to its owner', () => {
        const privateQuestion = { ...question, sourceType: 'MY_BANK', visibility: 'PRIVATE', ownerId: 'teacher-2' } as Question;
        expect(() => assembleCheckedPaper(blueprint, [privateQuestion], 'MY_BANK')).toThrow();
        expect(assembleCheckedPaper(blueprint, [{ ...privateQuestion, ownerId: 'teacher-1' }], 'MY_BANK').report.totalMarksSelected).toBe(2);
        expect(() => assembleCheckedPaper(blueprint, [privateQuestion], 'SOMA_BANK')).toThrow();
    });
    it('rejects unverified public items and unavailable AI mode', () => {
        expect(() => assembleCheckedPaper(blueprint, [{ ...question, status: 'DRAFT' }], 'SOMA_BANK')).toThrow();
        expect(() => assembleCheckedPaper(blueprint, [question], 'AI_HYBRID')).toThrow('not available');
    });
    it('does not report fixed match percentages', () => {
        const result = questionSelectionEngine.assemblePaperFromBlueprint(blueprint, [{ ...question, difficulty: 'EASY', cognitiveLevel: 'APPLICATION' }]);
        expect(result.report.difficultyMatchPercent).toBe(0);
        expect(result.report.cognitiveMatchPercent).toBe(0);
    });
    it('rejects malformed section counts and inconsistent requested totals', () => {
        expect(() => assembleCheckedPaper({ ...blueprint, totalMarks: 30 }, [question], 'SOMA_BANK')).toThrow('add up');
        expect(() => assembleCheckedPaper({ ...blueprint, sections: [{ ...blueprint.sections[0], questionCount: -1 }] }, [question], 'SOMA_BANK')).toThrow('whole number');
    });
});
