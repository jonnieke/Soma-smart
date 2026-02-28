import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, CheckCircle, XCircle, Clock, TrendingDown, TrendingUp, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

export const StrategyLabView: React.FC = () => {
    const {
        teachingStrategies, activeStrategies, pendingStrategies,
        pedagogicalAnalytics, isAdminAgentRunning,
        runAdminAgent, approveTeachingStrategy, rejectTeachingStrategy,
        masteryGraph, weakTopics
    } = useApp();

    const [tab, setTab] = useState<'PENDING' | 'ACTIVE' | 'ANALYTICS'>('PENDING');

    const rejectedStrategies = teachingStrategies.filter(s => s.status === 'REJECTED');

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">AI Strategy Lab</h1>
                            <p className="text-purple-200 text-sm">Super Teacher Phase 3 — Evolutionary Educator</p>
                        </div>
                    </div>
                    <p className="text-purple-100 text-sm mt-3 max-w-xl">
                        The Admin Agent analyzes student performance data across the platform and generates
                        refined teaching strategies. Approve strategies to improve the AI&apos;s teaching for all students.
                    </p>
                    <button
                        onClick={runAdminAgent}
                        disabled={isAdminAgentRunning}
                        className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAdminAgentRunning ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Performance Data...</>
                        ) : (
                            <><Zap className="w-5 h-5" /> Run Admin Agent</>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{pendingStrategies.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Active</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{activeStrategies.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-red-500 mb-1">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Weak Topics</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{weakTopics.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Topics Tracked</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{Object.keys(masteryGraph).length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
                {(['PENDING', 'ACTIVE', 'ANALYTICS'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t === 'PENDING' && `Pending (${pendingStrategies.length})`}
                        {t === 'ACTIVE' && `Active (${activeStrategies.length})`}
                        {t === 'ANALYTICS' && 'Analytics'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {tab === 'PENDING' && (
                    <motion.div
                        key="pending"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {pendingStrategies.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                                <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-800 text-lg mb-2">No Pending Strategies</h3>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                    Click &quot;Run Admin Agent&quot; above to analyze student performance and generate teaching strategy suggestions.
                                </p>
                            </div>
                        ) : (
                            pendingStrategies.map(strategy => (
                                <div key={strategy.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${strategy.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                    strategy.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {strategy.priority}
                                            </span>
                                            {strategy.targetSubject && <span className="text-xs text-slate-500">{strategy.targetSubject}</span>}
                                            {strategy.targetGrade && <span className="text-xs text-slate-400">• {strategy.targetGrade}</span>}
                                        </div>
                                        <span className="text-[10px] text-slate-400">{new Date(strategy.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Insight</p>
                                            <p className="text-sm text-slate-700">{strategy.insight}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Root Cause</p>
                                            <p className="text-sm text-slate-600">{strategy.rootCause}</p>
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Strategy (Prompt Instruction)</p>
                                            <p className="text-sm text-indigo-900 font-medium">{strategy.strategy}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected Impact</p>
                                            <p className="text-sm text-green-700 font-medium">{strategy.expectedImpact}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => approveTeachingStrategy(strategy.id)}
                                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve & Deploy
                                        </button>
                                        <button
                                            onClick={() => rejectTeachingStrategy(strategy.id)}
                                            className="flex-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}

                {tab === 'ACTIVE' && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {activeStrategies.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-800 text-lg mb-2">No Active Strategies</h3>
                                <p className="text-slate-500 text-sm">Approve pending strategies to activate them in the teaching pipeline.</p>
                            </div>
                        ) : (
                            activeStrategies.map(strategy => (
                                <div key={strategy.id} className="bg-green-50 rounded-2xl border border-green-200 p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Active — Deployed</span>
                                        {strategy.approvedAt && <span className="text-[10px] text-green-500 ml-auto">Since {new Date(strategy.approvedAt).toLocaleDateString()}</span>}
                                    </div>
                                    <p className="text-sm text-green-900 font-medium mb-2">{strategy.strategy}</p>
                                    <p className="text-xs text-green-600">{strategy.insight}</p>
                                    <button
                                        onClick={() => rejectTeachingStrategy(strategy.id)}
                                        className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                                    >
                                        Deactivate Strategy
                                    </button>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}

                {tab === 'ANALYTICS' && (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Pedagogical Analytics */}
                        {pedagogicalAnalytics ? (
                            <>
                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                                        <TrendingDown className="w-5 h-5 text-red-500" />
                                        Weakest Topics (Platform-Wide)
                                    </h3>
                                    {pedagogicalAnalytics.bottomTopics.length > 0 ? (
                                        <div className="space-y-2">
                                            {pedagogicalAnalytics.bottomTopics.map((t, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                                                    <div className="w-10 text-center">
                                                        <span className="text-lg font-black text-red-600">{t.avgMastery}%</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-800 text-sm">{t.topic}</p>
                                                        <p className="text-[10px] text-slate-500">{t.subject} • {t.studentCount} students • {t.avgAttempts} avg attempts</p>
                                                    </div>
                                                    <div className="w-24 bg-red-200 rounded-full h-2">
                                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${t.avgMastery}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm">No topic data available yet.</p>
                                    )}
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        Strongest Topics
                                    </h3>
                                    {pedagogicalAnalytics.topTopics.length > 0 ? (
                                        <div className="space-y-2">
                                            {pedagogicalAnalytics.topTopics.map((t, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                                                    <div className="w-10 text-center">
                                                        <span className="text-lg font-black text-green-600">{t.avgMastery}%</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-800 text-sm">{t.topic}</p>
                                                        <p className="text-[10px] text-slate-500">{t.subject} • {t.studentCount} students</p>
                                                    </div>
                                                    <div className="w-24 bg-green-200 rounded-full h-2">
                                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${t.avgMastery}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm">No data yet.</p>
                                    )}
                                </div>

                                <div className="text-xs text-slate-400 text-center">
                                    Last computed: {new Date(pedagogicalAnalytics.computedAt).toLocaleString()} •
                                    {pedagogicalAnalytics.totalStudentsAnalyzed} students • {pedagogicalAnalytics.totalTopicsTracked} topics
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-800 text-lg mb-2">No Analytics Available</h3>
                                <p className="text-slate-500 text-sm">Run the Admin Agent to generate pedagogical analytics from student performance data.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
