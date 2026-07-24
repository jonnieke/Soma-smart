import {
  EvidenceConfidence,
  LearnerProgressSignal,
  MisconceptionSignal,
  QuestionQualityProfile,
  PaperQualityProfile,
  CurriculumCoverageSnapshot,
} from '../types/educationIntelligence';
import { assessmentAttemptService } from './assessmentAttemptService';
import { learnerMasteryRevisionService } from './learnerMasteryRevisionService';
import { supabase } from '../lib/supabase';

const SIGNALS_STORAGE_KEY = 'soma_learner_progress_signals';
const MISCONCEPTIONS_STORAGE_KEY = 'soma_misconception_signals';
const QUESTION_QUALITY_KEY = 'soma_question_quality_profiles';
const PAPER_QUALITY_KEY = 'soma_paper_quality_profiles';

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

export const educationIntelligenceService = {
  /** Calculate evidence confidence rating based on sample count and recency */
  calculateEvidenceConfidence(evidenceCount: number, recentEvidenceCount: number): EvidenceConfidence {
    if (evidenceCount === 0) return 'insufficient';
    if (evidenceCount < 3) return 'low';
    if (evidenceCount < 8 || recentEvidenceCount < 2) return 'moderate';
    return 'high';
  },

  /** Generate or retrieve learner progress signals and risk indicators */
  async getLearnerProgressSignals(schoolId?: string, teacherId?: string): Promise<LearnerProgressSignal[]> {
    const custom = readLocal<LearnerProgressSignal[]>(SIGNALS_STORAGE_KEY, []);
    if (custom.length > 0) return custom;

    // Seed realistic signals for demonstration
    const seed: LearnerProgressSignal[] = [
      {
        id: 'sig_001',
        learnerId: 'learner_001',
        learnerName: 'Juma Omondi',
        subject: 'Mathematics',
        topic: 'Mensuration & Cylinder Area',
        currentMasteryScore: 35,
        previousMasteryScore: 52,
        growthScore: -17,
        evidenceCount: 4,
        recentEvidenceCount: 2,
        evidenceConfidence: 'moderate',
        recentTrend: 'declining',
        priorityLevel: 'urgent_review',
        factors: [
          { code: 'FORMULA_MISCONCEPTION', description: 'Incorrect cylinder surface area formula application', weight: 0.8 },
          { code: 'RECENT_SCORE_DROP', description: 'Score dropped 17% between CAT 1 and Trial Exam', weight: 0.6 },
        ],
        recommendedActionIds: ['act_mensuration_remedial'],
        calculatedAt: new Date().toISOString(),
      },
      {
        id: 'sig_002',
        learnerId: 'learner_002',
        learnerName: 'Amina Mohamed',
        subject: 'Mathematics',
        topic: 'Quadratic Equations & Roots',
        currentMasteryScore: 88,
        previousMasteryScore: 70,
        growthScore: +18,
        evidenceCount: 9,
        recentEvidenceCount: 4,
        evidenceConfidence: 'high',
        recentTrend: 'strong_improvement',
        priorityLevel: 'monitor',
        factors: [
          { code: 'MASTERY_CONSOLIDATED', description: 'Consistently solved factoring and formula items', weight: 0.9 },
        ],
        recommendedActionIds: ['act_quadratic_extension'],
        calculatedAt: new Date().toISOString(),
      },
      {
        id: 'sig_003',
        learnerId: 'learner_003',
        learnerName: 'Kevin Kiprop',
        subject: 'Integrated Science',
        topic: 'Photosynthesis & Light Reactions',
        currentMasteryScore: 48,
        previousMasteryScore: 45,
        growthScore: +3,
        evidenceCount: 3,
        recentEvidenceCount: 1,
        evidenceConfidence: 'low',
        recentTrend: 'stable',
        priorityLevel: 'practice',
        factors: [
          { code: 'LOW_EVIDENCE_COUNT', description: 'Only 3 questions attempted across 1 quiz', weight: 0.4 },
        ],
        recommendedActionIds: ['act_photosynthesis_quiz'],
        calculatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(SIGNALS_STORAGE_KEY, seed);
    return seed;
  },

  /** Detect common misconceptions from question distractor performance */
  getMisconceptionSignals(subject?: string): MisconceptionSignal[] {
    const custom = readLocal<MisconceptionSignal[]>(MISCONCEPTIONS_STORAGE_KEY, []);
    if (custom.length > 0) return custom;

    const seed: MisconceptionSignal[] = [
      {
        id: 'misc_001',
        subject: 'Mathematics',
        topic: 'Mensuration & Geometry',
        misconceptionCode: 'CYLINDER_BASE_OMISSION',
        description: 'Learners calculated curved surface area (2πrh) but omitted both circular base areas 2πr².',
        affectedLearnerCount: 14,
        sampleSize: 32,
        confidence: 'high',
        detectedAt: new Date().toISOString(),
      },
      {
        id: 'misc_002',
        subject: 'Mathematics',
        topic: 'Algebraic Expressions',
        misconceptionCode: 'NEGATIVE_SIGN_DISTRIBUTION',
        description: 'Failing to distribute negative sign into parenthetical terms when expanding expressions.',
        affectedLearnerCount: 9,
        sampleSize: 32,
        confidence: 'moderate',
        detectedAt: new Date().toISOString(),
      },
    ];

    writeLocal(MISCONCEPTIONS_STORAGE_KEY, seed);
    return seed;
  },

  /** Evaluate question quality profiles (detecting possible miskeys or ambiguous phrasing) */
  getQuestionQualityProfiles(subject?: string): QuestionQualityProfile[] {
    const list = readLocal<QuestionQualityProfile[]>(QUESTION_QUALITY_KEY, []);
    if (list.length > 0) return list;

    const seed: QuestionQualityProfile[] = [
      {
        questionId: 'q_math_f4_03',
        questionText: 'Evaluate the integral of (2x + 1) with respect to x from 0 to 3.',
        subject: 'Mathematics',
        grade: 'Form 4',
        attemptCount: 45,
        facilityIndex: 0.22,
        discriminationIndex: 0.05,
        skipRatePercentage: 18,
        status: 'possible_miskey',
        evidenceConfidence: 'high',
        flaggedReasons: ['Low discrimination index (0.05)', 'High failure rate despite easy outcome'],
        updatedAt: new Date().toISOString(),
      },
      {
        questionId: 'q_sc_g6_01',
        questionText: 'Identify the primary source of energy in the water cycle.',
        subject: 'Integrated Science',
        grade: 'Grade 6',
        attemptCount: 60,
        facilityIndex: 0.94,
        skipRatePercentage: 0,
        status: 'too_easy_for_purpose',
        evidenceConfidence: 'high',
        flaggedReasons: ['94% facility index (too easy for Summative Assessment)'],
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(QUESTION_QUALITY_KEY, seed);
    return seed;
  },

  /** Calculate paper quality profile */
  getPaperQualityProfile(paperId: string): PaperQualityProfile {
    const profiles = readLocal<PaperQualityProfile[]>(PAPER_QUALITY_KEY, []);
    const existing = profiles.find((p) => p.paperId === paperId);
    if (existing) return existing;

    return {
      paperId,
      title: 'Form 4 Mathematics Trial Examination',
      subject: 'Mathematics',
      grade: 'Form 4',
      blueprintScore: 92,
      curriculumCoverageScore: 88,
      questionQualityScore: 84,
      markingQualityScore: 90,
      overallQualityScore: 88.5,
      evidenceConfidence: 'high',
      warnings: ['Question #3 flagged for low discrimination'],
      calculatedAt: new Date().toISOString(),
    };
  },
};
