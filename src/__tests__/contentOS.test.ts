/**
 * Phase 7 — Soma Content OS Integration Tests
 * Tests: Curriculum hierarchy, versioning, resource studio blocks, scheme of work builder, rights enforcement, curriculum importer
 */

import { describe, it, expect } from 'vitest';
import { curriculumOSService } from '../services/curriculumOSService';
import { resourceStudioService } from '../services/resourceStudioService';
import { teacherPlanningService } from '../services/teacherPlanningService';
import { schoolContentLibraryService } from '../services/schoolContentLibraryService';
import { publisherPortalService } from '../services/publisherPortalService';

describe('Phase 7 — Soma Content OS', () => {
  describe('curriculumOSService — Curriculum Frameworks & Node Traversal', () => {
    it('retrieves active curriculum frameworks including KICD CBC', () => {
      const frameworks = curriculumOSService.getFrameworks();
      expect(frameworks.length).toBeGreaterThan(0);

      const cbc = frameworks.find((f) => f.educationSystem === 'CBC_CBE');
      expect(cbc).toBeDefined();
      expect(cbc?.authority).toBe('KICD');
    });

    it('navigates curriculum node hierarchy (strands, sub-strands, learning outcomes)', () => {
      const nodes = curriculumOSService.getNodesForFramework('fw_kicd_cbc', 'Grade 9', 'Mathematics');
      expect(nodes.length).toBeGreaterThan(0);

      const outcome = nodes.find((n) => n.type === 'learning_outcome');
      expect(outcome).toBeDefined();
      expect(outcome?.parentId).toBeDefined();
    });

    it('imports curriculum framework nodes via administrative JSON importer', () => {
      const payload = JSON.stringify({
        frameworkId: 'fw_kicd_test',
        nodes: [
          { id: 'n1', frameworkId: 'fw_kicd_test', type: 'strand', title: 'Algebra', versionId: 'v1', status: 'active' },
        ],
      });

      const res = curriculumOSService.importCurriculumFramework(payload);
      expect(res.success).toBe(true);
      expect(res.importedNodesCount).toBe(1);
    });
  });

  describe('resourceStudioService — Reusable Content Blocks', () => {
    it('saves and retrieves block-structured educational resources', () => {
      const initial = resourceStudioService.getResources();
      expect(initial.length).toBeGreaterThan(0);

      const res = initial[0];
      expect(res.contentBlocks.length).toBeGreaterThan(0);

      const updated = resourceStudioService.saveResource({
        ...res,
        title: 'Updated Cylinder Lesson Notes',
      });
      expect(updated.title).toBe('Updated Cylinder Lesson Notes');
    });

    it('generates structured AI block content with schema validation', () => {
      const block = resourceStudioService.generateAIBlock('worked_example', 'Mensuration', 'Grade 9');
      expect(block.id).toBeDefined();
      expect(block.type).toBe('worked_example');
      expect(block.content.text).toContain('Mensuration');
    });
  });

  describe('teacherPlanningService — Scheme of Work Builder', () => {
    it('generates an automated Scheme of Work respecting term weeks and lessons per week', () => {
      const scheme = teacherPlanningService.generateSchemeOfWork({
        teacherId: 't1',
        teacherName: 'Mwalimu Kamau',
        grade: 'Grade 9',
        subject: 'Mathematics',
        term: 'Term 1',
        termWeeksCount: 8,
        lessonsPerWeek: 3,
      });

      expect(scheme.id).toBeDefined();
      expect(scheme.weeks.length).toBe(24); // 8 weeks * 3 lessons
      expect(scheme.weeks[0].weekNumber).toBe(1);
    });
  });

  describe('schoolContentLibraryService — Rights & Requests', () => {
    it('validates server-side content rights permissions correctly', () => {
      const access = schoolContentLibraryService.validateContentRights('rgt_001', 'teacher', 'teacher_kamau');
      expect(access.canView).toBe(true);
      expect(access.canEdit).toBe(true);
    });

    it('submits teacher resource requests', () => {
      const req = schoolContentLibraryService.createContentRequest({
        teacherId: 't1',
        teacherName: 'Mwalimu Kamau',
        grade: 'Grade 9',
        subject: 'Integrated Science',
        curriculumOutcome: 'Lab Safety Guide',
        description: 'Need safety instructions poster',
      });

      expect(req.id).toBeDefined();
      expect(req.status).toBe('open');
    });
  });

  describe('publisherPortalService — Institutional Publishing Partners', () => {
    it('registers and tracks institutional publisher profiles', () => {
      const pub = publisherPortalService.registerPublisher('Oxford University Press EA', 'kenya@oup.com');
      expect(pub.id).toBeDefined();
      expect(pub.status).toBe('pending_verification');
    });
  });
});
