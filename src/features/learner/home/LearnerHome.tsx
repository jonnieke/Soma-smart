import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  FileText,
  GraduationCap,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FlaskConical,
  Globe2,
  Languages,
  Lightbulb,
  Menu,
  Mic,
  MoreHorizontal,
  ScanLine,
  Search,
  Sparkles,
  Target,
  Upload,
  UserCircle,
} from 'lucide-react';
import mascotImage from '../../../assets/images/somo_mascot.png';
import scienceImage from '../../../assets/images/hero_science_lab.webp';

export type LearnerHomeSubject = {
  name: string;
  icon: React.ReactNode;
  color: string;
  background: string;
};

type LearnerHomeProps = {
  learnerName: string;
  grade: string;
  sessionsLeft: number;
  avatarUrl?: string | null;
  latestTopic?: string;
  latestTopicDescription?: string;
  latestTopicSummary?: string[];
  latestProgress?: number;
  recommendedTopic?: string;
  recommendationReason?: string;
  featuredSubject?: string;
  onOpenMenu: () => void;
  onProfile: () => void;
  onTeach: (topic: string) => void;
  onScan: () => void;
  onUpload: () => void;
  onVoice: () => void;
  voiceTranscript?: string | null;
  onSubject: (subject: string) => void;
  onContinue: (topic: string) => void;
  onViewAll: () => void;
  onOpenRevision: () => void;
  onStartRecommendation: (topic: string) => void;
  onStartWeakDrill: (topic: string) => void;
};

const SUBJECTS: LearnerHomeSubject[] = [
  { name: 'Mathematics', icon: <Calculator />, color: 'text-violet-600', background: 'bg-violet-100' },
  { name: 'English', icon: <BookOpen />, color: 'text-blue-600', background: 'bg-blue-100' },
  { name: 'Kiswahili', icon: <Languages />, color: 'text-emerald-600', background: 'bg-emerald-100' },
  { name: 'Science', icon: <FlaskConical />, color: 'text-purple-600', background: 'bg-purple-100' },
  { name: 'Social Studies', icon: <Globe2 />, color: 'text-orange-600', background: 'bg-orange-100' },
  { name: 'More Subjects', icon: <MoreHorizontal />, color: 'text-slate-500', background: 'bg-slate-100' },
];


const normalizeSubjectLabel = (value?: string | null) => (value || '').trim().toLowerCase();

const orderSubjects = (subjects: LearnerHomeSubject[], featured?: string | null) => {
  const normalizedFeatured = normalizeSubjectLabel(featured);
  if (!normalizedFeatured) return subjects;

  const featuredSubject = subjects.find((subject) => normalizeSubjectLabel(subject.name) === normalizedFeatured);
  if (!featuredSubject) return subjects;

  const others = subjects.filter((subject) => normalizeSubjectLabel(subject.name) !== normalizedFeatured && subject.name !== 'More Subjects');
  const moreSubjects = subjects.find((subject) => subject.name === 'More Subjects');
  return [featuredSubject, ...others, ...(moreSubjects ? [moreSubjects] : [])];
};

type TopicArtwork = {
  title: string;
  description: string;
  icon: React.ReactNode;
  background: string;
  border: string;
  useImage: boolean;
};

type ExamCoachSnapshot = {
  date: string;
  subject: string;
  grade: string;
  score: number;
  weakTopics: string[];
  totalQuestions: number;
  correctAnswers: number;
};

const EXAM_RESULTS_KEY = 'somo_performance_records';

const getLatestExamSnapshot = (): ExamCoachSnapshot | null => {
  try {
    const stored = localStorage.getItem(EXAM_RESULTS_KEY);
    if (!stored) return null;
    const records = JSON.parse(stored) as Partial<ExamCoachSnapshot>[];
    if (!Array.isArray(records) || records.length === 0) return null;
    const latest = [...records].reverse().find((record) => record && typeof record === 'object');
    if (!latest) return null;
    return {
      date: String(latest.date || ''),
      subject: String(latest.subject || 'Revision'),
      grade: String(latest.grade || 'Learner'),
      score: Number(latest.score || 0),
      weakTopics: Array.isArray(latest.weakTopics) ? latest.weakTopics.map((topic) => String(topic)) : [],
      totalQuestions: Number(latest.totalQuestions || 0),
      correctAnswers: Number(latest.correctAnswers || 0),
    };
  } catch {
    return null;
  }
};

const getTopicArtwork = (topic: string): TopicArtwork => {
  const lower = topic.toLowerCase();
  if (/(photosynthesis|plant|biology|science|leaf|chlorophyll)/.test(lower)) {
    return {
      title: 'Science recap',
      description: 'Photosynthesis and plant life',
      icon: <FlaskConical />,
      background: 'from-emerald-100 via-lime-50 to-white',
      border: 'border-emerald-100',
      useImage: true,
    };
  }
  if (/(math|equation|algebra|number|fraction|geometry)/.test(lower)) {
    return {
      title: 'Math recap',
      description: 'Work through the steps again',
      icon: <Calculator />,
      background: 'from-violet-100 via-indigo-50 to-white',
      border: 'border-violet-100',
      useImage: false,
    };
  }
  if (/(english|grammar|composition|reading|literature)/.test(lower)) {
    return {
      title: 'English recap',
      description: 'Read, write and explain clearly',
      icon: <BookOpen />,
      background: 'from-blue-100 via-sky-50 to-white',
      border: 'border-blue-100',
      useImage: false,
    };
  }
  if (/(kiswahili|swahili|translation)/.test(lower)) {
    return {
      title: 'Kiswahili recap',
      description: 'Soma, tafsiri na elewa kwa haraka',
      icon: <Languages />,
      background: 'from-emerald-100 via-teal-50 to-white',
      border: 'border-emerald-100',
      useImage: false,
    };
  }
  if (/(social|history|geography|civics|cre)/.test(lower)) {
    return {
      title: 'Social studies recap',
      description: 'Map, society and civic understanding',
      icon: <Globe2 />,
      background: 'from-orange-100 via-amber-50 to-white',
      border: 'border-orange-100',
      useImage: false,
    };
  }
  return {
    title: 'Learning recap',
    description: 'Review the key idea and try again',
    icon: <BookOpen />,
    background: 'from-slate-100 via-white to-white',
    border: 'border-[#e4e5ef]',
    useImage: false,
  };
};

export const LearnerHome: React.FC<LearnerHomeProps> = ({
  learnerName,
  grade,
  sessionsLeft,
  avatarUrl,
  latestTopic = 'Photosynthesis',
  latestTopicDescription,
  latestTopicSummary = [],
  latestProgress = 70,
  recommendedTopic = 'Linear Equations',
  recommendationReason,
  featuredSubject,
  onOpenMenu,
  onProfile,
  onTeach,
  onScan,
  onUpload,
  onVoice,
  voiceTranscript,
  onSubject,
  onContinue,
  onViewAll,
  onOpenRevision,
  onStartRecommendation,
  onStartWeakDrill,
}) => {
  const [topic, setTopic] = useState('');
  const topicInputRef = useRef<HTMLInputElement>(null);
  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const cleanTopic = topic.trim();
    if (cleanTopic) onTeach(cleanTopic);
  };

  useEffect(() => {
    if (!voiceTranscript) return;
    setTopic(voiceTranscript);
    topicInputRef.current?.focus();
  }, [voiceTranscript]);

  const topicArtwork = getTopicArtwork(latestTopic);
  const featuredSubjectLabel = normalizeSubjectLabel(featuredSubject);
  const featuredSubjectName = featuredSubjectLabel ? (SUBJECTS.find((subject) => normalizeSubjectLabel(subject.name) === featuredSubjectLabel)?.name || '') : '';
  const orderedSubjects = orderSubjects(SUBJECTS, featuredSubjectName);
  const learnerFirstName = learnerName.trim().split(/\s+/)[0] || 'Learner';
  const latestExamSnapshot = useMemo(() => getLatestExamSnapshot(), []);
  const weakTopicCount = latestExamSnapshot?.weakTopics.length || 0;

  return (
    <div className="min-h-screen bg-[#fafaff] text-[#10143a]">
      <header className="sticky top-0 z-40 border-b border-[#e9e7f5] bg-white/95 backdrop-blur">
        <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-9">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e5e3f4] text-[#59617a] lg:hidden"
            aria-label="Open learner navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={onProfile} className="flex h-11 items-center gap-2 rounded-2xl border border-[#dcd7f8] bg-white px-3 text-sm font-semibold sm:px-5">
              <span>{grade || 'Grade 7'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={onProfile} className="hidden h-11 items-center gap-2 rounded-2xl border border-[#e5e3f4] bg-white px-4 text-sm font-semibold text-[#313a60] sm:flex">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{sessionsLeft} learning session{sessionsLeft === 1 ? '' : 's'} left</span>
            </button>
            <button type="button" onClick={onProfile} className="flex h-11 items-center gap-2" aria-label="Open learner profile">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Learner profile" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1effc] text-sm font-black text-[#6938ef]">{learnerName.charAt(0).toUpperCase() || <UserCircle className="h-7 w-7" />}</span>
              )}
              <ChevronDown className="hidden h-4 w-4 sm:block" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] bg-[#21155c] px-5 pb-6 pt-9 text-white shadow-[0_24px_70px_rgba(52,32,132,0.22)] sm:px-9 sm:pb-9 sm:pt-11 lg:px-12 lg:pb-11">
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[#8058ff]/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 right-12 h-80 w-80 rounded-full bg-[#42c6a5]/20 blur-3xl" />
          <div className="relative z-10 max-w-[760px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-violet-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.14)]" />
              Welcome and start learning with Akili
            </div>
            <p className="mt-6 text-sm font-semibold text-violet-200">Welcome, {learnerFirstName}</p>
            <h1 className="mt-1 text-[38px] font-black leading-[1.04] tracking-[-0.035em] text-white sm:text-[52px] lg:text-[62px]">
              Welcome and start<br className="hidden sm:block" /> learning today
            </h1>
            <p className="mt-5 max-w-[590px] text-[15px] leading-7 text-violet-100/85 sm:text-base">
              Ask Akili anything from class, get a clear explanation, see an example, and finish with a quick check to help it stick.
            </p>
          </div>

          <div className="pointer-events-none absolute -right-3 bottom-0 hidden w-[31%] max-w-[330px] justify-center lg:flex">
            <div className="absolute bottom-5 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <img src={mascotImage} alt="Akili learning assistant" className="relative max-h-[255px] max-w-full object-contain drop-shadow-2xl" />
          </div>

          <form onSubmit={submit} className="relative z-20 mt-8 max-w-[850px] rounded-[22px] bg-white p-2 shadow-[0_18px_50px_rgba(7,4,35,0.28)] sm:flex sm:items-center">
            <label htmlFor="learner-topic" className="sr-only">Ask Akili a question</label>
            <div className="flex min-h-14 min-w-0 flex-1 items-center px-2 sm:px-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0ecff] text-[#6938ef]"><Sparkles className="h-5 w-5" /></span>
              <input ref={topicInputRef} id="learner-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ask Akili a question..." autoComplete="off" className="min-w-0 flex-1 bg-transparent px-3 text-base font-medium text-[#16123d] outline-none placeholder:font-normal placeholder:text-[#85839a] sm:px-4" />
              <button type="button" onClick={onVoice} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#6c6883] transition hover:bg-[#f3f0ff] hover:text-[#6938ef]" aria-label="Ask Akili using your voice"><Mic className="h-5 w-5" /></button>
            </div>
            <button type="submit" disabled={!topic.trim()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-[#6d43ef] px-6 text-sm font-black text-white shadow-md transition hover:bg-[#5e34dd] disabled:cursor-not-allowed disabled:bg-[#b8abd9] sm:w-auto">Ask Akili <ArrowRight className="h-4 w-4" /></button>
          </form>
          {voiceTranscript && (
            <div className="relative z-20 mt-3 inline-flex max-w-[850px] items-start gap-2 rounded-full border border-[#d8d0f1] bg-white px-4 py-2 text-sm font-semibold text-[#3a3570] shadow-sm">
              <Mic className="mt-0.5 h-4 w-4 shrink-0 text-[#6938ef]" />
              <span className="min-w-0"><span className="font-black uppercase tracking-[0.14em] text-[10px] text-[#7a5bef]">Heard</span> <span className="break-words">{voiceTranscript}</span></span>
            </div>
          )}

          <div className="relative z-20 mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="mr-1 text-violet-200/75">Or start with</span>
            <button type="button" onClick={onScan} className="flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"><ScanLine className="h-4 w-4" /> Scan a page</button>
            <button type="button" onClick={onUpload} className="flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"><Upload className="h-4 w-4" /> Upload notes</button>
            <button type="button" onClick={onVoice} className="flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 font-semibold text-white backdrop-blur transition hover:bg-white/20"><Mic className="h-4 w-4" /> Ask by voice</button>
          </div>
        </section>

        <section className="mt-8">
          <div className="overflow-hidden rounded-[26px] border border-[#ddd7f4] bg-white shadow-[0_10px_36px_rgba(70,54,140,0.06)]">
            <div className="bg-gradient-to-r from-[#1c1648] via-[#2b1c78] to-[#4d2fe0] px-5 py-5 text-white sm:px-8 sm:py-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-violet-100">
                <BookOpen className="h-4 w-4" />
                Past papers first
              </div>
              <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-[24px] font-black leading-tight sm:text-[30px]">Open past papers and use them to learn faster.</h2>
                  <p className="mt-2 text-sm leading-6 text-violet-100/85 sm:text-base">Choose a real paper, work through it under time, then use the feedback to recover marks quickly.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-50/90">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">{grade || 'Grade 7'}</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">KPSEA / KJSEA / KCSE</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">Timed practice</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-[1.2fr_0.8fr] sm:px-8 sm:py-7">
              <div className="rounded-[22px] border border-[#ebe6fb] bg-[#faf8ff] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7a5bef]">Open past papers now</p>
                <h3 className="mt-2 text-xl font-bold text-[#18133f]">Start with a real paper, not a blank dashboard.</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f6684]">We&apos;ll take you to the revision hub where your papers, timing and feedback live together.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={onOpenRevision} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#6938ef] px-5 text-sm font-black text-white shadow-md shadow-violet-200 transition hover:bg-[#5c2fda]">
                    Open past papers now <ArrowRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={onViewAll} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8d0f1] bg-white px-5 text-sm font-bold text-[#6938ef] transition hover:bg-[#f5f1ff]">
                    Open all lanes
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[18px] border border-[#e7e3f6] bg-white p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7a5bef]">Best next move</p>
                  <p className="mt-2 text-sm font-semibold text-[#1a163f]">Open your paper, attempt the questions, then review weak topics.</p>
                </div>
                <div className="rounded-[18px] border border-[#e7e3f6] bg-white p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7a5bef]">What you get</p>
                  <ul className="mt-2 space-y-2 text-sm text-[#4f5673]">
                    <li>Published papers by subject and grade</li>
                    <li>Timed exam mode with feedback</li>
                    <li>Weak-topic revision after you finish</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="How Akili helps you learn">
          {[
            { number: '01', title: 'Ask naturally', text: 'Type it just as you would ask your teacher.' },
            { number: '02', title: 'Understand clearly', text: 'See simple steps and examples at your level.' },
            { number: '03', title: 'Try it yourself', text: 'Finish with a short practice check.' },
          ].map((item) => (
            <div key={item.number} className="flex items-start gap-3 rounded-2xl border border-[#e4e0f2] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(46,34,104,0.035)]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eee9ff] text-[11px] font-black text-[#6938ef]">{item.number}</span>
              <div>
                <h2 className="text-sm font-bold text-[#17133e]">{item.title}</h2>
                <p className="mt-1 text-xs leading-5 text-[#71758b]">{item.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a5bef]">Quick start</p>
              <h2 className="mt-1 text-[22px] font-bold">Choose a subject</h2>
            </div>
            {featuredSubjectName && <span className="hidden text-sm text-[#74798f] sm:block">Continue exploring {featuredSubjectName}</span>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {orderedSubjects.map((subject) => (
              <button key={subject.name} type="button" onClick={() => onSubject(subject.name)} className={`group flex min-h-[126px] flex-col items-center justify-center rounded-2xl border p-4 transition hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(70,54,140,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 ${normalizeSubjectLabel(subject.name) === featuredSubjectLabel ? 'border-[#cfc7f8] bg-[#faf8ff] shadow-[0_8px_20px_rgba(118,84,224,0.08)]' : 'border-[#e3e0f2] bg-white hover:border-[#cfc7f8]' }`}>
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${subject.background} ${subject.color} [&>svg]:h-8 [&>svg]:w-8`}>
                  {subject.icon}
                </span>
                <span className="mt-3 text-sm font-semibold text-[#151a42]">{subject.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[22px] font-bold">Continue learning</h2>
            <button type="button" onClick={onViewAll} className="text-sm font-semibold text-[#6938ef] hover:underline">View all</button>
          </div>
          <article className="mt-4 overflow-hidden rounded-[20px] border border-[#dedaf0] bg-white shadow-[0_8px_30px_rgba(70,54,140,0.04)] sm:grid sm:grid-cols-[190px_1fr_220px]">
            <div className="h-44 sm:h-full p-4">
              {topicArtwork.useImage ? (
                <img src={scienceImage} alt={topicArtwork.description} className="h-full w-full rounded-[16px] object-cover" />
              ) : (
                <div className={"flex h-full w-full items-center justify-center rounded-[16px] border bg-gradient-to-br " + topicArtwork.background + " " + topicArtwork.border}>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#6938ef] shadow-sm [&>svg]:h-8 [&>svg]:w-8">
                      {topicArtwork.icon}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a5bef]">{topicArtwork.title}</p>
                      <p className="mt-1 text-sm font-semibold text-[#334066]">{topicArtwork.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="inline-flex rounded-full border border-[#e6e1f7] bg-[#faf8ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a5bef]">
                Recent lesson recap
              </div>
              <h3 className="mt-3 text-xl font-bold">{latestTopic}</h3>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600"><Check className="h-4 w-4 rounded-full border border-emerald-500 p-0.5" /> Explanation completed</span>
                <span className="flex items-center gap-1.5 text-[#747b94]"><span className="h-3.5 w-3.5 rounded-full border border-[#aab0c4]" /> Quiz not attempted</span>
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#646d89]">{latestTopicDescription || `You were learning about ${latestTopic.toLowerCase()}.`}</p>
              {latestTopicSummary.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b90ab]">Key points</p>
                  <ul className="mt-3 space-y-2">
                    {latestTopicSummary.slice(0, 3).map((point, index) => (
                      <li key={`${latestTopic}-${index}`} className="flex gap-2 text-sm leading-6 text-[#343b5d]">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#6938ef]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="border-t border-[#ece9f6] p-6 sm:border-l sm:border-t-0">
              <p className="text-xl font-bold">{latestProgress}%</p>
              <p className="text-xs text-[#737b95]">complete</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee9f8]"><div className="h-full rounded-full bg-[#6938ef]" style={{ width: `${latestProgress}%` }} /></div>
              <button type="button" onClick={() => onContinue(latestTopic)} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6938ef] px-4 text-sm font-bold text-white hover:bg-[#5b2bd7]">
                Continue to Practice <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        </section>

        <section className="mt-8">
          <h2 className="text-[22px] font-bold">Recommended for you</h2>
          <article className="mt-4 flex flex-col gap-5 rounded-[20px] border border-[#dcd6f7] bg-[#f7f4ff] p-6 sm:flex-row sm:items-center">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-[#6938ef] shadow-sm"><Target className="h-10 w-10" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold">Revise {recommendedTopic}</h3>
              <p className="mt-1 text-sm text-[#626b87]">Based on your recent quiz performance</p>
              {recommendationReason && (
                <p className="mt-2 text-sm leading-6 text-[#4b5270]">{recommendationReason}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#5f6681]">
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5"><Clock3 className="h-3.5 w-3.5" /> 10 min lesson</span>
                <span className="rounded-full bg-white px-3 py-1.5">Strengthen your skills</span>
              </div>
            </div>
            <button type="button" onClick={() => onStartRecommendation(recommendedTopic)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#6938ef] bg-white px-6 font-bold text-[#6938ef] hover:bg-[#f1edff]">
              Start Lesson <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </section>

        {latestExamSnapshot && (
          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7a5bef]">Exam coach</p>
                <h2 className="mt-1 text-[22px] font-bold">Recover marks from your last paper</h2>
              </div>
              <span className="hidden text-sm text-[#74798f] sm:block">{latestExamSnapshot.score}% scored ? {weakTopicCount} weak area{weakTopicCount === 1 ? '' : 's'}</span>
            </div>
            <article className="mt-4 rounded-[20px] border border-[#dcd6f7] bg-[#fbf9ff] p-6 shadow-[0_8px_30px_rgba(70,54,140,0.04)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex rounded-full border border-[#e6e1f7] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a5bef]">
                    Last exam result
                  </div>
                  <h3 className="mt-3 text-xl font-bold">{latestExamSnapshot.subject} ? {latestExamSnapshot.grade}</h3>
                  <p className="mt-1 text-sm text-[#626b87]">{latestExamSnapshot.correctAnswers}/{latestExamSnapshot.totalQuestions} correct ? {latestExamSnapshot.score}% overall</p>
                  {weakTopicCount > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {latestExamSnapshot.weakTopics.slice(0, 4).map((topic) => (
                        <span key={topic} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#5f6681] shadow-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-emerald-700">No weak topics were detected in your latest paper. Nice work.</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-3 lg:w-[220px]">
                  <button type="button" onClick={() => onStartWeakDrill(latestExamSnapshot.weakTopics[0] || recommendedTopic)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#6938ef] px-6 font-bold text-white hover:bg-[#5b2bd7]">
                    Retry weak area <ChevronRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={onViewAll} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d9d3f2] bg-white px-6 font-bold text-[#6938ef] hover:bg-[#f4efff]">
                    Open past papers
                  </button>
                </div>
              </div>
            </article>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-[22px] font-bold">How learning with Akili works</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_28px_1fr_28px_1fr] md:items-center">
            <LearningStep number="1" title="Ask or Choose a Topic" description="Type a question or pick a topic to start." icon={<MoreHorizontal />} tone="violet" />
            <ArrowRight className="mx-auto hidden h-5 w-5 text-[#626b83] md:block" />
            <LearningStep number="2" title="Learn & Understand" description="Akili explains it step by step with examples." icon={<BookOpen />} tone="blue" />
            <ArrowRight className="mx-auto hidden h-5 w-5 text-[#626b83] md:block" />
            <LearningStep number="3" title="Practise & Check" description="Answer a few questions to check your understanding." icon={<Check />} tone="green" />
          </div>
        </section>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <Lightbulb className="h-5 w-5 shrink-0 text-amber-500" />
          <span><strong>Tip:</strong> The more you practise, the stronger your understanding becomes!</span>
          <Sparkles className="ml-auto hidden h-5 w-5 text-amber-400 sm:block" />
        </div>
      </main>
    </div>
  );
};

const LearningStep: React.FC<{ number: string; title: string; description: string; icon: React.ReactNode; tone: 'violet' | 'blue' | 'green' }> = ({ number, title, description, icon, tone }) => {
  const tones = {
    violet: 'bg-violet-100 text-violet-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
  };
  return (
    <article className="relative flex min-h-[132px] items-center gap-3 rounded-2xl border border-[#e2dff0] bg-white p-4">
      <span className={`absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${tone === 'violet' ? 'bg-violet-600' : tone === 'blue' ? 'bg-blue-600' : 'bg-emerald-600'}`}>{number}</span>
      <span className={`mt-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]} [&>svg]:h-6 [&>svg]:w-6`}>{icon}</span>
      <div className="mt-5">
        <h3 className="text-sm font-bold leading-5">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-[#626b87]">{description}</p>
      </div>
    </article>
  );
};
