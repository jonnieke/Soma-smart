import { LearnerGuardianLink } from '../types/schoolOS';

const GUARDIAN_LINKS_KEY = 'soma_guardian_links';

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

export const parentEngagementService = {
  /** Get learner guardian links */
  getGuardianLinks(tenantId = 'tenant_school_001'): LearnerGuardianLink[] {
    const list = readLocal<LearnerGuardianLink[]>(GUARDIAN_LINKS_KEY, []);
    if (list.length > 0) return list;

    const seed: LearnerGuardianLink[] = [
      {
        id: 'link_001',
        tenantId,
        learnerId: 'learner_001',
        learnerName: 'Juma Omondi',
        guardianUserId: 'parent_omondi',
        guardianName: 'Dr. Otieno Omondi',
        guardianEmail: 'otieno.omondi@example.com',
        relationship: 'parent',
        permissions: { viewResults: true, receiveReports: true, receiveAnnouncements: true },
        isPrimary: true,
        status: 'active',
      },
    ];

    writeLocal(GUARDIAN_LINKS_KEY, seed);
    return seed;
  },

  /** Link a parent to a learner securely */
  linkParentToLearner(params: {
    tenantId: string;
    learnerId: string;
    learnerName: string;
    guardianName: string;
    guardianEmail: string;
    relationship: LearnerGuardianLink['relationship'];
  }): LearnerGuardianLink {
    const link: LearnerGuardianLink = {
      id: `link_${Date.now()}`,
      tenantId: params.tenantId,
      learnerId: params.learnerId,
      learnerName: params.learnerName,
      guardianUserId: `g_${Date.now()}`,
      guardianName: params.guardianName,
      guardianEmail: params.guardianEmail,
      relationship: params.relationship,
      permissions: { viewResults: true, receiveReports: true, receiveAnnouncements: true },
      isPrimary: true,
      status: 'active',
    };

    const list = readLocal<LearnerGuardianLink[]>(GUARDIAN_LINKS_KEY, []);
    list.unshift(link);
    writeLocal(GUARDIAN_LINKS_KEY, list);
    return link;
  },
};
