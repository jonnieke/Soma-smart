/**
 * Phase 9 — Soma Growth OS Integration Tests
 * Tests: Growth profile, attribution, referral generation, anti-fraud self-referral, sales CRM pipeline, customer health, unit economics
 */

import { describe, it, expect } from 'vitest';
import { growthProfileService } from '../services/growthProfileService';
import { referralService } from '../services/referralService';
import { schoolSalesCRMService } from '../services/schoolSalesCRMService';
import { ambassadorCreatorService } from '../services/ambassadorCreatorService';
import { lifecycleMessagingService } from '../services/lifecycleMessagingService';
import { customerSuccessService } from '../services/customerSuccessService';
import { growthAnalyticsService } from '../services/growthAnalyticsService';

describe('Phase 9 — Soma Growth OS', () => {
  describe('growthProfileService — Attribution & Lifecycle', () => {
    it('initializes growth profile with acquisition attribution', () => {
      const profile = growthProfileService.getGrowthProfile('usr_teacher_001');
      expect(profile.userId).toBe('usr_teacher_001');
      expect(profile.activationStatus).toBe('activated');
      expect(profile.lifecycleStage).toBe('engaged');
    });

    it('updates user lifecycle stage correctly', () => {
      const updated = growthProfileService.updateLifecycleStage('usr_teacher_001', 'paying');
      expect(updated.lifecycleStage).toBe('paying');
    });
  });

  describe('referralService — Anti-Fraud & Reward Crediting', () => {
    it('generates signed referral codes', () => {
      const code = referralService.generateReferralCode('usr_teacher_001');
      expect(code).toContain('REF-');
      expect(code).toContain('-2026');
    });

    it('detects and blocks self-referral fraud', () => {
      const isSelf = referralService.isSelfReferral('usr_1', 'usr_1');
      expect(isSelf).toBe(true);

      const res = referralService.createReferral({
        referralCode: 'REF-USER1-2026',
        referrerUserId: 'usr_1',
        referredUserId: 'usr_1',
        referralType: 'teacher_refers_teacher',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Self-referrals are not allowed.');
    });

    it('qualifies and credits valid teacher referrals', () => {
      const res = referralService.createReferral({
        referralCode: 'REF-TEACH1-2026',
        referrerUserId: 'usr_teacher_001',
        referredUserId: 'usr_teacher_003',
        referralType: 'teacher_refers_teacher',
      });

      expect(res.success).toBe(true);
      expect(res.referral?.status).toBe('credited');
      expect(res.referral?.rewardValue).toBe(500);
    });
  });

  describe('schoolSalesCRMService — Lead Pipeline & Demos', () => {
    it('retrieves school sales CRM leads pipeline', () => {
      const leads = schoolSalesCRMService.getLeads();
      expect(leads.length).toBeGreaterThan(0);
      expect(leads[0].stage).toBe('demo_scheduled');
    });

    it('schedules school demonstration and starts school pilot', () => {
      const demo = schoolSalesCRMService.scheduleDemo({
        leadId: 'lead_001',
        schoolName: 'Lenana School',
        contactName: 'Mr. Njuguna',
        contactEmail: 'njuguna@lenana.ac.ke',
        preferredDate: '2026-08-10',
        attendeesCount: 20,
      });

      expect(demo.id).toBeDefined();
      expect(demo.status).toBe('scheduled');

      const pilot = schoolSalesCRMService.startPilot({
        leadId: 'lead_001',
        schoolId: 'school_lenana',
        schoolName: 'Lenana School',
        durationDays: 30,
        targetTeachersCount: 40,
      });

      expect(pilot.id).toBeDefined();
      expect(pilot.status).toBe('active');
    });
  });

  describe('customerSuccessService — Rules-First Health Scoring', () => {
    it('evaluates customer health score based on operational signals', () => {
      const healthy = customerSuccessService.calculateHealthScore(90, 85, 90);
      expect(healthy.score).toBeGreaterThanOrEqual(85);
      expect(healthy.healthBand).toBe('healthy');

      const critical = customerSuccessService.calculateHealthScore(20, 15, 10);
      expect(critical.score).toBeLessThan(50);
      expect(critical.healthBand).toBe('critical');
    });
  });

  describe('growthAnalyticsService — North Star & Unit Economics', () => {
    it('tracks North-Star metric and calculates unit-economics gross margin', () => {
      const ns = growthAnalyticsService.getNorthStarMetric();
      expect(ns.metricName).toBe('Weekly Successful Learning Cycles');
      expect(ns.currentValue).toBeGreaterThan(0);

      const ue = growthAnalyticsService.getUnitEconomicsSnapshot();
      expect(ue.grossMarginPercentage).toBeGreaterThan(50);
      expect(ue.totalRevenueKes).toBeGreaterThan(ue.totalAiCostKes);
    });
  });
});
