import {
  getTeacherComposerDraft,
  type TeacherComposerDraft,
  type TeacherComposerRouteState,
} from './teacherComposer';

const SESSION_KEY = 'soma_teacher_composer_draft';
const DATABASE_NAME = 'soma_teacher_composer';
const STORE_NAME = 'pending_drafts';
const DRAFT_KEY = 'homepage_teacher_request';
const MAX_AGE_MS = 60 * 60 * 1000;

type StoredTeacherComposerDraft = TeacherComposerDraft & {
  id: typeof DRAFT_KEY;
  savedAt: string;
  consumedAt?: string;
};

export type TeacherComposerDestination = {
  route: '/teacher' | '/marketplace/sell';
  initialTab?: 'CONVERT' | 'LESSON_PLAN_GENERATOR' | 'MARKING' | 'QUIZ';
};

export const getTeacherComposerDestination = (draft: TeacherComposerDraft): TeacherComposerDestination => {
  const destinations: Record<TeacherComposerDraft['intent'], TeacherComposerDestination> = {
    CREATE: { route: '/teacher', initialTab: draft.file ? 'CONVERT' : 'LESSON_PLAN_GENERATOR' },
    MARK: { route: '/teacher', initialTab: 'MARKING' },
    ASSESS: { route: '/teacher', initialTab: 'QUIZ' },
    MARKETPLACE: { route: '/marketplace/sell' },
  };
  return destinations[draft.intent];
};

export const buildTeacherComposerRouteState = (
  draft: TeacherComposerDraft,
): TeacherComposerRouteState => {
  const destination = getTeacherComposerDestination(draft);
  return {
    teacherComposerDraft: draft,
    source: 'homepage_teacher_composer',
    initialTab: destination.initialTab,
  };
};

const openDraftDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const withDraftStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> => {
  const database = await openDraftDatabase();
  if (!database) return null;
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

export const saveTeacherComposerDraft = async (draft: TeacherComposerDraft): Promise<void> => {
  const savedAt = new Date().toISOString();
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      prompt: draft.prompt,
      intent: draft.intent,
      source: draft.source,
      fileName: draft.file?.name || null,
      fileType: draft.file?.type || null,
      fileSize: draft.file?.size || null,
      savedAt,
    }));
  } catch {
    // IndexedDB remains available in many storage-restricted contexts.
  }

  try {
    await withDraftStore('readwrite', (store) => store.put({
      ...draft,
      id: DRAFT_KEY,
      savedAt,
    } satisfies StoredTeacherComposerDraft));
  } catch {
    // Route state and session metadata still preserve the text handoff.
  }
};

export const loadTeacherComposerDraft = async (state: unknown): Promise<TeacherComposerDraft | null> => {
  const isReload = typeof performance !== 'undefined'
    && typeof performance.getEntriesByType === 'function'
    && performance.getEntriesByType('navigation')
      .some((entry) => (entry as PerformanceNavigationTiming).type === 'reload');

  if (state && typeof state === 'object' && 'teacherComposerDraft' in state) {
    return getTeacherComposerDraft(state);
  }

  try {
    const stored = await withDraftStore<StoredTeacherComposerDraft>(
      'readonly',
      (store) => store.get(DRAFT_KEY),
    );
    const savedAt = Date.parse(String(stored?.savedAt || ''));
    if (stored && savedAt && Date.now() - savedAt <= MAX_AGE_MS && (!stored.consumedAt || isReload)) {
      return getTeacherComposerDraft({ teacherComposerDraft: stored });
    }
  } catch {
    // Fall back to the session metadata below.
  }
  return getTeacherComposerDraft(null);
};

export const markTeacherComposerDraftConsumed = async (): Promise<void> => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // The IndexedDB marker still prevents a normal revisit from reopening it.
  }
  try {
    const stored = await withDraftStore<StoredTeacherComposerDraft>(
      'readonly',
      (store) => store.get(DRAFT_KEY),
    );
    if (!stored) return;
    await withDraftStore('readwrite', (store) => store.put({
      ...stored,
      consumedAt: new Date().toISOString(),
    } satisfies StoredTeacherComposerDraft));
  } catch {
    // Expiry is the final fallback when storage is restricted.
  }
};

export const clearPersistedTeacherComposerDraft = async (): Promise<void> => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage restrictions.
  }
  try {
    await withDraftStore('readwrite', (store) => store.delete(DRAFT_KEY));
  } catch {
    // Expiry still prevents old drafts from being restored indefinitely.
  }
};

