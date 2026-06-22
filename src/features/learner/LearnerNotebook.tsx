import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  LogIn,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { StudyNote, StudyNoteMasteryStatus } from '../../types';
import {
  NOTEBOOK_CHANGED_EVENT,
  deleteStudyNote,
  loadStudyNotes,
  saveStudyNote,
  updateStudyNoteMastery,
} from '../../services/notebookService';

interface LearnerNotebookProps {
  ownerKey: string;
  grade?: string;
  isRegistered: boolean;
  onBack: () => void;
  onOpenNote: (note: StudyNote) => void;
  onListenNote: (note: StudyNote) => void;
  onQuizNote: (note: StudyNote) => void;
  onRegister: () => void;
  onNoteSaved?: (note: StudyNote) => void;
}

const masteryCopy: Record<StudyNoteMasteryStatus, string> = {
  new: 'New',
  learning: 'Learning',
  understood: 'Understood',
  revise_again: 'Revise again',
};

export const LearnerNotebook: React.FC<LearnerNotebookProps> = ({
  ownerKey,
  grade,
  isRegistered,
  onBack,
  onOpenNote,
  onListenNote,
  onQuizNote,
  onRegister,
  onNoteSaved,
}) => {
  const [notes, setNotes] = React.useState<StudyNote[]>([]);
  const [query, setQuery] = React.useState('');
  const [subject, setSubject] = React.useState('ALL');
  const [showComposer, setShowComposer] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftSubject, setDraftSubject] = React.useState('');
  const [draftContent, setDraftContent] = React.useState('');

  const refresh = React.useCallback(() => {
    setNotes(loadStudyNotes(ownerKey));
  }, [ownerKey]);

  React.useEffect(() => {
    refresh();
    window.addEventListener(NOTEBOOK_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(NOTEBOOK_CHANGED_EVENT, refresh);
  }, [refresh]);

  const subjects = React.useMemo(
    () => [...new Set(notes.map(note => note.subject).filter(Boolean))].sort(),
    [notes]
  );

  const filteredNotes = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return notes.filter(note => {
      const matchesSubject = subject === 'ALL' || note.subject === subject;
      const matchesQuery = !normalizedQuery || [
        note.title,
        note.topic,
        note.subject,
        note.content,
      ].some(value => String(value || '').toLowerCase().includes(normalizedQuery));
      return matchesSubject && matchesQuery;
    });
  }, [notes, query, subject]);

  const handleSaveManualNote = () => {
    if (!draftTitle.trim() || !draftContent.trim()) return;
    const note = saveStudyNote(ownerKey, {
      title: draftTitle,
      content: draftContent,
      subject: draftSubject || 'General',
      grade,
      source: 'manual',
      masteryStatus: 'new',
    });
    setDraftTitle('');
    setDraftSubject('');
    setDraftContent('');
    setShowComposer(false);
    onNoteSaved?.(note);
  };

  const setMastery = (note: StudyNote, masteryStatus: StudyNoteMasteryStatus) => {
    updateStudyNoteMastery(ownerKey, note.id, masteryStatus);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Back to learner dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black">My Notebook</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Save it, listen to it, then test yourself.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add note
          </button>
        </div>
      </header>

      {!isRegistered && (
        <section className="border-b border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-amber-900 dark:text-amber-100">Saved on this device</p>
              <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-200/80">
                Register when you are ready to protect your Notebook and learning progress.
              </p>
            </div>
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700"
            >
              <LogIn className="h-4 w-4" />
              Protect my progress
            </button>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {showComposer && (
          <section className="mb-6 border-y border-indigo-200 bg-white px-4 py-5 dark:border-indigo-900 dark:bg-slate-900 sm:rounded-lg sm:border">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-black">Write a study note</h2>
                <p className="text-xs font-semibold text-slate-500">Keep it short enough to revise again.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close note editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={draftTitle}
                onChange={event => setDraftTitle(event.target.value)}
                placeholder="Note title"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
              />
              <input
                value={draftSubject}
                onChange={event => setDraftSubject(event.target.value)}
                placeholder="Subject, e.g. Biology"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <textarea
              value={draftContent}
              onChange={event => setDraftContent(event.target.value)}
              placeholder="Write the key idea, example, or correction you want to remember..."
              rows={6}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={handleSaveManualNote}
              disabled={!draftTitle.trim() || !draftContent.trim()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BookOpen className="h-4 w-4" />
              Save note
            </button>
          </section>
        )}

        <section className="mb-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search notes or topics"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <select
            value={subject}
            onChange={event => setSubject(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="ALL">All subjects</option>
            {subjects.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </section>

        {filteredNotes.length === 0 ? (
          <section className="py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-indigo-400" />
            <h2 className="mt-4 text-lg font-black">Your Notebook is ready</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-slate-500 dark:text-slate-400">
              Save an Ask Akili explanation or write one short note. Then listen or test yourself.
            </p>
          </section>
        ) : (
          <section className="grid gap-3 md:grid-cols-2">
            {filteredNotes.map(note => (
              <article
                key={note.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{note.title}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">
                      {note.subject}{note.grade ? ' / ' + note.grade : ''} / {masteryCopy[note.masteryStatus]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteStudyNote(ownerKey, note.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                    aria-label={'Delete ' + note.title}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 line-clamp-4 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  {note.content}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenNote(note)}
                    className="rounded-lg bg-slate-100 px-2 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => onListenNote(note)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-50 px-2 py-2 text-[11px] font-black text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Listen
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuizNote(note)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2 py-2 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Test me
                  </button>
                </div>

                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMastery(note, 'understood')}
                    className={'inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-black ' + (
                      note.masteryStatus === 'understood'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-950 dark:text-slate-300'
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    I understand
                  </button>
                  <button
                    type="button"
                    onClick={() => setMastery(note, 'revise_again')}
                    className={'inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-black ' + (
                      note.masteryStatus === 'revise_again'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 dark:bg-slate-950 dark:text-slate-300'
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Revise again
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};