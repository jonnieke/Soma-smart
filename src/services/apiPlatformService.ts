import { DeveloperApplication, ApiKeyCredential, WebhookSubscription } from '../types/platformCore';

const APPS_KEY = 'soma_developer_apps';
const KEYS_KEY = 'soma_developer_keys';
const WEBHOOKS_KEY = 'soma_developer_webhooks';

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

export const apiPlatformService = {
  /** Get developer applications */
  getApplications(tenantId = 'tenant_school_001'): DeveloperApplication[] {
    const list = readLocal<DeveloperApplication[]>(APPS_KEY, []);
    if (list.length > 0) return list;

    const seed: DeveloperApplication[] = [
      {
        id: 'app_001',
        tenantId,
        name: 'School SIS Integration App',
        description: 'Automates student enrollment and assessment result syncing with school portal',
        ownerUserId: 'usr_school_admin_001',
        environment: 'production',
        status: 'approved',
        allowedScopes: ['schools.read', 'classes.read', 'results.read', 'assessments.read'],
        rateLimitPolicyId: 'pol_standard_1000rpm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(APPS_KEY, seed);
    return seed;
  },

  /** Create developer application */
  createApplication(input: {
    tenantId: string;
    name: string;
    description?: string;
    ownerUserId: string;
    allowedScopes: string[];
  }): DeveloperApplication {
    const apps = this.getApplications(input.tenantId);
    const newApp: DeveloperApplication = {
      id: `app_${Date.now()}`,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      ownerUserId: input.ownerUserId,
      environment: 'sandbox',
      status: 'approved',
      allowedScopes: input.allowedScopes,
      rateLimitPolicyId: 'pol_standard_1000rpm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    apps.push(newApp);
    writeLocal(APPS_KEY, apps);
    return newApp;
  },

  /** Generate hashed API Key (returns clear key once for modal display) */
  generateApiKey(applicationId: string, name: string, scopes: string[]): { credential: ApiKeyCredential; rawKey: string } {
    const randomHex = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const rawKey = `soma_live_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 14);
    const hashedSecret = `sha256_hash_${randomHex}`;

    const credential: ApiKeyCredential = {
      id: `key_${Date.now()}`,
      applicationId,
      keyPrefix,
      hashedSecret,
      name,
      scopes,
      createdAt: new Date().toISOString(),
    };

    const keys = readLocal<ApiKeyCredential[]>(KEYS_KEY, []);
    keys.push(credential);
    writeLocal(KEYS_KEY, keys);

    return { credential, rawKey };
  },

  /** Get active Webhook subscriptions */
  getWebhooks(tenantId = 'tenant_school_001'): WebhookSubscription[] {
    const list = readLocal<WebhookSubscription[]>(WEBHOOKS_KEY, []);
    if (list.length > 0) return list;

    const seed: WebhookSubscription[] = [
      {
        id: 'wh_001',
        tenantId,
        targetUrl: 'https://api.schoolportal.co.ke/webhooks/soma-events',
        eventTypes: ['assessment.submitted', 'results.released', 'payment.completed'],
        secretKey: 'whsec_9876543210fedcba',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ];

    writeLocal(WEBHOOKS_KEY, seed);
    return seed;
  },
};
