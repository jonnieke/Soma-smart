import { supabase } from '../lib/supabase';
import { ExamAnalysis, ExamQuestion, MarkingResult } from '../types';

export interface ExamAttemptPayload {
  examId: string | number;
  learnerId: string;
  mode: string;
  selectedQuestions?: string[];
}

export interface ExamResponsePayload {
  attemptId: string;
  questionId: string | number;
  answerText?: string;
  answerData?: Record<string, unknown> | null;
  workingImagePath?: string | null;
  timeSpentSeconds?: number;
}

const EXAMS_CACHE_KEY = 'soma_cached_published_exams';

const getLearnerPin = (): string | null => {
  try {
    return localStorage.getItem('soma_active_student_pin') || null;
  } catch {
    return null;
  }
};

const getCachedExams = (): Array<ExamAnalysis & { id: string | number }> => {
  try {
    const raw = localStorage.getItem(EXAMS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setCachedExams = (exams: unknown) => {
  try {
    localStorage.setItem(EXAMS_CACHE_KEY, JSON.stringify(exams));
  } catch {}
};

export const examService = {
  async listPublishedExams(grade?: string, subject?: string) {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout fetching exam catalogue')), 8000)
    );

    try {
      const fetchPromise = supabase.rpc('list_published_exams', {
        p_grade: grade || null,
        p_subject: subject || null
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw error;
      const exams = (data || []) as Array<ExamAnalysis & { id: string | number }>;
      if (exams.length > 0 && !grade && !subject) {
        setCachedExams(exams);
      }
      return exams;
    } catch (err) {
      const cached = getCachedExams();
      if (cached.length > 0) {
        console.warn('Network issue fetching exams; serving cached catalogue:', err);
        return cached;
      }
      throw err;
    }
  },

  async getExamForAttempt(examId: string | number) {
    const { data, error } = await supabase.rpc('get_exam_for_attempt', {
      p_exam_id: examId
    });

    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) as (ExamAnalysis & { id: string | number }) | null;
  },

  async startAttempt(payload: ExamAttemptPayload) {
    const { data, error } = await supabase.rpc('start_exam_attempt_secure', {
      p_exam_id: payload.examId,
      p_learner_id: payload.learnerId,
      p_mode: payload.mode,
      p_selected_questions: payload.selectedQuestions || [],
      p_pin: getLearnerPin()
    });

    if (error) throw error;
    return data;
  },

  async saveResponse(payload: ExamResponsePayload) {
    const { data, error } = await supabase.rpc('save_exam_response_secure', {
      p_attempt_id: payload.attemptId,
      p_question_id: String(payload.questionId),
      p_answer_text: payload.answerText || null,
      p_answer_data: payload.answerData || null,
      p_working_image_path: payload.workingImagePath || null,
      p_time_spent_seconds: payload.timeSpentSeconds || 0,
      p_pin: getLearnerPin()
    });

    if (error) throw error;
    return data;
  },

  async submitAttempt(attemptId: string, durationSeconds?: number) {
    const { data, error } = await supabase.rpc('submit_exam_attempt_secure', {
      p_attempt_id: attemptId,
      p_duration_seconds: durationSeconds ?? null,
      p_pin: getLearnerPin()
    });

    if (error) throw error;
    return data;
  },

  async getAttemptResults(attemptId: string) {
    const { data, error } = await supabase.rpc('get_exam_attempt_secure', {
      p_attempt_id: attemptId,
      p_pin: getLearnerPin()
    });

    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) || null;
  },

  async markResponse(examId: string | number, questionId: string | number, learnerAnswer: string, learnerId: string, attemptId: string | null, language: 'EN' | 'SW' = 'EN'): Promise<MarkingResult> {
    const { data, error } = await supabase.functions.invoke('mark-exam-response', {
      body: {
        examId,
        questionId,
        learnerAnswer,
        language,
        learnerId,
        learnerPin: getLearnerPin(),
        attemptId
      }
    });

    if (error) throw error;
    return data as MarkingResult;
  }
};

export type { ExamQuestion };
