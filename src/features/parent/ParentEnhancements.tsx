import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateParentInsight } from '../../services/geminiService';

// ─────────────────────────────────────────────────────────────────────────────
// SubjectHeatmap
// ─────────────────────────────────────────────────────────────────────────────

interface SubjectHeatmapProps {
    activityLog: Array<{ subject?: string; date?: string; score?: number; created_at?: string }>;
    masteryMap?: Record<string, number>;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SubjectHeatmap: React.FC<SubjectHeatmapProps> = ({ activityLog, masteryMap = {} }) => {
    // Build a subject → per-day activity count for the last 7 days
    const today = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
    });

    const subjects = [...new Set([
        ...activityLog.map(a => a.subject).filter(Boolean),
        ...Object.keys(masteryMap).slice(0, 6),
    ])].slice(0, 8) as string[];

    if (subjects.length === 0) return null;

    // Count activity per subject per day
    const grid: Record<string, Record<string, number>> = {};
    subjects.forEach(sub => {
        grid[sub] = {};
        last7.forEach(d => { grid[sub][d] = 0; });
    });

    activityLog.forEach(a => {
        const dateStr = (a.created_at || a.date || '').slice(0, 10);
        const sub = a.subject;
        if (sub && grid[sub] && grid[sub][dateStr] !== undefined) {
            grid[sub][dateStr] += 1;
        }
    });

    const getCellColor = (count: number, mastery: number) => {
        if (count === 0 && mastery === 0) return 'bg-slate-100 dark:bg-slate-800';
        const intensity = Math.min(1, (count + mastery / 100) / 2);
        if (intensity > 0.7) return 'bg-emerald-500';
        if (intensity > 0.4) return 'bg-emerald-400';
        if (intensity > 0.1) return 'bg-emerald-200 dark:bg-emerald-700';
        return 'bg-slate-200 dark:bg-slate-700';
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest mb-4">
                7-Day Activity Heatmap
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr>
                            <th className="text-left text-slate-400 font-black uppercase tracking-widest text-[10px] pr-3 pb-2 w-24">Subject</th>
                            {last7.map((d, i) => (
                                <th key={d} className="text-center text-slate-400 font-black uppercase tracking-widest text-[10px] pb-2 px-1">
                                    {DAY_LABELS[new Date(d + 'T00:00:00').getDay() === 0 ? 6 : new Date(d + 'T00:00:00').getDay() - 1]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map(sub => (
                            <tr key={sub}>
                                <td className="text-slate-600 dark:text-slate-300 font-bold text-[11px] pr-3 py-1 truncate max-w-[90px]">{sub}</td>
                                {last7.map(d => {
                                    const count = grid[sub][d] || 0;
                                    const mastery = masteryMap[sub] || 0;
                                    const title = `${sub} on ${d}: ${count} session${count !== 1 ? 's' : ''}`;
                                    return (
                                        <td key={d} className="px-1 py-1">
                                            <div
                                                title={title}
                                                className={`w-6 h-6 rounded-md mx-auto transition-all hover:scale-110 cursor-default ${getCellColor(count, mastery)}`}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center gap-2 mt-4 justify-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Less</span>
                {['bg-slate-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500'].map((c, i) => (
                    <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c} dark:${c}`} />
                ))}
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">More</span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ParentAIInsight
// ─────────────────────────────────────────────────────────────────────────────

interface ParentAIInsightProps {
    studentName: string;
    activityLog: Array<{ created_at?: string; date?: string; subject?: string; score?: number }>;
    masteryMap?: Record<string, number>;
    streak?: number;
}

export const ParentAIInsight: React.FC<ParentAIInsightProps> = ({
    studentName, activityLog, masteryMap = {}, streak = 0
}) => {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    const today = new Date().toISOString().slice(0, 10);
    const weeklyCount = activityLog.filter(a => {
        const d = (a.created_at || a.date || '').slice(0, 10);
        const daysAgo = (Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000;
        return daysAgo <= 7;
    }).length;

    const subjectSummary = Object.entries(masteryMap).map(([subject, score]) => ({ subject, score }));

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const text = await generateParentInsight(studentName, weeklyCount, subjectSummary, streak);
            setInsight(text);
            setGenerated(true);
        } catch {
            setInsight(`${studentName} has been working hard this week! Encourage daily study sessions for best results.`);
            setGenerated(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-violet-500/20 border border-white/10">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-black flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-300" /> Smart Parent Insight
                    </h3>
                    {generated ? (
                        <p className="text-white/90 text-sm leading-relaxed font-medium">{insight}</p>
                    ) : (
                        <p className="text-white/60 text-sm italic font-medium">
                            Get a personalised weekly summary for {studentName}…
                        </p>
                    )}
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/20 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all disabled:opacity-60"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {loading ? 'Thinking…' : generated ? 'Refresh' : 'Generate'}
                </button>
            </div>
        </div>
    );
};
