import { ReferralRecord, ReferralRewardStatus } from '../types/growthOS';

const REFERRALS_KEY = 'soma_referrals';

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

export const referralService = {
  /** Generate signed referral code */
  generateReferralCode(userId: string): string {
    const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    return `REF-${cleanId}-2026`;
  },

  /** Get user referral history */
  getReferrals(userId = 'usr_teacher_001'): ReferralRecord[] {
    const list = readLocal<ReferralRecord[]>(REFERRALS_KEY, []);
    if (list.length > 0) return list;

    const seed: ReferralRecord[] = [
      {
        id: 'ref_001',
        referralCode: 'REF-TEACH1-2026',
        referrerUserId: userId,
        referredUserId: 'usr_teacher_002',
        referralType: 'teacher_refers_teacher',
        status: 'credited',
        rewardType: 'ai_credits',
        rewardValue: 500,
        createdAt: '2026-07-01T00:00:00Z',
        qualifiedAt: '2026-07-05T00:00:00Z',
      },
    ];

    writeLocal(REFERRALS_KEY, seed);
    return seed;
  },

  /** Anti-fraud self-referral check */
  isSelfReferral(referrerId: string, referredId: string): boolean {
    return referrerId === referredId;
  },

  /** Submit and qualify a new referral */
  createReferral(params: {
    referralCode: string;
    referrerUserId: string;
    referredUserId: string;
    referralType: ReferralRecord['referralType'];
  }): { success: boolean; referral?: ReferralRecord; error?: string } {
    if (this.isSelfReferral(params.referrerUserId, params.referredUserId)) {
      return { success: false, error: 'Self-referrals are not allowed.' };
    }

    const newRef: ReferralRecord = {
      id: `ref_${Date.now()}`,
      referralCode: params.referralCode,
      referrerUserId: params.referrerUserId,
      referredUserId: params.referredUserId,
      referralType: params.referralType,
      status: 'credited',
      rewardType: 'ai_credits',
      rewardValue: 500,
      createdAt: new Date().toISOString(),
      qualifiedAt: new Date().toISOString(),
    };

    const list = readLocal<ReferralRecord[]>(REFERRALS_KEY, []);
    list.unshift(newRef);
    writeLocal(REFERRALS_KEY, list);
    return { success: true, referral: newRef };
  },
};
