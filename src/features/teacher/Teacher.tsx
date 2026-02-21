import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Mic, FileText, Share2, StopCircle, Download, BookOpen, Crown, Brain, Sparkles, X, Lightbulb, CheckCircle, Play, Pause, Trash2, ArrowRight, Library, Filter, Calendar, Home, LogOut, MonitorPlay, CreditCard, ScanLine, Plus,
    SquarePlus, ChevronRight, Type, Layers, ClipboardList, ClipboardCheck, Archive, History as HistoryIcon, MoreVertical, Check, Wallet, ToggleRight, ToggleLeft, Users, TrendingUp, DollarSign, ShoppingBag, Store, Clock, AlertCircle, CheckCircle2, MoreHorizontal, Bell, Star, Loader2, ArrowLeft
}
    from 'lucide-react';
import { Button, Card, Header, MarkdownText } from '../../components/Shared';
import { TeacherPaywall } from '../../components/TeacherPaywall';
import { TeacherOnboarding } from '../../components/TeacherOnboarding';
import { LoginModal } from '../../components/LoginModal';
import { LogoutModal } from '../../components/LogoutModal';
import { RegistrationModal } from '../../components/RegistrationModal';
import { TeacherLanding } from '../../components/TeacherLanding';
import { useApp } from '../../context/AppContext';
import { convertNotes, processVoiceNote, generateTeacherQuiz, generateAdvancedTeacherQuiz, fileToGenerativePart } from '../../services/geminiService';
import { ViewState, TeacherNote, QuizData, TeacherActivity, SubscriptionPlan, ChatMessage } from '../../types';
import { PdfPageSelector } from '../../components/PdfPageSelector';
import { PaymentFlow } from '../subscription/PaymentFlow';
import { translations } from '../../data/translations';
import { TeacherRequestModal } from '../../components/TeacherRequestModal';
import { TutoringRequest } from '../../types';

import { useNavigate, useLocation } from 'react-router-dom';

interface TeacherProps {
    onNavigate: (view: ViewState) => void;
    initialTab?: 'DASHBOARD' | 'MAGIC_CLASSROOM' | 'STUDENTS' | 'MARKING' | 'EARNINGS' | 'LIBRARY' | 'HOME' | 'CONVERT' | 'VOICE' | 'QUIZ' | 'MARKETPLACE' | 'PROFILE';
}

export const TeacherDashboard: React.FC<TeacherProps> = ({ onNavigate, initialTab }) => {
    const {
        teacherUsageCount, incrementTeacherUsage, teacherProfile,
        updateTeacherProfile, teacherHistory, saveTeacherActivity,
        deleteTeacherActivity,
        logout, isPro, upgradeAccount,
        isOnline, language,
        teacherWallet, teacherDarasaUsage, isAvailableForTutoring, toggleTutoringAvailability, fetchEarnings,
        activeTutoringRequests, acceptTutoringRequest, submitTutoringResponse,
        chatMessages, sendChatMessage, fetchChatMessages,
        marketplaceMaterials, listMaterial
    } = useApp();
    const t = translations[language];
    const [showPaywall, setShowPaywall] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Authentication State
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [authTab, setAuthTab] = useState<'TEACHER' | 'SCHOOL'>('TEACHER');



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
                    description: `Somo Smart ${plan.name} Subscription`,
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
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MAGIC_CLASSROOM' | 'STUDENTS' | 'MARKING' | 'EARNINGS' | 'LIBRARY' | 'CONVERT' | 'VOICE' | 'QUIZ' | 'HOME' | 'MARKETPLACE' | 'PROFILE'>(initialTab || 'DASHBOARD');
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedClass, setSelectedClass] = useState<string>(teacherProfile?.classes?.[0] || (language === 'FR' ? "Département" : "Selected Department"));
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string>(teacherProfile?.subjects?.[0] || (language === 'FR' ? "Discipline" : "Active Discipline"));

    // Exam Generator State
    const [showExamGen, setShowExamGen] = useState(false);
    const [advFiles, setAdvFiles] = useState<File[]>([]);
    const [advTopic, setAdvTopic] = useState("");
    const [advCount, setAdvCount] = useState(5);
    const [advType, setAdvType] = useState<'MCQ' | 'OPEN'>('MCQ');

    // Request Modal State
    const [selectedRequest, setSelectedRequest] = useState<TutoringRequest | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    // PDF Selection State
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    // Results
    const [generatedNote, setGeneratedNote] = useState<TeacherNote | null>(null);
    const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);

    // Phase 2: Tutoring Response
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [responseType, setResponseType] = useState<'TEXT' | 'VOICE' | 'VIDEO'>('TEXT');
    const [responseText, setResponseText] = useState("");

    // Teacher Chat State
    const [teacherChatRequestId, setTeacherChatRequestId] = useState<string | null>(null);
    const [teacherChatInput, setTeacherChatInput] = useState('');
    const [teacherChatSending, setTeacherChatSending] = useState(false);
    const teacherChatEndRef = useRef<HTMLDivElement>(null);

    // Phase 3: Marketplace Upload
    const [listingTitle, setListingTitle] = useState("");
    const [listingPrice, setListingPrice] = useState(50);
    const [listingCategory, setListingCategory] = useState<'NOTES' | 'REVISION_PAPER' | 'MARKING_SCHEME' | 'RECORDED_LESSON'>('NOTES');
    const [showUploadPortal, setShowUploadPortal] = useState(false);

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

    const handleRequestClick = (request: TutoringRequest) => {
        setSelectedRequest(request);
        setIsRequestModalOpen(true);
    };

    const handleRequestSubmit = async (requestId: string, response: string, type: 'TEXT' | 'VOICE' | 'VIDEO', pricingType: 'FREE' | 'FIXED' | 'RATE_ME', price: number, attachments: File[]) => {
        await submitTutoringResponse(requestId, response, type, pricingType, price, attachments);
        setIsRequestModalOpen(false);
        setSelectedRequest(null);
    };

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

    // If not authenticated, show Landing Page
    if (!teacherProfile) {
        return (
            <>
                <TeacherLanding
                    onLogin={() => { setAuthTab('TEACHER'); setShowLogin(true); }}
                    onRegister={() => { setAuthTab('TEACHER'); setShowRegister(true); }}
                />

                <LoginModal
                    isOpen={showLogin}
                    onClose={() => setShowLogin(false)}
                    initialTab={authTab === 'SCHOOL' ? 'SCHOOL' : 'TEACHER'}
                    onSwitchToRegister={(role) => {
                        setShowLogin(false);
                        if (role === 'TEACHER' || role === 'SCHOOL') {
                            setAuthTab(role);
                            setShowRegister(true);
                        }
                    }}
                />

                <RegistrationModal
                    isOpen={showRegister}
                    onClose={() => setShowRegister(false)}
                    initialRole={authTab}
                    onSwitchToLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                    onSuccess={() => {
                        setShowRegister(false);
                        // Profile is set in context, so re-render will show dashboard
                    }}
                />
            </>
        );
    }

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
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative selection:bg-indigo-100">
            <TeacherPaywall isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
            <TeacherRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                request={selectedRequest}
                onSubmit={handleRequestSubmit}
            />

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

            {/* --- MODERN HEADER --- */}
            <div className="bg-white sticky top-0 z-50 shadow-sm border-b border-slate-100">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-[72px] flex items-center justify-between">
                    {/* Left: Logo — clickable to go home */}
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Soma<span className="text-indigo-600">Smart</span></h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Studio</p>
                        </div>
                    </div>

                    {/* Center: Navigation */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-50/50 p-1 rounded-2xl border border-slate-100">
                        <button
                            onClick={() => setActiveTab('DASHBOARD')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('MAGIC_CLASSROOM')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'MAGIC_CLASSROOM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                        >
                            Magic Classroom
                        </button>
                        <button
                            onClick={() => setActiveTab('STUDENTS')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'STUDENTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                        >
                            Students
                        </button>
                        <button
                            onClick={() => setActiveTab('MARKING')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'MARKING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                        >
                            Marking
                        </button>
                        <button
                            onClick={() => setActiveTab('EARNINGS')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'EARNINGS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                        >
                            Earnings
                        </button>
                    </div>

                    {/* Right: Wallet & Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors shadow-sm" onClick={() => setActiveTab('EARNINGS')}>
                            <Wallet className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-black text-emerald-700">KES {teacherWallet?.balance || 0}</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1"></div>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            {/* Rating Display */}
                            <div className="flex flex-col items-end mr-2">
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span className="text-xs font-black text-slate-900">{teacherProfile?.rating?.toFixed(1) || 'NEW'}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Rating</span>
                            </div>

                            <div className="relative group cursor-pointer" onClick={() => setActiveTab('PROFILE')}>
                                <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                                    <span className="font-black text-indigo-600 text-sm">TJ</span>
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-8 pb-24">



                {/* --- DASHBOARD VIEW --- */}
                {activeTab === 'DASHBOARD' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        {/* Hero Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Greeting Card */}
                            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="relative z-10">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                                        Good morning, Teacher {teacherProfile?.name.split(' ')[0] || 'Jane'} <span className="text-2xl">👋</span>
                                    </h2>
                                    <div className="space-y-2 mb-8">
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                            Today: <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            <span className="text-slate-900 font-bold">{teacherHistory.length} resources</span> created <FileText className="w-3 h-3 text-indigo-500" />
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                            <span className="text-slate-900 font-bold">{activeTutoringRequests.filter(r => r.status === 'PENDING').length} requests</span> need attention <AlertCircle className="w-3 h-3 text-amber-500" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={() => setActiveTab('MAGIC_CLASSROOM')}
                                            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all text-sm"
                                        >
                                            Create Homework
                                        </button>
                                        <button
                                            onClick={() => navigate('/teacher/darasa')}
                                            className="bg-white text-slate-600 border border-slate-200 px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition-all text-sm"
                                        >
                                            Start Class
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Requests Card */}
                            <div
                                onClick={() => {
                                    if (activeTutoringRequests.filter(r => r.status === 'PENDING').length > 0) {
                                        // Open modal with first pending request, or show list (for now just open first)
                                        // Ideally we show a list.
                                        // For now, let's open a Request List view or modal.
                                        // Let's reuse 'STUDENTS' tab or similar? 
                                        // Better: Open the RequestModal with the first pending request to demo.
                                        const first = activeTutoringRequests.find(r => r.status === 'PENDING');
                                        if (first) {
                                            setSelectedRequest(first);
                                            setIsRequestModalOpen(true);
                                        }
                                    }
                                }}
                                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                        <div className="relative">
                                            <Bell className="w-6 h-6" />
                                            {activeTutoringRequests.filter(r => r.status === 'PENDING').length > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        Action Required
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-1">{activeTutoringRequests.filter(r => r.status === 'PENDING').length}</h3>
                                    <p className="text-slate-500 font-medium text-sm">Pending Student Requests</p>
                                </div>
                            </div>

                            {/* Metrics Cards */}
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings Today</p>
                                        <p className="text-2xl font-black text-slate-900">
                                            {teacherWallet?.transactions
                                                .filter(t => new Date(t.date).toLocaleDateString() === new Date().toLocaleDateString())
                                                .reduce((acc, t) => acc + (t.type === 'EARNING' ? t.amount : 0), 0) || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History</p>
                                        <p className="text-2xl font-black text-slate-900">{teacherHistory.length} <span className="text-xs text-slate-400 font-bold">Items</span></p>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                                        <p className="text-2xl font-black text-slate-900">{activeTutoringRequests.filter(r => r.status === 'PENDING').length} <span className="text-xs text-slate-400 font-bold">Requests</span></p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const pending = activeTutoringRequests.find(r => r.status === 'PENDING');
                                            if (pending) handleRequestClick(pending);
                                        }}
                                        className="ml-auto p-2 hover:bg-slate-50 rounded-full transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-300" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row: AI Insights & Class Performance */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* AI Insights */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                                    <Brain className="w-64 h-64 text-indigo-600 -mr-12 -mb-12" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-6">Soma AI Insights</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-start gap-3">
                                        <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5" />
                                        <p className="text-sm font-bold text-slate-700">
                                            <span className="text-emerald-600 font-black">60%</span> of {selectedClass} struggling with {selectedSubject}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                        <p className="text-sm font-bold text-slate-700">
                                            <span className="text-red-600 font-black">12 students</span> did not complete {selectedSubject} homework
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Layers className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <p className="text-sm font-bold text-slate-700">
                                            Suggested revision topic: <span className="text-blue-600 font-black">Decimals</span>
                                        </p>
                                    </div>
                                </div>
                                <button className="mt-8 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                                    Generate Revision Worksheet
                                </button>
                            </div>

                            {/* Class Performance */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-900">Class Performance</h3>
                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                                        Report
                                    </button>
                                </div>
                                <p className="text-sm font-black text-slate-500 uppercase tracking-wider mb-2">{selectedClass} {selectedSubject}</p>

                                <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Average Score</p>
                                            <p className="text-3xl font-black text-slate-900">62%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" /> +8%
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Improvement</p>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[62%] rounded-full"></div>
                                    </div>
                                </div>

                                <button onClick={() => setActiveTab('MARKING')} className="w-full bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-100 transition-colors">
                                    Mark Now
                                </button>
                            </div>
                        </div>

                        {/* Bottom Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Homework Queue */}
                            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-900">Homework & Marking Queue</h3>
                                    <button className="text-xs font-bold text-slate-400 hover:text-indigo-600">View All</button>
                                </div>
                                <div className="space-y-4">
                                    {teacherHistory.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                            No items in queue. Create your first resource!
                                        </div>
                                    ) : (
                                        teacherHistory.slice(0, 4).map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer" onClick={() => loadHistoryItem(item)}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center ${item.type === 'NOTE' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        {item.type === 'NOTE' ? <FileText className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                                                        <p className="text-xs text-slate-500 font-semibold">{item.type === 'NOTE' ? 'Study Notes' : 'Quiz Assessment'} • {item.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3" /> Ready</span>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Quick Access Library */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-900">Quick Access Library</h3>
                                    <Library className="w-5 h-5 text-slate-400" />
                                </div>
                                <div className="space-y-4">
                                    {teacherHistory.length > 0 ? teacherHistory.slice(0, 4).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors" onClick={() => loadHistoryItem(item)}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${item.type === 'NOTE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                    {item.type === 'NOTE' ? <FileText className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.subject}</p>
                                                </div>
                                            </div>
                                            <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8">
                                            <p className="text-slate-400 text-xs font-bold">Library is empty.</p>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setActiveTab('LIBRARY')} className="w-full mt-6 py-3 text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 rounded-xl hover:bg-indigo-100">
                                    View Full Library
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- MAGIC CLASSROOM (Tools) --- */}
                {activeTab === 'MAGIC_CLASSROOM' && (
                    <div className="space-y-8">
                        {/* Header for Magic Classroom */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200 mb-8">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black mb-2">Magic Classroom Tools</h2>
                                <p className="text-indigo-100 font-medium max-w-xl">
                                    Access your AI-powered teaching assistants. Generate quizzes, convert notes, and manage your live classes.
                                </p>
                            </div>
                        </div>

                        {/* Sub-tab Switcher for Tools */}
                        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit mb-4 mx-auto md:mx-0">
                            <button
                                onClick={() => setShowExamGen(false)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${!showExamGen ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Magic Tools
                            </button>
                            <button
                                onClick={() => setShowExamGen(true)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${showExamGen ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Exam Center
                            </button>
                        </div>

                        {!showExamGen ? (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.1
                                        }
                                    }
                                }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {/* Tool: Darasa Mode (Featured) */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                    whileHover={{ y: -5 }}
                                    onClick={() => navigate('/teacher/darasa')}
                                    className="md:col-span-2 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 relative overflow-hidden cursor-pointer group"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>

                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                                <MonitorPlay className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight mb-1 flex items-center gap-3">
                                                    {t.teacher.tools.darasa.title}
                                                    <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Live Studio</span>
                                                </h3>
                                                <p className="text-slate-300 font-medium max-w-md">{t.teacher.tools.darasa.desc}</p>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                            <ArrowRight className="w-6 h-6" />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Tool: Notes Converter */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                    whileHover={isOnline ? { y: -5 } : {}}
                                    className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all group relative overflow-hidden ${!isOnline && 'opacity-60 grayscale'}`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <FileText className="w-7 h-7" />
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-2">{t.teacher.tools.converter.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                        {isOnline ? `${t.teacher.tools.converter.desc} ${selectedClass}.` : "Connect to internet to convert."}
                                    </p>

                                    <Button
                                        fullWidth
                                        onClick={isOnline ? () => document.getElementById('file-upload')?.click() : undefined}
                                        disabled={!isOnline}
                                        className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-slate-200"
                                    >
                                        {isOnline ? (language === 'FR' ? "Télécharger" : "Upload Photo") : "Offline"}
                                    </Button>
                                    <input type="file" id="file-upload" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                                </motion.div>

                                {/* Tool: Voice Notes */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                    whileHover={isOnline ? { y: -5 } : {}}
                                    className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-50/50 transition-all group relative overflow-hidden ${!isOnline && 'opacity-60 grayscale'}`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-purple-50 text-purple-600 group-hover:scale-110'}`}>
                                        <Mic className="w-7 h-7" />
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-2">{t.teacher.tools.voice.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                        {isOnline ? `${t.teacher.tools.voice.desc} ${selectedSubject}.` : "Connect to internet for voice."}
                                    </p>

                                    <Button
                                        fullWidth
                                        onClick={isOnline ? (isRecording ? stopRecording : startRecording) : undefined}
                                        disabled={!isOnline}
                                        className={`rounded-xl py-4 font-black uppercase tracking-widest text-xs shadow-lg transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' : '!bg-white border-2 border-purple-100 !text-purple-600 hover:!bg-purple-50'}`}
                                    >
                                        {isRecording ? (language === 'FR' ? "Arrêter" : "Stop Recording") : (language === 'FR' ? "Enregistrer" : "Record Audio")}
                                    </Button>
                                </motion.div>

                                {/* Tool: Automatic Marking */}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                    whileHover={{ y: -5 }}
                                    onClick={() => setActiveTab('MARKING')}
                                    className="md:col-span-2 bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center justify-between cursor-pointer group hover:bg-emerald-50 transition-colors"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                                            <ScanLine className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                                                {t.teacher.tools.marking.title}
                                                <span className="text-[9px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Beta</span>
                                            </h3>
                                            <p className="text-sm text-slate-500 font-medium">{t.teacher.tools.marking.desc}</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600 group-hover:translate-x-1 transition-transform">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </motion.div>
                            </motion.div>
                        ) : (
                            /* Advanced Quiz Generator (Exam Center) */
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] shadow-xl p-8 relative overflow-hidden border border-slate-100">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="relative z-10 flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                        <Sparkles className="w-6 h-6 text-indigo-500" />
                                        {t.teacher.tools.exam.title}
                                    </h3>
                                    <Button variant="ghost" onClick={() => setShowExamGen(false)} className="rounded-full w-10 h-10 p-0 text-slate-400 hover:text-slate-600">
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>

                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <label className="text-xs font-black text-slate-900 uppercase tracking-[0.1em] mb-2 block">{t.teacher.tools.exam.topicLabel}</label>
                                            <input
                                                type="text"
                                                value={advTopic}
                                                onChange={(e) => setAdvTopic(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                                placeholder="e.g. Introduction to Calculus"
                                            />
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 hidden md:block">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0 mt-1">
                                                    <Lightbulb className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-blue-900 text-xs uppercase tracking-wider mb-1">AI Tip</h4>
                                                    <p className="text-xs text-blue-700 font-medium">
                                                        Upload clear images or PDFs. The AI works best with typed notes rather than handwritten ones.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 border-t md:border-t-0 md:border-l-2 border-slate-100 md:pl-10 pt-8 md:pt-0 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-slate-900 uppercase tracking-[0.1em] mb-2 block">{t.teacher.tools.exam.sourceLabel}</label>

                                            <div className="border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 p-6 text-center hover:bg-white hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 transition-all group relative cursor-pointer">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,application/pdf"
                                                    onChange={handleAdvFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                    <Upload className="w-6 h-6 text-indigo-500" />
                                                </div>
                                                <p className="text-sm font-black text-slate-900 mb-0.5">
                                                    {advFiles.length > 0 ? t.teacher.tools.exam.uploadSelected.replace('{count}', advFiles.length.toString()) : "Import Source Materials"}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {advFiles.length > 0 ? "Add More Documents" : "Upload PDFs or Images"}
                                                </p>
                                            </div>

                                            {advFiles.length > 0 && (
                                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                                    {advFiles.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-[10px] font-black text-slate-900 truncate max-w-[120px]">{file.name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setAdvFiles(prev => prev.filter((_, i) => i !== idx))}
                                                                className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {
                    activeTab === 'LIBRARY' && (
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {teacherHistory.filter(item => (!selectedClass || item.className === selectedClass) && (!selectedSubject || item.subject === selectedSubject)).length === 0 ? (
                                        <div className="md:col-span-2 py-12 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] group">
                                            <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                <HistoryIcon className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h4 className="text-lg font-black text-slate-700 mb-1">{t.teacher.library.noItems}</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Create your first resource above</p>
                                        </div>
                                    ) : (
                                        teacherHistory
                                            .filter(item => (!selectedClass || item.className === selectedClass) && (!selectedSubject || item.subject === selectedSubject))
                                            .map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    whileHover={{ y: -3, scale: 1.01 }}
                                                    className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 cursor-pointer flex justify-between items-center group transition-all"
                                                    onClick={() => loadHistoryItem(item)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${item.type === 'NOTE' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                                            {item.type === 'NOTE' ? <FileText className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-800 text-sm md:text-base group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</h4>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" /> {item.date}
                                                                </span>
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${item.type === 'NOTE' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                    {item.type === 'NOTE' ? 'Notes' : 'Exam'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(t.teacher.library.deleteConfirm)) deleteTeacherActivity(item.id);
                                                        }}
                                                        className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
                {
                    activeTab === 'MARKING' && (
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
                    )
                }
                {
                    activeTab === 'EARNINGS' && (
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
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-2 py-0.5 bg-indigo-50 rounded">{req.topic}</span>
                                                                    {req.status === 'ACCEPTED' && <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2 py-0.5 bg-emerald-50 rounded animate-pulse">Accepted</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                    {req.studentName && (
                                                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                                            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[9px] font-black">{req.studentName[0].toUpperCase()}</span>
                                                                            {req.studentName}
                                                                        </span>
                                                                    )}
                                                                    {req.grade && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{req.grade}</span>}
                                                                    {req.subject && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{req.subject}</span>}
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

                                    {/* Completed Requests with Chat */}
                                    {activeTutoringRequests.filter(r => r.status === 'COMPLETED').length > 0 && (
                                        <div className="mt-6">
                                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-t-3xl flex justify-between items-center">
                                                <h3 className="font-black text-lg flex items-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5" /> Completed Responses
                                                </h3>
                                                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                                                    {activeTutoringRequests.filter(r => r.status === 'COMPLETED').length} Done
                                                </span>
                                            </div>
                                            <div className="divide-y divide-slate-50 bg-white rounded-b-3xl border border-slate-100">
                                                {activeTutoringRequests.filter(r => r.status === 'COMPLETED').map(req => (
                                                    <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2 py-0.5 bg-emerald-50 rounded">{req.topic}</span>
                                                                <div className="flex items-center gap-2 mt-1 mb-1 flex-wrap">
                                                                    {req.studentName && (
                                                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                                            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[9px] font-black">{req.studentName[0].toUpperCase()}</span>
                                                                            {req.studentName}
                                                                        </span>
                                                                    )}
                                                                    {req.grade && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{req.grade}</span>}
                                                                    {req.subject && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{req.subject}</span>}
                                                                </div>
                                                                <p className="text-slate-800 font-bold mt-1">{req.description}</p>
                                                            </div>
                                                            {req.rating && (
                                                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                                                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                                    <span className="text-xs font-bold text-amber-700">{req.rating}/5</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setTeacherChatRequestId(req.id);
                                                                fetchChatMessages(req.id);
                                                            }}
                                                            className="mt-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center gap-2"
                                                        >
                                                            💬 Open Chat Thread
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                                    {teacherWallet?.transactions && teacherWallet.transactions.length > 0 ? (
                                        teacherWallet.transactions.map(t => (
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
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-xs font-bold">
                                            No recent transactions found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
                {
                    activeTab === 'MARKETPLACE' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-24">
                            {/* Marketplace Header */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-3xl font-black mb-2 tracking-tight">Marketplace Portal</h3>
                                            <p className="opacity-90 text-sm font-medium max-w-xs leading-relaxed">Share your knowledge and earn from every student who unlocks your materials.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowUploadPortal(true)}
                                            className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" /> List Material
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="bg-white/20 px-6 py-4 rounded-3xl backdrop-blur-md border border-white/10">
                                            <p className="text-[10px] uppercase font-black opacity-60 tracking-widest mb-1">Your Listings</p>
                                            <p className="font-black text-2xl">{marketplaceMaterials.filter(m => m.teacherId === teacherProfile?.id).length}</p>
                                        </div>
                                        <div className="bg-white/20 px-6 py-4 rounded-3xl backdrop-blur-md border border-white/10">
                                            <p className="text-[10px] uppercase font-black opacity-60 tracking-widest mb-1">Market Reach</p>
                                            <p className="font-black text-2xl">Verified</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* My Listings Grid */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-black text-xl text-slate-900 tracking-tight">Your Marketplace Items</h3>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Live on Store
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {marketplaceMaterials.filter(m => m.teacherId === teacherProfile?.id).length === 0 ? (
                                        <div className="md:col-span-2 py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] group">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                                <ShoppingBag className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-4">No materials listed yet</h4>
                                            <Button
                                                onClick={() => setShowUploadPortal(true)}
                                                className="bg-indigo-600 text-white rounded-xl px-8 py-3 font-black text-[10px] uppercase tracking-widest border-none shadow-lg shadow-indigo-100"
                                            >
                                                List First Item
                                            </Button>
                                        </div>
                                    ) : (
                                        marketplaceMaterials
                                            .filter(m => m.teacherId === teacherProfile?.id)
                                            .map(item => (
                                                <motion.div
                                                    key={item.id}
                                                    whileHover={{ y: -5 }}
                                                    className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50/30 transition-all"
                                                >
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                                                            {item.category === 'NOTES' ? <FileText className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                                                        </div>
                                                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-sm font-black">
                                                            KES {item.price}
                                                        </div>
                                                    </div>
                                                    <h4 className="font-black text-slate-900 text-lg mb-1 tracking-tight">{item.title}</h4>
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">{item.subject} • {item.grade}</p>
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                                <Users className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Listing</span>
                                                        </div>
                                                        <button className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
                {(activeTab === 'CONVERT' || activeTab === 'VOICE' || activeTab === 'QUIZ') && (
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

                        <div className="bg-white p-4 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-sm border-2 border-slate-100 print:border-none print:shadow-none min-h-[600px] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/30 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

                            {generatedQuiz && (
                                <div className="space-y-8">
                                    <div className="text-center border-b border-gray-100 pb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{selectedClass}</span>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{selectedSubject}</span>
                                        </div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{generatedQuiz.topic}</h1>
                                        <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">{t.teacher.results.classroomAssessment}</p>
                                    </div>
                                    <div className="mt-8 md:mt-12 p-6 md:p-8 bg-slate-50/50 rounded-[2rem] md:rounded-[3rem] border-2 border-slate-100 break-before-page">
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
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-gray-100 pb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                {activeTab === 'VOICE' ? <Mic className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="flex gap-2 mb-1">
                                                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{selectedClass}</span>
                                                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{selectedSubject}</span>
                                                </div>
                                                <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{generatedNote.topic}</h1>
                                                <p className="text-slate-500 text-sm">Generated on {generatedNote.date || new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                                <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm border border-blue-100">A</span> {t.teacher.results.summary}
                                            </h2>
                                            <div className="prose prose-sm prose-slate bg-blue-50/30 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 border-blue-50 shadow-inner w-full max-w-none">
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

                {/* Phase 3: Marketplace Upload Portal */}
                <AnimatePresence>
                    {showUploadPortal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden"
                            >
                                <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <button
                                        onClick={() => setShowUploadPortal(false)}
                                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <div className="relative z-10 flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black">List Material</h3>
                                            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Monetize your expertise</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Class/Grade</label>
                                            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 text-sm flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                                {selectedClass}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject</label>
                                            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 text-sm flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                                {selectedSubject}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material Title</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={listingTitle}
                                                onChange={(e) => setListingTitle(e.target.value)}
                                                placeholder="e.g. Grade 4 Math Term 1 Revision Notes"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
                                            />
                                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</label>
                                        <div className="relative">
                                            <select
                                                value={listingCategory}
                                                onChange={(e) => setListingCategory(e.target.value as any)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all outline-none appearance-none"
                                            >
                                                <option value="NOTES">Lesson Notes</option>
                                                <option value="REVISION_PAPER">Revision Paper</option>
                                                <option value="MARKING_SCHEME">Marking Scheme</option>
                                                <option value="RECORDED_LESSON">Recorded Lesson</option>
                                            </select>
                                            <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 rotate-90" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 mb-4">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pricing</span>
                                            <span className="text-sm font-black text-blue-700">KES {listingPrice}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="1000"
                                            step="50"
                                            value={listingPrice}
                                            onChange={(e) => setListingPrice(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <div className="flex justify-center mt-2">
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Recommended: KES 150 - 300</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            fullWidth
                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 py-4 text-lg"
                                            onClick={async () => {
                                                if (!listingTitle.trim()) {
                                                    alert("Please enter a title!");
                                                    return;
                                                }
                                                setLoading(true);
                                                const res = await listMaterial({
                                                    teacherId: teacherProfile?.id || "mock-teacher",
                                                    teacherName: teacherProfile?.name || "Teacher",
                                                    title: listingTitle,
                                                    description: `Premium ${listingCategory.toLowerCase()} for ${selectedClass} ${selectedSubject}.`,
                                                    price: listingPrice,
                                                    grade: selectedClass,
                                                    subject: selectedSubject,
                                                    category: listingCategory,
                                                    fileUrl: "https://example.com/mock-file.pdf"
                                                });
                                                setLoading(false);
                                                if (res.success) {
                                                    setListingTitle("");
                                                    setShowUploadPortal(false);
                                                    alert("Material listed in the marketplace!");
                                                }
                                            }}
                                        >
                                            Create Listing
                                        </Button>
                                        <p className="text-center text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-widest">This will be visible to all students in your grade</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

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

                {/* Tutoring Response Studio Overlay - Phase 2 */}
                <AnimatePresence>
                    {respondingTo && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                {/* Header */}
                                <div className="bg-emerald-600 p-8 text-white relative shrink-0">
                                    <button
                                        onClick={() => setRespondingTo(null)}
                                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                            <MonitorPlay className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black">Response Studio</h3>
                                            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Helping students succeed</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-8 space-y-8 overflow-y-auto">
                                    <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Student's Question:</p>
                                        <p className="text-slate-800 font-bold text-lg italic">"{activeTutoringRequests.find(r => r.id === respondingTo)?.description}"</p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Choose Response Type</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button
                                                onClick={() => setResponseType('TEXT')}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${responseType === 'TEXT' ? 'border-emerald-600 bg-emerald-50 text-emerald-600 shadow-lg' : 'border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                                            >
                                                <Type className="w-6 h-6" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Text</span>
                                            </button>
                                            <button
                                                onClick={() => setResponseType('VOICE')}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${responseType === 'VOICE' ? 'border-emerald-600 bg-emerald-50 text-emerald-600 shadow-lg' : 'border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                                            >
                                                <Mic className="w-6 h-6" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Voice</span>
                                            </button>
                                            <button
                                                onClick={() => setResponseType('VIDEO')}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${responseType === 'VIDEO' ? 'border-emerald-600 bg-emerald-50 text-emerald-600 shadow-lg' : 'border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                                            >
                                                <MonitorPlay className="w-6 h-6" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Video</span>
                                            </button>
                                        </div>
                                    </div>

                                    {responseType === 'TEXT' ? (
                                        <div className="space-y-4">
                                            <textarea
                                                placeholder="Type your explanation here..."
                                                rows={6}
                                                value={responseText}
                                                onChange={(e) => setResponseText(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-slate-800 font-medium focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-12 text-center space-y-6">
                                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>
                                                {responseType === 'VOICE' ? <Mic className="w-10 h-10" /> : <MonitorPlay className="w-10 h-10" />}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-emerald-900">{isRecording ? 'Recording Live...' : `Ready to record ${responseType.toLowerCase()}`}</h4>
                                                {isRecording && <p className="text-red-500 font-black text-2xl mt-2">{formatTime(recordingTime)}</p>}
                                            </div>
                                            <Button
                                                variant={isRecording ? "outline" : "primary"}
                                                className={`rounded-full px-12 py-4 font-black uppercase tracking-widest ${isRecording ? 'border-red-500 text-red-600' : 'bg-emerald-600'}`}
                                                onClick={isRecording ? stopRecording : startRecording}
                                            >
                                                {isRecording ? 'Stop & Save' : `Start Recording`}
                                            </Button>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t-2 border-slate-50 flex gap-4">
                                        <Button
                                            variant="outline"
                                            className="flex-1 py-4 font-black uppercase tracking-widest rounded-2xl"
                                            onClick={() => setRespondingTo(null)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100 py-4 font-black uppercase tracking-widest rounded-2xl"
                                            disabled={isRecording || (responseType === 'TEXT' && !responseText.trim())}
                                            onClick={async () => {
                                                setLoading(true);
                                                const res = await submitTutoringResponse(respondingTo!, responseText || "Explanation provided via media.", responseType, 'FIXED', 30, []);
                                                setLoading(false);
                                                if (res.success) {
                                                    setRespondingTo(null);
                                                    setResponseText("");
                                                    alert(res.message);
                                                } else {
                                                    alert(res.message);
                                                }
                                            }}
                                        >
                                            Submit Response & Earn KES 30
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- PROFILE VIEW --- */}
                {activeTab === 'PROFILE' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => setActiveTab('DASHBOARD')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ArrowRight className="w-6 h-6 rotate-180 text-slate-600" />
                            </button>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Profile</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Personal Details */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-indigo-100 border-4 border-white shadow-lg overflow-hidden">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${teacherProfile?.name}&background=random&size=128`}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{teacherProfile?.name}</h3>
                                        <p className="text-slate-500 font-medium">{teacherProfile?.email}</p>
                                        <div className="mt-2 flex gap-2">
                                            {isPro ? (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                                                    <Crown className="w-3 h-3" /> PRO Teacher
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider rounded-full">
                                                    Free Plan
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                                        <input
                                            type="text"
                                            defaultValue={teacherProfile?.name}
                                            onBlur={(e) => {
                                                if (teacherProfile && e.target.value !== teacherProfile.name) {
                                                    updateTeacherProfile({ ...teacherProfile, name: e.target.value });
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={teacherProfile?.email || ''}
                                            disabled
                                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
                                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Professional Details</h3>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Classes Taught</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {teacherProfile?.classes.map((cls) => (
                                            <span key={cls} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg flex items-center gap-2">
                                                {cls}
                                                <button
                                                    onClick={() => updateTeacherProfile({ ...teacherProfile, classes: teacherProfile.classes.filter(c => c !== cls) })}
                                                    className="hover:text-indigo-900"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add class (e.g. Grade 4)"
                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = e.currentTarget.value.trim();
                                                    if (val && teacherProfile && !teacherProfile.classes.includes(val)) {
                                                        updateTeacherProfile({ ...teacherProfile, classes: [...teacherProfile.classes, val] });
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subjects</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {teacherProfile?.subjects.map((sub) => (
                                            <span key={sub} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-bold rounded-lg flex items-center gap-2">
                                                {sub}
                                                <button
                                                    onClick={() => updateTeacherProfile({ ...teacherProfile, subjects: teacherProfile.subjects.filter(s => s !== sub) })}
                                                    className="hover:text-purple-900"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add subject (e.g. Math)"
                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = e.currentTarget.value.trim();
                                                    if (val && teacherProfile && !teacherProfile.subjects.includes(val)) {
                                                        updateTeacherProfile({ ...teacherProfile, subjects: [...teacherProfile.subjects, val] });
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Subscription & Account */}
                            <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Crown className="w-6 h-6 text-amber-400" />
                                            <h3 className="text-xl font-bold">Subscription Status</h3>
                                        </div>
                                        <p className="text-slate-400 max-w-md">
                                            {isPro
                                                ? `You are on the ${selectedPlan?.name || 'Pro'} Plan. Your next billing date is ${new Date().toLocaleDateString()}.`
                                                : "You are currently on the Free Plan with limited access to Somo AI tools."}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        {!isPro && (
                                            <button
                                                onClick={() => navigate('/pricing')}
                                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all"
                                            >
                                                Upgrade to Pro
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowLogoutModal(true)}
                                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

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
                {/* Global Bottom Nav - Mobile Only */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex justify-between items-center z-50 md:hidden pb-safe">
                    <button
                        onClick={() => setActiveTab('HOME')}
                        className={`flex flex-col items-center gap-1 ${activeTab === 'HOME' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Home className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Studio</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('LIBRARY')}
                        className={`flex flex-col items-center gap-1 ${activeTab === 'LIBRARY' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Library className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Library</span>
                    </button>
                    <div className="relative -mt-8">
                        <button
                            onClick={() => setActiveTab('MARKING')}
                            className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all transform active:scale-95 ${activeTab === 'MARKING' ? 'bg-emerald-600 text-white scale-110 shadow-emerald-200' : 'bg-slate-900 text-white shadow-slate-200'}`}
                        >
                            <ScanLine className="w-6 h-6" />
                        </button>
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-tighter text-emerald-600">Marking</span>
                    </div>
                    <button
                        onClick={() => setActiveTab('EARNINGS')}
                        className={`flex flex-col items-center gap-1 ${activeTab === 'EARNINGS' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Wallet className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Wallet</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('MARKETPLACE')}
                        className={`flex flex-col items-center gap-1 ${activeTab === 'MARKETPLACE' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ShoppingBag className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Shop</span>
                    </button>
                </div>
            </div>
            {/* Teacher Chat Thread Overlay */}
            <AnimatePresence>
                {teacherChatRequestId && (() => {
                    const chatReq = activeTutoringRequests.find(r => r.id === teacherChatRequestId);
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-0 md:p-6"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="bg-white w-full h-full md:max-w-lg md:h-[85vh] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative"
                            >
                                {/* Premium Chat Header */}
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white relative overflow-hidden flex-shrink-0">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    <div className="relative z-10 flex items-center gap-4">
                                        <button
                                            onClick={() => { setTeacherChatRequestId(null); setTeacherChatInput(''); }}
                                            className="p-2 hover:bg-white/20 rounded-full transition-colors -ml-2"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-black backdrop-blur-md border border-white/20">
                                            {(chatReq?.studentName || 'S')[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-black text-base truncate">{chatReq?.topic || 'Chat'}</h2>
                                            <p className="text-emerald-100 text-[11px] font-bold truncate">
                                                {chatReq?.studentName || 'Student'} • {chatReq?.rating ? `★ ${chatReq.rating}/5` : 'Ongoing'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => fetchChatMessages(teacherChatRequestId)}
                                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            <Loader2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/50">
                                    {/* Original response */}
                                    {chatReq?.response && (
                                        <div className="flex gap-2.5 items-end flex-row-reverse">
                                            <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm">T</div>
                                            <div className="bg-emerald-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] shadow-md shadow-emerald-100">
                                                <p className="text-[9px] font-black text-emerald-200 uppercase tracking-[0.15em] mb-1.5">Your Response</p>
                                                {chatReq.responseType === 'TEXT' && (
                                                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{chatReq.response}</p>
                                                )}
                                                {chatReq.responseType === 'VOICE' && chatReq.response && (
                                                    <audio src={chatReq.response} controls className="w-full max-w-[240px]" />
                                                )}
                                                {chatReq.responseType === 'VIDEO' && chatReq.response && (
                                                    <video src={chatReq.response} controls className="w-full rounded-xl max-w-[260px]" />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Chat messages */}
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className={`flex gap-2.5 items-end ${msg.senderRole === 'TEACHER' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm ${msg.senderRole === 'TEACHER' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                                                }`}>
                                                {msg.senderRole === 'TEACHER' ? 'T' : 'S'}
                                            </div>
                                            <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${msg.senderRole === 'TEACHER'
                                                ? 'bg-emerald-600 text-white rounded-br-sm shadow-md shadow-emerald-100'
                                                : 'bg-white border border-slate-100 rounded-bl-sm shadow-sm'
                                                }`}>
                                                {msg.messageType === 'TEXT' && (
                                                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                )}
                                                {msg.messageType === 'VOICE' && (
                                                    <audio src={msg.mediaUrl || msg.content} controls className="w-full max-w-[240px]" />
                                                )}
                                                {msg.messageType === 'VIDEO' && (
                                                    <video src={msg.mediaUrl || msg.content} controls className="w-full rounded-xl max-w-[260px]" />
                                                )}
                                                <p className={`text-[10px] mt-1 font-semibold ${msg.senderRole === 'TEACHER' ? 'text-emerald-200' : 'text-slate-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={teacherChatEndRef} />
                                </div>

                                {/* Chat Input */}
                                <div className="bg-white border-t border-slate-100 px-4 py-3 flex gap-2.5 items-end flex-shrink-0">
                                    <textarea
                                        value={teacherChatInput}
                                        onChange={e => setTeacherChatInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (teacherChatInput.trim() && !teacherChatSending) {
                                                    setTeacherChatSending(true);
                                                    sendChatMessage(teacherChatRequestId, teacherChatInput.trim(), 'TEXT').then(() => {
                                                        setTeacherChatInput('');
                                                        setTeacherChatSending(false);
                                                        setTimeout(() => teacherChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                    });
                                                }
                                            }
                                        }}
                                        placeholder="Reply to student..."
                                        rows={1}
                                        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 resize-none focus:ring-0 focus:border-emerald-300 focus:bg-white transition-all outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            if (teacherChatInput.trim() && !teacherChatSending) {
                                                setTeacherChatSending(true);
                                                sendChatMessage(teacherChatRequestId, teacherChatInput.trim(), 'TEXT').then(() => {
                                                    setTeacherChatInput('');
                                                    setTeacherChatSending(false);
                                                    setTimeout(() => teacherChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                                                });
                                            }
                                        }}
                                        disabled={!teacherChatInput.trim() || teacherChatSending}
                                        className={`p-3 rounded-2xl transition-all flex-shrink-0 ${teacherChatInput.trim() ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                            }`}
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};
