import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Sparkles, AlertTriangle, ArrowRight, UserCircle,
    CheckCircle, School, GraduationCap, Brain, Lock, LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Card, Header } from '../../components/Shared';
import { ViewState, UserRole } from '../../types';
import { LoginModal } from '../../components/LoginModal';
import { supabase } from '../../lib/supabase';

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const { isRegistered, studentCode, setRole, setStudentCode, logout, studentProfile } = useApp();

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
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <ArrowRight className="w-6 h-6 rotate-180" />
                    </button>
                    <h1 className="font-bold text-lg text-slate-800">Candidate Success Portal</h1>
                </div>
                {isRegistered && (
                    <button onClick={logout} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>

            <main className="max-w-4xl mx-auto p-6 md:pt-10">
                <AnimatePresence mode='wait'>

                    {/* STEP 1: INTRO */}
                    {step === 'INTRO' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 text-center"
                        >
                            <div className="relative inline-block mt-4">
                                <div className="absolute inset-0 bg-orange-200 blur-2xl opacity-50 rounded-full"></div>
                                <BookOpen className="w-24 h-24 text-orange-600 relative z-10" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Candidate Success Center</h1>
                                <p className="text-slate-600 text-lg">
                                    AI-powered coaching specialized for <b>KCSE, KPSEA & KEPSEA</b> candidates.
                                    Analyze past papers and master your final goals.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                                    <Brain className="w-8 h-8 text-blue-500" />
                                    <span className="font-bold text-sm text-slate-700">Competency Based</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                                    <Sparkles className="w-8 h-8 text-amber-500" />
                                    <span className="font-bold text-sm text-slate-700">Instant Answers</span>
                                </div>
                            </div>

                            <Button
                                fullWidth
                                onClick={isRegistered ? handleStartRevision : () => setStep('FORM')}
                                className="text-lg py-4 shadow-xl shadow-orange-100 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 border-none"
                            >
                                {isRegistered ? `Continue as Candidate ${studentProfile?.name?.split(' ')[0] || ''}` : 'Get Started'} <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>

                            <p className="text-xs text-slate-400">
                                {isRegistered ? (
                                    <span>Using code <b>{studentCode}</b></span>
                                ) : (
                                    <>Already have a code? <button onClick={() => setShowLogin(true)} className="text-blue-600 font-bold hover:underline">Login here</button></>
                                )}
                            </p>

                            <LoginModal
                                isOpen={showLogin}
                                onClose={() => setShowLogin(false)}
                                initialTab="STUDENT"
                                onSwitchToRegister={() => {
                                    setShowLogin(false);
                                    setStep('FORM');
                                }}
                                onSuccess={() => {
                                    setShowLogin(false);
                                    handleStartRevision();
                                }}
                            />
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
                                            <option value="KCSE">KCSE (Form 4 Candidate)</option>
                                            <option value="KPSEA">KPSEA (Grade 9 Candidate)</option>
                                            <option value="KEPSEA">KEPSEA (Grade 6 Candidate)</option>
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
