/**
 * Spaced Repetition Service — Super Teacher Phase 2
 * 
 * Implements a simplified SM-2 algorithm to schedule topic reviews.
 * Tracks per-topic mastery and computes optimal review intervals
 * based on the learner's quiz/exam performance.
 */

import { SpacedRepetitionItem, MasteryRecord, LearnerActivity } from '../types';

// --- SM-2 ALGORITHM CONSTANTS ---
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_INTERVAL = 1;   // days
const MAX_INTERVAL = 60;  // days

// --- CORE SM-2 FUNCTIONS ---

/**
 * Calculate the next review date and interval after a quiz attempt.
 * Uses the SM-2 spaced repetition algorithm.
 * 
 * @param score - Quiz score as percentage (0-100)
 * @param currentItem - Existing SR item (null if first attempt)
 * @returns Updated SpacedRepetitionItem
 */
export const calculateNextReview = (
    topic: string,
    score: number,
    currentItem?: SpacedRepetitionItem,
    subject?: string,
    grade?: string
): SpacedRepetitionItem => {
    const now = new Date();

    // Normalize score from 0-100 to SM-2 quality (0-5)
    // 0-39% → 0-1 (blackout), 40-59% → 2 (hard), 60-79% → 3-4 (good), 80-100% → 5 (easy)
    const quality = Math.min(5, Math.max(0, Math.round((score / 100) * 5)));

    let easeFactor = currentItem?.easeFactor ?? DEFAULT_EASE_FACTOR;
    let intervalDays = currentItem?.intervalDays ?? MIN_INTERVAL;
    const reviewCount = (currentItem?.reviewCount ?? 0) + 1;

    if (quality < 3) {
        // Failed — reset interval, review soon
        intervalDays = MIN_INTERVAL;
    } else {
        // Passed — increase interval
        if (reviewCount === 1) {
            intervalDays = 1;
        } else if (reviewCount === 2) {
            intervalDays = 3;
        } else {
            intervalDays = Math.round(intervalDays * easeFactor);
        }
    }

    // Update ease factor using SM-2 formula
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

    // Clamp interval
    intervalDays = Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, intervalDays));

    // Calculate next review date
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
        topic,
        subject: subject ?? currentItem?.subject,
        grade: grade ?? currentItem?.grade,
        nextReviewDate: nextReview.toISOString(),
        intervalDays,
        easeFactor,
        lastScore: score,
        reviewCount
    };
};

/**
 * Get all topics that are due for review (nextReviewDate <= now).
 */
export const getDueTopics = (items: SpacedRepetitionItem[]): SpacedRepetitionItem[] => {
    const now = new Date();
    return items
        .filter(item => new Date(item.nextReviewDate) <= now)
        .sort((a, b) => {
            // Weakest topics first (lowest score), then oldest due date
            if (a.lastScore !== b.lastScore) return a.lastScore - b.lastScore;
            return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
        });
};

/**
 * Get topics coming up for review soon (within the next N days).
 */
export const getUpcomingTopics = (items: SpacedRepetitionItem[], withinDays: number = 3): SpacedRepetitionItem[] => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    return items
        .filter(item => {
            const reviewDate = new Date(item.nextReviewDate);
            return reviewDate > now && reviewDate <= cutoff;
        })
        .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());
};

// --- MASTERY TRACKING ---

/**
 * Update the mastery graph after a quiz/exam attempt.
 * Uses exponential moving average: new_mastery = old_mastery * 0.6 + new_score * 0.4
 * This means recent performance weighs more heavily but doesn't completely erase history.
 */
export const updateMastery = (
    currentMastery: Record<string, number>,
    topic: string,
    score: number
): Record<string, number> => {
    const previousMastery = currentMastery[topic] ?? 0;
    const timesTested = Object.keys(currentMastery).includes(topic) ? 1 : 0;

    // First attempt: use raw score. Subsequent: exponential moving average
    const newMastery = timesTested === 0
        ? score
        : Math.round(previousMastery * 0.6 + score * 0.4);

    return {
        ...currentMastery,
        [topic]: Math.min(100, Math.max(0, newMastery))
    };
};

/**
 * Extract weak topics from the mastery graph (mastery < 50%).
 */
export const getWeakTopics = (masteryGraph: Record<string, number>): string[] => {
    return Object.entries(masteryGraph)
        .filter(([_, mastery]) => mastery < 50)
        .sort(([_, a], [__, b]) => a - b)
        .map(([topic]) => topic);
};

/**
 * Extract strong topics from the mastery graph (mastery >= 70%).
 */
export const getStrongTopics = (masteryGraph: Record<string, number>): string[] => {
    return Object.entries(masteryGraph)
        .filter(([_, mastery]) => mastery >= 70)
        .sort(([_, a], [__, b]) => b - a)
        .map(([topic]) => topic);
};

/**
 * Get the mastery level for a specific topic.
 */
export const getTopicMastery = (masteryGraph: Record<string, number>, topic: string): number => {
    // Try exact match first
    if (masteryGraph[topic] !== undefined) return masteryGraph[topic];

    // Try fuzzy match (case-insensitive, partial)
    const topicLower = topic.toLowerCase();
    for (const [key, value] of Object.entries(masteryGraph)) {
        if (key.toLowerCase().includes(topicLower) || topicLower.includes(key.toLowerCase())) {
            return value;
        }
    }

    return -1; // No data
};

// --- PERSONALIZED DAILY CHALLENGE ---

/**
 * Get a personalized daily challenge based on spaced repetition data.
 * Falls back to the static challenge if no SR data exists.
 */
export const getPersonalizedChallenge = (
    srItems: SpacedRepetitionItem[],
    masteryGraph: Record<string, number>
): { topic: string; title: string; quiz: string; isPersonalized: boolean } => {
    // 1. Check for due topics first
    const dueTopics = getDueTopics(srItems);
    if (dueTopics.length > 0) {
        const target = dueTopics[0];
        return {
            topic: target.topic,
            title: `📚 Review: ${target.topic}`,
            quiz: `${target.topic} Revision`,
            isPersonalized: true
        };
    }

    // 2. Check for weak topics
    const weakTopics = getWeakTopics(masteryGraph);
    if (weakTopics.length > 0) {
        const target = weakTopics[0];
        return {
            topic: target,
            title: `💪 Strengthen: ${target}`,
            quiz: `${target} Practice Quiz`,
            isPersonalized: true
        };
    }

    // 3. Fallback to static challenge
    const day = new Date().getDay();
    const challenges = [
        { topic: "Social Studies", title: "Sunday Socials", quiz: "Social Studies Quiz" },
        { topic: "Mathematics", title: "Math Monday", quiz: "Mental Math" },
        { topic: "English", title: "English Tuesday", quiz: "Grammar & Vocab" },
        { topic: "Kiswahili", title: "Kiswahili Wednesday", quiz: "Msamiati & Sarufi" },
        { topic: "Science", title: "Science Thursday", quiz: "Nature & Environment" },
        { topic: "Mathematics", title: "Math Friday", quiz: "Geometry & Shapes" },
        { topic: "Science", title: "Super Science Saturday", quiz: "Space & Planets" },
    ];
    return { ...challenges[day], isPersonalized: false };
};

// --- PERSISTENCE HELPERS ---

const SR_STORAGE_KEY = 'soma_spaced_repetition';
const MASTERY_STORAGE_KEY = 'soma_mastery_graph';

/**
 * Save spaced repetition items to localStorage (offline-first).
 */
export const saveSRToLocal = (items: SpacedRepetitionItem[]): void => {
    try {
        localStorage.setItem(SR_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.warn('Failed to save SR data locally:', e);
    }
};

/**
 * Load spaced repetition items from localStorage.
 */
export const loadSRFromLocal = (): SpacedRepetitionItem[] => {
    try {
        const data = localStorage.getItem(SR_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.warn('Failed to load SR data locally:', e);
        return [];
    }
};

/**
 * Save mastery graph to localStorage.
 */
export const saveMasteryToLocal = (mastery: Record<string, number>): void => {
    try {
        localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(mastery));
    } catch (e) {
        console.warn('Failed to save mastery data locally:', e);
    }
};

/**
 * Load mastery graph from localStorage.
 */
export const loadMasteryFromLocal = (): Record<string, number> => {
    try {
        const data = localStorage.getItem(MASTERY_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.warn('Failed to load mastery data locally:', e);
        return {};
    }
};

/**
 * Process a completed quiz/activity and update both mastery + SR data.
 * This is the main entry point called after a quiz is completed.
 */
export const processQuizResult = (
    topic: string,
    score: number,
    currentMastery: Record<string, number>,
    currentSRItems: SpacedRepetitionItem[],
    subject?: string,
    grade?: string
): { mastery: Record<string, number>; srItems: SpacedRepetitionItem[] } => {
    // 1. Update mastery
    const newMastery = updateMastery(currentMastery, topic, score);

    // 2. Update spaced repetition
    const existingItem = currentSRItems.find(
        item => item.topic.toLowerCase() === topic.toLowerCase()
    );
    const updatedItem = calculateNextReview(topic, score, existingItem, subject, grade);

    const newSRItems = existingItem
        ? currentSRItems.map(item =>
            item.topic.toLowerCase() === topic.toLowerCase() ? updatedItem : item
        )
        : [...currentSRItems, updatedItem];

    // 3. Persist locally
    saveMasteryToLocal(newMastery);
    saveSRToLocal(newSRItems);

    return { mastery: newMastery, srItems: newSRItems };
};

/**
 * Build an adaptive scaffolding context string for AI prompts.
 * This string is injected into prompts so the AI can personalize its response.
 */
export const buildScaffoldingContext = (
    topic: string,
    masteryGraph: Record<string, number>,
    recentHurdles: string[] = []
): string => {
    const mastery = getTopicMastery(masteryGraph, topic);
    const weakTopics = getWeakTopics(masteryGraph);
    let levelGuidance: string;

    if (mastery === -1) {
        // No prior data on this topic
        levelGuidance = `
ADAPTIVE CONTEXT: This is the student's FIRST encounter with "${topic}".
- No prior mastery data available.
- Start with clear foundations and definitions.
- Use simple analogies and real-life Kenyan examples.
`;
    } else if (mastery < 30) {
        levelGuidance = `
ADAPTIVE CONTEXT: Student's mastery of "${topic}" is LOW (${mastery}%).
- Start with FUNDAMENTALS. Define key terms first.
- Use simple analogies and real-life Kenyan examples.
- Break concepts into very small, digestible steps.
- Give a "Think About It" checkpoint before moving to complex ideas.
- DO NOT assume prior knowledge — teach from scratch.
    `;
    } else if (mastery < 70) {
        levelGuidance = `
ADAPTIVE CONTEXT: Student's mastery of "${topic}" is INTERMEDIATE (${mastery}%).
- Skip basic definitions — the student has seen this before.
- Focus on APPLICATION and problem-solving strategies.
- Include a "Think About It" prompt to check understanding before revealing answers.
- Challenge with one follow-up question at the end.
- Highlight connections to related topics they've studied.
    `;
    } else {
        levelGuidance = `
ADAPTIVE CONTEXT: Student's mastery of "${topic}" is STRONG (${mastery}%).
- Go directly to ADVANCED / exam-level content.
- Present edge cases, exceptions, and common exam traps.
- Include past paper practice inline.
- Challenge with higher-order thinking questions.
- Encourage connections across subjects and strands.
    `;
    }

    if (recentHurdles.length > 0) {
        levelGuidance += `\n- KNOWN HURDLES: The student has recently struggled with: ${recentHurdles.slice(0, 5).join(', ')}. Avoid assuming mastery of these related concepts.`;
    }

    if (weakTopics.length > 0) {
        levelGuidance += `\n- WEAK AREAS: ${weakTopics.slice(0, 5).join(', ')}. If this topic connects to any weak area, provide extra scaffolding for that connection.`;
    }

    return levelGuidance;
};
