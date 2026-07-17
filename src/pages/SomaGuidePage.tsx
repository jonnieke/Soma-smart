import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, BellRing, BookOpen, CheckCircle2, ExternalLink, Lightbulb, ClipboardList, ShieldAlert, ArrowLeft } from 'lucide-react';
import { SchoolCalendar } from '../components/SchoolCalendar';

const newsItems = [
  {
    title: 'Revision season is here',
    body: 'Start with one paper a day and review the mistakes immediately after each attempt.',
    badge: 'New',
  },
  {
    title: 'Original papers first',
    body: 'The library now prioritizes SomaAI originals so learners revise with rights-safe papers.',
    badge: 'Library',
  },
  {
    title: 'Ask Akili stays available',
    body: 'When a topic feels hard, use Ask Akili for quick explanations, examples, and follow-up practice.',
    badge: 'Support',
  },
];

const syllabusItems = [
  {
    title: 'Official curriculum guides',
    body: 'Use the syllabus to see exactly what is covered, what is examinable, and what needs extra practice.',
  },
  {
    title: 'Grade and subject clarity',
    body: 'Check the right grade path before studying so the learner stays focused on the right learning area.',
  },
  {
    title: 'Move from guide to practice',
    body: 'Read the syllabus here, then jump into revision papers to test the same topics under exam conditions.',
  },
];

const dosDonts = [
  { type: 'Do', title: 'Read the instructions first', body: 'Know the marks, timing, and compulsory sections before answering.' },
  { type: 'Do', title: 'Show working clearly', body: 'Even when the final answer is wrong, working can earn method marks.' },
  { type: 'Don\'t', title: 'Skip the question wording', body: 'Words like explain, state, or give reasons change the type of answer expected.' },
  { type: 'Don\'t', title: 'Leave out units', body: 'A correct number with the wrong unit can still lose marks.' },
];

const studyTips = [
  'Attempt one paper under time before looking at the solution.',
  'Mark mistakes immediately and make a short repair note.',
  'Return to weak topics the same day while the memory is fresh.',
  'Use the syllabus to check the exact topic before a revision session.',
];

const notices = [
  'Exam dates may change. Always confirm with your school or official notices.',
  'Syllabus updates and exam guidance will appear here first for learners.',
  'Keep your revision focused on the grade you are currently enrolled in.',
];

export const SomaGuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_34%),linear-gradient(180deg,#f8f9ff_0%,#ffffff_30%,#f8fafc_100%)] text-slate-900">
      <Helmet>
        <title>Soma Guide | Soma AI</title>
        <meta name="description" content="Educational news, syllabus updates, examination dates, study guidance and official learner notices." />
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-indigo-200 hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" /> Home
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600">Menu label: Soma Guide</p>
            <h1 className="text-lg font-black text-slate-950 sm:text-xl">Your Guide to School and Exams</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-700 via-slate-900 to-blue-700 px-6 py-8 text-white shadow-2xl shadow-indigo-200/50 sm:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-100">
              <BookOpen className="h-3.5 w-3.5" /> Soma Guide
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Your Guide to School and Exams</h2>
            <p className="mt-3 text-base leading-7 text-indigo-50/90 sm:text-lg">Educational news, syllabus updates, examination dates, study guidance and official learner notices.</p>
          </div>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {newsItems.map((item) => (
            <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">News & Updates</p>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">{item.badge}</span>
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>

        <section id="syllabus" className="mt-10 rounded-[2rem] border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-600">Syllabus</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Stay on the right learning path</h2>
            </div>
            <button type="button" onClick={() => navigate('/revision')} className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-black text-purple-700 hover:bg-purple-100">
              Open revision <ExternalLink className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {syllabusItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="exam-calendar" className="mt-10 rounded-[2rem] border border-amber-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600">Exam Calendar</p>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Know the dates before the rush begins</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Use the calendar to plan revision blocks, mark the exam window, and keep the learner focused on what is next.</p>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <SchoolCalendar />
          </div>
        </section>

        <section id="dos-donts" className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600">Exam Dos & Don\'ts</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {dosDonts.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 p-4">
                <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${item.type === 'Do' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.type}</p>
                <h3 className="mt-2 text-sm font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="study-tips" className="mt-10 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-emerald-600" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Study Tips</p>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Small habits that recover marks fast</h2>
            <ul className="mt-5 space-y-3">
              {studyTips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-600">Important Notices</p>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Please check these before each exam session</h2>
            <div className="mt-5 space-y-3">
              {notices.map((notice) => (
                <div key={notice} className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm leading-6 text-slate-700">
                  {notice}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-slate-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-700">Quick links</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/revision')} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Open Revision</button>
            <button type="button" onClick={() => navigate('/learner')} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">Learner page</button>
            <button type="button" onClick={() => navigate('/')} className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">Back home</button>
          </div>
        </section>
      </main>
    </div>
  );
};
