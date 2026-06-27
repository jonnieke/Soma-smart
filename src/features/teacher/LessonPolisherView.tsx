import React from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    ArrowLeft,
    FileText,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    Brain,
    Bot,
    Copy,
    Mic,
    Square,
    Play,
    Pause,
    Trash2,
    Loader2
} from 'lucide-react';
import { Button } from '../../components/Shared';
import { polishLessonPlan, transcribeTeacherLesson } from '../../services/geminiService';

interface LessonPolisherViewProps {
    onBack: () => void;
    subject: string;
    grade: string;
}

export const LessonPolisherView: React.FC<LessonPolisherViewProps> = ({ onBack, subject, grade }) => {
    const [lessonPlan, setLessonPlan] = React.useState('');
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [analysisResult, setAnalysisResult] = React.useState<any | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    // Speech recording state
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);
    const [recordingState, setRecordingState] = React.useState<'idle' | 'recording' | 'paused' | 'transcribing'>('idle');
    const [recordingTime, setRecordingTime] = React.useState(0);
    const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
    const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);

    React.useEffect(() => {
        let interval: any = null;
        if (recordingState === 'recording') {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [recordingState]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                } else {
                    reject(new Error("Failed to convert blob to base64"));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/mp4' };
            }
            
            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;
            
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };
            
            recorder.onstop = async () => {
                const finalBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
                setAudioBlob(finalBlob);
                
                const url = URL.createObjectURL(finalBlob);
                setAudioUrl(url);
                
                // Stop all tracks on the stream to release microphone
                stream.getTracks().forEach(track => track.stop());
                
                // Process transcription
                setRecordingState('transcribing');
                try {
                    const base64 = await blobToBase64(finalBlob);
                    const transcript = await transcribeTeacherLesson(base64, options.mimeType, subject, grade);
                    if (transcript) {
                        setLessonPlan(prev => prev ? `${prev}\n\n${transcript}` : transcript);
                    }
                } catch (err) {
                    console.error("Transcription error:", err);
                    setError("Failed to transcribe audio. You can still play your audio or type notes manually.");
                } finally {
                    setRecordingState('idle');
                }
            };
            
            recorder.start(1000);
            setRecordingState('recording');
            setRecordingTime(0);
            setError(null);
        } catch (err: any) {
            console.error("Error accessing microphone:", err);
            setError("Could not access your microphone. Please check system permissions.");
            setRecordingState('idle');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.pause();
            setRecordingState('paused');
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'paused') {
            mediaRecorderRef.current.resume();
            setRecordingState('recording');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
            mediaRecorderRef.current.stop();
        }
    };

    const discardRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = () => {
                if (mediaRecorderRef.current?.stream) {
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                }
            };
            mediaRecorderRef.current.stop();
        }
        setRecordingState('idle');
        setRecordingTime(0);
        setAudioBlob(null);
        setAudioUrl(null);
    };

    const handleAnalyze = async () => {
        if (!lessonPlan.trim()) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            // Context: in a real app, these would come from the class analytics
            const contextWeakPoints = ["Multiplication of decimals", "Word Problems"];
            const result = await polishLessonPlan(lessonPlan, subject, grade, contextWeakPoints);
            setAnalysisResult(result);
        } catch (err) {
            console.error(err);
            setError("Failed to polish lesson plan. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-amber-600 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Lesson Maker
            </button>

            {!analysisResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="bg-white rounded-[2.5rem] p-10 border-2 border-amber-50 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lesson Plan Polisher</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Grounding Smart Engine in student data</p>
                            </div>
                        </div>

                        <p className="text-slate-500 font-medium mb-6 text-sm leading-relaxed italic">
                            &quot;Paste your existing lesson plan or draft notes below. We&apos;ll cross-reference it with your student&apos;s recorded weak points and suggest data-driven refinements.&quot;
                        </p>

                        {/* Option D: Voice-to-Text Lesson Notes Section */}
                        <div className="mb-6 bg-slate-50/85 rounded-[1.5rem] p-5 border border-slate-100 space-y-4 shadow-inner">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Mic className="w-4 h-4 text-amber-500" /> Speak Lesson Notes
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                        Record your dictation. Swahili subjects generate Swahili notes, others English.
                                    </p>
                                </div>

                                {recordingState === 'idle' && (
                                    <Button
                                        onClick={startRecording}
                                        type="button"
                                        className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 justify-center"
                                    >
                                        <Mic className="w-3.5 h-3.5" /> Start Recording
                                    </Button>
                                )}
                            </div>

                            {recordingState !== 'idle' && (
                                <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-850">
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            className="w-3 h-3 bg-rose-500 rounded-full shrink-0"
                                            animate={{ opacity: recordingState === 'recording' ? [0.4, 1, 0.4] : 1 }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                        
                                        <div className="font-mono text-sm font-bold">
                                            {recordingState === 'recording' ? 'Recording' : recordingState === 'paused' ? 'Paused' : 'Transcribing...'} ({formatTime(recordingTime)})
                                        </div>

                                        {recordingState === 'recording' && (
                                            <div className="flex items-center gap-0.5 h-6 px-2 shrink-0">
                                                <motion.div className="w-1 h-3 bg-rose-500 rounded-full" animate={{ scaleY: [1, 2, 0.7, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} style={{ originY: 0.5 }} />
                                                <motion.div className="w-1 h-3 bg-rose-500 rounded-full" animate={{ scaleY: [1, 1.5, 2.2, 0.8, 1] }} transition={{ duration: 1.1, repeat: Infinity, delay: 0.2 }} style={{ originY: 0.5 }} />
                                                <motion.div className="w-1 h-3 bg-rose-500 rounded-full" animate={{ scaleY: [1, 0.6, 1.8, 2.5, 1] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.4 }} style={{ originY: 0.5 }} />
                                                <motion.div className="w-1 h-3 bg-rose-500 rounded-full" animate={{ scaleY: [1, 2, 0.5, 1.2, 1] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.1 }} style={{ originY: 0.5 }} />
                                                <motion.div className="w-1 h-3 bg-rose-500 rounded-full" animate={{ scaleY: [1, 1.3, 2, 0.7, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} style={{ originY: 0.5 }} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        {recordingState === 'recording' && (
                                            <button
                                                onClick={pauseRecording}
                                                type="button"
                                                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                                title="Pause"
                                            >
                                                <Pause className="w-4 h-4" />
                                            </button>
                                        )}
                                        {recordingState === 'paused' && (
                                            <button
                                                onClick={resumeRecording}
                                                type="button"
                                                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                                title="Resume"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                        )}
                                        {(recordingState === 'recording' || recordingState === 'paused') && (
                                            <>
                                                <button
                                                    onClick={stopRecording}
                                                    type="button"
                                                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                                    title="Stop & Transcribe"
                                                >
                                                    <Square className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={discardRecording}
                                                    type="button"
                                                    className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                                                    title="Discard"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {recordingState === 'transcribing' && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                                                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                                Transcribing Swahili/English notes...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {audioUrl && recordingState === 'idle' && (
                                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                                            REC
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Recorded Audio Review</span>
                                            <p className="text-[9px] text-slate-400 font-medium">Verify your audio before polishing.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <audio src={audioUrl} controls className="h-7 w-48 sm:w-64" />
                                        <button
                                            onClick={() => { setAudioUrl(null); setAudioBlob(null); }}
                                            type="button"
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                            title="Clear"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <textarea
                            value={lessonPlan}
                            onChange={(e) => setLessonPlan(e.target.value)}
                            placeholder="e.g. Topic: Multiplication of Fractions. Introduction: Explain what a fraction is. Main activity: Do sums on the board..."
                            className="w-full h-64 p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-amber-500 transition-all font-medium text-slate-700 placeholder:text-slate-300 resize-none"
                        />

                        {error && (
                            <div className="mb-4 text-rose-500 text-sm font-bold">{error}</div>
                        )}

                        <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !lessonPlan.trim()}
                            className="mt-8 w-full py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-amber-200"
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <Sparkles className="w-4 h-4 animate-pulse" /> Cross-Referencing Knowledge Gaps...
                                </span>
                            ) : "Analyze & Polish Plan"}
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                            <Bot className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                            <h3 className="text-xl font-black mb-4 relative z-10 flex items-center gap-2">
                                <Brain className="w-6 h-6 text-amber-400" />
                                Why Polish?
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">1</div>
                                    <p className="text-slate-300 text-sm font-medium">We scan your recent Darasa Mode recordings for student questions.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">2</div>
                                    <p className="text-slate-300 text-sm font-medium">We analyze last week&apos;s quiz results to find &quot;Struggling Topics&quot;.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">3</div>
                                    <p className="text-slate-300 text-sm font-medium">We inject remedial &quot;Mastery Moments&quot; directly into your plan.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-xl shadow-emerald-100">
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest text-emerald-100 italic">Faculty Insight</p>
                                <h4 className="font-black text-lg">94.2% Adoption</h4>
                                <p className="text-emerald-100/80 text-sm font-medium">Teachers using Polisher see a 15% rise in student outcomes.</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-emerald-50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex flex-col items-center justify-center border-2 border-emerald-100 shadow-inner">
                                    <span className="text-2xl font-black text-emerald-600 leading-none">{analysisResult.score}%</span>
                                    <span className="text-[8px] font-black uppercase text-emerald-400 mt-1">Quality</span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 mb-8">Smart Refinement Report</h3>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 italic">
                                        <AlertTriangle className="w-4 h-4" /> Critical Remedial Matches
                                    </h4>
                                    <div className="space-y-4">
                                        {analysisResult.weaknessMatch.map((match: any, i: number) => (
                                            <div key={i} className="p-6 bg-red-50/50 rounded-3xl border border-red-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-black text-slate-800 text-sm">{match.topic}</span>
                                                    <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{match.impact} Priority</span>
                                                </div>
                                                <p className="text-slate-600 text-sm font-medium leading-relaxed italic">&quot;{match.recommendation}&quot;</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 italic">Core Plan Strengths</h4>
                                    <ul className="space-y-3">
                                        {analysisResult.strengths.map((strength: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm font-medium text-slate-600">{strength}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <Button 
                                onClick={() => {
                                    navigator.clipboard.writeText(analysisResult.polishedContent);
                                    alert("Lesson plan copied to clipboard!");
                                }}
                                className="mt-12 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" /> Copy KICD 5-E Lesson Plan
                            </Button>

                            {/* Render Polished Content */}
                            {analysisResult.polishedContent && (
                                <div className="mt-12 pt-12 border-t-2 border-slate-100">
                                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <Sparkles className="w-6 h-6 text-emerald-500" />
                                        Fully Polished Lesson Plan
                                    </h3>
                                    <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100 prose prose-slate prose-sm max-w-none">
                                        {analysisResult.polishedContent.split('\n').map((line: string, i: number) => {
                                            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black mb-4">{line.replace('# ', '')}</h1>;
                                            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.replace('## ', '')}</h2>;
                                            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>;
                                            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) return <li key={i} className="ml-4 mb-1">{line.replace(/^[-*]\s/, '')}</li>;
                                            return <p key={i} className="mb-3" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl">
                            <h4 className="font-black text-lg mb-4">Recommended Resources</h4>
                            <div className="space-y-4">
                                {analysisResult.suggestedResources.map((res: string, i: number) => (
                                    <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 group cursor-pointer hover:bg-white/20 transition-all">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-bold truncate">{res}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100 shadow-sm flex flex-col items-center text-center">
                            <Bot className="w-16 h-16 text-slate-300 mb-4" />
                            <h4 className="font-black text-slate-800 mb-2">Need a full revision kit?</h4>
                            <p className="text-slate-400 text-xs font-medium mb-6">We can create a targeted kit based on these gaps.</p>
                            <Button fullWidth variant="outline" className="text-[10px] font-black uppercase">Create Kit (Pro)</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

