import type { ExamBlueprint, Question } from '../../types/paperStudio';
import { questionSelectionEngine } from './questionSelectionEngine';

export function assembleCheckedPaper(blueprint: ExamBlueprint, bank: Question[], source: 'SOMA_BANK' | 'MY_BANK' | 'AI_HYBRID') {
    if (!blueprint.ownerId) throw new Error('Sign in to your teacher account before assembling a paper.');
    if (source === 'AI_HYBRID') throw new Error('AI Hybrid is not available yet. Choose a question bank.');
    if (!blueprint.sections.length || blueprint.sections.some(section =>
        !Number.isInteger(section.questionCount) || section.questionCount < 1 ||
        !Number.isFinite(section.marksPerQuestion) || section.marksPerQuestion <= 0)) {
        throw new Error('Each section needs a whole number of questions and positive marks per question.');
    }
    const expectedMarks = blueprint.sections.reduce((sum, section) => sum + section.questionCount * section.marksPerQuestion, 0);
    if (expectedMarks !== blueprint.totalMarks) throw new Error('The section marks must add up to the paper total.');
    const eligible = bank.filter(question => source === 'SOMA_BANK'
        ? question.sourceType === 'SOMA_BANK' && question.visibility === 'PUBLIC' && question.status === 'VERIFIED'
        : question.ownerId === blueprint.ownerId);
    const result = questionSelectionEngine.assemblePaperFromBlueprint(blueprint, eligible);
    if (result.report.unmetConstraints.length || result.report.totalMarksSelected !== expectedMarks) {
        throw new Error(`Paper not created: ${result.report.unmetConstraints.join(' ')} Only ${result.report.totalMarksSelected} of ${expectedMarks} marks are available. Adjust the sections, topics or bank and try again. No AI credits were used.`);
    }
    return result;
}
