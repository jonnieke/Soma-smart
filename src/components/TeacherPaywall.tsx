import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from './Shared';
import { useNavigate } from 'react-router-dom';

interface TeacherPaywallProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TeacherPaywall: React.FC<TeacherPaywallProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
            >
                {/* Premium Header Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                    <Crown className="w-10 h-10" />
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Pro Studio Limit</h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    You&apos;ve reached your 5 free lessons this week. Upgrade to <span className="text-indigo-600 font-bold">Teacher Pro</span> to unlock unlimited studio tools and national distribution.
                </p>

                <div className="space-y-4 mb-8 text-left">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Unlimited smart lesson plans</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Kenyan National Exam Predictors</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        fullWidth
                        onClick={() => {
                            onClose();
                            navigate('/pricing');
                        }}
                        className="py-5 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 border-none group"
                    >
                        <span className="flex items-center justify-center gap-2">
                            Activate Somo Pro <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </span>
                    </Button>
                    <button
                        onClick={onClose}
                        className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors pt-4"
                    >
                        Keep Using Basic Studio
                    </button>
                </div>

                {/* Decorative blobs */}
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-50" />
            </motion.div>
        </div>
    );
};
