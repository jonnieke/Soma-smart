import { CurriculumMisconception, ContentImpactProfile } from '../types/strategicIntelligence';

const MISCONCEPTIONS_KEY = 'soma_curriculum_misconceptions';
const IMPACT_KEY = 'soma_content_impact_profiles';

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

export const misconceptionContentImpactService = {
  /** Get Curriculum Misconceptions Library */
  getMisconceptions(): CurriculumMisconception[] {
    const list = readLocal<CurriculumMisconception[]>(MISCONCEPTIONS_KEY, []);
    if (list.length > 0) return list;

    const seed: CurriculumMisconception[] = [
      {
        id: 'misc_001',
        countryCode: 'KE',
        curriculumFrameworkId: 'kicd_cbc_2024',
        subjectId: 'Mathematics',
        curriculumNodeIds: ['node_num_place_val'],
        title: 'Treating Zero in Place Value as Blank',
        description: 'Learners write 405 as 45 by ignoring the zero placeholder in tens position.',
        misconceptionType: 'placeholder_omission',
        diagnosticQuestionIds: ['q_math_g4_001'],
        remediationResourceIds: ['res_place_value_abacus'],
        evidenceCount: 420,
        learnerSampleSize: 1250,
        schoolSampleSize: 15,
        evidenceConfidence: 'high',
        status: 'specialist_verified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(MISCONCEPTIONS_KEY, seed);
    return seed;
  },

  /** Get Content Impact Profiles */
  getContentImpactProfiles(): ContentImpactProfile[] {
    const list = readLocal<ContentImpactProfile[]>(IMPACT_KEY, []);
    if (list.length > 0) return list;

    const seed: ContentImpactProfile[] = [
      {
        id: 'imp_001',
        resourceId: 'res_place_value_abacus',
        resourceVersionId: 'v1.0',
        curriculumNodeIds: ['node_num_place_val'],
        assignmentCount: 380,
        completionCount: 365,
        learnerSampleSize: 890,
        schoolSampleSize: 14,
        averagePreEvidence: 42.5,
        averagePostEvidence: 78.4,
        observedChange: +35.9,
        evidenceConfidence: 'high',
        interpretation: 'positive_association',
        limitations: ['Non-randomized observational assignment', 'Self-selected completing cohorts'],
        algorithmVersion: 'v2026.1',
        calculatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(IMPACT_KEY, seed);
    return seed;
  },
};
