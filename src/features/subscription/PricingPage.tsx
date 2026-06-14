import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Star, ShieldCheck, Smartphone, Building2, UserCircle2, GraduationCap, ArrowRight, X, BookOpen, FileSearch, Mic } from 'lucide-react';
import { LEARNING_CREDIT_PACKS, STUDENT_PLANS, TEACHER_PLANS, SCHOOL_PLANS } from '../../data/pricing';
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
    const personaValueCopy = {
        STUDENT: {
            title: 'Learner Outcomes',
            points: [
                'Get unstuck without copy-paste answers.',
                'Turn every topic into quizzes, marking, and repair.',
                'Give parents visible proof that study time helped.'
            ]
        },
        TEACHER: {
            title: 'Teacher Time Savings',
            points: [
                'Prepare lesson resources and schemes in minutes.',
                'Generate and assign assessments with fewer steps.',
                'Mark faster with structured classroom workflows.'
            ]
        },
        SCHOOL: {
            title: 'School & Parent Confidence',
            points: [
                'Track learner progress signals across classes.',
                'Give parents clearer weekly performance visibility.',
                'Scale teaching support without adding admin burden.'
            ]
        }
    } as const;

    const renderTabButton = (tab: UserSegment, icon: any, label: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 flex flex-col items-center gap-2 transition-all border-b-2 ${activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
        >
            {React.createElement(icon, { className: "w-6 h-6" })}
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
            {/* Header */}
            <header className="bg-slate-950 px-6 pt-20 pb-20 md:pb-40 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white text-center relative overflow-hidden shadow-2xl shadow-slate-200/50">

                {/* Navigation Buttons */}
                <div className="absolute top-8 left-8 z-50">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2.5 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10 transition-all text-xs font-black uppercase tracking-widest shadow-xl group"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Dashboard
                    </button>
                </div>

                <div className="absolute top-8 right-8 z-50">
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-xl border border-white/10 transition-all shadow-xl text-white/50 hover:text-white"
                        title="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative z-10 max-w-3xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-none">
                            Pay for progress, not just answers.
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
                            Soma helps learners try first, get guided help, practise with quizzes, and show parents clear proof of study.
                        </p>
                    </motion.div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-xl flex mb-8 overflow-hidden">
                    {renderTabButton('STUDENT', GraduationCap, 'Student')}
                    {renderTabButton('TEACHER', UserCircle2, 'Teacher')}
                    {renderTabButton('SCHOOL', Building2, 'School')}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">{personaValueCopy[activeTab].title}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {personaValueCopy[activeTab].points.map((point) => (
                            <div key={point} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                                {point}
                            </div>
                        ))}
                    </div>
                </div>

                {activeTab === 'STUDENT' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {[
                            { label: '1. Try first', body: 'Akili asks for an attempt before opening the full answer.' },
                            { label: '2. Practise', body: 'Every explanation can become a quiz with marking and repair.' },
                            { label: '3. Prove progress', body: 'Learners can share scores, weak spots, and next steps with parents.' }
                        ].map((item) => (
                            <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">{item.label}</p>
                                <p className="text-sm font-bold text-slate-800 leading-relaxed">{item.body}</p>
                            </div>
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {activeTab === 'STUDENT' && (
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {STUDENT_PLANS.map((plan) => (
                                        <PricingCard
                                            key={plan.id}
                                            plan={plan}
                                            onSelect={() => onSelectPlan(plan)}
                                            popular={plan.duration === 'MONTHLY'}
                                            isCurrent={currentTier === plan.duration}
                                            currentTier={currentTier}
                                            disabled={isPro && currentTier === plan.duration}
                                        />
                                    ))}
                                </div>
                                <section className="rounded-[2rem] border border-indigo-100 bg-indigo-50/70 p-5">
                                    <div className="mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Need to continue today?</p>
                                        <h2 className="text-xl font-black text-slate-900 mt-1">Buy learning credits</h2>
                                        <p className="text-sm font-semibold text-slate-600 mt-1">Credits extend capped tools without replacing your active plan. Basic Ask Akili stays plan-based; credits are for heavier work like grounded answers, marking, deep documents, and voice.</p>
                                    </div>
                                    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {[
                                            { icon: BookOpen, title: 'Grounded Library Help', body: 'Answers from Soma notes, syllabus guides, and past papers.' },
                                            { icon: FileSearch, title: 'Deep Exam Analysis', body: 'Long paper/PDF analysis costs more, so it uses plans or credits.' },
                                            { icon: Mic, title: 'Voice Practice', body: 'Speech, pronunciation, and audio lessons use credits by length.' },
                                        ].map((item) => (
                                            <div key={item.title} className="rounded-2xl border border-indigo-100 bg-white/80 p-4">
                                                <item.icon className="h-5 w-5 text-indigo-600 mb-2" />
                                                <p className="text-xs font-black text-slate-900">{item.title}</p>
                                                <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-500">{item.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {LEARNING_CREDIT_PACKS.map((pack) => (
                                            <CreditPackCard key={pack.id} plan={pack} onSelect={() => onSelectPlan(pack)} />
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'TEACHER' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {SCHOOL_PLANS.map((plan) => (
                                    <SchoolCard
                                        key={plan.id}
                                        plan={plan}
                                        onSelect={() => onSelectPlan(plan)}
                                        isCurrent={currentTier === plan.id} // Schools might use ID
                                        currentTier={currentTier}
                                    />
                                ))}
                                <div className="md:col-span-3 bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-200">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-2">Need a Custom Plan?</h3>
                                        <p className="text-indigo-100">For more than 60 teachers, we offer custom enterprise solutions tailored to your school&apos;s needs.</p>
                                    </div>
                                    <a
                                        href="mailto:info@somaai.co.ke"
                                        className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors shrink-0"
                                    >
                                        Contact Sales
                                    </a>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Trust Signals & Payment Icons */}
                <div className="mt-20">
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 mb-12">
                        {/* Placeholder for Trust Icons - Using styled text/simple svg shapes as logos */}
                        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter"><div className="w-8 h-8 bg-emerald-500 rounded-lg"></div> M-PESA</div>
                        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic text-blue-900">VISA</div>
                        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-red-600">Mastercard</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: ShieldCheck, label: 'CBC Focused', desc: 'Built around Kenyan classroom needs', color: 'text-emerald-500' },
                            { icon: Smartphone, label: 'Secure Payments', desc: 'SSL Encrypted Checkout', color: 'text-indigo-500' },
                            { icon: Zap, label: 'AI Powered', desc: 'Personalized Tutoring', color: 'text-amber-500' },
                            { icon: Star, label: 'Human Support', desc: 'Help when learners or schools need it', color: 'text-rose-500' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] text-center border border-white shadow-sm hover:shadow-md transition-all">
                                <item.icon className={`w-10 h-10 ${item.color} mx-auto mb-3`} />
                                <h4 className="font-black text-slate-800 text-sm mb-1">{item.label}</h4>
                                <p className="text-[11px] text-slate-500 font-medium leading-tight">{item.desc}</p>
                            </div>
                        ))}
                    </div>
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
        <div className={`bg-white rounded-[2.5rem] p-8 shadow-xl border-2 transition-all group flex flex-col relative overflow-hidden ${popular ? 'border-indigo-500 scale-105 z-10' : 'border-slate-100 shadow-slate-200/50'
            } ${isCurrent ? 'ring-8 ring-indigo-500/10 border-indigo-500' : ''} ${!isCurrent && !disabled ? 'hover:scale-105 hover:shadow-2xl' : ''}`}>

            {/* Glowing Effect for Popular Plan */}
            {popular && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 animate-gradient-x"></div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                    {plan.savings ? (
                        <motion.span
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="inline-block text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm"
                        >
                            {plan.savings}
                        </motion.span>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Standard Plan</span>
                    )}
                </div>
                {popular && !isCurrent && (
                    <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                        Best Value
                    </div>
                )}
                {isCurrent && (
                    <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                        <Check className="w-4 h-4" />
                    </div>
                )}
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">KES {plan.price}</span>
                    <span className="text-slate-400 font-bold text-sm tracking-tight text-right">
                        / {plan.duration.toLowerCase()}
                    </span>
                </div>
                <div className="mt-1 text-[11px] font-black text-indigo-500 uppercase tracking-widest opacity-80">
                    Just {getCostPerDay()} a day
                </div>
            </div>

            {planMeters.length > 0 && (
                <div className="mb-6 grid grid-cols-3 gap-2">
                    {planMeters.map((meter) => (
                        <div key={meter.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-2 py-3 text-center">
                            <p className="text-sm font-black text-slate-900 leading-none">{meter.value}</p>
                            <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">{meter.label}/day</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-4 mb-10 flex-1">
                {plan.features ? (
                    plan.features.map((feature, idx) => (
                        <Feature key={idx} item={feature} bold={popular && idx < 3} />
                    ))
                ) : (
                    <>
                        <Feature item="Somo Homework & Exams" bold={popular} />
                        <Feature item="Step-by-Step Solutions" bold={popular} />
                        <Feature item="Offline Access" bold={popular} />
                        <div className="h-px bg-slate-50 mx-2"></div>
                        <Feature item="Somo Candidate Specialists" />
                    </>
                )}
            </div>

            <button
                onClick={!isCurrent && !disabled ? onSelect : undefined}
                disabled={isCurrent || disabled}
                className={`w-full py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${isCurrent
                    ? 'bg-emerald-50 text-emerald-600 shadow-none cursor-default border border-emerald-100'
                    : disabled
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : popular
                            ? 'bg-indigo-600 text-white shadow-indigo-300/40 hover:bg-indigo-700 hover:shadow-indigo-400/50'
                            : 'bg-slate-900 text-white shadow-slate-300/40 hover:bg-slate-800'
                    }`}
            >
                {isCurrent
                    ? 'Your Active Plan'
                    : (disabled
                        ? 'Not Available'
                        : (currentTier && currentTier !== 'FREE' ? 'Upgrade to Pro' : 'Unlock Access Now'))}
                {!isCurrent && !disabled && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
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

const CreditPackCard = ({ plan, onSelect }: { plan: SubscriptionPlan, onSelect: () => void }) => (
    <div className="bg-white rounded-3xl border border-indigo-100 p-5 shadow-sm flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
            <div>
                <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                {plan.savings && <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mt-1">{plan.savings}</p>}
            </div>
            <div className="text-right">
                <p className="text-2xl font-black text-indigo-600">KES {plan.price}</p>
                <p className="text-[10px] font-bold text-slate-400">{plan.credits} credits</p>
            </div>
        </div>
        <div className="space-y-2 flex-1 mb-5">
            {(plan.features || []).map((feature) => (
                <Feature key={feature} item={feature} />
            ))}
        </div>
        <button
            onClick={onSelect}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
            Buy Credits
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
