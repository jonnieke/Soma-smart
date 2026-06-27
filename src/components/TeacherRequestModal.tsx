
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Video, Type, Send, DollarSign, Star, Clock, AlertCircle, Play, Square, Info } from 'lucide-react';
import { TutoringRequest } from '../types';

interface TeacherRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: TutoringRequest | null;
    onSubmit: (requestId: string, response: string, type: 'TEXT' | 'VOICE' | 'VIDEO', pricingType: 'FREE' | 'FIXED' | 'RATE_ME', price: number, attachments: File[]) => void;
}

export const TeacherRequestModal: React.FC<TeacherRequestModalProps> = ({ isOpen, onClose, request, onSubmit }) => {
    const [responseType, setResponseType] = useState<'TEXT' | 'VOICE' | 'VIDEO'>('TEXT');
    const [responseText, setResponseText] = useState("");
    const [pricingType, setPricingType] = useState<'FREE' | 'FIXED' | 'RATE_ME'>('RATE_ME');
    const [price, setPrice] = useState(20); // Default KES 20

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setResponseType('TEXT');
            setResponseText("");
            setPricingType('RATE_ME');
            setMediaBlob(null);
            setMediaUrl(null);
            stopMedia();
        }
    }, [isOpen]);

    const stopMedia = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Microphone access is not supported in this browser or context (HTTPS may be required).");
            }
            const constraints = responseType === 'VIDEO' ? { video: true, audio: true } : { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current && responseType === 'VIDEO') {
                videoRef.current.srcObject = stream;
            }

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: responseType === 'VIDEO' ? 'video/webm' : 'audio/webm' });
                setMediaBlob(blob);
                setMediaUrl(URL.createObjectURL(blob));
                stopMedia();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Timer
            const interval = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 60) { // 1 min limit
                        stopRecording();
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

            // Clean up interval on stop
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: responseType === 'VIDEO' ? 'video/webm' : 'audio/webm' });
                setMediaBlob(blob);
                setMediaUrl(URL.createObjectURL(blob));
                stopMedia();
                clearInterval(interval);
            };

        } catch (e) {
            console.error("Recording Error:", e);
            alert("Could not access camera/microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = () => {
        if (!request) return;

        // Basic validation
        if (responseType === 'TEXT' && !responseText.trim()) {
            alert("Please enter a response.");
            return;
        }
        if ((responseType === 'VOICE' || responseType === 'VIDEO') && !mediaBlob) {
            alert("Please record a response.");
            return;
        }

        // Convert Blob to File if needed, or pass as attachment
        // For this demo/mock, we might just pass a dummy URL or the blob URL
        // In real app, we upload to storage bucket here.

        let finalResponse = responseText;
        if (mediaUrl) finalResponse = mediaUrl; // For mock local display

        onSubmit(request.id, finalResponse, responseType, pricingType, pricingType === 'FIXED' ? price : 0, []);
    };

    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Respond to Request</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{request.grade || 'General'}</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{request.topic}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Student Query */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                {request.studentName ? request.studentName.charAt(0) : 'S'}
                            </div>
                            <span className="font-bold text-slate-700 text-sm">Student Question</span>
                            <span className="text-xs text-slate-400 ml-auto flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{request.description}</p>
                    </div>

                    {/* Response Type Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Response Format</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setResponseType('TEXT')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${responseType === 'TEXT' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-indigo-100 text-slate-500'}`}
                            >
                                <Type className="w-6 h-6" />
                                <span className="text-xs font-bold">Text Reply</span>
                            </button>
                            <button
                                onClick={() => setResponseType('VOICE')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${responseType === 'VOICE' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-indigo-100 text-slate-500'}`}
                            >
                                <Mic className="w-6 h-6" />
                                <span className="text-xs font-bold">Voice Note</span>
                            </button>
                            <button
                                onClick={() => setResponseType('VIDEO')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${responseType === 'VIDEO' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-indigo-100 text-slate-500'}`}
                            >
                                <Video className="w-6 h-6" />
                                <span className="text-xs font-bold">Video Explanation</span>
                            </button>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="min-h-[200px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden">
                        {responseType === 'TEXT' && (
                            <textarea
                                className="w-full h-full min-h-[200px] p-4 bg-transparent border-none focus:ring-0 resize-none text-slate-700"
                                placeholder="Type your explanation here..."
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                            />
                        )}

                        {(responseType === 'VOICE' || responseType === 'VIDEO') && (
                            <div className="flex flex-col items-center gap-4 w-full h-full p-4 justify-center">
                                {isRecording ? (
                                    <div className="flex flex-col items-center">
                                        {responseType === 'VIDEO' && (
                                            <video ref={videoRef} autoPlay muted className="w-64 h-48 bg-black rounded-lg mb-4 object-cover" />
                                        )}
                                        <div className="text-red-500 font-mono font-bold text-xl mb-2">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</div>
                                        <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 transition-colors">
                                            <Square className="w-6 h-6 fill-current" />
                                        </button>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">Recording... (Max 1 min)</p>
                                    </div>
                                ) : mediaUrl ? (
                                    <div className="flex flex-col items-center w-full">
                                        {responseType === 'VIDEO' ? (
                                            <video src={mediaUrl} controls className="w-full max-h-[200px] rounded-lg bg-black" />
                                        ) : (
                                            <audio src={mediaUrl} controls className="w-full max-w-md" />
                                        )}
                                        <button onClick={() => { setMediaUrl(null); setMediaBlob(null); }} className="mt-4 text-red-500 text-xs font-bold hover:underline">Retake Recording</button>
                                    </div>
                                ) : (
                                    <button onClick={startRecording} className="flex flex-col items-center gap-2 group">
                                        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                                            {responseType === 'VOICE' ? <Mic className="w-8 h-8" /> : <Video className="w-8 h-8" />}
                                        </div>
                                        <span className="font-bold text-slate-600">Click to Record</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pricing Options */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pricing</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setPricingType('RATE_ME')}
                                className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${pricingType === 'RATE_ME' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pricingType === 'RATE_ME' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Star className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${pricingType === 'RATE_ME' ? 'text-emerald-800' : 'text-slate-700'}`}>&quot;Just Helping&quot;</p>
                                    <p className={`text-xs ${pricingType === 'RATE_ME' ? 'text-emerald-600' : 'text-slate-400'}`}>Ask student to rate you (Boosts Profile)</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setPricingType('FIXED')}
                                className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${pricingType === 'FIXED' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pricingType === 'FIXED' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-bold text-sm ${pricingType === 'FIXED' ? 'text-indigo-800' : 'text-slate-700'}`}>Fixed Price</p>
                                    <p className={`text-xs ${pricingType === 'FIXED' ? 'text-indigo-600' : 'text-slate-400'}`}>Charge for detailed help</p>
                                </div>
                                {pricingType === 'FIXED' && (
                                    <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg px-2 py-1">
                                        <span className="text-xs font-bold text-slate-500">KES</span>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                                            className="w-12 text-sm font-bold text-indigo-700 outline-none"
                                        />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" /> Send Response
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
