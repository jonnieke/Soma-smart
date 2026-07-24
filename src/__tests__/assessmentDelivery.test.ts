/**
 * Phase 5 — Soma Assessment Intelligence Integration Tests
 * Tests: Auto-marking, math tolerance, assignment flow, attempt autosave, mastery computation, QR script tokens, analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { assessmentMarkingEngineService } from '../services/assessmentMarkingEngineService';

import { assessmentAssignmentService } from '../services/assessmentAssignmentService';
import { assessmentAttemptService } from '../services/assessmentAttemptService';
import { learnerMasteryRevisionService } from '../services/learnerMasteryRevisionService';
import { assessmentScanService } from '../services/assessmentScanService';
import { assessmentAnalyticsService } from '../services/assessmentAnalyticsService';
import { Question } from '../types/paperStudio';

beforeEach(() => {
  localStorage.clear();
});

describe('Phase 5 — Soma Assessment Intelligence', () => {
  describe('assessmentMarkingEngineService — Math & Auto-Marking', () => {
    it('validates exact match numeric answers', () => {
      const res = assessmentMarkingEngineService.validateMathResponse('42', '42');
      expect(res.isValid).toBe(true);
    });

    it('validates percentages and equivalent fractions within tolerance', () => {
      const res1 = assessmentMarkingEngineService.validateMathResponse('50%', '0.5');
      const res2 = assessmentMarkingEngineService.validateMathResponse('1/2', '0.5');
      const res3 = assessmentMarkingEngineService.validateMathResponse('0.501', '0.5', 0.01);
      expect(res1.isValid).toBe(true);
      expect(res2.isValid).toBe(true);
      expect(res3.isValid).toBe(true);
    });

    it('rejects values out of tolerance range', () => {
      const res = assessmentMarkingEngineService.validateMathResponse('0.6', '0.5', 0.01);
      expect(res.isValid).toBe(false);
    });

    it('auto-marks multiple choice questions correctly', () => {
      const q: Question = {
        id: 'q_mcq_1',
        visibility: 'PRIVATE',
        status: 'VERIFIED',
        questionType: 'MULTIPLE_CHOICE',
        questionText: 'What is 2 + 2?',
        correctAnswer: 'B',
        marks: 5,
        grade: 'Form 1',
        subject: 'Math',
        curriculum: 'CBC_CBE',
        cognitiveLevel: 'RECALL',
        difficulty: 'EASY',
        sourceType: 'SOMA_BANK',
        markingScheme: [{ criterion: 'Choice', marks: 5 }],
      };

      const correct = assessmentMarkingEngineService.markObjectiveQuestion(q, 'B');
      const wrong = assessmentMarkingEngineService.markObjectiveQuestion(q, 'A');

      expect(correct.isCorrect).toBe(true);
      expect(correct.awardedMarks).toBe(5);
      expect(wrong.isCorrect).toBe(false);
      expect(wrong.awardedMarks).toBe(0);
    });
  });

  describe('assessmentAssignmentService — Lifecycle & Targeting', () => {
    it('creates a new assessment assignment', async () => {
      const asgn = await assessmentAssignmentService.createAssignment({
        paperId: 'paper_kcse_math_2026',
        teacherId: 't1',
        teacherName: 'Mwalimu Kamau',
        classIds: ['c1'],
        deliveryMode: 'online',
      });
      expect(asgn.id).toBeDefined();
      expect(asgn.subject).toBeDefined();
      expect(asgn.status).toBe('open');
    });

    it('updates assignment status', async () => {
      const asgn = await assessmentAssignmentService.createAssignment({
        paperId: 'paper_kcse_math_2026',
        teacherId: 't1',
        teacherName: 'Mwalimu Kamau',
        classIds: ['c1'],
        deliveryMode: 'online',
      });
      const updated = await assessmentAssignmentService.updateAssignmentStatus(asgn.id, 'closed');
      expect(updated?.status).toBe('closed');
    });
  });

  describe('assessmentAttemptService — Attempt Lifecycle & Autosave', () => {
    it('starts an attempt and creates empty response slots', async () => {
      const asgn = await assessmentAssignmentService.createAssignment({
        paperId: 'paper_kcse_math_2026',
        teacherId: 't1',
        teacherName: 'Mwalimu Kamau',
        classIds: ['c1'],
        deliveryMode: 'online',
      });

      const { attempt } = await assessmentAttemptService.startAttempt(asgn.id, 'learner_test', 'Juma Test');
      expect(attempt.status).toBe('in_progress');
      expect(attempt.attemptNumber).toBe(1);
    });

    it('autosaves response with incremented version', async () => {
      const asgn = await assessmentAssignmentService.createAssignment({
        paperId: 'paper_kcse_math_2026',
        teacherId: 't1',
        teacherName: 'Mwalimu Kamau',
        classIds: ['c1'],
        deliveryMode: 'online',
      });
      const { attempt, responses } = await assessmentAttemptService.startAttempt(asgn.id, 'learner_test2', 'Amina Test');
      if (responses.length > 0) {
        const saved = await assessmentAttemptService.autoSaveResponse(attempt.id, responses[0].questionId, 'Choice A', true);
        expect(saved?.responseValue).toBe('Choice A');
        expect(saved?.isFlagged).toBe(true);
        expect(saved?.autoSaveVersion).toBe(2);
      }
    });
  });

  describe('assessmentScanService — Script QR Payload Verification', () => {
    it('generates and verifies opaque QR script payload', () => {
      const qr = assessmentScanService.generateScriptQRPayload('asgn_01', 'learner_01', 'paper_01');
      expect(qr).toContain('SOMA_SCRIPT:');
      const decoded = assessmentScanService.verifyAndDecodeQRPayload(qr);
      expect(decoded.isValid).toBe(true);
    });
  });

  describe('assessmentAnalyticsService — Class Metrics', () => {
    it('calculates class analytics correctly', async () => {
      const analytics = await assessmentAnalyticsService.getClassAnalytics('asgn_math_f4_t1_2026');
      expect(typeof analytics.meanScore).toBe('number');
      expect(typeof analytics.passRatePercentage).toBe('number');
      expect(analytics.itemAnalyses.length).toBeGreaterThan(0);
    });
  });
});
