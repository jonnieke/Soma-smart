import { supabase } from '../../lib/supabase';
import { parseProgress, type CandidateProgress } from './candidatePlan';

const getLearnerPin = (): string | null => {
  try {
    return localStorage.getItem('soma_active_student_pin') || null;
  } catch {
    return null;
  }
};

const SYNC_TIMEOUT_MS = 8000;

const withTimeout = <T>(work: PromiseLike<T>): Promise<T> =>
  Promise.race([
    Promise.resolve(work),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Sync timed out')), SYNC_TIMEOUT_MS)),
  ]);

/** Guests have no verified identity, so nothing is stored for them. */
export const canSync = (learnerId: string) => Boolean(learnerId) && learnerId !== 'guest';

export const candidateProgressService = {
  async fetch(learnerId: string): Promise<CandidateProgress | null> {
    const { data, error } = await withTimeout(
      supabase.rpc('get_candidate_progress', { p_learner_id: learnerId, p_pin: getLearnerPin() })
    );
    if (error) throw error;
    return parseProgress(data);
  },

  async save(learnerId: string, progress: CandidateProgress): Promise<CandidateProgress | null> {
    const { data, error } = await withTimeout(
      supabase.rpc('save_candidate_progress', {
        p_learner_id: learnerId,
        p_exam_date: progress.examDate,
        p_weak: progress.weak,
        p_practised_days: progress.practisedDays,
        p_practised_count: progress.practisedCount,
        p_client_updated_at: progress.updatedAt,
        p_pin: getLearnerPin(),
      })
    );
    if (error) throw error;
    return parseProgress(data);
  },
};
