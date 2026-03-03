import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertCircle, Info, Brain } from 'lucide-react';

interface TopicMastery {
    topic: string;
    mastery: number; // 0-100
    frequency: number; // 0-100 (Frequency in past 10 years)
    subject: string;
}

export const MasteryHeatmap: React.FC<{ data?: TopicMastery[] }> = ({ data }) => {
    // Mock data if none provided
    const topics = useMemo(() => data || [
        { topic: "Matrices & Transformations", mastery: 45, frequency: 95, subject: "Mathematics" },
        { topic: "Calculus", mastery: 30, frequency: 85, subject: "Mathematics" },
        { topic: "Commercial Arithmetic", mastery: 70, frequency: 90, subject: "Mathematics" },
        { topic: "Waves I & II", mastery: 85, frequency: 75, subject: "Physics" },
        { topic: "Current Electricity", mastery: 40, frequency: 92, subject: "Physics" },
        { topic: "Genetics", mastery: 55, frequency: 88, subject: "Biology" },
        { topic: "Evolution", mastery: 90, frequency: 40, subject: "Biology" },
        { topic: "Organic Chemistry", mastery: 35, frequency: 98, subject: "Chemistry" },
    ], [data]);

    // Identification of "Critical" topics: High Frequency + Low Mastery
    const criticalTopics = useMemo(() =>
        topics.filter(t => t.frequency > 70 && t.mastery < 60)
            .sort((a, b) => b.frequency - a.frequency)
        , [topics]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Mastery Heatmap</h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Targeting High-Frequency Exam Topics</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Improving</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mastered</span>
                    </div>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {topics.map((t, i) => {
                    const isCritical = t.frequency > 75 && t.mastery < 50;
                    const statusColor = t.mastery > 80 ? 'emerald' : t.mastery > 50 ? 'amber' : 'rose';

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-5 rounded-2xl border transition-all relative overflow-hidden group hover:-translate-y-1 ${statusColor === 'rose' ? 'bg-rose-50/30 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30' :
                                    statusColor === 'amber' ? 'bg-amber-50/30 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30' :
                                        'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">{t.subject}</span>
                                {isCritical && (
                                    <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse" />
                                )}
                            </div>

                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {t.topic}
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                                        <span className="opacity-40">Mastery</span>
                                        <span className={`text-${statusColor}-600`}>{t.mastery}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${t.mastery}%` }}
                                            className={`h-full bg-${statusColor}-500 rounded-full`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                                        <span className="opacity-40">Frequency</span>
                                        <span className="text-slate-500">{t.frequency}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/40 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${t.frequency}%` }}
                                            className="h-full bg-indigo-500/40 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* AI Insight Card */}
            {criticalTopics.length > 0 && (
                <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-indigo-100 dark:shadow-none">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 dark:bg-slate-900/5 flex items-center justify-center shrink-0">
                        <Brain className="w-8 h-8 text-white dark:text-slate-900" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="text-white dark:text-slate-900 font-black text-lg mb-1 tracking-tight">Strategic Priority Identified</h4>
                        <p className="text-white/60 dark:text-slate-500 text-sm font-medium">
                            <span className="text-rose-400 font-bold">"{criticalTopics[0].topic}"</span> has a 98% chance of appearing in the upcoming exams. You currently have {criticalTopics[0].mastery}% mastery. We recommend a deep-dive revision session today.
                        </p>
                    </div>
                    <button className="bg-indigo-600 dark:bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shrink-0 shadow-lg shadow-indigo-500/20">
                        Solve Past Papers
                    </button>
                </div>
            )}
        </div>
    );
};
