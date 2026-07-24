import { CustomerHealthScore } from '../types/growthOS';

const HEALTH_SCORES_KEY = 'soma_customer_health_scores';

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

export const customerSuccessService = {
  /** Get customer health scores */
  getHealthScores(tenantId = 'tenant_school_001'): CustomerHealthScore[] {
    const list = readLocal<CustomerHealthScore[]>(HEALTH_SCORES_KEY, []);
    if (list.length > 0) return list;

    const seed: CustomerHealthScore[] = [
      {
        id: 'chs_001',
        tenantId,
        schoolName: 'Alliance High School Workspace',
        score: 92,
        healthBand: 'healthy',
        factors: ['100% teacher activation', '85% active learner participation', 'Regular termly assessments assigned'],
        renewalDate: '2026-11-30',
        calculatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(HEALTH_SCORES_KEY, seed);
    return seed;
  },

  /** Evaluate school health score based on operational signals */
  calculateHealthScore(teacherActivationPct: number, learnerActivityPct: number, daysToRenewal: number): CustomerHealthScore {
    let score = Math.round(teacherActivationPct * 0.5 + learnerActivityPct * 0.5);
    if (daysToRenewal < 30) score -= 10;

    let healthBand: CustomerHealthScore['healthBand'] = 'healthy';
    if (score < 50) healthBand = 'critical';
    else if (score < 70) healthBand = 'at_risk';
    else if (score < 85) healthBand = 'monitor';

    return {
      id: `chs_${Date.now()}`,
      tenantId: 'tenant_school_001',
      schoolName: 'Alliance High School Workspace',
      score,
      healthBand,
      factors: [
        `Teacher activation: ${teacherActivationPct}%`,
        `Learner activity: ${learnerActivityPct}%`,
        `Days to renewal: ${daysToRenewal}`,
      ],
      renewalDate: '2026-11-30',
      calculatedAt: new Date().toISOString(),
    };
  },
};
