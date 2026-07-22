import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, BellRing, BookOpen, CheckCircle2, ExternalLink, Lightbulb,
    ClipboardList, ShieldAlert, ArrowLeft, Clock, Target, Sparkles, MessageCircle,
    Flame, ArrowRight, Zap, CheckCircle, HelpCircle, FileText, Bot, Trophy, Compass
} from 'lucide-react';
import { SchoolCalendar } from '../components/SchoolCalendar';
import logoImg from '../assets/images/main_logo.png';

interface GuideNewsItem {
    id: string;
    title: string;
    body: string;
    category: 'KCSE' | 'KPSEA' | 'CBC' | 'LIBRARY';
    actionText: string;
    actionTarget: string;
    badge: string;
}

const NEWS_UPDATES: GuideNewsItem[] = [
    {
        id: 'news-1',
        title: 'KCSE 2026 Preparation Window Open',
        body: 'Official KNEC past papers and SomaAI Originals are updated in the Exam Paper Bank with full step-by-step marking schemes.',
        category: 'KCSE',
        actionText: 'Attempt KCSE Papers',
        actionTarget: '/revision',
        badge: 'KCSE Focus',
    },
    {
        id: 'news-2',
        title: 'KPSEA Grade 6 Assessment Guidelines',
        body: 'Grade 6 national assessment preparation includes science experiments, Kiswahili Inshaa, and mathematics speed drills.',
        category: 'KPSEA',
        actionText: 'Open KPSEA Hub',
        actionTarget: '/revision?pathway=KPSEA',
        badge: 'KPSEA Grade 6',
    },
    {
        id: 'news-3',
        title: 'CBC Grade 8 & 9 Junior Secondary Notes',
        body: 'Official syllabus-aligned CBC notes for Agriculture, Computer Studies, Creative Arts, and Integrated Science are in the library.',
        category: 'CBC',
        actionText: 'Browse CBC Notes',
        actionTarget: '/learner',
        badge: 'CBC JSS',
    },
    {
        id: 'news-4',
        title: 'Ask Akili Step-by-Step Problem Solver',
        body: 'When stuck on complex math or science questions, use Ask Akili to get step-by-step working and method marks guidance.',
        category: 'LIBRARY',
        actionText: 'Ask Akili AI',
        actionTarget: '/learner',
        badge: 'AI Tutor',
    },
];

const KNEC_MARKING_STRATEGIES = [
    {
        subject: 'Mathematics',
        doTip: 'Show all working steps — KNEC awards method marks (M marks) even if the final calculation has an arithmetic error.',
        dontTip: 'Writing only the final answer without steps loses all method marks if the number is wrong.',
        badgeBg: 'bg-blue-500/10 text-blue-700 border-blue-200',
    },
    {
        subject: 'Biology',
        doTip: 'Label diagrams completely using clear straight lines. Use correct scientific terms (e.g., osmosis, transpiration).',
        dontTip: 'Vague descriptions like "it absorbs water" instead of "water enters by osmosis" score zero.',
        badgeBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    },
    {
        subject: 'Chemistry',
        doTip: 'Include state symbols (s, l, g, aq) in chemical equations and record exact color changes in Paper 3 practicals.',
        dontTip: 'Omitting state symbols or skipping observation units in practical questions loses easy marks.',
        badgeBg: 'bg-purple-500/10 text-purple-700 border-purple-200',
    },
    {
        subject: 'English & Kiswahili',
        doTip: 'Follow standard essay structure: introduction (2 marks), 3 developed body paragraphs (12 marks), and conclusion.',
        dontTip: 'Writing single-word answers in comprehension without full context loses half the marks.',
        badgeBg: 'bg-amber-500/10 text-amber-800 border-amber-200',
    },
];

export const SomaGuidePage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'KCSE' | 'KPSEA' | 'CBC'>('ALL');
    const [activeCandidate, setActiveCandidate] = useState<'KCSE' | 'KPSEA'>('KCSE');

    // Calculate dynamic countdown days
    const candidateCountdownDays = useMemo(() => {
        const targetDate = activeCandidate === 'KCSE' ? new Date('2026-11-02') : new Date('2026-10-26');
        const today = new Date();
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }, [activeCandidate]);

    const filteredNews = useMemo(() => {
        if (selectedCategory === 'ALL') return NEWS_UPDATES;
        return NEWS_UPDATES.filter(item => item.category === selectedCategory || item.category === 'LIBRARY');
    }, [selectedCategory]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <Helmet>
                <html lang="en" />
                <title>Soma Guide | KCSE, KPSEA &amp; CBC Academic Calendar &amp; Exam Updates Kenya</title>
                <meta name="description" content="Official Kenyan educational guide for KCSE, KPSEA, and CBC students. Access school term calendars, KNEC exam dates, study strategy tips, and direct revision tools." />
                <meta name="keywords" content="Soma Guide, KCSE 2026 calendar, KPSEA exam dates Kenya, KNEC timetable, CBC syllabus notes, KCSE revision strategy, Kenyan school calendar" />

                {/* AIO & Search Engine Optimization */}
                <meta name="smart-search-index" content="index" />
                <meta name="ai-knowledge-base" content="official-guide" />
                <meta name="educational-framework" content="KCSE, KPSEA, CBC, KNEC" />
                <meta name="target-audience" content="Learners, Candidates, Teachers, Parents" />
                <meta name="robots" content="index, follow, max-image-preview:large" />

                {/* OpenGraph */}
                <meta property="og:site_name" content="Somo Smart" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Soma Guide | KCSE, KPSEA &amp; CBC Academic Calendar &amp; Exam Updates Kenya" />
                <meta property="og:description" content="School term dates, KNEC exam countdowns, study strategy guides, and direct revision tools for Kenya." />
                <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
                <meta property="og:url" content="https://www.somaai.co.ke/guide" />

                <link rel="canonical" href="https://www.somaai.co.ke/guide" />

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "EducationalOrganization",
                        "name": "Somo Smart Academic Guide",
                        "url": "https://www.somaai.co.ke/guide",
                        "description": "Official academic guide, school calendars, and exam strategy for Kenyan learners.",
                        "educationalLevel": ["Primary", "Junior Secondary", "Senior Secondary"]
                    })}
                </script>
            </Helmet>

            {/* Functional Header Navbar */}
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2.5" aria-label="Somo Smart homepage">
                        <img src={logoImg} alt="Somo Smart Logo" className="h-9 w-9 object-contain" />
                        <span className="text-xl font-black text-[#07133f]">Somo Smart</span>
                        <span className="inline-flex rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-700">
                            Academic Guide
                        </span>
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button onClick={() => navigate('/')} className="hidden rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:inline-flex">
                            Home
                        </button>
                        <button onClick={() => navigate('/learner')} className="hidden rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 md:inline-flex">
                            Learner Tools
                        </button>
                        <button onClick={() => navigate('/exam-papers')} className="hidden rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 lg:inline-flex">
                            Exam Paper Bank
                        </button>
                        <button onClick={() => navigate('/revision')} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 transition-colors shadow-sm">
                            Candidates Hub
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 p-6 sm:p-10 text-white shadow-xl border border-indigo-800/40">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-extrabold text-indigo-200 border border-indigo-400/20">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-300" /> Somo Smart Guide &amp; Calendar
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                            Your Practical Guide to <span className="text-indigo-300">Kenyan Exams</span>
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
                            Track Ministry of Education term dates, monitor national candidate countdowns, master KNEC marking strategies, and launch immediate revision tools.
                        </p>
                    </div>
                </div>

                {/* Interactive National Candidate Countdown Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">National Exam Countdown</h2>
                                <p className="text-xs text-slate-500 font-medium">Days remaining to national candidate examinations</p>
                            </div>
                        </div>

                        {/* Candidate Selector */}
                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setActiveCandidate('KCSE')}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    activeCandidate === 'KCSE'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                KCSE 2026 (Form 4)
                            </button>
                            <button
                                onClick={() => setActiveCandidate('KPSEA')}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    activeCandidate === 'KPSEA'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                KPSEA 2026 (Grade 6)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-7 bg-gradient-to-r from-amber-500/10 via-amber-50 to-indigo-50 border border-amber-200/80 rounded-2xl p-6 flex items-center gap-6">
                            <div className="text-center shrink-0">
                                <span className="text-4xl sm:text-5xl font-black text-slate-900 block leading-none">{candidateCountdownDays}</span>
                                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Days Left</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-black uppercase tracking-wider text-amber-800 block">
                                    {activeCandidate} National Assessment
                                </span>
                                <h3 className="text-base font-black text-slate-900">
                                    {activeCandidate === 'KCSE' ? 'KCSE National Examinations 2026' : 'KPSEA Grade 6 National Assessment 2026'}
                                </h3>
                                <p className="text-xs text-slate-600">
                                    {activeCandidate === 'KCSE'
                                        ? 'Scheduled for November 2026 across all secondary examination centres.'
                                        : 'Scheduled for October 2026 across primary assessment centres.'}
                                </p>
                            </div>
                        </div>

                        <div className="md:col-span-5 flex flex-col gap-3">
                            <button
                                onClick={() => navigate(`/revision?pathway=${activeCandidate}`)}
                                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
                            >
                                <span>Start {activeCandidate} Revision Drills</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/exam-papers')}
                                className="w-full py-3.5 px-6 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <span>Browse {activeCandidate} Past Papers Bank</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* News & Syllabus Updates Section with Interactive Triggers */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" /> News &amp; Curriculum Guidance
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">Stay informed on syllabus updates and revision strategies.</p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2">
                            {(['ALL', 'KCSE', 'KPSEA', 'CBC'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        selectedCategory === cat
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredNews.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 mb-2 leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        {item.body}
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate(item.actionTarget)}
                                    className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    <span>{item.actionText}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* KNEC Exam Strategy: Do's and Don'ts */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-emerald-600" /> KNEC Marking Scheme Strategy Tips
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">Subject-specific rules to protect marks during exams.</p>
                        </div>
                        <button
                            onClick={() => navigate('/learner')}
                            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                        >
                            <span>Test with Ask Akili AI</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {KNEC_MARKING_STRATEGIES.map(item => (
                            <div key={item.subject} className="rounded-2xl p-5 border border-slate-200/80 bg-slate-50/60 space-y-3">
                                <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${item.badgeBg}`}>
                                    {item.subject} Strategy
                                </span>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-start gap-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 text-emerald-900">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold text-emerald-800 block mb-0.5">Do:</span>
                                            <span className="font-medium text-slate-700">{item.doTip}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2 bg-rose-50/80 border border-rose-200/80 rounded-xl p-3 text-rose-900">
                                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold text-rose-800 block mb-0.5">Don&apos;t:</span>
                                            <span className="font-medium text-slate-700">{item.dontTip}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ministry School Term Calendar Component */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Kenyan School Term Calendar</h2>
                            <p className="text-xs text-slate-500 font-medium">Official term dates, mid-term breaks, and exam windows</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <SchoolCalendar />
                    </div>
                </div>

                {/* WhatsApp Support & Notice Card */}
                <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-800/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white">Have Questions About Exam Guidance?</h3>
                            <p className="text-xs text-slate-300 font-medium">
                                Chat with our Somo Smart academic support team directly on WhatsApp <span className="text-emerald-400 font-bold">+254 722 763 760</span>.
                            </p>
                        </div>
                    </div>

                    <a
                        href="https://wa.me/254722763760?text=Hi%20Somo%20Smart%20Support%2C%20I%20have%20a%20question%20about%20the%20academic%20guide%20and%20exam%20calendar."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-950/40 inline-flex items-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat Support (0722763760)</span>
                    </a>
                </div>

            </main>
        </div>
    );
};

export default SomaGuidePage;
