/**
 * Strategy Service — Super Teacher Phase 3
 * 
 * Manages teaching strategies: load, save, approve/reject,
 * and build dynamic prompt instructions from active strategies.
 * Uses localStorage for offline-first with Supabase sync.
 */

import { TeachingStrategy } from '../types';
import { supabase } from '../lib/supabase';

const STRATEGIES_STORAGE_KEY = 'soma_teaching_strategies';

// --- LOCAL PERSISTENCE ---

export const saveStrategiesToLocal = (strategies: TeachingStrategy[]): void => {
    try {
        localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
    } catch (e) {
        console.warn('Failed to save strategies locally:', e);
    }
};

export const loadStrategiesFromLocal = (): TeachingStrategy[] => {
    try {
        const data = localStorage.getItem(STRATEGIES_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.warn('Failed to load strategies locally:', e);
        return [];
    }
};

// --- STRATEGY MANAGEMENT ---

/**
 * Get all active strategies (approved and deployed).
 */
export const getActiveStrategies = (strategies: TeachingStrategy[]): TeachingStrategy[] => {
    return strategies.filter(s => s.status === 'ACTIVE');
};

/**
 * Get strategies pending admin approval.
 */
export const getPendingStrategies = (strategies: TeachingStrategy[]): TeachingStrategy[] => {
    return strategies.filter(s => s.status === 'PENDING');
};

/**
 * Approve a strategy (changes status from PENDING → ACTIVE).
 */
export const approveStrategy = (
    strategies: TeachingStrategy[],
    strategyId: string
): TeachingStrategy[] => {
    const updated = strategies.map(s =>
        s.id === strategyId
            ? { ...s, status: 'ACTIVE' as const, approvedAt: new Date().toISOString() }
            : s
    );
    saveStrategiesToLocal(updated);
    return updated;
};

/**
 * Reject a strategy (changes status from PENDING → REJECTED).
 */
export const rejectStrategy = (
    strategies: TeachingStrategy[],
    strategyId: string
): TeachingStrategy[] => {
    const updated = strategies.map(s =>
        s.id === strategyId ? { ...s, status: 'REJECTED' as const } : s
    );
    saveStrategiesToLocal(updated);
    return updated;
};

/**
 * Deactivate a strategy (roll back from ACTIVE → REJECTED).
 */
export const deactivateStrategy = (
    strategies: TeachingStrategy[],
    strategyId: string
): TeachingStrategy[] => {
    const updated = strategies.map(s =>
        s.id === strategyId ? { ...s, status: 'REJECTED' as const } : s
    );
    saveStrategiesToLocal(updated);
    return updated;
};

/**
 * Add new strategies (from Admin Agent) to the list.
 */
export const addStrategies = (
    existing: TeachingStrategy[],
    newStrategies: TeachingStrategy[]
): TeachingStrategy[] => {
    const updated = [...existing, ...newStrategies];
    saveStrategiesToLocal(updated);
    return updated;
};

// --- DYNAMIC PROMPT BUILDER ---

/**
 * Build a dynamic strategy instruction string from all ACTIVE strategies.
 * This is injected into AI prompts to apply approved strategies.
 */
export const buildStrategiesInstruction = (strategies: TeachingStrategy[]): string => {
    const active = getActiveStrategies(strategies);
    if (active.length === 0) return '';

    const strategyLines = active.map((s, i) =>
        `${i + 1}. [${s.priority}] ${s.strategy}${s.targetTopic ? ` (for: ${s.targetTopic})` : ''}${s.targetGrade ? ` (grade: ${s.targetGrade})` : ''}`
    ).join('\n');

    return `
EVOLVED TEACHING STRATEGIES (Super Teacher Phase 3):
The following strategies have been identified from student performance data and approved by administrators.
Apply them whenever relevant to the current topic and student level:
${strategyLines}
`;
};

/**
 * Build a targeted strategy instruction for a specific topic/grade.
 * Only includes strategies that match the topic or are general.
 */
export const buildTargetedStrategiesInstruction = (
    strategies: TeachingStrategy[],
    topic: string,
    grade?: string
): string => {
    const active = getActiveStrategies(strategies);
    if (active.length === 0) return '';

    const topicLower = topic.toLowerCase();
    const relevant = active.filter(s => {
        // Include if no target (general strategy)
        if (!s.targetTopic && !s.targetSubject) return true;
        // Include if topic matches
        if (s.targetTopic && topicLower.includes(s.targetTopic.toLowerCase())) return true;
        // Include if subject matches
        if (s.targetSubject && topicLower.includes(s.targetSubject.toLowerCase())) return true;
        // Include if grade matches
        if (s.targetGrade && grade && grade.toLowerCase().includes(s.targetGrade.toLowerCase())) return true;
        return false;
    });

    if (relevant.length === 0) return '';

    const lines = relevant.map((s, i) =>
        `${i + 1}. ${s.strategy}`
    ).join('\n');

    return `
EVOLVED TEACHING STRATEGIES (Phase 3 — Topic-Specific):
Apply these evidence-based strategies for this topic:
${lines}
`;
};

// --- SUPABASE SYNC (for platform-wide strategy sharing) ---

/**
 * Sync strategies to Supabase for platform-wide use.
 */
export const syncStrategiesToSupabase = async (strategies: TeachingStrategy[]): Promise<void> => {
    try {
        const active = getActiveStrategies(strategies);
        if (active.length === 0) return;

        // Upsert active strategies
        for (const s of active) {
            await supabase.from('teaching_strategies').upsert({
                id: s.id,
                insight: s.insight,
                root_cause: s.rootCause,
                strategy: s.strategy,
                expected_impact: s.expectedImpact,
                target_grade: s.targetGrade,
                target_topic: s.targetTopic,
                target_subject: s.targetSubject,
                priority: s.priority,
                status: s.status,
                effectiveness_score: s.effectivenessScore,
                approved_at: s.approvedAt
            }, { onConflict: 'id' });
        }
    } catch (e) {
        console.warn('Strategy sync to Supabase failed (non-critical):', e);
    }
};

/**
 * Load strategies from Supabase (platform-wide strategies).
 */
export const loadStrategiesFromSupabase = async (): Promise<TeachingStrategy[]> => {
    try {
        const { data, error } = await supabase
            .from('teaching_strategies')
            .select('*')
            .in('status', ['ACTIVE', 'PENDING'])
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map((s: any) => ({
            id: s.id,
            insight: s.insight,
            rootCause: s.root_cause,
            strategy: s.strategy,
            expectedImpact: s.expected_impact,
            targetGrade: s.target_grade,
            targetTopic: s.target_topic,
            targetSubject: s.target_subject,
            priority: s.priority,
            status: s.status,
            effectivenessScore: s.effectiveness_score,
            createdAt: s.created_at,
            approvedAt: s.approved_at
        }));
    } catch (e) {
        console.warn('Strategy load from Supabase failed:', e);
        return [];
    }
};
