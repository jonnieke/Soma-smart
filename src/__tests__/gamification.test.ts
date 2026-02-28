import { describe, it, expect } from 'vitest';
import {
    calculateStreak,
    calculateSubjectPerformance,
    calculateTotalXP,
    calculateLevel,
} from '../services/gamificationService';
import { LearnerActivity } from '../types';

describe('gamificationService', () => {
    describe('calculateStreak', () => {
        it('should return 0 for empty history', () => {
            expect(calculateStreak([])).toBe(0);
        });

        it('should return 1 for today only', () => {
            const today = new Date().toLocaleDateString();
            const activities: LearnerActivity[] = [
                { id: '1', type: 'QUIZ', topic: 'Math', date: today, score: 80 },
            ];
            expect(calculateStreak(activities)).toBe(1);
        });
    });

    describe('calculateTotalXP', () => {
        it('should return 0 for empty history', () => {
            expect(calculateTotalXP([])).toBe(0);
        });

        it('should award XP for quizzes', () => {
            const activities: LearnerActivity[] = [
                { id: '1', type: 'QUIZ' as const, topic: 'Math', date: '2026-01-01', score: 80 },
                { id: '2', type: 'STUDY' as const, topic: 'Science', date: '2026-01-02' },
            ];
            const xp = calculateTotalXP(activities);
            expect(xp).toBeGreaterThan(0);
        });
    });

    describe('calculateLevel', () => {
        it('should return level 1 for 0 XP', () => {
            const info = calculateLevel(0);
            expect(info.level).toBe(1);
        });

        it('should return higher levels for more XP', () => {
            const info = calculateLevel(5000);
            expect(info.level).toBeGreaterThan(1);
        });

        it('should have valid progress percentage', () => {
            const info = calculateLevel(150);
            expect(info.progressPercent).toBeGreaterThanOrEqual(0);
            expect(info.progressPercent).toBeLessThanOrEqual(100);
        });
    });

    describe('calculateSubjectPerformance', () => {
        it('should return empty results for empty history', () => {
            const result = calculateSubjectPerformance([]);
            expect(result.every(s => !s.hasData)).toBe(true);
        });
    });
});
