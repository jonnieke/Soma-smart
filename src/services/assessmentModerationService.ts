import { AssessmentAttempt, AssessmentModeration } from '../types/assessmentDelivery';
import { assessmentAttemptService } from './assessmentAttemptService';
import { supabase } from '../lib/supabase';

const MODERATION_STORAGE_KEY = 'soma_assessment_moderations';

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

export const assessmentModerationService = {
  /** Select sample attempts for moderation review based on strategy */
  selectModerationSample(
    attempts: AssessmentAttempt[],
    strategy: 'PERCENTAGE_SAMPLE' | 'TOP_BOTTOM' | 'FAILED_LEARNERS' | 'RANDOM',
    sampleSize = 20, // e.g. 20% or count
  ): AssessmentAttempt[] {
    const marked = attempts.filter((a) => a.status === 'marked' || a.status === 'partially_marked');
    if (marked.length === 0) return [];

    if (strategy === 'FAILED_LEARNERS') {
      return marked.filter((a) => (a.percentage ?? 0) < 50);
    }

    if (strategy === 'TOP_BOTTOM') {
      const sorted = [...marked].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
      const topCount = Math.max(1, Math.floor(sampleSize / 2));
      const top = sorted.slice(0, topCount);
      const bottom = sorted.slice(-topCount);
      return Array.from(new Set([...top, ...bottom]));
    }

    if (strategy === 'PERCENTAGE_SAMPLE') {
      const targetCount = Math.max(1, Math.round((marked.length * sampleSize) / 100));
      return marked.slice(0, targetCount);
    }

    // Default Random
    return marked.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, sampleSize));
  },

  /** Submit a moderation review for an attempt */
  async submitModerationReview(
    attemptId: string,
    assignmentId: string,
    moderatorId: string,
    moderatorName: string,
    moderatedScore: number,
    reason: string,
  ): Promise<AssessmentModeration> {
    const attempt = await assessmentAttemptService.getAttemptById(attemptId);
    if (!attempt) throw new Error('Attempt not found.');

    const originalScore = attempt.totalScore ?? 0;
    const variance = moderatedScore - originalScore;

    const record: AssessmentModeration = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      attemptId,
      assignmentId,
      moderatorId,
      moderatorName,
      originalScore,
      moderatedScore,
      variance,
      reason,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };

    const list = readLocal<AssessmentModeration[]>(MODERATION_STORAGE_KEY, []);
    list.unshift(record);
    writeLocal(MODERATION_STORAGE_KEY, list);

    // Update attempt score and set status to moderated
    const newPercentage = attempt.totalScore && attempt.totalScore > 0
      ? Math.round((moderatedScore / (attempt.totalScore / ((attempt.percentage ?? 100) / 100))) * 100)
      : Math.round((moderatedScore / 100) * 100);

    await assessmentAttemptService.updateAttemptStatus(attemptId, 'moderated', {
      totalScore: moderatedScore,
      percentage: newPercentage,
    });

    try {
      await supabase.from('assessment_moderations').insert({
        id: record.id,
        attempt_id: attemptId,
        assignment_id: assignmentId,
        moderator_id: moderatorId,
        original_score: originalScore,
        moderated_score: moderatedScore,
        variance,
        reason,
        created_at: record.createdAt,
      });
    } catch {
      /* Fallback */
    }

    return record;
  },

  /** Get all moderation records for an assignment */
  getAssignmentModerations(assignmentId: string): AssessmentModeration[] {
    const list = readLocal<AssessmentModeration[]>(MODERATION_STORAGE_KEY, []);
    return list.filter((m) => m.assignmentId === assignmentId);
  },
};
