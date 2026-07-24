import { AssessmentAttempt, ItemAnalysis, GradingScale } from '../types/assessmentDelivery';
import { assessmentAttemptService } from './assessmentAttemptService';
import { paperStudioService } from './paperStudioService';

export interface ClassAnalyticsSummary {
  assignmentId: string;
  assessmentTitle: string;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number; // %
  meanScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  standardDeviation: number;
  passRatePercentage: number;
  gradeDistribution: Record<string, number>;
  itemAnalyses: ItemAnalysis[];
  topPerformersCount: number;
  needsInterventionCount: number;
}

export const assessmentAnalyticsService = {
  /** Calculate comprehensive class analytics for an assignment */
  async getClassAnalytics(assignmentId: string): Promise<ClassAnalyticsSummary> {
    const attempts = await assessmentAttemptService.getAssignmentAttempts(assignmentId);
    const completed = attempts.filter((a) => a.status === 'marked' || a.status === 'moderated' || a.status === 'released');

    const scores = completed.map((a) => a.totalScore ?? 0).sort((a, b) => a - b);
    const totalAssigned = Math.max(attempts.length, 1);
    const totalCompleted = completed.length;
    const completionRate = Math.round((totalCompleted / totalAssigned) * 100);

    const meanScore = scores.length > 0 ? Math.round((scores.reduce((s, x) => s + x, 0) / scores.length) * 10) / 10 : 0;
    const medianScore = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;
    const highestScore = scores.length > 0 ? scores[scores.length - 1] : 0;
    const lowestScore = scores.length > 0 ? scores[0] : 0;

    // Variance & StdDev
    const variance = scores.length > 0
      ? scores.reduce((s, x) => s + Math.pow(x - meanScore, 2), 0) / scores.length
      : 0;
    const standardDeviation = Math.round(Math.sqrt(variance) * 10) / 10;

    const passCount = completed.filter((a) => (a.percentage ?? 0) >= 50).length;
    const passRatePercentage = completed.length > 0 ? Math.round((passCount / completed.length) * 100) : 0;

    // Grade Distribution
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    completed.forEach((a) => {
      const p = a.percentage ?? 0;
      if (p >= 80) gradeDistribution.A++;
      else if (p >= 65) gradeDistribution.B++;
      else if (p >= 50) gradeDistribution.C++;
      else if (p >= 35) gradeDistribution.D++;
      else gradeDistribution.E++;
    });

    const topPerformersCount = gradeDistribution.A + gradeDistribution.B;
    const needsInterventionCount = gradeDistribution.D + gradeDistribution.E;

    // Simulated Item Analysis
    const itemAnalyses: ItemAnalysis[] = Array.from({ length: 5 }, (_, i) => {
      const qNum = i + 1;
      const facilityIndex = Math.round((0.4 + Math.random() * 0.5) * 100) / 100;
      let flaggedIssue: ItemAnalysis['flaggedIssue'] | undefined;
      if (facilityIndex > 0.88) flaggedIssue = 'TOO_EASY';
      else if (facilityIndex < 0.35) flaggedIssue = 'TOO_HARD';

      return {
        questionId: `q_${qNum}`,
        questionText: `Question ${qNum}: Evaluate expression / core outcome`,
        maxMarks: 10,
        attemptCount: totalCompleted,
        correctCount: Math.round(totalCompleted * facilityIndex),
        averageMarks: Math.round(10 * facilityIndex * 10) / 10,
        facilityIndex,
        discriminationIndex: Math.round((0.3 + Math.random() * 0.4) * 100) / 100,
        mostCommonWrongAnswer: 'Option B',
        flaggedIssue,
      };
    });

    return {
      assignmentId,
      assessmentTitle: 'Form 4 Mathematics Trial Assessment',
      totalAssigned,
      totalCompleted,
      completionRate,
      meanScore,
      medianScore,
      highestScore,
      lowestScore,
      standardDeviation,
      passRatePercentage,
      gradeDistribution,
      itemAnalyses,
      topPerformersCount,
      needsInterventionCount,
    };
  },

  /** Generate CSV export text for class results */
  exportClassResultsCSV(summary: ClassAnalyticsSummary, attempts: AssessmentAttempt[]): string {
    const header = 'Learner Name,Admission No,Attempt Status,Total Score,Percentage,Grade,Late Submission';
    const rows = attempts.map((a) => [
      `"${a.learnerName}"`,
      a.admissionNo ?? '—',
      a.status,
      a.totalScore ?? 0,
      `${a.percentage ?? 0}%`,
      a.grade ?? '—',
      a.isLate ? 'YES' : 'NO',
    ].join(','));

    return [
      `Assessment: ${summary.assessmentTitle}`,
      `Class Mean: ${summary.meanScore}, Pass Rate: ${summary.passRatePercentage}%`,
      '',
      header,
      ...rows,
    ].join('\n');
  },
};
