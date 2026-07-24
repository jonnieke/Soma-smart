import { PlatformIncident, IncidentSeverity, IncidentStatus } from '../types/platformCore';

const INCIDENTS_KEY = 'soma_platform_incidents';

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

export const incidentManagementService = {
  /** Get incidents list */
  getIncidents(): PlatformIncident[] {
    const list = readLocal<PlatformIncident[]>(INCIDENTS_KEY, []);
    if (list.length > 0) return list;

    const seed: PlatformIncident[] = [
      {
        id: 'inc_001',
        title: 'M-Pesa Callback Delays during Peak School Registration',
        severity: 'sev2',
        status: 'resolved',
        serviceIds: ['srv_payments_003'],
        startedAt: '2026-07-20T08:00:00Z',
        detectedAt: '2026-07-20T08:05:00Z',
        resolvedAt: '2026-07-20T08:35:00Z',
        commanderId: 'usr_eng_lead',
        customerImpact: 'Delayed subscription activation for 12 school purchases by up to 30 minutes.',
        internalSummary: 'Safarikom Daraja API webhook rate limit hit due to high concurrent callbacks.',
        rootCause: 'Daraja webhook retry queue backed up; increased concurrency limits and added deduplication buffer.',
        mitigation: 'Processed queued callbacks manually and expanded webhook queue worker instances.',
        followUpActionIds: ['act_001', 'act_002'],
        createdAt: '2026-07-20T08:05:00Z',
        updatedAt: '2026-07-20T09:00:00Z',
      },
    ];

    writeLocal(INCIDENTS_KEY, seed);
    return seed;
  },

  /** Create a new platform incident */
  createIncident(input: {
    title: string;
    severity: IncidentSeverity;
    serviceIds: string[];
    customerImpact: string;
    internalSummary?: string;
  }): PlatformIncident {
    const incidents = this.getIncidents();
    const newInc: PlatformIncident = {
      id: `inc_${Date.now()}`,
      title: input.title,
      severity: input.severity,
      status: 'detected',
      serviceIds: input.serviceIds,
      startedAt: new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      customerImpact: input.customerImpact,
      internalSummary: input.internalSummary,
      followUpActionIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    incidents.unshift(newInc);
    writeLocal(INCIDENTS_KEY, incidents);
    return newInc;
  },

  /** Update incident status */
  updateIncidentStatus(incidentId: string, status: IncidentStatus, mitigation?: string): PlatformIncident | null {
    const list = this.getIncidents();
    const idx = list.findIndex((i) => i.id === incidentId);
    if (idx === -1) return null;

    list[idx].status = status;
    if (mitigation) list[idx].mitigation = mitigation;
    if (status === 'resolved' || status === 'closed') {
      list[idx].resolvedAt = new Date().toISOString();
    }
    list[idx].updatedAt = new Date().toISOString();

    writeLocal(INCIDENTS_KEY, list);
    return list[idx];
  },
};
