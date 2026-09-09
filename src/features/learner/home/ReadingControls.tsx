import React, { useRef } from 'react';
import { ArrowLeft, Headphones, Pause } from 'lucide-react';

type StudyTab = 'LESSON' | 'QNA' | 'QUIZ' | 'RECAP' | 'REFERENCES';
const control = 'min-h-12 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200';

export function ReadingNavigation({ title, subject, grade, tab, onTab, onBack }: {
  title: string; subject?: string; grade?: string; tab: StudyTab;
  onTab: (tab: StudyTab) => void; onBack: () => void;
}) {
  const moreRef = useRef<HTMLDetailsElement>(null);
  const chooseMore = (next: StudyTab) => { if (moreRef.current) moreRef.current.open = false; onTab(next); };
  return <header className="border-b border-stone-200 bg-[#faf9f6] px-5 py-5 sm:px-8">
    <button type="button" onClick={onBack} className={`${control} mb-3 inline-flex items-center gap-2 text-slate-600 hover:bg-white`}><ArrowLeft className="h-4 w-4" />Back to subjects</button>
    <p className="text-sm text-slate-600">{[subject, grade].filter(Boolean).join(' · ')}</p>
    <h1 className="mt-2 break-words text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{title}</h1>
    <nav aria-label="Reading tools" className="mt-5 flex flex-wrap gap-2">
      {([{ id: 'LESSON', label: 'Read' }, { id: 'QNA', label: 'Ask Akili' }, { id: 'QUIZ', label: 'Practise' }] as const).map(item => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => onTab(item.id)} className={`${control} ${tab === item.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600 hover:bg-indigo-50'}`}>{item.label}</button>)}
      <details ref={moreRef} className="relative">
        <summary className={`${control} cursor-pointer text-slate-600`}>More</summary>
        <div className="absolute right-0 z-30 min-w-48 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <button type="button" aria-pressed={tab === 'RECAP'} onClick={() => chooseMore('RECAP')} className={`${control} block w-full text-left text-slate-700 hover:bg-indigo-50`}>Quick recap</button>
          <button type="button" aria-pressed={tab === 'REFERENCES'} onClick={() => chooseMore('REFERENCES')} className={`${control} block w-full text-left text-slate-700 hover:bg-indigo-50`}>Sources &amp; syllabus</button>
        </div>
      </details>
    </nav>
  </header>;
}

export function ReadingToolbar({ sourceAvailable, view, onView, originalType, onOriginalType, playing, busy, ready, onListen, fontScale, onFontScale, fontFamily, onFontFamily, search, onSearch }: {
  sourceAvailable: boolean; view: 'guide' | 'original'; onView: (view: 'guide' | 'original') => void;
  originalType: 'text' | 'pdf'; onOriginalType: (type: 'text' | 'pdf') => void;
  playing: boolean; busy: boolean; ready: boolean; onListen: () => void;
  fontScale: number; onFontScale: (size: number) => void; fontFamily: 'sans' | 'serif'; onFontFamily: (font: 'sans' | 'serif') => void;
  search: string; onSearch: (query: string) => void;
}) {
  return <div className="border-b border-stone-200 bg-white px-5 py-3 sm:px-8">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={busy || (!ready && !playing)} onClick={onListen} className={`${control} inline-flex items-center gap-2 bg-indigo-50 text-indigo-800 disabled:opacity-50`}>
        {playing ? <Pause className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}{busy ? 'Preparing audio…' : playing ? 'Pause audio' : 'Listen'}
      </button>
      {sourceAvailable && <label className="flex items-center gap-2 text-sm text-slate-600">Read
        <select aria-label="Reading version" value={view} onChange={e => onView(e.target.value as 'guide' | 'original')} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-300"><option value="guide">Study guide</option><option value="original">Source document</option></select>
      </label>}
    </div>
    <details className="mt-2">
      <summary className="min-h-12 w-fit cursor-pointer rounded-lg py-3 text-sm font-semibold text-slate-600 focus-visible:outline-indigo-600">Reading settings &amp; search</summary>
      <div className="flex flex-wrap items-end gap-4 pb-3">
        <div className="flex gap-2"><button type="button" aria-label="Make text smaller" disabled={fontScale <= 0.8} onClick={() => onFontScale(Math.max(0.8, Math.round((fontScale - 0.1) * 10) / 10))} className={`${control} border border-stone-300 disabled:opacity-50`}>A−</button><button type="button" aria-label="Make text larger" disabled={fontScale >= 1.5} onClick={() => onFontScale(Math.min(1.5, Math.round((fontScale + 0.1) * 10) / 10))} className={`${control} border border-stone-300 disabled:opacity-50`}>A+</button></div>
        <label className="flex flex-col gap-2 text-sm text-slate-700">Text style<select value={fontFamily} onChange={e => onFontFamily(e.target.value as 'sans' | 'serif')} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3"><option value="sans">Simple</option><option value="serif">Book</option></select></label>
        {view === 'original' && <label className="flex flex-col gap-2 text-sm text-slate-700">Document format<select value={originalType} onChange={e => onOriginalType(e.target.value as 'text' | 'pdf')} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3"><option value="text">Readable text</option><option value="pdf">PDF pages</option></select></label>}
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-slate-700">Highlight words on this page<input type="search" value={search} onChange={e => onSearch(e.target.value)} className="min-h-12 min-w-0 rounded-xl border border-stone-300 bg-white px-3 text-base focus:ring-2 focus:ring-indigo-300" /></label>
      </div>
    </details>
  </div>;
}

export function ReadingPager({ page, count, onPage }: { page: number; count: number; onPage: (page: number) => void }) {
  return <nav aria-label="Reading pages" className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 bg-white px-4 py-4">
    <button type="button" disabled={page <= 0} onClick={() => onPage(page - 1)} className={`${control} text-indigo-700 disabled:opacity-40`}>Previous</button>
    <label className="flex items-center gap-2 text-sm text-slate-600">Page<select aria-label="Go to page" value={page} onChange={e => onPage(Number(e.target.value))} className="min-h-12 rounded-xl border border-stone-300 bg-white px-3">{Array.from({ length: count }, (_, index) => <option key={index} value={index}>{index + 1}</option>)}</select>of {count}</label>
    <button type="button" disabled={page >= count - 1} onClick={() => onPage(page + 1)} className={`${control} text-indigo-700 disabled:opacity-40`}>Next</button>
  </nav>;
}
