import React from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, TrendingUp, Clock, Target, Lightbulb, Activity,
    ChevronRight, Brain, BookOpen, PenTool, Sparkles, CheckCircle
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

export const LearnerAnalytics: React.FC<LearnerAnalyticsProps> = ({
    history,
    totalXP,
    levelInfo,
    subjectPerformance,
    masteryGraph,
    weakTopics
}) => {
    // Compute basic timeline stats
    const totalMins = history.length * 15 || 0; // rough proxy, 15m per interaction
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    const questionsAsked = history.filter(h => h.type === 'EXPLANATION' || h.type === 'STUDY').length;
    const quizzesTaken = history.filter(h => h.type === 'QUIZ').length;

    // Recent activity (Last 5)
    const recentActivity = history.slice().reverse().slice(0, 5);

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-6 w-full animate-in fade-in duration-300">
            <div className="w-full max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <Activity className="w-8 h-8 text-indigo-500" />
                            Learning Analytics
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Track your academic progress and mastery.</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 px-6 py-3 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-indigo-500 dark:text-indigo-400">Current Level</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">Level {levelInfo.level}</p>
                        </div>
                    </div>
                </div>

                {/* Top Level Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-5 border-l-4 border-l-amber-500">
                        <div className="flex items-center gap-3 mb-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total XP</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{totalXP.toLocaleString()}</p>
                        <p className="text-xs font-medium text-amber-600 mt-1">{levelInfo.nextLevelXP - totalXP} to Level {levelInfo.level + 1}</p>
                    </Card>

                    <Card className="p-5 border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Study Time</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{hrs}h {mins}m</p>
                        <p className="text-xs font-medium text-emerald-600 mt-1">Based on interactions</p>
                    </Card>

                    <Card className="p-5 border-l-4 border-l-purple-500">
                        <div className="flex items-center gap-3 mb-2">
                            <Brain className="w-5 h-5 text-purple-500" />
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concepts</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{questionsAsked}</p>
                        <p className="text-xs font-medium text-purple-600 mt-1">Questions explored</p>
                    </Card>

                    <Card className="p-5 border-l-4 border-l-rose-500">
                        <div className="flex items-center gap-3 mb-2">
                            <PenTool className="w-5 h-5 text-rose-500" />
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quizzes</h3>
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{quizzesTaken}</p>
                        <p className="text-xs font-medium text-rose-600 mt-1">Practice sessions</p>
                    </Card>
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Subject Performance */}
                    <Card className="lg:col-span-2 p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-6 block w-full border-b border-slate-100 pb-4">
                            <TrendingUp className="w-6 h-6 text-slate-400" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Subject Performance</h2>
                                <p className="text-xs text-slate-500">CBC-aligned grid — colour shows mastery tier</p>
                            </div>
                        </div>

                        {(() => {
                            const CBC_SUBJECTS = [
                                { name: 'Mathematics', emoji: '🔢' },
                                { name: 'English', emoji: '📖' },
                                { name: 'Kiswahili', emoji: '🗣️' },
                                { name: 'Science', emoji: '🔬' },
                                { name: 'Social Studies', emoji: '🌍' },
                                { name: 'CRE', emoji: '✝️' },
                                { name: 'Creative Arts', emoji: '🎨' },
                                { name: 'Home Science', emoji: '🍳' },
                                { name: 'Agriculture', emoji: '🌱' },
                                { name: 'Business', emoji: '💼' },
                                { name: 'Computer Science', emoji: '💻' },
                                { name: 'History', emoji: '📜' },
                            ];
                            const perfMap: Record<string, number> = {};
                            subjectPerformance.forEach(s => {
                                const matched = CBC_SUBJECTS.find(c =>
                                    s.subject.toLowerCase().includes(c.name.toLowerCase()) ||
                                    c.name.toLowerCase().includes(s.subject.toLowerCase().split(' ')[0])
                                );
                                const key = matched?.name || s.subject;
                                perfMap[key] = s.score;
                            });
                            const getCBC = (score: number) => {
                                if (score >= 80) return { code: 'EE', cls: 'bg-emerald-500 text-white border-emerald-600' };
                                if (score >= 60) return { code: 'ME', cls: 'bg-blue-500 text-white border-blue-600' };
                                if (score >= 40) return { code: 'AE', cls: 'bg-amber-400 text-white border-amber-500' };
                                return { code: 'BE', cls: 'bg-rose-500 text-white border-rose-600' };
                            };
                            const studied = CBC_SUBJECTS.filter(s => perfMap[s.name] !== undefined);
                            const weakest = [...studied].sort((a, b) => (perfMap[a.name] || 0) - (perfMap[b.name] || 0))[0];
                            if (studied.length === 0) return (
                                <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                                    <Target className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="font-medium">No subject data yet.</p>
                                    <p className="text-sm">Take some quizzes to populate your grid!</p>
                                </div>
                            );
                            return (
                                <>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-4">
                                        {CBC_SUBJECTS.map(subj => {
                                            const score = perfMap[subj.name];
                                            const cbc = score !== undefined ? getCBC(score) : null;
                                            return (
                                                <motion.div
                                                    key={subj.name}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={`rounded-2xl p-2.5 text-center border-2 ${cbc ? cbc.cls : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                                                >
                                                    <div className="text-lg mb-0.5">{subj.emoji}</div>
                                                    <p className={`text-[9px] font-black leading-tight mb-1 ${cbc ? 'text-white/90' : 'text-slate-400'}`}>{subj.name}</p>
                                                    {cbc ? (
                                                        <div>
                                                            <p className="text-sm font-black text-white leading-none">{score}%</p>
                                                            <span className="text-[8px] font-black text-white/80 uppercase">{cbc.code}</span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[8px] font-bold text-slate-300">—</p>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    {weakest && (
                                        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-3 mt-2">
                                            <Target className="w-4 h-4 text-rose-500 shrink-0" />
                                            <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                                                Weakest: <span className="font-black">{weakest.name}</span> ({perfMap[weakest.name]}%) — focus here next
                                            </p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </Card>

                    {/* Weak Topics & Insights */}
                    <div className="space-y-6">
                        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Focus Areas</h2>
                            </div>

                            {weakTopics.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-3">
                                        Based on your recent tests, we recommend reviewing:
                                    </p>
                                    {weakTopics.map((topic, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-white dark:border-slate-800 shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{topic}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No weak areas identified!</p>
                                    <p className="text-xs text-slate-500 mt-1">Keep taking tests to challenge yourself.</p>
                                </div>
                            )}
                        </Card>

                        {/* Recent Timeline */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-5 block w-full border-b border-slate-100 pb-4">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" /> History
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 flex w-full">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border-2 border-slate-300 dark:border-slate-700 mt-1">
                                            {item.type === 'QUIZ' ? <PenTool className="w-3 h-3 text-rose-500" /> : <Lightbulb className="w-4 h-4 text-amber-500" />}
                                        </div>
                                        <div className="flex-1 w-full overflow-hidden">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate w-full block">{item.topic || 'General Revision'}</p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {!isNaN(new Date(item.date).getTime()) ? new Date(item.date).toLocaleDateString() : 'Unknown Date'} • {item.type}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-400 text-center py-4">No recent activity.</p>
                                )}
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
};
