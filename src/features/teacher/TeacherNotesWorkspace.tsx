import React, { useEffect, useRef, useState } from 'react';
import { MarkdownText } from '../../components/Shared';
import type { TeacherComposerDraft } from '../../types/teacherComposer';
import { generateTeacherNotes, type NotesAction, type NotesResult } from './teacherNotesGeneration';

type Resource = { notes: string; complete: boolean; questions?: string; answers?: string };
const pending = new Map<string, Promise<NotesResult>>();
export function teacherNotesKey(owner: string, draft: TeacherComposerDraft) {
  let hash = 0;
  for (const char of draft.generatedContent || '') hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return `soma_teacher_notes_v1:${owner}:${encodeURIComponent(draft.prompt)}:${hash}`;
}

export function TeacherNotesWorkspace({ owner, draft, grade, subject, onSave }: {
  owner: string; draft: TeacherComposerDraft; grade?: string; subject?: string; onSave: (notes: string) => void;
}) {
  const storageKey = teacherNotesKey(owner, draft);
  const [resource, setResource] = useState<Resource>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (typeof saved?.notes === 'string' && typeof saved.complete === 'boolean') return saved;
    } catch { /* Show the original preview if browser storage is unavailable. */ }
    return { notes: draft.generatedContent || '', complete: false };
  });
  const [busy, setBusy] = useState<NotesAction | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [instruction, setInstruction] = useState('');
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<'notes' | 'questions' | 'answers'>('notes');
  const lock = useRef(false);
  const mounted = useRef(true);
  const started = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const storeResource = (next: Resource) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { if (mounted.current) setMessage('Browser saving is unavailable. Copy your work or save it to your library.'); }
    if (mounted.current) setResource(next);
  };
  const run = async (action: NotesAction) => {
    if (lock.current || (action === 'followup' && !instruction.trim())) return;
    lock.current = true;
    setBusy(action); setError(''); setMessage('');
    const before = resource;
    try {
      // Share the initial request across remounts so login/render transitions do not generate twice.
      let job = action === 'complete' ? pending.get(storageKey) : undefined;
      if (!job) {
        job = generateTeacherNotes({ action, prompt: draft.prompt, notes: before.notes, grade, subject, instruction });
        if (action === 'complete') pending.set(storageKey, job);
      }
      const result = await job;
      if (action === 'quiz') {
        storeResource({ ...before, questions: result.questions, answers: result.answers });
        if (mounted.current) setTab('questions');
      } else {
        storeResource({ ...before, complete: true, notes: action === 'complete' ? result.notes! : `${before.notes}\n\n${result.notes}` });
        if (mounted.current) { setTab('notes'); setInstruction(''); }
      }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Could not generate the material. Your existing notes are safe; please try again.');
    } finally {
      if (action === 'complete') pending.delete(storageKey);
      lock.current = false;
      if (mounted.current) setBusy(null);
    }
  };
  useEffect(() => {
    if (started.current || resource.complete) return;
    started.current = true;
    void run('complete');
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab === 'notes' ? resource.notes : tab === 'questions' ? resource.questions || '' : resource.answers || '');
      setMessage('Copied.');
    } catch { setError('Copy was unavailable. Use Edit notes to select and copy the text.'); }
  };
  const buttonClass = 'min-h-11 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50 disabled:opacity-50';
  return <section aria-label="Your teaching notes workspace" className="mb-8 overflow-hidden rounded-3xl border border-indigo-200 bg-white shadow-sm">
    <header className="border-b border-indigo-100 bg-indigo-50 p-5 sm:p-7">
      <h2 id="homepage-teacher-draft-heading" className="scroll-mt-24 text-2xl font-black text-slate-900">Your notes and practice</h2>
      <p className="mt-2 text-sm text-slate-700"><strong>Your request:</strong> {draft.prompt}</p>
      <p className="mt-2 text-sm text-slate-600">Develop your notes, add examples and prepare a quiz for the same topic.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={buttonClass} disabled={!!busy} onClick={() => { setEditing(false); void run(resource.complete ? 'expand' : 'complete'); }}>{resource.complete ? 'Expand notes' : 'Generate full notes'}</button>
        <button className={buttonClass} disabled={!!busy} onClick={() => { setEditing(false); void run('quiz'); }}>Create quiz</button>
        <button className={buttonClass} disabled={!!busy} onClick={() => { setTab('notes'); setEditing(!editing); }}>{editing ? 'Read notes' : 'Edit notes'}</button>
        <button className={buttonClass} onClick={() => { void copy(); }}>Copy {tab === 'notes' ? 'notes' : tab === 'questions' ? 'questions' : 'answer key'}</button>
        <button className={buttonClass} disabled={!!busy} onClick={() => { onSave(resource.notes); setMessage('Notes added to your library.'); }}>Save to library</button>
      </div>
    </header>
    {busy && <p role="status" className="bg-indigo-50 px-5 py-3 text-sm text-indigo-800">{busy === 'quiz' ? 'Creating questions and a separate marking guide…' : busy === 'complete' ? 'Developing your full notes. Your preview stays below while Soma works…' : 'Adding more depth to your notes…'}</p>}
    {error && <p role="alert" className="px-5 py-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="px-5 py-3 text-sm text-indigo-700">{message}</p>}
    {resource.questions && <div className="flex flex-wrap gap-2 border-b p-4" aria-label="Choose material">
      {(['notes', 'questions', 'answers'] as const).map(value => <button key={value} aria-pressed={tab === value} className={buttonClass} onClick={() => setTab(value)}>{value === 'notes' ? 'Notes' : value === 'questions' ? 'Quiz questions' : 'Answer key & marks'}</button>)}
    </div>}
    <div className="p-5 sm:p-8">
      {tab === 'notes' && editing ? <textarea aria-label="Edit full notes" disabled={!!busy} rows={24} value={resource.notes} onChange={event => storeResource({ ...resource, notes: event.target.value })} className="w-full rounded-xl border p-4 text-base leading-7" />
        : <div className="mx-auto max-w-4xl leading-7 text-slate-800 [&_h1]:mb-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2"><MarkdownText content={tab === 'notes' ? resource.notes : tab === 'questions' ? resource.questions || '' : resource.answers || ''} /></div>}
    </div>
    <form className="border-t bg-slate-50 p-5" onSubmit={event => { event.preventDefault(); setEditing(false); void run('followup'); }}>
      <label htmlFor="teacher-notes-followup" className="block text-sm font-bold text-slate-800">What would you like to add?</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input id="teacher-notes-followup" value={instruction} onChange={event => setInstruction(event.target.value)} disabled={!!busy} placeholder="For example: Add Kenyan examples and explain prevention in more detail" className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm" />
        <button className={buttonClass} disabled={!!busy || !instruction.trim()}>Add to notes</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Changes stay in this browser. Save to your library to keep the notes with your teaching resources.</p>
    </form>
  </section>;
}
