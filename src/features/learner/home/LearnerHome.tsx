import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, FileText, Menu, Mic, ScanLine, Upload, UserCircle } from 'lucide-react';

type LearnerHomeProps = {
  learnerName: string;
  grade: string;
  subjects: string[];
  latestTopic?: string;
  onOpenMenu: () => void;
  onProfile: () => void;
  onTeach: (topic: string) => void;
  onScan: () => void;
  onUpload: () => void;
  onVoice: () => void;
  voiceTranscript?: string | null;
  onSubject: (subject: string) => void;
  onContinue: () => void;
  onViewAll: () => void;
  onOpenRevision: () => void;
};

const buttonStyle = 'min-h-12 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300';

export const LearnerHome: React.FC<LearnerHomeProps> = ({
  learnerName, grade, subjects, latestTopic, onOpenMenu, onProfile,
  onTeach, onScan, onUpload, onVoice, voiceTranscript,
  onSubject, onContinue, onViewAll, onOpenRevision,
}) => {
  const [question, setQuestion] = useState('');
  const questionRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (voiceTranscript) {
      setQuestion(voiceTranscript);
      questionRef.current?.focus();
    }
  }, [voiceTranscript]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onOpenMenu} aria-label="Open learner navigation" className={`${buttonStyle} hover:bg-stone-100 lg:hidden`}><Menu className="h-5 w-5" /></button>
          <span className="text-sm font-semibold">My learning</span>
        </div>
        <button type="button" onClick={onProfile} className={`${buttonStyle} flex items-center gap-2 text-slate-600 hover:bg-stone-100`} aria-label="View profile and change grade"><span>{grade}</span><UserCircle className="h-6 w-6" /></button>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-5 py-7 sm:px-8 sm:py-10">
        <div>
          <p className="text-sm text-slate-600">A little learning, every day.</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Hello, {learnerName.split(' ')[0]}.</h1>
          <p className="mt-3 text-base text-slate-600">{latestTopic ? 'Pick up where you left off, or choose a subject.' : 'Choose a subject and something you would like to learn.'}</p>
        </div>

        {latestTopic && (
          <section aria-labelledby="continue-heading" className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 sm:p-6">
            <h2 id="continue-heading" className="text-sm font-semibold text-indigo-800">Continue reading</h2>
            <p className="mt-2 break-words text-xl font-bold">{latestTopic}</p>
            <p className="mt-2 text-sm text-slate-600">Open your last saved lesson.</p>
            <button type="button" onClick={onContinue} className={`${buttonStyle} mt-4 inline-flex items-center gap-2 bg-indigo-700 text-white hover:bg-indigo-800`}>Continue reading<ArrowRight className="h-4 w-4" /></button>
          </section>
        )}

        <section aria-labelledby="subjects-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="subjects-heading" className="text-xl font-bold">Your subjects</h2>
            <button type="button" onClick={onViewAll} className={`${buttonStyle} text-indigo-700 hover:bg-indigo-50`}>Browse all materials <span aria-hidden="true">→</span></button>
          </div>
          {subjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3">
              {subjects.slice(0, 6).map((subject) => (
                <button key={subject} type="button" onClick={() => onSubject(subject)} className="group flex min-h-28 items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
                  <BookOpen className="mt-1 h-5 w-5 shrink-0 text-indigo-700" aria-hidden="true" />
                  <span className="min-w-0"><strong className="block break-words text-base">{subject}</strong><span className="mt-2 block text-sm text-slate-500">Explore materials <span aria-hidden="true">→</span></span></span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <BookOpen className="h-6 w-6 text-indigo-700" aria-hidden="true" />
              <p className="mt-3 font-semibold">Find something to read</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Browse the library to find notes and learning materials for your subject.</p>
              <button type="button" onClick={onViewAll} className={`${buttonStyle} mt-3 bg-indigo-700 text-white hover:bg-indigo-800`}>Open subjects</button>
            </div>
          )}
        </section>

        <section aria-labelledby="akili-heading" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 id="akili-heading" className="text-xl font-bold">Need a hand? Ask Akili</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Bring a question from your book. We’ll work through it together.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={onScan} className={`${buttonStyle} flex items-center justify-center gap-2 border border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100`}><ScanLine className="h-5 w-5 shrink-0" />Scan a question</button>
            <button type="button" onClick={onVoice} className={`${buttonStyle} flex items-center justify-center gap-2 border border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100`}><Mic className="h-5 w-5 shrink-0" />Record a question</button>
          </div>
          <form className="mt-4" onSubmit={(event) => { event.preventDefault(); if (question.trim()) onTeach(question.trim()); }}>
            <label htmlFor="home-question" className="text-sm font-medium text-slate-700">Or type your question</label>
            <textarea id="home-question" ref={questionRef} value={question} onChange={(event) => setQuestion(event.target.value)} rows={2} placeholder="What would you like help with?" className="mt-2 block w-full resize-y rounded-xl border border-stone-300 bg-white p-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={onUpload} className={`${buttonStyle} inline-flex items-center gap-2 text-slate-600 hover:bg-stone-100`}><Upload className="h-4 w-4" />Upload a page</button>
              <button type="submit" disabled={!question.trim()} className={`${buttonStyle} inline-flex items-center gap-2 bg-indigo-700 text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50`}>Ask Akili<ArrowRight className="h-4 w-4" /></button>
            </div>
          </form>
        </section>

        <button type="button" onClick={onOpenRevision} className="flex min-h-16 w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
          <FileText className="h-5 w-5 shrink-0 text-slate-500" />
          <span className="flex-1"><strong className="block text-sm">Practice papers</strong><span className="text-sm text-slate-600">Ready to practise what you’ve learned?</span></span><ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </main>
    </div>
  );
};
