import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Upload, BookOpen, Brain, ArrowRight, ScanLine, X,
    CheckCircle, LogOut, Search, FileText, ChevronRight, GraduationCap,
    Sparkles, MessageCircle, MoreHorizontal, Target, Lightbulb
} from 'lucide-react';
import { ViewState, RevisionMode, TeacherActivity } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LogoutModal } from '../../components/LogoutModal';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ExamGuruPanel } from './ExamGuruPanel';
import { LoginModal } from '../../components/LoginModal';

const SUBJECT_TIPS: Record<string, { tip: string; trap: string }> = {
    'Mathematics':      { tip: 'Always show full working — even a wrong answer gets method marks if steps are shown.', trap: 'Writing only the final answer loses all marks if it is wrong.' },
    'Biology':          { tip: 'Label diagrams fully — each missing label costs a mark. Use scientific names correctly.', trap: 'Writing "it moves" instead of the scientific process name scores 0.' },
    'Chemistry':        { tip: 'Balance equations and always include state symbols (s), (l), (g), (aq) in P1 and P2.', trap: 'P3 practical: recording wrong units or skipping observations costs big marks.' },
    'Physics':          { tip: 'State the formula first, substitute values, then calculate — KNEC awards marks at each step.', trap: 'Forgetting units in the final answer loses the last mark even if the number is right.' },
    'English':          { tip: 'Essay: write a clear introduction (2 marks), 3 developed paragraphs (12 marks), conclusion (2 marks). Spelling counts.', trap: 'Point-only answers with no illustration score half marks in P2 comprehension.' },
    'Kiswahili':        { tip: 'Tumia lugha ya kawaida ya fasihi — usandae maneno ya kizungu. Muundo wa insha: utangulizi, mwili, hitimisho.', trap: 'Kutokujibu swali moja kunaathiri alama zako sana — jabu kila swali.' },
    'History':          { tip: 'PEEL structure: Point, Evidence, Explain, Link. Each point should be a separate paragraph.', trap: 'Writing long paragraphs without clear points — examiners award one mark per distinct point.' },
    'Geography':        { tip: 'Sketch maps and diagrams must be labelled and titled — they earn separate marks.', trap: 'Vague answers like "it rains a lot" instead of naming the specific climate process.' },
    'CRE':              { tip: 'Quote scripture references accurately — they earn marks independently of your explanation.', trap: 'Telling a Bible story without linking it to the lesson/theme asked loses half the marks.' },
    'Agriculture':      { tip: 'When asked about crop diseases, name the causal organism AND the control method for full marks.', trap: 'Writing generic controls like "spray pesticides" without naming the pesticide type.' },
    'Business Studies': { tip: 'Definitions must include all key elements — incomplete definitions score 0.', trap: 'Advantages/disadvantages: write distinct points, not paraphrases of the same idea.' },
};

interface Props {
    onStartSession: (data: File | TeacherActivity, mode: RevisionMode) => void;
    onNavigate: (view: ViewState) => void;
    onBack?: () => void;
}

export const RevisionLanding: React.FC<Props> = ({ onStartSession, onNavigate, onBack }) => {
    const {
        logout, availableQuizzes, fetchAvailableQuizzes, isOnline,
        studentProfile, resources, fetchResources, weakTopics,
        masteryGraph, educationLevel, role, revisionUsageCount
    } = useApp();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeSubject, setActiveSubject] = useState<string>('All');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [showGuru, setShowGuru] = useState(false);
    const [loadingResources, setLoadingResources] = useState(false);
    const [overflowItem, setOverflowItem] = useState<any>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Fetch on mount
    React.useEffect(() => {
        if (isOnline) {
            setLoadingResources(true);
            Promise.all([fetchAvailableQuizzes(), fetchResources()])
                .finally(() => setLoadingResources(false));
        }
    }, [isOnline]);

    React.useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [stream]);

    // All resources merged
    const allItems = useMemo(() => {
        const typed = resources.map(r => ({
            ...r,
            _type: r.type === 'SYLLABUS' ? 'syllabus'
                : (r.title?.toLowerCase().includes('paper') || r.title?.toLowerCase().includes('kcse') || r.title?.toLowerCase().includes('kpsea') || r.title?.toLowerCase().includes('mock'))
                    ? 'paper' : 'notes'
        }));
        return typed;
    }, [resources]);

    const subjects = useMemo(() => {
        const s = new Set(allItems.map(r => r.subject).filter(Boolean));
        const uniqueSubjects = Array.from(s).filter(sub => sub.toLowerCase() !== 'all');
        return ['All', ...uniqueSubjects];
    }, [allItems]);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            const matchSub = activeSubject === 'All' || item.subject === activeSubject;
            const q = searchQuery.toLowerCase();
            const matchQ = !q || item.title?.toLowerCase().includes(q) || item.subject?.toLowerCase().includes(q);
            return matchSub && matchQ;
        });
    }, [allItems, activeSubject, searchQuery]);

    const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
        paper: { label: 'Past Paper', icon: <FileText className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' },
        notes: { label: 'Notes', icon: <BookOpen className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
        syllabus: { label: 'Syllabus', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
    };

    // Camera helpers
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            setShowCamera(true);
            setTimeout(() => {
                if (videoRef.current) { videoRef.current.srcObject = mediaStream; videoRef.current.play(); }
            }, 100);
        } catch { alert('Could not access camera. Please allow permissions.'); }
    };

    const stopCamera = () => {
        stream?.getTracks().forEach(t => t.stop());
        setStream(null);
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const v = videoRef.current;
            const c = canvasRef.current;
            c.width = v.videoWidth; c.height = v.videoHeight;
            c.getContext('2d')?.drawImage(v, 0, 0);
            c.toBlob(blob => {
                if (blob) {
                    stopCamera();
                    onStartSession(new File([blob], `scan-${Date.now()}.png`, { type: 'image/png' }), RevisionMode.LEARN);
                }
            }, 'image/png');
        }
    };

    const weakCount = weakTopics.length;
    const hasHistory = weakCount > 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
            <Helmet>
                <title>Revision Hub | Somo Smart — KCSE &amp; KPSEA Exam Prep</title>
                <meta name="description" content="AI-powered exam prep: scan questions, access past papers, get instant guidance from Exam Guru." />
            </Helmet>

            {/* ── HEADER ── */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack || (() => onNavigate(ViewState.DASHBOARD))}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                        >
                            <ArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        <div>
                            <p className="font-black text-slate-900 dark:text-white text-base leading-none">Revision Hub</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                {studentProfile?.name?.split(' ')[0] || 'Candidate'} · {studentProfile?.grade || 'All Grades'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-8">

                {/* ── ZONE 1: HERO ACTION BAR ── */}
                <section className="grid grid-cols-3 gap-3">
                    {/* Scan */}
                    <button
                        onClick={startCamera}
                        className="flex flex-col items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white p-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <ScanLine className="w-6 h-6" />
                        <span className="text-xs font-black leading-tight text-center">Scan<br/>Question</span>
                    </button>

                    {/* Upload */}
                    <label className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 active:scale-95 text-slate-500 dark:text-slate-400 p-4 rounded-2xl transition-all cursor-pointer">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs font-black leading-tight text-center">Upload<br/>Paper</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) onStartSession(f, RevisionMode.LEARN);
                            }}
                        />
                    </label>

                    {/* Ask Exam Guru */}
                    <button
                        onClick={() => setShowGuru(true)}
                        className="flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white p-4 rounded-2xl transition-all shadow-lg shadow-purple-200 dark:shadow-none relative"
                    >
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping absolute" />
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </div>
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-xs font-black leading-tight text-center">Ask<br/>Exam Guru</span>
                    </button>
                </section>

                {/* ── ZONE 2: FOCUS AREA ── */}
                <section>
                    {hasHistory ? (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-rose-500" />
                                    <h2 className="font-black text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Your Weak Areas</h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus here first</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {weakTopics.slice(0, 3).map((topic, i) => {
                                    const score = masteryGraph[topic] || 0;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSearchQuery(topic)}
                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 rounded-2xl p-4 text-left transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">{score}%</span>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-400 transition-colors" />
                                            </div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{topic}</p>
                                            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-rose-400 rounded-full"
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* First-time candidate: explain how to start */
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900 dark:text-white text-sm mb-1">Where do I start?</h2>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    <strong className="text-indigo-600 dark:text-indigo-400">Scan</strong> a past paper question for instant AI help, 
                                    <strong className="text-purple-600 dark:text-purple-400"> ask Exam Guru</strong> for exam strategy, 
                                    or browse resources below and tap any to start studying.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* ── ZONE 3: RESOURCE BROWSER ── */}
                <section>
                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search papers, notes, syllabus..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-300 dark:focus:border-indigo-700 outline-none transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                        )}
                    </div>

                    {/* Subject chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
                        {subjects.map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveSubject(s)}
                                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all ${activeSubject === s
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Subject tip banner */}
                    {activeSubject !== 'All' && SUBJECT_TIPS[activeSubject] && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 space-y-2"
                        >
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1">{activeSubject} — KNEC Tip</p>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{SUBJECT_TIPS[activeSubject].tip}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                                <span className="text-rose-500 text-xs shrink-0 font-black mt-0.5">❌</span>
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
                                    <strong>Paper Trap:</strong> {SUBJECT_TIPS[activeSubject].trap}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Resource List */}
                    {loadingResources ? (
                        <div className="py-12 text-center">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-slate-400 font-medium">Loading resources...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="py-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">No resources found</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Try a different subject or search term</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                {filteredItems.length} resource{filteredItems.length !== 1 ? 's' : ''}
                                {activeSubject !== 'All' ? ` · ${activeSubject}` : ''}
                            </p>
                            {filteredItems.map((item: any, idx: number) => {
                                const tc = typeConfig[item._type] || typeConfig.paper;
                                return (
                                    <motion.div
                                        key={item.id || idx}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl flex items-center gap-3 px-4 py-3.5 group transition-all hover:shadow-md dark:hover:shadow-none"
                                    >
                                        {/* Type icon */}
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tc.color}`}>
                                            {tc.icon}
                                        </div>

                                        {/* Info — tapping this starts LEARN */}
                                        <button
                                            className="flex-1 text-left min-w-0"
                                            onClick={() => onStartSession(item, RevisionMode.LEARN)}
                                        >
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                                                {item.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${tc.color}`}>
                                                    {tc.label}
                                                </span>
                                                {item.subject && (
                                                    <span className="text-[10px] text-slate-400 font-medium">{item.subject}</span>
                                                )}
                                                {'file_path' in item && (
                                                    <span className="text-[10px] font-black text-indigo-500 flex items-center gap-0.5">
                                                        <CheckCircle className="w-2.5 h-2.5" /> Verified
                                                    </span>
                                                )}
                                            </div>
                                        </button>

                                        {/* ⋯ overflow — Exam mode / Read PDF */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOverflowItem(item); }}
                                            className="p-2 text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* ── OVERFLOW MENU MODAL ── */}
            <AnimatePresence>
                {overflowItem && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setOverflowItem(null)}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="font-black text-slate-900 dark:text-white text-sm truncate max-w-[240px]">{overflowItem.title}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{overflowItem.subject}</p>
                                </div>
                                <button onClick={() => setOverflowItem(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4 space-y-2">
                                <button
                                    onClick={() => { onStartSession(overflowItem, RevisionMode.LEARN); setOverflowItem(null); }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold text-sm transition-colors"
                                >
                                    <BookOpen className="w-5 h-5" /> Learn Guided
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                </button>
                                <button
                                    onClick={() => { onStartSession(overflowItem, RevisionMode.EXAM); setOverflowItem(null); }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-sm transition-colors"
                                >
                                    <Brain className="w-5 h-5" /> Take as Exam
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                </button>
                                {(overflowItem.fileUrl || overflowItem.file_url) && (
                                    <button
                                        onClick={() => { window.open(overflowItem.fileUrl || overflowItem.file_url, '_blank'); setOverflowItem(null); }}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm transition-colors"
                                    >
                                        <FileText className="w-5 h-5" /> Read Document
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── CAMERA MODAL ── */}
            <AnimatePresence>
                {showCamera && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                    >
                        <div className="relative flex-1 bg-black">
                            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
                                <button onClick={stopCamera} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white">
                                    <X className="w-6 h-6" />
                                </button>
                                <div className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                    Align question within frame
                                </div>
                            </div>
                            <div className="absolute inset-8 border-2 border-white/30 rounded-3xl pointer-events-none">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                            </div>
                        </div>
                        <div className="h-32 bg-black flex items-center justify-center gap-8 pb-8 pt-4">
                            <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group">
                                <div className="w-16 h-16 bg-white rounded-full transition-transform group-active:scale-90" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── EXAM GURU PANEL ── */}
            <AnimatePresence>
                {showGuru && <ExamGuruPanel onClose={() => setShowGuru(false)} onLogin={() => setShowLoginModal(true)} />}
            </AnimatePresence>

            {/* ── LOGOUT MODAL ── */}
            {showLogoutModal && (
                <LogoutModal
                    isOpen={showLogoutModal}
                    onConfirm={logout}
                    onClose={() => setShowLogoutModal(false)}
                />
            )}

            {/* ── LOGIN MODAL (rate-limit gate) ── */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                initialTab="STUDENT"
            />
        </div>
    );
};
