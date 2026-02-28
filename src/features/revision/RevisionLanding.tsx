import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Upload, BookOpen, Brain, TrendingUp, ArrowRight, ScanLine, X, Camera, Zap, CheckCircle, Smartphone, LogOut, Search, FileText, ChevronRight, ChevronDown, Shield, Users, Sparkles, Filter, GraduationCap, Unlock } from 'lucide-react';
import { ViewState, RevisionMode, TeacherActivity } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoutModal } from '../../components/LogoutModal';
import { ThemeToggle } from '../../components/ThemeToggle';

interface Props {
    onStartSession: (data: File | TeacherActivity, mode: RevisionMode) => void;
    onNavigate: (view: ViewState) => void;
}

type TabKey = 'papers' | 'notes' | 'syllabus' | 'community';

export const RevisionLanding: React.FC<Props> = ({ onStartSession, onNavigate }) => {
    const { logout, availableQuizzes, fetchAvailableQuizzes, isOnline, studentProfile, resources, fetchResources } = useApp();
    const [dragActive, setDragActive] = useState(false);
    const [selectedMode, setSelectedMode] = useState<RevisionMode>(RevisionMode.LEARN);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [activeSubject, setActiveSubject] = useState<string>('All');
    const [activeTab, setActiveTab] = useState<TabKey>('papers');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCount, setShowCount] = useState(6);

    // Fetch quizzes & resources on mount
    React.useEffect(() => {
        if (isOnline) {
            setLoadingQuizzes(true);
            Promise.all([
                fetchAvailableQuizzes(),
                fetchResources()
            ]).finally(() => setLoadingQuizzes(false));
        }
    }, [isOnline]);

    // Derive subjects from all data
    const subjects = useMemo(() => {
        const unique = new Set([
            ...availableQuizzes.map(q => q.subject).filter(Boolean),
            ...resources.map(r => r.subject).filter(Boolean)
        ]);
        unique.delete('All');
        return ['All', ...unique];
    }, [availableQuizzes, resources]);

    // Split resources into papers, syllabus, and notes
    const isPaper = (title?: string) => {
        const t = title?.toLowerCase() || '';
        return t.includes('paper') || t.includes('exam') || t.includes('test') || t.includes('mock') ||
            t.includes('kpsea') || t.includes('kcse') || t.includes('kjsea') || t.includes('kilea') || t.includes('kcpe');
    };
    const isSyllabus = (title?: string) => (title?.toLowerCase() || '').includes('syllabus');

    const papers = useMemo(() => resources.filter(r => isPaper(r.title)), [resources]);
    const syllabus = useMemo(() => resources.filter(r => isSyllabus(r.title) && !isPaper(r.title)), [resources]);
    const notes = useMemo(() => resources.filter(r => !isPaper(r.title) && !isSyllabus(r.title)), [resources]);

    // Filter by subject + search
    const filterItems = useCallback(<T extends { title?: string; subject?: string }>(items: T[]) => {
        return items.filter(item => {
            const matchesSubject = activeSubject === 'All' || item.subject === activeSubject;
            const matchesSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.subject?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSubject && matchesSearch;
        });
    }, [activeSubject, searchQuery]);

    const filteredPapers = useMemo(() => filterItems(papers), [filterItems, papers]);
    const filteredSyllabus = useMemo(() => filterItems(syllabus), [filterItems, syllabus]);
    const filteredNotes = useMemo(() => filterItems(notes), [filterItems, notes]);
    const filteredQuizzes = useMemo(() => filterItems(availableQuizzes), [filterItems, availableQuizzes]);

    // Reset show count when switching tabs/filters
    React.useEffect(() => { setShowCount(6); }, [activeTab, activeSubject, searchQuery]);

    // Current tab data
    const currentItems = activeTab === 'papers' ? filteredPapers : activeTab === 'syllabus' ? filteredSyllabus : activeTab === 'notes' ? filteredNotes : filteredQuizzes;
    const visibleItems = currentItems.slice(0, showCount);
    const hasMore = currentItems.length > showCount;

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera access is not supported in this browser or context (HTTPS may be required).");
            }
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

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
        { key: 'papers', label: 'Past Papers', icon: <FileText className="w-4 h-4" />, count: filteredPapers.length },
        { key: 'notes', label: 'Revision Notes', icon: <BookOpen className="w-4 h-4" />, count: filteredNotes.length },
        { key: 'syllabus', label: 'Syllabus', icon: <GraduationCap className="w-4 h-4" />, count: filteredSyllabus.length },
        { key: 'community', label: 'Community', icon: <Users className="w-4 h-4" />, count: filteredQuizzes.length },
    ];

    // Find latest uploads
    const latestUploads = useMemo(() => {
        if (!resources || resources.length === 0) return [];
        return [...resources].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 3);
    }, [resources]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Compact Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 transition-colors">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                            <div>
                                <h1 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Revision Hub</h1>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    {studentProfile?.grade || 'All Grades'} • {resources.length + availableQuizzes.length} resources
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold dark:bg-indigo-900/20 dark:text-indigo-300">
                                <Shield className="w-3 h-3" /> {studentProfile?.name?.split(' ')[0] || 'Candidate'}
                            </div>
                            <ThemeToggle />
                            <button onClick={() => setShowLogoutModal(true)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sliding Notification Belt for New Materials */}
                {latestUploads.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white overflow-hidden py-2.5 relative flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-indigo-600 to-transparent z-10"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-indigo-700 to-transparent z-10"></div>
                        <motion.div
                            animate={{ x: [0, -1000] }}
                            transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
                            className="flex whitespace-nowrap gap-12 text-xs md:text-sm font-bold items-center px-4"
                        >
                            {[...Array(3)].map((_, loopIdx) => (
                                <React.Fragment key={loopIdx}>
                                    {latestUploads.map((u, i) => (
                                        <button
                                            key={`${loopIdx}-${i}`}
                                            onClick={() => onStartSession(u, RevisionMode.LEARN)}
                                            className="flex items-center gap-2 hover:text-amber-300 transition-colors"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                            🆕 New Upload: {u.title} <span className="opacity-75">({u.subject})</span>
                                        </button>
                                    ))}
                                </React.Fragment>
                            ))}
                        </motion.div>
                    </div>
                )}
            </div>

            <main className="max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-24">

                {/* Mode + Upload Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Mode Selection */}
                    <div className="md:col-span-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-1.5 transition-colors">
                        {[
                            { mode: RevisionMode.LEARN, icon: BookOpen, label: 'Learn Mode', desc: 'Guided study', color: 'indigo' },
                            { mode: RevisionMode.EXAM, icon: Brain, label: 'Exam Mode', desc: 'Test yourself', color: 'orange' },
                            { mode: RevisionMode.WEAK_AREAS, icon: TrendingUp, label: 'Weakness', desc: 'Focus areas', color: 'rose' }
                        ].map((item) => (
                            <button
                                key={item.mode}
                                onClick={() => setSelectedMode(item.mode)}
                                className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-bold ${selectedMode === item.mode
                                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{item.label}</span>
                                <span className="sm:hidden text-xs">{item.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={startCamera}
                            className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl flex items-center justify-center gap-2 py-3 font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
                        >
                            <Camera className="w-4 h-4" /> Scan
                        </button>
                        <div
                            className={`flex-1 relative cursor-pointer border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 py-3 transition-all ${dragActive
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <input id="file-upload" type="file" className="hidden" onChange={handleChange} accept="image/*" />
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-500">Upload</span>
                        </div>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search papers, notes, subjects..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-300 dark:focus:border-indigo-700 outline-none transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            </button>
                        )}
                    </div>

                    {/* Subject Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {subjects.map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveSubject(s)}
                                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-xl transition-all ${activeSubject === s
                                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl mb-6 border border-slate-100 dark:border-slate-800 transition-colors">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === tab.key ? 'bg-white/20 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="mb-8">
                    {loadingQuizzes ? (
                        <div className="py-16 text-center">
                            <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Loading resources...</p>
                        </div>
                    ) : visibleItems.length === 0 ? (
                        <div className="py-16 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">No resources found</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {visibleItems.map((item: any, idx: number) => {
                                    const isOfficial = 'file_path' in item;
                                    return (
                                        <motion.button
                                            key={item.id || idx}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => onStartSession(item, selectedMode)}
                                            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all group relative overflow-hidden"
                                        >
                                            {isOfficial && activeTab !== 'syllabus' && (
                                                <div className="absolute top-0 right-0 bg-indigo-600 dark:bg-indigo-500 text-white text-[8px] font-black px-2.5 py-1 rounded-bl-xl flex items-center gap-1">
                                                    <CheckCircle className="w-2.5 h-2.5" /> VERIFIED
                                                </div>
                                            )}
                                            {activeTab === 'syllabus' && (
                                                <div className="absolute top-0 right-0 bg-emerald-600 dark:bg-emerald-500 text-white text-[8px] font-black px-2.5 py-1 rounded-bl-xl flex items-center gap-1">
                                                    <Unlock className="w-2.5 h-2.5" /> OPEN ACCESS
                                                </div>
                                            )}
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOfficial
                                                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
                                                    {activeTab === 'papers' ? <FileText className="w-5 h-5" /> :
                                                        activeTab === 'syllabus' ? <GraduationCap className="w-5 h-5" /> :
                                                            activeTab === 'notes' ? <BookOpen className="w-5 h-5" /> :
                                                                <Brain className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                                                        {item.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold">{item.subject}</span>
                                                        {item.grade && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 px-2 py-0.5 rounded-md">{item.grade || item.className}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider">
                                                    {isOfficial ? 'Somo Verified' : 'Community'}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Show More */}
                            {hasMore && (
                                <div className="text-center mt-6">
                                    <button
                                        onClick={() => setShowCount(prev => prev + 6)}
                                        className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm px-6 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all font-sans"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                        Show More ({currentItems.length - showCount} remaining)
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Logout Modal */}
            {showLogoutModal && (
                <LogoutModal
                    isOpen={showLogoutModal}
                    onConfirm={logout}
                    onClose={() => setShowLogoutModal(false)}
                />
            )}

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
                            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/50 to-transparent">
                                <button onClick={stopCamera} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60">
                                    <X className="w-6 h-6" />
                                </button>
                                <div className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                    Align document within frame
                                </div>
                            </div>
                            <div className="absolute inset-8 border-2 border-white/30 rounded-3xl pointer-events-none">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                            </div>
                        </div>
                        <div className="h-32 bg-black flex items-center justify-center gap-8 pb-8 pt-4">
                            <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group">
                                <div className="w-16 h-16 bg-white rounded-full transition-transform group-active:scale-90" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
