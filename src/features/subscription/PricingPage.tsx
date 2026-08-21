import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Star, ShieldCheck, Smartphone, Building2, UserCircle2, GraduationCap, ArrowRight, X, BookOpen, FileSearch, Mic } from 'lucide-react';
import { STUDENT_PLANS, TEACHER_PLANS, SCHOOL_PLANS } from '../../data/pricing';
import { SubscriptionPlan, UserSegment } from '../../types';
import { getPlanLimit } from '../../services/planLimitService';

interface Props {
    onSelectPlan: (plan: SubscriptionPlan) => void;
    onClose: () => void;
    currentTier?: string;
    isPro?: boolean;
    initialTab?: UserSegment;
}


export const PricingPage: React.FC<Props> = ({ onSelectPlan, onClose, currentTier, isPro, initialTab = 'STUDENT' }) => {
    const [activeTab, setActiveTab] = useState<UserSegment>(initialTab);

    return (
        <div className="min-h-screen bg-[#fafaff] font-sans text-slate-900 pb-16">
            {/* Top Minimal Navigation Bar */}
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        <span>Back</span>
                    </button>

                    <div className="text-center">
                        <h1 className="text-base sm:text-lg font-black text-slate-950">Choose Your Study Pass</h1>
                        <p className="text-[11px] font-bold text-emerald-600 hidden xs:block">⚡ Instant M-Pesa STK Push · No Credit Card Required</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
                {/* Clean Segment Tabs */}
                <div className="mx-auto max-w-md mb-8 flex rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-inner">
                    <button
                        onClick={() => setActiveTab('STUDENT')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            activeTab === 'STUDENT'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        <span>Learner (From KES 20)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('TEACHER')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            activeTab === 'TEACHER'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <UserCircle2 className="w-4 h-4" />
                        <span>Teacher</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('SCHOOL')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            activeTab === 'SCHOOL'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span>School</span>
                    </button>
                </div>

                {/* Direct Pricing Cards Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        {activeTab === 'STUDENT' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {STUDENT_PLANS.map((plan) => (
                                    <PricingCard
                                        key={plan.id}
                                        plan={plan}
                                        onSelect={() => onSelectPlan(plan)}
                                        popular={plan.duration === 'WEEKLY' || plan.duration === 'MONTHLY'}
                                        isCurrent={currentTier === plan.duration}
                                        currentTier={currentTier}
                                        disabled={isPro && currentTier === plan.duration}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'TEACHER' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {TEACHER_PLANS.map((plan) => (
                                    <PricingCard
                                        key={plan.id}
                                        plan={plan}
                                        onSelect={() => onSelectPlan(plan)}
                                        popular={plan.duration === 'TERMLY'}
                                        isCurrent={currentTier === plan.duration}
                                        currentTier={currentTier}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'SCHOOL' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {SCHOOL_PLANS.map((plan) => (
                                    <SchoolCard
                                        key={plan.id}
                                        plan={plan}
                                        onSelect={() => onSelectPlan(plan)}
                                        isCurrent={currentTier === plan.id}
                                        currentTier={currentTier}
                                    />
                                ))}
                                <div className="md:col-span-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-600/15">
                                    <div>
                                        <h3 className="text-xl font-black mb-1">Need a Custom School Setup?</h3>
                                        <p className="text-indigo-100 text-xs sm:text-sm">For custom teacher accounts and institutional billing, we tailor enterprise solutions for your school.</p>
                                    </div>
                                    <a
                                        href="mailto:info@somaai.co.ke"
                                        className="bg-white text-indigo-700 px-6 py-3 rounded-xl text-xs font-black hover:bg-indigo-50 transition-colors shrink-0 shadow-sm"
                                    >
                                        Contact School Team
                                    </a>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Trust Footer */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Instant M-Pesa Push</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="inline-flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> All Subjects & Exams Included</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="inline-flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-indigo-600" /> Help: 0722763760</span>
                </div>
            </main>
        </div>
    );
};

const PricingCard = ({ plan, onSelect, popular, isCurrent, disabled, currentTier }: { plan: SubscriptionPlan, onSelect: () => void, popular?: boolean, isCurrent?: boolean, disabled?: boolean, currentTier?: string }) => {
    // Calculate cost per day for psychological advantage
    const getCostPerDay = () => {
        let days = 1;
        if (plan.duration === 'WEEKLY') days = 7;
        if (plan.duration === 'MONTHLY') days = 30;
        if (plan.duration === 'TERMLY') days = 90;
        if (plan.duration === 'ANNUAL') days = 365;
        const perDay = plan.price / days;
        return perDay < 1 ? '< KES 1' : `KES ${perDay.toFixed(1)}`;
    };
    const planMeters = plan.segment === 'STUDENT'
        ? [
            { label: 'Ask Akili', value: getPlanLimit('ai_generation', plan.duration) },
            { label: 'Grounded', value: getPlanLimit('grounded_library_help', plan.duration) },
            { label: 'Marking', value: getPlanLimit('exam_marking', plan.duration) },
        ]
        : [];

    return (
        <div className={`bg-white rounded-[2rem] p-6 sm:p-7 shadow-lg border-2 transition-all group flex flex-col relative overflow-hidden ${
            popular ? 'border-indigo-500 shadow-indigo-100/50' : 'border-slate-200/80 shadow-slate-100'
        } ${isCurrent ? 'ring-4 ring-emerald-500/20 border-emerald-500' : ''} ${!isCurrent && !disabled ? 'hover:border-indigo-400 hover:shadow-xl' : ''}`}>

            {popular && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900 mb-0.5">{plan.name}</h3>
                    {plan.savings ? (
                        <span className="inline-block text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                            {plan.savings}
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pass</span>
                    )}
                </div>
                {popular && !isCurrent && (
                    <div className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xs">
                        ⭐ Popular
                    </div>
                )}
                {isCurrent && (
                    <div className="bg-emerald-500 text-white p-1 rounded-full shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>

            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">KES {plan.price.toLocaleString()}</span>
                    <span className="text-slate-500 font-bold text-xs">
                        / {plan.duration.toLowerCase()}
                    </span>
                </div>
                <div className="mt-1 text-[11px] font-bold text-indigo-600">
                    Just {getCostPerDay()} / day
                </div>
            </div>

            <div className="space-y-3 mb-6 flex-1">
                {plan.features ? (
                    plan.features.slice(0, 4).map((feature, idx) => (
                        <Feature key={idx} item={feature} bold={popular && idx === 0} />
                    ))
                ) : (
                    <>
                        <Feature item="Unlimited Ask Akili & Voice" bold={popular} />
                        <Feature item="All CBC & National Revision Papers" bold={popular} />
                        <Feature item="AI Marking & Step-by-Step Solutions" />
                    </>
                )}
            </div>

            <button
                onClick={!isCurrent && !disabled ? onSelect : undefined}
                disabled={isCurrent || disabled}
                className={`w-full py-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${isCurrent
                    ? 'bg-emerald-50 text-emerald-700 shadow-none cursor-default border border-emerald-200'
                    : disabled
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : popular
                            ? 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
            >
                {isCurrent
                    ? 'Your Active Plan'
                    : (disabled
                        ? 'Not Available'
                        : (currentTier && currentTier !== 'FREE' ? 'Upgrade to This Plan' : 'Pay with M-Pesa'))}
                {!isCurrent && !disabled && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
        </div>
    );
};

const SchoolCard = ({ plan, onSelect, isCurrent, currentTier }: { plan: any, onSelect: () => void, isCurrent?: boolean, currentTier?: string }) => (
    <div className={`bg-white rounded-[2.5rem] p-8 shadow-xl border-2 transition-all flex flex-col relative ${isCurrent ? 'border-green-500 ring-4 ring-green-100' : 'border-slate-100 hover:scale-105'}`}>
        {isCurrent && (
            <div className="absolute top-0 right-12 -translate-y-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                Current Plan
            </div>
        )}
        <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h3>
            <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {plan.teacherLimit} Teachers
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {plan.studentLimit} Students
                </span>
            </div>
        </div>
        <div className="mb-8">
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 leading-none">KES {plan.price.toLocaleString()}</span>
                <span className="text-slate-400 font-bold text-sm">/term</span>
            </div>
        </div>
        <div className="space-y-4 mb-10 flex-1">
            <Feature item={`${plan.teacherLimit} Teacher Accounts`} bold />
            <Feature item={`${plan.studentLimit} Student Managed Accounts`} bold />
            <Feature item="Bulk Reporting & Analytics" />
            <Feature item="Priority School Support" />
        </div>
        <button
            onClick={!isCurrent ? onSelect : undefined}
            disabled={isCurrent}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200 ${isCurrent ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
        >
            {isCurrent ? 'Active Plan' : (currentTier && currentTier !== 'FREE' ? 'Upgrade Plan' : 'Select Plan')} {!isCurrent && <ArrowRight className="w-4 h-4" />}
        </button>
    </div>
);


const Feature = ({ item, bold }: { item: string, bold?: boolean }) => (
    <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
        </div>
        <span className={`text-sm ${bold ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{item}</span>
    </div>
);
