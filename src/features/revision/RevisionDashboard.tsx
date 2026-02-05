import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RevisionLanding } from './RevisionLanding';
import { RevisionSession } from './RevisionSession';
import { RevisionMode, TeacherActivity, ViewState } from '../../types';
import { Button } from '../../components/Shared';

export const RevisionDashboard: React.FC = () => {
    const navigate = useNavigate();
    const {
        isRegistered, studentProfile, logout, isPro, isPromoActive,
        revisionUsageCount, incrementRevisionUsage
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-amber-500" />
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Paper Analysis Limit</h2>
                    <p className="text-slate-500 mb-6">You have used your 5 free paper analysis scans. Upgrade to continue mastering your national goals!</p>

                    <div className="space-y-3">
                        <Button fullWidth onClick={() => navigate('/pricing')} className="py-4 text-lg bg-slate-900 border-none">
                            Upgrade for KES 10
                        </Button>
                        <button onClick={() => setShowRevisionPaywall(false)} className="text-slate-500 text-sm font-bold hover:text-slate-800">
                            Back
                        </button>
                    </div>
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
                if (!isPro && !isPromoActive && revisionUsageCount >= 5) {
                    setShowRevisionPaywall(true);
                    return;
                }
                incrementRevisionUsage();
                setRevisionData(data);
                setRevisionMode(mode);
            }}
            onNavigate={(view) => {
                if (view === ViewState.DASHBOARD) navigate('/');
            }}
        />
    );
};
