import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    ArrowRight, Award, BookOpen, Brain, CheckCircle, Clock, FileText,
    Loader2, LogOut, ShieldCheck, Sparkles, Star, Target, Zap,
    Headphones, Volume2, Mic, Flame, CheckCircle2, MessageCircle,
    Trophy, Calendar, Play, Bot, Notebook, ArrowUpRight, Compass,
    SlidersHorizontal, Search, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { LoginModal } from '../../components/LoginModal';
import { RegistrationModal } from '../../components/RegistrationModal';
import { LogoutModal } from '../../components/LogoutModal';
import { examService } from '../../services/examService';
import { TelegramBanner } from '../../components/TelegramBanner';
import { ExamPaperTickerBelt } from '../../components/ExamPaperTickerBelt';
import logoImg from '../../assets/images/main_logo.png';

type CandidatePathway = 'KCSE' | 'KJSEA' | 'KPSEA';
type PublishedExam = Record<string, any> & { id: string | number; title: string; subject: string; grade: string };

const PATHWAYS: Array<{ id: CandidatePathway; grade: string; label: string; sub: string; badge: string }> = [
    { id: 'KCSE', grade: 'Form 4', label: 'KCSE Candidates', sub: 'Senior Secondary (Form 4)', badge: 'National Exam' },
    { id: 'KJSEA', grade: 'Grade 9', label: 'KJSEA Assessment', sub: 'Junior Secondary (Grade 9)', badge: 'CBC JSS' },
    { id: 'KPSEA', grade: 'Grade 6', label: 'KPSEA Assessment', sub: 'Primary Assessment (Grade 6)', badge: 'Primary CBC' },
];

const FILTER_SUBJECTS = [
    'ALL',
    'Mathematics',
    'English',
    'Kiswahili',
    'Biology',
    'Chemistry',
    'Physics',
    'Science',
    'Social Studies',
    'Agriculture',
    'CRE'
];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Mathematics: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Biology: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    Chemistry: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Physics: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    English: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    Kiswahili: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    Science: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    'Social Studies': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    Agriculture: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
    CRE: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    default: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

const inferPathwayFromGrade = (grade?: string): CandidatePathway | null => {
    const normalized = String(grade || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalized) return null;
    if (normalized.includes('grade 6') || normalized === '6') return 'KPSEA';
    if (normalized.includes('grade 9') || normalized === '9') return 'KJSEA';
    if (normalized.includes('form 4') || normalized === '4' || normalized.includes('kcse')) return 'KCSE';
    return null;
};

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedPaperId = searchParams.get('paper');
    const { isRegistered, studentCode, setRole, logout, studentProfile } = useApp();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [pathway, setPathway] = useState<CandidatePathway>('KCSE');
    const [selectedSubject, setSelectedSubject] = useState('ALL');
    const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
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
        const subjectMatch = selectedSubject === 'ALL' || String(exam.subject || '').toLowerCase().includes(selectedSubject.toLowerCase());
        return (examType === pathway || gradeMatch) && searchMatch && subjectMatch;
    }), [pathway, pathwayConfig.grade, publishedExams, searchQuery, selectedSubject]);

    const pathwayCounts = useMemo(() => {
        return PATHWAYS.reduce((acc, item) => {
            acc[item.id] = publishedExams.filter(exam => {
                const examType = String(exam.exam_type || exam.examType || '').toUpperCase().replace(/[_ -]?STYLE$/, '');
                const gradeMatch = String(exam.grade || '').toLowerCase().includes(item.grade.toLowerCase());
                return examType === item.id || gradeMatch;
            }).length;
            return acc;
        }, {} as Record<CandidatePathway, number>);
    }, [publishedExams]);

    useEffect(() => {
        if (loadingExams || publishedExams.length === 0) return;

        const gradePathway = inferPathwayFromGrade(studentProfile?.grade);
        if (gradePathway && gradePathway !== pathway && pathwayCounts[gradePathway] > 0) {
            setPathway(gradePathway);
            return;
        }

        if (pathwayExams.length === 0) {
            const bestPathway = PATHWAYS.find(item => pathwayCounts[item.id] > 0);
            if (bestPathway && bestPathway.id !== pathway) {
                setPathway(bestPathway.id);
            }
        }
    }, [loadingExams, pathway, pathwayCounts, pathwayExams.length, publishedExams.length, studentProfile?.grade]);

    const startRevision = (openExamId?: string | number, modeOverride?: string) => {
        setRole(UserRole.REVISION);
        const search = new URLSearchParams();
        if (openExamId) search.set('paper', String(openExamId));
        if (modeOverride) search.set('mode', modeOverride);
        if (pathway) search.set('pathway', pathway);
        const query = search.toString();
        navigate(`/revision/dashboard${query ? `?${query}` : ''}`);
    };

    const openAudioRevision = () => {
        setRole(UserRole.LEARNER);
        navigate('/learner', { state: { targetTab: 'AUDIO', targetIntent: 'listen_and_learn' } });
    };

    const openAskAkili = () => {
        setRole(UserRole.LEARNER);
        navigate('/learner', { state: { targetTab: 'TUTOR', targetIntent: 'ask_akili' } });
    };

    const openNotebook = () => {
        setRole(UserRole.LEARNER);
        navigate('/learner', { state: { targetTab: 'NOTEBOOK', targetIntent: 'flashcards' } });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-20">
            <Helmet>
                <html lang="en" />
                <title>Candidates Exam Hub | KCSE, KPSEA &amp; CBC Revision — Soma AI</title>
                <meta name="description" content="The dedicated candidates hub for Kenyan KCSE, KPSEA &amp; CBC students. Listen to audio notes, practice past papers under exam conditions, and get instant AI exam coaching." />
                <meta name="keywords" content="KCSE candidate revision, KPSEA candidates hub, CBC Grade 9 revision, listen and learn Kenya, KCSE past papers online, Soma AI exam prep" />

                {/* OpenGraph */}
                <meta property="og:site_name" content="Soma AI" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Candidates Exam Hub | KCSE, KPSEA &amp; KJSEA Revision — Soma AI" />
                <meta property="og:description" content="The dedicated candidates hub for Kenyan students. Listen to audio revision, attempt past papers, and fix weak topics." />
                <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
                <meta property="og:url" content="https://www.somaai.co.ke/revision" />
                <link rel="canonical" href="https://www.somaai.co.ke/revision" />
            </Helmet>

            {/* Clean Light Header Navbar */}
            <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8 shadow-xs">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2.5 transition hover:opacity-90"
                    >
                        <img src={logoImg} alt="Soma AI Logo" className="h-9 w-9 object-contain" />
                        <span className="text-xl font-black text-slate-950">Soma AI</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 border border-indigo-200">
                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> Candidates Hub
                        </span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/contact')}
                            className="hidden text-xs font-bold text-slate-600 hover:text-slate-950 sm:inline-block"
                        >
                            Help (0722763760)
                        </button>

                        {isRegistered ? (
                            <div className="flex items-center gap-3">
                                <div className="hidden text-right sm:block">
                                    <p className="text-xs font-black text-slate-900">{studentProfile?.name?.split(' ')[0] || 'Candidate'}</p>
                                    <p className="text-[10px] font-bold text-indigo-600">{studentCode}</p>
                                </div>
                                <button
                                    onClick={() => startRevision()}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-black shadow-md shadow-indigo-600/20 transition-all"
                                >
                                    My Exam Space
                                </button>
                                <button
                                    onClick={() => setShowLogoutModal(true)}
                                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                                    aria-label="Logout"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="px-3.5 py-2 text-xs font-black text-slate-700 hover:text-slate-950"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => setShowRegister(true)}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-black text-white shadow-sm transition-colors"
                                >
                                    Start Free
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Latest Exam Paper Ticker Belt */}
            <ExamPaperTickerBelt
                papers={publishedExams}
                onPaperClick={(paperId) => startRevision(paperId)}
            />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">

                {/* Compact Hero Banner */}
                <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700 border border-indigo-100">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" /> KNEC Exam Success Accelerator
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                                Candidates <span className="text-indigo-600">Revision Hub</span>
                            </h1>
                            <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                                Access published past papers with complete marking schemes, audio notes, and instant AI step-by-step coaching for KCSE, KJSEA &amp; KPSEA.
                            </p>
                        </div>

                        {/* Pathway Switcher Pills */}
                        <div className="flex flex-wrap gap-2 sm:gap-2.5 shrink-0">
                            {PATHWAYS.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setPathway(item.id)}
                                    className={`px-4 py-2.5 rounded-2xl text-left transition-all flex items-center gap-2.5 ${
                                        pathway === item.id
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                                    }`}
                                >
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                                        pathway === item.id ? 'bg-white/20 text-white' : 'bg-white text-indigo-700 shadow-xs'
                                    }`}>
                                        {item.id.slice(0, 2)}
                                    </div>
                                    <div>
                                        <span className="block text-xs font-black leading-tight">{item.label}</span>
                                        <span className={`block text-[10px] font-semibold ${pathway === item.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                                            {item.badge}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4 Compact Revision Launchpads */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* 1. Listen & Learn */}
                    <div
                        onClick={openAudioRevision}
                        className="group cursor-pointer rounded-2xl bg-white border border-emerald-200/80 hover:border-emerald-500 p-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                                    <Headphones className="w-4 h-4" />
                                </span>
                                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    Audio
                                </span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                                Listen &amp; Learn
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">
                                Audio lessons and formula recaps on the go.
                            </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-black text-emerald-700">
                            <span>Listen now</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>

                    {/* 2. Timed Exam Past Papers */}
                    <div
                        onClick={() => startRevision(pathwayExams[0]?.id)}
                        className="group cursor-pointer rounded-2xl bg-white border border-indigo-200/80 hover:border-indigo-500 p-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
                                    <Clock className="w-4 h-4" />
                                </span>
                                <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                    Timed
                                </span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                                Timed Past Papers
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">
                                Practice real KNEC papers with timer &amp; marking guide.
                            </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-black text-indigo-700">
                            <span>Attempt paper</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>

                    {/* 3. Ask Akili AI Tutor */}
                    <div
                        onClick={openAskAkili}
                        className="group cursor-pointer rounded-2xl bg-white border border-sky-200/80 hover:border-sky-500 p-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-100">
                                    <Bot className="w-4 h-4" />
                                </span>
                                <span className="text-[10px] font-black uppercase text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                                    AI Tutor
                                </span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                                Ask Akili AI
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">
                                Step-by-step solutions for lost marks.
                            </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-black text-sky-700">
                            <span>Ask Akili</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>

                    {/* 4. Candidate Notebook */}
                    <div
                        onClick={openNotebook}
                        className="group cursor-pointer rounded-2xl bg-white border border-purple-200/80 hover:border-purple-500 p-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100">
                                    <Notebook className="w-4 h-4" />
                                </span>
                                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                                    Offline
                                </span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                                Study Notebook
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">
                                Saved notes &amp; flashcard review.
                            </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-black text-purple-700">
                            <span>Open notes</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Published Candidate Exam Library */}
                <div className="space-y-4 pt-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" /> Published Exam Papers
                                <span className="text-xs font-bold text-slate-500">({pathwayExams.length})</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Select a paper below to attempt online or review its official marking guide.
                            </p>
                        </div>

                        {/* Search Bar & Full Bank Link */}
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search subject or paper..."
                                    className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-colors w-44 sm:w-60 shadow-2xs"
                                />
                            </div>
                            <button
                                onClick={() => navigate('/exam-papers')}
                                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-black transition-all shadow-2xs shrink-0"
                            >
                                All Papers &rarr;
                            </button>
                        </div>
                    </div>

                    {/* Quick Subject Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {FILTER_SUBJECTS.map(subj => {
                            const isSelected = selectedSubject === subj;
                            return (
                                <button
                                    key={subj}
                                    onClick={() => setSelectedSubject(subj)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                        isSelected
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    {subj}
                                </button>
                            );
                        })}
                    </div>

                    {/* Compact Visual Exam Grid (4 columns on desktop, 2-3 on tablet/mobile) */}
                    {loadingExams ? (
                        <div className="flex justify-center items-center py-16 gap-3 text-slate-500 text-xs font-bold">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            Loading candidate papers...
                        </div>
                    ) : pathwayExams.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                            {pathwayExams.map(exam => {
                                const colors = SUBJECT_COLORS[exam.subject] || SUBJECT_COLORS.default;
                                return (
                                    <motion.div
                                        key={exam.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => startRevision(exam.id)}
                                        className="group cursor-pointer rounded-2xl bg-white hover:bg-slate-50/80 p-4 border border-slate-200/90 hover:border-indigo-500 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Header tags */}
                                            <div className="flex items-center justify-between gap-1.5 mb-2.5">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                                                    {exam.subject || 'General'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                    {exam.duration_minutes && (
                                                        <span className="flex items-center gap-0.5">
                                                            <Clock className="w-3 h-3 text-slate-400" /> {exam.duration_minutes}m
                                                        </span>
                                                    )}
                                                    {exam.year && (
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                            {exam.year}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Paper Title */}
                                            <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                                                {exam.title}
                                            </h3>

                                            {/* Secondary info */}
                                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                                {exam.grade} {exam.total_marks ? `· ${exam.total_marks} marks` : ''}
                                            </p>
                                        </div>

                                        {/* Action footer */}
                                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-black text-indigo-600 group-hover:text-indigo-700">
                                            <span>Attempt Paper</span>
                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                            <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <h3 className="text-sm font-bold text-slate-800">No papers found</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Try selecting "ALL" subjects or clearing your search term.</p>
                        </div>
                    )}
                </div>

                {/* Telegram & WhatsApp Support Strips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TelegramBanner
                        title="Join 20,000+ Candidates on Telegram"
                        description="Get daily KCSE, KPSEA & CBC revision quizzes and past paper alerts directly in Telegram."
                    />

                    <div className="rounded-2xl bg-white p-5 border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-black text-slate-900">Need Past Papers on WhatsApp?</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Message our study team on <span className="text-emerald-700 font-bold">0722763760</span>.
                                </p>
                            </div>
                        </div>
                        <a
                            href="https://wa.me/254722763760?text=Hi%20Soma%20AI%20Support%2C%20I%20am%20a%20candidate%20and%20need%20assistance%20with%20revision%20papers."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
                        >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                    </div>
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
