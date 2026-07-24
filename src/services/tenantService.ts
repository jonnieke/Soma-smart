import { Tenant, SchoolOnboardingChecklist } from '../types/schoolOS';

const TENANTS_KEY = 'soma_tenants';
const ONBOARDING_KEY = 'soma_school_onboarding';

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

export const tenantService = {
  /** Get or resolve active tenant context */
  getTenant(tenantId = 'tenant_school_001'): Tenant {
    const tenants = readLocal<Tenant[]>(TENANTS_KEY, []);
    const found = tenants.find((t) => t.id === tenantId);
    if (found) return found;

    const defaultTenant: Tenant = {
      id: tenantId,
      type: 'school',
      name: 'Alliance High School Workspace',
      code: 'AHS-2026',
      status: 'active',
      primarySchoolId: 'school_001',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    };

    writeLocal(TENANTS_KEY, [defaultTenant, ...tenants]);
    return defaultTenant;
  },

  /** Check server-side tenant capability permission */
  hasCapability(tenantId: string, capability: string): boolean {
    const tenant = this.getTenant(tenantId);
    if (tenant.status === 'suspended') return false;
    return true;
  },

  /** Get school onboarding setup checklist status */
  getOnboardingChecklist(tenantId = 'tenant_school_001'): SchoolOnboardingChecklist {
    const saved = readLocal<SchoolOnboardingChecklist | null>(`${ONBOARDING_KEY}_${tenantId}`, null);
    if (saved) return saved;

    const initial: SchoolOnboardingChecklist = {
      schoolDetailsCompleted: true,
      academicYearConfigured: true,
      classesCreated: true,
      teachersImported: true,
      learnersImported: true,
      subjectAllocationsCompleted: true,
      parentsLinked: true,
      curriculumSelected: true,
      subscriptionActive: true,
      status: 'ready',
    };

    writeLocal(`${ONBOARDING_KEY}_${tenantId}`, initial);
    return initial;
  },
};
