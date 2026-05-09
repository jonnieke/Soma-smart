/**
 * Learner Memory Service
 *
 * Provides cloud-sync for mastery data (localStorage → Supabase) and
 * computes the personalized greeting context shown on the dashboard.
 *
 * Architecture:
 * - Guest users: localStorage only (no cloud sync)
 * - Registered users: sync on mount (load) and after each quiz (save)
 * - Merge strategy: take MAX mastery per topic (never regress)
 */

import { supabase } from '../lib/supabase';
import {
  loadMasteryFromLocal,
  saveMasteryToLocal,
  loadSRFromLocal,
  saveSRToLocal,
  getWeakTopics,
  getStrongTopics,
} from './spacedRepetitionService';
import { SpacedRepetitionItem } from '../types';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export interface LearnerMemoryContext {
  firstName: string;
  greeting: string;                 // e.g. "Good evening"
  lastTopic: string | null;
  lastSubject: string | null;
  weakTopics: string[];
  strongTopics: string[];
  streak: number;
  totalXP: number;
  totalSessions: number;
  isReturning: boolean;             // false on first ever visit
}

interface CloudMemoryRow {
  learner_id: string;
  mastery_graph: Record<string, number>;
  spaced_repetition: SpacedRepetitionItem[];
  weak_topics: string[];
  strong_topics: string[];
  last_topic: string | null;
  last_subject: string | null;
  total_sessions: number;
  total_xp: number;
  streak_days: number;
  last_synced_at: string;
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Merge two mastery graphs by taking the MAX value per topic.
 * This prevents cloud data from overwriting a higher local score.
 */
const mergeMasteryGraphs = (
  local: Record<string, number>,
  cloud: Record<string, number>
): Record<string, number> => {
  const merged: Record<string, number> = { ...cloud };
  for (const [topic, score] of Object.entries(local)) {
    merged[topic] = Math.max(merged[topic] ?? 0, score);
  }
  return merged;
};

/**
 * Merge two SR queues — prefer the most recently reviewed item per topic.
 */
const mergeSRQueues = (
  local: SpacedRepetitionItem[],
  cloud: SpacedRepetitionItem[]
): SpacedRepetitionItem[] => {
  const map = new Map<string, SpacedRepetitionItem>();
  // Cloud first, then local overwrites if newer
  for (const item of [...cloud, ...local]) {
    const existing = map.get(item.topic.toLowerCase());
    if (!existing || new Date(item.nextReviewDate) > new Date(existing.nextReviewDate)) {
      map.set(item.topic.toLowerCase(), item);
    }
  }
  return Array.from(map.values());
};

// -------------------------------------------------------------------------
// Cloud Sync — Load
// -------------------------------------------------------------------------

/**
 * Load mastery data from Supabase and merge with localStorage.
 * Should be called once on dashboard mount for registered users.
 *
 * @param learnerId - soma_code or Supabase user ID
 * @returns merged mastery graph (also persisted to localStorage)
 */
export const loadMasteryFromCloud = async (learnerId: string): Promise<{
  masteryGraph: Record<string, number>;
  srItems: SpacedRepetitionItem[];
  cloudRow: CloudMemoryRow | null;
}> => {
  const localMastery = loadMasteryFromLocal();
  const localSR = loadSRFromLocal();

  try {
    const { data, error } = await supabase
      .from('learner_memory')
      .select('*')
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (error || !data) {
      // No cloud record yet — local is the truth
      return { masteryGraph: localMastery, srItems: localSR, cloudRow: null };
    }

    const cloudRow = data as CloudMemoryRow;
    const mergedMastery = mergeMasteryGraphs(localMastery, cloudRow.mastery_graph ?? {});
    const mergedSR = mergeSRQueues(localSR, cloudRow.spaced_repetition ?? []);

    // Persist the merged result locally
    saveMasteryToLocal(mergedMastery);
    saveSRToLocal(mergedSR);

    return { masteryGraph: mergedMastery, srItems: mergedSR, cloudRow };
  } catch (err) {
    console.warn('[LearnerMemory] Cloud load failed (offline?), using local data:', err);
    return { masteryGraph: localMastery, srItems: localSR, cloudRow: null };
  }
};

// -------------------------------------------------------------------------
// Offline Sync Queue
// -------------------------------------------------------------------------
const SYNC_QUEUE_KEY = 'soma_mastery_sync_queue';

export const queueMasterySync = (row: any) => {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    // Replace if same learner_id is already in queue, otherwise append
    const updated = [...queue.filter((item: any) => item.learner_id !== row.learner_id), row];
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to queue mastery sync:', e);
  }
};

export const flushMasterySyncQueue = async () => {
  if (!navigator.onLine) return;
  
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    for (const row of queue) {
      const { error } = await supabase
        .from('learner_memory')
        .upsert(row, { onConflict: 'learner_id' });
      
      if (error) throw error;
    }

    // Success - clear queue
    localStorage.removeItem(SYNC_QUEUE_KEY);
    console.log(`[LearnerMemory] Flushed ${queue.length} offline updates to cloud.`);
  } catch (err) {
    console.warn('[LearnerMemory] Failed to flush sync queue:', err);
  }
};

// -------------------------------------------------------------------------
// Cloud Sync — Save
// -------------------------------------------------------------------------

/**
 * Upsert the learner's current mastery state to Supabase.
 * Non-blocking — call fire-and-forget after quiz completion.
 *
 * @param learnerId - soma_code or Supabase user ID
 * @param lastTopic - most recently studied topic (for greeting)
 * @param lastSubject - most recently studied subject
 * @param streak - current study streak
 * @param totalXP - total XP points
 * @param totalSessions - total sessions count
 */
export const syncMasteryToCloud = async (
  learnerId: string,
  lastTopic?: string,
  lastSubject?: string,
  streak?: number,
  totalXP?: number,
  totalSessions?: number
): Promise<void> => {
  const masteryGraph = loadMasteryFromLocal();
  const srItems = loadSRFromLocal();
  const weakTopics = getWeakTopics(masteryGraph).slice(0, 10);
  const strongTopics = getStrongTopics(masteryGraph).slice(0, 10);

  const row: Omit<CloudMemoryRow, 'last_synced_at'> & { last_synced_at: string } = {
    learner_id: learnerId,
    mastery_graph: masteryGraph,
    spaced_repetition: srItems,
    weak_topics: weakTopics,
    strong_topics: strongTopics,
    last_topic: lastTopic ?? null,
    last_subject: lastSubject ?? null,
    total_sessions: totalSessions ?? 0,
    total_xp: totalXP ?? 0,
    streak_days: streak ?? 0,
    last_synced_at: new Date().toISOString(),
  };

  if (!navigator.onLine) {
    console.log('[LearnerMemory] Offline detected, queuing mastery update...');
    queueMasterySync(row);
    return;
  }

  try {
    const { error } = await supabase
      .from('learner_memory')
      .upsert(row, { onConflict: 'learner_id' });

    if (error) {
      console.warn('[LearnerMemory] Cloud sync failed:', error.message);
      queueMasterySync(row);
    }
  } catch (err) {
    console.warn('[LearnerMemory] Cloud sync error (offline?):', err);
    queueMasterySync(row);
  }
};

// -------------------------------------------------------------------------
// Greeting Context Builder
// -------------------------------------------------------------------------

/**
 * Builds the personalized greeting context for the dashboard header.
 * Uses cloudRow (if available) and local data to compute the message.
 */
export const buildGreetingContext = (
  profileName: string,
  cloudRow: CloudMemoryRow | null,
  streak: number,
  totalXP: number,
  history: { topic: string; date: string }[]
): LearnerMemoryContext => {
  const firstName = profileName?.split(' ')[0] || 'Learner';
  const greeting = getGreeting();

  // Derive last topic from cloud or from local history
  const lastTopic = cloudRow?.last_topic
    ?? (history.length > 0 ? history[0]?.topic : null) ?? null;

  const lastSubject = cloudRow?.last_subject ?? null;

  const localMastery = loadMasteryFromLocal();
  const weakTopics = getWeakTopics(localMastery).slice(0, 3);
  const strongTopics = getStrongTopics(localMastery).slice(0, 3);

  const isReturning = (cloudRow?.total_sessions ?? 0) > 1 || history.length > 0;

  return {
    firstName,
    greeting,
    lastTopic,
    lastSubject,
    weakTopics,
    strongTopics,
    streak,
    totalXP,
    totalSessions: cloudRow?.total_sessions ?? 0,
    isReturning,
  };
};

// -------------------------------------------------------------------------
// Bulk Analytics (Teacher/Admin)
// -------------------------------------------------------------------------

/**
 * Fetch mastery data for an entire class roster in one go.
 */
export const getBulkMasteryMemories = async (studentIds: string[]): Promise<CloudMemoryRow[]> => {
  if (!studentIds || studentIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('learner_memory')
      .select('*')
      .in('learner_id', studentIds);
    if (error) throw error;
    return (data as CloudMemoryRow[]) || [];
  } catch (err) {
    console.error('[LearnerMemory] Bulk fetch failed:', err);
    return [];
  }
};

/**
 * Instantly update a specific student's mastery graph directly in the cloud.
 * Used by the Teacher's AI Marking Manager to close the learning loop.
 */
export const updateStudentMasteryFromTeacher = async (
  studentId: string,
  topic: string,
  awarded: number,
  possible: number
): Promise<{ success: boolean; newScore?: number }> => {
  if (!studentId || !topic || possible <= 0) return { success: false };

  const percentage = Math.round((awarded / possible) * 100);

  try {
    // 1. Fetch current memory
    const { data: existing, error: fetchErr } = await supabase
      .from('learner_memory')
      .select('*')
      .eq('learner_id', studentId)
      .maybeSingle();

    if (fetchErr && fetchErr.code !== 'PGRST116') { // PGRST116 is 'not found'
      throw fetchErr;
    }

    const row = existing || {
      learner_id: studentId,
      mastery_graph: {},
      spaced_repetition: [],
      weak_topics: [],
      strong_topics: [],
      last_topic: null,
      last_subject: null,
      total_sessions: 0,
      total_xp: 0,
      streak_days: 0
    };

    const graph = row.mastery_graph || {};
    const currentScore = graph[topic] || 0;
    
    // 2. Take the max for encouragement, preventing a bad paper from deleting their progress history entirely
    const newScore = Math.max(currentScore, percentage);
    graph[topic] = newScore;
    row.mastery_graph = graph;

    // Recalculate weak/strong topics dynamically
    const sortedTopics = Object.entries(graph).sort((a, b) => (a[1] as number) - (b[1] as number));
    row.weak_topics = sortedTopics.slice(0, 10).map(t => t[0]);
    row.strong_topics = sortedTopics.slice(-10).reverse().map(t => t[0]);
    row.last_synced_at = new Date().toISOString();

    // 3. Upsert
    const { error: upsertErr } = await supabase
      .from('learner_memory')
      .upsert(row, { onConflict: 'learner_id' });

    if (upsertErr) throw upsertErr;

    return { success: true, newScore };
  } catch (err) {
    console.error('[LearnerMemory] Teacher update failed:', err);
    return { success: false };
  }
};
