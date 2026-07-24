import { PaperVisibility } from './paperStudio';
export type { PaperVisibility };

export type SchoolRole =
  | 'OWNER'
  | 'ADMIN'
  | 'EXAM_COORDINATOR'
  | 'HOD'
  | 'TEACHER'
  | 'REVIEWER'
  | 'VIEWER';

export type PaperWorkflowStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'LOCKED'
  | 'PRINTED'
  | 'ARCHIVED'
  | 'REJECTED';

export type QuestionVisibility = 'private' | 'department' | 'school' | 'soma' | 'marketplace';

export type QuestionReviewStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'VERIFIED';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export type SchoolMembershipStatus = 'invited' | 'active' | 'suspended' | 'removed';

export interface SchoolPermissionOverrides {
  canApprovePapers?: boolean;
  canManageTemplates?: boolean;
  canExportDrafts?: boolean;
  canAllocateCredits?: boolean;
  canManageDepartments?: boolean;
  canInviteTeachers?: boolean;
}

export interface SchoolMembership {
  id: string;
  schoolId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  roles: SchoolRole[];
  departmentIds: string[];
  subjectIds?: string[];
  gradeIds?: string[];
  status: SchoolMembershipStatus;
  invitedBy: string;
  invitedAt: string;
  joinedAt?: string;
  permissions?: SchoolPermissionOverrides;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolInvitation {
  id: string;
  schoolId: string;
  schoolName: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone?: string;
  roles: SchoolRole[];
  departmentIds: string[];
  subjectIds?: string[];
  token: string;
  status: InvitationStatus;
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface SchoolDepartment {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  subjectIds: string[];
  gradeIds?: string[];
  headUserIds: string[];
  memberUserIds: string[];
  approvalWorkflowId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewComment {
  id: string;
  schoolId: string;
  paperId: string;
  questionId?: string;
  sectionId?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  comment: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaperVersion {
  id: string;
  schoolId: string;
  paperId: string;
  versionNumber: number;
  editorId: string;
  editorName: string;
  timestamp: string;
  changeSummary: string;
  previousStatus: PaperWorkflowStatus;
  newStatus: PaperWorkflowStatus;
  questionsCount: number;
  totalMarks: number;
  snapshot: any; // Complete ExamPaper snapshot
}

export interface SchoolTemplate {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  departmentId?: string;
  grade?: string;
  subject?: string;
  examType?: string;
  headerConfiguration: {
    schoolName: string;
    logoUrl?: string;
    showMotto?: boolean;
    mottoText?: string;
    addressText?: string;
    phoneText?: string;
    emailText?: string;
  };
  candidateFields: {
    studentName: boolean;
    admissionNo: boolean;
    streamClass: boolean;
    date: boolean;
    signature: boolean;
  };
  instructions: string[];
  sectionLayouts: Array<{
    id: string;
    title: string;
    defaultInstructions?: string;
    questionType?: string;
    suggestedCount?: number;
    suggestedMarks?: number;
  }>;
  footerText?: string;
  pageNumberStyle?: 'PAGE_X_OF_Y' | 'SIMPLE' | 'NONE';
  workingSpaceStyle?: 'COMPACT' | 'STANDARD' | 'GENEROUS';
  markingSchemeStyle?: 'INLINE' | 'SEPARATE' | 'END_OF_PAPER';
  defaultDurationMinutes: number;
  defaultTotalMarks: number;
  isDefault: boolean;
  isDepartmentDefault?: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDeadline {
  id: string;
  schoolId: string;
  title: string;
  term: string;
  academicYear: string | number;
  grade: string;
  subject: string;
  departmentId: string;
  paperOwnerId?: string;
  paperOwnerName?: string;
  paperId?: string;
  draftDueDate: string;
  reviewDueDate: string;
  approvalDueDate: string;
  printingDate: string;
  examDate: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
}

export interface SchoolCreditAllocation {
  id: string;
  schoolId: string;
  totalAllocatedCredits: number;
  usedCredits: number;
  remainingCredits: number;
  term: string;
  userLimits: Record<string, number>; // userId -> max credits
  departmentLimits: Record<string, number>; // deptId -> max credits
  suspendedUserIds: string[];
  updatedAt: string;
}

export type AuditActionType =
  | 'TEACHER_INVITED'
  | 'TEACHER_JOINED'
  | 'ROLE_CHANGED'
  | 'DEPARTMENT_ASSIGNED'
  | 'PAPER_CREATED'
  | 'PAPER_EDITED'
  | 'PAPER_SUBMITTED'
  | 'REVIEWER_ASSIGNED'
  | 'CHANGES_REQUESTED'
  | 'PAPER_APPROVED'
  | 'PAPER_REJECTED'
  | 'PAPER_LOCKED'
  | 'PAPER_UNLOCKED'
  | 'PAPER_EXPORTED'
  | 'QUESTION_ADDED_BANK'
  | 'QUESTION_APPROVED'
  | 'CREDITS_ALLOCATED'
  | 'CREDITS_USED'
  | 'TEMPLATE_CHANGED'
  | 'USER_SUSPENDED'
  | 'SUBSCRIPTION_PAYMENT_INITIATED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SETTINGS_UPDATED';


export interface SchoolActivityLog {
  id: string;
  schoolId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditActionType;
  targetType: 'paper' | 'question' | 'teacher' | 'department' | 'template' | 'credits' | 'settings' | 'subscription';

  targetId: string;
  targetTitle?: string;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SchoolNotification {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: 'INVITATION' | 'PAPER_ASSIGNED' | 'REVIEW_REQUESTED' | 'COMMENT_ADDED' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'DEADLINE' | 'CREDITS';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SchoolSettings {
  schoolId: string;
  schoolName: string;
  defaultCurriculum: string;
  currentTerm: string;
  currentAcademicYear: string | number;
  gradingSystem: string;
  requiredApprovalStages: ('HOD' | 'EXAM_COORDINATOR' | 'ADMIN')[];
  requireIndependentReviewer: boolean;
  allowTeacherPersonalCredits: boolean;
  defaultPaperVisibility: PaperVisibility;
  defaultTemplateId?: string;
  defaultReviewDeadlineDays: number;
  allowDepartmentLevelApproval: boolean;
  allowTeachersToExportDrafts: boolean;
  allowReviewersToEditQuestions: boolean;
  lowCreditThreshold: number;
  defaultWatermarkText?: string;
  updatedAt: string;
}

export interface SchoolSubscription {
  schoolId: string;
  planId: 'SCHOOL_BASIC' | 'SCHOOL_PRO' | 'SCHOOL_ENTERPRISE';
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  billingCycle: 'monthly' | 'termly' | 'annual';
  teacherLimit: number;
  aiCreditLimit: number;
  storageLimitMb?: number;
  startedAt: string;
  renewsAt?: string;
  expiresAt?: string;
}
