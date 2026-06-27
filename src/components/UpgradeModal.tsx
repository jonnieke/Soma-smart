import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, X, Zap, CheckCircle, ArrowRight,
    Star, Shield, TrendingUp, Lock
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const UPGRADE_MODAL_EVENT = 'soma-show-upgrade-modal';

export interface UpgradeModalEventDetail {
    feature: string;
    featureLabel: string;
    plan: string;
    limit: number;
}

// Dispatch this from anywhere to trigger the modal
export const showUpgradeModal = (detail: UpgradeModalEventDetail) => {
    window.dispatchEvent(new CustomEvent(UPGRADE_MODAL_EVENT, { detail }));
};

const PLAN_PRICES: { id: string; label: string; price: string; period: string; highlight: boolean; color: string; limits: string[] }[] = [
    {
        id: 'DAILY', label: 'Daily Pass', price: 'KSh 20', period: 'per day',
        highlight: false, color: 'border-slate-200 dark:border-slate-700',
        limits: ['120 AI generations/day', '70 quiz questions/day', '25 exam markings/day', 'Voice tutor: 30,000 chars']
    },
    {
        id: 'WEEKLY', label: 'Weekly Plan', price: 'KSh 100', period: 'per week',
        highlight: true, color: 'border-indigo-500',
        limits: ['600 AI generations/week', '350 quiz questions/week', '140 exam markings/week', 'Voice tutor: 350,000 chars', 'Classroom Simulator unlimited']
    },
    {
        id: 'MONTHLY', label: 'Monthly Plan', price: 'KSh 350', period: 'per month',
        highlight: false, color: 'border-slate-200 dark:border-slate-700',
        limits: ['2,500 AI generations/month', '1,500 quiz questions/month', '600 exam markings/month', 'Voice tutor: 1.2M chars', 'Priority AI response']
    },
];

const FEATURE_ICONS: Record<string, React.ReactNode> = {
    ai_generation: <Sparkles className="w-5 h-5 text-indigo-400" />,
    exam_guru: <Star className="w-5 h-5 text-amber-400" />,
    exam_marking: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    quiz_generation: <TrendingUp className="w-5 h-5 text-violet-400" />,
    teacher_ai: <Zap className="w-5 h-5 text-blue-400" />,
    default: <Lock className="w-5 h-5 text-slate-400" />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface UpgradeModalProps {
    onUpgrade?: (planId: string) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onUpgrade }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [detail, setDetail] = React.useState<UpgradeModalEventDetail | null>(null);
    const [selectedPlan, setSelectedPlan] = React.useState('WEEKLY');

    useEffect(() => {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent<UpgradeModalEventDetail>;
            setDetail(customEvent.detail);
            setIsOpen(true);
        };
        window.addEventListener(UPGRADE_MODAL_EVENT, handler);
        return () => window.removeEventListener(UPGRADE_MODAL_EVENT, handler);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const featureIcon = detail ? (FEATURE_ICONS[detail.feature] || FEATURE_ICONS.default) : FEATURE_ICONS.default;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                        className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-2xl shadow-black/60 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

                        {/* Close */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-5 right-5 z-10 w-9 h-9 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="p-8 md:p-10 space-y-8 relative z-10">
                            {/* Feature Limit Notice */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                    {featureIcon}
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mb-2">
                                        <Zap className="w-3 h-3" /> Daily Limit Reached
                                    </div>
                                    <h2 className="text-2xl font-black text-white leading-tight">
                                        You&apos;ve used your {detail?.featureLabel || 'feature'} allowance
                                    </h2>
                                    <p className="text-slate-400 text-sm font-medium mt-1 leading-relaxed">
                                        Your <span className="text-white font-bold">{detail?.plan || 'Free'} plan</span> allows {detail?.limit || 0} uses per day. Upgrade to unlock more learning power.
                                    </p>
                                </div>
                            </div>

                            {/* Plan Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                {PLAN_PRICES.map(plan => (
                                    <button
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                                            selectedPlan === plan.id
                                                ? 'border-indigo-500 bg-indigo-600/10'
                                                : `${plan.color} bg-white/5 hover:bg-white/10`
                                        }`}
                                    >
                                        {plan.highlight && (
                                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                                                Most Popular
                                            </span>
                                        )}
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{plan.label}</p>
                                        <p className="text-xl font-black text-white">{plan.price}</p>
                                        <p className="text-[10px] text-slate-500 font-bold mb-3">{plan.period}</p>
                                        <ul className="space-y-1">
                                            {plan.limits.slice(0, 3).map((l, i) => (
                                                <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-400 font-medium">
                                                    <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                                    {l}
                                                </li>
                                            ))}
                                        </ul>
                                        {selectedPlan === plan.id && (
                                            <div className="absolute top-3 right-3 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* What's included */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5 text-indigo-400" /> All Plans Include
                                </p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                    {['Instant AI tutor access', 'CBC-aligned content', 'All subjects covered', 'Works offline (cached)', 'No ads ever', 'Mama Soma parental view'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="flex gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                        setIsOpen(false);
                                        onUpgrade?.(selectedPlan);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all text-sm"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Upgrade to {PLAN_PRICES.find(p => p.id === selectedPlan)?.label}
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-5 text-slate-400 hover:text-white font-black text-sm transition-colors"
                                >
                                    Maybe later
                                </button>
                            </div>

                            <p className="text-center text-[10px] text-slate-600 font-medium">
                                Payments processed securely via Pesapal · Cancel anytime · KSh prices
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
