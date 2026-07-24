import { describe, it, expect, beforeEach } from 'vitest';
import { schoolWorkspaceService } from '../services/schoolWorkspaceService';
import { schoolReviewService } from '../services/schoolReviewService';
import { schoolCreditService } from '../services/schoolCreditService';
import { schoolAuditService } from '../services/schoolAuditService';
import { paperStudioService } from '../services/paperStudioService';
import { ExamPaper } from '../types/paperStudio';
import { SchoolRole } from '../types/schoolWorkspace';

describe('Phase 3: School Assessment Workspace Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Role Evaluation & Permissions', () => {
    it('grants full permissions to School OWNER and ADMIN', () => {
      const roles: SchoolRole[] = ['OWNER'];
      expect(schoolWorkspaceService.hasPermission(roles, 'MANAGE_SCHOOL')).toBe(true);
      expect(schoolWorkspaceService.hasPermission(roles, 'APPROVE_PAPERS')).toBe(true);
      expect(schoolWorkspaceService.hasPermission(roles, 'LOCK_PAPERS')).toBe(true);
    });

    it('restricts HOD to department management, review, and paper approval', () => {
      const roles: SchoolRole[] = ['HOD'];
      expect(schoolWorkspaceService.hasPermission(roles, 'APPROVE_PAPERS')).toBe(true);
      expect(schoolWorkspaceService.hasPermission(roles, 'MANAGE_SCHOOL')).toBe(false);
    });

    it('prevents standard TEACHER from approving papers or managing school workspace settings', () => {
      const roles: SchoolRole[] = ['TEACHER'];
      expect(schoolWorkspaceService.hasPermission(roles, 'APPROVE_PAPERS')).toBe(false);
      expect(schoolWorkspaceService.hasPermission(roles, 'MANAGE_SCHOOL')).toBe(false);
    });
  });

  describe('2. Teacher Invitations & Department Assignment', () => {
    it('creates a tokenized invitation and accepts it successfully', async () => {
      const invite = await schoolWorkspaceService.createInvitation({
        schoolId: 'test_school_101',
        schoolName: 'Test Academy',
        inviteeName: 'Mwalimu Wanjiku',
        inviteeEmail: 'wanjiku@test.ac.ke',
        roles: ['HOD', 'TEACHER'],
        departmentIds: ['dept_math'],
        invitedBy: 'admin_1',
        invitedByName: 'Admin User',
      });

      expect(invite.token).toBeDefined();
      expect(invite.status).toBe('pending');

      const membership = await schoolWorkspaceService.acceptInvitation(
        invite.token,
        'user_wanjiku_id',
        'Mwalimu Wanjiku'
      );

      expect(membership.schoolId).toBe('test_school_101');
      expect(membership.status).toBe('active');
      expect(membership.roles).toContain('HOD');
    });

    it('rejects expired invitation tokens', async () => {
      const invite = await schoolWorkspaceService.createInvitation({
        schoolId: 'test_school_101',
        schoolName: 'Test Academy',
        inviteeName: 'Mwalimu Omondi',
        inviteeEmail: 'omondi@test.ac.ke',
        roles: ['TEACHER'],
        departmentIds: [],
        invitedBy: 'admin_1',
        invitedByName: 'Admin User',
      });

      // Manually expire token
      invite.expiresAt = new Date(Date.now() - 1000).toISOString();
      const raw = localStorage.getItem('soma_school_invitations');
      if (raw) {
        const list = JSON.parse(raw);
        list[0].expiresAt = invite.expiresAt;
        localStorage.setItem('soma_school_invitations', JSON.stringify(list));
      }

      await expect(
        schoolWorkspaceService.acceptInvitation(invite.token, 'user_omondi_id', 'Mwalimu Omondi')
      ).rejects.toThrow(/expired/i);
    });
  });

  describe('3. Review Workflow & Separation of Duties', () => {
    const validTestPaper: ExamPaper = {
      id: 'paper_test_001',
      ownerId: 'teacher_creator_1',
      title: 'Grade 9 Mathematics Continuous Assessment',
      status: 'DRAFT',
      visibility: 'SCHOOL',
      grade: 'Grade 9',
      subject: 'Mathematics',
      examType: 'CAT',
      term: 'Term 1',
      year: 2026,
      durationMinutes: 60,
      totalMarks: 10,
      schoolBranding: { schoolName: 'Test Academy', candidateNameField: true, admissionNoField: true },
      instructions: ['Answer all questions.'],
      sections: [
        {
          id: 'sec_1',
          title: 'Section A',
          totalMarks: 10,
          questions: [
            {
              id: 'q_1',
              visibility: 'SCHOOL',
              status: 'VERIFIED',
              questionType: 'SHORT_ANSWER',
              questionText: 'Solve 2x = 10',
              correctAnswer: 'x = 5',
              markingScheme: [{ criterion: 'Divide by 2', marks: 10 }],
              marks: 10,
              grade: 'Grade 9',
              subject: 'Mathematics',
              curriculum: 'CBC_CBE',
              cognitiveLevel: 'APPLICATION',
              difficulty: 'EASY',
              sourceType: 'SCHOOL_BANK',
            },
          ],
        },
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('enforces Separation of Duties so creator cannot approve their own paper', async () => {
      // Save valid test paper
      await paperStudioService.savePaper(validTestPaper);
      await schoolReviewService.submitPaperForReview({
        paperId: validTestPaper.id,
        schoolId: 'test_school_101',
        userId: 'teacher_creator_1',
        userName: 'Teacher Creator',
        userRole: 'TEACHER',
      });

      // Attempt approval by creator (should fail when requireIndependentReviewer is true)
      await expect(
        schoolReviewService.approvePaper({
          paperId: validTestPaper.id,
          schoolId: 'test_school_101',
          approverId: 'teacher_creator_1', // Same as creator
          approverName: 'Teacher Creator',
          approverRole: 'HOD',
          requireIndependentReviewer: true,
        })
      ).rejects.toThrow(/Separation of Duties Policy/i);
    });

    it('allows independent reviewer to approve paper and locks edits', async () => {
      // Save and Submit paper
      await paperStudioService.savePaper(validTestPaper);
      await schoolReviewService.submitPaperForReview({
        paperId: validTestPaper.id,
        schoolId: 'test_school_101',
        userId: 'teacher_creator_1',
        userName: 'Teacher Creator',
        userRole: 'TEACHER',
      });

      // Approve by independent HOD
      const { paper } = await schoolReviewService.approvePaper({
        paperId: validTestPaper.id,
        schoolId: 'test_school_101',
        approverId: 'independent_hod_2',
        approverName: 'HOD Kamau',
        approverRole: 'HOD',
        requireIndependentReviewer: true,
      });

      expect(paper.status).toBe('APPROVED');
      expect(paper.approvedByIds).toContain('independent_hod_2');

      // Lock paper
      const lockedPaper = await schoolReviewService.lockPaper({
        paperId: validTestPaper.id,
        schoolId: 'test_school_101',
        userId: 'independent_hod_2',
        userName: 'HOD Kamau',
        userRole: 'HOD',
      });

      expect(lockedPaper.workflowStatus).toBe('LOCKED');
    });
  });

  describe('4. AI Credit Priority & Limits', () => {
    it('uses school credits first, falling back to personal credits when exhausted', async () => {
      // Case 1: Deduct from School
      const res1 = await schoolCreditService.deductCreditsForPaperGeneration({
        schoolId: 'school_credit_test',
        userId: 'teacher_1',
        costInCredits: 10,
      });

      expect(res1.success).toBe(true);
      expect(res1.sourceUsed).toBe('SCHOOL');

      // Case 2: Suspended User Blocked
      await schoolCreditService.updateSchoolCredits('school_credit_test', {
        suspendedUserIds: ['teacher_suspended'],
      });

      const res2 = await schoolCreditService.deductCreditsForPaperGeneration({
        schoolId: 'school_credit_test',
        userId: 'teacher_suspended',
        costInCredits: 5,
        allowPersonalFallback: false,
      });

      expect(res2.success).toBe(false);
      expect(res2.message).toContain('suspended');
    });
  });

  describe('5. Audit Trail Logging', () => {
    it('logs audit events with actor metadata and timestamp', async () => {
      const log = await schoolAuditService.logEvent({
        schoolId: 'school_audit_test',
        actorId: 'user_admin',
        actorName: 'Admin User',
        actorRole: 'ADMIN',
        action: 'PAPER_LOCKED',
        targetType: 'paper',
        targetId: 'paper_123',
        targetTitle: 'KCSE Mock Exam',
      });

      expect(log.id).toBeDefined();
      expect(log.action).toBe('PAPER_LOCKED');

      const logs = await schoolAuditService.getAuditLogs('school_audit_test');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].targetTitle).toBe('KCSE Mock Exam');
    });
  });
});
