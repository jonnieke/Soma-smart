/**
 * Phase 11 — Soma Strategic Intelligence Layer Integration Tests
 * Tests: Knowledge graph, evidence networks, misconceptions, content impact, contributor reputation, research governance, platform economics & gross margins
 */

import { describe, it, expect } from 'vitest';
import { curriculumKnowledgeGraphService } from '../services/curriculumKnowledgeGraphService';
import { questionPaperEvidenceService } from '../services/questionPaperEvidenceService';
import { misconceptionContentImpactService } from '../services/misconceptionContentImpactService';
import { contributorRoyaltyService } from '../services/contributorRoyaltyService';
import { researchGovernanceService } from '../services/researchGovernanceService';
import { platformEconomicsService } from '../services/platformEconomicsService';

describe('Phase 11 — Soma Strategic Intelligence Layer', () => {
  describe('curriculumKnowledgeGraphService — Knowledge Graph', () => {
    it('retrieves graph nodes and approved relationships', () => {
      const nodes = curriculumKnowledgeGraphService.getNodes();
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes[0].type).toBe('learning_outcome');

      const rels = curriculumKnowledgeGraphService.getRelationships();
      expect(rels.length).toBeGreaterThan(0);
      expect(rels[0].status).toBe('approved');
    });

    it('traverses prerequisite chains for target learning outcomes', () => {
      const prereqs = curriculumKnowledgeGraphService.getPrerequisites('node_num_addition');
      expect(prereqs.length).toBeGreaterThan(0);
      expect(prereqs[0].id).toBe('node_num_place_val');
    });
  });

  describe('questionPaperEvidenceService — Evidence Networks', () => {
    it('retrieves question evidence profiles and statistical confidence', () => {
      const qProfiles = questionPaperEvidenceService.getQuestionProfiles();
      expect(qProfiles.length).toBeGreaterThan(0);
      expect(qProfiles[0].evidenceConfidence).toBe('high');
      expect(qProfiles[0].observedDifficulty).toBeDefined();

      const confHigh = questionPaperEvidenceService.calculateConfidence(600, 15);
      expect(confHigh).toBe('high');

      const confLow = questionPaperEvidenceService.calculateConfidence(10, 1);
      expect(confLow).toBe('insufficient');
    });

    it('retrieves paper evidence profiles and blueprint compliance', () => {
      const pProfiles = questionPaperEvidenceService.getPaperProfiles();
      expect(pProfiles.length).toBeGreaterThan(0);
      expect(pProfiles[0].blueprintComplianceScore).toBeGreaterThan(90);
    });
  });

  describe('misconceptionContentImpactService — Misconceptions & Delta', () => {
    it('retrieves curriculum misconceptions and content impact profiles', () => {
      const misconceptions = misconceptionContentImpactService.getMisconceptions();
      expect(misconceptions.length).toBeGreaterThan(0);
      expect(misconceptions[0].status).toBe('specialist_verified');

      const impacts = misconceptionContentImpactService.getContentImpactProfiles();
      expect(impacts.length).toBeGreaterThan(0);
      expect(impacts[0].observedChange).toBeGreaterThan(0);
    });
  });

  describe('contributorRoyaltyService — Reputation & Royalties', () => {
    it('retrieves contributor reputation and item-level royalty snapshots', () => {
      const reps = contributorRoyaltyService.getReputations();
      expect(reps.length).toBeGreaterThan(0);
      expect(reps[0].reputationBand).toBe('specialist');

      const roys = contributorRoyaltyService.getRoyaltyAllocations();
      expect(roys.length).toBeGreaterThan(0);
      expect(roys[0].earningAmount).toBeGreaterThan(0);
    });
  });

  describe('researchGovernanceService — Research Governance & Cell Suppression', () => {
    it('retrieves research project approvals and suppresses small-cell cohorts', () => {
      const projects = researchGovernanceService.getProjects();
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].status).toBe('approved');

      const data = [
        { group: 'School A', count: 45 },
        { group: 'School B', count: 4 }, // under 10
      ];

      const safeData = researchGovernanceService.suppressSmallCells(data, 'count', 10);
      expect(safeData.length).toBe(1);
      expect(safeData[0].group).toBe('School A');
    });
  });

  describe('platformEconomicsService — Cost Ledger & Margins', () => {
    it('logs cost events and calculates gross margin & value reports', () => {
      const costEv = platformEconomicsService.logCostEvent({
        costCategory: 'ai',
        feature: 'Paper Studio Generation',
        amount: 25.5,
        currency: 'KES',
      });
      expect(costEv.id).toBeDefined();

      const margin = platformEconomicsService.getGrossMarginSnapshot();
      expect(margin.grossMarginPercentage).toBeGreaterThan(50);

      const paperEcon = platformEconomicsService.getPaperEconomics();
      expect(paperEcon[0].questionReuseRatePct).toBeGreaterThan(50);

      const schoolVal = platformEconomicsService.getSchoolValueReport();
      expect(schoolVal.teacherHoursSavedEstimate).toBeGreaterThan(0);

      const teacherVal = platformEconomicsService.getTeacherValueReport();
      expect(teacherVal.timeSavingHoursEstimate).toBeGreaterThan(0);
    });
  });
});
