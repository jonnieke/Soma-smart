import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RevisionHubPage } from './RevisionHubPage';
import { RevisionSession } from './RevisionSession';
import { SyllabusViewer } from './SyllabusViewer';
import { NotesViewer } from './NotesViewer';
import { examService } from '../../services/examService';
import { examPaperBankService } from '../../services/examPaperBankService';
import { RevisionMode, TeacherActivity, ViewState, UserRole, ExamAnalysis } from '../../types';
import { Button } from '../../components/Shared';

type ActiveView =
    | { type: 'landing' }
    | { type: 'syllabus'; data: any }
    | { type: 'notes'; data: File | TeacherActivity }
    | { type: 'exam'; data: File | TeacherActivity; mode: RevisionMode; analysis?: ExamAnalysis };

export const RevisionDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        isRegistered, studentProfile, logout, isPro,
        revisionUsageCount, incrementRevisionUsage, role
    } = useApp();

    const [activeView, setActiveView] = useState<ActiveView>({ type: 'landing' });
    const [showRevisionPaywall, setShowRevisionPaywall] = useState(false);
    const [lockedPaperId, setLockedPaperId] = useState<string | number | null>(null);
    const [checkingPaperAccess, setCheckingPaperAccess] = useState(false);
    const queryParams = new URLSearchParams(location.search);
    const previewPaperId = queryParams.get('preview') === '1' ? queryParams.get('paper') : null;
    const previewSource = queryParams.get('previewSource') === 'marking_scheme' ? 'marking_scheme' : 'paper';

    const getPaperId = (data: File | TeacherActivity): string | number | null => {
        if (data instanceof File) return null;
        const payload = data as any;
        return payload?.id ?? payload?.exam_id ?? payload?.examId ?? null;
    };

    const openPaperRevision = async (paperId: string | number, fallbackPaper?: File | TeacherActivity, mode: RevisionMode = RevisionMode.EXAM) => {
        setCheckingPaperAccess(true);
        try {
            if (!isPro) {
                const access = await examPaperBankService.getAccess(paperId);
                if (!access.paid) {
                    setLockedPaperId(paperId);
                    setShowRevisionPaywall(true);
                    return;
                }
            }

            const paper = fallbackPaper || await examService.getExamForAttempt(paperId);
            if (!paper) return;
            incrementRevisionUsage();
            setActiveView({ type: 'exam', data: paper as any, mode });
        } catch (error) {
            console.error('Could not verify revision access for paper:', error);
            setLockedPaperId(paperId);
            setShowRevisionPaywall(true);
        } finally {
            setCheckingPaperAccess(false);
            sessionStorage.removeItem('soma_pending_exam');
            sessionStorage.removeItem('soma_pending_exam_id');
        }
    };

    useEffect(() => {
        // Keep the session on the dashboard so candidates can open ready papers directly.
    }, []);

    useEffect(() => {
        if (activeView.type !== 'landing') return;

        const paperId = queryParams.get('paper') || sessionStorage.getItem('soma_pending_exam_id');
        const rawPaper = sessionStorage.getItem('soma_pending_exam');

        if (previewPaperId) {
            return;
        }

        if (rawPaper) {
            try {
                const paper = JSON.parse(rawPaper);
                const rawPaperId = getPaperId(paper as any) || paperId;
                if (paper && rawPaperId) {
                    void openPaperRevision(rawPaperId, paper as any, RevisionMode.EXAM);
                }
            } catch (error) {
                console.error('Could not open pending paper:', error);
                sessionStorage.removeItem('soma_pending_exam');
                sessionStorage.removeItem('soma_pending_exam_id');
            }
            return;
        }

        if (!paperId) return;
        void openPaperRevision(paperId, undefined, RevisionMode.EXAM);

    }, [activeView.type, location.search, isPro]);

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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 p-4 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center relative overflow-hidden shadow-2xl border border-[#ece8fb] transition-colors"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300" />

                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                        <Lock className="w-10 h-10" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Revision Mode is locked</h2>
                    <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                        Exam paper revision is included in a normal SomaAI subscription. If you only need this one paper, buy the exam paper package and Revision Mode unlocks for that paper.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-bold text-slate-700">Unlimited Papers & smart marking</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-bold text-slate-700">Predicted Questions & Exam Strategy</span>
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
                        {lockedPaperId && (
                            <Button
                                fullWidth
                                onClick={() => navigate(`/exam-papers?paper=${encodeURIComponent(String(lockedPaperId))}`)}
                                className="py-4 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                            >
                                Buy this paper for Revision Mode
                            </Button>
                        )}
                        <button
                            onClick={() => setShowRevisionPaywall(false)}
                            className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors pt-4"
                        >
                            Return to Revision Hub
                        </button>
                    </div>

                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-60" />
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
        <RevisionHubPage
            initialPreviewPaperId={previewPaperId}
            initialPreviewSource={previewSource}
            onStartSession={async (data, mode) => {
                if (checkingPaperAccess) return;
                const itemType = getItemType(data);

                // Syllabus items are always free â€” no paywall, straight to viewer
                if (itemType === 'syllabus') {
                    setActiveView({ type: 'syllabus', data });
                    return;
                }

                // Notes â€” check paywall but different viewer
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

                // Exam papers: subscription unlocks all; a purchased paper unlocks revision for that paper only.
                const paperId = getPaperId(data);
                if (paperId) {
                    await openPaperRevision(paperId, data, mode);
                    return;
                }

                if (!isPro) {
                    setLockedPaperId(null);
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

