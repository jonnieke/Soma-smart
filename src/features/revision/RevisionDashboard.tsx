import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RevisionLanding } from './RevisionLanding';
import { RevisionSession } from './RevisionSession';
import { SyllabusViewer } from './SyllabusViewer';
import { NotesViewer } from './NotesViewer';
import { RevisionMode, TeacherActivity, ViewState, UserRole, ExamAnalysis } from '../../types';
import { Button } from '../../components/Shared';

type ActiveView =
    | { type: 'landing' }
    | { type: 'syllabus'; data: any }
    | { type: 'notes'; data: File | TeacherActivity }
    | { type: 'exam'; data: File | TeacherActivity; mode: RevisionMode; analysis?: ExamAnalysis };

export const RevisionDashboard: React.FC = () => {
    const navigate = useNavigate();
    const {
        isRegistered, studentProfile, logout, isPro,
        revisionUsageCount, incrementRevisionUsage, role
    } = useApp();

    const [activeView, setActiveView] = useState<ActiveView>({ type: 'landing' });
    const [showRevisionPaywall, setShowRevisionPaywall] = useState(false);

    useEffect(() => {
        if (!isRegistered) {
            navigate('/revision');
        }
    }, [isRegistered, navigate]);

    useEffect(() => {
        if (activeView.type !== 'landing') return;
        const rawPaper = sessionStorage.getItem('soma_pending_exam');
        if (!rawPaper) return;
        try {
            const paper = JSON.parse(rawPaper);
            if (paper) {
                setActiveView({ type: 'exam', data: paper as any, mode: RevisionMode.EXAM });
            }
        } catch (error) {
            console.error('Could not open pending paper:', error);
        } finally {
            sessionStorage.removeItem('soma_pending_exam');
        }
    }, [activeView.type]);

    // Helper to determine item type
    const getItemType = (data: File | TeacherActivity): 'syllabus' | 'notes' | 'paper' => {
        if (data instanceof File) return 'paper'; // User uploaded file = past paper
        const title = ((data as any).title || '').toLowerCase();
        if (title.includes('syllabus')) return 'syllabus';
        if (title.includes('notes') || title.includes('note')) return 'notes';
        return 'paper'; // Default: treat as past paper
    };

    if (showRevisionPaywall) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 p-4 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full text-center relative overflow-hidden shadow-2xl transition-colors"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400 shadow-inner">
                        <Lock className="w-10 h-10" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Success Limit Reached</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                        You&apos;ve completed your 5 free paper analysis sessions. Your journey to being a <span className="text-indigo-600 dark:text-indigo-400 font-bold">Top Candidate</span> represents an investment in your future.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Unlimited Papers & smart marking</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Predicted Questions & Exam Strategy</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            fullWidth
                            onClick={() => navigate('/pricing')}
                            className="py-5 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 border-none group"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Upgrade to Somo Pro <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </span>
                        </Button>
                        <button
                            onClick={() => setShowRevisionPaywall(false)}
                            className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors pt-4"
                        >
                            Return to Dashboard
                        </button>
                    </div>

                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-50" />
                </motion.div>
            </div>
        );
    }

    // Render active view
    if (activeView.type === 'syllabus') {
        return (
            <SyllabusViewer
                data={activeView.data}
                onExit={() => setActiveView({ type: 'landing' })}
            />
        );
    }

    if (activeView.type === 'notes') {
        return (
            <NotesViewer
                data={activeView.data}
                onStartPractice={(analysis) => {
                    setActiveView({
                        type: 'exam',
                        data: activeView.data,
                        mode: RevisionMode.LEARN,
                        analysis
                    });
                }}
                onExit={() => setActiveView({ type: 'landing' })}
            />
        );
    }

    if (activeView.type === 'exam') {
        return (
            <RevisionSession
                data={activeView.data}
                mode={activeView.mode}
                initialAnalysis={activeView.analysis}
                onExit={() => setActiveView({ type: 'landing' })}
            />
        );
    }

    return (
        <RevisionLanding
            onStartSession={(data, mode) => {
                const itemType = getItemType(data);

                // Syllabus items are always free — no paywall, straight to viewer
                if (itemType === 'syllabus') {
                    setActiveView({ type: 'syllabus', data });
                    return;
                }

                // Notes — check paywall but different viewer
                if (itemType === 'notes') {
                    if (role === UserRole.GUEST && revisionUsageCount >= 1) {
                        setShowRevisionPaywall(true);
                        return;
                    }
                    if (!isPro && role !== UserRole.GUEST && revisionUsageCount >= 3) {
                        setShowRevisionPaywall(true);
                        return;
                    }
                    incrementRevisionUsage();
                    setActiveView({ type: 'notes', data });
                    return;
                }

                // Past papers — standard paywall
                if (role === UserRole.GUEST && revisionUsageCount >= 1) {
                    setShowRevisionPaywall(true);
                    return;
                }
                if (!isPro && role !== UserRole.GUEST && revisionUsageCount >= 3) {
                    setShowRevisionPaywall(true);
                    return;
                }
                incrementRevisionUsage();
                setActiveView({ type: 'exam', data, mode });
            }}
            onNavigate={(view) => {
                if (view === ViewState.DASHBOARD) {
                    const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : '/learner');
                    navigate(target);
                }
            }}
        />
    );
};
