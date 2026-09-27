export const ADMIN_TEST_MODE = 'ADMIN_TEST';

export function mayMarkAttempt(attempt: any, exam: any, learnerId: string, isAdmin: boolean, questionId: string) {
  if (!attempt || attempt.status !== 'IN_PROGRESS' || attempt.learner_id !== learnerId) return false;
  if (String(attempt.exam_id) !== String(exam?.id) || exam?.type !== 'PAST_PAPER') return false;
  if (!Array.isArray(attempt.selected_questions) || !attempt.selected_questions.includes(questionId)) return false;
  return attempt.mode === ADMIN_TEST_MODE ? isAdmin : exam.review_status === 'PUBLISHED';
}

export function validateMarking(result: any, marksAvailable: number) {
  if (!Number.isFinite(marksAvailable) || marksAvailable <= 0 ||
      typeof result?.marksAwarded !== 'number' || !Number.isFinite(result.marksAwarded) ||
      result.marksAwarded < 0 || result.marksAwarded > marksAvailable ||
      typeof result.feedback !== 'string' || !result.feedback.trim() ||
      typeof result.modelAnswer !== 'string' || !result.modelAnswer.trim()) {
    throw new Error('The marker returned an incomplete or invalid result. Please retry.');
  }
  return {
    marksAwarded: result.marksAwarded, marksAvailable,
    isCorrect: result.marksAwarded === marksAvailable,
    modelAnswer: result.modelAnswer, feedback: result.feedback,
    examTip: typeof result.examTip === 'string' ? result.examTip : '',
  };
}
