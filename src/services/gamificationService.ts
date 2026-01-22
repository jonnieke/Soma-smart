import { LearnerActivity } from '../types';

export const XP_RULES = {
    QUIZ_COMPLETION: 50,
    TOPIC_STUDY: 20,
    PERFECT_SCORE_BONUS: 30,
};

export interface LevelInfo {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    progressPercent: number;
    totalXP: number;
}

export const calculateTotalXP = (activities: LearnerActivity[]): number => {
    return activities.reduce((total, activity) => {
        let xp = 0;

        if (activity.type === 'QUIZ') {
            xp += XP_RULES.QUIZ_COMPLETION;
            if ((activity.score || 0) >= 100) {
                xp += XP_RULES.PERFECT_SCORE_BONUS;
            }
        } else if (activity.type === 'EXPLANATION') {
            xp += XP_RULES.TOPIC_STUDY;
        }

        return total + xp;
    }, 0);
};

export const calculateLevel = (totalXP: number): LevelInfo => {
    // Simple formula: Level = sqrt(XP / 100) + 1
    // XP required for level L = 100 * (L-1)^2

    // Example Curve:
    // L1: 0 XP
    // L2: 100 XP
    // L3: 400 XP
    // L4: 900 XP

    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

    const currentLevelBaseXP = 100 * Math.pow(level - 1, 2);
    const nextLevelBaseXP = 100 * Math.pow(level, 2);

    const levelXP = totalXP - currentLevelBaseXP;
    const neededXP = nextLevelBaseXP - currentLevelBaseXP;

    const progressPercent = Math.min(100, Math.max(0, (levelXP / neededXP) * 100));

    return {
        level,
        currentXP: levelXP,
        nextLevelXP: neededXP,
        progressPercent,
        totalXP
    };
};

export const getAchievementMessage = (activityType: 'QUIZ' | 'EXPLANATION', score?: number): string => {
    if (activityType === 'QUIZ') {
        if ((score || 0) >= 100) return "PERFECT! +80 XP";
        if ((score || 0) >= 80) return "Great Job! +50 XP";
        return "Quiz Complete +50 XP";
    }
    return "Topic Studied +20 XP";
};
