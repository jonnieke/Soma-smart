import { ContributorReputation, RoyaltyAllocation } from '../types/strategicIntelligence';

const REPUTATION_KEY = 'soma_contributor_reputations';
const ROYALTIES_KEY = 'soma_royalty_allocations';

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

export const contributorRoyaltyService = {
  /** Get Contributor Reputation Profiles */
  getReputations(): ContributorReputation[] {
    const list = readLocal<ContributorReputation[]>(REPUTATION_KEY, []);
    if (list.length > 0) return list;

    const seed: ContributorReputation[] = [
      {
        id: 'rep_001',
        contributorId: 'usr_teacher_001',
        verifiedRoles: ['exam_setter', 'question_writer', 'subject_reviewer'],
        subjects: ['Mathematics', 'Integrated Science'],
        grades: ['Grade 4', 'Grade 7', 'Form 2'],
        countries: ['KE'],
        approvedContributionCount: 48,
        rejectedContributionCount: 1,
        revisionRequestRate: 0.04,
        qualityWarningRate: 0.0,
        buyerRating: 4.9,
        reviewerRating: 4.95,
        reputationBand: 'specialist',
        calculatedAt: new Date().toISOString(),
        algorithmVersion: 'v2026.1',
      },
    ];

    writeLocal(REPUTATION_KEY, seed);
    return seed;
  },

  /** Get Royalty Allocations Snapshot */
  getRoyaltyAllocations(): RoyaltyAllocation[] {
    const list = readLocal<RoyaltyAllocation[]>(ROYALTIES_KEY, []);
    if (list.length > 0) return list;

    const seed: RoyaltyAllocation[] = [
      {
        id: 'roy_001',
        orderId: 'ord_paper_bank_789',
        resourceId: 'paper_kcse_math_001',
        contributorId: 'usr_teacher_001',
        contributionType: 'exam_setter',
        allocationMethod: 'percentage',
        allocationValue: 70,
        earningAmount: 350,
        ruleVersion: 'v2026.1',
        createdAt: new Date().toISOString(),
      },
    ];

    writeLocal(ROYALTIES_KEY, seed);
    return seed;
  },
};
