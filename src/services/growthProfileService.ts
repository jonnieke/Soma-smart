import { GrowthProfile, LifecycleStage, ActivationStatus } from '../types/growthOS';

const GROWTH_PROFILES_KEY = 'soma_growth_profiles';

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

export const growthProfileService = {
  /** Get or initialize growth profile */
  getGrowthProfile(userId = 'usr_teacher_001'): GrowthProfile {
    const profiles = readLocal<GrowthProfile[]>(GROWTH_PROFILES_KEY, []);
    const found = profiles.find((p) => p.userId === userId);
    if (found) return found;

    const initial: GrowthProfile = {
      id: `gp_${Date.now()}`,
      userId,
      tenantId: 'tenant_school_001',
      userSegment: 'Teacher',
      acquisitionSource: 'Organic Search',
      accountCreatedAt: new Date().toISOString(),
      activationStatus: 'activated',
      activatedAt: new Date().toISOString(),
      activationEvent: 'First exported paper',
      lifecycleStage: 'engaged',
      lastMeaningfulActivityAt: new Date().toISOString(),
      currentPlanId: 'school_standard',
      marketingConsent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    writeLocal(GROWTH_PROFILES_KEY, [initial, ...profiles]);
    return initial;
  },

  /** Update user lifecycle stage */
  updateLifecycleStage(userId: string, stage: LifecycleStage): GrowthProfile {
    const profile = this.getGrowthProfile(userId);
    profile.lifecycleStage = stage;
    profile.updatedAt = new Date().toISOString();

    const profiles = readLocal<GrowthProfile[]>(GROWTH_PROFILES_KEY, []);
    const idx = profiles.findIndex((p) => p.userId === userId);
    if (idx >= 0) profiles[idx] = profile;
    writeLocal(GROWTH_PROFILES_KEY, profiles);
    return profile;
  },
};
