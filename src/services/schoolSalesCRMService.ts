import { SchoolSalesLead, SchoolDemo, SchoolPilot } from '../types/growthOS';

const LEADS_KEY = 'soma_school_sales_leads';
const DEMOS_KEY = 'soma_school_demos';
const PILOTS_KEY = 'soma_school_pilots';

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

export const schoolSalesCRMService = {
  /** Get school sales leads pipeline */
  getLeads(): SchoolSalesLead[] {
    const list = readLocal<SchoolSalesLead[]>(LEADS_KEY, []);
    if (list.length > 0) return list;

    const seed: SchoolSalesLead[] = [
      {
        id: 'lead_001',
        schoolName: 'St. Marys Academy Nairobi',
        contactPerson: 'Mrs. Jane Wanjiku',
        role: 'Principal',
        phone: '0711223344',
        email: 'jwanjiku@stmarys.ac.ke',
        county: 'Nairobi',
        estimatedLearners: 1200,
        estimatedTeachers: 45,
        stage: 'demo_scheduled',
        assignedSalesOwner: 'Sales Rep Otieno',
        estimatedContractValueKes: 180000,
        probability: 60,
        createdAt: '2026-07-15T00:00:00Z',
        updatedAt: '2026-07-20T00:00:00Z',
      },
    ];

    writeLocal(LEADS_KEY, seed);
    return seed;
  },

  /** Schedule a school demonstration */
  scheduleDemo(params: {
    leadId: string;
    schoolName: string;
    contactName: string;
    contactEmail: string;
    preferredDate: string;
    attendeesCount: number;
  }): SchoolDemo {
    const demo: SchoolDemo = {
      id: `demo_${Date.now()}`,
      leadId: params.leadId,
      schoolName: params.schoolName,
      contactName: params.contactName,
      contactEmail: params.contactEmail,
      preferredDate: params.preferredDate,
      attendeesCount: params.attendeesCount,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    const list = readLocal<SchoolDemo[]>(DEMOS_KEY, []);
    list.unshift(demo);
    writeLocal(DEMOS_KEY, list);
    return demo;
  },

  /** Start a school pilot */
  startPilot(params: {
    leadId: string;
    schoolId: string;
    schoolName: string;
    durationDays: number;
    targetTeachersCount: number;
  }): SchoolPilot {
    const pilot: SchoolPilot = {
      id: `pilot_${Date.now()}`,
      leadId: params.leadId,
      schoolId: params.schoolId,
      schoolName: params.schoolName,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + params.durationDays * 86400000).toISOString().slice(0, 10),
      targetTeachersCount: params.targetTeachersCount,
      activatedTeachersCount: 12,
      targetLearnersCount: 500,
      aiCreditAllocation: 10000,
      successCriteria: 'At least 10 teachers create and export 2 papers each',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const list = readLocal<SchoolPilot[]>(PILOTS_KEY, []);
    list.unshift(pilot);
    writeLocal(PILOTS_KEY, list);
    return pilot;
  },
};
