import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, StopCircle, Play, Pause, FileText, CheckCircle, Loader2, Sparkles, BookOpen, AlertCircle, Trash2, Save, Download } from 'lucide-react';
import { TeacherNote, QuizData } from '../../types';

interface DarasaModeProps {
    onSaveToLibrary: (type: 'NOTE' | 'QUIZ', title: string, content: any) => void;
    checkLimit: () => boolean;
    incrementUsage: () => void;
    selectedSubject: string;
    selectedClass: string;
    language: string;
    // We will inject the processing function here later
    processAudioFile?: (blob: Blob, mimeType: string, subject: string, cls: string, lang: string) => Promise<{ note: TeacherNote, quiz: QuizData }>;
}

export const DarasaMode: React.FC<DarasaModeProps> = ({
    onSaveToLibrary, checkLimit, incrementUsage, selectedSubject, selectedClass, language, processAudioFile
}) => {
    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedNote, setGeneratedNote] = useState<TeacherNote | null>(null);
    const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<any>(null);

    // Timer Logic
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

    // Cleanup mic when unmounted
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
                stream.getTracks().forEach(track => track.stop()); // release mic

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
        } catch (err: any) {
            console.error(err);
            setError("Failed to process the class recording. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-[2rem] p-8 shadow-2xl border border-indigo-700/50 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-12 -mb-12"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-indigo-100 text-xs font-black tracking-widest uppercase mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                            Darasa Mode
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">Live Class Co-Pilot</h2>
                        <p className="text-indigo-200 text-sm md:text-base leading-relaxed">
                            Hit record while you teach. Soma AI will transcribe the lesson instantly into perfectly formatted CBSE-aligned notes and generate a 10-question revision quiz for your students.
                        </p>
                    </div>

                    {/* Recording Controls */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl w-full md:w-auto min-w-[300px] flex flex-col items-center">
                        {!isRecording && !audioBlob && (
                            <button
                                onClick={startRecording}
                                className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 flex items-center justify-center transition-transform hover:scale-105 group"
                            >
                                <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                            </button>
                        )}

                        {isRecording && (
                            <div className="flex flex-col items-center gap-4 w-full">
                                <div className="text-4xl font-black text-white tracking-widest font-mono">
                                    {formatTime(recordingTime)}
                                </div>
                                <div className="flex items-center justify-center gap-6 w-full">
                                    <button
                                        onClick={pauseRecording}
                                        className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                    >
                                        {isPaused ? <Play className="w-6 h-6 text-white" /> : <Pause className="w-6 h-6 text-white" />}
                                    </button>
                                    <button
                                        onClick={stopRecording}
                                        className="w-16 h-16 rounded-full bg-white text-indigo-900 shadow-lg shadow-white/20 flex items-center justify-center hover:scale-105 transition-transform"
                                    >
                                        <StopCircle className="w-8 h-8" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mt-2 animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    {isPaused ? "Paused" : "Recording class..."}
                                </div>
                            </div>
                        )}

                        {!isRecording && audioBlob && !isProcessing && !generatedNote && (
                            <div className="flex flex-col items-center gap-4 w-full">
                                <div className="text-2xl font-black text-white font-mono">{formatTime(recordingTime)}</div>
                                {audioUrl && (
                                    <audio src={audioUrl} controls className="w-full max-w-[250px] mt-2 mb-4 h-10" />
                                )}
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={discardRecording}
                                        className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Retake
                                    </button>
                                    <button
                                        onClick={handleProcessAudio}
                                        className="flex-1 py-3 px-4 rounded-xl bg-white text-indigo-900 font-black text-sm transition-transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                                    >
                                        Process <Sparkles className="w-4 h-4 text-indigo-500" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                                <p className="text-indigo-100 font-medium animate-pulse text-center">
                                    Transcribing & crafting lesson notes...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 w-full max-w-2xl mx-auto">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium text-sm">{error}</p>
                </div>
            )}

            {/* Results Display */}
            <AnimatePresence>
                {generatedNote && generatedQuiz && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mt-8"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">{generatedNote.topic}</h3>
                                <p className="text-slate-500 font-medium">Auto-generated from your {selectedSubject} recording.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => onSaveToLibrary('NOTE', generatedNote.topic, generatedNote)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                                >
                                    <Save className="w-4 h-4" /> Save Note
                                </button>
                                <button
                                    onClick={() => onSaveToLibrary('QUIZ', generatedQuiz.topic, generatedQuiz)}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                                >
                                    <BookOpen className="w-4 h-4" /> Save Quiz
                                </button>
                                <button
                                    onClick={discardRecording}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Notes Display */}
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <h4 className="flex items-center gap-2 text-lg font-bold text-indigo-900 mb-4 pb-2 border-b border-indigo-100">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    Structured Lesson Notes
                                </h4>
                                <div className="prose prose-sm md:prose-base prose-slate max-w-none 
                                    prose-h3:text-indigo-900 prose-h3:font-black
                                    prose-p:text-slate-600 prose-p:leading-relaxed
                                    prose-ul:text-slate-600
                                    prose-strong:text-slate-800">
                                    {generatedNote.structuredNotes?.split('\n').map((line, idx) => {
                                        if (line.startsWith('###')) return <h3 key={idx} className="text-lg font-black mt-4 mb-2">{line.replace('###', '')}</h3>;
                                        if (line.startsWith('**') && line.endsWith('**')) return <p key={idx} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>;
                                        if (line.trim() === '') return <br key={idx} />;
                                        return <p key={idx}>{line}</p>;
                                    })}
                                </div>
                            </div>

                            {/* Quiz Preview */}
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 h-fit">
                                <h4 className="flex items-center gap-2 text-lg font-bold text-emerald-900 mb-6 pb-2 border-b border-emerald-100">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    Auto-Generated Revision Quiz
                                </h4>
                                <div className="space-y-4">
                                    {generatedQuiz.questions.slice(0, 3).map((q, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200">
                                            <p className="font-bold text-slate-800 text-sm mb-3">Q{idx + 1}: {q.question}</p>
                                            <div className="space-y-2">
                                                {q.options && q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className={`p-2 rounded-lg text-xs font-medium border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                        {opt} {opt === q.correctAnswer && <CheckCircle className="inline-block w-3 h-3 ml-1" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {generatedQuiz.questions.length > 3 && (
                                        <div className="text-center text-sm font-bold text-slate-400 mt-4">
                                            + {generatedQuiz.questions.length - 3} more questions generated
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
