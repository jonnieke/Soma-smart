import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, TrendingUp, TrendingDown, BookOpen, Award,
    AlertTriangle, CheckCircle, Flame, MessageSquare
} from 'lucide-react';

interface StudentDetailProps {
    student: {
        id: string;
        name: string;
        grade?: string;
        studentId?: string;
        avgMastery?: number;
        streak?: number;
        topicMastery?: { topic: string; mastery: number }[];
        status?: 'AT_RISK' | 'DEVELOPING' | 'SECURE' | 'EXCELLENT';
        xp?: number;
    } | null;
    onClose: () => void;
    onMessageParent?: (studentId: string) => void;
}

const STATUS_CONFIG = {
    AT_RISK: { label: 'At Risk', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
    DEVELOPING: { label: 'Developing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: <TrendingUp className="w-4 h-4 text-amber-500" /> },
    SECURE: { label: 'Secure', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: <CheckCircle className="w-4 h-4 text-blue-500" /> },
    EXCELLENT: { label: 'Excellent', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: <Award className="w-4 h-4 text-emerald-500" /> },
};

export const StudentDetailModal: React.FC<StudentDetailProps> = ({ student, onClose, onMessageParent }) => {
    if (!student) return null;

    const status = student.status || 'DEVELOPING';
    const statusCfg = STATUS_CONFIG[status];
    const mastery = student.avgMastery ?? 0;
    const topics = student.topicMastery ?? [];
    const strong = [...topics].sort((a, b) => b.mastery - a.mastery).slice(0, 3);
    const weak = [...topics].sort((a, b) => a.mastery - b.mastery).slice(0, 3);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Slide-over panel */}
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="relative w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                        <button onClick={onClose}
                            className="absolute top-5 right-5 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                                <span className="text-2xl font-black">{student.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">{student.name}</h2>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                    {student.grade && (
                                        <span className="bg-white/20 text-white text-xs font-black px-2.5 py-0.5 rounded-full">{student.grade}</span>
                                    )}
                                    {student.studentId && (
                                        <span className="bg-white/10 text-white/80 text-xs font-bold px-2.5 py-0.5 rounded-full">ID: {student.studentId}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-3 gap-3 relative z-10">
                            <div className="bg-white/10 rounded-2xl p-3 border border-white/20">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Mastery</p>
                                <p className="text-2xl font-black">{mastery}%</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3 border border-white/20">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1 flex items-center gap-1"><Flame className="w-3 h-3 text-amber-300" />Streak</p>
                                <p className="text-2xl font-black">{student.streak ?? 0}d</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3 border border-white/20">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">XP</p>
                                <p className="text-2xl font-black">{student.xp ?? 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Status badge */}
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${statusCfg.color}`}>
                                {statusCfg.icon} {statusCfg.label}
                            </span>
                            <p className="text-xs text-slate-400 font-medium">
                                {status === 'AT_RISK' ? 'This student needs urgent intervention.' :
                                 status === 'DEVELOPING' ? 'Making progress — needs consistent practice.' :
                                 status === 'SECURE' ? 'Performing well across most topics.' :
                                 'Outstanding performance across all topics!'}
                            </p>
                        </div>

                        {/* Overall mastery bar */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Overall Mastery</p>
                                <p className="font-black text-slate-900 dark:text-white">{mastery}%</p>
                            </div>
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${mastery}%` }}
                                    transition={{ duration: 0.8 }}
                                    className={`h-full rounded-full ${mastery >= 70 ? 'bg-emerald-500' : mastery >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                />
                            </div>
                        </div>

                        {topics.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                                {/* Strongest */}
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> Strongest
                                    </p>
                                    <ul className="space-y-1.5">
                                        {strong.map((t, i) => (
                                            <li key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[70%]">{t.topic}</span>
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">{t.mastery}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* Weakest */}
                                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" /> Needs Work
                                    </p>
                                    <ul className="space-y-1.5">
                                        {weak.map((t, i) => (
                                            <li key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[70%]">{t.topic}</span>
                                                <span className="font-black text-rose-600 dark:text-rose-400 shrink-0">{t.mastery}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* All topics */}
                        {topics.length > 0 && (
                            <div>
                                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" /> All Topics ({topics.length})
                                </p>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {[...topics].sort((a, b) => b.mastery - a.mastery).map((t, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-end mb-0.5">
                                                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[70%]">{t.topic}</span>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-200 ml-1">{t.mastery}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${t.mastery >= 70 ? 'bg-emerald-500' : t.mastery >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${t.mastery}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {onMessageParent && (
                            <button
                                onClick={() => onMessageParent(student.id)}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <MessageSquare className="w-4 h-4" /> Message Parent
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
