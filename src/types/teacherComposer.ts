export type TeacherComposerIntent = 'CREATE' | 'MARK' | 'ASSESS' | 'MARKETPLACE';

export type TeacherComposerDraft = {
  prompt: string;
  intent: TeacherComposerIntent;
  file?: File;
  source: 'TEXT' | 'VOICE' | 'SCAN' | 'UPLOAD';
};

export type TeacherComposerRouteState = {
  teacherComposerDraft?: TeacherComposerDraft;
  source?: 'homepage_teacher_composer';
  initialTab?: string;
};

const isDraft = (value: unknown): value is TeacherComposerDraft => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TeacherComposerDraft>;
  return typeof candidate.prompt === 'string'
    && ['CREATE', 'MARK', 'ASSESS', 'MARKETPLACE'].includes(String(candidate.intent))
    && ['TEXT', 'VOICE', 'SCAN', 'UPLOAD'].includes(String(candidate.source));
};

export const getTeacherComposerDraft = (state: unknown): TeacherComposerDraft | null => {
  if (state && typeof state === 'object') {
    const routeDraft = (state as TeacherComposerRouteState).teacherComposerDraft;
    if (isDraft(routeDraft)) return routeDraft;
  }

  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(sessionStorage.getItem('soma_teacher_composer_draft') || 'null');
    const savedAt = Date.parse(String(stored?.savedAt || ''));
    if (!isDraft(stored) || !savedAt || Date.now() - savedAt > 60 * 60 * 1000) return null;
    return stored;
  } catch {
    return null;
  }
};

export const clearStoredTeacherComposerDraft = () => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('soma_teacher_composer_draft');
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
};
