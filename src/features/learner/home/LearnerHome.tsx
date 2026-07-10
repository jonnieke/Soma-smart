import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
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
  onSubject: (subject: string) => void;
  onContinue: (topic: string) => void;
  onViewAll: () => void;
  onStartRecommendation: (topic: string) => void;
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
  onSubject,
  onContinue,
  onViewAll,
  onStartRecommendation,
}) => {
  const [topic, setTopic] = useState('');
  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const cleanTopic = topic.trim();
    if (cleanTopic) onTeach(cleanTopic);
  };

  const topicArtwork = getTopicArtwork(latestTopic);
  const featuredSubjectLabel = normalizeSubjectLabel(featuredSubject);
  const featuredSubjectName = featuredSubjectLabel ? (SUBJECTS.find((subject) => normalizeSubjectLabel(subject.name) === featuredSubjectLabel)?.name || '') : '';
  const orderedSubjects = orderSubjects(SUBJECTS, featuredSubjectName);
  const learnerFirstName = learnerName.trim().split(/\s+/)[0] || 'Learner';


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
        <section className="relative min-h-[190px] overflow-hidden rounded-[24px] bg-[#f7f4ff] px-6 py-8 sm:px-9 lg:flex lg:items-center lg:px-10">
          <div className="relative z-10 max-w-[650px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e3ddf7] bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a5bef] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {featuredSubjectName ? ('Recent focus: ' + featuredSubjectName) : ('Welcome back, ' + learnerFirstName)}
            </div>
            <h1 className="mt-4 text-[34px] font-black leading-tight tracking-[0] text-[#10143a] sm:text-[44px] lg:text-[52px]">Learn with Akili</h1>
            <p className="mt-4 max-w-[600px] text-[15px] leading-7 text-[#4f5877] sm:text-base">
              Pick a topic, ask a question or scan a page.<br className="hidden sm:block" /> Akili will explain it clearly and check your understanding.
            </p>
            <p className="mt-3 text-sm font-medium text-[#6b7390]">
              {featuredSubjectName ? ('You are picking up from ' + featuredSubjectName + ' today.') : 'Choose a subject, then move straight into learning.'}
            </p>
          </div>
          <div className="pointer-events-none absolute -right-8 bottom-0 hidden h-full w-[38%] items-end justify-center lg:flex">
            <div className="absolute inset-4 rounded-full bg-violet-200/40 blur-3xl" />
            <img src={mascotImage} alt="Akili learning assistant" className="relative max-h-[205px] w-auto object-contain" />
          </div>
        </section>

        <section className="relative z-20 -mt-1 rounded-[22px] border border-[#e3dff5] bg-white p-5 shadow-[0_8px_30px_rgba(70,54,140,0.06)] sm:p-7">
          <h2 className="text-xl font-bold text-[#5b21e6] sm:text-[22px]">What do you want to learn today?</h2>
          <form onSubmit={submit} className="mt-5">
            <label htmlFor="learner-topic" className="sr-only">Topic or question</label>
            <div className="flex min-h-16 items-center rounded-2xl border-2 border-[#d9d2fa] bg-white px-4 focus-within:border-[#6938ef] focus-within:ring-4 focus-within:ring-violet-100">
              <Search className="h-5 w-5 shrink-0 text-[#69718d]" />
              <input
                id="learner-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Type a topic or question..."
                className="min-w-0 flex-1 bg-transparent px-4 text-base text-[#10143a] outline-none placeholder:text-[#8c93aa]"
              />
              <button type="button" onClick={onVoice} className="flex h-11 w-11 items-center justify-center rounded-xl text-[#68708e] hover:bg-[#f4f0ff] hover:text-[#6938ef]" aria-label="Ask using your voice">
                <Mic className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.15fr_64px]">
              <button type="submit" disabled={!topic.trim()} className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#6938ef] px-5 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-[#5b2bd7] disabled:cursor-not-allowed disabled:opacity-55">
                <Sparkles className="h-5 w-5" /> Teach Me
              </button>
              <button type="button" onClick={onScan} className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-[#ddd9ef] bg-white px-5 font-semibold hover:bg-[#faf9ff]">
                <ScanLine className="h-5 w-5" /> Scan a Page
              </button>
              <button type="button" onClick={onUpload} className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-[#ddd9ef] bg-white px-5 font-semibold hover:bg-[#faf9ff]">
                <Upload className="h-5 w-5" /> Upload Notes
              </button>
              <button type="button" onClick={onVoice} className="flex min-h-13 items-center justify-center rounded-xl border border-[#ddd9ef] bg-white hover:bg-[#faf9ff]" aria-label="Record a voice question">
                <Mic className="h-5 w-5" />
              </button>
            </div>
          </form>
          <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-[#68708a]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eee9ff] text-[#6938ef]"><Sparkles className="h-3 w-3" /></span>
            Akili will explain it, show an example and give you a short practice check.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[22px] font-bold">Popular subjects</h2>
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
