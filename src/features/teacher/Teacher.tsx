import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Mic, FileText, Share2, StopCircle, Download, BookOpen, Crown, Brain, Sparkles, X, CheckCircle, Play, Pause, Trash2, ArrowRight, Library, Filter, Calendar, Home } from 'lucide-react';
import { Button, Card, Header, MarkdownText } from '../../components/Shared';
import { TeacherPaywall } from '../../components/TeacherPaywall';
import { TeacherOnboarding } from '../../components/TeacherOnboarding';
import { useApp } from '../../context/AppContext';
import { convertNotes, processVoiceNote, generateTeacherQuiz, fileToGenerativePart } from '../../services/geminiService';
import { ViewState, TeacherNote, QuizData, TeacherActivity } from '../../types';

interface TeacherProps {
    onNavigate: (view: ViewState) => void;
}

export const TeacherDashboard: React.FC<TeacherProps> = ({ onNavigate }) => {
    const { teacherUsageCount, incrementTeacherUsage, teacherProfile, updateTeacherProfile, teacherHistory, saveTeacherActivity } = useApp();
    const [showPaywall, setShowPaywall] = useState(false);
    const [activeTab, setActiveTab] = useState<'HOME' | 'CONVERT' | 'VOICE' | 'QUIZ' | 'LIBRARY'>('HOME');
    const [loading, setLoading] = useState(false);

    // Selection State
    const [selectedClass, setSelectedClass] = useState<string>(teacherProfile?.classes[0] || "");
    const [selectedSubject, setSelectedSubject] = useState<string>(teacherProfile?.subjects[0] || "");

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
            const result = await convertNotes(base64, file.type);
            setGeneratedNote(result);
            handleSaveToHistory('NOTE', result.topic, result);
            setActiveTab('CONVERT');
        } catch (e) {
            alert("Error converting file");
        } finally {
            setLoading(false);
        }
    };

    // ... (Recording handlers remain similar but need to save history)

    const startRecording = async () => {
        if (!checkLimit()) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
                await handleAudioProcessing(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (e) {
            alert("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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
                const result = await processVoiceNote(base64Data);
                setGeneratedNote(result);
                handleSaveToHistory('NOTE', result.topic, result);
                setActiveTab('VOICE');
                setLoading(false);
            };
        } catch (e) {
            alert("Error processing audio");
            setLoading(false);
        }
    };

    const handleQuizGen = async (topic: string) => {
        if (!topic) return;
        if (!checkLimit()) return;

        setLoading(true);
        incrementTeacherUsage();
        try {
            const result = await generateTeacherQuiz(topic);
            setGeneratedQuiz(result);
            handleSaveToHistory('QUIZ', result.topic, result);
            setActiveTab('QUIZ');
        } catch (e) {
            alert("Error generating quiz");
        } finally {
            setLoading(false);
        }
    };

    const loadHistoryItem = (item: TeacherActivity) => {
        if (item.type === 'NOTE') {
            setGeneratedNote(item.content);
            setActiveTab('CONVERT'); // Re-use convert view for notes
        } else {
            setGeneratedQuiz(item.content);
            setActiveTab('QUIZ');
        }
    };


    // --- Render ---

    if (!teacherProfile) {
        return <TeacherOnboarding onComplete={(p) => updateTeacherProfile(p)} onClose={() => onNavigate(ViewState.DASHBOARD)} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 relative">
            <TeacherPaywall isOpen={showPaywall} onClose={() => setShowPaywall(false)} />

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
                                {teacherUsageCount < 5 && (
                                    <span className="text-indigo-200 text-xs flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> {5 - teacherUsageCount} free uses left
                                    </span>
                                )}
                            </div>
                        </motion.div>

                        <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors group" title="Back to Home">
                            <Home className="w-6 h-6 text-white" />
                        </button>
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
                            <div className="grid md:grid-cols-2 gap-4 pb-24">
                                {/* Tool 1: Notes Converter */}
                                <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer group hover:border-indigo-200 hover:shadow-md transition-all">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileText className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">Textbook to Lesson</h3>
                                    <p className="text-sm text-slate-500 mb-6">Upload a photo. Get a structured lesson plan for {selectedClass}.</p>
                                    <Button fullWidth variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                                        <Upload className="w-4 h-4 mr-2" /> Upload Photo
                                    </Button>
                                    <input type="file" id="file-upload" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                                </motion.div>

                                {/* Tool 2: Voice Notes */}
                                <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer group hover:border-purple-200 hover:shadow-md transition-all">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${isRecording ? 'bg-red-100 animate-pulse scale-110' : 'bg-purple-50 group-hover:scale-110'}`}>
                                        <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500' : 'text-purple-600'}`} />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">{isRecording ? "Recording..." : "Voice Lesson"}</h3>
                                    <p className="text-sm text-slate-500 mb-6">Dictate your thoughts. We'll format them for {selectedSubject}.</p>
                                    {isRecording ? (
                                        <Button fullWidth onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white border-transparent">
                                            <StopCircle className="w-4 h-4 mr-2" /> Stop & Process ({formatTime(recordingTime)})
                                        </Button>
                                    ) : (
                                        <Button fullWidth variant="outline" onClick={startRecording}>
                                            <Mic className="w-4 h-4 mr-2" /> Start Recording
                                        </Button>
                                    )}
                                </motion.div>

                                {/* Tool 3: Quiz Gen */}
                                <motion.div whileHover={{ y: -5 }} className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl shadow-sm border border-indigo-100 flex flex-col md:flex-row items-center gap-6">
                                    <div className="text-center md:text-left flex-1">
                                        <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <Brain className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <h3 className="font-bold text-lg text-indigo-900">Instant Quiz Generator</h3>
                                        </div>
                                        <p className="text-sm text-indigo-700/80 mb-4">Create a {selectedSubject} quiz for {selectedClass}.</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id="quiz-topic"
                                                placeholder={`e.g. ${selectedSubject} Topic...`}
                                                className="flex-1 px-4 py-2 rounded-xl border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                onKeyDown={(e) => e.key === 'Enter' && handleQuizGen(e.currentTarget.value)}
                                            />
                                            <Button onClick={() => {
                                                const val = (document.getElementById('quiz-topic') as HTMLInputElement).value;
                                                handleQuizGen(val);
                                            }}>Generate</Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {activeTab === 'LIBRARY' && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                                    <Filter className="w-5 h-5 text-slate-400" />
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
                                                    onClick={() => loadHistoryItem(item)}
                                                    className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-all"
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
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                                                </motion.div>
                                            ))
                                    )}
                                </div>
                            </div>
                        )}
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
        </div>
    );
};
