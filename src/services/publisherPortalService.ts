import { PublisherProfile } from '../types/contentOS';

const PUBLISHERS_KEY = 'soma_publisher_profiles';

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

export const publisherPortalService = {
  /** Get registered publisher profiles */
  getPublishers(): PublisherProfile[] {
    const list = readLocal<PublisherProfile[]>(PUBLISHERS_KEY, []);
    if (list.length > 0) return list;

    const seed: PublisherProfile[] = [
      {
        id: 'pub_klb_kenya',
        name: 'Kenya Literature Bureau (KLB)',
        contactEmail: 'licensing@klb.co.ke',
        country: 'Kenya',
        status: 'verified',
        submittedCataloguesCount: 12,
        createdAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'pub_longhorn',
        name: 'Longhorn Publishers PLC',
        contactEmail: 'digital@longhornpublishers.com',
        country: 'Kenya',
        status: 'verified',
        submittedCataloguesCount: 8,
        createdAt: '2026-03-01T00:00:00Z',
      },
    ];

    writeLocal(PUBLISHERS_KEY, seed);
    return seed;
  },

  /** Submit a publisher application */
  registerPublisher(name: string, email: string): PublisherProfile {
    const pub: PublisherProfile = {
      id: `pub_${Date.now()}`,
      name,
      contactEmail: email,
      country: 'Kenya',
      status: 'pending_verification',
      submittedCataloguesCount: 0,
      createdAt: new Date().toISOString(),
    };

    const list = readLocal<PublisherProfile[]>(PUBLISHERS_KEY, []);
    list.unshift(pub);
    writeLocal(PUBLISHERS_KEY, list);
    return pub;
  },
};
