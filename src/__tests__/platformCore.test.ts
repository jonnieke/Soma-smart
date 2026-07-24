/**
 * Phase 10 — Soma Platform Core Integration Tests
 * Tests: Platform health & SLOs, incident response, AI model governance, API platform credentials, country configurations, security & privacy requests
 */

import { describe, it, expect } from 'vitest';
import { platformHealthService } from '../services/platformHealthService';
import { incidentManagementService } from '../services/incidentManagementService';
import { aiGovernanceService } from '../services/aiGovernanceService';
import { apiPlatformService } from '../services/apiPlatformService';
import { countryManagementService } from '../services/countryManagementService';
import { securityPrivacyService } from '../services/securityPrivacyService';

describe('Phase 10 — Soma Platform Core', () => {
  describe('platformHealthService — Service Catalogue & SLOs', () => {
    it('retrieves platform services catalog', () => {
      const services = platformHealthService.getServices();
      expect(services.length).toBeGreaterThan(0);
      expect(services[0].criticality).toBe('critical');
      expect(services[0].dataClassification).toBe('restricted');
    });

    it('retrieves active SLOs and RPO/RTO recovery targets', () => {
      const slos = platformHealthService.getSLOs();
      expect(slos.length).toBeGreaterThan(0);
      expect(slos[0].targetPercentage).toBeGreaterThanOrEqual(99.0);

      const rpos = platformHealthService.getRecoveryObjectives();
      expect(rpos.length).toBeGreaterThan(0);
      expect(rpos[0].recoveryPointObjectiveMinutes).toBeLessThanOrEqual(5);
    });
  });

  describe('incidentManagementService — SEV Levels & Incident Response', () => {
    it('creates, updates status, and resolves platform incidents', () => {
      const inc = incidentManagementService.createIncident({
        title: 'M-Pesa Webhook Buffer Lag',
        severity: 'sev2',
        serviceIds: ['srv_payments_003'],
        customerImpact: 'Delayed payment confirmation for 5 schools.',
      });

      expect(inc.id).toBeDefined();
      expect(inc.status).toBe('detected');
      expect(inc.severity).toBe('sev2');

      const resolved = incidentManagementService.updateIncidentStatus(inc.id, 'resolved', 'Flushed webhook queue and expanded pod capacity');
      expect(resolved?.status).toBe('resolved');
      expect(resolved?.resolvedAt).toBeDefined();
    });
  });

  describe('aiGovernanceService — Model Registry & Human Review', () => {
    it('retrieves registered AI models and approved prompt versions', () => {
      const models = aiGovernanceService.getModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].provider).toBe('Google Gemini');
      expect(models[0].supportsStructuredOutput).toBe(true);

      const prompts = aiGovernanceService.getPrompts();
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts[0].status).toBe('approved');
    });

    it('enforces mandatory human review for high-stakes AI actions', () => {
      const requiresHighStakes = aiGovernanceService.requiresHumanReview('official_exam_publication', 'low');
      expect(requiresHighStakes).toBe(true);

      const requiresHighRisk = aiGovernanceService.requiresHumanReview('subjective_marking', 'high');
      expect(requiresHighRisk).toBe(true);

      const standardAction = aiGovernanceService.requiresHumanReview('chat_tutoring', 'low');
      expect(standardAction).toBe(false);
    });
  });

  describe('apiPlatformService — Developer Portal & Credentials', () => {
    it('creates developer applications and generates hashed API credentials', () => {
      const app = apiPlatformService.createApplication({
        tenantId: 'tenant_school_001',
        name: 'Portal Sync Application',
        allowedScopes: ['schools.read', 'results.read'],
        ownerUserId: 'usr_dev_001',
      });

      expect(app.id).toBeDefined();
      expect(app.status).toBe('approved');

      const { credential, rawKey } = apiPlatformService.generateApiKey(app.id, 'Primary Secret Key', app.allowedScopes);
      expect(rawKey).toContain('soma_live_');
      expect(credential.keyPrefix).toBe(rawKey.substring(0, 14));
      expect(credential.hashedSecret).toBeDefined();
    });
  });

  describe('countryManagementService — Multi-Country Expansion', () => {
    it('retrieves country configurations and handles fallback', () => {
      const countries = countryManagementService.getCountries();
      expect(countries.length).toBeGreaterThan(0);

      const kenya = countryManagementService.getCountryByCode('KE');
      expect(kenya.countryCode).toBe('KE');
      expect(kenya.currencyCode).toBe('KES');

      const uganda = countryManagementService.getCountryByCode('UG');
      expect(uganda.countryCode).toBe('UG');
      expect(uganda.currencyCode).toBe('UGX');
    });
  });

  describe('securityPrivacyService — Data Governance & Privacy Requests', () => {
    it('submits privacy requests and inspects statutory retention rules', () => {
      const req = securityPrivacyService.submitPrivacyRequest('usr_teacher_99', 'export', 'Personal data export requested');
      expect(req.id).toBeDefined();
      expect(req.status).toBe('submitted');

      const retention = securityPrivacyService.getRetentionPolicies();
      expect(retention.length).toBeGreaterThan(0);
      expect(retention[0].legalHoldSupported).toBe(true);
    });
  });
});
