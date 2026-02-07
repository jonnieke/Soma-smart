import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Mic, FileText, Share2, StopCircle, Download, BookOpen, Crown, Brain, Sparkles, X, CheckCircle, Play, Pause, Trash2, ArrowRight, Library, Filter, Calendar, Home, LogOut, MonitorPlay, CreditCard } from 'lucide-react';
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

interface TeacherProps {
    onNavigate: (view: ViewState) => void;
}

import { useNavigate, useLocation } from 'react-router-dom';

export const TeacherDashboard: React.FC<TeacherProps> = ({ onNavigate }) => {
    const {
        teacherUsageCount, incrementTeacherUsage, teacherProfile,
        updateTeacherProfile, teacherHistory, saveTeacherActivity,
        deleteTeacherActivity,
        logout, isPromoActive, promoEndDate, isPro, upgradeAccount,
        isOnline
    } = useApp();
    const [showPaywall, setShowPaywall] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Check for subscription intent from Landing Page
    useEffect(() => {
        const state = location.state as { selectedPlan?: SubscriptionPlan; openSubscription?: boolean };

        if (state?.selectedPlan) {
            if (isPro) {
                // Already pro, just stay on dashboard and clear state
                navigate(location.pathname, { replace: true, state: {} });
            } else {
                setSelectedPlan(state.selectedPlan);
                // Clear state to avoid re-triggering on refresh
                navigate(location.pathname, { replace: true, state: {} });
            }
        } else if (state?.openSubscription) {
            setShowPaywall(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, isPro, navigate]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'HOME' | 'CONVERT' | 'VOICE' | 'QUIZ' | 'LIBRARY'>('HOME');
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedClass, setSelectedClass] = useState<string>(teacherProfile?.classes[0] || "");
    const [selectedSubject, setSelectedSubject] = useState<string>(teacherProfile?.subjects[0] || "");

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
        // If Promo or Pro is active, no limits!
        if (isPromoActive || isPro) return true;

        if (teacherUsageCount >= 5) {
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

    // Promo Timer Logic
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!isPromoActive || !promoEndDate) return;

        const updateTimer = () => {
            const now = new Date();
            const end = new Date(promoEndDate);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("Ending soon");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h left`);
            } else {
                setTimeLeft(`${hours}h left`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [isPromoActive, promoEndDate]);

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
            const result = await convertNotes(base64, file.type, selectedSubject, selectedClass);
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
                const result = await processVoiceNote(base64Data, blob.type, selectedSubject, selectedClass);
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
                advType
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

    if (!teacherProfile) {
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

            {/* Hero Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 px-8 pt-6 pb-20 rounded-b-[3rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

                <div className="relative z-10">
                    {/* Top Bar */}
                    <div className="flex justify-between items-start mb-6">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-indigo-500/30 backdrop-blur rounded-full flex items-center justify-center text-indigo-50 font-bold border border-indigo-400/30">
                                {teacherProfile.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-white font-bold">{teacherProfile.name}</h2>
                                {isPromoActive ? (
                                    <span className="text-emerald-300 text-xs flex items-center gap-1 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                                        <Crown className="w-3 h-3" /> Unlimited Access (Ends in {timeLeft})
                                    </span>
                                ) : (
                                    teacherUsageCount < 5 && (
                                        <span className="text-indigo-200 text-xs flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> {5 - teacherUsageCount} free uses left
                                        </span>
                                    )
                                )}
                            </div>
                        </motion.div>

                        <div className="flex gap-2">
                            <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors group text-xs font-bold text-white" title="Back to Home">
                                <Home className="w-5 h-5" /> Home
                            </button>
                            <button onClick={() => navigate('/pricing')} className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl backdrop-blur-md transition-colors group" title="Pricing Plans">
                                <CreditCard className="w-6 h-6 text-white" />
                            </button>
                            <button onClick={() => setShowLogoutModal(true)} className="p-2 bg-white/10 hover:bg-red-500/20 rounded-xl backdrop-blur-md transition-colors group" title="Logout">
                                <LogOut className="w-6 h-6 text-white group-hover:text-red-200" />
                            </button>
                        </div>
                    </div>

                    {/* Context Selectors */}
                    <div className="flex gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 flex border border-white/10">
                            {teacherProfile.classes.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedClass(c)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedClass === c ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-100 hover:bg-white/5'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 flex border border-white/10">
                            {teacherProfile.subjects.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSubject(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedSubject === s ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-100 hover:bg-white/5'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 -mt-12 relative z-20">

                {/* Navigation Tabs (Floating) */}
                {!loading && !generatedNote && !generatedQuiz && (
                    <div className="bg-white rounded-2xl shadow-sm p-2 mb-6 flex justify-between">
                        <button
                            onClick={() => setActiveTab('HOME')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'HOME' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Sparkles className="w-4 h-4" /> Studio
                        </button>
                        <button
                            onClick={() => setActiveTab('LIBRARY')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'LIBRARY' ? 'bg-purple-50 text-purple-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Library className="w-4 h-4" /> Library
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
                                {/* New Tool: Darasa Mode (Full Width) */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    onClick={() => navigate('/teacher/darasa')}
                                    className="md:col-span-2 bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-3xl shadow-lg border border-orange-400 flex flex-row items-center cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mr-6 shadow-inner border border-white/20 group-hover:scale-110 transition-transform">
                                        <MonitorPlay className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1 text-white relative z-10">
                                        <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                                            Darasa Mode <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">Live</span>
                                        </h3>
                                        <p className="text-orange-50 text-sm opacity-90">Launch interactive classroom presentation. Access history & saved lessons.</p>
                                    </div>
                                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                        <ArrowRight className="w-6 h-6 text-white" />
                                    </div>
                                </motion.div>

                                {/* Tool 1: Notes Converter */}
                                <motion.div
                                    whileHover={isOnline ? { y: -5 } : {}}
                                    className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group transition-all ${isOnline ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md' : 'opacity-60 grayscale cursor-not-allowed'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${isOnline ? 'bg-blue-50 group-hover:scale-110' : 'bg-slate-100'}`}>
                                        <FileText className={`w-8 h-8 ${isOnline ? 'text-blue-600' : 'text-slate-400'}`} />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">Textbook to Lesson</h3>
                                    <p className="text-sm text-slate-500 mb-6">
                                        {isOnline ? `Upload a photo. Get a structured lesson plan for ${selectedClass}.` : "Internet required for conversion."}
                                    </p>
                                    <Button
                                        fullWidth
                                        variant="outline"
                                        onClick={isOnline ? () => document.getElementById('file-upload')?.click() : undefined}
                                        disabled={!isOnline}
                                    >
                                        <Upload className="w-4 h-4 mr-2" /> {isOnline ? "Upload Photo" : "Disconnected"}
                                    </Button>
                                    <input type="file" id="file-upload" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                                </motion.div>

                                {/* Tool 2: Voice Notes */}
                                <motion.div
                                    whileHover={isOnline ? { y: -5 } : {}}
                                    className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group transition-all ${isOnline ? 'cursor-pointer hover:border-purple-200 hover:shadow-md' : 'opacity-60 grayscale cursor-not-allowed'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${isRecording ? 'bg-red-100 animate-pulse scale-110' : isOnline ? 'bg-purple-50 group-hover:scale-110' : 'bg-slate-100'}`}>
                                        <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500' : isOnline ? 'text-purple-600' : 'text-slate-400'}`} />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">{isRecording ? "Recording..." : "Voice Lesson"}</h3>
                                    <p className="text-sm text-slate-500 mb-6">
                                        {isOnline ? `Dictate your thoughts. We'll format them for ${selectedSubject}.` : "Internet required for recording."}
                                    </p>
                                    {isRecording ? (
                                        <Button fullWidth onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white border-transparent">
                                            <StopCircle className="w-4 h-4 mr-2" /> Stop & Process ({formatTime(recordingTime)})
                                        </Button>
                                    ) : (
                                        <Button fullWidth variant="outline" onClick={isOnline ? startRecording : undefined} disabled={!isOnline}>
                                            <Mic className="w-4 h-4 mr-2" /> {isOnline ? "Start Recording" : "Disconnected"}
                                        </Button>
                                    )}
                                </motion.div>

                                {/* Tool 3: Advanced Quiz Gen */}
                                <motion.div whileHover={{ y: -5 }} className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl shadow-sm border border-indigo-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <Crown className="w-32 h-32 text-indigo-900" />
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                                    <Brain className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-indigo-900">Exam Generator (CBE)</h3>
                                                    <p className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-0.5 rounded-full inline-block">Kenyan Standard</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 block">Quiz Topic</label>
                                                    <input
                                                        type="text"
                                                        value={advTopic}
                                                        onChange={(e) => setAdvTopic(e.target.value)}
                                                        placeholder={`e.g. ${selectedSubject} End Term Exam`}
                                                        className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                                    <div>
                                                        <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 block">Questions</label>
                                                        <select
                                                            value={advCount}
                                                            onChange={(e) => setAdvCount(Number(e.target.value))}
                                                            className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                        >
                                                            <option value={5}>5 Questions</option>
                                                            <option value={10}>10 Questions</option>
                                                            <option value={15}>15 Questions</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 block">Type</label>
                                                        <select
                                                            value={advType}
                                                            onChange={(e) => setAdvType(e.target.value as 'MCQ' | 'OPEN')}
                                                            className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                        >
                                                            <option value="MCQ">Multiple Choice</option>
                                                            <option value="OPEN">Structured / Open</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 border-t md:border-t-0 md:border-l border-indigo-100 md:pl-8 pt-6 md:pt-0">
                                            <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 block">Source Material (Scans)</label>

                                            <div className="border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 p-6 text-center hover:bg-indigo-50 transition-colors relative">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,application/pdf"
                                                    onChange={handleAdvFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-indigo-900">
                                                    {advFiles.length > 0 ? `${advFiles.length} files selected` : "Upload Textbooks/Notes"}
                                                </p>
                                                <p className="text-xs text-indigo-500 mt-1">
                                                    {advFiles.length > 0 ? "Click to change" : "Images or PDF (Books)"}
                                                </p>
                                            </div>

                                            <div className="mt-6">
                                                <Button
                                                    fullWidth
                                                    onClick={isOnline ? handleAdvancedQuizGen : undefined}
                                                    disabled={!isOnline || !advTopic || advFiles.length === 0}
                                                    className={`shadow-lg ${isOnline ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-400 grayscale'}`}
                                                >
                                                    <Sparkles className="w-4 h-4 mr-2" /> {isOnline ? "Generate Exam" : "Internet Required"}
                                                </Button>
                                                {!isOnline ? (
                                                    <p className="text-[10px] text-center text-slate-400 mt-2 font-bold uppercase tracking-wider">Connect to internet to use AI</p>
                                                ) : !advTopic && (
                                                    <p className="text-[10px] text-center text-indigo-400 mt-2">Enter a topic and upload files to start.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                        {
                            activeTab === 'LIBRARY' && (
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
                                    <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                                        <Filter className="w-5 h-5 mx-auto text-slate-400" />
                                        <h3 className="font-bold text-lg text-slate-700">Class Library</h3>
                                        <span className="ml-auto text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">{selectedClass}</span>
                                        <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">{selectedSubject}</span>
                                    </div>

                                    <div className="space-y-4">
                                        {teacherHistory.filter(item => (!selectedClass || item.className === selectedClass) && (!selectedSubject || item.subject === selectedSubject)).length === 0 ? (
                                            <div className="text-center py-20 text-slate-400">
                                                <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p>No items found for this class & subject.</p>
                                            </div>
                                        ) : (
                                            teacherHistory
                                                .filter(item => (!selectedClass || item.className === selectedClass) && (!selectedSubject || item.subject === selectedSubject))
                                                .map((item) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-all"
                                                        onClick={() => loadHistoryItem(item)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'NOTE' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                                {item.type === 'NOTE' ? <FileText className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-800">{item.title}</h4>
                                                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                                                    <Calendar className="w-3 h-3" /> {item.date}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm("Are you sure you want to delete this lesson?")) {
                                                                        deleteTeacherActivity(item.id);
                                                                    }
                                                                }}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Lesson"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                                                        </div>
                                                    </motion.div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            )
                        }
                    </>
                ) : (
                    // RESULTS VIEW
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <Button variant="ghost" onClick={() => { setGeneratedNote(null); setGeneratedQuiz(null); setActiveTab('HOME'); }} icon={<ArrowRight className="w-4 h-4 rotate-180" />}>
                                Back to Studio
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => window.print()} icon={<Download className="w-4 h-4" />}>Export PDF</Button>
                            </div>
                        </div>

                        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-slate-200 print:border-none print:shadow-none min-h-[500px]">

                            {generatedQuiz && (
                                <div className="space-y-8">
                                    <div className="text-center border-b border-gray-100 pb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{selectedClass}</span>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{selectedSubject}</span>
                                        </div>
                                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{generatedQuiz.topic}</h1>
                                        <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">Classroom Assessment</p>
                                    </div>
                                    <div className="space-y-8">
                                        {generatedQuiz.questions.map((q, i) => (
                                            <div key={i} className="break-inside-avoid">
                                                <p className="font-bold text-slate-800 text-lg mb-3 flex gap-2">
                                                    <span className="text-indigo-600">{i + 1}.</span> {q.question}
                                                </p>
                                                {q.type === 'MCQ' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                                        {q.options?.map((opt, idx) => (
                                                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                                                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                                                                <span className="text-slate-600 font-medium">{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {q.type === 'SHORT' && (
                                                    <div className="ml-8 mt-4 h-24 border rounded-xl bg-slate-50/50 border-slate-200 border-dashed w-full"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200 break-before-page">
                                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" /> Answer Key & Explanations
                                        </h3>
                                        <ul className="space-y-3 text-sm">
                                            {generatedQuiz.questions.map((q, i) => (
                                                <li key={i} className="grid grid-cols-[auto_1fr] gap-2">
                                                    <span className="font-bold text-slate-700">{i + 1}.</span>
                                                    <span className="text-slate-600"><span className="font-bold text-green-700">{q.correctAnswer}</span> - {q.explanation}</span>
                                                </li>
                                            ))}
                                        </ul>
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

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">A</span> Summary
                                            </h2>
                                            <div className="prose prose-sm prose-slate bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                                <MarkdownText content={generatedNote.simplifiedNotes} />
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs">B</span> Teacher Notes
                                            </h2>
                                            <div className="prose prose-sm prose-slate">
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
            {selectedPlan && (
                <PaymentFlow
                    plan={selectedPlan}
                    onSuccess={async () => {
                        await upgradeAccount(selectedPlan);
                        setSelectedPlan(null);
                    }}
                    onCancel={() => setSelectedPlan(null)}
                />
            )}
        </div>
    );
};
