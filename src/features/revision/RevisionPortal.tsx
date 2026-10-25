import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    ArrowRight, Award, BookOpen, Brain, CheckCircle, Clock, FileText,
    Loader2, LogOut, ShieldCheck, Sparkles, Star, Target, Zap,
    Headphones, Volume2, Mic, Flame, CheckCircle2, MessageCircle,
    Trophy, Calendar, Play, Bot, Notebook, ArrowUpRight, Compass,
    SlidersHorizontal, Search, Check, Eye, Download, X, Phone, RefreshCw,
    Layers, HelpCircle, CheckSquare, ChevronRight, AlertCircle, BookmarkCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { LoginModal } from '../../components/LoginModal';
import { RegistrationModal } from '../../components/RegistrationModal';
import { LogoutModal } from '../../components/LogoutModal';
import { examService } from '../../services/examService';
import {
    examPaperBankService,
    readPhoneRestoreSession,
    buildExamPaperBundles,
    findBundleForPaper,
    EXAM_PAPER_PRICE_KES,
    EXAM_BUNDLE_PRICE_KES,
    type PhoneRestoreSession,
    type ExamPaperBundle
} from '../../services/examPaperBankService';
import { TelegramBanner } from '../../components/TelegramBanner';
import { ExamPaperTickerBelt } from '../../components/ExamPaperTickerBelt';
import { listTimedExams, type TimedExamRecovery } from './timedExamRecovery';
import logoImg from '../../assets/images/main_logo.png';

type CandidatePathway = 'KCSE' | 'KJSEA' | 'KPSEA';
type PublishedExam = Record<string, any> & { id: string | number; title: string; subject: string; grade: string };

const PATHWAYS: Array<{ id: CandidatePathway; grade: string; label: string; sub: string; badge: string; examName: string }> = [
    { id: 'KCSE', grade: 'Form 4', label: 'KCSE Candidates', sub: 'Senior Secondary (Form 4)', badge: 'National Exam', examName: 'KCSE 2026' },
    { id: 'KJSEA', grade: 'Grade 9', label: 'KJSEA Assessment', sub: 'Junior Secondary (Grade 9)', badge: 'CBC JSS', examName: 'KJSEA 2026' },
    { id: 'KPSEA', grade: 'Grade 6', label: 'KPSEA Assessment', sub: 'Primary Assessment (Grade 6)', badge: 'Primary CBC', examName: 'KPSEA 2026' },
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

// Calculate days remaining to Kenyan exam seasons
const getDaysToExam = (pathway: CandidatePathway): number => {
    const now = new Date();
    // Default national exam target dates (November)
    let target = new Date(now.getFullYear(), 10, 4);
    if (pathway === 'KPSEA') target = new Date(now.getFullYear(), 9, 28);
    if (pathway === 'KJSEA') target = new Date(now.getFullYear(), 10, 10);
    if (target.getTime() < now.getTime()) {
        target = new Date(now.getFullYear() + 1, target.getMonth(), target.getDate());
    }
    const diff = target.getTime() - now.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedPaperId = searchParams.get('paper');
    const { isRegistered, studentCode, setRole, logout, studentProfile, isPro } = useApp();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [pathway, setPathway] = useState<CandidatePathway>('KCSE');
    const [selectedSubject, setSelectedSubject] = useState('ALL');
    const [selectedYear, setSelectedYear] = useState('ALL');
    const [selectedPaperModal, setSelectedPaperModal] = useState<PublishedExam | null>(null);
    const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [catalogError, setCatalogError] = useState('');
    const [catalogAttempt, setCatalogAttempt] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [purchasedPaperIds, setPurchasedPaperIds] = useState<string[]>([]);
    const [hasPassForRequested, setHasPassForRequested] = useState(false);

    // Phone Restore State
    const [phoneSession, setPhoneSession] = useState<PhoneRestoreSession | null>(null);
    const [showPhoneRestoreModal, setShowPhoneRestoreModal] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [restoringPhone, setRestoringPhone] = useState(false);
    const [phoneRestoreMessage, setPhoneRestoreMessage] = useState('');
    const [phoneRestoreError, setPhoneRestoreError] = useState('');

    // Active in-progress timed recovery
    const [activeRecovery, setActiveRecovery] = useState<TimedExamRecovery | null>(null);

    // Load phone session and purchased papers
    useEffect(() => {
        const session = readPhoneRestoreSession();
        if (session) {
            setPhoneSession(session);
            if (Array.isArray(session.paperIds) && session.paperIds.length > 0) {
                setPurchasedPaperIds(prev => Array.from(new Set([...prev, ...session.paperIds.map(String)])));
            }
        }

        let active = true;
        examPaperBankService.listPurchasedPaperIds()
            .then(ids => {
                if (active && Array.isArray(ids)) {
                    setPurchasedPaperIds(prev => Array.from(new Set([...prev, ...ids.map(String)])));
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, []);

    // Check for in-progress timed exam drafts for the active student
    useEffect(() => {
        const owner = studentCode || studentProfile?.id || 'guest';
        const exams = listTimedExams(owner);
        if (exams.length > 0) {
            setActiveRecovery(exams[0]);
        }
    }, [studentCode, studentProfile?.id]);

    useEffect(() => {
        let active = true;
        setLoadingExams(true);
        setCatalogError('');
        examService.listPublishedExams()
            .then(exams => { if (active) setPublishedExams(exams as unknown as PublishedExam[]); })
            .catch(error => {
                console.error('Could not load public exam catalogue:', error);
                if (active) setCatalogError('We could not load the paper catalogue. Check your connection and try again.');
            })
            .finally(() => { if (active) setLoadingExams(false); });
        return () => { active = false; };
    }, [catalogAttempt]);

    const pathwayConfig = PATHWAYS.find(item => item.id === pathway) || PATHWAYS[0];

    const availableYears = useMemo(() => {
        const set = new Set<string>();
        publishedExams.forEach(e => {
            if (e.year) set.add(String(e.year));
        });
        return ['ALL', ...Array.from(set).sort((a, b) => b.localeCompare(a))];
    }, [publishedExams]);

    const pathwayExams = useMemo(() => publishedExams.filter(exam => {
        const examType = String(exam.exam_type || exam.examType || '').toUpperCase().replace(/[_ -]?STYLE$/, '');
        const gradeMatch = String(exam.grade || '').toLowerCase().includes(pathwayConfig.grade.toLowerCase());
        const searchMatch = !searchQuery || String(exam.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || String(exam.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
        const subjectMatch = selectedSubject === 'ALL' || String(exam.subject || '').toLowerCase().includes(selectedSubject.toLowerCase());
        const yearMatch = selectedYear === 'ALL' || String(exam.year || '') === selectedYear;
        return (examType === pathway || gradeMatch) && searchMatch && subjectMatch && yearMatch;
    }), [pathway, pathwayConfig.grade, publishedExams, searchQuery, selectedSubject, selectedYear]);

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

    // Bundle Partitioning
    const allBundles = useMemo(() => {
        return buildExamPaperBundles(publishedExams as any);
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

    const purchasedPapersList = useMemo(() => {
        if (purchasedPaperIds.length === 0 || publishedExams.length === 0) return [];
        return publishedExams.filter(exam => purchasedPaperIds.includes(String(exam.id)));
    }, [purchasedPaperIds, publishedExams]);

    // Auto-open requested paper from ?paper=...
    useEffect(() => {
        if (!requestedPaperId || publishedExams.length === 0) return;
        const match = publishedExams.find(p => String(p.id) === String(requestedPaperId));
        if (match) {
            setSelectedPaperModal(match);
            const pType = inferPathwayFromGrade(match.grade);
            if (pType) setPathway(pType);
        }
    }, [requestedPaperId, publishedExams]);

    // Check pass entitlement for modal paper
    useEffect(() => {
        if (!selectedPaperModal?.id) {
            setHasPassForRequested(false);
            return;
        }
        const paperIdStr = String(selectedPaperModal.id);
        if (purchasedPaperIds.includes(paperIdStr)) {
            setHasPassForRequested(true);
            return;
        }
        let active = true;
        examPaperBankService.getAccess(selectedPaperModal.id)
            .then(acc => {
                if (active && (acc.paid || acc.canStudy)) {
                    setHasPassForRequested(true);
                    setPurchasedPaperIds(prev => Array.from(new Set([...prev, paperIdStr])));
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, [selectedPaperModal?.id, purchasedPaperIds]);

    const startRevision = (examOrId?: PublishedExam | string | number) => {
        setRole(UserRole.LEARNER);
        let targetExam: any = null;
        if (examOrId && typeof examOrId === 'object') {
            targetExam = {
                id: examOrId.id,
                title: examOrId.title,
                grade: examOrId.grade,
                subject: examOrId.subject,
                term: examOrId.term,
                exam_type: examOrId.exam_type || examOrId.examType
            };
        } else if (examOrId) {
            const found = publishedExams.find(p => String(p.id) === String(examOrId));
            if (found) {
                targetExam = {
                    id: found.id,
                    title: found.title,
                    grade: found.grade,
                    subject: found.subject,
                    term: found.term,
                    exam_type: found.exam_type || found.examType
                };
            } else {
                targetExam = { id: examOrId };
            }
        }
        navigate('/learner', {
            state: {
                targetTab: 'REVISION',
                targetExam
            }
        });
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

    const handleRestorePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneInput.trim()) return;
        setRestoringPhone(true);
        setPhoneRestoreError('');
        setPhoneRestoreMessage('');
        try {
            const session = await examPaperBankService.restoreByPhone(phoneInput.trim());
            if (session.found && session.paperIds.length > 0) {
                setPhoneSession(session);
                setPurchasedPaperIds(prev => Array.from(new Set([...prev, ...session.paperIds.map(String)])));
                setPhoneRestoreMessage(
                    session.passActive
                        ? `Restored ${session.paperIds.length} paper(s) & 24h AI Pass (${session.hoursRemaining}h remaining).`
                        : `Restored ${session.paperIds.length} paper(s). Pass expired — renew for KES 20.`
                );
                setTimeout(() => setShowPhoneRestoreModal(false), 2000);
            } else {
                setPhoneRestoreError('No paid papers found for this number. Check that you used the exact M-Pesa number.');
            }
        } catch (err: any) {
            setPhoneRestoreError(err?.message || 'Verification failed. Please retry.');
        } finally {
            setRestoringPhone(false);
        }
    };

    const daysToExam = getDaysToExam(pathway);
    const activeTimedPaper = activeRecovery
        ? publishedExams.find(p => String(p.id) === String(activeRecovery.examId))
        : null;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-24">
            <Helmet>
                <html lang="en" />
                <title>Candidates Exam Hub | KCSE, KPSEA &amp; CBC Revision — Soma AI</title>
                <meta name="description" content="The dedicated candidates hub for Kenyan KCSE, KPSEA &amp; CBC students. Listen to audio notes, practice past papers under exam conditions, and get instant AI exam coaching." />
                <meta name="keywords" content="KCSE candidate revision, KPSEA candidates hub, CBC Grade 9 revision, listen and learn Kenya, KCSE past papers online, Soma AI exam prep" />
                <meta property="og:site_name" content="Soma AI" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Candidates Exam Hub | KCSE, KPSEA &amp; KJSEA Revision — Soma AI" />
                <meta property="og:description" content="The dedicated candidates hub for Kenyan students. Listen to audio revision, attempt past papers, and fix weak topics." />
                <link rel="canonical" href="https://www.somaai.co.ke/revision" />
            </Helmet>

            {/* Top Navigation & Status Bar */}
            <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl px-4 py-2.5 sm:px-8 shadow-xs">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                    {/* Brand Logo & Hub Badge */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2.5 transition hover:opacity-90 shrink-0"
                    >
                        <img src={logoImg} alt="Soma AI Logo" className="h-8 w-8 object-contain" />
                        <span className="text-lg font-black text-slate-950 tracking-tight">Soma AI</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 border border-indigo-200">
                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> Candidates Hub
                        </span>
                    </button>

                    {/* Integrated Pathway Selector Pills */}
                    <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                        {PATHWAYS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setPathway(item.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                                    pathway === item.id
                                        ? 'bg-indigo-600 text-white shadow-xs scale-[1.02]'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <span>{item.id}</span>
                                <span className={`text-[10px] font-semibold opacity-85`}>({item.grade})</span>
                            </button>
                        ))}
                    </div>

                    {/* Right Controls: Phone Pass Badge & Account */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {phoneSession && phoneSession.passActive ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black shadow-2xs">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="hidden sm:inline">24h Pass Active</span>
                                <span className="text-emerald-700">· 0{phoneSession.last9.slice(-4)}</span>
                                <span className="bg-emerald-200/70 text-emerald-950 px-1.5 py-0.2 rounded text-[10px]">
                                    {phoneSession.hoursRemaining}h
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowPhoneRestoreModal(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-black transition-colors shadow-2xs"
                            >
                                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="hidden sm:inline">Have a 24h Pass? Restore</span>
                                <span className="sm:hidden">Restore Pass</span>
                            </button>
                        )}

                        {isRegistered ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => startRevision()}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-black shadow-xs transition-all"
                                >
                                    My Desk
                                </button>
                                <button
                                    onClick={() => setShowLogoutModal(true)}
                                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                                    aria-label="Logout"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLogin(true)}
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-black text-white shadow-xs transition-colors"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Pathway Selector */}
                <div className="flex md:hidden items-center justify-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
                    {PATHWAYS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setPathway(item.id)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all text-center ${
                                pathway === item.id
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                            {item.id} ({item.grade})
                        </button>
                    ))}
                </div>
            </header>

            <ExamPaperTickerBelt
                papers={publishedExams}
                onPaperClick={(paperId) => startRevision(publishedExams.find(p => p.id === paperId))}
            />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-7">

                {/* ACTION-FIRST SPLIT HERO */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    
                    {/* LEFT COLUMN (7 Cols): Candidate Mission Control & Resume Drill */}
                    <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs">
                        <div className="space-y-4">
                            {/* Exam Countdown & Badge */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 border border-indigo-100">
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{pathwayConfig.examName} Readiness</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{daysToExam} Days Remaining</span>
                                </div>
                            </div>

                            {/* Headline */}
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                                    Conquer {pathwayConfig.label} with{' '}
                                    <span className="text-indigo-600">Official Past Papers</span>
                                </h1>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                                    Practise real KNEC past papers under strict timer conditions, check exact marking schemes, and get step-by-step scoring from Akili AI.
                                </p>
                            </div>

                            {/* Resume Card or Recommended Drill */}
                            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/50 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                                        <Sparkles className="w-3 h-3 text-indigo-600" />
                                        {activeTimedPaper ? 'In-Progress Timed Attempt' : 'Recommended Daily Timed Drill'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">
                                        {activeTimedPaper ? 'Auto-Saved Draft' : 'Full 120-Min Paper'}
                                    </span>
                                </div>
                                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                                    {activeTimedPaper
                                        ? activeTimedPaper.title
                                        : (pathwayExams[0]?.title || `${pathway} Mathematics Paper 1`)}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    {activeTimedPaper
                                        ? `Progress: ${activeRecovery?.questionIds?.length || 0} questions assigned · Saved locally.`
                                        : 'Experience standard exam timing with immediate mark breakdown and step feedback.'}
                                </p>
                                <div className="mt-3.5 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => startRevision(activeTimedPaper || pathwayExams[0]?.id)}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span>{activeTimedPaper ? 'Resume Timed Exam' : 'Start Timed Exam'}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/exam-papers')}
                                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs py-2.5 px-3.5 rounded-xl transition-colors"
                                    >
                                        Paper Bank
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4 Launchpad Micro-pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-2 border-t border-slate-100">
                            <button
                                onClick={openAudioRevision}
                                className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-left transition-colors group"
                            >
                                <Headphones className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                                <p className="text-xs font-black text-slate-900 leading-tight">Listen &amp; Learn</p>
                                <p className="text-[10px] text-slate-500">Audio notes</p>
                            </button>
                            <button
                                onClick={() => startRevision(pathwayExams[0]?.id)}
                                className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-left transition-colors group"
                            >
                                <Clock className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                                <p className="text-xs font-black text-slate-900 leading-tight">Timed Papers</p>
                                <p className="text-[10px] text-slate-500">Exam mode</p>
                            </button>
                            <button
                                onClick={openAskAkili}
                                className="p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 text-left transition-colors group"
                            >
                                <Bot className="w-4 h-4 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
                                <p className="text-xs font-black text-slate-900 leading-tight">Ask Akili</p>
                                <p className="text-[10px] text-slate-500">Step tutor</p>
                            </button>
                            <button
                                onClick={openNotebook}
                                className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-300 text-left transition-colors group"
                            >
                                <Notebook className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                                <p className="text-xs font-black text-slate-900 leading-tight">Notebook</p>
                                <p className="text-[10px] text-slate-500">Flashcards</p>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (5 Cols): Live Vector SVG Question & Rubric Spotlight */}
                    <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                        <div>
                            {/* Spotlight Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                                    Vector SVG &amp; Marking Rubric
                                </span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Official KNEC Standard
                                </span>
                            </div>

                            {/* Sample Circle Theorem / Electric Circuit Vector SVG */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col items-center">
                                <svg
                                    viewBox="0 0 340 160"
                                    className="w-full h-auto max-h-36 object-contain"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle cx="140" cy="80" r="55" fill="#f1f5f9" stroke="#1e293b" strokeWidth="2.5" />
                                    <circle cx="140" cy="80" r="3" fill="#4338ca" />
                                    <text x="132" y="75" fontSize="11" fontWeight="bold" fill="#312e81">O</text>
                                    <line x1="280" y1="80" x2="140" y2="25" stroke="#0284c7" strokeWidth="2" />
                                    <line x1="280" y1="80" x2="140" y2="135" stroke="#0284c7" strokeWidth="2" />
                                    <line x1="140" y1="80" x2="140" y2="25" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" />
                                    <line x1="140" y1="80" x2="140" y2="135" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" />
                                    <rect x="140" y="25" width="8" height="8" fill="none" stroke="#e11d48" strokeWidth="1.2" />
                                    <rect x="140" y="127" width="8" height="8" fill="none" stroke="#e11d48" strokeWidth="1.2" />
                                    <text x="286" y="84" fontSize="11" fontWeight="bold" fill="#0f172a">T</text>
                                    <text x="135" y="18" fontSize="11" fontWeight="bold" fill="#0f172a">A</text>
                                    <text x="135" y="152" fontSize="11" fontWeight="bold" fill="#0f172a">B</text>
                                    <text x="245" y="74" fontSize="10" fontWeight="bold" fill="#475569">48°</text>
                                </svg>
                                <p className="text-[11px] font-bold text-slate-800 text-center mt-1">
                                    Question: TA &amp; TB are tangents. Calculate angle AOB. <span className="text-indigo-600">(3 Marks)</span>
                                </p>
                            </div>

                            {/* Step-by-Step Marking Breakdown */}
                            <div className="mt-3 space-y-1.5">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Akili AI Marking Rubric:</p>
                                <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2 rounded-xl text-xs">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-[11px] text-slate-800 leading-tight">
                                        <span className="font-bold">Step 1:</span> Radii OA ⊥ TA, OB ⊥ TB (tangent theorem, 90°)
                                        <span className="ml-1 text-[10px] font-black text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-300">[1 mk]</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2 rounded-xl text-xs">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-[11px] text-slate-800 leading-tight">
                                        <span className="font-bold">Step 2:</span> Angles in quad OATB = 360° (360° - 180° - 48°)
                                        <span className="ml-1 text-[10px] font-black text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-300">[1 mk]</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-200/80 p-2 rounded-xl text-xs">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-[11px] text-slate-800 leading-tight">
                                        <span className="font-bold">Step 3:</span> Angle AOB = 132° (final answer with units)
                                        <span className="ml-1 text-[10px] font-black text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-300">[1 mk]</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 font-medium">Clear coordinate geometry, zero AI distortion.</span>
                            <button
                                type="button"
                                onClick={() => startRevision(pathwayExams[0]?.id)}
                                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                <span>Try Interactive Practice</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* MY REVISION DESK & UNLOCKED PAPERS / BUNDLES SHELF */}
                {purchasedPapersList.length > 0 ? (
                    <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-indigo-950 border border-emerald-500/40 p-5 sm:p-6 text-white shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider mb-1">
                                    <Sparkles className="w-3 h-3 text-emerald-400" /> Free 24h AI Revision Pass Active
                                </div>
                                <h2 className="text-lg sm:text-xl font-black text-white">Your Unlocked Revision Papers &amp; Bundles</h2>
                                <p className="text-xs text-emerald-100/80">Interactive timed practice, instant step-by-step Akili marking, and official schemes are ready.</p>
                            </div>
                            <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 self-start sm:self-auto text-emerald-200">
                                {purchasedPapersList.length} {purchasedPapersList.length === 1 ? 'Paper Unlocked' : 'Papers Unlocked'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {purchasedPapersList.map(paper => (
                                <div key={paper.id} className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-300 mb-1.5">
                                            <span>{paper.subject}</span>
                                            <span className="bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">24h Pass Active</span>
                                        </div>
                                        <h3 className="text-sm font-black text-white line-clamp-2 leading-snug">{paper.title}</h3>
                                        <p className="text-[11px] text-slate-300 mt-1">{paper.grade} {paper.year ? `· ${paper.year}` : ''}</p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => startRevision(paper)}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            <span>Start AI Exam</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/exam-papers/${encodeURIComponent(String(paper.id))}/read?source=scheme`)}
                                            className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors"
                                        >
                                            Scheme
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-indigo-200 bg-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                                <BookmarkCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900">
                                    Unlock Any KNEC Paper for KES {EXAM_PAPER_PRICE_KES} or Get a 7-Subject Bundle for KES {EXAM_BUNDLE_PRICE_KES}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Every paper unlock includes the complete official marking scheme + 24 Hours Unlimited AI Tutor Pass for your phone.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowPhoneRestoreModal(true)}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors"
                            >
                                Restore Purchases
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/exam-papers')}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-colors shadow-xs"
                            >
                                Browse Paper Bank &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* PUBLISHED CANDIDATE EXAM LIBRARY */}
                <div className="space-y-4 pt-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" /> Published Exam Papers
                                <span className="text-xs font-bold text-slate-500">({pathwayExams.length})</span>
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Select a published paper below to attempt online or review its available marking guide.
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
                                Full Paper Bank &rarr;
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar: Subjects & Years */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
                            {FILTER_SUBJECTS.map(subject => (
                                <button
                                    key={subject}
                                    onClick={() => setSelectedSubject(subject)}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                        selectedSubject === subject
                                            ? 'bg-slate-900 text-white shadow-2xs'
                                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                    {subject}
                                </button>
                            ))}
                        </div>

                        {availableYears.length > 2 && (
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Year:</span>
                                {availableYears.slice(0, 5).map(year => (
                                    <button
                                        key={year}
                                        onClick={() => setSelectedYear(year)}
                                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                                            selectedYear === year
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Paper Cards Grid */}
                    {loadingExams ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse p-4 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="w-16 h-4 bg-slate-200 rounded" />
                                        <div className="w-48 h-5 bg-slate-200 rounded" />
                                    </div>
                                    <div className="w-full h-8 bg-slate-200 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : pathwayExams.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pathwayExams.map(paper => {
                                const subjectColor = SUBJECT_COLORS[paper.subject] || SUBJECT_COLORS.default;
                                const isUnlocked = purchasedPaperIds.includes(String(paper.id));
                                const paperBundle = findBundleForPaper(paper.id, allBundles);

                                return (
                                    <motion.div
                                        key={paper.id}
                                        whileHover={{ y: -2 }}
                                        className="group rounded-2xl bg-white border border-slate-200 hover:border-indigo-400/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${subjectColor.bg} ${subjectColor.text} ${subjectColor.border}`}>
                                                    {paper.subject}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {paper.year && (
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                            {paper.year}
                                                        </span>
                                                    )}
                                                    {isUnlocked && (
                                                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                            Unlocked
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                                                {paper.title}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-semibold text-slate-500">
                                                {paper.duration_minutes && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        {paper.duration_minutes}m
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 text-emerald-700">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    Official Scheme
                                                </span>
                                                {paperBundle && (
                                                    <span className="text-[10px] font-bold text-indigo-600">
                                                        In Set: {paperBundle.bundleCode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action footer */}
                                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[11px] font-black text-slate-700">
                                                {isUnlocked ? 'Ready to Practise' : `KES ${EXAM_PAPER_PRICE_KES}`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPaperModal(paper)}
                                                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                            >
                                                <span>{isUnlocked ? 'Launch Exam' : 'Preview & Attempt'}</span>
                                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                            <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <h3 className="text-sm font-bold text-slate-800">No papers found</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Try selecting &quot;ALL&quot; subjects or clearing your search term.</p>
                        </div>
                    )}
                </div>

                {/* Telegram & WhatsApp Support Strips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    <TelegramBanner
                        theme="light"
                        title="Join 20,000+ Candidates on Telegram"
                        description="Get daily KCSE, KPSEA & CBC revision quizzes and past paper alerts directly in Telegram."
                    />

                    <div className="rounded-2xl bg-white p-5 border border-emerald-200/90 shadow-2xs flex flex-col justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-200 mt-0.5">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                                    <Sparkles className="w-3 h-3 text-emerald-600" /> Direct Study Helpline
                                </div>
                                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                    Need Past Papers or Notes on WhatsApp?
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                                    Chat with our revision team on <span className="text-emerald-700 font-bold">0722763760</span> for direct past paper delivery or study guidance.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <a
                                href="https://wa.me/254722763760?text=Hi%20Soma%20AI%20Support%2C%20I%20am%20a%20candidate%20and%20need%20assistance%20with%20revision%20papers."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Chat on WhatsApp</span>
                            </a>
                            <button
                                onClick={() => navigate('/contact')}
                                className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-200 transition-all inline-flex items-center gap-1.5"
                            >
                                <span>Support Desk</span>
                            </button>
                        </div>
                    </div>
                </div>

            </main>

            {/* Phone Number 24h Pass Restore Modal */}
            <AnimatePresence>
                {showPhoneRestoreModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-6"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900">Restore 24-Hour Pass &amp; Papers</h3>
                                </div>
                                <button
                                    onClick={() => setShowPhoneRestoreModal(false)}
                                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                                Enter the M-Pesa phone number used when buying any exam paper or bundle. We will restore your papers and your active 24-Hour AI Revision Pass on this device.
                            </p>

                            <form onSubmit={handleRestorePhoneSubmit} className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        M-Pesa Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="0722... or 254..."
                                        value={phoneInput}
                                        onChange={(e) => setPhoneInput(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 transition"
                                        autoFocus
                                    />
                                </div>

                                {phoneRestoreMessage && (
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>{phoneRestoreMessage}</span>
                                    </div>
                                )}

                                {phoneRestoreError && (
                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                        <span>{phoneRestoreError}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPhoneRestoreModal(false)}
                                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={restoringPhone || !phoneInput.trim()}
                                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-xs flex items-center justify-center gap-1"
                                    >
                                        {restoringPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Restore Access'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Paper Quick Action & Preview Modal */}
            <AnimatePresence>
                {selectedPaperModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="p-6 bg-slate-50 border-b border-slate-200/80 relative">
                                <button
                                    onClick={() => setSelectedPaperModal(null)}
                                    className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        {selectedPaperModal.subject}
                                    </span>
                                    {selectedPaperModal.year && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                                            {selectedPaperModal.year}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-500">
                                        {selectedPaperModal.grade}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                                    {selectedPaperModal.title}
                                </h3>
                                <div className="flex items-center gap-4 mt-3 text-xs font-bold text-slate-500">
                                    {selectedPaperModal.duration_minutes && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedPaperModal.duration_minutes} Minutes
                                        </span>
                                    )}
                                    {selectedPaperModal.total_marks && (
                                        <span className="flex items-center gap-1">
                                            <Award className="w-3.5 h-3.5 text-amber-500" /> {selectedPaperModal.total_marks} Marks
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-emerald-600">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Marking Scheme Available
                                    </span>
                                </div>
                            </div>

                            {/* Modal Action Options */}
                            <div className="p-6 space-y-3">
                                {(hasPassForRequested || purchasedPaperIds.includes(String(selectedPaperModal.id))) && (
                                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 text-emerald-950 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-emerald-900">24-Hour Free AI Revision Pass Active</p>
                                            <p className="text-[11px] text-emerald-700">Full exam questions, official marking scheme, and Akili AI method grading are unlocked.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Option 1: AI Interactive Practice */}
                                <button
                                    onClick={() => {
                                        const paper = selectedPaperModal;
                                        setSelectedPaperModal(null);
                                        startRevision(paper);
                                    }}
                                    className={`w-full p-4 rounded-2xl text-white text-left transition-all shadow-md flex items-center justify-between group ${
                                        hasPassForRequested || purchasedPaperIds.includes(String(selectedPaperModal.id))
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold shrink-0">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white leading-tight">
                                                {hasPassForRequested || purchasedPaperIds.includes(String(selectedPaperModal.id))
                                                    ? 'Launch Timed Exam with AI Coach (Pass Active)'
                                                    : 'Attempt Online with AI Coach'}
                                            </p>
                                            <p className="text-[11px] text-indigo-100 font-medium mt-0.5">
                                                Timed quiz mode, instant scoring &amp; Akili step-by-step guidance.
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
                                </button>

                                {/* Option 2: Reader Preview */}
                                <button
                                    onClick={() => {
                                        const paperId = selectedPaperModal.id;
                                        setSelectedPaperModal(null);
                                        navigate(`/exam-papers/${encodeURIComponent(String(paperId))}/read`);
                                    }}
                                    className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-left transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                                            <Eye className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-tight">
                                                Preview Paper &amp; Scheme
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                Read the paper and check whether a marking scheme is available.
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                                </button>

                                {/* Option 3: Full Paper Bank Download */}
                                <button
                                    onClick={() => {
                                        const paperId = selectedPaperModal.id;
                                        setSelectedPaperModal(null);
                                        navigate(`/exam-papers?paper=${encodeURIComponent(String(paperId))}`);
                                    }}
                                    className="w-full p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-left transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-700">
                                            View in Exam Paper Bank (PDF Download)
                                        </span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
