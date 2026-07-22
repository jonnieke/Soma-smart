import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, TrendingUp, Clock, Target, Lightbulb, Activity,
    ChevronRight, Brain, BookOpen, PenTool, Sparkles, CheckCircle2,
    Calculator, Languages, FlaskConical, Globe, Palette, Utensils,
    Sprout, Briefcase, Laptop, History, Award, ArrowUpRight,
    BarChart3, Compass, CheckCircle, Zap
} from 'lucide-react';
import { LevelInfo } from '../../services/gamificationService';
import { Card } from '../../components/Shared';

interface SubjectPerformance {
    subject: string;
    score: number;
    hasData: boolean;
}

interface LearnerAnalyticsProps {
    history: any[];
    totalXP: number;
    levelInfo: LevelInfo;
    subjectPerformance: SubjectPerformance[];
    masteryGraph: Record<string, number>;
    weakTopics: string[];
}

interface SubjectDefinition {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    category: string;
}

const CBC_SUBJECTS: SubjectDefinition[] = [
    { name: 'Mathematics', icon: Calculator, category: 'Sciences' },
    { name: 'English', icon: BookOpen, category: 'Languages' },
    { name: 'Kiswahili', icon: Languages, category: 'Languages' },
    { name: 'Science', icon: FlaskConical, category: 'Sciences' },
    { name: 'Social Studies', icon: Globe, category: 'Humanities' },
    { name: 'CRE', icon: Compass, category: 'Humanities' },
    { name: 'Creative Arts', icon: Palette, category: 'Applied' },
    { name: 'Home Science', icon: Utensils, category: 'Applied' },
    { name: 'Agriculture', icon: Sprout, category: 'Applied' },
    { name: 'Business', icon: Briefcase, category: 'Applied' },
    { name: 'Computer Science', icon: Laptop, category: 'Sciences' },
    { name: 'History', icon: History, category: 'Humanities' },
];

export const LearnerAnalytics: React.FC<LearnerAnalyticsProps> = ({
    history,
    totalXP,
    levelInfo,
    subjectPerformance,
    masteryGraph,
    weakTopics
}) => {
    const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'STUDIED' | 'NEEDS_PRACTICE'>('ALL');

    // Compute basic timeline stats
    const totalMins = history.length * 15 || 0; // rough proxy, 15m per interaction
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    const questionsAsked = history.filter(h => h.type === 'EXPLANATION' || h.type === 'STUDY').length;
    const quizzesTaken = history.filter(h => h.type === 'QUIZ').length;

    // Recent activity (Last 5)
    const recentActivity = history.slice().reverse().slice(0, 5);

    // Build subject map
    const perfMap: Record<string, number> = {};
    subjectPerformance.forEach(s => {
        const matched = CBC_SUBJECTS.find(c =>
            s.subject.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(s.subject.toLowerCase().split(' ')[0])
        );
        const key = matched?.name || s.subject;
        perfMap[key] = s.score;
    });

    const getCBCGrade = (score: number) => {
        if (score >= 80) {
            return {
                code: 'EE',
                label: 'Exceeding Expectations',
                badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
                barBg: 'bg-emerald-500',
                cardBg: 'border-emerald-200/80 bg-emerald-50/30'
            };
        }
        if (score >= 60) {
            return {
                code: 'ME',
                label: 'Meeting Expectations',
                badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700',
                barBg: 'bg-indigo-600',
                cardBg: 'border-indigo-200/80 bg-indigo-50/30'
            };
        }
        if (score >= 40) {
            return {
                code: 'AE',
                label: 'Approaching Expectations',
                badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-800',
                barBg: 'bg-amber-500',
                cardBg: 'border-amber-200/80 bg-amber-50/30'
            };
        }
        return {
            code: 'BE',
            label: 'Below Expectations',
            badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-800',
            barBg: 'bg-orange-500',
            cardBg: 'border-orange-200/80 bg-orange-50/30'
        };
    };

    const studiedSubjects = CBC_SUBJECTS.filter(s => perfMap[s.name] !== undefined);
    const sortedStudied = [...studiedSubjects].sort((a, b) => (perfMap[a.name] || 0) - (perfMap[b.name] || 0));
    const weakestSubject = sortedStudied[0];
    const strongestSubject = [...studiedSubjects].sort((a, b) => (perfMap[b.name] || 0) - (perfMap[a.name] || 0))[0];

    const overallAverage = studiedSubjects.length > 0
        ? Math.round(studiedSubjects.reduce((acc, s) => acc + (perfMap[s.name] || 0), 0) / studiedSubjects.length)
        : 0;

    const filteredSubjects = CBC_SUBJECTS.filter(s => {
        const hasScore = perfMap[s.name] !== undefined;
        if (selectedFilter === 'STUDIED') return hasScore;
        if (selectedFilter === 'NEEDS_PRACTICE') return hasScore && (perfMap[s.name] || 0) < 70;
        return true;
    });

    const xpProgressPercent = Math.min(
        100,
        Math.max(0, Math.round((totalXP / (levelInfo.nextLevelXP || 1000)) * 100))
    );

    return (
        <div className="bg-slate-50/80 min-h-screen p-4 sm:p-6 lg:p-8 w-full font-sans text-slate-900 animate-fadeIn">
            <div className="w-full max-w-7xl mx-auto space-y-8">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
                            <Activity className="w-3.5 h-3.5 text-indigo-600" /> Academic Dashboard
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            Learning Analytics
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Monitor your subject mastery, study milestones, and personalized growth areas.
                        </p>
                    </div>

                    {/* Level Badge Card */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-indigo-800/40 min-w-[240px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block">Current Rank</span>
                                    <h3 className="text-lg font-black text-white leading-none">Level {levelInfo.level}</h3>
                                </div>
                            </div>
                            <span className="text-xs font-bold bg-indigo-500/30 text-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-400/20">
                                {totalXP} XP
                            </span>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[11px] font-bold text-indigo-200">
                                <span>Level Progress</span>
                                <span>{xpProgressPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-indigo-950/80 rounded-full overflow-hidden p-0.5 border border-indigo-700/40">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgressPercent}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-indigo-400 via-sky-400 to-amber-300 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Metric Cards (Red-free palette: Amber, Emerald, Indigo, Sky) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Total XP Card */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 font-bold group-hover:scale-105 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Experience</span>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{totalXP.toLocaleString()}</p>
                        <p className="text-xs font-medium text-amber-700 mt-1 flex items-center gap-1">
                            <span>+{levelInfo.nextLevelXP - totalXP} XP to Level {levelInfo.level + 1}</span>
                        </p>
                    </div>

                    {/* Study Time Card */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 font-bold group-hover:scale-105 transition-transform">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Study Time</span>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{hrs}h {mins}m</p>
                        <p className="text-xs font-medium text-emerald-700 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active engagement
                        </p>
                    </div>

                    {/* Concepts Explored Card */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3 font-bold group-hover:scale-105 transition-transform">
                            <Brain className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Concepts Explored</span>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{questionsAsked}</p>
                        <p className="text-xs font-medium text-indigo-700 mt-1 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-indigo-500" /> Akili AI consultations
                        </p>
                    </div>

                    {/* Quizzes & Practice Card (Sky/Blue instead of harsh red) */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-3 font-bold group-hover:scale-105 transition-transform">
                            <PenTool className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Practice Drills</span>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{quizzesTaken}</p>
                        <p className="text-xs font-medium text-sky-700 mt-1 flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5 text-sky-500" /> Quizzes completed
                        </p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Subject Performance Section (8 columns) */}
                    <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                        {/* Header & Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <BarChart3 className="w-6 h-6 text-indigo-600" /> Subject Performance
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                    CBC Competency Levels (EE, ME, AE, BE)
                                </p>
                            </div>

                            {/* Overall Average Pill */}
                            {studiedSubjects.length > 0 && (
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl">
                                    <div>
                                        <span className="text-[9px] font-black uppercase text-slate-400 block">Overall Mean</span>
                                        <span className="text-base font-black text-slate-900">{overallAverage}%</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                        {getCBCGrade(overallAverage).code}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <button
                                onClick={() => setSelectedFilter('ALL')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    selectedFilter === 'ALL'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                All Subjects ({CBC_SUBJECTS.length})
                            </button>
                            <button
                                onClick={() => setSelectedFilter('STUDIED')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    selectedFilter === 'STUDIED'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Assessed ({studiedSubjects.length})
                            </button>
                            <button
                                onClick={() => setSelectedFilter('NEEDS_PRACTICE')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    selectedFilter === 'NEEDS_PRACTICE'
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Growth Target (&lt;70%)
                            </button>
                        </div>

                        {/* Subjects Grid */}
                        {filteredSubjects.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                                {filteredSubjects.map(subj => {
                                    const score = perfMap[subj.name];
                                    const cbc = score !== undefined ? getCBCGrade(score) : null;
                                    const IconComponent = subj.icon;

                                    return (
                                        <motion.div
                                            key={subj.name}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                                                cbc
                                                    ? cbc.cardBg
                                                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                                    cbc ? 'bg-white shadow-sm text-slate-800' : 'bg-slate-200/70 text-slate-500'
                                                }`}>
                                                    <IconComponent className="w-5 h-5" />
                                                </div>

                                                {cbc ? (
                                                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase ${cbc.badgeBg}`}>
                                                        {cbc.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-200/50 px-2 py-0.5 rounded">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold text-slate-800 leading-tight mb-1 truncate">
                                                    {subj.name}
                                                </p>

                                                {cbc ? (
                                                    <div className="space-y-1.5 pt-1">
                                                        <div className="flex items-baseline justify-between">
                                                            <span className="text-lg font-black text-slate-900">{score}%</span>
                                                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[90px]" title={cbc.label}>
                                                                {cbc.label.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${cbc.barBg}`}
                                                                style={{ width: `${score}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-slate-400 font-medium pt-1">No quizzes taken</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-700">No subject data matching filter.</p>
                                <p className="text-xs text-slate-500 mt-1">Take quizzes or solve practice papers to view subject performance.</p>
                            </div>
                        )}

                        {/* Weakest Subject Focus Recommendation (Warm Amber/Indigo styling instead of scary red) */}
                        {weakestSubject && (
                            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-indigo-50/50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm mt-0.5 sm:mt-0">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Recommended Practice Target</span>
                                        <h4 className="text-sm font-black text-slate-900 mt-0.5">
                                            {weakestSubject.name} ({perfMap[weakestSubject.name]}%)
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            Focusing 15 minutes on {weakestSubject.name} today will give you the biggest score boost!
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href="/revision"
                                    className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5"
                                >
                                    <span>Practice {weakestSubject.name}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Focus Areas & Activity (4 columns) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Growth & Weak Topics Panel */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-indigo-600" /> Focus Topics
                                </h3>
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                                    AI Identified
                                </span>
                            </div>

                            {weakTopics.length > 0 ? (
                                <div className="space-y-2.5">
                                    <p className="text-xs text-slate-500 font-medium">
                                        Topics identified from your recent tests for review:
                                    </p>
                                    {weakTopics.map((topic, i) => (
                                        <div
                                            key={i}
                                            className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/70 hover:border-amber-200 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                                <span className="text-xs font-bold text-slate-800 truncate">{topic}</span>
                                            </div>
                                            <a
                                                href={`/revision?topic=${encodeURIComponent(topic)}`}
                                                className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 shrink-0 group-hover:translate-x-0.5 transition-transform"
                                            >
                                                Revise &rarr;
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <CheckCircle className="w-9 h-9 text-emerald-500 mx-auto mb-2 opacity-80" />
                                    <h4 className="text-sm font-bold text-slate-800">All Topics Strong!</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                                        You are meeting or exceeding expectations across your active topics.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Recent History Timeline */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-500" /> Recent Activity
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Timeline
                                </span>
                            </div>

                            <div className="space-y-3.5">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((item, i) => {
                                        const isQuiz = item.type === 'QUIZ';
                                        return (
                                            <div key={i} className="flex items-start gap-3 text-left group">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-bold mt-0.5 ${
                                                    isQuiz
                                                        ? 'bg-sky-50 border-sky-200 text-sky-600'
                                                        : 'bg-amber-50 border-amber-200 text-amber-600'
                                                }`}>
                                                    {isQuiz ? <PenTool className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                                        {item.topic || 'General Revision'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                        {!isNaN(new Date(item.date).getTime())
                                                            ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                            : 'Recent'} • <span className="font-semibold text-slate-600">{item.type}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-slate-400 text-center py-6">No recent activity logged yet.</p>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default LearnerAnalytics;
