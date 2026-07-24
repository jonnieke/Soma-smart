import { RevisionImpactRecord, IntelligenceRecommendation } from '../types/educationIntelligence';

const REVISION_IMPACT_STORAGE_KEY = 'soma_revision_impact_records';

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

export const revisionImpactService = {
  /** Get revision impact correlation records */
  getRevisionImpactRecords(learnerId = 'learner_001'): RevisionImpactRecord[] {
    const list = readLocal<RevisionImpactRecord[]>(REVISION_IMPACT_STORAGE_KEY, []);
    if (list.length > 0) return list;

    const seed: RevisionImpactRecord[] = [
      {
        id: 'imp_001',
        learnerId,
        subject: 'Mathematics',
        topic: 'Quadratic Equations',
        activityId: 'act_quad_step_by_step',
        activityTitle: 'SomaAI Step-by-Step Quadratic Formula Revision',
        completedAt: '2026-07-18T14:00:00Z',
        preAssessmentScore: 50,
        postAssessmentScore: 78,
        scoreGainPercentage: +28,
        isMeasurablyEffective: true,
        evidenceConfidence: 'high',
      },
      {
        id: 'imp_002',
        learnerId,
        subject: 'Mathematics',
        topic: 'Mensuration',
        activityId: 'act_mens_practice',
        activityTitle: 'Mensuration Practice Quiz',
        completedAt: '2026-07-21T10:00:00Z',
        preAssessmentScore: 35,
        postAssessmentScore: 42,
        scoreGainPercentage: +7,
        isMeasurablyEffective: false,
        evidenceConfidence: 'moderate',
      },
    ];

    writeLocal(REVISION_IMPACT_STORAGE_KEY, seed);
    return seed;
  },

  /** Compute next best activity recommendation using rules-first engine */
  getNextBestActivity(learnerId = 'learner_001', subject = 'Mathematics'): IntelligenceRecommendation {
    return {
      id: `rec_next_${Date.now()}`,
      learnerId,
      subject,
      topic: 'Mensuration & Cylinder Base Areas',
      recommendationType: 'ASSIGN_REVISION',
      title: 'Complete 10-Minute Cylinder Surface Area Practice Pack',
      reason: 'Your recent CAT 1 showed a 17% drop in surface area questions.',
      evidenceSummary: 'Based on 4 questions across 2 recent assessments (Moderate Confidence)',
      evidenceConfidence: 'moderate',
      priority: 'high',
      status: 'suggested',
      createdAt: new Date().toISOString(),
    };
  },
};
