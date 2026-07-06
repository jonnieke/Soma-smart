import React from 'react';
import {
    ArrowRight, BarChart3, BookOpen, Bot, CircleHelp, FileText, Headphones,
    Leaf, ListChecks, Menu, Mic, Monitor, Notebook, Search, ShieldCheck,
    Users, Volume2, X,
} from 'lucide-react';
import logoImg from '../assets/images/main_logo.png';
import learnerImg from '../assets/images/hero_learner_emotional.png';
import parentImg from '../assets/images/parent.png';
import mascotImg from '../assets/images/somo_buddy_avatar.png';

type Props = {
    isRegistered: boolean;
    userName?: string;
    onStartLearning: () => void;
    onAskQuestion: (question: string) => void;
    onTeacher: () => void;
    onParent: () => void;
    onLibrary: () => void;
    onPricing: () => void;
    onSignIn: () => void;
    onDashboard: () => void;
    onTrack: (eventName: string, params?: Record<string, unknown>) => void;
};

const helps = [
    ['Understand homework', 'Get step-by-step explanations for any school question.', BookOpen, 'bg-blue-50 text-blue-600'],
    ['Listen & Learn', 'Too tired to read? Listen instead.', Headphones, 'bg-emerald-50 text-emerald-600'],
    ['Practise weak topics', 'Quizzes and targeted revision help you improve.', CircleHelp, 'bg-violet-50 text-violet-600'],
    ['Notebook', 'Save what you learn and revise it later.', Notebook, 'bg-amber-50 text-amber-600'],
] as const;

const learnerTools = [
    ['Ask Akili', 'Ask any homework question and get clear answers instantly.', Bot, 'bg-blue-50 text-blue-600'],
    ['Listen & Learn', 'Listen to notes and explanations anytime, anywhere.', Headphones, 'bg-emerald-50 text-emerald-600'],
    ['Talk & Learn', 'Speak or type to get help in your own words.', Mic, 'bg-orange-50 text-orange-600'],
    ['Notebook', 'Save answers, notes and files. Revise anytime, anywhere.', Notebook, 'bg-violet-50 text-violet-600'],
    ['Library', 'Access trusted notes, past papers, and syllabus guides.', BookOpen, 'bg-sky-50 text-sky-600'],
] as const;

const teacherTools = [
    ['Create notes', 'Build quality notes in minutes.', FileText],
    ['Create quiz', 'Make quizzes in seconds.', CircleHelp],
    ['Share with class', 'Distribute content instantly.', Users],
    ['See weak topics', 'Track class progress in real time.', BarChart3],
] as const;

export const LandingHome: React.FC<Props> = (props) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const nav = [
        ['Learners', props.onStartLearning], ['Teachers', props.onTeacher],
        ['Parents', props.onParent],
        ['Library', () => { props.onTrack('library_nav_clicked', { source: 'landing_header' }); props.onLibrary(); }],
        ['Pricing', () => { props.onTrack('pricing_nav_clicked', { source: 'landing_header' }); props.onPricing(); }],
    ] as const;
    const go = (action: () => void) => { setMenuOpen(false); action(); };

    return (
        <main className="min-h-screen bg-white text-slate-950">
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600" aria-label="SomaAI home">
                        <img src={logoImg} alt="" width={44} height={44} className="h-10 w-10 object-contain" />
                        <span className="text-2xl font-black tracking-[0] text-[#07133f]">Soma<span className="text-blue-600">AI</span></span>
                    </button>
                    <nav aria-label="Main navigation" className="hidden items-center gap-9 md:flex">
                        {nav.map(([label, action]) => <button key={label} onClick={action} className="text-sm font-bold text-[#111943] hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600">{label}</button>)}
                    </nav>
                    <button onClick={() => { props.onTrack(props.isRegistered ? 'dashboard_clicked' : 'sign_in_clicked', { source: 'landing_header' }); if (props.isRegistered) { props.onDashboard(); } else { props.onSignIn(); } }} className="hidden rounded-lg border border-blue-600 px-5 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 md:block">
                        {props.isRegistered ? (props.userName ? `${props.userName}'s dashboard` : 'My Dashboard') : 'Sign In'}
                    </button>
                    <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 md:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
                </div>
                {menuOpen && <nav className="grid border-t border-slate-200 bg-white px-4 py-4 md:hidden">{nav.map(([label, action]) => <button key={label} onClick={() => go(action)} className="rounded-lg px-3 py-3 text-left text-sm font-bold hover:bg-slate-50">{label}</button>)}<button onClick={() => go(props.isRegistered ? props.onDashboard : props.onSignIn)} className="mt-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white">{props.isRegistered ? 'My Dashboard' : 'Sign In'}</button></nav>}
            </header>

            <section className="border-b border-blue-100 bg-[linear-gradient(90deg,#fff_0%,#f8fbff_48%,#fff_100%)]">
                <div className="mx-auto grid max-w-[1440px] gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[1.02fr_0.88fr_0.94fr] lg:items-center lg:px-10 lg:py-10">
                    <div className="max-w-xl">
                        <h1 className="text-4xl font-black leading-[1.04] tracking-[0] text-[#07133f] sm:text-5xl lg:text-[3.55rem]">Smart study help for CBC, KPSEA, and KCSE learners</h1>
                        <p className="mt-4 text-base font-medium leading-7 text-slate-700 sm:text-lg">Ask homework questions, listen to notes, practise weak topics, and save everything in your personal Notebook.</p>
                        <p className="mt-4 font-black"><span className="text-blue-600">Ask.</span> <span className="text-emerald-600">Listen.</span> <span className="text-violet-600">Practise.</span> <span className="text-[#07133f]">Remember.</span></p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button onClick={() => { props.onTrack('start_learning_free_clicked', { source: 'landing_hero' }); props.onStartLearning(); }} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">Start Learning Free <ArrowRight className="h-5 w-5" /></button>
                            <button onClick={() => { props.onTrack('teacher_cta_clicked', { source: 'landing_hero' }); props.onTeacher(); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-6 font-bold text-blue-600 hover:bg-blue-50"><Users className="h-5 w-5" /> I&apos;m a Teacher</button>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-600">
                            <span className="flex h-5 w-5 overflow-hidden rounded-full border" aria-label="Kenya"><span className="w-1/3 bg-black" /><span className="w-1/3 bg-red-600" /><span className="w-1/3 bg-emerald-600" /></span>
                            <span>Built for Kenyan learners</span><span>·</span><span>Low-data friendly</span><span>·</span><span>Parent progress reports</span>
                        </div>
                    </div>
                    <div className="relative hidden h-[420px] overflow-hidden lg:block">
                        <img src={learnerImg} alt="Kenyan learner studying with a supportive adult" width={1024} height={1024} fetchPriority="high" className="h-full w-full object-cover" />
                        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent" /><div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
                    </div>
                    <AskAkiliDemo {...props} />
                </div>
            </section>

            <section aria-labelledby="helps-heading" className="border-b border-slate-200 bg-[#f8fbff] py-8">
                <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10"><h2 id="helps-heading" className="text-center text-2xl font-black text-[#07133f]">What SomaAI helps with</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{helps.map(([title, text, Icon, tone]) => <article key={title} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-7 w-7" /></div><div><h3 className="font-black text-[#111943]">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{text}</p></div></article>)}</div></div>
            </section>

            <ToolsSection onStart={props.onStartLearning} onTeacher={props.onTeacher} onLibrary={props.onLibrary} />
            <ParentPricing onParent={props.onParent} onPricing={props.onPricing} />
            <TrustStrip />
        </main>
    );
};

const AskAkiliDemo: React.FC<Props> = (props) => {
    const [question, setQuestion] = React.useState('');
    const openQuestion = () => {
        const cleaned = question.trim();
        if (!cleaned) return;
        props.onTrack('ask_akili_home_question_submitted', { source: 'landing_hero', question_length: cleaned.length });
        props.onAskQuestion(cleaned);
        setQuestion('');
    };

    return (<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
    <div className="flex items-center justify-between bg-[#051b50] px-4 py-3 text-white"><div className="flex items-center gap-3"><img src={mascotImg} alt="Ask Akili assistant" width={42} height={42} className="h-10 w-10 rounded-full border-2 border-white/30 bg-white object-cover" /><h2 className="text-lg font-black">Ask Akili</h2></div><span className="text-sm font-bold text-blue-100">Study helper</span></div>
    <div className="space-y-3 p-4"><div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"><Search className="h-4 w-4 shrink-0" /><input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); openQuestion(); } }} placeholder="Ask a homework question..." className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400" aria-label="Ask a homework question" /></div><div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2.5 text-sm font-bold text-slate-800">What is photosynthesis?</div><div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3"><p className="text-sm font-semibold leading-6 text-[#15214d]">Photosynthesis is the process used by green plants to make their own food. They use sunlight, water, and carbon dioxide to produce glucose (food) and oxygen.</p></div>
        <div className="grid grid-cols-2 gap-2"><button onClick={() => { if (question.trim()) { openQuestion(); } else { props.onStartLearning(); } }} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 hover:bg-slate-50"><ListChecks className="h-4 w-4 text-blue-600" /> Explain step by step</button><button onClick={() => { props.onTrack('listen_demo_clicked', { source: 'ask_akili_demo' }); props.onStartLearning(); }} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 hover:bg-slate-50"><Volume2 className="h-4 w-4 text-emerald-600" /> Listen</button><button onClick={props.onStartLearning} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 hover:bg-slate-50"><CircleHelp className="h-4 w-4 text-violet-600" /> Test me</button><button onClick={() => { props.onTrack('save_to_notebook_demo_clicked', { source: 'ask_akili_demo' }); props.onStartLearning(); }} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 hover:bg-slate-50"><Notebook className="h-4 w-4 text-blue-600" /> Save to Notebook</button></div>
    </div>
</div>);
};

const ToolsSection: React.FC<{ onStart: () => void; onTeacher: () => void; onLibrary: () => void }> = ({ onStart, onTeacher, onLibrary }) => <section className="py-8">
    <div className="mx-auto grid max-w-[1440px] gap-4 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4"><h2 className="text-center text-xl font-black text-[#07133f]">Powerful tools for every learner</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{learnerTools.map(([title, text, Icon, tone]) => <button key={title} onClick={title === 'Library' ? onLibrary : onStart} className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${tone}`}><Icon className="h-6 w-6" /></div><h3 className="mt-3 text-sm font-black text-[#111943]">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></button>)}</div></div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><button onClick={onTeacher} className="mx-auto flex items-center gap-2 text-xl font-black text-emerald-800"><Users className="h-6 w-6" /> For Teachers</button><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{teacherTools.map(([title, text, Icon]) => <button key={title} onClick={onTeacher} className="rounded-lg border border-emerald-100 bg-white p-4 text-center shadow-sm transition hover:border-emerald-300 hover:shadow-md"><Icon className="mx-auto h-7 w-7 text-emerald-600" /><h3 className="mt-2 text-sm font-black text-[#173a2a]">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></button>)}</div></div>
    </div>
</section>;

const Metric: React.FC<{ label: string; value: string; note: string; tone: string }> = ({ label, value, note, tone }) => <div><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 font-black ${tone}`}>{value}</p><p className={`text-xs ${tone}`}>{note}</p></div>;
const Price: React.FC<{ title: string; price: string; text: string; tone: string; onClick: () => void }> = ({ title, price, text, tone, onClick }) => <button onClick={onClick} className={`rounded-lg border p-3 text-center ${tone}`}><p className="font-bold text-[#111943]">{title}</p><p className="mt-2 text-base font-black">{price}</p><p className="mt-2 text-xs leading-5 text-slate-600">{text}</p></button>;

const ParentPricing: React.FC<{ onParent: () => void; onPricing: () => void }> = ({ onParent, onPricing }) => <section className="pb-8">
    <div className="mx-auto grid max-w-[1440px] gap-4 px-4 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-10">
        <button onClick={onParent} className="grid overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/70 text-left shadow-sm sm:grid-cols-[0.7fr_1.6fr_0.7fr]">
            <div className="flex flex-col justify-center p-5"><Users className="h-9 w-9 text-amber-500" /><h2 className="mt-3 text-2xl font-black text-amber-700">For Parents</h2><p className="mt-1 text-sm font-semibold text-slate-600">Stay involved. See real progress.</p></div>
            <div className="m-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="font-black text-[#111943]">Weekly Progress Report</h3><span className="text-xs text-slate-500">13 - 19 May 2024</span></div><div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4"><Metric label="Studied" value="4" note="days this week" tone="text-blue-600" /><Metric label="Strong topics" value="Fractions," note="Photosynthesis" tone="text-emerald-600" /><Metric label="Needs revision" value="Algebra" note="expressions" tone="text-orange-600" /><Metric label="Next step" value="Practise 5" note="Algebra questions" tone="text-blue-600" /></div></div>
            <img src={parentImg} alt="Kenyan family reviewing learning progress" width={1024} height={1024} loading="lazy" className="hidden h-full min-h-48 w-full object-cover sm:block" />
        </button>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4"><h2 className="text-center text-xl font-black text-[#07133f]">Simple, affordable pricing</h2><div className="mt-4 grid grid-cols-3 gap-2"><Price title="Daily" price="KES 20" text="Learn for less, every day." tone="border-blue-100 bg-blue-50 text-blue-600" onClick={onPricing} /><Price title="Monthly" price="KES 499" text="Great value for consistent learning." tone="border-emerald-100 bg-emerald-50 text-emerald-600" onClick={onPricing} /><Price title="Termly" price="Best for exam preparation" text="Best value for serious learners." tone="border-violet-100 bg-violet-50 text-violet-600" onClick={onPricing} /></div></div>
    </div>
</section>;

const TrustStrip = () => <section className="border-y border-slate-200 bg-slate-50 py-5"><div className="mx-auto grid max-w-[1440px] gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">{([
    ['Curriculum aligned', 'Content aligned to CBC, KPSEA & KCSE you can trust.', ShieldCheck, 'text-blue-600'],
    ['Trusted library materials', 'Quality notes, past papers & guides from trusted sources.', BookOpen, 'text-[#07133f]'],
    ['Smart webapp', 'Safe, reliable, and works smoothly on any device.', Monitor, 'text-[#07133f]'],
    ['Climate initiative', 'Saving trees by reducing paper use through digital learning.', Leaf, 'text-emerald-600'],
] as const).map(([title, text, Icon, tone]) => <div key={title} className="flex items-start gap-3"><Icon className={`mt-0.5 h-7 w-7 shrink-0 ${tone}`} /><div><h2 className="text-sm font-black text-[#111943]">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div></div>)}</div></section>;
