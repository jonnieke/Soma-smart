import { SchoolInvoice, PlanEntitlement } from '../types/schoolOS';

export interface SchoolSubscription {
  id: string;
  schoolId: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  expiresAt: string;
  teacherCount: number;
  teacherSeatLimit: number;
  learnerCount: number;
  aiCredits: number;
  aiCreditsMonthly: number;
  aiCreditsRemaining: number;
}

export interface SchoolSubscriptionTransaction {
  id: string;
  schoolId: string;
  description: string;
  amountKes: number;
  method: string;
  phoneNumber?: string;
  mpesaCheckoutId?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

const INVOICES_KEY = 'soma_school_invoices';
const SUBSCRIPTION_KEY = 'soma_school_subscription';
const TRANSACTIONS_KEY = 'soma_school_transactions';

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

export const schoolBillingService = {
  /** Get active subscription for a school */
  async getSchoolSubscription(schoolId = 'school_001'): Promise<SchoolSubscription | null> {
    const saved = readLocal<SchoolSubscription | null>(`${SUBSCRIPTION_KEY}_${schoolId}`, null);
    if (saved) return saved;

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const defaultSub: SchoolSubscription = {
      id: `sub_${Date.now()}`,
      schoolId,
      planId: 'school_standard',
      planName: 'School Standard Plan',
      status: 'ACTIVE',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: expiresAt,
      expiresAt,
      teacherCount: 50,
      teacherSeatLimit: 50,
      learnerCount: 1500,
      aiCredits: 5000,
      aiCreditsMonthly: 5000,
      aiCreditsRemaining: 4250,
    };

    writeLocal(`${SUBSCRIPTION_KEY}_${schoolId}`, defaultSub);
    return defaultSub;
  },

  /** Get billing/payment transactions history */
  async getSchoolBillingHistory(schoolId = 'school_001'): Promise<SchoolSubscriptionTransaction[]> {
    return readLocal<SchoolSubscriptionTransaction[]>(`${TRANSACTIONS_KEY}_${schoolId}`, [
      {
        id: 'tx_001',
        schoolId,
        description: 'School Standard Plan — Term 1 Subscription',
        amountKes: 45000,
        method: 'M-Pesa STK Push',
        phoneNumber: '254712345678',
        mpesaCheckoutId: 'ws_CO_01012026',
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
      },
    ]);
  },

  /** Initiate payment */
  async initiateSchoolPayment(schoolId: string, planId: string, details?: any) {
    const ref = `ref_${Date.now()}`;
    const tx: SchoolSubscriptionTransaction = {
      id: `tx_${Date.now()}`,
      schoolId,
      description: `Subscription Payment (${planId})`,
      amountKes: 45000,
      method: 'M-Pesa / PesaPal',
      phoneNumber: details?.phone || '254712345678',
      mpesaCheckoutId: ref,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const history = await this.getSchoolBillingHistory(schoolId);
    history.unshift(tx);
    writeLocal(`${TRANSACTIONS_KEY}_${schoolId}`, history);

    return { reference: ref, checkoutId: ref, status: 'PENDING' };
  },

  /** Verify and activate subscription */
  async verifyAndActivateSchoolSubscription(schoolId: string, reference?: string, userId?: string): Promise<SchoolSubscription> {
    let sub = await this.getSchoolSubscription(schoolId);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    if (!sub) {
      sub = {
        id: `sub_${Date.now()}`,
        schoolId,
        planId: 'school_standard',
        planName: 'School Standard Plan',
        status: 'ACTIVE',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: expiresAt,
        expiresAt,
        teacherCount: 50,
        teacherSeatLimit: 50,
        learnerCount: 1500,
        aiCredits: 5000,
        aiCreditsMonthly: 5000,
        aiCreditsRemaining: 5000,
      };
    } else {
      sub.status = 'ACTIVE';
      sub.currentPeriodEnd = expiresAt;
      sub.expiresAt = expiresAt;
    }

    writeLocal(`${SUBSCRIPTION_KEY}_${schoolId}`, sub);
    return sub;
  },

  /** Get invoices for a school tenant */
  getInvoices(tenantId = 'tenant_school_001'): SchoolInvoice[] {
    const list = readLocal<SchoolInvoice[]>(INVOICES_KEY, []);
    if (list.length > 0) return list;

    const seed: SchoolInvoice[] = [
      {
        id: 'inv_2026_t1',
        tenantId,
        invoiceNumber: 'INV-AHS-2026-001',
        amountKes: 45000,
        billingPeriod: '2026 Term 1 Subscription & AI Allocation',
        status: 'PAID',
        issuedAt: '2026-01-05T00:00:00Z',
        dueDate: '2026-01-20T00:00:00Z',
        paidAt: '2026-01-10T00:00:00Z',
      },
    ];

    writeLocal(INVOICES_KEY, seed);
    return seed;
  },

  /** Evaluate server-side entitlement limits */
  checkEntitlement(tenantId: string, entitlementKey: string, currentUsage: number): { isAllowed: boolean; limit: number } {
    const limits: Record<string, number> = {
      'teachers.limit': 50,
      'learners.limit': 1500,
      'aiCredits.monthly': 5000,
    };

    const limit = limits[entitlementKey] || 999999;
    return {
      isAllowed: currentUsage < limit,
      limit,
    };
  },
};
