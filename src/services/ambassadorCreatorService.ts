import { AmbassadorProfile, CreatorBrief } from '../types/growthOS';

const AMBASSADORS_KEY = 'soma_ambassadors';
const BRIEFS_KEY = 'soma_creator_briefs';

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

export const ambassadorCreatorService = {
  /** Get teacher ambassador profiles */
  getAmbassadors(): AmbassadorProfile[] {
    const list = readLocal<AmbassadorProfile[]>(AMBASSADORS_KEY, []);
    if (list.length > 0) return list;

    const seed: AmbassadorProfile[] = [
      {
        id: 'amb_001',
        userId: 'usr_teacher_001',
        userName: 'Mwalimu Kamau',
        schoolName: 'Alliance High School',
        county: 'Kiambu',
        roleTitle: 'County Ambassador',
        status: 'active',
        referralsCount: 14,
        totalEarningsKes: 7000,
        createdAt: '2026-06-01T00:00:00Z',
      },
    ];

    writeLocal(AMBASSADORS_KEY, seed);
    return seed;
  },

  /** Get creator content briefs */
  getCreatorBriefs(): CreatorBrief[] {
    const list = readLocal<CreatorBrief[]>(BRIEFS_KEY, []);
    if (list.length > 0) return list;

    const seed: CreatorBrief[] = [
      {
        id: 'brief_001',
        title: 'Form 4 Physics Paper 1 Model Examination',
        curriculumOutcome: 'KCSE Physics Mechanics & Waves',
        grade: 'Form 4',
        subject: 'Physics',
        resourceType: 'exam_paper',
        payoutAmountKes: 2500,
        status: 'open',
        createdAt: '2026-07-20T00:00:00Z',
      },
    ];

    writeLocal(BRIEFS_KEY, seed);
    return seed;
  },
};
