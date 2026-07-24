import {
  PlatformCostEvent,
  GrossMarginSnapshot,
  PaperEconomicsProfile,
  StrategicAsset,
  SchoolValueReport,
  TeacherValueReport,
} from '../types/strategicIntelligence';

const COST_EVENTS_KEY = 'soma_platform_cost_events';

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const platformEconomicsService = {
  /** Log normalized platform cost event */
  logCostEvent(event: Omit<PlatformCostEvent, 'id' | 'incurredAt'>): PlatformCostEvent {
    const events = readLocal<PlatformCostEvent[]>(COST_EVENTS_KEY, []);
    const newEvent: PlatformCostEvent = {
      ...event,
      id: `cost_${Date.now()}`,
      incurredAt: new Date().toISOString(),
    };
    events.unshift(newEvent);
    writeLocal(COST_EVENTS_KEY, events);
    return newEvent;
  },

  /** Get Gross Margin snapshot */
  getGrossMarginSnapshot(): GrossMarginSnapshot {
    return {
      period: '2026 Q3',
      totalRevenueKes: 4850000,
      totalAiCostKes: 420000,
      totalCloudInfraCostKes: 180000,
      totalPaymentFeesKes: 95000,
      totalSellerPayoutsKes: 350000,
      grossMarginKes: 3805000,
      grossMarginPercentage: 78.45,
      calculatedAt: new Date().toISOString(),
    };
  },

  /** Get Paper Economics Profile */
  getPaperEconomics(): PaperEconomicsProfile[] {
    return [
      {
        paperId: 'paper_kcse_math_001',
        title: 'Form 4 Mathematics Mock Paper 1',
        aiGenerationCostKes: 45,
        ocrCostKes: 12,
        exportCostKes: 5,
        storageCostKes: 2,
        questionReuseRatePct: 85,
        totalDirectCostKes: 64,
        allocatedRevenueKes: 500,
        grossMarginPercentage: 87.2,
      },
    ];
  },

  /** Get Strategic Assets Registry */
  getStrategicAssets(): StrategicAsset[] {
    return [
      {
        id: 'ast_001',
        name: 'Structured CBC & KCSE Curriculum Knowledge Graph',
        category: 'curriculum_graph',
        description: '14,200 connected learning outcomes, prerequisites, and misconceptions.',
        ownerTeam: 'Curriculum & AI Engineering',
        assetHealth: 'strong',
        sizeMetric: 14200,
        qualityMetric: 98.4,
        uniquenessMetric: 99.0,
        reuseMetric: 82.5,
        revenueContribution: 1850000,
        risks: ['Curriculum revision updates require continuous review'],
        nextActions: ['Expand Grade 9 JSS sub-strand mappings'],
        calculatedAt: new Date().toISOString(),
      },
    ];
  },

  /** Get School Value Report */
  getSchoolValueReport(tenantId = 'tenant_school_001'): SchoolValueReport {
    return {
      tenantId,
      schoolName: 'Alliance High School Workspace',
      period: 'Term 2 2026',
      teacherHoursSavedEstimate: 340,
      papersCreatedCount: 42,
      assessmentsDeliveredCount: 128,
      markingAutomatedCount: 3850,
      curriculumCoveragePct: 94.2,
      parentReportsGenerated: 1250,
      generatedAt: new Date().toISOString(),
    };
  },

  /** Get Teacher Value Report */
  getTeacherValueReport(userId = 'usr_teacher_001'): TeacherValueReport {
    return {
      userId,
      period: 'Term 2 2026',
      papersCreated: 14,
      questionsReused: 85,
      timeSavingHoursEstimate: 48,
      learnersSupported: 180,
      marketplaceEarningsKes: 12500,
      generatedAt: new Date().toISOString(),
    };
  },
};
