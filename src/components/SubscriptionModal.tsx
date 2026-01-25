import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star, Shield, Zap, X, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
    const { upgradeAccount } = useApp();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'DAILY' | 'MONTHLY'>('MONTHLY');

    if (!isOpen) return null;

    const handleSubscribe = async () => {
        setLoading(true);
        // Simulate M-Pesa STK Push
        await upgradeAccount(selectedPlan);

        setLoading(false);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#00FF00']
        });
        onClose();
    };

    const benefits = [
        "Unlimited Exam Scanning & AI Help",
        "Personalized Revision Plans",
        "Detailed Performance Analytics",
        "Parent Progress Tracking",
        "Priority Support"
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Decorative Header Background */}
                    <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-b-[50%] scale-x-150 -translate-y-10 z-0"></div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 pt-8 px-6 pb-8 text-center">
                        {/* Icon/Logo area */}
                        <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 transform rotate-3">
                            <Sparkles className="w-10 h-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 fill-current" />
                        </div>

                        <h2 className="text-3xl font-extrabold text-slate-900 mb-1">Upgrade to Pro</h2>
                        <p className="text-slate-500 font-medium text-sm mb-6">Unlock your full learning potential.</p>

                        {/* Free Trial Badge */}
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-emerald-200 mb-8 animate-bounce">
                            <Shield className="w-3 h-3 fill-white" />
                            First 30 Days Free!
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {/* Daily Plan */}
                            <button
                                onClick={() => setSelectedPlan('DAILY')}
                                className={`group relative p-4 rounded-2xl border-2 transition-all text-left ${selectedPlan === 'DAILY' ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200' : 'border-slate-100 bg-white hover:border-indigo-300'}`}
                            >
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    FLEXIBLE
                                </div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Daily</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-slate-800">20</span>
                                    <span className="text-xs font-bold text-slate-400">KES</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Pay as you go</p>
                            </button>

                            {/* Monthly Plan - Highlighted */}
                            <button
                                onClick={() => setSelectedPlan('MONTHLY')}
                                className={`group relative p-4 rounded-2xl border-2 transition-all text-left ${selectedPlan === 'MONTHLY' ? 'border-indigo-500 bg-indigo-600 text-white shadow-xl shadow-indigo-200 transform scale-105' : 'border-slate-100 bg-white hover:border-indigo-300'}`}
                            >
                                {selectedPlan === 'MONTHLY' && (
                                    <div className="absolute top-0 right-0 bg-white text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-bl-xl rounded-tr-lg">
                                        BEST VALUE
                                    </div>
                                )}
                                <div className="absolute -top-3 -left-3">
                                    {selectedPlan === 'MONTHLY' && <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-sm" />}
                                </div>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedPlan === 'MONTHLY' ? 'text-indigo-100' : 'text-slate-500'}`}>Monthly</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-black ${selectedPlan === 'MONTHLY' ? 'text-white' : 'text-slate-800'}`}>100</span>
                                    <span className={`text-xs font-bold ${selectedPlan === 'MONTHLY' ? 'text-indigo-200' : 'text-slate-400'}`}>KES</span>
                                </div>
                                <p className={`text-[10px] mt-1 ${selectedPlan === 'MONTHLY' ? 'text-indigo-100' : 'text-slate-400'}`}>Save 83%</p>
                            </button>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-3 mb-8 text-left pl-4">
                            {benefits.map((benefit, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Starting Trial...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                                    Start Free Trial ({selectedPlan === 'MONTHLY' ? 'Monthly' : 'Daily'})
                                </>
                            )}
                        </button>
                        <p className="text-xs text-slate-400 mt-3 font-medium">No credit card required for trial.</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
