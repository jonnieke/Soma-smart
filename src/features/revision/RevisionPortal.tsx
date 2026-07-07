import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    BookOpen, Sparkles, ArrowRight, CheckCircle, Brain, Target, ShieldCheck, Star, Clock, Heart, Users,
    LogOut, Zap, Award, Search, CopySlash, Lock, Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ViewState, UserRole } from '../../types';
import { LoginModal } from '../../components/LoginModal';
import { RegistrationModal } from '../../components/RegistrationModal';
import { LogoutModal } from '../../components/LogoutModal';

// Mock Data for Previews
const POPULAR_SUBJECTS = [
    { name: 'Mathematics', count: '1,240+ Papers', icon: <Brain className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600', border: 'border-blue-200' },
    { name: 'English', count: '980+ Papers', icon: <BookOpen className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' },
    { name: 'Kiswahili', count: '950+ Papers', icon: <Star className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600', border: 'border-amber-200' },
    { name: 'Chemistry', count: '850+ Papers', icon: <Zap className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600', border: 'border-purple-200' },
    { name: 'Biology', count: '820+ Papers', icon: <Target className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600', border: 'border-rose-200' },
    { name: 'Physics', count: '790+ Papers', icon: <Sparkles className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-200' },
    { name: 'History', count: '600+ Papers', icon: <Clock className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600', border: 'border-orange-200' },
    { name: 'Geography', count: '550+ Papers', icon: <Search className="w-6 h-6" />, color: 'bg-teal-50 text-teal-600', border: 'border-teal-200' },
];

const LIVE_PAPERS = [
    { title: '2023 KCSE Mathematics Paper 1 (Mock)', subject: 'Mathematics', grade: 'Form 4', verified: true },
    { title: 'Maseno School Joint English Paper 2', subject: 'English', grade: 'Form 4', verified: true },
    { title: 'Alliance High Chemistry Paper 3 Practical', subject: 'Chemistry', grade: 'Form 4', verified: true },
    { title: 'KPSEA 2023 Integrated Science Final', subject: 'Science', grade: 'Grade 6', verified: true },
];

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const { isRegistered, studentCode, setRole, logout, studentProfile, role } = useApp();

    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [solvedCount, setSolvedCount] = useState(12847);

    // Subtle counter animation
    useEffect(() => {
        const interval = setInterval(() => {
            setSolvedCount(prev => prev + Math.floor(Math.random() * 3));
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const handleStartRevision = () => {
        setRole(UserRole.REVISION);
        navigate('/revision/dashboard');
    };

    const handleSubjectClick = () => {
        if (isRegistered) {
            handleStartRevision();
        } else {
            setShowRegister(true);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20 md:pb-0 dark:text-white relative overflow-hidden transition-colors duration-300">
            <Helmet>
                <title>Somo Smart Revision Portal | Free KCSE & KPSEA Past Papers</title>
                <meta name="description" content="Access thousands of CBC/8-4-4 past papers with instant instant feedback. Sign up free to scan, solve, and improve your grades instantly." />
            </Helmet>

            {/* Premium Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: [-100, 100, -100], y: [-50, 50, -50] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-100/40 dark:bg-orange-900/10 rounded-full blur-[120px]"
                />
            </div>

            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors"
                    >
                        <ArrowRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        Somo Smart <span className="text-orange-600 dark:text-orange-500 font-bold px-2 py-0.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-sm">Revision</span>
                    </h1>
                </div>
                <div className="flex flex-center gap-3">
                    {isRegistered ? (
                        <>
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{studentProfile?.name?.split(' ')[0] || 'Candidate'}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{studentCode}</span>
                            </div>
                            <button onClick={handleStartRevision} className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                Dashboard
                            </button>
                            <button onClick={() => setShowLogoutModal(true)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-colors">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setShowLogin(true)} className="text-sm font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300 transition-colors px-2">
                                Login
                            </button>
                            <button onClick={() => setShowRegister(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5">
                                Start Free
                            </button>
                        </>
                    )}
                </div>
            </div>

            <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-24 relative z-10">
                {/* 1. HERO SECTION */}
                <section className="text-center pt-8 md:pt-16 pb-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-[0.2em] border border-orange-200 dark:border-orange-800/50 shadow-sm">
                            <Award className="w-4 h-4" /> 2025 Exam Edition
                        </div>

                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                            Stop cramming.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Master every paper.</span>
                        </h2>

                        <p className="text-xl font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
                            The smartest way to revise for <strong className="text-slate-900 dark:text-slate-200">KCSE, KPSEA & JSS</strong>. Scan any past paper and get instant, step-by-step AI tutoring aligned to KNEC rubrics.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                            <button
                                onClick={isRegistered ? handleStartRevision : () => setShowRegister(true)}
                                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:from-orange-600 hover:to-rose-700 transition-all shadow-xl shadow-orange-500/20 hover:-translate-y-1 flex items-center justify-center gap-3 group"
                            >
                                {isRegistered ? `Continue to Dashboard` : 'Start Revising for Free'}
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                            {!isRegistered && (
                                <p className="text-sm font-bold text-slate-500 flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> 3 FREE uses included
                                </p>
                            )}
                        </div>

                        <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-slate-500">
                            <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500" /> 100% KNEC Aligned</div>
                            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> {solvedCount.toLocaleString()}+ Papers Solved</div>
                            <div className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-400 fill-current" /> 4.9/5 Rating</div>
                        </div>
                    </motion.div>
                </section>

                {/* 2. HOW IT WORKS (3 STEPS) */}
                <section>
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">How Somo Smart Works</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">From confused to confident in three simple steps.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 dark:from-indigo-900 dark:via-purple-900 dark:to-indigo-900 z-0 rounded-full" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-500 mb-6">
                                <Search className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">1. Snap & Upload</h4>
                            <p className="text-slate-600 dark:text-slate-400">Take a photo of any tough past paper question or homework assignment.</p>
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-orange-500 mb-6 group-hover:rotate-12 transition-transform">
                                <Sparkles className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">2. AI Breaks It Down</h4>
                            <p className="text-slate-600 dark:text-slate-400">Our Super Smart Teacher gives you step-by-step guidance, not just the final answer.</p>
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-emerald-500 mb-6">
                                <Target className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">3. Master & Pass</h4>
                            <p className="text-slate-600 dark:text-slate-400">Understand the underlying concepts and crush your final exams with confidence.</p>
                        </div>
                    </div>
                </section>

                {/* 3. SUBJECT QUICK-PICKS */}
                <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Jump into your subject</h3>
                            <p className="text-slate-500 font-medium">Access organized revision papers and study tools immediately.</p>
                        </div>
                        <button onClick={handleSubjectClick} className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-2">
                            View All Subjects <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {POPULAR_SUBJECTS.map((sub, i) => (
                            <button
                                key={i}
                                onClick={handleSubjectClick}
                                className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 bg-slate-50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 transition-all text-left flex flex-col gap-4 hover:shadow-lg shadow-indigo-100/20"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${sub.color} border ${sub.border} dark:border-slate-700 dark:bg-slate-800`}>
                                    {sub.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{sub.name}</h4>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{sub.count}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 4. LIVE CONTENT PREVIEW */}
                <section>
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold mb-4 border border-emerald-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Database
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">Recently added papers</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {LIVE_PAPERS.map((paper, i) => (
                            <div
                                key={i}
                                onClick={handleSubjectClick}
                                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 cursor-pointer group hover:border-indigo-300 transition-colors relative overflow-hidden"
                            >
                                {/* Blur Overlay for Guests */}
                                {!isRegistered && (
                                    <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] z-10 flex items-center justify-end px-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl">
                                            <Lock className="w-4 h-4" /> Unlock Paper
                                        </div>
                                    </div>
                                )}

                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                    <CopySlash className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{paper.title}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold">{paper.subject}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{paper.grade}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:flex text-emerald-500">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. TESTIMONIALS */}
                <section className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        <h3 className="text-3xl md:text-4xl font-black mb-12">Built for serious exam candidates</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { name: "Sarah W.", grade: "Form 4, Mean Grade A-", quote: "The smart explanations for Chemistry broke down concepts my teacher rushed through. I finally understand Mole Concept!" },
                                { name: "David M.", grade: "Form 4, Mean Grade B+", quote: "Being able to snap a photo of a math problem and get instant step-by-step help at 11 PM saved my revision." },
                                { name: "Grace K.", grade: "Grade 6, KPSEA Candidate", quote: "The past papers are so organized. The smart revision mode helped me find my weak areas before the real exam." }
                            ].map((user, i) => (
                                <div key={i} className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 text-left">
                                    <div className="flex gap-1 text-amber-400 mb-4">
                                        {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                                    </div>
                                    <p className="text-slate-300 italic mb-6 text-sm">&quot;{user.quote}&quot;</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black text-sm">{user.name[0]}</div>
                                        <div>
                                            <div className="font-bold text-sm">{user.name}</div>
                                            <div className="text-[10px] text-slate-400">{user.grade}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 6. FINAL CTA BANNER */}
                <section className="text-center md:pb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Your next exam is coming up.</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto font-medium">Don&apos;t wait until the last minute. Join thousands of students already using Somo Smart to secure top grades.</p>
                    <button
                        onClick={isRegistered ? handleStartRevision : () => setShowRegister(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-500/20 hover:-translate-y-1"
                    >
                        {isRegistered ? 'Go to Dashboard' : 'Create Free Account Now'}
                    </button>
                    <p className="mt-4 text-xs font-bold text-slate-400">No credit card required for your first 5 scans.</p>
                </section>
            </main>

            {/* STICKY MOBILE CTA */}
            {!isRegistered && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between pb-safe">
                    <div>
                        <p className="font-black text-sm text-slate-900 dark:text-white">Start your revision</p>
                        <p className="text-[10px] font-bold text-orange-600">5 free uses included</p>
                    </div>
                    <button
                        onClick={() => setShowRegister(true)}
                        className="bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-orange-600/20 active:scale-95 transition-transform"
                    >
                        Start Free
                    </button>
                </div>
            )}

            {/* Modals */}
            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                onSuccess={handleStartRevision}
                onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }}
            />

            <RegistrationModal
                isOpen={showRegister}
                onClose={() => setShowRegister(false)}
                onSuccess={handleStartRevision}
                onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }}
                initialRole="STUDENT"
            />

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => { logout(); navigate('/'); }}
                title="Already Leaving? 📚"
                message="You've come this far in setting up your candidate success space! Are you sure you want to log out?"
            />
        </div>
    );
};
