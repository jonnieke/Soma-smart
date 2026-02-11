import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Mic, FileText, Share2, StopCircle, Download, BookOpen, Crown, Brain, Sparkles, X, CheckCircle, Play, Pause, Trash2, ArrowRight, Library, Filter, Calendar, Home, LogOut, MonitorPlay, CreditCard, ScanLine, Plus,
    SquarePlus, ChevronRight, Type, Layers, ClipboardList, ClipboardCheck, Archive, History as HistoryIcon, MoreVertical, Check, Wallet, ToggleRight, ToggleLeft, Users, TrendingUp, DollarSign
}
    from 'lucide-react';
import { Button, Card, Header, MarkdownText } from '../../components/Shared';
import { TeacherPaywall } from '../../components/TeacherPaywall';
import { TeacherOnboarding } from '../../components/TeacherOnboarding';
import { LoginModal } from '../../components/LoginModal';
import { LogoutModal } from '../../components/LogoutModal';
import { useApp } from '../../context/AppContext';
import { convertNotes, processVoiceNote, generateTeacherQuiz, generateAdvancedTeacherQuiz, fileToGenerativePart } from '../../services/geminiService';
import { ViewState, TeacherNote, QuizData, TeacherActivity, SubscriptionPlan } from '../../types';
import { PdfPageSelector } from '../../components/PdfPageSelector';
import { PaymentFlow } from '../subscription/PaymentFlow';
import { translations } from '../../data/translations';

interface TeacherProps {
    onNavigate: (view: ViewState) => void;
    initialTab?: 'HOME' | 'CONVERT' | 'VOICE' | 'QUIZ' | 'LIBRARY' | 'MARKING';
}

import { useNavigate, useLocation } from 'react-router-dom';

export const TeacherDashboard: React.FC<TeacherProps> = ({ onNavigate, initialTab }) => {
    const {
        teacherUsageCount, incrementTeacherUsage, teacherProfile,
        updateTeacherProfile, teacherHistory, saveTeacherActivity,
        deleteTeacherActivity,
        logout, isPro, upgradeAccount,
        isOnline, language,
        teacherWallet, isAvailableForTutoring, toggleTutoringAvailability, fetchEarnings,
        activeTutoringRequests, acceptTutoringRequest, submitTutoringResponse
    } = useApp();
    const t = translations[language];
    const [showPaywall, setShowPaywall] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Check for subscription intent from Landing Page or Pricing Page
    useEffect(() => {
        const state = location.state as { selectedPlan?: SubscriptionPlan; openSubscription?: boolean, initiatePaymentFor?: SubscriptionPlan };

        if (state?.initiatePaymentFor) {
            // Direct payment trigger for authenticated user
            const plan = state.initiatePaymentFor;
            if (teacherProfile) {
                // We have profile, go ahead
                const paymentDetails = {
                    amount: plan.price,
                    description: `Soma Smart ${plan.name} Subscription`,
                    email: teacherProfile.email, // Ensure email is in profile or context
                    phoneNumber: "", // Option to add phone if available
                    firstName: teacherProfile.name.split(' ')[0],
                    lastName: teacherProfile.name.split(' ').slice(1).join(' ') || '',
                    callbackUrl: `${window.location.origin}/pricing` // Callback to pricing page checks status
                };

                // Trigger flow
                // We can't easily call hook method outside.
                // Best way? Create a temporary state to auto-click the payment button or show a specific modal.
                // Or better: Render the PaymentFlow component directly in a modal state?

                // Let's use a new state 'showDirectPayment'
                setSelectedPlan(plan);
                // We need to trigger the payment flow. 
                // Since PaymentFlow is usually internal to components, let's open a modal that immediately starts it?
                // Actually, existing PaymentFlow component handles UI. 
                // We should show a modal with PaymentFlow.

                // Re-using showPaywall logic might be tricky if it doesn't support direct payment start.
                // Let's create a dedicated "Processing Payment" modal or reuse something.

                // Simplest: Set selectedPlan and show a Payment Modal.
                // We don't have a generic Payment Modal component in this file yet.
                // Notes: TeacherPaywall -> leads to pricing -> leads back here.

                // Let's add a state `paymentPlan` and if set, render `PaymentFlow` in a modal overlay.
                setPaymentPlan(plan);
            }
            // Clear state
            navigate(location.pathname, { replace: true, state: {} });
        } else if (state?.selectedPlan) {
            if (isPro) {
                // Already pro, just stay on dashboard and clear state
                navigate(location.pathname, { replace: true, state: {} });
            } else {
                setSelectedPlan(state.selectedPlan);
                // Clear state
                navigate(location.pathname, { replace: true, state: {} });
            }
        } else if (state?.openSubscription) {
            setShowPaywall(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, isPro, navigate, teacherProfile]);

    const [paymentPlan, setPaymentPlan] = useState<SubscriptionPlan | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'HOME' | 'CONVERT' | 'VOICE' | 'QUIZ' | 'LIBRARY' | 'MARKING' | 'EARNINGS'>(initialTab || 'HOME');
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedClass, setSelectedClass] = useState<string>(teacherProfile?.classes?.[0] || (language === 'FR' ? "Département" : "Selected Department"));
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string>(teacherProfile?.subjects?.[0] || (language === 'FR' ? "Discipline" : "Active Discipline"));

    // Advanced Quiz State
    const [advMode, setAdvMode] = useState(false);
    const [advFiles, setAdvFiles] = useState<File[]>([]);
    const [advTopic, setAdvTopic] = useState("");
    const [advCount, setAdvCount] = useState(5);
    const [advType, setAdvType] = useState<'MCQ' | 'OPEN'>('MCQ');

    // PDF Selection State
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    // Results
    const [generatedNote, setGeneratedNote] = useState<TeacherNote | null>(null);
    const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);

    // Phase 2: Tutoring Response
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [responseType, setResponseType] = useState<'TEXT' | 'VOICE' | 'VIDEO'>('TEXT');
    const [responseText, setResponseText] = useState("");

    // Recording
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Update defaults when profile loads
    useEffect(() => {
        if (teacherProfile && !selectedClass) setSelectedClass(teacherProfile.classes[0]);
        if (teacherProfile && !selectedSubject) setSelectedSubject(teacherProfile.subjects[0]);
    }, [teacherProfile]);

    // Check limits
    const checkLimit = () => {
        // If Pro is active, no limits!
        if (isPro) return true;

        if (teacherUsageCount >= 3) {
            setShowPaywall(true);
            return false;
        }
        return true;
    };

    // Timer effect for recording
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            setRecordingTime(0);
            interval = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Fix: Stop mic when component unmounts
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (mediaRecorderRef.current?.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);


    // --- Handlers ---

    const handleSaveToHistory = (type: 'NOTE' | 'QUIZ', title: string, content: any) => {
        const activity: TeacherActivity = {
            id: Date.now().toString(),
            type,
            title,
            className: selectedClass,
            subject: selectedSubject,
            date: new Date().toLocaleDateString(),
            content
        };
        saveTeacherActivity(activity);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!checkLimit()) return;

        setLoading(true);
        incrementTeacherUsage();
        try {
            const base64 = await fileToGenerativePart(file);
            const result = await convertNotes(base64, file.type, selectedSubject, selectedClass, language);
            setGeneratedNote(result);
            handleSaveToHistory('NOTE', result.topic, result);
            setActiveTab('CONVERT');
        } catch (e) {
            alert("Error converting file");
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        if (!checkLimit()) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Determine supported mime type
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                console.log("Audio Blob Created:", blob.size, blob.type);

                // Stop all tracks now that we have the full blob
                stream.getTracks().forEach(track => track.stop());

                if (blob.size < 1000) {
                    alert("Recording too short or empty. Please try again.");
                    setLoading(false);
                    return;
                }

                await handleAudioProcessing(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (e) {
            console.error("Mic Error:", e);
            alert("Microphone access denied. Please check your browser settings.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            incrementTeacherUsage();
        }
    };

    const handleAudioProcessing = async (blob: Blob) => {
        setLoading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1];
                const result = await processVoiceNote(base64Data, blob.type, selectedSubject, selectedClass, language);
                setGeneratedNote(result);
                handleSaveToHistory('NOTE', result.topic, result);
                setActiveTab('VOICE');
                setLoading(false);
            };
        } catch (e) {
            console.error("Processing Error:", e);
            alert("Error processing audio. Please try again.");
            setLoading(false);
        }
    };

    const handleAdvancedQuizGen = async () => {
        if (!advTopic || advFiles.length === 0) return;
        if (!checkLimit()) return;

        setLoading(true);
        incrementTeacherUsage();
        try {
            const images = await Promise.all(advFiles.map(f => fileToGenerativePart(f)));

            const result = await generateAdvancedTeacherQuiz(
                images,
                advTopic,
                selectedClass,
                advCount,
                advType,
                language
            );

            setGeneratedQuiz(result);
            handleSaveToHistory('QUIZ', result.topic, result);
            setActiveTab('QUIZ');
            setAdvFiles([]);
            setAdvTopic("");
        } catch (e) {
            alert("Error generating advanced quiz. Please try again.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadHistoryItem = (item: TeacherActivity) => {
        if (item.type === 'NOTE') {
            setGeneratedNote(item.content);
            setActiveTab('CONVERT');
        } else {
            setGeneratedQuiz(item.content);
            setActiveTab('QUIZ');
        }
    };

    const handleAdvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const pdf = files.find(f => f.type === 'application/pdf');
            if (pdf) {
                setPdfFile(pdf);
            } else {
                setAdvFiles(prev => [...prev, ...files]);
            }
        }
    };

    // --- Render ---

    if (!teacherProfile && teacherUsageCount >= 3) {
        return (
            <>
                <TeacherOnboarding
                    onComplete={(p) => updateTeacherProfile(p)}
                    onClose={() => onNavigate(ViewState.DASHBOARD)}
                    onLogin={() => setShowLoginModal(true)}
                />
                <LoginModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                    initialTab="TEACHER"
                />
                <LogoutModal
                    isOpen={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    onConfirm={() => {
                        logout();
                        onNavigate(ViewState.DASHBOARD);
                    }}
                    title="Already Leaving, Teacher? 🍎"
                    message="You've been doing amazing work preparing lessons! If you stay, you can generate more quizzes or convert more documents. Are you sure you're ready to call it a day?"
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 relative">
            <TeacherPaywall isOpen={showPaywall} onClose={() => setShowPaywall(false)} />

            {/* Direct Payment Modal */}
            {paymentPlan && teacherProfile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-[2rem] p-6 w-full max-w-lg shadow-2xl relative"
                    >
                        <button
                            onClick={() => setPaymentPlan(null)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        <div className="mb-4 text-center">
                            <h2 className="text-xl font-bold text-slate-800">Complete Updgrade</h2>
                            <p className="text-sm text-slate-500">Secure payment for {paymentPlan.name}</p>
                        </div>

                        <PaymentFlow
                            plan={paymentPlan}
                            onSuccess={() => {
                                setPaymentPlan(null);
                                alert("Payment Successful! Welcome to Pro.");
                            }}
                            onCancel={() => setPaymentPlan(null)}
                        />
                    </motion.div>
                </div>
            )}

            {pdfFile && (
                <PdfPageSelector
                    file={pdfFile}
                    onCancel={() => setPdfFile(null)}
                    onSelectionComplete={(files) => {
                        setAdvFiles(prev => [...prev, ...files]);
                        setPdfFile(null);
                    }}
                />
            )}

            {/* Clean & Organized Hero Header (Academic Registry Style) */}
            <div className="bg-slate-50 px-8 pt-10 pb-24 rounded-b-[4rem] shadow-sm relative overflow-hidden border-b-2 border-slate-200">
                {/* Academic Decorative Elements - Subtly Lightened */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute top-1/2 left-0 w-64 h-64 bg-slate-200/40 rounded-full blur-[80px] -ml-20"></div>

                {/* Background Pattern (Subtle grid/academic feel) */}
                <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="relative z-10">
                    {/* Top navigation & Identity Card Look */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-5">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-10 rounded-full animate-pulse"></div>
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 text-2xl font-black shadow-lg border-2 border-slate-100 relative z-10">
                                    {teacherProfile?.name.charAt(0) || "T"}
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-slate-900 font-black text-2xl tracking-tight leading-none mb-1">{teacherProfile?.name || (language === 'FR' ? "Enseignant Invité" : "Guest Teacher")}</h2>
                                <div className="flex items-center gap-3 justify-center md:justify-start">
                                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-black text-indigo-600 uppercase tracking-widest">Certified Educator</span>
                                    {teacherUsageCount < 3 && !isPro && (
                                        <span className="text-amber-600 text-[10px] font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                            <Sparkles className="w-3 h-3" /> {3 - teacherUsageCount} {t.teacher.stats.free}
                                        </span>
                                    )}
                                    {isAvailableForTutoring && (
                                        <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-pulse">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Available to Tutor
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
                            <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 hover:bg-slate-50 rounded-xl transition-all group text-xs font-black text-slate-600 uppercase tracking-widest">
                                <Home className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" /> {t.teacher.sidebar.home}
                            </button>
                            <div className="w-px h-6 bg-slate-200 self-center mx-1"></div>
                            <button onClick={() => navigate('/pricing')} className="flex-1 md:flex-none flex justify-center items-center px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-all group" title={t.teacher.common.pricingPlans}>
                                <CreditCard className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                            </button>
                            <button onClick={() => setShowLogoutModal(true)} className="flex-1 md:flex-none flex justify-center items-center px-4 py-2.5 hover:bg-red-50 rounded-xl transition-all group" title={t.teacher.common.logout}>
                                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Elite Context Selectors (Tabbed System) - Lightened */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                <SquarePlus className="w-3 h-3 text-indigo-500" /> Selected Department
                            </label>
                            <div className="bg-white/50 backdrop-blur-md rounded-[1.25rem] p-1.5 flex border-2 border-white shadow-sm ring-1 ring-slate-200">
                                {(teacherProfile?.classes || []).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setSelectedClass(c)}
                                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${selectedClass === c ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-indigo-600 hover:bg-white'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                                {(!teacherProfile || teacherProfile.classes.length === 0) && (
                                    <button onClick={() => setShowOnboarding(true)} className="w-full px-4 py-3 text-xs font-black text-indigo-600 hover:bg-white transition-colors flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> {teacherProfile ? "Initialize Class Registry" : "Unlock Full Registry"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                <BookOpen className="w-3 h-3 text-purple-500" /> Active Discipline
                            </label>
                            <div className="bg-white/50 backdrop-blur-md rounded-[1.25rem] p-1.5 flex border-2 border-white shadow-sm ring-1 ring-slate-200">
                                {(teacherProfile?.subjects || []).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSelectedSubject(s)}
                                        className={`flex-1 px-4 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${selectedSubject === s ? 'bg-purple-600 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-purple-600 hover:bg-white'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 -mt-12 relative z-20">

                {/* Navigation Tabs (Floating) */}
                {!loading && !generatedNote && !generatedQuiz && (
                    <div className="bg-white rounded-2xl shadow-sm p-2 mb-6 flex justify-between gap-2">
                        <button
                            onClick={() => setActiveTab('HOME')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-xs md:text-sm font-bold ${activeTab === 'HOME' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Sparkles className="w-4 h-4 flex-shrink-0" /> {t.teacher.sidebar.studio}
                        </button>
                        <button
                            onClick={() => setActiveTab('LIBRARY')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-xs md:text-sm font-bold ${activeTab === 'LIBRARY' ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Library className="w-4 h-4 flex-shrink-0" /> {t.teacher.sidebar.library}
                        </button>
                        <button
                            onClick={() => setActiveTab('MARKING')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-xs md:text-sm font-bold ${activeTab === 'MARKING' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <ScanLine className="w-4 h-4 flex-shrink-0" /> {t.teacher.sidebar.marking}
                        </button>
                        <button
                            onClick={() => setActiveTab('EARNINGS')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-xs md:text-sm font-bold ${activeTab === 'EARNINGS' ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Wallet className="w-4 h-4 flex-shrink-0" /> Earnings
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-slate-100">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            <Brain className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Working Magic...</h3>
                        <p className="text-slate-500">Processing for {selectedClass} • {selectedSubject}</p>
                    </div>
                ) : !generatedNote && !generatedQuiz ? (
                    <>
                        {activeTab === 'HOME' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                                {/* New Tool: Darasa Mode (Full Width) - Clean Light Style */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    onClick={() => navigate('/teacher/darasa')}
                                    className="md:col-span-2 bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-100 flex flex-row items-center cursor-pointer group relative overflow-hidden active:scale-[0.98] transition-all"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>

                                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform border border-indigo-100 shadow-sm shadow-indigo-100">
                                        <MonitorPlay className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <h3 className="font-black text-xl text-slate-900 mb-1 flex items-center gap-2">
                                            {t.teacher.tools.darasa.title} <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm border border-indigo-200">Live</span>
                                        </h3>
                                        <p className="text-slate-500 text-sm font-medium">{t.teacher.tools.darasa.desc}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all border border-slate-200">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                </motion.div>

                                {/* Tool 1: Notes Converter */}
                                <motion.div
                                    whileHover={isOnline ? { y: -5 } : {}}
                                    className={`bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-100 flex flex-col items-center text-center group transition-all ${isOnline ? 'cursor-pointer hover:border-indigo-200' : 'opacity-60 grayscale cursor-not-allowed'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform shadow-sm ${isOnline ? 'bg-indigo-50 group-hover:scale-110 border border-indigo-100' : 'bg-slate-100'}`}>
                                        <FileText className={`w-8 h-8 ${isOnline ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    </div>
                                    <h3 className="font-black text-lg text-slate-900 mb-2">{t.teacher.tools.converter.title}</h3>
                                    <p className="text-sm text-slate-500 mb-6 font-medium">
                                        {isOnline ? `${t.teacher.tools.converter.desc} ${selectedClass}.` : (language === 'FR' ? "Internet requis pour la conversion." : "Internet required for conversion.")}
                                    </p>
                                    <Button
                                        fullWidth
                                        variant="outline"
                                        onClick={isOnline ? () => document.getElementById('file-upload')?.click() : undefined}
                                        disabled={!isOnline}
                                        className="rounded-xl border-2 hover:bg-slate-50 text-xs font-black uppercase tracking-widest"
                                    >
                                        <Upload className="w-4 h-4 mr-2" /> {isOnline ? (language === 'FR' ? "Télécharger Photo" : "Upload Photo") : (language === 'FR' ? "Déconnecté" : "Disconnected")}
                                    </Button>
                                    <input type="file" id="file-upload" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                                </motion.div>

                                {/* Tool 2: Voice Notes */}
                                <motion.div
                                    whileHover={isOnline ? { y: -5 } : {}}
                                    className={`bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-100 flex flex-col items-center text-center group transition-all ${isOnline ? 'cursor-pointer hover:border-purple-200' : 'opacity-60 grayscale cursor-not-allowed'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform shadow-sm ${isRecording ? 'bg-red-50 animate-pulse scale-110 border border-red-100' : isOnline ? 'bg-purple-50 group-hover:scale-110 border border-purple-100' : 'bg-slate-100'}`}>
                                        <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500' : isOnline ? 'text-purple-600' : 'text-slate-400'}`} />
                                    </div>
                                    <h3 className="font-black text-lg text-slate-900 mb-2">{t.teacher.tools.voice.title}</h3>
                                    <p className="text-sm text-slate-500 mb-6 font-medium">
                                        {isOnline ? `${t.teacher.tools.voice.desc} ${selectedSubject}.` : (language === 'FR' ? "Internet requis pour l'audio." : "Internet required for audio.")}
                                    </p>
                                    <Button
                                        fullWidth
                                        variant="outline"
                                        onClick={isOnline ? (isRecording ? stopRecording : startRecording) : undefined}
                                        disabled={!isOnline}
                                        className={`rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all ${isRecording ? 'border-red-500 text-red-600 hover:bg-red-50' : ''}`}
                                    >
                                        <Mic className={`w-4 h-4 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
                                        {isRecording ? (language === 'FR' ? "Arrêter l'enregistrement" : "Stop Recording") : (language === 'FR' ? "Lancer l'audio" : "Record Audio")}
                                    </Button>
                                </motion.div>

                                {/* Advanced Quiz Generator & Materials Hub - Fixed Visibility & Organization */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="md:col-span-2 bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 p-8 md:p-12 relative overflow-visible mt-4 mb-2"
                                >
                                    <div className="flex flex-col md:flex-row gap-12">
                                        <div className="flex-[1.5] space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                                    <Brain className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{t.teacher.tools.exam.title}</h3>
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2">Professional Examination Prep</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                                                        <Type className="w-3 h-3 text-indigo-500" /> {t.teacher.tools.exam.topicLabel}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={advTopic}
                                                        onChange={(e) => setAdvTopic(e.target.value)}
                                                        placeholder="e.g. Introduction to Calculus"
                                                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold bg-slate-50/50 shadow-inner"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                                                            <Layers className="w-3 h-3 text-indigo-500" /> {t.teacher.tools.exam.questionsLabel}
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={advCount}
                                                                onChange={(e) => setAdvCount(Number(e.target.value))}
                                                                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold bg-slate-50/50 shadow-inner appearance-none cursor-pointer"
                                                            >
                                                                <option value={5}>5 Professional Items</option>
                                                                <option value={10}>10 Professional Items</option>
                                                                <option value={15}>15 Professional Items</option>
                                                            </select>
                                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-900 uppercase tracking-[0.1em] flex items-center gap-2">
                                                            <ClipboardList className="w-3 h-3 text-indigo-500" /> {t.teacher.tools.exam.typeLabel}
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={advType}
                                                                onChange={(e) => setAdvType(e.target.value as 'MCQ' | 'OPEN')}
                                                                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold bg-slate-50/50 shadow-inner appearance-none cursor-pointer"
                                                            >
                                                                <option value="MCQ">Objective (Multiple Choice)</option>
                                                                <option value="OPEN">Subjective (Long-form)</option>
                                                            </select>
                                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 border-t md:border-t-0 md:border-l-2 border-slate-100 md:pl-10 pt-8 md:pt-0 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <label className="text-xs font-black text-slate-900 uppercase tracking-[0.1em] mb-2 block">{t.teacher.tools.exam.sourceLabel}</label>

                                                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 p-8 text-center hover:bg-white hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 transition-all group relative cursor-pointer">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*,application/pdf"
                                                        onChange={handleAdvFileUpload}
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                        <Upload className="w-8 h-8 text-indigo-500" />
                                                    </div>
                                                    <p className="text-base font-black text-slate-900 mb-1">
                                                        {advFiles.length > 0 ? t.teacher.tools.exam.uploadSelected.replace('{count}', advFiles.length.toString()) : "Import Source Materials"}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                        {advFiles.length > 0 ? "Replace Documents" : "Upload PDFs or Images"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-8">
                                                <Button
                                                    fullWidth
                                                    variant={isOnline && advTopic && advFiles.length > 0 ? "primary" : "outline"}
                                                    onClick={isOnline ? handleAdvancedQuizGen : undefined}
                                                    disabled={!isOnline || !advTopic || advFiles.length === 0}
                                                    className={`py-5 text-base font-black rounded-2xl shadow-xl transition-all tracking-tight ${isOnline && advTopic && advFiles.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 scale-[1.02]' : 'bg-slate-50 text-black border-slate-100 cursor-not-allowed shadow-none'}`}
                                                >
                                                    <Sparkles className="w-5 h-5 mr-3" /> {isOnline ? t.teacher.tools.exam.generateBtn : t.teacher.common.internetReq}
                                                </Button>
                                                {!isOnline ? (
                                                    <p className="text-[10px] text-center text-slate-400 mt-3 font-black uppercase tracking-[0.2em]">{t.teacher.common.internetReq}</p>
                                                ) : !advTopic ? (
                                                    <p className="text-[10px] text-center text-indigo-500 mt-3 font-black uppercase tracking-[0.2em] animate-pulse">{t.teacher.common.topicPrompt}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Tool 4: Automatic Marking - Clean Style */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    onClick={() => setActiveTab('MARKING')}
                                    className="md:col-span-2 bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-100 flex flex-row items-center cursor-pointer group relative overflow-hidden active:scale-[0.98] transition-all"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>

                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform border border-emerald-100 shadow-sm shadow-emerald-100">
                                        <ScanLine className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <h3 className="font-black text-xl text-slate-900 mb-1 flex items-center gap-2">
                                            {t.teacher.tools.marking.title} <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm border border-emerald-200">{t.teacher.tools.marking.badge}</span>
                                        </h3>
                                        <p className="text-slate-500 text-sm font-medium">{t.teacher.tools.marking.desc}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-all border border-slate-200">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                </motion.div>
                            </div>
                        )}
                        {activeTab === 'LIBRARY' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 overflow-hidden min-h-[500px]">
                                <div className="bg-slate-50/50 px-8 md:px-12 py-8 border-b-2 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <Archive className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tight leading-none">{t.teacher.library.title}</h3>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2">Resource Repository</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center bg-white border-2 border-slate-100 px-4 py-2 rounded-xl shadow-sm">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Class:</span>
                                            <span className="text-xs font-black text-indigo-600">{selectedClass}</span>
                                        </div>
                                        <div className="flex items-center bg-white border-2 border-slate-100 px-4 py-2 rounded-xl shadow-sm">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Subject:</span>
                                            <span className="text-xs font-black text-slate-600">{selectedSubject}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 md:p-12">
                                    <div className="space-y-4">
                                        {teacherHistory.filter(item => (!selectedClass || item.className === selectedClass) && (!selectedSubject || item.subject === selectedSubject)).length === 0 ? (
                                            <div className="text-center py-32 group">
                                                <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                    <HistoryIcon className="w-10 h-10 text-slate-300" />
                                                </div>
                                                <h4 className="text-xl font-black text-slate-800 mb-2">{t.teacher.library.noItems}</h4>
                                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Generate your first academic resource to begin.</p>
                                            </div>
                                        ) : (
                                            teacherHistory
                                                .filter(item => (!selectedClass || item.className === selectedClass) && (!selectedSubject || item.subject === selectedSubject))
                                                .map((item) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="p-6 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 cursor-pointer flex items-center justify-between group transition-all"
                                                        onClick={() => loadHistoryItem(item)}
                                                    >
                                                        <div className="flex items-center gap-5">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${item.type === 'NOTE' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                                                {item.type === 'NOTE' ? <FileText className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors tracking-tight">{item.title}</h4>
                                                                <div className="flex items-center gap-4 mt-1">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                        <Calendar className="w-3 h-3" /> {item.date}
                                                                    </p>
                                                                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type === 'NOTE' ? 'Notes' : 'Assessment'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(t.teacher.library.deleteConfirm)) {
                                                                        deleteTeacherActivity(item.id);
                                                                    }
                                                                }}
                                                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                                title={t.teacher.library.deleteLesson}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'MARKING' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 p-8 md:p-16 text-center min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-40"></div>

                                <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                                    <div className="w-24 h-24 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-100">
                                        <ScanLine className="w-12 h-12" />
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-none">{t.teacher.tools.marking.almostHere}</h2>
                                    <p className="text-slate-500 font-bold text-lg mb-12 leading-relaxed">
                                        {t.teacher.tools.marking.markingDesc.replace('{subject}', selectedSubject)}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-12">
                                        <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-slate-100 text-left group hover:border-emerald-200 hover:bg-white hover:shadow-xl hover:shadow-emerald-50/50 transition-all">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <ClipboardCheck className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <h4 className="font-black text-slate-900 text-md uppercase tracking-wider mb-2">{t.teacher.tools.marking.ocrTitle}</h4>
                                            <p className="text-xs text-slate-500 font-bold tracking-tight leading-relaxed">{t.teacher.tools.marking.ocrDesc}</p>
                                        </div>
                                        <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-slate-100 text-left group hover:border-emerald-200 hover:bg-white hover:shadow-xl hover:shadow-emerald-50/50 transition-all">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Sparkles className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <h4 className="font-black text-slate-900 text-md uppercase tracking-wider mb-2">{t.teacher.tools.marking.cbeTitle}</h4>
                                            <p className="text-xs text-slate-500 font-bold tracking-tight leading-relaxed">{t.teacher.tools.marking.cbeDesc}</p>
                                        </div>
                                    </div>

                                    <Button variant="secondary" className="px-12 py-5 rounded-2xl transition-all scale-[1.05] border-none font-black">
                                        {t.teacher.tools.marking.waitlistBtn.replace('{class}', selectedClass)}
                                    </Button>
                                    <p className="mt-8 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{t.teacher.tools.marking.earlyAccess}</p>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'EARNINGS' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
                                                <Wallet className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Wallet Balance</span>
                                        </div>
                                        <div>
                                            <h4 className="text-3xl font-black text-slate-900 tracking-tight">{teacherWallet?.balance.toLocaleString()} <span className="text-lg text-slate-500">{teacherWallet?.currency}</span></h4>
                                            <p className="text-xs text-slate-500 font-bold mt-1">Available for withdrawal</p>
                                        </div>
                                        <Button fullWidth className="mt-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase tracking-widest border-none py-4">Withdraw to M-Pesa</Button>
                                    </div>

                                    <div className="md:col-span-2 bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-40"></div>
                                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isAvailableForTutoring ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                                            <Users className="w-10 h-10" />
                                        </div>
                                        <div className="flex-1 relative z-10 text-center md:text-left">
                                            <h3 className="font-black text-xl text-slate-900 mb-1">Homework Help Hub</h3>
                                            <p className="text-slate-500 text-sm font-medium mb-4">When active, students can request real-time help. Earn KES 30 per session.</p>
                                            <div className="flex items-center gap-4 justify-center md:justify-start">
                                                <button
                                                    onClick={() => toggleTutoringAvailability()}
                                                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isAvailableForTutoring ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    {isAvailableForTutoring ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                    {isAvailableForTutoring ? 'Active to Tutor' : 'Go Available'}
                                                </button>
                                                {isAvailableForTutoring && (
                                                    <span className="flex h-3 w-3 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Tutoring Requests - Phase 2 */}
                                {isAvailableForTutoring && (
                                    <div className="bg-white rounded-[2.5rem] border-2 border-indigo-100 shadow-xl shadow-indigo-50/50 overflow-hidden">
                                        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                                            <h3 className="font-black text-lg flex items-center gap-2">
                                                <Users className="w-5 h-5" /> Pending Tutoring Requests
                                            </h3>
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                                                {activeTutoringRequests.filter(r => r.status === 'PENDING').length} Active
                                            </span>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {activeTutoringRequests.filter(r => r.status === 'PENDING' || (r.status === 'ACCEPTED' && r.teacherId === teacherProfile?.id)).length === 0 ? (
                                                <div className="p-12 text-center">
                                                    <p className="text-slate-400 font-bold text-sm">No pending requests. New requests will appear here!</p>
                                                </div>
                                            ) : (
                                                activeTutoringRequests
                                                    .filter(r => r.status === 'PENDING' || (r.status === 'ACCEPTED' && r.teacherId === teacherProfile?.id))
                                                    .map(req => (
                                                        <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-2 py-0.5 bg-indigo-50 rounded">{req.topic}</span>
                                                                        {req.status === 'ACCEPTED' && <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2 py-0.5 bg-emerald-50 rounded animate-pulse">Accepted</span>}
                                                                    </div>
                                                                    <p className="text-slate-800 font-bold text-lg leading-tight">{req.description}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-black text-slate-900">KES {req.price}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Earnings</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                {req.status === 'PENDING' ? (
                                                                    <Button
                                                                        variant="primary"
                                                                        className="bg-indigo-600 text-xs py-2 px-6 h-auto"
                                                                        onClick={() => acceptTutoringRequest(req.id)}
                                                                    >
                                                                        Accept & Respond
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="primary"
                                                                        className="bg-emerald-600 text-xs py-2 px-6 h-auto"
                                                                        onClick={() => setRespondingTo(req.id)}
                                                                    >
                                                                        Open Response Studio
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-indigo-500" /> Recent Transactions
                                        </h3>
                                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All History</button>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {teacherWallet?.transactions.map(t => (
                                            <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'EARNING' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {t.type === 'EARNING' ? <DollarSign className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 rotate-45" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{t.description}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 lowercase">{t.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-black text-sm ${t.type === 'EARNING' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {t.type === 'EARNING' ? '+' : '-'}{t.amount} <span className="text-[10px] font-bold text-slate-400">KES</span>
                                                    </p>
                                                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-300">{t.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </>
                ) : (
                    // RESULTS VIEW
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                        <div className="flex items-center justify-between mb-2 px-4">
                            <Button variant="ghost" onClick={() => { setGeneratedNote(null); setGeneratedQuiz(null); setActiveTab('HOME'); }} className="text-slate-500 font-black uppercase tracking-widest text-xs hover:text-indigo-600">
                                <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> {t.teacher.results.backToStudio}
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => window.print()} className="rounded-xl border-2 font-black uppercase tracking-widest text-xs">
                                    <Download className="w-4 h-4 mr-2" /> {t.teacher.results.exportPdf}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white p-8 md:p-16 rounded-[4rem] shadow-sm border-2 border-slate-100 print:border-none print:shadow-none min-h-[600px] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/30 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

                            {generatedQuiz && (
                                <div className="space-y-8">
                                    <div className="text-center border-b border-gray-100 pb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{selectedClass}</span>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{selectedSubject}</span>
                                        </div>
                                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{generatedQuiz.topic}</h1>
                                        <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">{t.teacher.results.classroomAssessment}</p>
                                    </div>
                                    <div className="mt-12 p-8 bg-slate-50/50 rounded-[3rem] border-2 border-slate-100 break-before-page">
                                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            {t.teacher.results.answerKey}
                                        </h3>
                                        <div className="space-y-4">
                                            {generatedQuiz.questions.map((q, i) => (
                                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                                    <span className="font-black text-indigo-600 text-lg">{i + 1}.</span>
                                                    <div className="space-y-1">
                                                        <p className="text-slate-900 font-black">{q.correctAnswer}</p>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{q.explanation}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {generatedNote && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                            {activeTab === 'VOICE' ? <Mic className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex gap-2 mb-1">
                                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{selectedClass}</span>
                                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{selectedSubject}</span>
                                            </div>
                                            <h1 className="text-2xl font-bold text-slate-900">{generatedNote.topic}</h1>
                                            <p className="text-slate-500 text-sm">Generated on {generatedNote.date || new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                                <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm border border-blue-100">A</span> {t.teacher.results.summary}
                                            </h2>
                                            <div className="prose prose-sm prose-slate bg-blue-50/30 p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-inner">
                                                <MarkdownText content={generatedNote.simplifiedNotes} />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                                <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm border border-indigo-100">B</span> {t.teacher.results.teacherNotes}
                                            </h2>
                                            <div className="prose prose-sm prose-slate p-2">
                                                <MarkdownText content={generatedNote.structuredNotes} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </div>

            {/* Payment Flow Overlay */}
            {
                selectedPlan && (
                    <PaymentFlow
                        plan={selectedPlan}
                        onSuccess={async () => {
                            await upgradeAccount(selectedPlan);
                            setSelectedPlan(null);
                        }}
                        onCancel={() => setSelectedPlan(null)}
                    />
                )
            }

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title={t.teacher.logoutModal.title}
                message={t.teacher.logoutModal.message}
                cancelText={t.teacher.logoutModal.cancelText}
                confirmText={t.teacher.logoutModal.confirmText}
                onConfirm={() => {
                    logout();
                    setShowLogoutModal(false);
                    navigate('/');
                }}
            />

            {
                showOnboarding && (
                    <TeacherOnboarding
                        initialStep={2}
                        isEditing={true}
                        onComplete={(updatedProfile) => {
                            setShowOnboarding(false);
                            // Force local update if needed, but context handles it
                            if (updatedProfile.classes.length > 0) {
                                setSelectedClass(updatedProfile.classes[0]);
                            }
                        }}
                        onClose={() => setShowOnboarding(false)}
                    />
                )
            }
        </div >
    );
};
