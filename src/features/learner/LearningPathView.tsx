import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Loader2, ChevronRight, Lock, CheckCircle2,
    Flame, Target, Brain, BookOpen, TrendingUp, Clock,
    ArrowRight, Star, AlertTriangle
} from 'lucide-react';
import { generatePersonalisedPath, LearningPathTopic } from '../../services/geminiService';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    MASTERED:     { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Mastered' },
    IN_PROGRESS:  { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'In Progress' },
    RECOMMENDED:  { color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', label: 'Recommended' },
    LOCKED:       { color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', label: 'Locked' },
};

const DIFF_DOT: Record<string, string> = {
    EASY: 'bg-emerald-500', MEDIUM: 'bg-blue-500', HARD: 'bg-violet-500'
};

// ─────────────────────────────────────────────────────────────────────────────
// Step Card
// ─────────────────────────────────────────────────────────────────────────────

const StepCard: React.FC<{
    topic: LearningPathTopic;
    index: number;
    onStart?: (topic: string) => void;
}> = ({ topic, index, onStart }) => {
    const [expanded, setExpanded] = useState(false);
    const isLocked = topic.status === 'LOCKED';
    const isMastered = topic.status === 'MASTERED';
    const statusCfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG.LOCKED;

    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative flex gap-4 ${isLocked ? 'opacity-50' : ''}`}
        >
            {/* Connector */}
            {index > 0 && (
                <div className="absolute left-5 -top-4 w-px h-4 bg-slate-200 dark:bg-slate-700" />
            )}

            {/* Bubble */}
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mt-1 ${
                isMastered ? 'bg-emerald-500' :
                !isLocked ? 'bg-indigo-600' :
                'bg-slate-200 dark:bg-slate-700'
            }`}>
                {isMastered
                    ? <CheckCircle2 className="w-5 h-5 text-white" />
                    : isLocked
                        ? <Lock className="w-4 h-4 text-slate-400" />
                        : <span className="text-sm font-black text-white">{index + 1}</span>}
            </div>

            {/* Card */}
            <div
                className={`flex-1 rounded-2xl border-2 overflow-hidden transition-all ${
                    isMastered ? 'border-emerald-100 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-900/10' :
                    !isLocked ? 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer' :
                    'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'
                }`}
                onClick={() => !isLocked && setExpanded(e => !e)}
            >
                <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                {statusCfg.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {topic.estimatedMinutes}m
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{topic.subject}</span>
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm leading-snug">{topic.topic}</h4>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-xs font-black text-slate-900 dark:text-white">{topic.masteryPercent}%</p>
                        <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div
                                className={`h-full rounded-full ${DIFF_DOT[topic.difficulty] || 'bg-indigo-500'}`}
                                style={{ width: `${topic.masteryPercent}%` }}
                            />
                        </div>
                    </div>
                    {!isLocked && (
                        <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    )}
                </div>

                <AnimatePresence>
                    {expanded && !isLocked && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30"
                        >
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-3">
                                {topic.rationale}
                            </p>
                            {topic.prerequisite && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black mb-3 flex items-center gap-1">
                                    <Target className="w-3 h-3" /> Prerequisite: {topic.prerequisite}
                                </p>
                            )}
                            {onStart && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onStart(topic.topic); }}
                                    className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:gap-2.5 transition-all"
                                >
                                    <Brain className="w-3.5 h-3.5" /> Start Practice <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface LearningPathViewProps {
    grade?: string;
    subjects?: string[];
    masteryMap?: Record<string, number>;
    completedTopics?: string[];
    weakTopics?: string[];
    streak?: number;
    avgScore?: number;
    onStartTopic?: (topic: string) => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
    grade = 'Form 3',
    subjects = ['Mathematics', 'English', 'Science'],
    masteryMap = {},
    completedTopics = [],
    weakTopics = [],
    streak = 0,
    avgScore = 0,
    onStartTopic,
}) => {
    const [path, setPath] = useState<LearningPathTopic[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await generatePersonalisedPath(grade, subjects, masteryMap, completedTopics, weakTopics);
            setPath(result);
        } catch {
            setError('Could not generate your learning path. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [grade, subjects, masteryMap, completedTopics, weakTopics]);

    const masteredCount = path?.filter(t => t.status === 'MASTERED').length ?? 0;
    const totalCount = path?.length ?? 0;

    return (
        <div className="space-y-6">
            {/* Hero header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 rounded-[2.5rem] p-7 text-white shadow-2xl shadow-indigo-500/20 border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Akili AI · Personalised
                    </p>
                    <h2 className="text-3xl font-black tracking-tight mb-2">My Learning Path</h2>
                    <p className="text-indigo-200 font-medium max-w-sm text-sm leading-relaxed mb-5">
                        An adaptive 8-week plan built from your mastery data — remediation first, stretch goals last.
                    </p>

                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { label: 'Avg Score', value: `${avgScore}%`, icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-300" /> },
                            { label: 'Streak', value: `${streak}d`, icon: <Flame className="w-3.5 h-3.5 text-amber-300" /> },
                            { label: 'Focus Areas', value: String(weakTopics.length || Object.keys(masteryMap).length), icon: <Target className="w-3.5 h-3.5 text-rose-300" /> },
                        ].map((s, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-0.5 flex items-center gap-1">{s.icon}{s.label}</p>
                                <p className="text-xl font-black">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-white text-indigo-800 hover:bg-indigo-50 font-black text-sm px-6 py-3 rounded-2xl transition-all shadow-xl shadow-indigo-900/30 disabled:opacity-60"
                    >
                        {isLoading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Building path…</>
                            : <><Sparkles className="w-4 h-4" /> {path ? 'Regenerate Path' : 'Generate My Path'}</>}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {/* Loading shimmer */}
            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0 mt-1" />
                            <div className="flex-1 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-4">
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2 w-1/4" />
                                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Generated path */}
            {path && !isLoading && (
                <div className="space-y-6">
                    {/* Progress bar */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-400" /> Path Progress
                            </p>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{masteredCount}/{totalCount} mastered</p>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(masteredCount / Math.max(1, totalCount)) * 100}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                            />
                        </div>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                                const count = path.filter(t => t.status === status).length;
                                if (count === 0) return null;
                                return (
                                    <span key={status} className={`text-[10px] font-black px-2 py-1 rounded-full ${cfg.color}`}>
                                        {cfg.label}: {count}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Grouped by recommended first */}
                    {['RECOMMENDED', 'IN_PROGRESS', 'MASTERED', 'LOCKED'].map(status => {
                        const group = path.filter(t => t.status === status);
                        if (group.length === 0) return null;
                        return (
                            <div key={status}>
                                <div className="flex items-center gap-3 mb-3">
                                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        {STATUS_CONFIG[status]?.label ?? status}
                                    </h3>
                                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <div className="space-y-3 ml-2">
                                    {group.map((topic, idx) => (
                                        <StepCard
                                            key={idx}
                                            topic={topic}
                                            index={path.indexOf(topic)}
                                            onStart={onStartTopic}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty prompt */}
            {!path && !isLoading && (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xl mb-2">Ready to build your path?</h3>
                    <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto leading-relaxed mb-5">
                        Akili AI will analyse your mastery data and create a personalised 8-topic study roadmap, tackling your weakest areas first.
                    </p>
                    <button
                        onClick={handleGenerate}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Sparkles className="w-4 h-4" /> Generate My Path
                    </button>
                </div>
            )}
        </div>
    );
};
