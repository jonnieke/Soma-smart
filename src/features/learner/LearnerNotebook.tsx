import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
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
  syncNotebookFromCloud,
  updateStudyNoteMastery,
} from '../../services/notebookService';
import { formatStudyNoteForWhatsApp, formatStudyPackForWhatsApp, openWhatsAppShare } from '../../services/whatsappService';
import { NotebookAudioPlayer } from '../../components/NotebookAudioPlayer';

interface LearnerNotebookProps {
  ownerKey: string;
  grade?: string;
  parentPhone?: string;
  isRegistered: boolean;
  userId?: string;
  onBack: () => void;
  onOpenNote: (note: StudyNote) => void;
  onListenNote: (note: StudyNote) => void;
  onQuizNote: (note: StudyNote) => void;
  onAskAkili?: (note: StudyNote) => void;
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
  userId,
  onBack,
  onListenNote,
  onQuizNote,
  onAskAkili,
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
  const [activeAudioNote, setActiveAudioNote] = React.useState<StudyNote | null>(null);
  const [expandedNoteId, setExpandedNoteId] = React.useState<string | null>(null);
  const [saveMessage, setSaveMessage] = React.useState('');
  const editorRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showComposer) editorRef.current?.focus();
  }, [showComposer]);

  const refresh = React.useCallback(() => {
    setNotes(loadStudyNotes(ownerKey));
  }, [ownerKey]);

  React.useEffect(() => {
    let active = true;
    refresh();
    void syncNotebookFromCloud(ownerKey, userId).then(() => { if (active) refresh(); }).catch(() => { if (active) refresh(); });
    window.addEventListener(NOTEBOOK_CHANGED_EVENT, refresh);
    return () => { active = false; window.removeEventListener(NOTEBOOK_CHANGED_EVENT, refresh); };
  }, [refresh, ownerKey, userId]);

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
    const existing = notes.find(note => note.source === 'manual' && note.title.trim().toLowerCase() === draftTitle.trim().toLowerCase());
    if (existing && !window.confirm(`A note called "${existing.title}" already exists. Replace its contents?`)) return;
    const note = saveStudyNote(ownerKey, {
      title: draftTitle,
      content: draftContent,
      subject: draftSubject || 'General',
      grade,
      source: 'manual',
      masteryStatus: 'new',
      userId,
    });
    setDraftTitle('');
    setDraftSubject('');
    setDraftContent('');
    setShowComposer(false);
    setQuery('');
    setSubject('ALL');
    setSaveMessage('Note saved.');
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
    <div className={`min-h-screen bg-[#faf9f6] text-slate-900 ${activeAudioNote ? 'pb-72' : 'pb-8'}`}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-4xl items-center gap-3 px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">My notes</h1>
            <p className="text-xs font-semibold text-slate-500">
              Your ideas, in your own words.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New note
          </button>
        </div>
      </header>

      {!isRegistered && (
        <div className="mx-auto max-w-4xl px-5 pt-5 text-sm text-slate-600">
          Notes are saved on this device. <button type="button" onClick={onRegister} className="min-h-12 rounded-lg px-2 font-semibold text-indigo-700 underline focus-visible:outline-indigo-600">Create an account to sync them</button>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-5 py-6">
        <p role="status" className="mb-3 text-sm text-indigo-700">{saveMessage}</p>

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
                <h2 className="font-bold">Write a note</h2>
                <p className="text-sm text-slate-500">Write an idea, a worked example, or something to remember.</p>
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
              <label className="space-y-2 text-sm font-semibold">Title
              <input
                ref={editorRef}
                value={draftTitle}
                onChange={event => setDraftTitle(event.target.value)}
                placeholder="Note title"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-300"
              />
              </label>
              <label className="space-y-2 text-sm font-semibold">Subject (optional)
              <input
                value={draftSubject}
                onChange={event => setDraftSubject(event.target.value)}
                placeholder="For example, Mathematics"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-300"
              />
              </label>
            </div>
            <label className="mt-4 block text-sm font-semibold">Your note
            <textarea
              value={draftContent}
              onChange={event => setDraftContent(event.target.value)}
              placeholder="Write the key idea, example, or correction you want to remember..."
              rows={9}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-[#fffef9] px-4 py-3 text-base font-normal leading-8 outline-none focus:ring-2 focus:ring-indigo-300"
            />
            </label>
            <button
              type="button"
              onClick={handleSaveManualNote}
              disabled={!draftTitle.trim() || !draftContent.trim()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BookOpen className="h-4 w-4" />
              Save note
            </button>
            <p className="mt-3 text-xs text-slate-500">Tap Save note to keep your work. Closing this editor keeps your draft until you leave My notes.</p>
          </section>
        )}

        {!showComposer && <>
        <section className="mb-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              aria-label="Search notes"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search notes or topics"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
            />
          </label>
          <select
            aria-label="Filter notes by subject"
            value={subject}
            onChange={event => setSubject(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-indigo-500"
          >
            <option value="ALL">All subjects</option>
            {subjects.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </section>

        {filteredNotes.length === 0 ? (
          <section className="rounded-2xl border border-stone-200 bg-white px-5 py-10 text-center">
            <BookOpen className="mx-auto mb-4 h-8 w-8 text-indigo-600" aria-hidden="true" />
            <h2 className="text-xl font-bold">{notes.length === 0 ? 'A fresh page for your ideas' : 'No matching notes'}</h2>
            <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-slate-600">{notes.length === 0 ? 'Write something you learned today. Notes you save from Ask Akili will appear here too.' : 'Try another word or subject. Your saved notes are still here.'}</p>
            <button type="button" onClick={() => { if (notes.length === 0) setShowComposer(true); else { setQuery(''); setSubject('ALL'); } }} className="mt-5 min-h-12 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800">{notes.length === 0 ? 'Write my first note' : 'Show all notes'}</button>
          </section>
        ) : (
          <section aria-label="Saved notes" className="space-y-4">
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
                    <h2 className="break-words text-lg font-bold">{note.title}</h2>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">
                      {note.subject}{note.grade ? ' / ' + note.grade : ''} / {masteryCopy[note.masteryStatus]}
                    </p>
                  </div>
                </div>

                <p className={`mt-3 whitespace-pre-wrap break-words leading-8 text-slate-700 ${expandedNoteId === note.id ? 'text-base' : 'line-clamp-3 text-sm'}`}>
                  {note.content}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                    aria-expanded={expandedNoteId === note.id}
                    className="min-h-12 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-800"
                  >
                    {expandedNoteId === note.id ? 'Close note' : 'Read note'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAudioNote(note);
                      onListenNote(note);
                    }}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Listen
                  </button>
                </div>
                <details className="mt-2">
                  <summary className="min-h-12 w-fit cursor-pointer rounded-lg py-3 text-sm font-semibold text-slate-600 focus-visible:outline-indigo-600">More for this note</summary>
                  <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleNoteSelection(note.id)}
                    className={'inline-flex min-h-12 items-center justify-center rounded-lg px-2 text-[10px] font-black transition ' + (selectedNoteIds.has(note.id) ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700')}
                    aria-pressed={selectedNoteIds.has(note.id)}
                    aria-label={(selectedNoteIds.has(note.id) ? 'Remove ' : 'Add ') + note.title + (selectedNoteIds.has(note.id) ? ' from revision pack' : ' to revision pack')}
                  >
                    {selectedNoteIds.has(note.id) ? 'Selected' : 'Select'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuizNote(note)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2 py-2 text-[11px] font-black text-emerald-700 hover:bg-emerald-100"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Test me
                  </button>
                  {onAskAkili && (
                    <button
                      type="button"
                      onClick={() => onAskAkili(note)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-purple-50 px-2 py-2 text-[11px] font-black text-purple-700 hover:bg-purple-100"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      Ask Akili
                    </button>
                  )}
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
                <button type="button" onClick={() => { if (window.confirm(`Delete "${note.title}"? This cannot be undone.`)) { deleteStudyNote(ownerKey, note.id); setSaveMessage('Note deleted.'); } }} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm text-rose-700 hover:bg-rose-50" aria-label={'Delete ' + note.title}><Trash2 className="h-4 w-4" />Delete note</button>
                </details>
              </article>
            ))}
          </section>
        )}
        </>}
      </main>

      {/* Floating Bottom Audio Player */}
      <NotebookAudioPlayer
        note={activeAudioNote}
        onClose={() => setActiveAudioNote(null)}
        onMasteryChange={(status) => {
          if (activeAudioNote) {
            setMastery(activeAudioNote, status);
          }
        }}
      />
    </div>
  );
};



