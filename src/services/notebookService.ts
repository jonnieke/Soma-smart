import { StudyNote, StudyNoteMasteryStatus, StudyNoteSource } from '../types';

const STORAGE_KEY = 'soma_study_notebook_v1';
export const NOTEBOOK_CHANGED_EVENT = 'soma-notebook-changed';

type NotebookStore = Record<string, StudyNote[]>;

export interface SaveStudyNoteInput {
  title: string;
  content: string;
  subject?: string;
  grade?: string;
  topic?: string;
  source?: StudyNoteSource;
  masteryStatus?: StudyNoteMasteryStatus;
  userId?: string;
  studentCode?: string;
}

const readStore = (): NotebookStore => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = (store: NotebookStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(NOTEBOOK_CHANGED_EVENT));
};

export const getNotebookOwnerKey = (studentCode?: string | null, userId?: string | null) =>
  studentCode || userId || 'guest';

export const loadStudyNotes = (ownerKey: string): StudyNote[] => {
  const store = readStore();
  return [...(store[ownerKey] || [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const saveStudyNote = (ownerKey: string, input: SaveStudyNoteInput): StudyNote => {
  const store = readStore();
  const notes = store[ownerKey] || [];
  const now = new Date().toISOString();
  const normalizedTitle = input.title.trim().toLowerCase();
  const existingIndex = notes.findIndex(note =>
    note.title.trim().toLowerCase() === normalizedTitle &&
    note.source === (input.source || 'manual')
  );

  const note: StudyNote = {
    id: existingIndex >= 0 ? notes[existingIndex].id : crypto.randomUUID(),
    userId: input.userId,
    studentCode: input.studentCode,
    title: input.title.trim(),
    content: input.content.trim(),
    subject: input.subject?.trim() || 'General',
    grade: input.grade?.trim() || '',
    topic: input.topic?.trim() || input.title.trim(),
    source: input.source || 'manual',
    createdAt: existingIndex >= 0 ? notes[existingIndex].createdAt : now,
    updatedAt: now,
    masteryStatus: input.masteryStatus || notes[existingIndex]?.masteryStatus || 'new',
    audioUrl: notes[existingIndex]?.audioUrl,
  };

  if (existingIndex >= 0) notes[existingIndex] = note;
  else notes.unshift(note);

  store[ownerKey] = notes;
  writeStore(store);
  return note;
};

export const updateStudyNoteMastery = (
  ownerKey: string,
  noteId: string,
  masteryStatus: StudyNoteMasteryStatus
): StudyNote | null => {
  const store = readStore();
  const notes = store[ownerKey] || [];
  const index = notes.findIndex(note => note.id === noteId);
  if (index < 0) return null;

  notes[index] = {
    ...notes[index],
    masteryStatus,
    updatedAt: new Date().toISOString(),
  };
  store[ownerKey] = notes;
  writeStore(store);
  return notes[index];
};

export const deleteStudyNote = (ownerKey: string, noteId: string) => {
  const store = readStore();
  store[ownerKey] = (store[ownerKey] || []).filter(note => note.id !== noteId);
  writeStore(store);
};

export const migrateGuestNotebook = (targetOwnerKey: string) => {
  if (targetOwnerKey === 'guest') return 0;
  const store = readStore();
  const guestNotes = store.guest || [];
  if (guestNotes.length === 0) return 0;

  const existing = store[targetOwnerKey] || [];
  const existingKeys = new Set(existing.map(note => note.title.trim().toLowerCase()));
  const migrated = guestNotes
    .filter(note => !existingKeys.has(note.title.trim().toLowerCase()))
    .map(note => ({ ...note, updatedAt: new Date().toISOString() }));

  store[targetOwnerKey] = [...migrated, ...existing];
  delete store.guest;
  writeStore(store);
  return migrated.length;
};