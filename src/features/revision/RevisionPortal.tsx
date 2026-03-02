import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    BookOpen, Sparkles, AlertTriangle, ArrowRight, UserCircle,
    CheckCircle, School, GraduationCap, Brain, Lock, LogOut,
    Zap, Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Card, Header } from '../../components/Shared';
import { ViewState, UserRole } from '../../types';
import { LoginModal } from '../../components/LoginModal';
import { RegistrationModal } from '../../components/RegistrationModal';
import { LogoutModal } from '../../components/LogoutModal';
import { supabase } from '../../lib/supabase';

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const { isRegistered, studentCode, setRole, setStudentCode, logout, studentProfile, role } = useApp();

    // Usage Limit (Local for now or Context)
    const [usageCount, setUsageCount] = useState(0); // Mock for now
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleStartRevision = () => {
        setRole(UserRole.REVISION); // Ensure role is set to REVISION
        navigate('/revision/dashboard');
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20 dark:text-white relative overflow-hidden transition-colors duration-300">
            <Helmet>
                {/* AIO */}
                <meta name="ai-search-index" content="index" />
                <meta name="ai-knowledge-base" content="official" />
                <meta name="examination-targets" content="KCSE, KPSEA, KJSEA, KMYA, KILEA, Mocks, Terminal Exams" />

                {/* Open Graph */}
                <meta property="og:title" content="Somo Smart Revision Portal | Free KCSE Past Papers" />
                <meta property="og:description" content="Scan and solve CBC/8-4-4 past papers with instant AI feedback. Try it for free." />
                <meta property="og:url" content="https://somaai.co.ke/revision" />

                <link rel="canonical" href="https://somaai.co.ke/revision" />
            </Helmet>

            {/* Premium Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [-100, 100, -100],
                        y: [-50, 50, -50],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-100/40 dark:bg-orange-900/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        x: [100, -100, 100],
                        y: [50, -50, 50],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-[120px]"
                />
            </div>

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : '/learner');
                            navigate(target);
                        }}
                        className="p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <ArrowRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="font-bold text-lg text-slate-800 dark:text-white transition-colors">Candidate Success Portal</h1>
                </div>
                {isRegistered && (
                    <button onClick={() => setShowLogoutModal(true)} className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>
                )}

                <LogoutModal
                    isOpen={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    onConfirm={() => {
                        logout();
                        navigate('/');
                    }}
                    title="Already Leaving? 📚"
                    message="You've come this far in setting up your candidate success space! If you stay, you can finish your profile and unlock your 5 free scans. Are you sure you want to log out?"
                />

                <LoginModal
                    isOpen={showLogin}
                    onClose={() => setShowLogin(false)}
                    onSuccess={handleStartRevision}
                    onSwitchToRegister={(role) => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                />

                <RegistrationModal
                    isOpen={showRegister}
                    onClose={() => setShowRegister(false)}
                    onSuccess={handleStartRevision}
                    onSwitchToLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                    initialRole="STUDENT"
                />
            </div>

            <main className="max-w-6xl mx-auto p-4 md:pt-10">
                <AnimatePresence mode='wait'>

                    {/* STEP 1: INTRO */}
                    <motion.div
                        key="intro"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.15, delayChildren: 0.2 }
                            },
                            exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
                        }}
                        className="relative z-10"
                    >
                        {/* --- SMART EXAM ASSISTANT HERO --- */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-[3rem] p-8 md:p-16 text-center text-white shadow-2xl overflow-hidden z-10 mb-12"
                        >
                            {/* Decorative Promo Stars */}
                            <div className="absolute top-10 left-10 opacity-20 animate-pulse">
                                <Sparkles className="w-12 h-12" />
                            </div>
                            <div className="absolute bottom-10 right-10 opacity-20 animate-bounce">
                                <Sparkles className="w-16 h-16" />
                            </div>
                            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 opacity-10">
                                <Zap className="w-32 h-32" />
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black uppercase tracking-[0.2em]">
                                    <Award className="w-4 h-4" /> 2024 Exam Edition
                                </div>

                                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    Your <span className="bg-white text-orange-600 px-4 py-1 rounded-2xl">Smart</span> Exam/Revision Assistant <br />
                                    <span className="text-amber-200">Improve your grades NOW!</span>
                                </h2>

                                <p className="text-lg md:text-xl font-medium text-orange-50 max-w-2xl mx-auto leading-relaxed">
                                    Get laser-focused help for <span className="font-black underline decoration-amber-300 underline-offset-4">KCSE, KPSEA, & JSS</span>. Scan any paper and get instant, smart guidance prioritized for Kenyan candidates.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                    <button
                                        onClick={isRegistered ? handleStartRevision : () => setShowRegister(true)}
                                        className="w-full sm:w-auto bg-white text-orange-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-orange-50 transition-all shadow-xl shadow-black/20 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {isRegistered ? `Continue as ${studentProfile?.name?.split(' ')[0] || 'Candidate'}` : 'Open Success Center'}
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                    <p className="text-xs font-bold text-orange-100/80">3 FREE Exam Uses Included</p>
                                </div>
                            </div>

                            {/* Floating Exam Types Labels */}
                            <div className="hidden lg:block absolute -right-10 top-1/2 -translate-y-1/2 space-y-4 font-black">
                                {['KCSE', 'KPSEA', 'KJSEA', 'KILEA'].map((exam, i) => (
                                    <motion.div
                                        key={exam}
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 0.15 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="text-6xl tracking-tighter"
                                    >
                                        {exam}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Additional Feature Pills Overlaying Hero */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12"
                        >
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Competency</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mt-1">Syllabus Based</p>
                                </div>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Feedback</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mt-1">Instant Strategy</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            className="text-center"
                        >
                            {!isRegistered && (
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[0.2em] hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                >
                                    Already have a code? <span className="text-blue-600 dark:text-blue-400 border-b-2 border-blue-100 dark:border-blue-900/50">Login</span>
                                </button>
                            )}

                            {isRegistered && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                    Active Access Code: <span className="text-slate-900 dark:text-white font-black tracking-widest uppercase">{studentCode}</span>
                                </p>
                            )}
                        </motion.div>
                    </motion.div>

                </AnimatePresence>
            </main>
        </div>
    );
};
