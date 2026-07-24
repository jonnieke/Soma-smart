/**
 * Phase 6 — Soma Education Intelligence Integration Tests
 * Tests: Evidence confidence ratings, progress signal factors, intervention outcomes, small-cohort suppression, question quality evaluation
 */

import { describe, it, expect } from 'vitest';
import { educationIntelligenceService } from '../services/educationIntelligenceService';
import { interventionService } from '../services/interventionService';
import { benchmarkingService } from '../services/benchmarkingService';
import { revisionImpactService } from '../services/revisionImpactService';

describe('Phase 6 — Soma Education Intelligence', () => {
  describe('educationIntelligenceService — Data Quality & Evidence Confidence', () => {
    it('evaluates evidence confidence correctly based on sample size and recency', () => {
      expect(educationIntelligenceService.calculateEvidenceConfidence(0, 0)).toBe('insufficient');
      expect(educationIntelligenceService.calculateEvidenceConfidence(2, 1)).toBe('low');
      expect(educationIntelligenceService.calculateEvidenceConfidence(5, 1)).toBe('moderate');
      expect(educationIntelligenceService.calculateEvidenceConfidence(10, 4)).toBe('high');
    });

    it('generates learner progress signals with evidence factors', async () => {
      const signals = await educationIntelligenceService.getLearnerProgressSignals();
      expect(signals.length).toBeGreaterThan(0);

      const urgent = signals.find((s) => s.priorityLevel === 'urgent_review');
      expect(urgent).toBeDefined();
      expect(urgent?.factors.length).toBeGreaterThan(0);
      expect(urgent?.recentTrend).toBe('declining');
    });

    it('flags low-performing/miskeyed questions in question quality profiles', () => {
      const profiles = educationIntelligenceService.getQuestionQualityProfiles();
      expect(profiles.length).toBeGreaterThan(0);

      const miskeyed = profiles.find((p) => p.status === 'possible_miskey');
      expect(miskeyed).toBeDefined();
      expect(miskeyed?.flaggedReasons.length).toBeGreaterThan(0);
    });
  });

  describe('interventionService — Intervention Groups & Outcomes', () => {
    it('creates intervention groups with target mastery success criteria', async () => {
      const group = await interventionService.createInterventionGroup({
        teacherId: 't1',
        teacherName: 'Mwalimu Kamau',
        subject: 'Mathematics',
        name: 'Algebra Group',
        learnerIds: ['learner_001', 'learner_002'],
        targetMastery: 75,
      });

      expect(group.id).toBeDefined();
      expect(group.status).toBe('active');
      expect(group.successCriteria[0].targetValue).toBe(75);
    });

    it('evaluates intervention outcomes accurately based on pre/post mastery gain', () => {
      const improved = interventionService.evaluateInterventionOutcome(40, 75, 70);
      expect(improved.isSuccess).toBe(true);
      expect(improved.outcome).toBe('improved');
      expect(improved.gain).toBe(35);

      const partial = interventionService.evaluateInterventionOutcome(40, 50, 70);
      expect(partial.outcome).toBe('partially_improved');

      const noChange = interventionService.evaluateInterventionOutcome(40, 42, 70);
      expect(noChange.outcome).toBe('no_clear_change');
    });
  });

  describe('benchmarkingService — Privacy & Small-Cohort Suppression', () => {
    it('suppresses anonymous peer benchmarking for cohorts under 10 learners or 5 schools', () => {
      const normal = benchmarkingService.getSchoolBenchmark('school_01', 'Form 4', 'Math', 45, 12);
      expect(normal.isSuppressedDueToSmallCohort).toBe(false);
      expect(normal.evidenceConfidence).toBe('moderate');

      const smallCohort = benchmarkingService.getSchoolBenchmark('school_01', 'Form 4', 'Math', 4, 12);
      expect(smallCohort.isSuppressedDueToSmallCohort).toBe(true);
      expect(smallCohort.evidenceConfidence).toBe('insufficient');
    });
  });

  describe('revisionImpactService — Revision Impact Correlation', () => {
    it('computes next-best activity recommendation deterministically', () => {
      const rec = revisionImpactService.getNextBestActivity('learner_001', 'Mathematics');
      expect(rec.recommendationType).toBe('ASSIGN_REVISION');
      expect(rec.priority).toBe('high');
      expect(rec.evidenceConfidence).toBe('moderate');
    });
  });
});
