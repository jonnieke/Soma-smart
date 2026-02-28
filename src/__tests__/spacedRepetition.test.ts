import { describe, it, expect } from 'vitest';
import {
    updateMastery,
    getWeakTopics,
    getStrongTopics,
    buildScaffoldingContext,
} from '../services/spacedRepetitionService';

describe('spacedRepetitionService', () => {
    describe('updateMastery', () => {
        it('should initialize mastery for a new topic', () => {
            const result = updateMastery({}, 'Algebra', 80);
            expect(result['Algebra']).toBeDefined();
            expect(result['Algebra']).toBeGreaterThan(0);
        });

        it('should blend new score with existing mastery', () => {
            const result = updateMastery({ 'Algebra': 60 }, 'Algebra', 90);
            // EMA: old * 0.6 + new * 0.4 = 60 * 0.6 + 90 * 0.4 = 36 + 36 = 72
            expect(result['Algebra']).toBe(72);
        });

        it('should not affect other topics', () => {
            const result = updateMastery({ 'Algebra': 60, 'Geometry': 40 }, 'Algebra', 90);
            expect(result['Geometry']).toBe(40);
        });
    });

    describe('getWeakTopics', () => {
        it('should return topics with mastery below 50%', () => {
            const mastery = { 'Algebra': 30, 'Geometry': 80, 'Fractions': 20 };
            const weak = getWeakTopics(mastery);
            expect(weak).toContain('Algebra');
            expect(weak).toContain('Fractions');
            expect(weak).not.toContain('Geometry');
        });

        it('should return empty array when all topics are strong', () => {
            const mastery = { 'Algebra': 80, 'Geometry': 90 };
            expect(getWeakTopics(mastery)).toEqual([]);
        });
    });

    describe('getStrongTopics', () => {
        it('should return topics with mastery >= 70%', () => {
            const mastery = { 'Algebra': 80, 'Geometry': 40, 'Fractions': 75 };
            const strong = getStrongTopics(mastery);
            expect(strong).toContain('Algebra');
            expect(strong).toContain('Fractions');
            expect(strong).not.toContain('Geometry');
        });
    });

    describe('buildScaffoldingContext', () => {
        it('should return context when no mastery data exists', () => {
            const result = buildScaffoldingContext('Math', {}, []);
            expect(result).toContain('ADAPTIVE CONTEXT');
        });

        it('should include mastery level when data exists', () => {
            const result = buildScaffoldingContext('Math', { 'Math': 75 }, []);
            expect(result).toContain('75');
        });

        it('should highlight weak topic hurdles', () => {
            const result = buildScaffoldingContext('Math', {}, ['Algebra', 'Fractions']);
            expect(result).toContain('Algebra');
            expect(result).toContain('Fractions');
        });
    });
});
