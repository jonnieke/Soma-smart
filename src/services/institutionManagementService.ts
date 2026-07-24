import { SchoolSupportRequest } from '../types/schoolOS';

const SUPPORT_KEY = 'soma_school_support_requests';

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

export const institutionManagementService = {
  /** Get platform support requests */
  getSupportRequests(tenantId = 'tenant_school_001'): SchoolSupportRequest[] {
    const list = readLocal<SchoolSupportRequest[]>(SUPPORT_KEY, []);
    if (list.length > 0) return list;

    const seed: SchoolSupportRequest[] = [
      {
        id: 'sup_001',
        tenantId,
        requesterId: 'usr_admin',
        requesterName: 'Principal Kamau',
        category: 'CREDITS',
        subject: 'Request for End-Term AI Credit Allocation Top-Up',
        description: 'Need 1,000 additional AI credits for Grade 9 formative marking.',
        status: 'open',
        createdAt: '2026-07-22T15:00:00Z',
      },
    ];

    writeLocal(SUPPORT_KEY, seed);
    return seed;
  },

  /** Submit a new support request */
  submitSupportRequest(params: {
    tenantId: string;
    requesterId: string;
    requesterName: string;
    category: SchoolSupportRequest['category'];
    subject: string;
    description: string;
  }): SchoolSupportRequest {
    const req: SchoolSupportRequest = {
      id: `sup_${Date.now()}`,
      tenantId: params.tenantId,
      requesterId: params.requesterId,
      requesterName: params.requesterName,
      category: params.category,
      subject: params.subject,
      description: params.description,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const list = readLocal<SchoolSupportRequest[]>(SUPPORT_KEY, []);
    list.unshift(req);
    writeLocal(SUPPORT_KEY, list);
    return req;
  },

  /** Get platform health metrics for admin overview */
  getPlatformHealthMetrics() {
    return {
      activeTenantsCount: 42,
      activeLearnersCount: 18450,
      activeTeachersCount: 840,
      systemUptimePercentage: 99.94,
      aiCreditUsageMonthly: 142000,
      failedJobsCount: 0,
    };
  },
};
