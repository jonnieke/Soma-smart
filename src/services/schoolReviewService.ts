import { ReviewComment, PaperVersion, PaperWorkflowStatus } from '../types/schoolWorkspace';
import { ExamPaper } from '../types/paperStudio';
import { paperStudioService } from './paperStudioService';
import { schoolAuditService } from './schoolAuditService';
import { supabase } from '../lib/supabase';

const REVIEW_COMMENTS_STORAGE_KEY = 'soma_paper_review_comments';
const PAPER_VERSIONS_STORAGE_KEY = 'soma_paper_version_snapshots';

export const schoolReviewService = {
  /**
   * Validates if paper is ready for review submission or final approval
   */
  validatePaperForApproval(paper: ExamPaper): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check calculated marks vs declared total marks
    const calculatedTotal = paper.sections.reduce(
      (sum, sec) => sum + sec.questions.reduce((qSum, q) => qSum + q.marks, 0),
      0
    );

    if (calculatedTotal !== paper.totalMarks) {
      errors.push(
        `Total paper marks (${paper.totalMarks}) does not match sum of question marks (${calculatedTotal}).`
      );
    }

    if (paper.sections.length === 0) {
      errors.push('Paper must contain at least one examination section.');
    }

    let emptyQuestionCount = 0;
    let missingMarkingSchemeCount = 0;

    paper.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        if (!q.questionText || q.questionText.trim().length === 0) emptyQuestionCount++;
        if (!q.markingScheme || q.markingScheme.length === 0) missingMarkingSchemeCount++;
      });
    });

    if (emptyQuestionCount > 0) {
      errors.push(`${emptyQuestionCount} question(s) have empty question text.`);
    }

    if (missingMarkingSchemeCount > 0) {
      errors.push(`${missingMarkingSchemeCount} question(s) are missing marking scheme criteria.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Submits a paper for review
   */
  async submitPaperForReview(params: {
    paperId: string;
    schoolId: string;
    userId: string;
    userName: string;
    userRole: string;
    assignedReviewerIds?: string[];
    submissionNotes?: string;
  }): Promise<ExamPaper> {
    const paper = await paperStudioService.getPaperById(params.paperId);
    if (!paper) throw new Error('Paper not found');

    // Validate paper
    const validation = this.validatePaperForApproval(paper);
    if (!validation.isValid) {
      throw new Error(`Cannot submit paper: ${validation.errors.join(' ')}`);
    }

    const updatedPaper: ExamPaper = {
      ...paper,
      schoolId: params.schoolId,
      status: 'REVIEWED', // Compatible with ExamPaper status type
      workflowStatus: 'SUBMITTED_FOR_REVIEW',
      assignedReviewerIds: params.assignedReviewerIds || paper.assignedReviewerIds,
      updatedAt: new Date().toISOString(),
    };

    await paperStudioService.savePaper(updatedPaper);
    await this.createVersionSnapshot(updatedPaper, params.userId, params.userName, 'Submitted paper for school review');

    await schoolAuditService.logEvent({
      schoolId: params.schoolId,
      actorId: params.userId,
      actorName: params.userName,
      actorRole: params.userRole,
      action: 'PAPER_SUBMITTED',
      targetType: 'paper',
      targetId: paper.id,
      targetTitle: paper.title,
      reason: params.submissionNotes,
    });

    return updatedPaper;
  },

  /**
   * Approves a paper with independent reviewer verification
   */
  async approvePaper(params: {
    paperId: string;
    schoolId: string;
    approverId: string;
    approverName: string;
    approverRole: string;
    requireIndependentReviewer?: boolean;
    approvalNotes?: string;
  }): Promise<{ paper: ExamPaper; warning?: string }> {
    const paper = await paperStudioService.getPaperById(params.paperId);
    if (!paper) throw new Error('Paper not found');

    const requireIndependent = params.requireIndependentReviewer !== false;

    // Separation of Duties Enforcement: Creator cannot approve their own paper
    if (requireIndependent && paper.ownerId === params.approverId) {
      throw new Error('Separation of Duties Policy: As the creator of this paper, you cannot approve it. An independent reviewer must approve.');
    }

    const validation = this.validatePaperForApproval(paper);
    if (!validation.isValid) {
      throw new Error(`Cannot approve paper: ${validation.errors.join(' ')}`);
    }

    const approvedByIds = [...(paper.approvedByIds || []), params.approverId];

    const updatedPaper: ExamPaper = {
      ...paper,
      status: 'APPROVED',
      workflowStatus: 'APPROVED',
      approvedByIds,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await paperStudioService.savePaper(updatedPaper);
    await this.createVersionSnapshot(updatedPaper, params.approverId, params.approverName, 'Approved examination paper');

    await schoolAuditService.logEvent({
      schoolId: params.schoolId,
      actorId: params.approverId,
      actorName: params.approverName,
      actorRole: params.approverRole,
      action: 'PAPER_APPROVED',
      targetType: 'paper',
      targetId: paper.id,
      targetTitle: paper.title,
      reason: params.approvalNotes,
    });

    return { paper: updatedPaper };
  },

  /**
   * Requests changes on a paper
   */
  async requestChanges(params: {
    paperId: string;
    schoolId: string;
    reviewerId: string;
    reviewerName: string;
    reviewerRole: string;
    feedback: string;
  }): Promise<ExamPaper> {
    const paper = await paperStudioService.getPaperById(params.paperId);
    if (!paper) throw new Error('Paper not found');

    const updatedPaper: ExamPaper = {
      ...paper,
      status: 'DRAFT',
      workflowStatus: 'CHANGES_REQUESTED',
      updatedAt: new Date().toISOString(),
    };

    await paperStudioService.savePaper(updatedPaper);

    // Add feedback comment
    await this.addComment({
      schoolId: params.schoolId,
      paperId: params.paperId,
      authorId: params.reviewerId,
      authorName: params.reviewerName,
      authorRole: params.reviewerRole,
      comment: `[Changes Requested] ${params.feedback}`,
    });

    await schoolAuditService.logEvent({
      schoolId: params.schoolId,
      actorId: params.reviewerId,
      actorName: params.reviewerName,
      actorRole: params.reviewerRole,
      action: 'CHANGES_REQUESTED',
      targetType: 'paper',
      targetId: paper.id,
      targetTitle: paper.title,
      reason: params.feedback,
    });

    return updatedPaper;
  },

  /**
   * Locks an approved paper
   */
  async lockPaper(params: {
    paperId: string;
    schoolId: string;
    userId: string;
    userName: string;
    userRole: string;
  }): Promise<ExamPaper> {
    const paper = await paperStudioService.getPaperById(params.paperId);
    if (!paper) throw new Error('Paper not found');

    const updatedPaper: ExamPaper = {
      ...paper,
      workflowStatus: 'LOCKED',
      lockedAt: new Date().toISOString(),
      lockedBy: params.userId,
      updatedAt: new Date().toISOString(),
    };

    await paperStudioService.savePaper(updatedPaper);
    await schoolAuditService.logEvent({
      schoolId: params.schoolId,
      actorId: params.userId,
      actorName: params.userName,
      actorRole: params.userRole,
      action: 'PAPER_LOCKED',
      targetType: 'paper',
      targetId: paper.id,
      targetTitle: paper.title,
    });

    return updatedPaper;
  },

  /**
   * Unlocks a locked paper with mandatory reason and audit log
   */
  async unlockPaper(params: {
    paperId: string;
    schoolId: string;
    userId: string;
    userName: string;
    userRole: string;
    reason: string;
  }): Promise<ExamPaper> {
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error('A detailed reason is required to unlock an examination paper.');
    }

    const paper = await paperStudioService.getPaperById(params.paperId);
    if (!paper) throw new Error('Paper not found');

    const updatedPaper: ExamPaper = {
      ...paper,
      status: 'DRAFT',
      workflowStatus: 'IN_PROGRESS',
      lockedAt: undefined,
      lockedBy: undefined,
      updatedAt: new Date().toISOString(),
    };

    await paperStudioService.savePaper(updatedPaper);
    await schoolAuditService.logEvent({
      schoolId: params.schoolId,
      actorId: params.userId,
      actorName: params.userName,
      actorRole: params.userRole,
      action: 'PAPER_UNLOCKED',
      targetType: 'paper',
      targetId: paper.id,
      targetTitle: paper.title,
      reason: params.reason,
    });

    return updatedPaper;
  },

  /**
   * Review Comments CRUD
   */
  async getComments(paperId: string): Promise<ReviewComment[]> {
    try {
      const { data, error } = await supabase
        .from('review_comments')
        .select('*')
        .eq('paper_id', paperId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          schoolId: d.school_id,
          paperId: d.paper_id,
          questionId: d.question_id,
          sectionId: d.section_id,
          authorId: d.author_id,
          authorName: d.author_name,
          authorRole: d.author_role,
          comment: d.comment,
          status: d.status,
          resolvedBy: d.resolved_by,
          resolvedByName: d.resolved_by_name,
          resolvedAt: d.resolved_at,
          parentId: d.parent_id,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (_) {}

    try {
      const raw = localStorage.getItem(REVIEW_COMMENTS_STORAGE_KEY);
      if (raw) {
        const parsed: ReviewComment[] = JSON.parse(raw);
        return parsed.filter((c) => c.paperId === paperId);
      }
    } catch (_) {}

    return [];
  },

  async addComment(params: {
    schoolId: string;
    paperId: string;
    questionId?: string;
    sectionId?: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    comment: string;
    parentId?: string;
  }): Promise<ReviewComment> {
    const newComment: ReviewComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      schoolId: params.schoolId,
      paperId: params.paperId,
      questionId: params.questionId,
      sectionId: params.sectionId,
      authorId: params.authorId,
      authorName: params.authorName,
      authorRole: params.authorRole,
      comment: params.comment,
      status: 'open',
      parentId: params.parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(REVIEW_COMMENTS_STORAGE_KEY);
      const existing: ReviewComment[] = raw ? JSON.parse(raw) : [];
      existing.push(newComment);
      localStorage.setItem(REVIEW_COMMENTS_STORAGE_KEY, JSON.stringify(existing));
    } catch (_) {}

    try {
      void supabase.from('review_comments').insert({
        id: newComment.id,
        school_id: newComment.schoolId,
        paper_id: newComment.paperId,
        question_id: newComment.questionId,
        section_id: newComment.sectionId,
        author_id: newComment.authorId,
        author_name: newComment.authorName,
        author_role: newComment.authorRole,
        comment: newComment.comment,
        status: newComment.status,
        parent_id: newComment.parentId,
        created_at: newComment.createdAt,
      });
    } catch (_) {}

    return newComment;
  },

  async resolveComment(commentId: string, resolvedById: string, resolvedByName: string): Promise<boolean> {
    try {
      const raw = localStorage.getItem(REVIEW_COMMENTS_STORAGE_KEY);
      if (raw) {
        const comments: ReviewComment[] = JSON.parse(raw);
        const item = comments.find((c) => c.id === commentId);
        if (item) {
          item.status = 'resolved';
          item.resolvedBy = resolvedById;
          item.resolvedByName = resolvedByName;
          item.resolvedAt = new Date().toISOString();
          localStorage.setItem(REVIEW_COMMENTS_STORAGE_KEY, JSON.stringify(comments));
        }
      }
    } catch (_) {}
    return true;
  },

  /**
   * Version Control Snapshots
   */
  async createVersionSnapshot(
    paper: ExamPaper,
    editorId: string,
    editorName: string,
    changeSummary: string
  ): Promise<PaperVersion> {
    const existingVersions = await this.getPaperVersions(paper.id);
    const nextVersion = existingVersions.length + 1;

    const versionRecord: PaperVersion = {
      id: `ver_${paper.id}_v${nextVersion}`,
      schoolId: paper.schoolId || 'default_school',
      paperId: paper.id,
      versionNumber: nextVersion,
      editorId,
      editorName,
      timestamp: new Date().toISOString(),
      changeSummary,
      previousStatus: (paper.workflowStatus || 'DRAFT') as PaperWorkflowStatus,
      newStatus: (paper.workflowStatus || 'DRAFT') as PaperWorkflowStatus,
      questionsCount: paper.sections.reduce((sum, s) => sum + s.questions.length, 0),
      totalMarks: paper.totalMarks,
      snapshot: JSON.parse(JSON.stringify(paper)),
    };

    try {
      const raw = localStorage.getItem(PAPER_VERSIONS_STORAGE_KEY);
      const list: PaperVersion[] = raw ? JSON.parse(raw) : [];
      list.unshift(versionRecord);
      localStorage.setItem(PAPER_VERSIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}

    return versionRecord;
  },

  async getPaperVersions(paperId: string): Promise<PaperVersion[]> {
    try {
      const raw = localStorage.getItem(PAPER_VERSIONS_STORAGE_KEY);
      if (raw) {
        const parsed: PaperVersion[] = JSON.parse(raw);
        return parsed.filter((v) => v.paperId === paperId);
      }
    } catch (_) {}
    return [];
  },
};
