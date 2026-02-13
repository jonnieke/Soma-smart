import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RevisionLanding } from './RevisionLanding';
import { RevisionSession } from './RevisionSession';
import { RevisionMode, TeacherActivity, ViewState, UserRole } from '../../types';
import { Button } from '../../components/Shared';

export const RevisionDashboard: React.FC = () => {
    const navigate = useNavigate();
    const {
        isRegistered, studentProfile, logout, isPro,
        revisionUsageCount, incrementRevisionUsage, role
    } = useApp();

    const [revisionData, setRevisionData] = useState<File | TeacherActivity | null>(null);
    const [revisionMode, setRevisionMode] = useState<RevisionMode>(RevisionMode.LEARN);
    const [showRevisionPaywall, setShowRevisionPaywall] = useState(false);

    useEffect(() => {
        if (!isRegistered) {
            navigate('/revision');
        }
    }, [isRegistered, navigate]);

    if (showRevisionPaywall) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
                >
                    {/* Premium Header Accent */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                        <Lock className="w-10 h-10" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Success Limit Reached</h2>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        You&apos;ve completed your 5 free paper analysis sessions. Your journey to being a <span className="text-indigo-600 font-bold">Top Candidate</span> represents an investment in your future.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-bold text-slate-700">Unlock Unlimited Papers</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-bold text-slate-700">Smart Specialist Strategy Tips</span>
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

                    {/* Decorative blobs */}
                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-50" />
                </motion.div>
            </div>
        );
    }

    if (revisionData) {
        return (
            <RevisionSession
                data={revisionData}
                mode={revisionMode}
                onExit={() => setRevisionData(null)}
            />
        );
    }

    return (
        <RevisionLanding
            onStartSession={(data, mode) => {
                // 1. Enforce Guest Limit (1 Document)
                if (role === UserRole.GUEST && revisionUsageCount >= 1) {
                    setShowRevisionPaywall(true);
                    return;
                }

                // 2. Enforce Registered Free Limit (5 Documents)
                if (!isPro && role !== UserRole.GUEST && revisionUsageCount >= 5) {
                    setShowRevisionPaywall(true);
                    return;
                }

                incrementRevisionUsage();
                setRevisionData(data);
                setRevisionMode(mode);
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
