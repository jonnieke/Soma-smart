import {
  District,
  DistrictSchoolSnapshot,
  DistrictAnalyticsSummary,
  DistrictComplianceRecord,
  DistrictAuditEvent,
  DistrictReportOptions,
  ComplianceStatus,
  TermlyDataPoint,
} from '../types/district';
import { supabase } from '../lib/supabase';

// ────────────────────────────────────────────────
// Seed data for demonstration
// ────────────────────────────────────────────────
const SEED_DISTRICTS: District[] = [
  {
    id: 'district_nairobi_central',
    name: 'Nairobi Central District',
    region: 'Nairobi Metropolitan',
    county: 'Nairobi',
    country: 'Kenya',
    schoolIds: ['school_001', 'school_002', 'school_003', 'school_004', 'school_005'],
    adminUserId: 'district_admin_001',
    adminName: 'Dr. Kiprotich Mutai',
    adminRole: 'DISTRICT_ADMIN',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-07-23T00:00:00Z',
  },
];

const SEED_SCHOOL_SNAPSHOTS: DistrictSchoolSnapshot[] = [
  { schoolId: 'school_001', schoolName: 'Nairobi Academy', subscriptionTier: 'SCHOOL_PRO', totalTeachers: 14, totalDepartments: 6, totalPapers: 28, draftPapers: 3, pendingReviewPapers: 4, approvedPapers: 18, lockedPapers: 15, aiCreditsUsed: 820, aiCreditsTotal: 2000, complianceStatus: 'GREEN', complianceScore: 92, lastActiveAt: '2026-07-23T08:00:00Z', subscriptionExpiresAt: '2026-10-01T00:00:00Z' },
  { schoolId: 'school_002', schoolName: 'Westlands High School', subscriptionTier: 'SCHOOL_BASIC', totalTeachers: 5, totalDepartments: 3, totalPapers: 12, draftPapers: 5, pendingReviewPapers: 6, approvedPapers: 1, lockedPapers: 1, aiCreditsUsed: 410, aiCreditsTotal: 500, complianceStatus: 'AMBER', complianceScore: 55, lastActiveAt: '2026-07-20T14:00:00Z', subscriptionExpiresAt: '2026-10-01T00:00:00Z' },
  { schoolId: 'school_003', schoolName: 'Eastlands Community School', subscriptionTier: 'NONE', totalTeachers: 3, totalDepartments: 2, totalPapers: 4, draftPapers: 4, pendingReviewPapers: 0, approvedPapers: 0, lockedPapers: 0, aiCreditsUsed: 0, aiCreditsTotal: 0, complianceStatus: 'RED', complianceScore: 15, lastActiveAt: '2026-07-10T09:00:00Z', subscriptionExpiresAt: null },
  { schoolId: 'school_004', schoolName: 'Karen International School', subscriptionTier: 'SCHOOL_ENTERPRISE', totalTeachers: 42, totalDepartments: 10, totalPapers: 78, draftPapers: 2, pendingReviewPapers: 1, approvedPapers: 62, lockedPapers: 58, aiCreditsUsed: 5200, aiCreditsTotal: 10000, complianceStatus: 'GREEN', complianceScore: 98, lastActiveAt: '2026-07-23T09:30:00Z', subscriptionExpiresAt: '2026-11-01T00:00:00Z' },
  { schoolId: 'school_005', schoolName: 'Umoja Primary School', subscriptionTier: 'SCHOOL_BASIC', totalTeachers: 4, totalDepartments: 2, totalPapers: 8, draftPapers: 3, pendingReviewPapers: 3, approvedPapers: 2, lockedPapers: 2, aiCreditsUsed: 198, aiCreditsTotal: 500, complianceStatus: 'AMBER', complianceScore: 62, lastActiveAt: '2026-07-22T16:00:00Z', subscriptionExpiresAt: '2026-10-01T00:00:00Z' },
];

const generateTermlyTrend = (): TermlyDataPoint[] => {
  return Array.from({ length: 10 }, (_, i) => ({
    week: `Week ${i + 1}`,
    papersSubmitted: Math.floor(Math.random() * 12) + 2,
    papersApproved: Math.floor(Math.random() * 10) + 1,
  }));
};

const computeComplianceFromSnapshots = (snapshots: DistrictSchoolSnapshot[]): DistrictComplianceRecord[] => {
  return snapshots.map((s) => {
    const required = s.totalDepartments * 2; // 2 papers per dept expected per term
    const submitted = s.approvedPapers + s.pendingReviewPapers;
    const compliancePercent = required > 0 ? Math.min(100, Math.round((submitted / required) * 100)) : 0;
    let complianceStatus: ComplianceStatus = 'UNKNOWN';
    if (compliancePercent >= 80) complianceStatus = 'GREEN';
    else if (compliancePercent >= 50) complianceStatus = 'AMBER';
    else complianceStatus = 'RED';
    return {
      schoolId: s.schoolId,
      schoolName: s.schoolName,
      requiredPapers: required,
      submittedPapers: submitted,
      approvedPapers: s.approvedPapers,
      compliancePercent,
      complianceStatus,
      overdueDeadlines: s.pendingReviewPapers > 0 ? Math.floor(s.pendingReviewPapers / 2) : 0,
      lastSubmissionAt: s.lastActiveAt,
    };
  });
};

// ────────────────────────────────────────────────
// District Service
// ────────────────────────────────────────────────
export const districtService = {
  /** Returns all districts (or filtered by admin) */
  async getDistricts(): Promise<District[]> {
    try {
      const { data } = await supabase.from('districts').select('*').limit(50);
      if (data && data.length > 0) return data as District[];
    } catch { /* fallback */ }
    return SEED_DISTRICTS;
  },

  /** Returns a single district by ID */
  async getDistrict(districtId: string): Promise<District | null> {
    try {
      const { data } = await supabase.from('districts').select('*').eq('id', districtId).maybeSingle();
      if (data) return data as District;
    } catch { /* fallback */ }
    return SEED_DISTRICTS.find((d) => d.id === districtId) ?? null;
  },

  /** Returns summarized school snapshots for a district */
  async getDistrictSchools(districtId: string): Promise<DistrictSchoolSnapshot[]> {
    const district = await this.getDistrict(districtId);
    if (!district) return [];

    try {
      const { data } = await supabase
        .from('school_district_snapshots')
        .select('*')
        .eq('district_id', districtId);
      if (data && data.length > 0) return data as DistrictSchoolSnapshot[];
    } catch { /* fallback */ }

    // Return seed data filtered to district schools
    return SEED_SCHOOL_SNAPSHOTS.filter((s) => district.schoolIds.includes(s.schoolId));
  },

  /** Aggregates cross-school analytics for a district */
  async getDistrictAnalyticsSummary(districtId: string): Promise<DistrictAnalyticsSummary> {
    const snapshots = await this.getDistrictSchools(districtId);

    const totalSchools = snapshots.length;
    const activeSchools = snapshots.filter((s) => s.subscriptionTier !== 'NONE').length;
    const totalTeachers = snapshots.reduce((s, x) => s + x.totalTeachers, 0);
    const totalDepartments = snapshots.reduce((s, x) => s + x.totalDepartments, 0);
    const totalPapers = snapshots.reduce((s, x) => s + x.totalPapers, 0);
    const approvedPapers = snapshots.reduce((s, x) => s + x.approvedPapers, 0);
    const pendingReviewPapers = snapshots.reduce((s, x) => s + x.pendingReviewPapers, 0);
    const avgComplianceScore = totalSchools > 0 ? Math.round(snapshots.reduce((s, x) => s + x.complianceScore, 0) / totalSchools) : 0;
    const avgApprovalRate = totalPapers > 0 ? Math.round((approvedPapers / totalPapers) * 100) : 0;
    const totalAiCreditsUsed = snapshots.reduce((s, x) => s + x.aiCreditsUsed, 0);
    const totalAiCreditsAllocated = snapshots.reduce((s, x) => s + x.aiCreditsTotal, 0);

    const complianceBreakdown = (['GREEN', 'AMBER', 'RED', 'UNKNOWN'] as ComplianceStatus[]).map((status) => ({
      status,
      count: snapshots.filter((s) => s.complianceStatus === status).length,
    }));

    return {
      districtId,
      totalSchools,
      activeSchools,
      totalTeachers,
      totalDepartments,
      totalPapers,
      approvedPapers,
      pendingReviewPapers,
      avgComplianceScore,
      avgApprovalRate,
      totalAiCreditsUsed,
      totalAiCreditsAllocated,
      termlyPaperTrend: generateTermlyTrend(),
      complianceBreakdown,
      generatedAt: new Date().toISOString(),
    };
  },

  /** Returns term compliance records for all schools in a district */
  async getDistrictComplianceReport(districtId: string, _term?: string, _year?: number): Promise<DistrictComplianceRecord[]> {
    const snapshots = await this.getDistrictSchools(districtId);
    return computeComplianceFromSnapshots(snapshots);
  },

  /** Flags a school for inspection (creates a district audit event) */
  async flagSchoolForInspection(districtId: string, schoolId: string, inspectorId: string, inspectorName: string, reason: string): Promise<DistrictAuditEvent> {
    const event: DistrictAuditEvent = {
      id: `dae_${Date.now()}`,
      districtId,
      actorId: inspectorId,
      actorName: inspectorName,
      actorRole: 'DISTRICT_ADMIN',
      action: 'SCHOOL_FLAGGED',
      targetSchoolId: schoolId,
      targetSchoolName: SEED_SCHOOL_SNAPSHOTS.find((s) => s.schoolId === schoolId)?.schoolName,
      reason,
      timestamp: new Date().toISOString(),
    };

    try {
      await supabase.from('district_audit_events').insert({ ...event, district_id: districtId });
    } catch { /* ignore */ }

    return event;
  },

  /** Generates a CSV export of the district report */
  exportDistrictReportCsv(snapshots: DistrictSchoolSnapshot[], compliance: DistrictComplianceRecord[]): string {
    const header = 'School,Subscription,Teachers,Departments,Total Papers,Approved,Pending Review,Compliance %,Status,AI Credits Used,AI Credits Total';
    const rows = snapshots.map((s) => {
      const comp = compliance.find((c) => c.schoolId === s.schoolId);
      return [
        `"${s.schoolName}"`,
        s.subscriptionTier,
        s.totalTeachers,
        s.totalDepartments,
        s.totalPapers,
        s.approvedPapers,
        s.pendingReviewPapers,
        comp?.compliancePercent ?? 0,
        comp?.complianceStatus ?? 'UNKNOWN',
        s.aiCreditsUsed,
        s.aiCreditsTotal,
      ].join(',');
    });
    return [header, ...rows].join('\n');
  },

  /** Returns a human-readable compliance badge color */
  getComplianceColor(status: ComplianceStatus): string {
    switch (status) {
      case 'GREEN': return 'text-emerald-600 bg-emerald-50';
      case 'AMBER': return 'text-amber-600 bg-amber-50';
      case 'RED': return 'text-red-600 bg-red-50';
      default: return 'text-slate-500 bg-slate-100';
    }
  },
};
