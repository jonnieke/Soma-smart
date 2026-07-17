import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  LogIn,
  MessageCircle,
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
import { formatStudyNoteForWhatsApp, formatStudyPackForWhatsApp, openWhatsAppShare } from '../../services/whatsappService';

interface LearnerNotebookProps {
  ownerKey: string;
  grade?: string;
  parentPhone?: string;
  isRegistered: boolean;
  onBack: () => void;
  onOpenNote: (note: StudyNote) => void;
  onListenNote: (note: StudyNote) => void;
  onQuizNote: (note: StudyNote) => void;
  onRegister: () => void;
  onNoteSaved?: (note: StudyNote) => void;
  onWhatsAppShare?: (note: StudyNote, destination: 'contact' | 'parent') => void;
  onWhatsAppPackShare?: (notes: StudyNote[], destination: 'contact' | 'parent') => void;
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
  parentPhone,
  isRegistered,
  onBack,
  onOpenNote,
  onListenNote,
  onQuizNote,
  onRegister,
  onNoteSaved,
  onWhatsAppShare,
  onWhatsAppPackShare,
}) => {
  const [notes, setNotes] = React.useState<StudyNote[]>([]);
  const [query, setQuery] = React.useState('');
  const [subject, setSubject] = React.useState('ALL');
  const [showComposer, setShowComposer] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftSubject, setDraftSubject] = React.useState('');
  const [draftContent, setDraftContent] = React.useState('');
  const [selectedNoteIds, setSelectedNoteIds] = React.useState<Set<string>>(new Set());

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

  const shareNoteToWhatsApp = (note: StudyNote, destination: 'contact' | 'parent') => {
    const recipient = destination === 'parent' ? parentPhone : undefined;
    openWhatsAppShare(formatStudyNoteForWhatsApp(note), recipient);
    onWhatsAppShare?.(note, destination);
  };

  const selectedNotes = React.useMemo(
    () => notes.filter(note => selectedNoteIds.has(note.id)).slice(0, 8),
    [notes, selectedNoteIds]
  );

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(current => {
      const next = new Set(current);
      if (next.has(noteId)) next.delete(noteId);
      else if (next.size < 8) next.add(noteId);
      return next;
    });
  };

  const shareStudyPack = (destination: 'contact' | 'parent') => {
    if (selectedNotes.length === 0) return;
    const recipient = destination === 'parent' ? parentPhone : undefined;
    openWhatsAppShare(formatStudyPackForWhatsApp(selectedNotes, grade), recipient);
    onWhatsAppPackShare?.(selectedNotes, destination);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Back to learner dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black">My Notebook</h1>
            <p className="text-xs font-semibold text-slate-500">
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
        <section className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-amber-900">Saved on this device</p>
              <p className="text-xs font-semibold text-amber-800/80">
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
        {notes.length > 0 && (
          <section className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-black text-emerald-950">Share learning, not screenshots</h2>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-emerald-800/80">
                Send a clean study note to a parent or study group. You always choose the recipient and tap Send in WhatsApp.
              </p>
            </div>
          </section>
        )}

        {selectedNotes.length > 0 && (
          <section className="mb-5 flex flex-col gap-3 rounded-xl border border-[#b9e8cb] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900">
                {selectedNotes.length} note{selectedNotes.length === 1 ? '' : 's'} in today&apos;s revision pack
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">Choose up to 8 notes, then send one focused study pack.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedNoteIds(new Set())} className="rounded-lg px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-100">
                Clear
              </button>
              <button type="button" onClick={() => shareStudyPack('contact')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#159447] px-3 py-2 text-xs font-black text-white hover:bg-[#107c3b]">
                <MessageCircle className="h-4 w-4" /> Share revision pack
              </button>
              {parentPhone && (
                <button type="button" onClick={() => shareStudyPack('parent')} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100">
                  Send pack to parent
                </button>
              )}
            </div>
          </section>
        )}

        {showComposer && (
          <section className="mb-6 border-y border-indigo-200 bg-white px-4 py-5 sm:rounded-lg sm:border">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-black">Write a study note</h2>
                <p className="text-xs font-semibold text-slate-500">Keep it short enough to revise again.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
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
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
              <input
                value={draftSubject}
                onChange={event => setDraftSubject(event.target.value)}
                placeholder="Subject, e.g. Biology"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <textarea
              value={draftContent}
              onChange={event => setDraftContent(event.target.value)}
              placeholder="Write the key idea, example, or correction you want to remember..."
              rows={6}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-relaxed outline-none focus:border-indigo-500"
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
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
            />
          </label>
          <select
            value={subject}
            onChange={event => setSubject(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-indigo-500"
          >
            <option value="ALL">All subjects</option>
            {subjects.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </section>

        {filteredNotes.length === 0 ? (
          <section className="py-14 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-indigo-500" />
            </div>
            <h2 className="text-lg font-black">My Notebook</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-slate-500 leading-relaxed">
              Your personal study notebook. Save smart explanations from Ask Akili, or write your own notes — then listen back or quiz yourself on any note.
            </p>
            <div className="mx-auto mt-5 max-w-xs space-y-2 text-left">
              <div className="flex items-start gap-3 rounded-xl bg-white border border-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600">
                <span className="text-base shrink-0">💬</span>
                <span>Ask Akili a question → tap <strong>Save to Notebook</strong> on any answer</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white border border-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600">
                <span className="text-base shrink-0">✏️</span>
                <span>Or tap <strong>+ New Note</strong> above to write your own revision note</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white border border-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600">
                <span className="text-base shrink-0">🎧</span>
                <span>Each note can be <strong>listened to</strong> or turned into a <strong>quick quiz</strong></span>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-3 md:grid-cols-2">
            {filteredNotes.map(note => (
              <article
                key={note.id}
                className={'rounded-lg border bg-white p-4 shadow-sm ' + (selectedNoteIds.has(note.id) ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
                    onClick={() => toggleNoteSelection(note.id)}
                    className={'inline-flex h-8 items-center justify-center rounded-lg px-2 text-[10px] font-black transition ' + (selectedNoteIds.has(note.id) ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700')}
                    aria-pressed={selectedNoteIds.has(note.id)}
                    aria-label={(selectedNoteIds.has(note.id) ? 'Remove ' : 'Add ') + note.title + ' from revision pack'}
                  >
                    {selectedNoteIds.has(note.id) ? 'Selected' : 'Select'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStudyNote(ownerKey, note.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={'Delete ' + note.title}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 line-clamp-4 text-sm font-medium leading-relaxed text-slate-600">
                  {note.content}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenNote(note)}
                    className="rounded-lg bg-slate-100 px-2 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-200"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => onListenNote(note)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-50 px-2 py-2 text-[11px] font-black text-indigo-700 hover:bg-indigo-100"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Listen
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuizNote(note)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2 py-2 text-[11px] font-black text-emerald-700 hover:bg-emerald-100"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Test me
                  </button>
                </div>

                <div className={'mt-2 grid gap-2 ' + (parentPhone ? 'grid-cols-2' : 'grid-cols-1')}>
                  <button
                    type="button"
                    onClick={() => shareNoteToWhatsApp(note, 'contact')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#e9f9ef] px-3 py-2.5 text-[11px] font-black text-[#087a3e] transition hover:bg-[#d8f4e3]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Share on WhatsApp
                  </button>
                  {parentPhone && (
                    <button
                      type="button"
                      onClick={() => shareNoteToWhatsApp(note, 'parent')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-[11px] font-black text-[#087a3e] transition hover:bg-emerald-50"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send to parent
                    </button>
                  )}
                </div>

                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setMastery(note, 'understood')}
                    className={'inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-black ' + (
                      note.masteryStatus === 'understood'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
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
                        : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
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
