import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    ArrowRight, Award, BookOpen, Brain, CheckCircle, Clock, FileText,
    Loader2, LogOut, ShieldCheck, Sparkles, Star, Target, Zap,
    Headphones, Volume2, Mic, Flame, CheckCircle2, MessageCircle,
    Trophy, Calendar, Play, Bot, Notebook, ArrowUpRight, Compass,
    SlidersHorizontal, Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { LoginModal } from '../../components/LoginModal';
import { RegistrationModal } from '../../components/RegistrationModal';
import { LogoutModal } from '../../components/LogoutModal';
import { examService } from '../../services/examService';
import { TelegramBanner } from '../../components/TelegramBanner';
import logoImg from '../../assets/images/main_logo.png';

type CandidatePathway = 'KCSE' | 'KJSEA' | 'KPSEA';
type PublishedExam = Record<string, any> & { id: string | number; title: string; subject: string; grade: string };

const PATHWAYS: Array<{ id: CandidatePathway; grade: string; label: string; sub: string; badge: string }> = [
    { id: 'KCSE', grade: 'Form 4', label: 'KCSE Candidate Hub', sub: 'Senior Secondary Form 4 Exams', badge: 'National Exam' },
    { id: 'KJSEA', grade: 'Grade 9', label: 'KJSEA Grade 9 Hub', sub: 'Junior Secondary Assessment', badge: 'CBC JSS' },
    { id: 'KPSEA', grade: 'Grade 6', label: 'KPSEA Grade 6 Hub', sub: 'Primary National Assessment', badge: 'Primary CBC' },
];

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedPaperId = searchParams.get('paper');
    const { isRegistered, studentCode, setRole, logout, studentProfile } = useApp();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [pathway, setPathway] = useState<CandidatePathway>('KCSE');
    const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [activeSolutionTab, setActiveSolutionTab] = useState<'ALL' | 'AUDIO' | 'PAPERS' | 'AI_TUTOR' | 'REPAIR'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        let active = true;
        examService.listPublishedExams()
            .then(exams => { if (active) setPublishedExams(exams as unknown as PublishedExam[]); })
            .catch(error => console.error('Could not load public exam catalogue:', error))
            .finally(() => { if (active) setLoadingExams(false); });
        return () => { active = false; };
    }, []);

    const pathwayConfig = PATHWAYS.find(item => item.id === pathway) || PATHWAYS[0];

    const pathwayExams = useMemo(() => publishedExams.filter(exam => {
        const examType = String(exam.exam_type || exam.examType || '').toUpperCase().replace(/[_ -]?STYLE$/, '');
        const gradeMatch = String(exam.grade || '').toLowerCase().includes(pathwayConfig.grade.toLowerCase());
        const searchMatch = !searchQuery || String(exam.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || String(exam.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
        return (examType === pathway || gradeMatch) && searchMatch;
    }), [pathway, pathwayConfig.grade, publishedExams, searchQuery]);

    const startRevision = (openExamId?: string | number, modeOverride?: string) => {
        setRole(UserRole.REVISION);
        if (openExamId) {
            const paper = publishedExams.find(exam => String(exam.id) === String(openExamId)) || pathwayExams[0];
            if (paper) {
                sessionStorage.setItem('soma_pending_exam', JSON.stringify(paper));
                sessionStorage.setItem('soma_pending_exam_id', String(paper.id));
            } else {
                sessionStorage.setItem('soma_pending_exam_id', String(openExamId));
            }
        }
        if (modeOverride) {
            sessionStorage.setItem('soma_revision_intent', modeOverride);
        }
        navigate('/revision/dashboard');
    };

    useEffect(() => {
        if (!requestedPaperId || loadingExams) return;
        startRevision(requestedPaperId);
    }, [requestedPaperId, loadingExams]);

    const openAudioRevision = () => {
        if (!isRegistered) {
            setShowRegister(true);
            return;
        }
        setRole(UserRole.LEARNER);
        navigate('/learner', { state: { targetTab: 'TALKBACK', intent: 'listen_and_learn' } });
    };

    const openAskAkili = () => {
        if (!isRegistered) {
            setShowRegister(true);
            return;
        }
        setRole(UserRole.LEARNER);
        navigate('/learner', { state: { targetTab: 'SMART_TUTOR', intent: 'ask_akili' } });
    };

    const openNotebook = () => {
        if (!isRegistered) {
            setShowRegister(true);
            return;
        }
        setRole(UserRole.LEARNER);
        navigate('/learner', { state: { targetTab: 'NOTEBOOK' } });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            <Helmet>
                <html lang="en" />
                <title>Candidates Exam Hub | KCSE, KPSEA &amp; KJSEA Revision — Somo Smart</title>
                <meta name="description" content="The dedicated candidates hub for Kenyan KCSE, KPSEA &amp; CBC students. Listen to audio notes, practice past papers under exam conditions, and get instant AI exam coaching." />
                <meta name="keywords" content="KCSE candidate revision, KPSEA candidates hub, CBC Grade 9 revision, listen and learn Kenya, KCSE past papers online, Somo Smart exam prep" />

                {/* AIO & Search Engine Optimization */}
                <meta name="smart-search-index" content="index" />
                <meta name="ai-knowledge-base" content="candidates-hub" />
                <meta name="educational-framework" content="KCSE, KPSEA, KJSEA, CBC, KNEC" />
                <meta name="target-audience" content="KCSE Candidates, KPSEA Grade 6, KJSEA Grade 9, Parents &amp; Teachers" />
                <meta name="robots" content="index, follow, max-image-preview:large" />

                {/* OpenGraph */}
                <meta property="og:site_name" content="Somo Smart" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Candidates Exam Hub | KCSE, KPSEA &amp; KJSEA Revision — Somo Smart" />
                <meta property="og:description" content="The dedicated candidates hub for Kenyan students. Listen to audio revision, attempt past papers, and fix weak topics." />
                <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
                <meta property="og:url" content="https://www.somaai.co.ke/revision" />

                <link rel="canonical" href="https://www.somaai.co.ke/revision" />

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        "name": "Somo Smart Candidates Revision Hub",
                        "description": "Comprehensive revision hub for KCSE, KPSEA and KJSEA candidates in Kenya.",
                        "provider": {
                            "@type": "Organization",
                            "name": "Somo Smart",
                            "url": "https://www.somaai.co.ke"
                        },
                        "educationalLevel": ["Form 4 KCSE", "Grade 9 KJSEA", "Grade 6 KPSEA"],
                        "offers": {
                            "@type": "Offer",
                            "price": "20",
                            "priceCurrency": "KES"
                        }
                    })}
                </script>
            </Helmet>

            {/* Header Navbar */}
            <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 py-3.5 sm:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2.5 transition hover:opacity-90"
                    >
                        <img src={logoImg} alt="Somo Smart Logo" className="h-9 w-9 object-contain" />
                        <span className="text-xl font-black text-white">Somo Smart</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                            <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> Candidates Hub
                        </span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/contact')}
                            className="hidden text-xs font-bold text-slate-300 hover:text-white sm:inline-block"
                        >
                            Help (0722763760)
                        </button>

                        {isRegistered ? (
                            <div className="flex items-center gap-3">
                                <div className="hidden text-right sm:block">
                                    <p className="text-xs font-black text-white">{studentProfile?.name?.split(' ')[0] || 'Candidate'}</p>
                                    <p className="text-[10px] font-bold text-indigo-300">{studentCode}</p>
                                </div>
                                <button
                                    onClick={() => startRevision()}
                                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-purple-500 transition-all"
                                >
                                    My Exam Space
                                </button>
                                <button
                                    onClick={() => setShowLogoutModal(true)}
                                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
                                    aria-label="Logout"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="px-3.5 py-2 text-xs font-black text-slate-300 hover:text-white"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => setShowRegister(true)}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-500 transition-colors"
                                >
                                    Start Free
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">

                {/* Hero Banner: Inspiring Candidate Focus */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-10 border border-indigo-800/40 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3.5 py-1 text-xs font-extrabold text-amber-300 border border-amber-400/20">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Exam Success Accelerator
                        </div>

                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
                            Kenyan Candidates <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300">Exam Hub</span>
                        </h1>

                        <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
                            Everything you need to master your national exams. Listen to audio notes on the go, attempt timed past papers, and get instant step-by-step AI coaching for lost marks.
                        </p>

                        {/* Pathway Switcher */}
                        <div className="pt-2 flex flex-wrap gap-2 sm:gap-3">
                            {PATHWAYS.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setPathway(item.id)}
                                    className={`px-5 py-3 rounded-2xl text-left transition-all flex items-center gap-3 ${
                                        pathway === item.id
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40 scale-[1.02]'
                                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                        pathway === item.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-indigo-400'
                                    }`}>
                                        {item.id.slice(0, 2)}
                                    </div>
                                    <div>
                                        <span className="block text-xs font-black">{item.label}</span>
                                        <span className={`block text-[10px] font-bold ${pathway === item.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {item.sub}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Candidate Solution Launchpad Grid (Direct Actions: Audio, Past Papers, AI Tutor, Flashcards) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                                <Zap className="w-6 h-6 text-amber-400 fill-amber-400" /> Candidate Revision Launchpads
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">Choose how you want to revise right now.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* 1. Listen & Learn (Audio Revision) */}
                        <div
                            onClick={openAudioRevision}
                            className="group cursor-pointer rounded-3xl bg-gradient-to-br from-emerald-950/80 to-slate-900 p-6 border border-emerald-800/40 hover:border-emerald-500/80 transition-all hover:-translate-y-1 shadow-lg shadow-emerald-950/20 relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-emerald-500/30">
                                <Headphones className="w-6 h-6" />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-2">
                                <Volume2 className="w-3 h-3" /> Audio Lessons
                            </span>
                            <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                                Listen &amp; Learn
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                                Listen to clear audio notes and formula recaps without staring at a screen.
                            </p>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-emerald-400">
                                <span>Start Listening</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* 2. Timed Exam Past Papers */}
                        <div
                            onClick={() => startRevision(pathwayExams[0]?.id)}
                            className="group cursor-pointer rounded-3xl bg-gradient-to-br from-indigo-950/80 to-slate-900 p-6 border border-indigo-800/40 hover:border-indigo-500/80 transition-all hover:-translate-y-1 shadow-lg shadow-indigo-950/20 relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-indigo-500/30">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 mb-2">
                                <FileText className="w-3 h-3" /> Timed Practice
                            </span>
                            <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                                Timed Past Papers
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                                Practice real KCSE, KPSEA &amp; CBC exam papers under realistic exam timing.
                            </p>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-indigo-400">
                                <span>Attempt Paper</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* 3. Ask Akili AI Exam Coach */}
                        <div
                            onClick={openAskAkili}
                            className="group cursor-pointer rounded-3xl bg-gradient-to-br from-sky-950/80 to-slate-900 p-6 border border-sky-800/40 hover:border-sky-500/80 transition-all hover:-translate-y-1 shadow-lg shadow-sky-950/20 relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-sky-500/30">
                                <Bot className="w-6 h-6" />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 mb-2">
                                <Sparkles className="w-3 h-3 text-sky-400" /> AI Explainer
                            </span>
                            <h3 className="text-lg font-black text-white group-hover:text-sky-300 transition-colors">
                                Ask Akili AI Coach
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                                Stuck on a question? Get instant step-by-step explanations and working.
                            </p>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-sky-400">
                                <span>Ask Question</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        {/* 4. Candidate Notebook & Flashcards */}
                        <div
                            onClick={openNotebook}
                            className="group cursor-pointer rounded-3xl bg-gradient-to-br from-purple-950/80 to-slate-900 p-6 border border-purple-800/40 hover:border-purple-500/80 transition-all hover:-translate-y-1 shadow-lg shadow-purple-950/20 relative overflow-hidden"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-purple-500/30">
                                <Notebook className="w-6 h-6" />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 mb-2">
                                <BookOpen className="w-3 h-3" /> Saved Review
                            </span>
                            <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                                Candidate Notebook
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                                Review saved formulas, notes, and weak topic flashcards before the test.
                            </p>
                            <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-purple-400">
                                <span>Open Notebook</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Published Candidate Exam Library */}
                <div className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase tracking-wider mb-1">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" /> {pathwayConfig.label}
                            </div>
                            <h2 className="text-2xl font-black text-white">
                                Published Exam Papers ({pathwayExams.length})
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">
                                Official papers with complete marking schemes ready to attempt.
                            </p>
                        </div>

                        {/* Search Input & Bank Link */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search subject or topic..."
                                    className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-colors w-48 sm:w-64"
                                />
                            </div>
                            <button
                                onClick={() => navigate('/exam-papers')}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shrink-0"
                            >
                                Full Paper Bank &rarr;
                            </button>
                        </div>
                    </div>

                    {loadingExams ? (
                        <div className="flex justify-center items-center py-16 gap-3 text-slate-400 text-sm font-bold">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            Loading candidate papers...
                        </div>
                    ) : pathwayExams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pathwayExams.map(exam => (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => startRevision(exam.id)}
                                    className="group cursor-pointer rounded-2xl bg-slate-800/80 hover:bg-slate-800 p-5 border border-slate-700/80 hover:border-indigo-500/80 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400">
                                                Ready to attempt
                                            </span>
                                            {exam.duration_minutes && (
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-indigo-400" /> {exam.duration_minutes} min
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
                                            {exam.title}
                                        </h3>

                                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
                                            <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">{exam.subject}</span>
                                            <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">{exam.grade}</span>
                                            {exam.total_marks && (
                                                <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">{exam.total_marks} marks</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-black text-indigo-400 group-hover:text-indigo-300">
                                        <span>Attempt Paper Online</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-14 bg-slate-800/40 rounded-3xl border border-dashed border-slate-700 p-6">
                            <Target className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-white">No papers matching search</h3>
                            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting a different candidate pathway.</p>
                        </div>
                    )}
                </div>

                {/* Telegram Revision Channel & Bot Launcher Banner */}
                <TelegramBanner
                    title="Join 20,000+ Candidates on Telegram"
                    description="Get daily KCSE, KPSEA & CBC revision quizzes, past paper alerts, and AI study tips directly in your Telegram app."
                />

                {/* Direct WhatsApp Support Banner for Candidates */}
                <div className="rounded-3xl bg-gradient-to-r from-emerald-900/50 via-slate-900 to-indigo-950 p-6 border border-emerald-700/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">Need Candidate Study Help or Special Papers?</h3>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Chat directly with our education team on WhatsApp <span className="text-emerald-400 font-bold">0722763760</span> for instant past paper requests or study guidance.
                            </p>
                        </div>
                    </div>
                    <a
                        href="https://wa.me/254722763760?text=Hi%20Somo%20Smart%20Support%2C%20I%20am%20a%20candidate%20and%20need%20assistance%20with%20revision%20papers."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                    >
                        <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                    </a>
                </div>

            </main>

            {/* Login & Register Modals */}
            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                onSuccess={() => startRevision(requestedPaperId || undefined)}
                onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }}
            />
            <RegistrationModal
                isOpen={showRegister}
                onClose={() => setShowRegister(false)}
                onSuccess={() => startRevision(requestedPaperId || undefined)}
                onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }}
                initialRole="STUDENT"
            />
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => { logout(); navigate('/'); }}
                title="Leaving Candidates Hub?"
                message="Your saved attempts and revision progress will be here when you return."
            />
        </div>
    );
};

export default RevisionPortal;
