// ============================================================
// Phase 4C — District / Ministry Oversight Types
// ============================================================

export type DistrictAdminRole =
  | 'DISTRICT_ADMIN'
  | 'COUNTY_DIRECTOR'
  | 'MINISTRY_INSPECTOR';

export type ComplianceStatus = 'GREEN' | 'AMBER' | 'RED' | 'UNKNOWN';

export interface District {
  id: string;
  name: string;
  region: string;
  county: string;
  country: string;
  schoolIds: string[];
  adminUserId: string;
  adminName: string;
  adminRole: DistrictAdminRole;
  createdAt: string;
  updatedAt: string;
}

/** A summarized snapshot of a single school's workspace activity */
export interface DistrictSchoolSnapshot {
  schoolId: string;
  schoolName: string;
  subscriptionTier: 'SCHOOL_BASIC' | 'SCHOOL_PRO' | 'SCHOOL_ENTERPRISE' | 'NONE';
  totalTeachers: number;
  totalDepartments: number;
  totalPapers: number;
  draftPapers: number;
  pendingReviewPapers: number;
  approvedPapers: number;
  lockedPapers: number;
  aiCreditsUsed: number;
  aiCreditsTotal: number;
  complianceStatus: ComplianceStatus;
  complianceScore: number; // 0–100
  lastActiveAt: string | null;
  subscriptionExpiresAt: string | null;
}

/** Aggregate analytics across all schools in a district */
export interface DistrictAnalyticsSummary {
  districtId: string;
  totalSchools: number;
  activeSchools: number;
  totalTeachers: number;
  totalDepartments: number;
  totalPapers: number;
  approvedPapers: number;
  pendingReviewPapers: number;
  avgComplianceScore: number; // 0–100
  avgApprovalRate: number; // 0–100 %
  totalAiCreditsUsed: number;
  totalAiCreditsAllocated: number;
  termlyPaperTrend: TermlyDataPoint[];
  complianceBreakdown: { status: ComplianceStatus; count: number }[];
  generatedAt: string;
}

export interface TermlyDataPoint {
  week: string; // ISO week label e.g. "Week 1", "Week 2"
  papersSubmitted: number;
  papersApproved: number;
}

export interface DistrictComplianceRecord {
  schoolId: string;
  schoolName: string;
  requiredPapers: number;
  submittedPapers: number;
  approvedPapers: number;
  compliancePercent: number;
  complianceStatus: ComplianceStatus;
  overdueDeadlines: number;
  lastSubmissionAt: string | null;
}

export interface DistrictAuditEvent {
  id: string;
  districtId: string;
  actorId: string;
  actorName: string;
  actorRole: DistrictAdminRole;
  action:
    | 'SCHOOL_FLAGGED'
    | 'SCHOOL_UNFLAGGED'
    | 'REPORT_EXPORTED'
    | 'DISTRICT_SETTINGS_UPDATED'
    | 'COMPLIANCE_REVIEWED';
  targetSchoolId?: string;
  targetSchoolName?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface DistrictReportOptions {
  format: 'csv' | 'pdf';
  term: string;
  year: number;
  includeSchools: string[]; // empty = all
}
