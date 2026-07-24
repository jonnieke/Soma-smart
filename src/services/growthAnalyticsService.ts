import { UnitEconomicsSnapshot } from '../types/growthOS';

export const growthAnalyticsService = {
  /** Get North-Star Metric: Weekly Successful Learning Cycles */
  getNorthStarMetric() {
    return {
      metricName: 'Weekly Successful Learning Cycles',
      currentValue: 14850,
      weeklyGrowthPct: 12.4,
      targetValue: 20000,
    };
  },

  /** Get Unit Economics snapshot */
  getUnitEconomicsSnapshot(): UnitEconomicsSnapshot {
    return {
      period: '2026 Q3',
      totalRevenueKes: 4850000,
      totalAiCostKes: 870000,
      grossMarginPercentage: 82.1,
      cacTeacherKes: 450,
      cacSchoolKes: 12500,
      arpuTeacherKes: 1200,
      arpuSchoolKes: 45000,
    };
  },
};
