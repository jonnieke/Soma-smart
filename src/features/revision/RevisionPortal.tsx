import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Sparkles, AlertTriangle, ArrowRight, UserCircle,
    CheckCircle, School, GraduationCap, Brain, Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Card, Header } from '../../components/Shared';
import { ViewState } from '../../types';

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const { isRegistered, studentCode, setRole, setStudentCode, setView } = useApp();

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

    // Effect to check if already registered
    useEffect(() => {
        // If we have a student code, maybe skip to Menu?
        // For now, let's treat "Revision" as a special mode.
        // Actually, if registered, we want to allow them to use their existing code
        if (isRegistered && studentCode) {
            // Maybe show "Continue as [Name]"
        }
    }, [isRegistered]);

    const handleGenerateCode = () => {
        if (!name || !school) return;
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            const code = `REV-${Math.floor(1000 + Math.random() * 9000)}`;
            setGeneratedCode(code);
            setStep('CODE');
            setLoading(false);
            // Here we would ideally save this specific session or "Revision User" to DB/Context
            // For simplicity, we can update the AppContext "StudentCode" to this new code 
            // IF they are not already logged in. 
            // But better is to just copy it to clipboard and ask them to "Login" via standard flow OR
            // Auto-login them as a Guest Learner.

            // Let's Auto-login for seamless UX
            setStudentCode(code);
            // We set role to LEARNER so they can access the dashboard.
            // But we specifically want the REVISION view.
            // We'll navigate to /learner and set the ViewState to REVISION?
            // Or we pass state?
        }, 1500);
    };

    const handleStartRevision = () => {
        setRole('LEARNER'); // Ensure role is set
        navigate('/learner', { state: { mode: 'REVISION' } });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <Header title="Revision Assistance" onHome={() => navigate('/')} />

            <main className="max-w-lg mx-auto p-6 md:pt-10">
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
                                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Ace Your Exams</h1>
                                <p className="text-slate-500 text-lg">
                                    AI-powered revision coach for KEPSEA, KCSE, and Mocks.
                                    Upload papers, get step-by-step help, and track your progress.
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

                            <Button fullWidth onClick={() => setStep('FORM')} className="text-lg py-4 shadow-xl shadow-orange-100 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 border-none">
                                Get Started <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>

                            <p className="text-xs text-slate-400">
                                Already have a code? <button onClick={() => navigate('/learner')} className="text-blue-600 font-bold hover:underline">Login here</button>
                            </p>
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
                                            <option value="KCSE">KCSE (Form 4)</option>
                                            <option value="KEPSEA">KEPSEA (Grade 6)</option>
                                            <option value="MOCKS">Mocks / Term Exams</option>
                                            <option value="JSS">JSS Assessment</option>
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
                                Create My Revision Space
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
                                <h2 className="text-2xl font-bold text-slate-800">You're All Set!</h2>
                                <p className="text-slate-500">Here is your unique Revision Code. Use it to login anytime.</p>
                            </div>

                            <div className="bg-slate-100 p-6 rounded-2xl border-2 border-dashed border-slate-300 relative group cursor-pointer" onClick={() => { navigator.clipboard.writeText(generatedCode || '') }}>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Your Exam Code</p>
                                <p className="text-4xl font-mono font-black text-slate-800 tracking-widest">{generatedCode}</p>
                                <div className="mt-2 text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Click to Copy</div>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3 text-left">
                                <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-orange-800 text-sm">5 Free Scans Included</p>
                                    <p className="text-xs text-orange-700">You are on the Freemium plan. Scan up to 5 exam papers for free.</p>
                                </div>
                            </div>

                            <Button fullWidth onClick={handleStartRevision} className="py-4 text-lg">
                                Start Revising Now
                            </Button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};
