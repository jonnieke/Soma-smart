import { supabase } from '../lib/supabase';
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

interface NotebookRow {
  id: string;
  owner_id: string;
  student_code: string | null;
  title: string;
  content: string;
  subject: string;
  grade: string;
  topic: string | null;
  source: StudyNoteSource;
  mastery_status: StudyNoteMasteryStatus;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
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

const normalizeNotebookRow = (row: NotebookRow): StudyNote => ({
  id: row.id,
  userId: row.owner_id,
  studentCode: row.student_code || undefined,
  title: row.title,
  content: row.content,
  subject: row.subject || 'General',
  grade: row.grade || '',
  topic: row.topic || row.title,
  source: row.source,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  masteryStatus: row.mastery_status,
  audioUrl: row.audio_url || undefined,
});

const toNotebookRow = (note: StudyNote, ownerId: string): NotebookRow => ({
  id: note.id,
  owner_id: ownerId,
  student_code: note.studentCode || null,
  title: note.title,
  content: note.content,
  subject: note.subject || 'General',
  grade: note.grade || '',
  topic: note.topic || note.title,
  source: note.source,
  mastery_status: note.masteryStatus,
  audio_url: note.audioUrl || null,
  created_at: note.createdAt,
  updated_at: note.updatedAt,
});

const mergeNotes = (current: StudyNote[], incoming: StudyNote[]) => {
  const merged = new Map<string, StudyNote>();
  for (const note of [...current, ...incoming]) {
    const existing = merged.get(note.id);
    if (!existing || new Date(note.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      merged.set(note.id, note);
    }
  }
  return [...merged.values()].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

const persistCloudNotes = async (notes: StudyNote[], userId?: string | null) => {
  const ownerId = userId || (await supabase.auth.getSession()).data.session?.user?.id || null;
  if (!ownerId || notes.length === 0) return;

  const payload = notes.map(note => toNotebookRow(note, ownerId));
  const { error } = await supabase.from('study_notes').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.warn('Notebook cloud sync failed:', error);
  }
};

const deleteCloudNote = async (noteId: string, userId?: string | null) => {
  const ownerId = userId || (await supabase.auth.getSession()).data.session?.user?.id || null;
  if (!ownerId) return;
  const { error } = await supabase.from('study_notes').delete().eq('id', noteId).eq('owner_id', ownerId);
  if (error) console.warn('Notebook cloud delete failed:', error);
};

const syncCloudNotebookIntoLocal = async (ownerKey: string, userId?: string | null) => {
  const ownerId = userId || (await supabase.auth.getSession()).data.session?.user?.id || null;
  if (!ownerId) return loadStudyNotes(ownerKey);

  const { data, error } = await supabase
    .from('study_notes')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('Notebook cloud load failed:', error);
    return loadStudyNotes(ownerKey);
  }

  const cloudNotes = (data || []).map(row => normalizeNotebookRow(row as NotebookRow));
  const store = readStore();
  const merged = mergeNotes(store[ownerKey] || [], cloudNotes);
  store[ownerKey] = merged;
  writeStore(store);
  return merged;
};

export const loadStudyNotes = (ownerKey: string): StudyNote[] => {
  const store = readStore();
  return [...(store[ownerKey] || [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const syncNotebookFromCloud = async (ownerKey: string, userId?: string | null) =>
  syncCloudNotebookIntoLocal(ownerKey, userId);

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
  void persistCloudNotes([note], input.userId || undefined);
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

  const updated = {
    ...notes[index],
    masteryStatus,
    updatedAt: new Date().toISOString(),
  };

  notes[index] = updated;
  store[ownerKey] = notes;
  writeStore(store);
  void persistCloudNotes([updated], updated.userId || undefined);
  return updated;
};

export const deleteStudyNote = (ownerKey: string, noteId: string) => {
  const store = readStore();
  const nextNotes = (store[ownerKey] || []).filter(note => note.id !== noteId);
  const deleted = (store[ownerKey] || []).find(note => note.id === noteId);
  store[ownerKey] = nextNotes;
  writeStore(store);
  void deleteCloudNote(noteId, deleted?.userId || undefined);
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
