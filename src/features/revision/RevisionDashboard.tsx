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

import { STUDENT_PLANS } from '../../data/pricing';
import { PaymentFlow } from '../subscription/PaymentFlow';

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
    const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(null);
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
            setShowRevisionPaywall(true);
        } finally {
            setCheckingPaperAccess(false);
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

    const getItemType = (data: File | TeacherActivity): 'syllabus' | 'notes' | 'paper' => {
        if (data instanceof File) return 'paper';
        const payload = data as any;
        const category = (payload?.category || payload?.resource_type || payload?.type || '').toUpperCase();
        if (category === 'SYLLABUS') return 'syllabus';
        if (category === 'NOTE' || category === 'NOTES' || category === 'STUDY_NOTE') return 'notes';
        return 'paper'; // Default: treat as past paper
    };

    if (selectedPlanForCheckout) {
        return (
            <PaymentFlow
                plan={selectedPlanForCheckout}
                materialId={lockedPaperId ? String(lockedPaperId) : undefined}
                onSuccess={() => {
                    setSelectedPlanForCheckout(null);
                    setShowRevisionPaywall(false);
                    if (lockedPaperId) {
                        openPaperRevision(lockedPaperId);
                    }
                }}
                onCancel={() => setSelectedPlanForCheckout(null)}
            />
        );
    }

    if (showRevisionPaywall) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative overflow-hidden border border-slate-200"
                >
                    <div className="text-center mb-5">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-100 shadow-2xs">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-slate-950 tracking-tight">Unlock Revision Mode</h2>
                        <p className="text-slate-500 text-xs font-medium mt-1">
                            Choose a pass to attempt full papers with timer and smart marking scheme.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 mb-5">
                        <button
                            onClick={() => {
                                const plan = STUDENT_PLANS.find(p => p.duration === 'DAILY') || STUDENT_PLANS[0];
                                setSelectedPlanForCheckout(plan);
                            }}
                            className="w-full p-3.5 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 bg-white transition-all text-left flex items-center justify-between group shadow-2xs"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 font-black text-xs flex items-center justify-center transition-colors">
                                    1D
                                </span>
                                <div>
                                    <p className="text-xs font-black text-slate-900">Daily Pass</p>
                                    <p className="text-[10px] text-slate-500 font-semibold">24h unlimited paper revision</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                KES 20
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const plan = STUDENT_PLANS.find(p => p.duration === 'WEEKLY') || STUDENT_PLANS[1];
                                setSelectedPlanForCheckout(plan);
                            }}
                            className="w-full p-3.5 rounded-2xl border-2 border-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/60 transition-all text-left flex items-center justify-between group shadow-xs relative"
                        >
                            <span className="absolute -top-2.5 right-4 bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                                Most Popular
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                                    7D
                                </span>
                                <div>
                                    <p className="text-xs font-black text-slate-900">Weekly Pass</p>
                                    <p className="text-[10px] text-slate-500 font-semibold">7 days full papers &amp; marking</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                                KES 100
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const plan = STUDENT_PLANS.find(p => p.duration === 'MONTHLY') || STUDENT_PLANS[2];
                                setSelectedPlanForCheckout(plan);
                            }}
                            className="w-full p-3.5 rounded-2xl border-2 border-emerald-500 hover:bg-emerald-50/40 bg-white transition-all text-left flex items-center justify-between group shadow-2xs relative"
                        >
                            <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                                Best Value
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                                    30D
                                </span>
                                <div>
                                    <p className="text-xs font-black text-slate-900">Monthly Pass</p>
                                    <p className="text-[10px] text-slate-500 font-semibold">30 days unlimited access</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                KES 300
                            </span>
                        </button>
                    </div>

                    <div className="space-y-2 text-center pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setShowRevisionPaywall(false)}
                            className="text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors py-1 block mx-auto"
                        >
                            Return to Revision Hub
                        </button>
                    </div>
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

