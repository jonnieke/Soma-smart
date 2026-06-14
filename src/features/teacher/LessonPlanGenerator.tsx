import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Sparkles, ArrowLeft, ChevronRight, Download,
    Copy, CheckCircle, Loader2, BookOpen, Clock, Users,
    Target, Lightbulb, AlertCircle, ChevronDown, ChevronUp,
    Pencil, Award, RotateCcw
} from 'lucide-react';
import { generateLessonPlan, LessonPlanOutput } from '../../services/geminiService';
import jsPDF from 'jspdf';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

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

const DURATIONS = ['30 minutes', '40 minutes', '60 minutes', '80 minutes'];

const PHASE_COLORS: Record<string, string> = {
    Engage:    'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
    Explore:   'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    Explain:   'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    Elaborate: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800',
    Evaluate:  'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
};

const PHASE_BADGE: Record<string, string> = {
    Engage:    'bg-rose-500',
    Explore:   'bg-amber-500',
    Explain:   'bg-blue-500',
    Elaborate: 'bg-violet-500',
    Evaluate:  'bg-emerald-500',
};

interface LessonPlanGeneratorProps {
    onBack: () => void;
    onPolish?: (plan: string) => void;
    subjects?: string[];
    classes?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Card (collapsible)
// ─────────────────────────────────────────────────────────────────────────────
const ActivityCard: React.FC<{ activity: LessonPlanOutput['activities'][0]; index: number }> = ({ activity, index }) => {
    const [open, setOpen] = useState(index < 2);
    const colorClass = PHASE_COLORS[activity.phase] || PHASE_COLORS.Explain;
    const badge = PHASE_BADGE[activity.phase] || 'bg-slate-500';

    return (
        <div className={`border-2 rounded-2xl overflow-hidden transition-all ${colorClass}`}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 p-4 text-left"
            >
                <span className={`${badge} text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shrink-0`}>
                    {activity.phase}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
                    <Clock className="w-3.5 h-3.5" /> {activity.duration}
                </span>
                <span className="text-xs font-bold text-slate-400 ml-auto shrink-0 flex items-center gap-1">
                    {activity.cbcCompetency}
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Teacher Activity
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{activity.teacherActivity}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" /> Student Activity
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{activity.studentActivity}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const LessonPlanGenerator: React.FC<LessonPlanGeneratorProps> = ({
    onBack, onPolish, subjects = CBC_SUBJECTS, classes = CBC_GRADES
}) => {
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState(classes[0] || 'Grade 8');
    const [subject, setSubject] = useState(subjects[0] || 'Mathematics');
    const [duration, setDuration] = useState('40 minutes');
    const [objectives, setObjectives] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState<LessonPlanOutput | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const planRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);
        setError('');
        setPlan(null);
        try {
            const result = await generateLessonPlan(topic, grade, subject, duration, objectives);
            setPlan(result);
        } catch (e) {
            setError('Could not generate the lesson plan. Please try again.');
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!plan) return;
        const text = [
            `LESSON PLAN: ${plan.title}`,
            `Grade: ${plan.grade} | Subject: ${plan.subject} | Duration: ${plan.duration}`,
            '',
            'LEARNING OUTCOMES:',
            ...plan.learningOutcomes.map(o => `• ${o}`),
            '',
            'RESOURCES: ' + plan.resources.join(', '),
            '',
            'ACTIVITIES (5E CBC Model):',
            ...plan.activities.map(a =>
                `[${a.phase} – ${a.duration}]\nTeacher: ${a.teacherActivity}\nStudents: ${a.studentActivity}\nCBC Competency: ${a.cbcCompetency}`
            ).join('\n\n'),
            '',
            'ASSESSMENT: ' + plan.assessment,
            '',
            'DIFFERENTIATION:',
            `Struggling: ${plan.differentiation.struggling}`,
            `Gifted: ${plan.differentiation.gifted}`,
            '',
            'CBC VALUES: ' + plan.cbcValues.join(', '),
            '',
            'HOMEWORK: ' + plan.homework,
        ].join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleExportPDF = () => {
        if (!plan) return;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const lm = 20, rm = 190, lw = rm - lm;
        let y = 20;

        const addLine = (text: string, size = 11, bold = false, color: [number, number, number] = [30, 30, 30]) => {
            doc.setFontSize(size);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setTextColor(...color);
            const lines = doc.splitTextToSize(text, lw);
            lines.forEach((line: string) => {
                if (y > 275) { doc.addPage(); y = 20; }
                doc.text(line, lm, y);
                y += size * 0.45;
            });
            y += 2;
        };

        const section = (title: string) => {
            y += 4;
            doc.setFillColor(99, 102, 241);
            doc.roundedRect(lm - 2, y - 5, lw + 4, 9, 2, 2, 'F');
            addLine(title.toUpperCase(), 10, true, [255, 255, 255]);
            y += 1;
        };

        // Header
        doc.setFillColor(30, 27, 75);
        doc.rect(0, 0, 210, 40, 'F');
        addLine('LESSON PLAN', 18, true, [255, 255, 255]);
        addLine(plan.title, 13, false, [200, 200, 255]);
        addLine(`${plan.grade}  •  ${plan.subject}  •  ${plan.duration}`, 10, false, [180, 180, 220]);
        y = 50;

        section('Learning Outcomes');
        plan.learningOutcomes.forEach(o => addLine(`• ${o}`));

        section('Resources & Materials');
        addLine(plan.resources.join('  •  '));

        section('5E CBC Activities');
        plan.activities.forEach(a => {
            addLine(`${a.phase.toUpperCase()} (${a.duration})`, 11, true);
            addLine(`Teacher: ${a.teacherActivity}`);
            addLine(`Students: ${a.studentActivity}`);
            addLine(`CBC Competency: ${a.cbcCompetency}`, 10, false, [100, 100, 150]);
            y += 2;
        });

        section('Assessment');
        addLine(plan.assessment);

        section('Differentiation');
        addLine(`Struggling learners: ${plan.differentiation.struggling}`);
        addLine(`Gifted learners: ${plan.differentiation.gifted}`);

        section('CBC Core Values');
        addLine(plan.cbcValues.join('  •  '));

        section('Homework');
        addLine(plan.homework);

        doc.save(`${plan.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    };

    const handlePolish = () => {
        if (!plan || !onPolish) return;
        const planText = plan.activities.map(a =>
            `[${a.phase}]\nTeacher: ${a.teacherActivity}\nStudents: ${a.studentActivity}`
        ).join('\n\n');
        onPolish(planText);
    };

    // ─── SETUP PHASE ───
    if (!plan && !isGenerating) {
        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <button onClick={onBack} className="relative z-10 flex items-center gap-2 text-white/70 hover:text-white text-sm font-black uppercase tracking-widest mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Hub
                    </button>
                    <div className="relative z-10 flex items-start gap-5">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-emerald-100 text-xs font-black tracking-widest uppercase mb-3 border border-white/10">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> CBC Lesson Plan Generator
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">AI Lesson Planner</h1>
                            <p className="text-emerald-100 font-medium max-w-xl text-lg opacity-90 leading-relaxed">
                                Generate a complete 5E CBC-aligned lesson plan in seconds. Enter your topic and let Soma Smart do the work.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-8 space-y-5 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-500" /> Lesson Details
                        </h2>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Topic / Strand *</label>
                            <textarea
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="e.g. Photosynthesis in plants and the role of chlorophyll..."
                                rows={2}
                                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Grade</label>
                                <select value={grade} onChange={e => setGrade(e.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors">
                                    {classes.map(g => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                                <select value={subject} onChange={e => setSubject(e.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors">
                                    {subjects.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Lesson Duration</label>
                            <div className="flex gap-2 flex-wrap">
                                {DURATIONS.map(d => (
                                    <button key={d} onClick={() => setDuration(d)}
                                        className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${duration === d ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-300'}`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-8 space-y-5 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-amber-500" /> Optional Context
                        </h2>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                Specific Learning Objectives <span className="text-slate-300 normal-case font-medium">(optional)</span>
                            </label>
                            <textarea
                                value={objectives}
                                onChange={e => setObjectives(e.target.value)}
                                placeholder="e.g. By the end, students should be able to: (1) define photosynthesis, (2) identify the raw materials..."
                                rows={4}
                                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 resize-none transition-colors"
                            />
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                                The more detail you provide, the more tailored the plan. You can also paste an existing objective from your scheme of work.
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl p-4">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <motion.button
                    onClick={handleGenerate}
                    disabled={!topic.trim()}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition-all"
                >
                    <Sparkles className="w-5 h-5" /> Generate Lesson Plan
                    <ChevronRight className="w-5 h-5" />
                </motion.button>
            </div>
        );
    }

    // ─── GENERATING STATE ───
    if (isGenerating) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                        <Sparkles className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-300/30 animate-ping" />
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Designing Your Lesson…</h3>
                    <p className="text-slate-500 font-medium">Applying CBC 5E framework for <span className="font-black text-emerald-600">{grade} {subject}</span></p>
                </div>
                <div className="flex gap-2">
                    {['Engage', 'Explore', 'Explain', 'Elaborate', 'Evaluate'].map((phase, i) => (
                        <motion.span
                            key={phase}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.3 + 0.5, repeat: Infinity, repeatDelay: 2 }}
                            className={`px-3 py-1 rounded-full text-xs font-black text-white ${Object.values(PHASE_BADGE)[i]}`}
                        >
                            {phase}
                        </motion.span>
                    ))}
                </div>
            </div>
        );
    }

    // ─── PLAN OUTPUT ───
    return (
        <div className="space-y-6" ref={planRef}>
            {/* Plan Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10">
                    <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-black uppercase tracking-widest mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Hub
                    </button>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full">{plan!.grade}</span>
                                <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full">{plan!.subject}</span>
                                <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />{plan!.duration}</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tight">{plan!.title}</h1>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={handleCopy}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all">
                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy Text'}
                            </button>
                            <button onClick={handleExportPDF}
                                className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                <Download className="w-4 h-4" /> Export PDF
                            </button>
                            {onPolish && (
                                <button onClick={handlePolish}
                                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-sm">
                                    <Pencil className="w-4 h-4" /> Polish Plan
                                </button>
                            )}
                            <button onClick={() => { setPlan(null); setIsGenerating(false); }}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all">
                                <RotateCcw className="w-4 h-4" /> New Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Learning Outcomes */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                    <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-widest">
                        <Target className="w-4 h-4 text-emerald-500" /> Learning Outcomes
                    </h2>
                    <ul className="space-y-2">
                        {plan!.learningOutcomes.map((o, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{o}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Resources */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                    <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-widest">
                        <BookOpen className="w-4 h-4 text-blue-500" /> Resources & Materials
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {plan!.resources.map((r, i) => (
                            <span key={i} className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                {r}
                            </span>
                        ))}
                    </div>
                </div>

                {/* CBC Values */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                    <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-widest">
                        <Award className="w-4 h-4 text-violet-500" /> CBC Core Values
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {plan!.cbcValues.map((v, i) => (
                            <span key={i} className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                {v}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* 5E Activities */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-5">
                    <Sparkles className="w-5 h-5 text-emerald-500" /> 5E CBC Learning Activities
                </h2>
                <div className="space-y-3">
                    {plan!.activities.map((a, i) => (
                        <ActivityCard key={i} activity={a} index={i} />
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Assessment */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 rounded-[2rem] p-6 shadow-sm">
                    <h2 className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5" /> Assessment Strategy
                    </h2>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">{plan!.assessment}</p>
                </div>

                {/* Differentiation */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-100 dark:border-amber-800 rounded-[2rem] p-6 shadow-sm">
                    <h2 className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5" /> Differentiation
                    </h2>
                    <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Struggling Learners</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3 leading-relaxed">{plan!.differentiation.struggling}</p>
                    <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Gifted Learners</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{plan!.differentiation.gifted}</p>
                </div>
            </div>

            {/* Homework */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800 rounded-[2rem] p-6 shadow-sm flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Homework Task</p>
                    <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{plan!.homework}</p>
                </div>
            </div>
        </div>
    );
};
