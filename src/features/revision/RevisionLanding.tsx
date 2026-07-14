import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Upload, BookOpen, Brain, ArrowRight, ScanLine, X,
    CheckCircle, LogOut, Search, FileText, ChevronRight, GraduationCap,
    Sparkles, MessageCircle, MoreHorizontal, Target, Lightbulb,
    CalendarDays, ClipboardCheck, TimerReset, TrendingUp, PenLine
} from 'lucide-react';
import { ViewState, RevisionMode, TeacherActivity } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LogoutModal } from '../../components/LogoutModal';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ExamGuruPanel, PanelMode } from './ExamGuruPanel';
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

const EXAM_TYPES = ['KCSE', 'KPSEA', 'JSS'] as const;
const TARGET_GRADES = ['A', 'B+', 'B', 'C+', 'C', 'Pass'] as const;
const REVISION_SUBJECTS = [
    'Mathematics', 'Biology', 'Chemistry', 'Physics',
    'English', 'Kiswahili', 'History', 'Geography',
    'CRE', 'IRE', 'Agriculture', 'Business Studies',
    'Computer Studies', 'Home Science', 'Art & Design',
];
const DEFAULT_GOAL = {
    examType: 'KCSE',
    subject: 'Mathematics',
    targetGrade: 'B+',
    examDate: ''
};

const SUBJECT_ALIASES: Array<{ subject: string; patterns: RegExp[] }> = [
    { subject: 'Mathematics', patterns: [/\bmath(s|ematics)?\b/i, /\bmathematics\b/i] },
    { subject: 'English', patterns: [/\benglish\b/i, /\beng\b/i] },
    { subject: 'Kiswahili', patterns: [/\bkiswahili\b/i, /\bswahili\b/i, /\bkiswa\b/i] },
    { subject: 'Biology', patterns: [/\bbiology\b/i, /\bbio\b/i] },
    { subject: 'Chemistry', patterns: [/\bchemistry\b/i, /\bchem\b/i] },
    { subject: 'Physics', patterns: [/\bphysics\b/i, /\bphy\b/i] },
    { subject: 'History', patterns: [/\bhistory\b/i, /\bhistory\s*(and|&)\s*government\b/i] },
    { subject: 'Geography', patterns: [/\bgeography\b/i, /\bgeo\b/i] },
    { subject: 'CRE', patterns: [/\bc\.?\s*r\.?\s*e\.?\b/i, /\bcre\b/i, /\bchristian religious education\b/i] },
    { subject: 'IRE', patterns: [/\bi\.?\s*r\.?\s*e\.?\b/i, /\bire\b/i, /\bislamic religious education\b/i] },
    { subject: 'Agriculture', patterns: [/\bagriculture\b/i, /\bagric\b/i] },
    { subject: 'Business Studies', patterns: [/\bbusiness\b/i, /\bb\/?studies\b/i] },
    { subject: 'Computer Studies', patterns: [/\bcomputer\b/i, /\bict\b/i] },
    { subject: 'Home Science', patterns: [/\bhome science\b/i, /\bhomescience\b/i] },
    { subject: 'Integrated Science', patterns: [/\bintegrated science\b/i, /\bscience\b/i] },
    { subject: 'Social Studies', patterns: [/\bsocial studies\b/i] },
    { subject: 'French', patterns: [/\bfrench\b/i] },
    { subject: 'German', patterns: [/\bgerman\b/i] },
    { subject: 'Arabic', patterns: [/\barabic\b/i] },
    { subject: 'Music', patterns: [/\bmusic\b/i] },
    { subject: 'Art & Design', patterns: [/\bart\b/i, /\bcraft\b/i, /\bdesign\b/i] },
    { subject: 'Physical Education (PE)', patterns: [/\bphysical education\b/i, /\bp\.?\s*e\.?\b/i, /\bphe\b/i] },
];

const normalizeRevisionSubject = (resource: any) => {
    const rawSubject = String(resource.subject || '').trim();
    const isUnknown = !rawSubject || /^(none|null|undefined|general|all)$/i.test(rawSubject);
    if (!isUnknown) return rawSubject;

    const searchable = [
        resource.title,
        resource.file_name,
        resource.fileName,
        resource.file_path,
        resource.fileUrl,
        resource.description
    ].filter(Boolean).join(' ');

    const match = SUBJECT_ALIASES.find(({ patterns }) => patterns.some(pattern => pattern.test(searchable)));
    return match?.subject || 'Unsorted Papers';
};

interface Props {
    onStartSession: (data: File | TeacherActivity, mode: RevisionMode) => void;
    onNavigate: (view: ViewState) => void;
    onBack?: () => void;
    initialSubject?: string;
    initialSearchQuery?: string;
}

const normalizeGrade = (g: any) => {
    const str = String(g || "").toLowerCase();
    return str.replace(/\s*grade\s*/g, '').replace(/\s*\(jss\)\s*/g, '').trim() || "";
};

const isGradeInStudentRange = (materialGrade: string, studentGrade: string): boolean => {
    const mGrade = normalizeGrade(materialGrade);
    const sGrade = normalizeGrade(studentGrade);
    if (!sGrade) return true;
    if (!mGrade || mGrade === 'all') return true;

    // Check Pre-Primary & Lower Primary (PP1, PP2, Grade 1, 2, 3)
    const lowerPrimary = ['pp1', 'pp2', '1', '2', '3'];
    if (lowerPrimary.includes(sGrade)) {
        return lowerPrimary.includes(mGrade);
    }

    // Upper Primary (Grade 4, 5, 6)
    const upperPrimary = ['4', '5', '6'];
    if (upperPrimary.includes(sGrade)) {
        return upperPrimary.includes(mGrade);
    }

    // Junior Secondary (Grade 7, 8, 9)
    const juniorSecondary = ['7', '8', '9'];
    if (juniorSecondary.includes(sGrade)) {
        return juniorSecondary.includes(mGrade);
    }

    // Senior Secondary (Form 1, 2, 3, 4)
    const seniorSecondary = ['form 1', 'form 2', 'form 3', 'form 4', '10', '11', '12'];
    if (seniorSecondary.some(g => sGrade.includes(g) || g.includes(sGrade))) {
        return seniorSecondary.some(g => mGrade.includes(g) || g.includes(mGrade));
    }

    // Campus / University
    const campus = ['1st year', '2nd year', '3rd year', '4th year', 'university', 'college', 'campus', 'degree', 'diploma'];
    if (campus.some(g => sGrade.includes(g) || g.includes(sGrade))) {
        return campus.some(g => mGrade.includes(g) || g.includes(mGrade));
    }

    return mGrade === sGrade;
};

export const RevisionLanding: React.FC<Props> = ({ onStartSession, onNavigate, onBack, initialSubject, initialSearchQuery }) => {
    const {
        logout, availableQuizzes, fetchAvailableQuizzes, isOnline,
        studentProfile, resources, fetchResources, weakTopics,
        masteryGraph, educationLevel, role, revisionUsageCount
    } = useApp();

    const [searchQuery, setSearchQuery] = useState(() => initialSearchQuery || '');
    const [activeSubject, setActiveSubject] = useState<string>(() => initialSubject || 'All');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [showGuru, setShowGuru] = useState(false);
    const [guruMode, setGuruMode] = useState<PanelMode>('chat');
    const [guruPrompt, setGuruPrompt] = useState('');
    const [loadingResources, setLoadingResources] = useState(false);
    const [overflowItem, setOverflowItem] = useState<any>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [examGoal, setExamGoal] = useState(() => {
        try {
            const saved = localStorage.getItem('soma_exam_goal');
            return saved ? { ...DEFAULT_GOAL, ...JSON.parse(saved) } : DEFAULT_GOAL;
        } catch {
            return DEFAULT_GOAL;
        }
    });

    const [now] = useState(() => Date.now());

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Fetch on mount
    React.useEffect(() => {
        if (initialSearchQuery) setSearchQuery(initialSearchQuery);
        if (initialSubject) {
            setActiveSubject(initialSubject);
            setExamGoal(prev => ({ ...prev, subject: initialSubject }));
        }
    }, [initialSearchQuery, initialSubject]);

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

    React.useEffect(() => {
        localStorage.setItem('soma_exam_goal', JSON.stringify(examGoal));
    }, [examGoal]);

    const getRevisionItemType = (resource: any) => {
        const rawType = String(resource.type || resource.category || resource.resource_type || '').toUpperCase().replace(/[\s-]+/g, '_');
        const title = String(resource.title || '').toLowerCase();
        const searchable = [
            resource.title,
            resource.file_name,
            resource.fileName,
            resource.file_path,
            resource.fileUrl,
            resource.description
        ].filter(Boolean).join(' ').toLowerCase();

        if (rawType === 'SYLLABUS' || title.includes('scheme of work') || searchable.includes('scheme of work')) return 'syllabus';
        if (['PAST_PAPER', 'PAST_PAPERS', 'PASTPAPER', 'REVISION_PAPER', 'REVISIONPAPER', 'EXAM', 'EXAM_PAPER'].includes(rawType)) return 'paper';
        if (['NOTE', 'NOTES'].includes(rawType)) return 'notes';

        const looksLikePaper = /\b(past paper|paper|kcse|kpsea|exam|mock|revision question|question paper)\b/i.test(searchable) || rawType === 'NONE' || rawType === 'NULL' || rawType === 'UNDEFINED' || rawType === 'GENERAL';
        const looksLikeNotes = /\b(notes?|study note|lesson note|summary)\b/i.test(searchable);

        if (looksLikePaper && !looksLikeNotes) return 'paper';
        if (looksLikeNotes) return 'notes';
        return 'paper';
    };

    // All resources merged
    const allItems = useMemo(() => {
        const typed = resources.map(r => ({
            ...r,
            subject: normalizeRevisionSubject(r),
            _type: getRevisionItemType(r)
        }));
        // Filter by grade range on profile level for notes and past papers
        return typed.filter(item => {
            if (!studentProfile?.grade) return true;
            if (item._type === 'notes' || item._type === 'paper') {
                return isGradeInStudentRange(item.grade || '', studentProfile.grade);
            }
            return true;
        });
    }, [resources, studentProfile?.grade]);

    const pastPaperItems = useMemo(() => {
        return allItems.filter(item => item._type === 'paper');
    }, [allItems]);

    const subjects = useMemo(() => {
        const s = new Set(pastPaperItems.map(r => r.subject).filter(Boolean));
        const uniqueSubjects = Array.from(s).filter(sub => sub.toLowerCase() !== 'all');
        return ['All', ...uniqueSubjects];
    }, [pastPaperItems]);

    const filteredItems = useMemo(() => {
        return pastPaperItems.filter(item => {
            const matchSub = activeSubject === 'All' || item.subject === activeSubject;
            const q = searchQuery.toLowerCase();
            const matchQ = !q || item.title?.toLowerCase().includes(q) || item.subject?.toLowerCase().includes(q);
            return matchSub && matchQ;
        });
    }, [pastPaperItems, activeSubject, searchQuery]);

    const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
        paper: { label: 'Past Paper', icon: <FileText className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' },
        notes: { label: 'Notes', icon: <BookOpen className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
        syllabus: { label: 'Syllabus', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
    };

    const daysToExam = useMemo(() => {
        if (!examGoal.examDate) return null;
        const target = new Date(`${examGoal.examDate}T00:00:00`);
        if (Number.isNaN(target.getTime())) return null;
        const diff = Math.ceil((target.getTime() - now) / 86400000);
        return Math.max(diff, 0);
    }, [examGoal.examDate, now]);

    const focusSubject = initialSubject && initialSubject !== 'All' ? initialSubject : examGoal.subject;
    const focusTopic = initialSearchQuery?.trim() || weakTopics[0] || focusSubject;
    const missionTopic = weakTopics[0] || focusTopic;
    const missionTitle = weakTopics[0]
        ? `${focusSubject}: fix ${missionTopic}`
        : `${focusSubject}: start with a scored drill`;
    const missionResource = filteredItems.find(item =>
        item.subject === focusSubject
    ) || filteredItems.find(item =>
        initialSearchQuery?.trim()
            ? String(item.title || '').toLowerCase().includes(initialSearchQuery.trim().toLowerCase())
            : false
    ) || filteredItems[0];
    const recommendedStart = missionResource;
    const guruSyllabusContext = {
        grade: studentProfile?.grade || examGoal.examType,
        subject: focusSubject,
        topic: focusTopic,
        sourceTitle: recommendedStart?.title || missionTitle,
    };

    const openGuru = (mode: PanelMode = 'chat', prompt = '') => {
        setGuruMode(mode);
        setGuruPrompt(prompt);
        setShowGuru(true);
    };

    const openAskAkili = () => {
        openGuru('chat', buildPaperCoachPrompt(recommendedStart || missionResource || { title: missionTitle, subject: focusSubject, grade: examGoal.examType }));
    };

    const startRecommendedPaper = () => {
        if (recommendedStart) onStartSession(recommendedStart, RevisionMode.EXAM);
        else openGuru('predict');
    };

    const getPaperIndexStatus = (item: any) => String(item?.indexing_status || '').toUpperCase();

    const getPaperChunkCount = (item: any) => {
        const count = Number(item?.chunk_count || 0);
        return Number.isFinite(count) ? count : 0;
    };

    const isPaperGroundedReady = (item: any) => {
        return getPaperIndexStatus(item) === 'READY' && getPaperChunkCount(item) > 0;
    };

    const getPaperGroundingBadge = (item: any) => {
        const status = getPaperIndexStatus(item);
        const chunks = getPaperChunkCount(item);
        if (status === 'READY' && chunks > 0) {
            return {
                label: `Grounded · ${chunks} chunk${chunks === 1 ? '' : 's'}`,
                title: 'Exam Guru can use indexed Soma Library context from this paper.',
                className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            };
        }
        if (status === 'PROCESSING') {
            return {
                label: 'Indexing',
                title: 'This paper is being prepared for stronger Exam Guru answers.',
                className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            };
        }
        if (status === 'FAILED') {
            return {
                label: 'Index failed',
                title: item?.last_index_error || 'This paper needs re-indexing in admin.',
                className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            };
        }
        return {
            label: 'Needs indexing',
            title: 'Read and exam modes still work, but grounded Guru coaching needs admin indexing.',
            className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        };
    };

    const getPaperGroundingInstruction = (item: any) => {
        if (isPaperGroundedReady(item)) {
            return `Grounding status: READY with ${getPaperChunkCount(item)} indexed chunks. Use this selected paper and retrieved Soma Library context strongly.`;
        }
        const status = getPaperIndexStatus(item) || 'NOT_INDEXED';
        return `Grounding status: ${status}. If retrieved context is weak, give useful examiner guidance from the paper title, subject, and level, then tell the learner this paper needs indexing for stronger source-grounded coaching.`;
    };

    const buildPaperCoachPrompt = (item: any) => {
        const title = item?.title || 'this past paper';
        const subject = item?.subject || activeSubject || examGoal.subject || 'the subject';
        const grade = item?.grade || studentProfile?.grade || examGoal.examType || 'KCSE';
        return `Use Soma Library grounding to coach me through this paper.

Paper: ${title}
Subject: ${subject}
Level: ${grade}
${getPaperGroundingInstruction(item)}

Give me:
1. What this paper is mainly testing.
2. The high-yield topics I should revise first.
3. The paper traps candidates lose marks on.
4. A 5-question drill based on this paper style.

Do not explain what a past paper is. Be specific and examiner-focused.`;
    };

    const buildPaperHotTopicsPrompt = (item: any) => {
        const title = item?.title || 'this past paper';
        const subject = item?.subject || activeSubject || examGoal.subject || 'the subject';
        const grade = item?.grade || studentProfile?.grade || examGoal.examType || 'KCSE';
        return `From the indexed Soma past papers and this selected paper, identify likely/high-yield topics.

Paper: ${title}
Subject: ${subject}
Level: ${grade}
${getPaperGroundingInstruction(item)}

Answer with:
1. 8 to 12 high-yield topics.
2. Why each topic is likely or important.
3. What exactly I should practise.
4. One paper trap per topic.
5. Tonight's drill with 5 actions.

Use plain text. No markdown headings or symbols.`;
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
                <meta name="description" content="smart-powered exam prep: scan questions, access past papers, get instant guidance from Exam Guru." />
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
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            {initialSubject && initialSubject !== "All" && (
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Focused revision</span>
                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{initialSubject}</span>
                                </div>
                            )}

                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-1">Past Paper Practice</p>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-tight">Choose a paper, attempt it, then mark it.</h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Set your exam goal once. Soma turns it into paper practice, marking, and revision drills.
                            </p>
                        </div>
                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center shrink-0">
                            <Target className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <select
                            value={examGoal.examType}
                            onChange={e => setExamGoal(prev => ({ ...prev, examType: e.target.value }))}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs font-black text-slate-800 dark:text-slate-100 outline-none"
                            aria-label="Exam type"
                        >
                            {EXAM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <select
                            value={examGoal.subject}
                            onChange={e => {
                                setExamGoal(prev => ({ ...prev, subject: e.target.value }));
                                setActiveSubject(e.target.value);
                            }}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs font-black text-slate-800 dark:text-slate-100 outline-none"
                            aria-label="Revision subject"
                        >
                            {REVISION_SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                        </select>
                        <select
                            value={examGoal.targetGrade}
                            onChange={e => setExamGoal(prev => ({ ...prev, targetGrade: e.target.value }))}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs font-black text-slate-800 dark:text-slate-100 outline-none"
                            aria-label="Target grade"
                        >
                            {TARGET_GRADES.map(grade => <option key={grade} value={grade}>Target {grade}</option>)}
                        </select>
                        <input
                            type="date"
                            value={examGoal.examDate}
                            onChange={e => setExamGoal(prev => ({ ...prev, examDate: e.target.value }))}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs font-black text-slate-800 dark:text-slate-100 outline-none"
                            aria-label="Exam date"
                        />
                    </div>

                    {initialSubject && initialSubject !== 'All' && (
                        <div className="mt-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300 mb-1">Focused revision</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Starting with {initialSubject}</p>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">We&apos;ve preselected the subject from your current lesson so you can jump straight in.</p>
                        </div>
                    )}

                                        <div className="mt-4 grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr]">
                        <button
                            onClick={openAskAkili}
                            className="flex items-center gap-3 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                                <Sparkles className="w-5 h-5" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Ask Akili first</span>
                                <span className="block text-sm font-bold text-slate-900 dark:text-white">Start with an explanation, example, or a quick check.</span>
                            </span>
                        </button>
                        <button onClick={() => openGuru('mark')} className="rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-4 transition-all text-left">
                            <ClipboardCheck className="w-5 h-5 mb-2" />
                            <span className="block text-xs font-black leading-tight">Mark<br />My Answer</span>
                        </button>
                        <button onClick={() => openGuru('practice')} className="rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-4 py-4 transition-all text-left">
                            <PenLine className="w-5 h-5 mb-2" />
                            <span className="block text-xs font-black leading-tight">Timed<br />Drill</span>
                        </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <button onClick={() => openGuru('predict')} className="rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-4 py-2.5 text-xs font-black transition-all">
                            <TrendingUp className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />Hot Topics
                        </button>
                        <button onClick={startRecommendedPaper} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-900">
                            Start paper practice
                        </button>
                    </div>
                </section>

                    {recommendedStart && (
                        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300 mb-1">Current focus</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {initialSearchQuery?.trim() ? initialSearchQuery.trim() : focusSubject}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                        We have matched this to your current lesson and pulled the best paper to start with.
                                    </p>
                                </div>
                                <button
                                    onClick={startRecommendedPaper}
                                    className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-[11px] font-black transition-colors"
                                >
                                    Start exam
                                </button>
                            </div>
                        </div>
                    )}

                <section className="hidden">
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
                <section className="bg-slate-950 text-white rounded-3xl p-4 sm:p-5 overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                    <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-1">Today&apos;s Exam Mission</p>
                            <h2 className="text-lg sm:text-xl font-black leading-tight">
                                {missionTitle}
                            </h2>
                                <p className="text-xs text-slate-300 mt-1 font-medium">
                                    Target {examGoal.targetGrade} in {examGoal.examType}
                                    {daysToExam !== null ? ` · ${daysToExam} day${daysToExam === 1 ? '' : 's'} left` : ' · add exam date for countdown'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                                {daysToExam !== null ? <CalendarDays className="w-6 h-6 text-emerald-300" /> : <TimerReset className="w-6 h-6 text-emerald-300" />}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-2 mt-4">
                            <button onClick={() => openGuru('practice')} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-3 text-left transition-colors">
                                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">Step 1</span>
                                <p className="text-sm font-black mt-1">Try 3 questions</p>
                                <p className="text-[11px] text-slate-400 mt-1">Do a short exam-style drill before you see the marking.</p>
                            </button>
                            <button onClick={() => openGuru('mark')} className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-3 text-left transition-colors">
                                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">Step 2</span>
                                <p className="text-sm font-black mt-1">Mark your answer</p>
                                <p className="text-[11px] text-slate-400 mt-1">See where marks were won or lost.</p>
                            </button>
                            <button
                                onClick={() => {
                                    if (missionResource) onStartSession(missionResource, RevisionMode.EXAM);
                                    else openGuru('predict');
                                }}
                                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-3 text-left transition-colors"
                            >
                                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">Step 3</span>
                                <p className="text-sm font-black mt-1">Do paper drills</p>
                                <p className="text-[11px] text-slate-400 mt-1">Use this paper or drill the likely topics you just checked.</p>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <button onClick={startCamera} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-2xl py-3 text-xs font-black transition-colors">
                                <ScanLine className="w-4 h-4" /> Scan Question
                            </button>
                            <label className="flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl py-3 text-xs font-black transition-colors cursor-pointer">
                                <Upload className="w-4 h-4" /> Upload Paper
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
                        </div>
                    </div>
                </section>

                <section>
                    {hasHistory ? (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-rose-500" />
                                    <h2 className="font-black text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Your Weak Areas</h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fix these first</span>
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
                                <h2 className="font-black text-slate-900 dark:text-white text-sm mb-1">Start from one paper</h2>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    <strong className="text-indigo-600 dark:text-indigo-400">Scan</strong> a past paper question for instant AI help, 
                                    <strong className="text-purple-600 dark:text-purple-400"> use Exam Guru</strong> for exam strategy, 
                                    then practice and mark your answers.
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
                            placeholder="Search paper title, subject, or keyword..."
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
                                    <strong>Paper trap:</strong> {SUBJECT_TIPS[activeSubject].trap}
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
                            <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">No papers matched this filter</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Try a different subject or reset the filters</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                {filteredItems.length} past paper{filteredItems.length !== 1 ? 's' : ''}
                                {activeSubject !== 'All' ? ` · ${activeSubject}` : ''}
                            </p>
                            {filteredItems.map((item: any, idx: number) => {
                                const tc = typeConfig[item._type] || typeConfig.paper;
                                const groundingBadge = getPaperGroundingBadge(item);
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
                                                <span
                                                    title={groundingBadge.title}
                                                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${groundingBadge.className}`}
                                                >
                                                    {groundingBadge.label}
                                                </span>
                                            </div>
                                        </button>

                                        {/* ⋯ overflow — Exam mode / Read PDF */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openGuru('chat', buildPaperCoachPrompt(item));
                                            }}
                                            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-3 py-2 text-[11px] font-black hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shrink-0"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            Coach
                                        </button>
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
                    (() => {
                        const groundingBadge = getPaperGroundingBadge(overflowItem);
                        return (
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
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{overflowItem.subject}</p>
                                        <span
                                            title={groundingBadge.title}
                                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${groundingBadge.className}`}
                                        >
                                            {groundingBadge.label}
                                        </span>
                                    </div>
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
                                <button
                                    onClick={() => {
                                        const prompt = buildPaperCoachPrompt(overflowItem);
                                        setOverflowItem(null);
                                        openGuru('chat', prompt);
                                    }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 font-bold text-sm transition-colors"
                                >
                                    <MessageCircle className="w-5 h-5" /> Ask Guru About This Paper
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                </button>
                                <button
                                    onClick={() => {
                                        const prompt = buildPaperHotTopicsPrompt(overflowItem);
                                        setOverflowItem(null);
                                        openGuru('chat', prompt);
                                    }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 font-bold text-sm transition-colors"
                                >
                                    <TrendingUp className="w-5 h-5" /> High-Yield From This Paper
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                        );
                    })()
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
                {showGuru && (
                    <ExamGuruPanel
                        onClose={() => setShowGuru(false)}
                        onLogin={() => setShowLoginModal(true)}
                        initialMode={guruMode}
                        initialPrompt={guruPrompt}
                        syllabusContext={guruSyllabusContext}
                    />
                )}
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
