import { PrivacyRequest, DataRetentionPolicy, VulnerabilityRecord, ComplianceEvidence } from '../types/platformCore';

const PRIVACY_REQ_KEY = 'soma_privacy_requests';
const RETENTION_KEY = 'soma_data_retention_policies';
const VULN_KEY = 'soma_vulnerability_records';
const COMPLIANCE_KEY = 'soma_compliance_evidence';

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

export const securityPrivacyService = {
  /** Get privacy data requests */
  getPrivacyRequests(): PrivacyRequest[] {
    const list = readLocal<PrivacyRequest[]>(PRIVACY_REQ_KEY, []);
    if (list.length > 0) return list;

    const seed: PrivacyRequest[] = [
      {
        id: 'prv_001',
        userId: 'usr_teacher_99',
        tenantId: 'tenant_school_001',
        requestType: 'export',
        status: 'completed',
        details: 'Teacher requested full export of personal examination drafts and assessment history.',
        submittedAt: '2026-07-21T09:00:00Z',
        completedAt: '2026-07-21T09:30:00Z',
      },
    ];

    writeLocal(PRIVACY_REQ_KEY, seed);
    return seed;
  },

  /** Submit privacy request */
  submitPrivacyRequest(userId: string, requestType: PrivacyRequest['requestType'], details?: string): PrivacyRequest {
    const list = this.getPrivacyRequests();
    const req: PrivacyRequest = {
      id: `prv_${Date.now()}`,
      userId,
      requestType,
      status: 'submitted',
      details,
      submittedAt: new Date().toISOString(),
    };
    list.unshift(req);
    writeLocal(PRIVACY_REQ_KEY, list);
    return req;
  },

  /** Get data retention policies */
  getRetentionPolicies(): DataRetentionPolicy[] {
    const list = readLocal<DataRetentionPolicy[]>(RETENTION_KEY, []);
    if (list.length > 0) return list;

    const seed: DataRetentionPolicy[] = [
      {
        id: 'ret_001',
        dataType: 'learner_assessment_responses',
        retentionDays: 1095, // 3 years
        deletionMethod: 'secure_crypto_shredding',
        legalHoldSupported: true,
        status: 'active',
      },
      {
        id: 'ret_002',
        dataType: 'mpesa_payment_logs',
        retentionDays: 2555, // 7 years statutory financial retention
        deletionMethod: 'archival_storage_then_delete',
        legalHoldSupported: true,
        status: 'active',
      },
    ];

    writeLocal(RETENTION_KEY, seed);
    return seed;
  },

  /** Get vulnerability triage records */
  getVulnerabilities(): VulnerabilityRecord[] {
    const list = readLocal<VulnerabilityRecord[]>(VULN_KEY, []);
    if (list.length > 0) return list;

    const seed: VulnerabilityRecord[] = [
      {
        id: 'vuln_001',
        title: 'NPM Dependency Security Advisory in pdfjs-dist',
        severity: 'low',
        affectedService: 'Paper Reader Canvas',
        status: 'resolved',
        discoveredAt: '2026-07-15T10:00:00Z',
        resolvedAt: '2026-07-16T14:00:00Z',
      },
    ];

    writeLocal(VULN_KEY, seed);
    return seed;
  },

  /** Get compliance evidence records */
  getComplianceEvidence(): ComplianceEvidence[] {
    const list = readLocal<ComplianceEvidence[]>(COMPLIANCE_KEY, []);
    if (list.length > 0) return list;

    const seed: ComplianceEvidence[] = [
      {
        id: 'evd_001',
        title: 'Q3 2026 Automated Database Restore & Disaster Recovery Test',
        category: 'backup_test',
        evidenceUrl: 'https://docs.soma.co.ke/compliance/dr_test_q3_2026.pdf',
        owner: 'Infrastructure Team Lead',
        verifiedAt: '2026-07-23T16:00:00Z',
        notes: 'Full recovery test executed cleanly in 14 minutes. RTO objective met.',
      },
    ];

    writeLocal(COMPLIANCE_KEY, seed);
    return seed;
  },
};
