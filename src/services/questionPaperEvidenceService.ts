import { QuestionEvidenceProfile, PaperEvidenceProfile } from '../types/strategicIntelligence';

const Q_EVAL_KEY = 'soma_question_evidence_profiles';
const P_EVAL_KEY = 'soma_paper_evidence_profiles';

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

export const questionPaperEvidenceService = {
  /** Get Question Evidence Profiles */
  getQuestionProfiles(): QuestionEvidenceProfile[] {
    const list = readLocal<QuestionEvidenceProfile[]>(Q_EVAL_KEY, []);
    if (list.length > 0) return list;

    const seed: QuestionEvidenceProfile[] = [
      {
        id: 'qev_001',
        questionId: 'q_math_g4_001',
        questionVersionId: 'v1.0',
        countryCode: 'KE',
        curriculumFrameworkId: 'kicd_cbc_2024',
        configuredDifficulty: 0.45,
        observedDifficulty: 0.48,
        discriminationEstimate: 0.62,
        learnerSampleSize: 1420,
        schoolSampleSize: 18,
        assessmentSampleSize: 34,
        averageScore: 0.48,
        skipRate: 0.02,
        averageResponseSeconds: 45,
        markingDisagreementRate: 0.01,
        challengeRate: 0.0,
        evidenceConfidence: 'high',
        qualityStatus: 'performing_well',
        warnings: [],
        algorithmVersion: 'v2026.1',
        calculatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(Q_EVAL_KEY, seed);
    return seed;
  },

  /** Get Paper Evidence Profiles */
  getPaperProfiles(): PaperEvidenceProfile[] {
    const list = readLocal<PaperEvidenceProfile[]>(P_EVAL_KEY, []);
    if (list.length > 0) return list;

    const seed: PaperEvidenceProfile[] = [
      {
        id: 'pev_001',
        paperId: 'paper_kcse_math_001',
        paperVersionId: 'v2.1',
        blueprintComplianceScore: 98.5,
        curriculumCoverageScore: 96.0,
        questionQualityScore: 94.2,
        markingConsistencyScore: 99.0,
        completionSuitabilityScore: 92.5,
        overallEvidenceScore: 96.0,
        learnerSampleSize: 850,
        schoolSampleSize: 12,
        assessmentSampleSize: 15,
        evidenceConfidence: 'high',
        warnings: [],
        algorithmVersion: 'v2026.1',
        calculatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(P_EVAL_KEY, seed);
    return seed;
  },

  /** Calculate statistical confidence level based on sample size */
  calculateConfidence(learnerCount: number, schoolCount: number): QuestionEvidenceProfile['evidenceConfidence'] {
    if (learnerCount < 30 || schoolCount < 2) return 'insufficient';
    if (learnerCount < 100) return 'low';
    if (learnerCount < 500) return 'moderate';
    return 'high';
  },
};
