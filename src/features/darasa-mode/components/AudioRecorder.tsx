import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
    onCaptureComplete: (audioBlob: Blob) => void;
    onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onCaptureComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        return () => {
            stopRecordingCleanup();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Visualizer
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            visualize();

            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                // In a real app, we might want to verify blob size > 0
            };

            mediaRecorderRef.current.start(200); // Collect chunks every 200ms
            setIsRecording(true);
            setError(null);
            startTimer();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please ensure permissions are granted.");
        }
    };

    const stopRecordingCleanup = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            stopRecordingCleanup();
            setIsRecording(false);
            setIsPaused(false);

            // Small delay to ensure last chunk is pushed
            setTimeout(() => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onCaptureComplete(blob);
            }, 100);
        }
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;

        if (isPaused) {
            mediaRecorderRef.current.resume();
            startTimer();
        } else {
            mediaRecorderRef.current.pause();
            if (timerRef.current) clearInterval(timerRef.current);
        }
        setIsPaused(!isPaused);
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const visualize = () => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            if (!analyserRef.current || !dataArrayRef.current) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);

            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / dataArrayRef.current.length) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArrayRef.current.length; i++) {
                barHeight = dataArrayRef.current[i] / 2;

                // Gradient color based on height/loudness
                ctx.fillStyle = `rgb(${barHeight + 100}, 99, 235)`; // Indigo-ish
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 max-w-xl w-full mx-auto animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Recording Lesson</h2>
                <p className="text-slate-500">Speak clearly. We'll capture the key points.</p>
            </div>

            {/* Visualizer Area */}
            <div className="h-32 bg-slate-50 rounded-lg mb-8 overflow-hidden relative flex items-center justify-center border border-slate-200">
                {!isRecording && !isPaused && duration === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 gap-2">
                        <Mic className="w-5 h-5" /> Ready to Record
                    </div>
                )}
                <canvas ref={canvasRef} width="500" height="128" className="w-full h-full" />
            </div>

            {/* Timer Display */}
            <div className="text-center mb-8">
                <span className={`text-4xl font-mono font-bold ${isRecording ? 'text-indigo-600' : 'text-slate-300'}`}>
                    {formatTime(duration)}
                </span>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
                {!isRecording ? (
                    <>
                        <button onClick={onCancel} className="p-4 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={startRecording}
                            className="w-16 h-16 bg-red-500 rounded-full shadow-lg shadow-red-200 flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <div className="w-6 h-6 bg-white rounded-sm" /> {/* Square inside representing 'Record' button usually has a circle/dot but square stop is standard for when recording... w/e let's use circle for record start */}
                            <div className="absolute w-16 h-16 rounded-full border-4 border-red-500 opacity-20 animate-ping" />
                            <Mic className="w-8 h-8 text-white absolute" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={togglePause}
                            className="p-4 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title={isPaused ? "Resume" : "Pause"}
                        >
                            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                        </button>

                        <button
                            onClick={stopRecording}
                            className="w-16 h-16 bg-slate-800 rounded-full shadow-lg shadow-slate-300 flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <Square className="w-6 h-6 text-white fill-white" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
