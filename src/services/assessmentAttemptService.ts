import {
  AssessmentAttempt,
  AssessmentResponse,
  AttemptStatus,
} from '../types/assessmentDelivery';
import { assessmentAssignmentService } from './assessmentAssignmentService';
import { paperStudioService } from './paperStudioService';
import { supabase } from '../lib/supabase';

const ATTEMPTS_STORAGE_KEY = 'soma_assessment_attempts';
const RESPONSES_STORAGE_KEY = 'soma_assessment_responses';

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const assessmentAttemptService = {
  /** Start a new attempt for a learner */
  async startAttempt(
    assignmentId: string,
    learnerId: string,
    learnerName: string,
    admissionNo?: string,
  ): Promise<{ attempt: AssessmentAttempt; responses: AssessmentResponse[] }> {
    const assignment = await assessmentAssignmentService.getAssignmentById(assignmentId);
    if (!assignment) throw new Error('Assignment not found.');

    const attempts = readLocal<AssessmentAttempt[]>(ATTEMPTS_STORAGE_KEY, []);
    const existing = attempts.filter((a) => a.assignmentId === assignmentId && a.learnerId === learnerId);

    if (existing.length >= assignment.attemptsAllowed && assignment.attemptsAllowed > 0) {
      throw new Error(`Maximum attempts (${assignment.attemptsAllowed}) reached for this assessment.`);
    }

    const paper = await paperStudioService.getPaperById(assignment.paperId);

    const attempt: AssessmentAttempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignmentId,
      assessmentId: assignment.paperId,
      paperId: assignment.paperId,
      learnerId,
      learnerName,
      admissionNo,
      attemptNumber: existing.length + 1,
      deliveryMode: assignment.deliveryMode,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Pre-populate empty responses for each question in the paper
    const initialResponses: AssessmentResponse[] = [];
    if (paper) {
      paper.sections.forEach((sec) => {
        sec.questions.forEach((q) => {
          initialResponses.push({
            id: `resp_${attempt.id}_${q.id}`,
            attemptId: attempt.id,
            assessmentId: paper.id,
            assignmentId,
            learnerId,
            questionId: q.id,
            questionVersionId: q.id,
            responseType: q.questionType,
            responseValue: '',
            isFlagged: false,
            autoSaveVersion: 1,
            maxMarks: q.marks,
            markingStatus: 'NOT_MARKED',
            updatedAt: new Date().toISOString(),
          });
        });
      });
    }

    attempts.unshift(attempt);
    writeLocal(ATTEMPTS_STORAGE_KEY, attempts);

    const allResponses = readLocal<AssessmentResponse[]>(RESPONSES_STORAGE_KEY, []);
    writeLocal(RESPONSES_STORAGE_KEY, [...initialResponses, ...allResponses]);

    try {
      await supabase.from('assessment_attempts').insert({
        id: attempt.id,
        assignment_id: assignmentId,
        learner_id: learnerId,
        learner_name: learnerName,
        attempt_number: attempt.attemptNumber,
        delivery_mode: attempt.deliveryMode,
        status: attempt.status,
        started_at: attempt.startedAt,
        created_at: attempt.createdAt,
      });
    } catch {
      /* Fallback */
    }

    return { attempt, responses: initialResponses };
  },

  /** Autosave a single question response */
  async autoSaveResponse(
    attemptId: string,
    questionId: string,
    responseValue: unknown,
    isFlagged = false,
  ): Promise<AssessmentResponse | null> {
    const responses = readLocal<AssessmentResponse[]>(RESPONSES_STORAGE_KEY, []);
    const idx = responses.findIndex((r) => r.attemptId === attemptId && r.questionId === questionId);

    if (idx === -1) return null;

    const current = responses[idx];
    const updated: AssessmentResponse = {
      ...current,
      responseValue,
      isFlagged,
      autoSaveVersion: current.autoSaveVersion + 1,
      answeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    responses[idx] = updated;
    writeLocal(RESPONSES_STORAGE_KEY, responses);

    return updated;
  },

  /** Get all responses for an attempt */
  async getAttemptResponses(attemptId: string): Promise<AssessmentResponse[]> {
    const responses = readLocal<AssessmentResponse[]>(RESPONSES_STORAGE_KEY, []);
    return responses.filter((r) => r.attemptId === attemptId);
  },

  /** Get attempt by ID */
  async getAttemptById(attemptId: string): Promise<AssessmentAttempt | null> {
    const attempts = readLocal<AssessmentAttempt[]>(ATTEMPTS_STORAGE_KEY, []);
    return attempts.find((a) => a.id === attemptId) ?? null;
  },

  /** Get all attempts for an assignment (teacher marking view) */
  async getAssignmentAttempts(assignmentId: string): Promise<AssessmentAttempt[]> {
    const attempts = readLocal<AssessmentAttempt[]>(ATTEMPTS_STORAGE_KEY, []);
    return attempts.filter((a) => a.assignmentId === assignmentId);
  },

  /** Submit attempt (manual click or timeout trigger) */
  async submitAttempt(attemptId: string, isTimeout = false): Promise<AssessmentAttempt | null> {
    const attempts = readLocal<AssessmentAttempt[]>(ATTEMPTS_STORAGE_KEY, []);
    const idx = attempts.findIndex((a) => a.id === attemptId);
    if (idx === -1) return null;

    const attempt = attempts[idx];
    const submittedAt = new Date().toISOString();
    const durationSeconds = attempt.startedAt
      ? Math.round((new Date(submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)
      : 0;

    attempts[idx] = {
      ...attempt,
      status: 'submitted',
      submittedAt,
      durationSeconds,
      isLate: isTimeout,
      updatedAt: submittedAt,
    };

    writeLocal(ATTEMPTS_STORAGE_KEY, attempts);

    try {
      await supabase
        .from('assessment_attempts')
        .update({
          status: 'submitted',
          submitted_at: submittedAt,
          duration_seconds: durationSeconds,
          updated_at: submittedAt,
        })
        .eq('id', attemptId);
    } catch {
      /* Fallback */
    }

    return attempts[idx];
  },

  /** Update attempt status (e.g. awaiting_marking -> marked -> released) */
  async updateAttemptStatus(attemptId: string, status: AttemptStatus, scores?: { objectiveScore?: number; subjectiveScore?: number; totalScore?: number; percentage?: number; grade?: string }): Promise<AssessmentAttempt | null> {
    const attempts = readLocal<AssessmentAttempt[]>(ATTEMPTS_STORAGE_KEY, []);
    const idx = attempts.findIndex((a) => a.id === attemptId);
    if (idx === -1) return null;

    attempts[idx] = {
      ...attempts[idx],
      status,
      ...scores,
      updatedAt: new Date().toISOString(),
    };

    writeLocal(ATTEMPTS_STORAGE_KEY, attempts);
    return attempts[idx];
  },
};
