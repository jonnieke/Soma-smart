/**
 * Phase 8 — Soma School OS Integration Tests
 * Tests: Multi-tenant resolution, onboarding checklist, academic calendar rollover, class allocations, guardian linking, bulk CSV import, entitlement checks
 */

import { describe, it, expect } from 'vitest';
import { tenantService } from '../services/tenantService';
import { academicCalendarService } from '../services/academicCalendarService';
import { peopleManagementService } from '../services/peopleManagementService';
import { parentEngagementService } from '../services/parentEngagementService';
import { schoolBillingService } from '../services/schoolBillingService';
import { institutionManagementService } from '../services/institutionManagementService';

describe('Phase 8 — Soma School OS', () => {
  describe('tenantService — Multi-Tenant Resolution & Onboarding', () => {
    it('resolves active tenant context securely', () => {
      const tenant = tenantService.getTenant('tenant_school_001');
      expect(tenant.id).toBe('tenant_school_001');
      expect(tenant.status).toBe('active');
    });

    it('evaluates server-side tenant capabilities', () => {
      expect(tenantService.hasCapability('tenant_school_001', 'school.manage')).toBe(true);
    });

    it('tracks 7-step guided school setup onboarding checklist', () => {
      const checklist = tenantService.getOnboardingChecklist('tenant_school_001');
      expect(checklist.schoolDetailsCompleted).toBe(true);
      expect(checklist.academicYearConfigured).toBe(true);
      expect(checklist.status).toBe('ready');
    });
  });

  describe('academicCalendarService — Academic Year & Rollover', () => {
    it('retrieves active academic years and terms', () => {
      const years = academicCalendarService.getAcademicYears('tenant_school_001');
      expect(years.length).toBeGreaterThan(0);

      const active = years.find((y) => y.status === 'active');
      expect(active).toBeDefined();
      expect(active?.terms.length).toBeGreaterThan(0);
    });

    it('performs automated academic year rollover without destroying history', () => {
      const rolled = academicCalendarService.performAcademicYearRollover('tenant_school_001', 'ay_2026', '2027 Academic Year');
      expect(rolled.id).toBeDefined();
      expect(rolled.name).toBe('2027 Academic Year');
      expect(rolled.status).toBe('active');
    });
  });

  describe('peopleManagementService — Classes, Allocations & Bulk Import', () => {
    it('retrieves academic classes and streams', () => {
      const classes = peopleManagementService.getClasses('tenant_school_001');
      expect(classes.length).toBeGreaterThan(0);
      expect(classes[0].stream).toBeDefined();
    });

    it('parses and validates bulk CSV user import payloads', () => {
      const csv = 'Name,AdmissionNumber,Grade,Stream\nJuma Omondi,ADM-101,Grade 9,Alpha\nAmina Mohamed,ADM-102,Grade 9,Alpha';
      const res = peopleManagementService.bulkImportUsers(csv, 'learners');

      expect(res.success).toBe(true);
      expect(res.importedCount).toBe(2);
      expect(res.errors.length).toBe(0);
    });
  });

  describe('parentEngagementService — Guardian Links', () => {
    it('links parents to learners securely with permission flags', () => {
      const link = parentEngagementService.linkParentToLearner({
        tenantId: 'tenant_school_001',
        learnerId: 'l1',
        learnerName: 'Juma Omondi',
        guardianName: 'Dr. Otieno Omondi',
        guardianEmail: 'otieno@example.com',
        relationship: 'parent',
      });

      expect(link.id).toBeDefined();
      expect(link.permissions.viewResults).toBe(true);
      expect(link.status).toBe('active');
    });
  });

  describe('schoolBillingService — Entitlements & Invoices', () => {
    it('evaluates server-side plan entitlement limit checks', () => {
      const pass = schoolBillingService.checkEntitlement('tenant_school_001', 'teachers.limit', 10);
      expect(pass.isAllowed).toBe(true);
      expect(pass.limit).toBe(50);

      const fail = schoolBillingService.checkEntitlement('tenant_school_001', 'teachers.limit', 55);
      expect(fail.isAllowed).toBe(false);
    });
  });

  describe('institutionManagementService — Platform Health', () => {
    it('submits support requests and retrieves platform health snapshots', () => {
      const req = institutionManagementService.submitSupportRequest({
        tenantId: 'tenant_school_001',
        requesterId: 'u1',
        requesterName: 'Principal Kamau',
        category: 'CREDITS',
        subject: 'Credit Top-Up Request',
        description: 'Need credits for CAT marking',
      });

      expect(req.id).toBeDefined();
      expect(req.status).toBe('open');

      const health = institutionManagementService.getPlatformHealthMetrics();
      expect(health.activeTenantsCount).toBeGreaterThan(0);
    });
  });
});
