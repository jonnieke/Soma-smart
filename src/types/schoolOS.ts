// ============================================================
// Phase 8 — Soma School Operating System Data Models
// ============================================================

export type TenantType = 'individual' | 'school' | 'institution' | 'school_network' | 'education_partner' | 'publisher';
export type TenantStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'archived';

export interface Tenant {
  id: string;
  type: TenantType;
  name: string;
  code: string;
  status: TenantStatus;
  primarySchoolId?: string;
  parentTenantId?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SchoolOnboardingStatus = 'not_started' | 'in_progress' | 'review_required' | 'ready' | 'active' | 'blocked';

export interface SchoolOnboardingChecklist {
  schoolDetailsCompleted: boolean;
  academicYearConfigured: boolean;
  classesCreated: boolean;
  teachersImported: boolean;
  learnersImported: boolean;
  subjectAllocationsCompleted: boolean;
  parentsLinked: boolean;
  curriculumSelected: boolean;
  subscriptionActive: boolean;
  status: SchoolOnboardingStatus;
}

export type AcademicYearStatus = 'planned' | 'active' | 'closing' | 'completed' | 'archived';

export interface AcademicTerm {
  id: string;
  name: string; // e.g. 'Term 1'
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface AcademicYear {
  id: string;
  tenantId: string;
  name: string; // e.g. '2026 Academic Year'
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  terms: AcademicTerm[];
  createdAt: string;
}

export interface AcademicCalendarEvent {
  id: string;
  tenantId: string;
  title: string;
  eventType: 'TERM_OPENING' | 'TERM_CLOSING' | 'EXAM_PERIOD' | 'CAT' | 'MOCK_EXAM' | 'REVISION_PROGRAMME' | 'HOLIDAY' | 'PARENT_MEETING';
  startDate: string;
  endDate: string;
  description?: string;
}

export interface AcademicClass {
  id: string;
  tenantId: string;
  campusId?: string;
  academicYearId: string;
  grade: string;
  name: string; // e.g. 'Form 4 East'
  stream?: string;
  classTeacherId?: string;
  learnerCount: number;
  createdAt: string;
}

export interface SubjectEnrollment {
  id: string;
  tenantId: string;
  learnerId: string;
  learnerName: string;
  subject: string;
  grade: string;
  classId: string;
  academicYearId: string;
  status: 'active' | 'dropped';
}

export interface TeacherAllocation {
  id: string;
  tenantId: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  grade: string;
  classId: string;
  className: string;
  role: 'SUBJECT_TEACHER' | 'CLASS_TEACHER' | 'HOD' | 'EXAM_COORDINATOR';
  status: 'active' | 'completed';
}

export interface LearnerGuardianLink {
  id: string;
  tenantId: string;
  learnerId: string;
  learnerName: string;
  guardianUserId: string;
  guardianName: string;
  guardianEmail: string;
  relationship: 'parent' | 'guardian' | 'sponsor';
  permissions: {
    viewResults: boolean;
    receiveReports: boolean;
    receiveAnnouncements: boolean;
  };
  isPrimary: boolean;
  status: 'invited' | 'active' | 'revoked';
}

export interface SchoolRevisionProgramme {
  id: string;
  tenantId: string;
  title: string;
  grade: string;
  subject: string;
  targetLearnerCount: number;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
}

export interface PlanEntitlement {
  key: string;
  type: 'boolean' | 'limit' | 'metered';
  value: boolean | number;
}

export interface SchoolInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amountKes: number;
  billingPeriod: string;
  status: 'DRAFT' | 'UNPAID' | 'PAID' | 'OVERDUE';
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
}

export interface SchoolSupportRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  requesterName: string;
  category: 'IMPORT' | 'BILLING' | 'ASSESSMENT' | 'CREDITS' | 'TECHNICAL';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}
