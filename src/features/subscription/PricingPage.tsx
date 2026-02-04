import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Star, ShieldCheck, Smartphone, Building2, UserCircle2, GraduationCap, ArrowRight, Timer, Clock } from 'lucide-react';
import { STUDENT_PLANS, TEACHER_PLANS, SCHOOL_PLANS } from '../../data/pricing';
import { SubscriptionPlan, UserSegment } from '../../types';

interface Props {
    onSelectPlan: (plan: any) => void;
    onClose: () => void;
}

const PromoBanner = () => {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    React.useEffect(() => {
        const LAUNCH_DATE = new Date('2026-02-27T00:00:00+03:00');

        const calculateTimeLeft = () => {
            const now = new Date();
            const diff = LAUNCH_DATE.getTime() - now.getTime();

            if (diff <= 0) return null;

            return {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            const updated = calculateTimeLeft();
            setTimeLeft(updated);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!timeLeft) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden group bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 rounded-[2.5rem] p-6 md:p-8 mb-10 text-white shadow-2xl shadow-blue-200"
        >
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-widest mb-4 border border-white/20">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        Early Bird Special! 🇰🇪
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
                        Unlimited Free Access <br className="hidden md:block" />
                        <span className="text-orange-300">Until February 27th!</span>
                    </h3>
                    <p className="text-blue-50/80 text-sm md:text-base font-medium max-w-xl">
                        Buy any plan today, and your subscription duration only starts counting after the launch. <b className="text-white">Hurry Now!</b>
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-inner w-full lg:w-auto min-w-[320px]">
                    <div className="flex items-center gap-2 mb-2">
                        <Timer className="w-5 h-5 text-orange-300 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest opacity-80">Countdown to Launch</span>
                    </div>

                    <div className="flex gap-4">
                        {[
                            { label: 'Days', value: timeLeft.days },
                            { label: 'Hrs', value: timeLeft.hours },
                            { label: 'Min', value: timeLeft.minutes },
                            { label: 'Sec', value: timeLeft.seconds },
                        ].map((t, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mb-1 border border-white/10 shadow-lg">
                                    {String(t.value).padStart(2, '0')}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const PricingPage: React.FC<Props> = ({ onSelectPlan, onClose }) => {
    const [activeTab, setActiveTab] = useState<UserSegment>('STUDENT');

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
            <header className="bg-gradient-to-br from-indigo-900 to-slate-900 px-6 pt-12 pb-24 rounded-b-[3rem] text-white text-center relative overflow-hidden">
                <div className="relative z-10 max-w-2xl mx-auto">
                    <h1 className="text-4xl font-black mb-3">Simple Pricing</h1>
                    <p className="text-indigo-100/80 font-medium">Choose a plan that fits your learning journey. Start small, grow big! 🚀</p>
                </div>
                {/* Decorative blobs */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
            </header>

            <main className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
                <PromoBanner />

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-xl flex mb-8 overflow-hidden">
                    {renderTabButton('STUDENT', GraduationCap, 'Student')}
                    {renderTabButton('TEACHER', UserCircle2, 'Teacher')}
                    {renderTabButton('SCHOOL', Building2, 'School')}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {activeTab === 'STUDENT' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {STUDENT_PLANS.map((plan) => (
                                    <PricingCard
                                        key={plan.id}
                                        plan={plan}
                                        onSelect={() => onSelectPlan(plan)}
                                        popular={plan.duration === 'MONTHLY'}
                                    />
                                ))}
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
                                    />
                                ))}
                                <div className="md:col-span-3 bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-200">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-2">Need a Custom Plan?</h3>
                                        <p className="text-indigo-100">For more than 60 teachers, we offer custom enterprise solutions tailored to your school's needs.</p>
                                    </div>
                                    <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors shrink-0">
                                        Contact Sales
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Trust Signals */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: ShieldCheck, label: 'CBC Aligned', desc: 'Kenyan Curriculum' },
                        { icon: Smartphone, label: 'M-Pesa First', desc: 'Secure & Instant' },
                        { icon: Zap, label: 'Works Offline', desc: 'Save on Data' },
                        { icon: Star, label: '5-Star AI', desc: 'Smart Learning' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl text-center border border-slate-100 shadow-sm">
                            <item.icon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                            <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

const PricingCard = ({ plan, onSelect, popular }: { plan: SubscriptionPlan, onSelect: () => void, popular?: boolean }) => (
    <div className={`bg-white rounded-[2.5rem] p-8 shadow-xl border-2 transition-all hover:scale-105 flex flex-col relative ${popular ? 'border-indigo-500' : 'border-slate-100'
        }`}>
        {popular && (
            <div className="absolute top-0 right-12 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                Most Popular
            </div>
        )}
        <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h3>
            {plan.savings && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {plan.savings}
                </span>
            )}
        </div>
        <div className="mb-8">
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 leading-none">KES {plan.price}</span>
                <span className="text-slate-400 font-bold text-sm">/{plan.duration.toLowerCase()}</span>
            </div>
        </div>
        <div className="space-y-4 mb-10 flex-1">
            <Feature item="AI Homework Help" />
            <Feature item="Unlimited Quizzes" />
            <Feature item="CBC Study Guides" />
            {plan.duration === 'ANNUAL' && <Feature item="Full Year Access" bold />}
        </div>
        <button
            onClick={onSelect}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${popular
                ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                }`}
        >
            Get Started <ArrowRight className="w-4 h-4" />
        </button>
    </div>
);

const SchoolCard = ({ plan, onSelect }: { plan: any, onSelect: () => void }) => (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border-2 border-slate-100 transition-all hover:scale-105 flex flex-col">
        <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h3>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Up to {plan.teacherLimit} Teachers
            </span>
        </div>
        <div className="mb-8">
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 leading-none">KES {plan.price.toLocaleString()}</span>
                <span className="text-slate-400 font-bold text-sm">/term</span>
            </div>
        </div>
        <div className="space-y-4 mb-10 flex-1">
            <Feature item={`${plan.teacherLimit} Teacher Accounts`} bold />
            <Feature item="Bulk Student Reporting" />
            <Feature item="Admin Revenue Dashboard" />
            <Feature item="Priority Support" />
        </div>
        <button
            onClick={onSelect}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
        >
            Select Plan <ArrowRight className="w-4 h-4" />
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
