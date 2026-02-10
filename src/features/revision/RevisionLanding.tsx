import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Upload, BookOpen, Brain, TrendingUp, ArrowRight, ScanLine, X, Camera, Zap, CheckCircle, Smartphone, LogOut, Filter, FileText, ChevronRight } from 'lucide-react';
import { ViewState, RevisionMode, TeacherActivity } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoutModal } from '../../components/LogoutModal';

interface Props {
    onStartSession: (data: File | TeacherActivity, mode: RevisionMode) => void;
    onNavigate: (view: ViewState) => void;
}

export const RevisionLanding: React.FC<Props> = ({ onStartSession, onNavigate }) => {
    const { logout, availableQuizzes, fetchAvailableQuizzes, isOnline } = useApp();
    const [dragActive, setDragActive] = useState(false);
    const [selectedMode, setSelectedMode] = useState<RevisionMode>(RevisionMode.LEARN);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Fetch quizzes on mount
    React.useEffect(() => {
        if (isOnline) {
            setLoadingQuizzes(true);
            fetchAvailableQuizzes().finally(() => setLoadingQuizzes(false));
        }
    }, [isOnline]);

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Fix: Cleanup camera on unmount
    React.useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onStartSession(e.dataTransfer.files[0], selectedMode);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onStartSession(e.target.files[0], selectedMode);
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            setShowCamera(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error("Camera Error:", err);
            alert("Could not access camera. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `scan-${Date.now()}.png`, { type: 'image/png' });
                        stopCamera();
                        onStartSession(file, selectedMode);
                    }
                }, 'image/png');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
            {/* Header - Modernized & Neat */}
            <div className="bg-white px-6 pt-12 pb-12 rounded-b-[3rem] shadow-sm relative overflow-hidden border-b border-indigo-50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 -ml-24 -mb-24"></div>

                <div className="relative z-10 max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2 font-bold text-xs bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <ArrowRight className="w-4 h-4 rotate-180" /> Back
                        </button>
                        <button onClick={() => setShowLogoutModal(true)} className="text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2 font-bold text-xs bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 ml-auto">
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>

                    <h1 className="text-4xl font-black mb-3 text-slate-900 tracking-tight leading-tight">
                        Candidate <span className="text-indigo-600">Specialist</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-sm leading-relaxed">
                        Your AI tutor for paper mastery. Get instant, step-by-step guidance.
                    </p>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-6 -mt-8 relative z-20 space-y-8">

                {/* Mode Selection Cards - Refined */}
                <div className="bg-white p-1.5 rounded-2xl shadow-lg shadow-slate-200/40 flex gap-2 overflow-x-auto no-scrollbar border border-slate-100">
                    {[
                        { mode: RevisionMode.LEARN, icon: BookOpen, label: 'Learn', color: 'indigo' },
                        { mode: RevisionMode.EXAM, icon: Brain, label: 'Exam', color: 'orange' },
                        { mode: RevisionMode.WEAK_AREAS, icon: TrendingUp, label: 'Weakness', color: 'rose' }
                    ].map((item) => (
                        <button
                            key={item.mode}
                            onClick={() => setSelectedMode(item.mode)}
                            className={`flex-1 min-w-[100px] py-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 ${selectedMode === item.mode
                                ? `bg-${item.color}-50 text-${item.color}-700 ring-1 ring-${item.color}-200`
                                : 'hover:bg-slate-50 text-slate-400 font-medium'}`}
                        >
                            <item.icon className={`w-5 h-5 ${selectedMode === item.mode ? 'fill-current' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Primary Action: CAMERA - Modernized */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4"
                >
                    <button
                        onClick={startCamera}
                        className="w-full bg-white border-2 border-indigo-100 hover:border-indigo-400 p-1 rounded-[2rem] shadow-sm hover:shadow-indigo-100 transition-all group"
                    >
                        <div className="bg-indigo-50/30 rounded-[1.7rem] p-6 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                                    <Camera className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-extrabold text-xl text-slate-900">Scan Past Paper</h3>
                                    <p className="text-slate-500 text-sm font-medium">Capture directly from paper</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </button>

                    {/* Secondary Action: UPLOAD - Refined */}
                    <div
                        className={`relative group cursor-pointer border-2 border-dashed rounded-[2rem] p-8 transition-all duration-300 ${dragActive
                            ? 'border-indigo-500 bg-indigo-50/50'
                            : 'border-slate-200 hover:border-indigo-300 bg-white'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleChange}
                            accept="image/*"
                        />
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">Upload History</h4>
                                <p className="text-xs text-slate-400 font-medium mt-1">Images, PDF, or Scans</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* TEST PAPERS LIBRARY */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-lg">Past Papers Library</h3>
                        <div className="flex gap-2">
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-full uppercase">Uploaded by Teachers</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {loadingQuizzes ? (
                            <div className="py-10 text-center bg-white rounded-3xl border border-slate-100">
                                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-xs text-slate-400">Fetching papers...</p>
                            </div>
                        ) : availableQuizzes.length === 0 ? (
                            <div className="py-10 text-center bg-white rounded-3xl border border-slate-100 italic text-slate-400 text-sm">
                                No test papers available yet.
                            </div>
                        ) : (
                            availableQuizzes.map((quiz) => (
                                <button
                                    key={quiz.id}
                                    onClick={() => onStartSession(quiz, selectedMode)}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors uppercase text-sm tracking-tight">{quiz.title}</h4>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{quiz.subject}</span>
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{quiz.className}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Features List */}
                <div className="space-y-4 pt-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest text-center">Why use Paper Specialist?</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
                            <Zap className="w-6 h-6 text-amber-500" />
                            <span className="text-xs font-bold text-slate-600">Instance Marking</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
                            <Smartphone className="w-6 h-6 text-blue-500" />
                            <span className="text-xs font-bold text-slate-600">Mobile Friendly</span>
                        </div>
                    </div>
                </div>

            </main>

            {/* CAMERA MODAL */}
            <AnimatePresence>
                {showCamera && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                    >
                        <div className="relative flex-1 bg-black">
                            {/* Video Feed */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Overlays */}
                            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
                                <button onClick={stopCamera} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60">
                                    <X className="w-6 h-6" />
                                </button>
                                <div className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                    Align document within frame
                                </div>
                            </div>

                            {/* Guidelines */}
                            <div className="absolute inset-8 border-2 border-white/30 rounded-3xl pointer-events-none">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="h-32 bg-black flex items-center justify-center gap-8 pb-8 pt-4">
                            <button
                                onClick={capturePhoto}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group"
                            >
                                <div className="w-16 h-16 bg-white rounded-full transition-transform group-active:scale-90" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
