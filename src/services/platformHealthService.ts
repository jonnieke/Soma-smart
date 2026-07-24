import { PlatformService, ServiceLevelObjective, RecoveryObjective } from '../types/platformCore';

const SERVICES_KEY = 'soma_platform_services';
const SLOS_KEY = 'soma_platform_slos';

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

export const platformHealthService = {
  /** Get platform service catalogue */
  getServices(): PlatformService[] {
    const list = readLocal<PlatformService[]>(SERVICES_KEY, []);
    if (list.length > 0) return list;

    const seed: PlatformService[] = [
      {
        id: 'srv_auth_001',
        name: 'Authentication & Session Service',
        description: 'Handles platform logins, token validation, and tenant authorization',
        ownerTeam: 'Platform Security',
        criticality: 'critical',
        runtime: 'Node.js / Supabase Auth',
        environments: ['production', 'staging'],
        dependencyIds: [],
        dataClassification: 'restricted',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_studio_002',
        name: 'Soma Paper Studio Engine',
        description: 'Generates CBC/KCSE mock examination papers and schemes',
        ownerTeam: 'Assessment Engineering',
        criticality: 'critical',
        runtime: 'React / Gemini AI Engine',
        environments: ['production', 'staging'],
        dependencyIds: ['srv_auth_001'],
        dataClassification: 'confidential',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'srv_payments_003',
        name: 'M-Pesa & Billing Adapter',
        description: 'Processes school subscriptions, credit packs, and marketplace wallets',
        ownerTeam: 'Finance & Monetization',
        criticality: 'critical',
        runtime: 'Node.js / Daraja API',
        environments: ['production', 'staging'],
        dependencyIds: ['srv_auth_001'],
        dataClassification: 'restricted',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(SERVICES_KEY, seed);
    return seed;
  },

  /** Get Service Level Objectives (SLOs) */
  getSLOs(): ServiceLevelObjective[] {
    const list = readLocal<ServiceLevelObjective[]>(SLOS_KEY, []);
    if (list.length > 0) return list;

    const seed: ServiceLevelObjective[] = [
      {
        id: 'slo_001',
        serviceId: 'srv_auth_001',
        name: 'Authentication Availability',
        indicator: 'Successful login rate',
        targetPercentage: 99.9,
        measurementWindowDays: 30,
        thresholdMs: 500,
        status: 'active',
      },
      {
        id: 'slo_002',
        serviceId: 'srv_studio_002',
        name: 'Paper Studio Save Latency',
        indicator: 'Autosave completion within 1.5 seconds',
        targetPercentage: 99.5,
        measurementWindowDays: 30,
        thresholdMs: 1500,
        status: 'active',
      },
    ];

    writeLocal(SLOS_KEY, seed);
    return seed;
  },

  /** Get Recovery Objectives (RPO / RTO) */
  getRecoveryObjectives(): RecoveryObjective[] {
    return [
      {
        id: 'rpo_001',
        serviceId: 'srv_auth_001',
        recoveryPointObjectiveMinutes: 5,
        recoveryTimeObjectiveMinutes: 15,
        criticality: 'critical',
        approvedBy: 'Chief Technology Officer',
        reviewedAt: new Date().toISOString(),
      },
      {
        id: 'rpo_002',
        serviceId: 'srv_payments_003',
        recoveryPointObjectiveMinutes: 0,
        recoveryTimeObjectiveMinutes: 30,
        criticality: 'critical',
        approvedBy: 'Head of Finance & Operations',
        reviewedAt: new Date().toISOString(),
      },
    ];
  },
};
