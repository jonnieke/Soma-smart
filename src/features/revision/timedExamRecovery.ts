export interface TimedExamRecovery {
  version: 1;
  examId: string;
  attemptId: string;
  questionIds: string[];
  answers: Record<string, string>;
  index: number;
  startedAt: number;
  deadline: number;
  timeLimit: number;
  submitting: boolean;
}
const prefix = (owner: string) => `soma_timed_exam_v1:${encodeURIComponent(owner)}:`;
export function readTimedExam(owner: string, examId: string): TimedExamRecovery | null {
  if (!owner || owner === 'guest') return null;
  try {
    const value = JSON.parse(localStorage.getItem(prefix(owner) + examId) || 'null');
    if (!value || value.version !== 1 || value.examId !== examId ||
      typeof value.attemptId !== 'string' || !value.attemptId ||
      !Array.isArray(value.questionIds) || !value.questionIds.length || value.questionIds.length > 500 ||
      !value.questionIds.every((id: unknown) => typeof id === 'string') ||
      !value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers) ||
      !Object.values(value.answers).every(answer => typeof answer === 'string') ||
      !Number.isInteger(value.index) || value.index < 0 || value.index >= value.questionIds.length ||
      !Number.isFinite(value.startedAt) || !Number.isFinite(value.deadline) ||
      !Number.isFinite(value.timeLimit) || value.timeLimit <= 0 || value.deadline <= value.startedAt ||
      typeof value.submitting !== 'boolean') return null;
    return value;
  } catch { return null; }
}
export function saveTimedExam(owner: string, value: TimedExamRecovery): boolean {
  if (!owner || owner === 'guest') return false;
  try { localStorage.setItem(prefix(owner) + value.examId, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function removeTimedExam(owner: string, examId: string) {
  try { localStorage.removeItem(prefix(owner) + examId); } catch { /* Storage may be disabled. */ }
}
export function listTimedExams(owner: string): TimedExamRecovery[] {
  try {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix(owner)))
      .map(key => readTimedExam(owner, key.slice(prefix(owner).length)))
      .filter((item): item is TimedExamRecovery => item !== null);
  } catch { return []; }
}
