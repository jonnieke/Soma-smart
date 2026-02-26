import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
    BookOpen, Sparkles, AlertTriangle, ArrowRight, UserCircle,
    CheckCircle, School, GraduationCap, Brain, Lock, LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Card, Header } from '../../components/Shared';
import { ViewState, UserRole } from '../../types';
import { LoginModal } from '../../components/LoginModal';
import { LogoutModal } from '../../components/LogoutModal';
import { supabase } from '../../lib/supabase';

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const { isRegistered, studentCode, setRole, setStudentCode, logout, studentProfile, role } = useApp();

    // State for Onboarding
    const [step, setStep] = useState<'INTRO' | 'FORM' | 'CODE' | 'LIMIT'>('INTRO');

    // Form State
    const [name, setName] = useState('');
    const [school, setSchool] = useState('');
    const [examType, setExamType] = useState('KCSE');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Usage Limit (Local for now or Context)
    const [usageCount, setUsageCount] = useState(0); // Mock for now
    const [showLogin, setShowLogin] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleGenerateCode = async () => {
        if (!name || !school) return;
        setLoading(true);

        try {
            const code = `REV-${Math.floor(1000 + Math.random() * 9000)}`;

            // Persist to DB
            const { error: dbError } = await supabase.from('profiles').upsert({
                full_name: name,
                school_name: school, // We might need to handle this field or use another
                grade: examType,
                student_id: code,
                role: 'REVISION'
            });

            if (dbError) throw dbError;

            setGeneratedCode(code);
            setStep('CODE');
            setStudentCode(code);
            setRole(UserRole.REVISION);
        } catch (e) {
            console.error("Failed to create revision account:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleStartRevision = () => {
        setRole(UserRole.REVISION); // Ensure role is set to REVISION
        navigate('/revision/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative overflow-hidden">
            <Helmet>
                <title>Somo Smart Revision Portal | Free KCSE Past Papers & AI Coaching</title>
                <meta name="description" content="Master your final papers with precision. Access the Somo Smart Candidate Success Center for KCSE and KPSEA revision, featuring AI-assisted competency feedback." />
                <meta name="keywords" content="somo smart revision, freely scan past papers kenya, kcse marking scheme ai, kpsea study center, online revision kenya" />

                {/* AIO */}
                <meta name="ai-search-index" content="index" />
                <meta name="ai-knowledge-base" content="official" />
                <meta name="examination-targets" content="KCSE, KPSEA, Mocks, Terminal Exams" />

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
                    className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        x: [100, -100, 100],
                        y: [50, -50, 50],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[120px]"
                />
            </div>

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : '/learner');
                            navigate(target);
                        }}
                        className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ArrowRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="font-bold text-lg text-slate-800">Candidate Success Portal</h1>
                </div>
                {isRegistered && (
                    <button onClick={() => setShowLogoutModal(true)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors" title="Logout">
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
            </div>

            <main className="max-w-4xl mx-auto p-6 md:pt-10">
                <AnimatePresence mode='wait'>

                    {/* STEP 1: INTRO */}
                    {step === 'INTRO' && (
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
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, scale: 0.95, y: 20 },
                                    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 100 } }
                                }}
                                className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 max-w-2xl mx-auto space-y-10"
                            >
                                {/* Hero Icon */}
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.5, rotate: -15 },
                                        visible: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", damping: 15 } }
                                    }}
                                    className="flex justify-center"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-orange-200 blur-3xl opacity-40 rounded-full scale-150 animate-pulse"></div>
                                        <div className="bg-white w-24 h-24 rounded-3xl shadow-lg border border-orange-50 flex items-center justify-center relative z-10">
                                            <BookOpen className="w-12 h-12 text-orange-500" />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Title & Decription */}
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    className="space-y-4"
                                >
                                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                        Candidate <br />
                                        <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Success Center</span>
                                    </h1>
                                    <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                                        Professional Smart coaching for <span className="text-slate-900 font-bold">KCSE & KPSEA</span> candidates. Master your final papers with precision.
                                    </p>
                                </motion.div>

                                {/* Feature Pills */}
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <div className="bg-white/80 p-5 rounded-2xl border border-white shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                            <Brain className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Competency</p>
                                            <p className="text-sm font-bold text-slate-700 leading-none mt-1">Syllabus Based</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/80 p-5 rounded-2xl border border-white shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Feedback</p>
                                            <p className="text-sm font-bold text-slate-700 leading-none mt-1">Instant Strategy</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* CTA Area */}
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    className="space-y-6"
                                >
                                    <Button
                                        fullWidth
                                        onClick={isRegistered ? handleStartRevision : () => setStep('FORM')}
                                        className="text-lg py-6 rounded-2xl shadow-xl shadow-orange-200/50 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 border-none group"
                                    >
                                        <span className="flex items-center gap-4">
                                            {isRegistered ? `Continue as ${studentProfile?.name?.split(' ')[0] || 'Candidate'}` : 'Open Success Center'}
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>

                                    {!isRegistered && (
                                        <button
                                            onClick={() => setShowLogin(true)}
                                            className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] hover:text-orange-600 transition-colors"
                                        >
                                            Already have a code? <span className="text-blue-600 border-b-2 border-blue-100">Login</span>
                                        </button>
                                    )}

                                    {isRegistered && (
                                        <p className="text-xs text-slate-400 font-mono">
                                            Active Access Code: <span className="text-slate-900 font-black tracking-widest">{studentCode}</span>
                                        </p>
                                    )}
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* STEP 2: FORM */}
                    {step === 'FORM' && (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {isRegistered && (
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-800 font-bold text-sm">Welcome back, {studentProfile?.name}!</p>
                                        <p className="text-blue-600 text-xs">Access your dedicated revision space.</p>
                                    </div>
                                    <Button onClick={handleStartRevision}>Open Dashboard</Button>
                                </div>
                            )}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">Setup Profile</h2>
                                <p className="text-slate-500 text-sm">Tell us a bit about yourself to personalize your revision.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Full Name</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Joy Wanjiku"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">School Name</label>
                                    <div className="relative">
                                        <School className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Alliance Girls"
                                            value={school}
                                            onChange={(e) => setSchool(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Target Exam</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                                        <select
                                            value={examType}
                                            onChange={(e) => setExamType(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all appearance-none bg-white"
                                        >
                                            <option value="KCSE">KCSE (Standard National)</option>
                                            <option value="KCSE_MOCK">KCSE Mocks (County/School)</option>
                                            <option value="KPSEA">KPSEA (Grade 9 Candidate)</option>
                                            <option value="KEPSEA">KEPSEA (Grade 6 Candidate)</option>
                                            <option value="CAT">Continuous Assessment Test (CAT)</option>
                                            <option value="TERM_EXAM">End of Term Examination</option>
                                            <option value="INTERNAL">Internal Academic Test</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                fullWidth
                                onClick={handleGenerateCode}
                                isLoading={loading}
                                disabled={!name || !school}
                                className="mt-4 bg-orange-600 hover:bg-orange-700"
                            >
                                Enter Success Portal
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 3: CODE */}
                    {step === 'CODE' && (
                        <motion.div
                            key="code"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-10 h-10" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Candidate Profile Ready!</h2>
                                <p className="text-slate-500">Here is your unique Revision Code. Use it to login anytime.</p>
                            </div>

                            <div className="bg-slate-100 p-6 rounded-2xl border-2 border-dashed border-slate-300 relative group cursor-pointer" onClick={() => { navigator.clipboard.writeText(generatedCode || '') }}>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Your Success Code</p>
                                <p className="text-4xl font-mono font-black text-slate-800 tracking-widest">{generatedCode}</p>
                                <div className="mt-2 text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Click to Copy</div>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3 text-left">
                                <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-orange-800 text-sm">5 Free Scans Included</p>
                                    <p className="text-xs text-orange-700">You are on the Freemium plan. Scan up to 5 past papers for free.</p>
                                </div>
                            </div>

                            <Button fullWidth onClick={handleStartRevision} className="py-4 text-lg">
                                Start Mastering Papers
                            </Button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};
