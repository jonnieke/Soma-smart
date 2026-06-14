import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Users, ChevronRight, Send, Trophy, Star,
    Zap, Target, TrendingUp, CheckCircle, AlertCircle,
    BookOpen, Lightbulb, MessageSquare, RotateCcw, ArrowLeft,
    Loader2, Award, Sparkles, Volume2
} from 'lucide-react';
import { SimulationPreset, SimulationTurn, SimulationScorecard } from '../../types';
import { runClassroomSimulationTurn, evaluateClassroomSimulation } from '../../services/geminiService';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

interface ClassroomSimulatorProps {
    onBack: () => void;
    subjects?: string[];
    classes?: string[];
}

type Phase = 'SETUP' | 'SIMULATION' | 'SCORECARD';

interface PresetConfig {
    id: SimulationPreset;
    label: string;
    emoji: string;
    description: string;
    color: string;
    bg: string;
    border: string;
}

const PRESETS: PresetConfig[] = [
    {
        id: 'STRUGGLING',
        label: 'Struggling Learners',
        emoji: '😟',
        description: 'Students have gaps in foundational knowledge. Need extra patience and scaffolding.',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
    },
    {
        id: 'INQUISITIVE',
        label: 'Highly Inquisitive',
        emoji: '🤩',
        description: 'Enthusiastic students who love digging deep. Be ready for tough "why" questions!',
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        border: 'border-violet-200 dark:border-violet-800',
    },
    {
        id: 'BALANCED',
        label: 'Balanced Class',
        emoji: '🙂',
        description: 'A realistic mix of abilities. Some get it, some need help, some are distracted.',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
        id: 'HYPERACTIVE',
        label: 'Hyperactive Class',
        emoji: '🤪',
        description: 'Full of energy! Great engagement but you must keep the classroom under control.',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
    },
];

const STUDENTS = [
    { name: 'Mwangi', emoji: '👦🏿' },
    { name: 'Achieng', emoji: '👧🏾' },
    { name: 'Nekesa', emoji: '👧🏿' },
    { name: 'Kamau', emoji: '👦🏾' },
];

const SUGGESTION_PROMPTS: Record<SimulationPreset, string[]> = {
    STRUGGLING: [
        'Let\'s go back to basics. Can anyone tell me what they already know about this topic?',
        'That\'s a great try, Mwangi. Let\'s break this down step by step together.',
        'Nekesa, I need you to focus. What did I just explain?',
        'We\'ll use a simple example from our everyday life in Kenya.',
    ],
    INQUISITIVE: [
        'Excellent question, Achieng! What does the rest of the class think?',
        'That\'s a very sharp observation, Nekesa. Can you explain your reasoning?',
        'How does this concept connect to what we see in our environment every day?',
        'Kamau, can you give us a real-world example from our community?',
    ],
    BALANCED: [
        'Let\'s do a quick check — can someone summarise what we\'ve covered so far?',
        'Nekesa, I notice you are distracted. What is the answer to question two?',
        'Good! Now let us go a level deeper. Who can explain the "why"?',
        'Work with the person next to you for two minutes, then share.',
    ],
    HYPERACTIVE: [
        'One at a time please! Raise your hand if you have an answer.',
        'The class needs to calm down first. Take a deep breath, everyone.',
        'Mwangi, please let Achieng finish before you jump in.',
        'I appreciate your energy! Let\'s channel it into this activity.',
    ],
};

const CBC_GRADES = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4',
];

const CBC_SUBJECTS = [
    'Mathematics', 'English', 'Kiswahili', 'Science & Technology',
    'Agriculture', 'Social Studies', 'Religious Education', 'Creative Arts',
    'Physical Education', 'Biology', 'Chemistry', 'Physics',
    'History & Citizenship', 'Geography', 'Business Studies',
];

// ─────────────────────────────────────────────────────────────────────────────
// Metric Bar
// ─────────────────────────────────────────────────────────────────────────────
const MetricBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-600 dark:text-slate-300">{label}</span>
            <span className="text-slate-800 dark:text-slate-100">{value}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <motion.div
                className={`h-full rounded-full ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
            />
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Understanding Curve Chart (SVG sparkline)
// ─────────────────────────────────────────────────────────────────────────────
const UnderstandingChart: React.FC<{ data: number[] }> = ({ data }) => {
    if (data.length < 2) return null;
    const W = 400, H = 100;
    const padX = 20, padY = 10;
    const innerW = W - padX * 2;
    const innerH = H - padY * 2;
    const pts = data.map((v, i) => ({
        x: padX + (i / (data.length - 1)) * innerW,
        y: padY + (1 - v / 100) * innerH,
    }));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${d} L${pts[pts.length - 1].x.toFixed(1)},${(padY + innerH).toFixed(1)} L${padX},${(padY + innerH).toFixed(1)} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
            </defs>
            <path d={area} fill="url(#curveGrad)" />
            <path d={d} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#10b981" />
            ))}
        </svg>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Score Ring
// ─────────────────────────────────────────────────────────────────────────────
const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const r = 52, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    const color = score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444';
    return (
        <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <motion.circle
                    cx="60" cy="60" r={r} fill="none"
                    stroke={color} strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${circ}`}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - dash }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="text-center z-10">
                <p className="text-3xl font-black" style={{ color }}>{score}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ 100</p>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const ClassroomSimulator: React.FC<ClassroomSimulatorProps> = ({ onBack, subjects = CBC_SUBJECTS, classes = CBC_GRADES }) => {
    // Setup state
    const [lessonTopic, setLessonTopic] = useState('');
    const [selectedGrade, setSelectedGrade] = useState(classes[0] || 'Grade 8');
    const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'Science & Technology');
    const [selectedPreset, setSelectedPreset] = useState<SimulationPreset>('BALANCED');

    // Simulation state
    const [phase, setPhase] = useState<Phase>('SETUP');
    const [history, setHistory] = useState<SimulationTurn[]>([]);
    const [teacherInput, setTeacherInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [engagementLevel, setEngagementLevel] = useState(50);
    const [understandingLevel, setUnderstandingLevel] = useState(30);

    // Scorecard state
    const [scorecard, setScorecard] = useState<SimulationScorecard | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [showXpBurst, setShowXpBurst] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const preset = PRESETS.find(p => p.id === selectedPreset)!;

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Update engagement/understanding as turns increase
    useEffect(() => {
        const teacherTurns = history.filter(h => h.role === 'teacher').length;
        if (teacherTurns === 0) return;
        // Simulate progressive understanding (affected by preset)
        const baseGrowth = { STRUGGLING: 3, BALANCED: 6, INQUISITIVE: 9, HYPERACTIVE: 4 }[selectedPreset];
        setUnderstandingLevel(Math.min(30 + teacherTurns * baseGrowth, 90));
        setEngagementLevel(Math.min(40 + teacherTurns * (baseGrowth - 1), 95));
    }, [history, selectedPreset]);

    const handleStartSimulation = () => {
        if (!lessonTopic.trim()) return;
        const intro: SimulationTurn = {
            id: 'intro',
            role: 'students',
            timestamp: Date.now(),
            text: `*Class settles down as the teacher prepares to begin the lesson*\n\nMwangi: ${preset.id === 'HYPERACTIVE' ? 'Mwalimu! Mwalimu! What are we doing today??' : preset.id === 'STRUGGLING' ? 'Mwalimu, I hope today is not hard...' : 'Good morning, Mwalimu!'}\nAchieng: ${preset.id === 'INQUISITIVE' ? 'I was reading about this topic! I have so many questions.' : 'Good morning!'}\nNekesa: ${preset.id === 'HYPERACTIVE' ? '*talking loudly to Kamau*' : '*arranges exercise book quietly*'}\nKamau: ${preset.id === 'STRUGGLING' ? 'Mwalimu, will we have notes to copy?' : 'Ready, Mwalimu.'}`,
        };
        setHistory([intro]);
        setPhase('SIMULATION');
    };

    const handleSendMessage = useCallback(async (textOverride?: string) => {
        const text = (textOverride || teacherInput).trim();
        if (!text || isLoading) return;
        setTeacherInput('');

        const teacherTurn: SimulationTurn = {
            id: `teacher-${Date.now()}`,
            role: 'teacher',
            text,
            timestamp: Date.now(),
        };
        setHistory(prev => [...prev, teacherTurn]);
        setIsLoading(true);

        try {
            const allHistory = [...history, teacherTurn];
            const response = await runClassroomSimulationTurn(
                text,
                lessonTopic,
                selectedGrade,
                selectedSubject,
                selectedPreset,
                allHistory
            );
            const studentTurn: SimulationTurn = {
                id: `students-${Date.now()}`,
                role: 'students',
                text: response,
                timestamp: Date.now(),
            };
            setHistory(prev => [...prev, studentTurn]);
        } finally {
            setIsLoading(false);
        }
    }, [teacherInput, history, isLoading, lessonTopic, selectedGrade, selectedSubject, selectedPreset]);

    const handleEndSimulation = async () => {
        setIsEvaluating(true);
        setPhase('SCORECARD');
        try {
            const result = await evaluateClassroomSimulation(
                lessonTopic, selectedGrade, selectedSubject, selectedPreset, history
            );
            setScorecard(result);
            setTimeout(() => setShowXpBurst(true), 1500);
            setTimeout(() => setShowXpBurst(false), 4000);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleRestart = () => {
        setPhase('SETUP');
        setHistory([]);
        setScorecard(null);
        setEngagementLevel(50);
        setUnderstandingLevel(30);
        setLessonTopic('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ─── Render student response with named lines ───
    const renderStudentMessage = (text: string) => {
        const lines = text.split('\n').filter(Boolean);
        return lines.map((line, i) => {
            const student = STUDENTS.find(s => line.startsWith(s.name + ':'));
            if (student) {
                const content = line.replace(student.name + ':', '').trim();
                return (
                    <div key={i} className="flex items-start gap-2 mb-1">
                        <span className="text-base leading-none mt-0.5">{student.emoji}</span>
                        <div>
                            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{student.name}</span>
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{content}</p>
                        </div>
                    </div>
                );
            }
            return <p key={i} className="text-sm text-slate-500 dark:text-slate-400 italic mb-1">{line}</p>;
        });
    };

    // ─────────────────────────────────────────────────────────────────
    // PHASE: SETUP
    // ─────────────────────────────────────────────────────────────────
    if (phase === 'SETUP') {
        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
                    <button
                        onClick={onBack}
                        className="relative z-10 flex items-center gap-2 text-white/70 hover:text-white text-sm font-black uppercase tracking-widest mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Hub
                    </button>
                    <div className="relative z-10 flex items-start gap-5">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                            <Monitor className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-purple-100 text-xs font-black tracking-widest uppercase mb-3 border border-white/10">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Role-play Simulator
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Interactive Classroom</h1>
                            <p className="text-purple-100 font-medium max-w-xl text-lg opacity-90 leading-relaxed">
                                Test your lesson delivery with AI-powered Kenyan students before stepping into the real classroom.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Lesson Setup */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-8 space-y-6 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-500" /> Lesson Setup
                        </h2>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Lesson Topic *</label>
                            <textarea
                                value={lessonTopic}
                                onChange={e => setLessonTopic(e.target.value)}
                                placeholder="e.g. Photosynthesis in plants and its importance to life on Earth..."
                                rows={3}
                                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Grade</label>
                                <select
                                    value={selectedGrade}
                                    onChange={e => setSelectedGrade(e.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                    {(classes.length > 0 ? classes : CBC_GRADES).map(g => (
                                        <option key={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                                <select
                                    value={selectedSubject}
                                    onChange={e => setSelectedSubject(e.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                    {(subjects.length > 0 ? subjects : CBC_SUBJECTS).map(s => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Student Preset */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-500" /> Student Profile
                        </h2>
                        <div className="grid grid-cols-1 gap-3">
                            {PRESETS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPreset(p.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                        selectedPreset === p.id
                                            ? `${p.bg} ${p.border} shadow-sm`
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <span className="text-2xl">{p.emoji}</span>
                                    <div>
                                        <p className={`text-sm font-black ${selectedPreset === p.id ? p.color : 'text-slate-800 dark:text-white'}`}>
                                            {p.label}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{p.description}</p>
                                    </div>
                                    {selectedPreset === p.id && (
                                        <CheckCircle className={`w-4 h-4 ml-auto shrink-0 ${p.color}`} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <motion.button
                    onClick={handleStartSimulation}
                    disabled={!lessonTopic.trim()}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 transition-all"
                >
                    <Monitor className="w-5 h-5" /> Start Simulation
                    <ChevronRight className="w-5 h-5" />
                </motion.button>

                {/* Tip */}
                <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4">
                    <Lightbulb className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                        <span className="font-black">Pro tip:</span> Paste your full lesson plan objective in the topic box. The richer the detail, the more realistic the simulation!
                    </p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // PHASE: SIMULATION
    // ─────────────────────────────────────────────────────────────────
    if (phase === 'SIMULATION') {
        const teacherTurns = history.filter(h => h.role === 'teacher').length;
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[900px] space-y-4">
                {/* Simulation Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-[1.5rem] p-4 md:p-5 text-white shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-purple-200">Live Simulation</p>
                                <h3 className="font-black text-white text-sm leading-tight">{lessonTopic.slice(0, 60)}{lessonTopic.length > 60 ? '…' : ''}</h3>
                                <p className="text-purple-200 text-xs">{selectedGrade} · {selectedSubject} · {preset.emoji} {preset.label}</p>
                            </div>
                        </div>
                        {/* Live Metrics */}
                        <div className="flex gap-4 shrink-0">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 mb-1">Engagement</p>
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-4 h-4 text-amber-300" />
                                    <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-amber-300 rounded-full"
                                            animate={{ width: `${engagementLevel}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <span className="text-xs font-black">{engagementLevel}%</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 mb-1">Understanding</p>
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-emerald-300" />
                                    <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-emerald-300 rounded-full"
                                            animate={{ width: `${understandingLevel}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <span className="text-xs font-black">{understandingLevel}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student avatars */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {STUDENTS.map((s, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 border border-white/20">
                                <span className="text-base">{s.emoji}</span>
                                <span className="text-xs font-black text-white/90">{s.name}</span>
                            </div>
                        ))}
                        <div className="ml-auto flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1 border border-white/20">
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-xs font-black">{teacherTurns} turns</span>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 min-h-0">
                    <AnimatePresence initial={false}>
                        {history.map((turn) => (
                            <motion.div
                                key={turn.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className={`flex ${turn.role === 'teacher' ? 'justify-end' : 'justify-start'}`}
                            >
                                {turn.role === 'teacher' ? (
                                    <div className="max-w-[75%] bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">You (Teacher)</p>
                                        <p className="text-sm leading-relaxed">{turn.text}</p>
                                    </div>
                                ) : (
                                    <div className="max-w-[80%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                                            <Users className="w-3 h-3" /> Class Response
                                        </p>
                                        <div>{renderStudentMessage(turn.text)}</div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                <span className="text-sm text-slate-500">Students are thinking...</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Suggestion Prompts */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {SUGGESTION_PROMPTS[selectedPreset].map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSendMessage(s)}
                            disabled={isLoading}
                            className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-full px-3 py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            {s.slice(0, 50)}{s.length > 50 ? '…' : ''}
                        </button>
                    ))}
                </div>

                {/* Input & Controls */}
                <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 focus-within:border-indigo-500 transition-colors">
                        <textarea
                            ref={textareaRef}
                            value={teacherInput}
                            onChange={e => setTeacherInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Say something to the class…"
                            rows={1}
                            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed py-1.5"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!teacherInput.trim() || isLoading}
                            className="self-end w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={handleEndSimulation}
                        disabled={teacherTurns < 2}
                        className="shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest px-4 rounded-2xl transition-colors flex items-center gap-2"
                    >
                        <Trophy className="w-4 h-4" /> End & Evaluate
                    </button>
                </div>
                {teacherTurns < 2 && (
                    <p className="text-center text-xs text-slate-400">Teach at least 2 turns before evaluating.</p>
                )}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // PHASE: SCORECARD
    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Scorecard Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <Award className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-emerald-200 text-xs font-black uppercase tracking-widest mb-1">Lesson Evaluation Complete</p>
                        <h2 className="text-3xl font-black">Your Scorecard</h2>
                        <p className="text-emerald-100 text-sm">{lessonTopic.slice(0, 60)} · {selectedGrade} · {selectedSubject}</p>
                    </div>
                </div>
            </div>

            {isEvaluating ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 font-medium">Analysing your teaching…</p>
                    <p className="text-slate-400 text-sm">Our CBC evaluator is reviewing your session</p>
                </div>
            ) : scorecard ? (
                <>
                    {/* XP Burst Animation */}
                    <AnimatePresence>
                        {showXpBurst && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                                className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-2xl px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3"
                            >
                                <Sparkles className="w-6 h-6" />
                                +{scorecard.xpEarned} XP Earned!
                                <Sparkles className="w-6 h-6" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Overall Score Ring */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center justify-center gap-4 shadow-sm">
                            <ScoreRing score={scorecard.overallScore} />
                            <div className="text-center">
                                <p className="font-black text-lg text-slate-900 dark:text-white">
                                    {scorecard.overallScore >= 80 ? '🏆 Excellent!' : scorecard.overallScore >= 65 ? '⭐ Good Work!' : '📈 Keep Growing!'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{preset.emoji} {preset.label} class</p>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full px-4 py-1.5">
                                <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                                <span className="font-black text-amber-700 dark:text-amber-400">+{scorecard.xpEarned} XP</span>
                            </div>
                        </div>

                        {/* Metric Bars */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-5">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-500" /> CBC Metrics
                            </h3>
                            <MetricBar label="Lesson Clarity" value={scorecard.scorecard.clarity} color="bg-indigo-500" />
                            <MetricBar label="Inquiry Questions" value={scorecard.scorecard.inquiryQuestions} color="bg-purple-500" />
                            <MetricBar label="Student Engagement" value={scorecard.scorecard.engagement} color="bg-emerald-500" />
                            <MetricBar label="Scaffolding" value={scorecard.scorecard.scaffolding} color="bg-amber-500" />
                            <MetricBar label="CBC Values" value={scorecard.scorecard.cbcValues} color="bg-teal-500" />
                        </div>

                        {/* Understanding Curve */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Understanding Curve
                            </h3>
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2">
                                <UnderstandingChart data={scorecard.understandingCurve} />
                            </div>
                            <p className="text-xs text-slate-400 text-center mt-2">Class understanding across {scorecard.understandingCurve.length} teacher turns</p>
                        </div>
                    </div>

                    {/* Strengths & Recommendations */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 rounded-[2rem] p-8 shadow-sm">
                            <h3 className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5" /> Strengths
                            </h3>
                            <ul className="space-y-3">
                                {scorecard.strengths.map((s, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-2"
                                    >
                                        <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                                        <span className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">{s}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-100 dark:border-amber-800 rounded-[2rem] p-8 shadow-sm">
                            <h3 className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-4">
                                <AlertCircle className="w-5 h-5" /> Growth Areas
                            </h3>
                            <ul className="space-y-3">
                                {scorecard.recommendations.map((r, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-2"
                                    >
                                        <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                                        <span className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{r}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleRestart}
                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" /> Try Another Lesson
                        </button>
                        <button
                            onClick={onBack}
                            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black py-4 rounded-2xl hover:border-slate-300 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" /> Back to Creation Hub
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center py-16 text-slate-500">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p>Could not generate scorecard. Please try again.</p>
                    <button onClick={handleRestart} className="mt-4 text-indigo-600 font-black text-sm">Try Again</button>
                </div>
            )}
        </div>
    );
};
