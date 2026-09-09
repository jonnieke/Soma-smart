import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Search } from 'lucide-react';

export type LibraryEntry = {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  category: string;
  access: 'OWNED' | 'FREE' | 'PRO_INCLUDED' | 'PRO_LOCKED' | 'PURCHASE';
};

export const libraryKey = (value = '') => value.trim().toLowerCase().replace(/\s+/g, ' ');
const gradeKey = (value = '') => libraryKey(value).replace(/\s*\(jss\)/g, '');
const subjectName = (value?: string) => !value || libraryKey(value) === 'all' ? 'General reading' : value.trim();

export function libraryContents(entries: LibraryEntry[], grade: string, subject: string, query: string) {
  return entries.filter(entry => (!grade || gradeKey(entry.grade) === gradeKey(grade))
    && (subject === 'ALL' || libraryKey(subjectName(entry.subject)) === libraryKey(subject))
    && libraryKey(`${entry.title} ${subjectName(entry.subject)}`).includes(libraryKey(query)))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
}

type Props = {
  entries: LibraryEntry[];
  grade: string;
  subject: string;
  onGrade: (grade: string) => void;
  onSubject: (subject: string) => void;
  onOpen: (id: string) => void;
  onHome: () => void;
  onPractice: () => void;
};

const control = 'min-h-12 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200';

export function LearnerLibrary({ entries, grade, subject, onGrade, onSubject, onOpen, onHome, onPractice }: Props) {
  const [query, setQuery] = useState('');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const grades = Array.from(new Set([...entries.map(entry => entry.grade?.trim()).filter((value): value is string => Boolean(value) && libraryKey(value) !== 'all'), ...(grade ? [grade] : [])]))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const available = ownedOnly ? entries.filter(entry => entry.access === 'OWNED') : entries;
  const scoped = libraryContents(available, grade, 'ALL', '');
  const subjects = Array.from(new Map(scoped.map(entry => [libraryKey(subjectName(entry.subject)), subjectName(entry.subject)])).values()).sort();
  const visible = libraryContents(available, grade, subject, query);
  const reading = visible.filter(entry => entry.category !== 'PAST_PAPER');
  const papers = visible.filter(entry => entry.category === 'PAST_PAPER');
  const chooseSubject = (value: string) => { setQuery(''); onSubject(value); };

  const renderEntries = (items: LibraryEntry[]) => (
    <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
      {items.map(entry => {
        const action = entry.access === 'PRO_LOCKED' ? 'View plan' : entry.access === 'PURCHASE' ? 'View access' : entry.category === 'PAST_PAPER' ? 'Open paper' : 'Open study guide';
        return (
          <li key={entry.id}>
            <button type="button" onClick={() => onOpen(entry.id)} className="flex min-h-24 w-full items-center gap-4 rounded-xl p-5 text-left hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-indigo-200">
              <BookOpen aria-hidden="true" className="h-5 w-5 shrink-0 text-indigo-700" />
              <span className="min-w-0 flex-1"><strong className="block break-words text-base text-slate-900">{entry.title}</strong>
                <span className="mt-1 block text-sm text-slate-600">{entry.grade || 'Grade not specified'} · {entry.category === 'PAST_PAPER' ? 'Practice paper' : entry.category === 'SYLLABUS' ? 'Subject outline' : 'Reading material'}{entry.access === 'OWNED' ? ' · Purchased' : ''}</span>
                <span className="mt-2 block text-sm font-semibold text-indigo-700">{action}</span>
              </span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900">
      <header className="border-b border-stone-200 bg-white px-5 py-3 sm:px-8">
        <button type="button" onClick={subject === 'ALL' ? onHome : () => chooseSubject('ALL')} className={`${control} inline-flex items-center gap-2 text-slate-600 hover:bg-stone-100`}><ArrowLeft className="h-4 w-4" />{subject === 'ALL' ? 'Home' : 'All subjects'}</button>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-5 py-7 sm:px-8 sm:py-10">
        <div><p className="text-sm text-slate-600">My learning / Subjects</p><h1 className="mt-2 break-words text-3xl font-bold tracking-tight">{subject === 'ALL' ? 'Choose a subject' : subject}</h1><p className="mt-3 leading-6 text-slate-600">{subject === 'ALL' ? 'Find your subject, then choose something to read.' : 'Choose a title below to open its study guide. Take it at your own pace.'}</p></div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold sm:w-56">Grade or level
            <select value={grade} onChange={event => { onGrade(event.target.value); chooseSubject('ALL'); }} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-base focus:ring-2 focus:ring-indigo-300"><option value="">All grades — choose yours</option>{grades.map(value => <option key={value} value={value}>{value}</option>)}</select>
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-semibold">Find a title or subject
            <span className="flex min-h-12 items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 focus-within:ring-2 focus-within:ring-indigo-300"><Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your materials" className="min-w-0 w-full bg-transparent py-3 text-base font-normal outline-none" /></span>
          </label>
        </div>
        <details className="text-sm text-slate-600"><summary className="w-fit cursor-pointer rounded-lg py-3 focus-visible:outline-indigo-600">More options</summary><label className="flex min-h-12 items-center gap-3"><input type="checkbox" checked={ownedOnly} onChange={event => setOwnedOnly(event.target.checked)} className="h-4 w-4" />Only materials I have purchased</label></details>
        {subject === 'ALL' && !query.trim() && subjects.length > 0 ? (
          <section aria-label="Subjects" className="grid gap-3 sm:grid-cols-2">
            {subjects.map(name => <button key={libraryKey(name)} type="button" onClick={() => chooseSubject(name)} className="flex min-h-24 items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-left hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"><BookOpen aria-hidden="true" className="h-6 w-6 shrink-0 text-indigo-700" /><span className="min-w-0 flex-1"><strong className="block break-words text-lg">{name}</strong><span className="mt-1 block text-sm text-slate-600">View contents</span></span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></button>)}
          </section>
        ) : visible.length === 0 ? (
          <section role="status" className="rounded-2xl border border-stone-200 bg-white p-6"><h2 className="text-lg font-semibold">{query.trim() ? 'No matching titles' : 'No materials here yet'}</h2><p className="mt-2 leading-6 text-slate-600">{query.trim() ? 'Try a shorter search, or clear it to see the available titles.' : `No materials match ${grade || 'these grades'}${subject !== 'ALL' ? ` / ${subject}` : ''}${ownedOnly ? ' in your purchases' : ''}. You can choose another grade or subject.`}</p>{query && <button type="button" onClick={() => setQuery('')} className={`${control} mt-3 text-indigo-700`}>Clear search</button>}</section>
        ) : (
          <div className="space-y-6">
            {reading.length > 0 && <section aria-labelledby="reading-contents"><h2 id="reading-contents" className="mb-3 text-xl font-bold">Reading contents</h2>{renderEntries(reading)}</section>}
            {papers.length > 0 && <details open={reading.length === 0 || undefined}><summary className="cursor-pointer rounded-xl py-3 text-lg font-semibold focus-visible:outline-indigo-600">Practice papers ({papers.length})</summary>{renderEntries(papers)}</details>}
          </div>
        )}
        <button type="button" onClick={onPractice} className={`${control} inline-flex items-center gap-2 text-indigo-700 hover:bg-indigo-50`}>Go to practice papers<ArrowRight className="h-4 w-4" /></button>
      </main>
    </div>
  );
}
