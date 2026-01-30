import React from 'react';
import { Mic, Square, Pause, Play, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
    onCaptureComplete: (audioBlob: Blob) => void;
    onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onCaptureComplete, onCancel }) => {
    const {
        isRecording,
        isPaused,
        duration,
        error,
        startRecording,
        stopRecording,
        togglePause,
        cancelRecording,
        canvasRef
    } = useAudioRecorder(onCaptureComplete);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCancel = () => {
        cancelRecording();
        onCancel();
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
                {/* Canvas handled entirely by hook via ref */}
                <canvas ref={canvasRef} className="w-full h-full" />
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
                        <button onClick={handleCancel} className="p-4 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={startRecording}
                            className="w-16 h-16 bg-red-500 rounded-full shadow-lg shadow-red-200 flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <div className="absolute w-16 h-16 rounded-full border-4 border-red-500 opacity-20 animate-ping" />
                            <Mic className="w-8 h-8 text-white relative" />
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
