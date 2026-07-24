import { SchoolBenchmarkSnapshot, EvidenceConfidence } from '../types/educationIntelligence';

export const benchmarkingService = {
  /**
   * Generates or retrieves school benchmark snapshot with small-cohort suppression logic.
   * Cohort rule: Minimum 10 learners and 5 schools required for anonymous peer comparison.
   */
  getSchoolBenchmark(
    schoolId: string,
    grade = 'Form 4',
    subject = 'Mathematics',
    cohortLearnerCount = 45,
    peerSchoolCount = 14,
  ): SchoolBenchmarkSnapshot {
    const isSuppressed = cohortLearnerCount < 10 || peerSchoolCount < 5;

    return {
      id: `bench_${schoolId}_${grade}_${subject}`,
      schoolId,
      grade,
      subject,
      term: 'Term 1',
      schoolMean: 68.4,
      peerMedian: 64.2,
      peerRangeMin: 48.0,
      peerRangeMax: 82.5,
      peerSchoolCount: isSuppressed ? 0 : peerSchoolCount,
      cohortLearnerCount,
      evidenceConfidence: isSuppressed ? 'insufficient' : 'moderate',
      isSuppressedDueToSmallCohort: isSuppressed,
      calculatedAt: new Date().toISOString(),
    };
  },

  /** Get internal historical term-on-term comparison data for a school */
  getHistoricalComparison(schoolId: string, subject = 'Mathematics') {
    return [
      { term: '2025 Term 1', schoolMean: 61.2, passRate: 74 },
      { term: '2025 Term 2', schoolMean: 63.8, passRate: 78 },
      { term: '2025 Term 3', schoolMean: 66.0, passRate: 81 },
      { term: '2026 Term 1', schoolMean: 68.4, passRate: 84 },
    ];
  },
};
