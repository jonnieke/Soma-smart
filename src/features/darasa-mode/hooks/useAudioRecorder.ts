import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioLevel: number; // 0-255 for simple UI feedback if needed
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    togglePause: () => void;
    cancelRecording: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement>; // Ref to attach to canvas
}

export const useAudioRecorder = (onCaptureComplete: (blob: Blob) => void): UseAudioRecorderReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null); // Keep track of actual mic stream

    // Web Audio API for Visualization
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    useEffect(() => {
        return () => stopCleanup();
    }, []);

    const stopCleanup = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (destinationRef.current) {
            destinationRef.current.disconnect();
            destinationRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.warn(e));
            audioContextRef.current = null;
        }

        // Stop the recorder if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (e) { }
        }

        // CRITICAL: Stop the actual microphone hardware stream
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
    };

    const visualize = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dynamic Sizing
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }

        const draw = () => {
            if (!analyserRef.current || !dataArrayRef.current) return;

            animationFrameRef.current = requestAnimationFrame(draw);
            // Get Time Domain Data for Waveform
            analyserRef.current.getByteTimeDomainData(dataArrayRef.current as any);

            // Calculate level for internal use if needed
            let sum = 0;
            for (let i = 0; i < dataArrayRef.current.length; i++) {
                sum += Math.abs(dataArrayRef.current[i] - 128);
            }
            setAudioLevel(sum / dataArrayRef.current.length);

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgb(99, 102, 241)'; // Indigo-500
            ctx.beginPath();

            const sliceWidth = canvas.width * 1.0 / dataArrayRef.current.length;
            let x = 0;

            for (let i = 0; i < dataArrayRef.current.length; i++) {
                const v = dataArrayRef.current[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };
        draw();
    }, []);

    const startRecording = async () => {
        try {
            setError(null);
            // 1. Get Mic Stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            micStreamRef.current = stream;

            // 2. Setup Audio Context
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            audioContextRef.current = new AudioContextClass();

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // 3. Create Nodes
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            destinationRef.current = audioContextRef.current.createMediaStreamDestination();

            analyserRef.current.fftSize = 2048;
            dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

            // 4. Routing: Mic -> Analyser -> Destination -> MediaRecorder
            // Note: We don't connect to ctx.destination speakers to avoid feedback loop
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(destinationRef.current);

            // Start Visualizer
            visualize();

            // 5. Setup Recorder using the PROCESSED stream from destination
            const processedStream = destinationRef.current.stream;

            mediaRecorderRef.current = new MediaRecorder(processedStream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                if (blob.size > 0) {
                    onCaptureComplete(blob);
                } else {
                    setError("Recording was empty.");
                }
                stopCleanup();
            };

            mediaRecorderRef.current.start(200);
            setIsRecording(true);
            setIsPaused(false);

            // Timer
            if (timerRef.current) clearInterval(timerRef.current);
            setDuration(0);
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

        } catch (err) {
            console.error("Mic Error:", err);
            setError("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        stopCleanup();
        setIsRecording(false);
        setDuration(0);
        setError(null);
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;
        if (isPaused) {
            mediaRecorderRef.current.resume();
            // Also suspend context or disconnect nodes? Usually not needed for simple pause
            if (!timerRef.current) timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        } else {
            mediaRecorderRef.current.pause();
            if (timerRef.current) clearInterval(timerRef.current);
        }
        setIsPaused(!isPaused);
    };

    return {
        isRecording,
        isPaused,
        duration,
        audioLevel,
        error,
        startRecording,
        stopRecording,
        togglePause,
        cancelRecording,
        canvasRef
    };
};
