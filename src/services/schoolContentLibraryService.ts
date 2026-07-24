import { ContentRequest, ContentRights } from '../types/contentOS';

const REQUESTS_KEY = 'soma_content_requests';
const RIGHTS_KEY = 'soma_content_rights';

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

export const schoolContentLibraryService = {
  /** Get resource requests from teachers */
  getContentRequests(schoolId = 'school_001'): ContentRequest[] {
    const list = readLocal<ContentRequest[]>(REQUESTS_KEY, []);
    if (list.length > 0) return list;

    const seed: ContentRequest[] = [
      {
        id: 'req_001',
        teacherId: 'teacher_kamau',
        teacherName: 'Mwalimu Kamau',
        schoolId,
        grade: 'Form 4',
        subject: 'Integrated Science',
        curriculumOutcome: 'Photosynthesis Light Phase Experiment',
        resourceType: 'practical',
        description: 'Need a safe, low-cost practical lab guide using local aquatic plants (Elodea/Hydrilla).',
        urgency: 'high',
        status: 'open',
        createdAt: '2026-07-21T11:00:00Z',
      },
    ];

    writeLocal(REQUESTS_KEY, seed);
    return seed;
  },

  /** Submit a new content request */
  createContentRequest(params: {
    teacherId: string;
    teacherName: string;
    grade: string;
    subject: string;
    curriculumOutcome: string;
    description: string;
  }): ContentRequest {
    const req: ContentRequest = {
      id: `req_${Date.now()}`,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      grade: params.grade,
      subject: params.subject,
      curriculumOutcome: params.curriculumOutcome,
      resourceType: 'worksheet',
      description: params.description,
      urgency: 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const list = readLocal<ContentRequest[]>(REQUESTS_KEY, []);
    list.unshift(req);
    writeLocal(REQUESTS_KEY, list);
    return req;
  },

  /** Check server-side content rights for viewing/editing */
  validateContentRights(
    rightsId: string,
    userType: 'teacher' | 'school' | 'publisher',
    userId: string,
  ): { canView: boolean; canEdit: boolean; canExport: boolean } {
    const rights = readLocal<ContentRights[]>(RIGHTS_KEY, []);
    const record = rights.find((r) => r.id === rightsId);

    if (!record) {
      return { canView: true, canEdit: true, canExport: true }; // Default allow for local drafts
    }

    if (record.licenceType === 'private_use') {
      const isOwner = record.ownerId === userId;
      return { canView: isOwner, canEdit: isOwner, canExport: isOwner };
    }

    return { canView: true, canEdit: record.ownerId === userId, canExport: true };
  },
};
