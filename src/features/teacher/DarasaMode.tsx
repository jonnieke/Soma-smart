import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, StopCircle, Play, Pause, FileText, CheckCircle, Loader2, Sparkles, BookOpen, AlertCircle, Trash2, Save } from 'lucide-react';
import { TeacherNote, QuizData } from '../../types';
import { trackAnalyticsEvent } from '../../services/analyticsEventService';

interface DarasaModeProps {
    onSaveToLibrary: (type: 'NOTE' | 'QUIZ', title: string, content: any) => void;
    checkLimit: () => boolean;
    incrementUsage: () => void;
    selectedSubject: string;
    selectedClass: string;
    language: string;
    processAudioFile?: (blob: Blob, mimeType: string, subject: string, cls: string, lang: string) => Promise<{ note: TeacherNote, quiz: QuizData }>;
}

export const DarasaMode: React.FC<DarasaModeProps> = ({
    onSaveToLibrary, checkLimit, incrementUsage, selectedSubject, selectedClass, language, processAudioFile
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedNote, setGeneratedNote] = useState<TeacherNote | null>(null);
    const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<any>(null);

    useEffect(() => {
        if (isRecording && !isPaused) {
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [isRecording, isPaused]);

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

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        if (!checkLimit()) return;
        setError(null);
        setAudioBlob(null);
        setAudioUrl(null);
        setGeneratedNote(null);
        setGeneratedQuiz(null);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Microphone access is not supported. Please use HTTPS.");
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                stream.getTracks().forEach(track => track.stop());

                if (blob.size < 1000) {
                    setError("Recording too short or empty. Please try speaking longer.");
                    setIsRecording(false);
                    setIsPaused(false);
                    return;
                }

                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                setIsRecording(false);
                setIsPaused(false);
            };

            mediaRecorder.start();
            setRecordingTime(0);
            setIsRecording(true);
            setIsPaused(false);
        } catch (e: any) {
            console.error("Mic Error:", e);
            setError("Could not access microphone: " + e.message);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                setIsPaused(false);
            } else {
                mediaRecorderRef.current.pause();
                setIsPaused(true);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const discardRecording = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setGeneratedNote(null);
        setGeneratedQuiz(null);
        setError(null);
        setRecordingTime(0);
    };

    const handleProcessAudio = async () => {
        if (!audioBlob || !processAudioFile) return;
        if (!checkLimit()) return;

        setIsProcessing(true);
        setError(null);
        incrementUsage();

        try {
            const result = await processAudioFile(audioBlob, audioBlob.type, selectedSubject, selectedClass, language);
            setGeneratedNote(result.note);
            setGeneratedQuiz(result.quiz);
            void trackAnalyticsEvent({
                eventType: 'TEACHER_WORKFLOW',
                eventName: 'note_generated',
                role: 'TEACHER',
                metadata: {
                    source: 'darasa_mode',
                    subject: selectedSubject,
                    class_name: selectedClass,
                    topic: result.note?.topic || 'Voice lesson note',
                },
            });
        } catch (err: any) {
            console.error(err);
            setError("Failed to process the class recording. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-indigo-900/40 border border-white/10 mb-8 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-white">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/20 px-4 py-1.5 rounded-full text-indigo-100 text-xs font-black tracking-widest uppercase mb-6 shadow-inner">
                            <Sparkles className="w-4 h-4 text-indigo-300" />
                            Live Co-Pilot
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white drop-shadow-sm">Darasa Mode</h2>
                        <p className="text-indigo-100/90 text-lg leading-relaxed max-w-xl mx-auto md:mx-0 font-medium">
                            Hit record while you teach. Our Smart Engine will instantly transcribe your lesson into perfectly formatted KNEC-aligned notes, extracting a dynamic revision quiz directly from your speech.
                        </p>
                    </div>

                    {/* Recording Controls */}
                    <div className={`relative z-20 bg-white/5 backdrop-blur-xl border ${isRecording ? 'border-red-500/50 shadow-2xl shadow-red-500/20' : 'border-white/10'} p-8 rounded-[2.5rem] w-full md:w-auto min-w-[320px] flex flex-col items-center transition-all duration-500`}>
                        {!isRecording && !audioBlob && (
                            <button
                                onClick={startRecording}
                                className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-xl shadow-red-500/30 flex items-center justify-center transition-transform hover:scale-105 group relative"
                            >
                                <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 group-hover:animate-ping"></div>
                                <Mic className="w-12 h-12 text-white group-hover:scale-110 transition-transform relative z-10" />
                            </button>
                        )}

                        {isRecording && (
                            <div className="flex flex-col items-center gap-6 w-full py-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
                                    <div className="text-5xl font-black text-white tracking-widest font-mono relative z-10 drop-shadow-md">
                                        {formatTime(recordingTime)}
                                    </div>
                                </div>
                                
                                {/* Dynamic Audio Wave Fake Visual */}
                                <div className="flex items-center justify-center gap-1.5 h-12 w-full px-8">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
                                        <motion.div
                                            key={bar}
                                            animate={{ height: isPaused ? '20%' : ['20%', `${Math.random() * 80 + 20}%`, '20%'] }}
                                            transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
                                            className="w-1.5 bg-indigo-300 rounded-full"
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center justify-center gap-5 w-full mt-2">
                                    <button
                                        onClick={pauseRecording}
                                        className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors shadow-inner"
                                    >
                                        {isPaused ? <Play className="w-7 h-7 text-white" /> : <Pause className="w-7 h-7 text-white" />}
                                    </button>
                                    <button
                                        onClick={stopRecording}
                                        className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 text-indigo-900 shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
                                    >
                                        <StopCircle className="w-8 h-8" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-red-200 text-sm font-bold mt-2 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    {isPaused ? "Recording Paused" : "Listening to your class..."}
                                </div>
                            </div>
                        )}

                        {!isRecording && audioBlob && !isProcessing && !generatedNote && (
                            <div className="flex flex-col items-center gap-6 w-full py-2">
                                <div className="text-3xl font-black text-white font-mono drop-shadow-md">{formatTime(recordingTime)}</div>
                                
                                {audioUrl && (
                                    <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/10 w-full shadow-inner">
                                        <audio src={audioUrl} controls className="w-full h-10 filter invert contrast-150 grayscale" />
                                    </div>
                                )}
                                
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <button
                                        onClick={discardRecording}
                                        className="flex-1 py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Retake
                                    </button>
                                    <button
                                        onClick={handleProcessAudio}
                                        className="flex-[2] py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-sm transition-transform hover:scale-105 shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 border border-white/10"
                                    >
                                        Distill Lesson <Sparkles className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="flex flex-col items-center gap-6 py-6">
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
                                    <Sparkles className="w-6 h-6 text-indigo-300 animate-pulse" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-black text-lg mb-1">Processing Audio</p>
                                    <p className="text-indigo-200 text-sm font-medium animate-pulse">
                                        Synthesizing smart notes and quizzes...
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/30 text-white rounded-2xl flex items-center gap-3 w-full max-w-2xl mx-auto shadow-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="font-medium text-sm drop-shadow-md">{error}</p>
                </div>
            )}

            {/* Premium Document Results Display */}
            <AnimatePresence>
                {generatedNote && generatedQuiz && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-indigo-900/5 border border-white/50 dark:border-slate-800 mt-8"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-8 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest rounded-full mb-4 border border-emerald-200 dark:border-emerald-800/50">
                                    Smart Extraction Complete
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{generatedNote.topic}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Mapped to {selectedSubject} Syllabus Standards</p>
                            </div>
                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => onSaveToLibrary('NOTE', generatedNote.topic, generatedNote)}
                                    className="px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:-translate-y-0.5"
                                >
                                    <Save className="w-4 h-4" /> Save Note
                                </button>
                                <button
                                    onClick={() => onSaveToLibrary('QUIZ', generatedQuiz.topic, generatedQuiz)}
                                    className="px-5 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm border border-indigo-200 dark:border-indigo-800/50 hover:-translate-y-0.5"
                                >
                                    <BookOpen className="w-4 h-4" /> Save Quiz
                                </button>
                                <button
                                    onClick={discardRecording}
                                    className="px-5 py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
                                >
                                    Done
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Notes Display */}
                            <div className="lg:col-span-7 bg-white dark:bg-slate-950/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden h-fit">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-[100px] pointer-events-none"></div>
                                <h4 className="flex items-center gap-3 text-xl font-black text-indigo-900 dark:text-indigo-400 mb-6 pb-4 border-b border-indigo-100 dark:border-indigo-900/50 relative z-10">
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center border border-indigo-200 dark:border-indigo-800/50">
                                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    Structured Lesson Notes
                                </h4>
                                <div className="prose prose-slate dark:prose-invert max-w-none relative z-10
                                    prose-h3:text-slate-900 dark:prose-h3:text-white prose-h3:font-black prose-h3:text-xl
                                    prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-[15px]
                                    prose-ul:text-slate-600 dark:prose-ul:text-slate-400
                                    prose-strong:text-slate-900 dark:prose-strong:text-slate-200">
                                    {generatedNote.structuredNotes?.split('\n').map((line, idx) => {
                                        if (line.startsWith('###')) return <h3 key={idx} className="mt-6 mb-3">{line.replace('###', '')}</h3>;
                                        if (line.startsWith('**') && line.endsWith('**')) return <p key={idx} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
                                        if (line.trim() === '') return <div key={idx} className="h-2" />;
                                        return <p key={idx}>{line}</p>;
                                    })}
                                </div>
                            </div>

                            {/* Quiz Preview */}
                            <div className="lg:col-span-5 bg-white dark:bg-slate-950/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden h-fit">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-bl-[100px] pointer-events-none"></div>
                                <h4 className="flex items-center gap-3 text-xl font-black text-emerald-900 dark:text-emerald-400 mb-6 pb-4 border-b border-emerald-100 dark:border-emerald-900/50 relative z-10">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    Smart Revision Quiz
                                </h4>
                                <div className="space-y-5 relative z-10">
                                    {generatedQuiz.questions.slice(0, 4).map((q, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <p className="font-bold text-slate-900 dark:text-white text-sm mb-4 leading-relaxed"><span className="text-emerald-600 dark:text-emerald-400 mr-1">Q{idx + 1}.</span> {q.question}</p>
                                            <div className="space-y-2">
                                                {q.options && q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className={`p-3 rounded-xl text-xs font-semibold border ${opt === q.correctAnswer ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                                        {opt} {opt === q.correctAnswer && <CheckCircle className="inline-block w-4 h-4 ml-2 float-right text-emerald-500" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {generatedQuiz.questions.length > 4 && (
                                        <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                            <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">+ {generatedQuiz.questions.length - 4} more auto-generated</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
