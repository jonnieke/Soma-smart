import React, { useState, useRef, useEffect } from 'react';
import { Camera, BookOpen, Clock, FileText, Play, Pause, RotateCcw, CheckCircle, XCircle, Mic, StopCircle, Loader2, ArrowRight, UserCircle, RefreshCw, Image as ImageIcon, Sparkles, AlertTriangle, Volume2, Download, X, Upload, FileAudio, MessageSquare, ScanLine, Trash2 } from 'lucide-react';
import { Button, Card, Header, MarkdownText } from '../../components/Shared';
import { explainImage, explainAudio, explainTopic, generateQuiz, generateQuickQuiz, generateSpeech, fileToGenerativePart } from '../../services/geminiService';
import { ExplanationResult, QuizData, ViewState, LearnerActivity, LearnerProfile } from '../../types';

interface LearnerProps {
  onNavigate: (view: ViewState) => void;
  saveActivity: (type: 'EXPLANATION' | 'QUIZ', topic: string, details: any) => void;
  deleteActivity: (id: string) => void;
  history: LearnerActivity[];
  studentCode: string; // Keep for backward compatibility/display
  profile?: LearnerProfile;
}

export const LearnerDashboard: React.FC<LearnerProps> = ({ onNavigate, saveActivity, deleteActivity, history, studentCode, profile }) => {
  const [mode, setMode] = useState<'MENU' | 'SCAN' | 'RESULT' | 'QUIZ'>('MENU');
  const [level, setLevel] = useState<'Simple' | 'Exam'>('Simple');
  
  // Image data state (renamed from image for clarity and type safety)
  const [imageData, setImageData] = useState<{ base64: string, mimeType: string } | null>(null);
  
  // Store audio data for regeneration
  const [audioData, setAudioData] = useState<{ base64: string, mimeType: string } | null>(null);

  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing..."); // Added for dynamic loading text
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [error, setError] = useState<{title: string, message: string} | null>(null);
  
  // Sticky Quiz State
  const [stickyQuizTaken, setStickyQuizTaken] = useState(false); // Track if sticky quiz is taken
  const [stickyQuizData, setStickyQuizData] = useState<QuizData | null>(null); // Store prefetched quiz

  // Quality Check State
  const [qualityWarning, setQualityWarning] = useState<{show: boolean, issues: string[], file: File | null}>({ show: false, issues: [], file: null });
  
  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanStatus, setScanStatus] = useState<'LOOKING' | 'STABILIZING' | 'CAPTURING'>('LOOKING');

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        setShowCamera(false);
        
        // Process the captured image
        checkImageQuality(file).then(issues => {
            if (issues.length > 0) {
                setQualityWarning({ show: true, issues, file });
            } else {
                processFile(file);
            }
        });
    }, 'image/jpeg', 0.9);
  };

  // Camera effect with Auto-Capture
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let analysisInterval: any = null;
    let stabilityFrames = 0;
    let lastPixelData: Uint8ClampedArray | null = null;

    if (showCamera) {
      setScanStatus('LOOKING');
      
      const startStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1920 } } 
          });
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play();
                
                // Start analysis loop
                analysisInterval = setInterval(() => {
                    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (!ctx) return;

                    // Analyze a smaller frame for performance
                    const w = 320;
                    const h = 240;
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(videoRef.current, 0, 0, w, h);
                    
                    const imageData = ctx.getImageData(0, 0, w, h);
                    const data = imageData.data;
                    
                    let motion = 0;
                    
                    // Simple motion detection (difference from last frame)
                    if (lastPixelData) {
                        for(let i=0; i<data.length; i+=32) { // sample every 8th pixel
                             motion += Math.abs(data[i] - lastPixelData[i]);
                        }
                        motion = motion / (data.length / 32);
                    }
                    lastPixelData = data;
                    
                    // Thresholds
                    // Motion < 5: Relative stable
                    if (motion < 5 && lastPixelData) { 
                         stabilityFrames++;
                         setScanStatus('STABILIZING');
                    } else {
                         stabilityFrames = 0;
                         setScanStatus('LOOKING');
                    }
                    
                    // Trigger capture after ~1.2 seconds of stability (6 frames * 200ms)
                    if (stabilityFrames > 6) {
                        setScanStatus('CAPTURING');
                        clearInterval(analysisInterval);
                        capturePhoto();
                    }

                }, 200);
            };
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          alert("Could not access camera. Please check permissions or use Upload.");
          setShowCamera(false);
        }
      };
      startStream();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (analysisInterval) clearInterval(analysisInterval);
    };
  }, [showCamera]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCamera = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera not supported on this device/browser. Please use Upload.");
        return;
    }
    setShowCamera(true);
  };

  const checkImageQuality = async (file: File): Promise<string[]> => {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve([]); return; }

            // Resize to fixed width for consistent processing metrics
            const width = 500;
            const scale = width / img.width;
            const height = img.height * scale;
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            let totalBrightness = 0;
            let edgeScore = 0;

            // Loop through pixels
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                // Luminance
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                totalBrightness += brightness;

                // Simple horizontal edge detection
                if ((i / 4) % width !== 0) {
                     const prevR = data[i-4];
                     const prevG = data[i-3];
                     const prevB = data[i-2];
                     const prevBright = (0.299 * prevR + 0.587 * prevG + 0.114 * prevB);
                     edgeScore += Math.abs(brightness - prevBright);
                }
            }
            
            const pixelCount = width * height;
            const avgBrightness = totalBrightness / pixelCount;
            const avgEdgeScore = edgeScore / pixelCount;

            const issues = [];
            if (avgBrightness < 50) issues.push("The image seems too dark.");
            if (avgEdgeScore < 10) issues.push("The image might be blurry.");

            URL.revokeObjectURL(url);
            resolve(issues);
        };
        img.onerror = () => resolve([]);
        img.src = url;
    });
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setLoadingText("Analyzing your content...");
    setMode('SCAN'); // Show loading/preview
    
    try {
      const base64 = await fileToGenerativePart(file);
      setImageData({ base64, mimeType: file.type });
      setAudioData(null); // Clear previous audio if any
      
      const result = await explainImage(base64, file.type, level);
      setExplanation(result);
      setStickyQuizTaken(false); // Reset sticky quiz status for new content
      setStickyQuizData(null); // Clear prefetched quiz
      setMode('RESULT');
      saveActivity('EXPLANATION', result.topic, { 
        summary: result.summaryPoints,
        source: 'image',
        explanation: result,
        imageBase64: base64,
        mimeType: file.type
      });
      
      // Trigger background quiz generation
      generateQuickQuiz(result.explanation, result.topic)
        .then(data => setStickyQuizData(data))
        .catch(err => console.error("Background quiz gen failed", err));
        
    } catch (error: any) {
      console.error("Scan error:", error);
      let errorMessage = "We couldn't process this image. Please ensure it's clear and contains text.";
      
      if (error.message?.includes("Safety") || error.message?.includes("blocked")) {
          errorMessage = "This content was flagged by our safety filters. Please try a different page.";
      } else if (error.message?.includes("429")) {
          errorMessage = "We're receiving too many requests. Please wait a moment and try again.";
      }
      
      setError({ title: "Scan Failed", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = '';

    setLoading(true);
    setLoadingText("Checking image quality...");
    
    try {
        const issues = await checkImageQuality(file);
        if (issues.length > 0) {
            setQualityWarning({ show: true, issues, file });
            setLoading(false);
            return;
        }
        processFile(file);
    } catch (error) {
        console.error("Quality check failed", error);
        processFile(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (audioInputRef.current) audioInputRef.current.value = '';

    // Check mime type vaguely
    if (!file.type.startsWith('audio/') && !file.type.includes('video/')) { // allow video container as audio sometimes
        // But let's stick to audio for now or just pass it
    }
    
    handleAudioExplanation(file, file.type || 'audio/mp3');
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
             const blob = new Blob(chunksRef.current, { type: mimeType });
             await handleAudioExplanation(blob, mimeType);
             stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (e) {
        console.error(e);
        alert("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const handleAudioExplanation = async (blob: Blob, mimeType: string) => {
      setLoading(true);
      setError(null);
      setLoadingText("Processing your audio...");
      setMode('SCAN'); // repurpose SCAN for loading view
      
      try {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
              const base64String = reader.result as string;
              const base64Data = base64String.split(',')[1];
              
              setAudioData({ base64: base64Data, mimeType }); // Store for regeneration
              setImageData(null);

              const result = await explainAudio(base64Data, mimeType, level);
              setExplanation(result);
              setStickyQuizTaken(false); // Reset sticky quiz
              setStickyQuizData(null); // Clear prefetched quiz
              setMode('RESULT');
              saveActivity('EXPLANATION', result.topic, { 
                  summary: result.summaryPoints,
                  source: 'audio',
                  explanation: result,
                  audioBase64: base64Data,
                  mimeType: mimeType
              });
              setLoading(false);

              // Trigger background quiz generation
              generateQuickQuiz(result.explanation, result.topic)
                .then(data => setStickyQuizData(data))
                .catch(err => console.error("Background quiz gen failed", err));
          };
      } catch (e: any) {
          console.error(e);
          setError({
              title: "Audio Error",
              message: "We couldn't understand the audio. Please speak clearly or try again."
          });
          setLoading(false);
      }
  };

  const handleRegenerate = async (newLevel: 'Simple' | 'Exam') => {
      if (!audioData && !imageData && !explanation?.topic) return;
      
      setLoading(true);
      setError(null);
      setLoadingText("Updating explanation...");
      setMode('SCAN'); // Show loading screen
      try {
          let result: ExplanationResult | null = null;
          
          if (audioData) {
             result = await explainAudio(audioData.base64, audioData.mimeType, newLevel);
          } else if (imageData) {
             result = await explainImage(imageData.base64, imageData.mimeType, newLevel);
          } else if (explanation?.topic) {
             // Fallback for topic based regeneration
             result = await explainTopic(explanation.topic, newLevel);
          }

          if (result) {
            setExplanation(result);
            setLevel(newLevel);
            setStickyQuizTaken(false); // Reset since content changed/refreshed
            setStickyQuizData(null);
            setMode('RESULT');
            
            // Trigger background quiz generation
            generateQuickQuiz(result.explanation, result.topic)
              .then(data => setStickyQuizData(data))
              .catch(err => console.error("Background quiz gen failed", err));
          }
      } catch (e) {
          console.error(e);
          setError({
              title: "Update Failed",
              message: "We couldn't update the explanation level. Please try again."
          });
      } finally {
          setLoading(false);
      }
  };

  const handleTopicClick = async (topic: string) => {
    setLoading(true);
    setError(null);
    setLoadingText(`Exploring ${topic}...`);
    setMode('SCAN'); // Show loading
    try {
        setAudioData(null);
        setImageData(null);
        
        const result = await explainTopic(topic, level);
        setExplanation(result);
        setStickyQuizTaken(false); // Reset sticky quiz
        setStickyQuizData(null);
        setMode('RESULT');
        saveActivity('EXPLANATION', result.topic, {
            summary: result.summaryPoints,
            source: 'text',
            explanation: result
        });
        
        // Trigger background quiz generation
        generateQuickQuiz(result.explanation, result.topic)
          .then(data => setStickyQuizData(data))
          .catch(err => console.error("Background quiz gen failed", err));

    } catch (e) {
        setError({
            title: "Topic Error",
            message: "We couldn't load this topic. Please check your connection."
        });
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!explanation) return;
    const textContent = `Topic: ${explanation.topic}
Level: ${level}

SUMMARY POINTS:
${explanation.summaryPoints.map(p => `• ${p}`).join('\n')}

FULL EXPLANATION:
${explanation.explanation}
`;
    
    const element = document.createElement("a");
    const file = new Blob([textContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${explanation.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.txt`;
    document.body.appendChild(element); 
    element.click();
    document.body.removeChild(element);
  };

  const restoreActivity = (item: LearnerActivity) => {
    if (item.type === 'EXPLANATION' && item.details) {
        try {
            const details = JSON.parse(item.details);
            if (details.explanation) {
                setExplanation(details.explanation);
                // Restore image if present
                if (details.imageBase64) {
                    setImageData({ base64: details.imageBase64, mimeType: details.mimeType || 'image/jpeg' });
                } else {
                    setImageData(null);
                }
                
                // Restore audio if present
                if (details.audioBase64) {
                    setAudioData({ base64: details.audioBase64, mimeType: details.mimeType || 'audio/mp3' });
                } else {
                    setAudioData(null);
                }
                
                setStickyQuizTaken(true); // Treat restored history as "done" so we don't nag them again immediately
                setStickyQuizData(null);
                setMode('RESULT');
            }
        } catch (e) {
            console.error("Failed to restore activity", e);
        }
    }
  };

  const handleGenerateQuiz = async () => {
    if (!explanation) return;
    setLoading(true);
    setLoadingText("Creating your quiz...");
    try {
      const quiz = await generateQuiz(explanation.explanation, explanation.topic);
      setQuizData(quiz);
      setStickyQuizTaken(true); // Marked as taken so they aren't bugged on exit
      setMode('QUIZ');
    } catch (error) {
      alert("Failed to generate quiz."); // Keep alert for in-flow minor error or upgrade to setError if critical
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Sticky Quiz Logic
  const handleExitResult = async () => {
      if (stickyQuizTaken || !explanation) {
          setMode('MENU');
          return;
      }

      // Sticky Quiz Interception
      if (window.confirm("Wait! Before you leave, let's do a quick 3-question check to make sure you understood. Ready?")) {
          // Check if background generation finished
          if (stickyQuizData) {
              setQuizData(stickyQuizData);
              setStickyQuizTaken(true);
              setMode('QUIZ');
          } else {
              // Fallback if not ready yet
              setLoading(true);
              setLoadingText("Generating quick check...");
              try {
                 const stickyQuiz = await generateQuickQuiz(explanation.explanation, explanation.topic);
                 setQuizData(stickyQuiz);
                 setStickyQuizTaken(true);
                 setMode('QUIZ');
              } catch(e) {
                 console.error(e);
                 setMode('MENU'); // If fail, just go back
              } finally {
                 setLoading(false);
              }
          }
      } else {
          setMode('MENU');
      }
  };

  const handleTTS = async () => {
    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    if (!explanation) return;

    if (audioBufferRef.current) {
        playBuffer(audioBufferRef.current);
        return;
    }

    setLoading(true);
    setLoadingText("Generating voice...");
    try {
      const textToRead = `${explanation.topic}. ${explanation.summaryPoints.join('. ')}. Here is the explanation: ${explanation.explanation}`;
      const buffer = await generateSpeech(textToRead);
      audioBufferRef.current = buffer;
      playBuffer(buffer);
    } catch (e) {
      console.error(e);
      alert("Could not generate speech");
    } finally {
      setLoading(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start();
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  // --- VIEWS ---

  if (showCamera) {
    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                />
                
                {/* Auto Capture Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-3/4 aspect-[3/4] border-2 rounded-2xl transition-all duration-300 relative ${
                        scanStatus === 'STABILIZING' ? 'border-yellow-400 scale-105' :
                        scanStatus === 'CAPTURING' ? 'border-green-500 bg-white/20 scale-100' :
                        'border-white/50'
                    }`}>
                        <div className="absolute -top-10 left-0 right-0 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
                                scanStatus === 'STABILIZING' ? 'bg-yellow-400 text-yellow-900' :
                                scanStatus === 'CAPTURING' ? 'bg-green-500 text-white' :
                                'bg-black/50 text-white'
                            }`}>
                                {scanStatus === 'LOOKING' && "Align text & Hold Steady"}
                                {scanStatus === 'STABILIZING' && "Hold Steady..."}
                                {scanStatus === 'CAPTURING' && "Capturing!"}
                            </span>
                        </div>
                        {scanStatus === 'LOOKING' && (
                            <ScanLine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/50 w-full h-1 animate-pulse" />
                        )}
                    </div>
                </div>

                <button 
                    onClick={() => setShowCamera(false)}
                    className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 z-10"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="bg-black/80 p-6 flex items-center justify-center gap-8 relative z-10">
                 <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                 >
                    <div className="w-12 h-12 bg-white rounded-full"></div>
                 </button>
            </div>
        </div>
    );
  }

  // Error View
  if (error) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
             <div className="bg-red-50 p-6 rounded-full mb-6 animate-in zoom-in duration-300">
                 <XCircle className="w-16 h-16 text-red-500" />
             </div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">{error.title}</h2>
             <p className="text-gray-600 mb-8 leading-relaxed">{error.message}</p>
             <div className="flex flex-col w-full gap-3">
                 <Button fullWidth onClick={() => { setError(null); setMode('MENU'); }}>
                     Go Home
                 </Button>
                 <Button variant="ghost" fullWidth onClick={() => setError(null)}>
                     Try Again
                 </Button>
             </div>
        </div>
     );
  }

  if (mode === 'MENU') {
    const audioHistory = history.filter(h => {
        if (h.type !== 'EXPLANATION') return false;
        try {
            const d = JSON.parse(h.details || '{}');
            return d.source === 'audio';
        } catch { return false; }
    });

    const scanHistory = history.filter(h => {
        if (h.type !== 'EXPLANATION') return false;
        try {
            const d = JSON.parse(h.details || '{}');
            return d.source === 'image';
        } catch { return false; }
    });

    const displayCode = profile ? profile.code : studentCode;
    const greeting = profile ? `Hi, ${profile.name.split(' ')[0]}` : "My Learning Buddy";

    return (
      <div className="space-y-6 pb-20">
        <Header title={greeting} onHome={() => onNavigate(ViewState.DASHBOARD)} />
        
        {/* Quality Warning Modal */}
        {qualityWarning.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-amber-100 p-3 rounded-full mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Check Image Quality</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            We noticed a few issues that might affect the explanation:
                        </p>
                        <ul className="text-left bg-amber-50 p-3 rounded-lg w-full mb-6 space-y-2 border border-amber-100">
                            {qualityWarning.issues.map((issue, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-amber-800 font-medium">
                                    <AlertTriangle className="w-4 h-4 shrink-0" /> {issue}
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-3 w-full">
                            <Button variant="outline" fullWidth onClick={() => {
                                setQualityWarning({ show: false, issues: [], file: null });
                                startCamera();
                            }}>
                                Retry Scan
                            </Button>
                            <Button fullWidth onClick={() => {
                                const f = qualityWarning.file;
                                setQualityWarning({ show: false, issues: [], file: null });
                                if (f) processFile(f);
                            }}>
                                Use Anyway
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Student ID Code Banner */}
        <div className="px-4">
             <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-indigo-100 text-sm font-medium">Your Student Code</p>
                    <p className="text-2xl font-bold tracking-wider">{displayCode}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                    <UserCircle className="w-8 h-8 text-white" />
                </div>
             </div>
             <p className="text-xs text-gray-500 mt-2 text-center">Share this code with your parents so they can see your progress.</p>
        </div>

        <div className="px-4">
          <Card className="bg-indigo-50 border-indigo-100">
            <div className="flex flex-col items-center py-6 text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Start Learning</h2>
              <p className="text-gray-600 mb-6">Take a photo of your homework or ask a question.</p>
              
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => setLevel('Simple')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${level === 'Simple' ? 'bg-secondary text-white' : 'bg-white text-gray-600 border'}`}
                >
                  Very Simple
                </button>
                <button 
                  onClick={() => setLevel('Exam')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${level === 'Exam' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'}`}
                >
                  Exam Ready
                </button>
              </div>

              <div className="flex flex-col items-center gap-4 w-full justify-center">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <input 
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    ref={audioInputRef}
                    onChange={handleAudioUpload}
                  />

                  {/* Placeholder for Image Upload */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-indigo-300 bg-white/50 hover:bg-white hover:border-primary transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                  >
                     <div className="p-4 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                        <ImageIcon className="w-8 h-8 text-indigo-400 group-hover:text-primary" />
                     </div>
                     <span className="font-semibold text-gray-500 group-hover:text-primary">Upload Image</span>
                  </div>
                  
                  <div className="w-full space-y-3">
                      <div className="flex gap-3 w-full">
                          <Button 
                            onClick={startCamera} 
                            icon={<Camera className="w-5 h-5" />}
                            className="flex-1 py-4 text-base sm:text-lg"
                          >
                            Scan Page
                          </Button>
                          <Button 
                            onClick={startCamera} 
                            icon={<BookOpen className="w-5 h-5" />}
                            className="flex-1 py-4 text-base sm:text-lg"
                            variant="secondary"
                          >
                            Scan Textbook
                          </Button>
                      </div>

                      {isRecording ? (
                         <Button 
                            variant="ghost"
                            onClick={stopRecording} 
                            className="w-full py-4 bg-red-50 !text-red-600 border-2 border-red-200 hover:bg-red-100 shadow-sm transition-all"
                            icon={
                                <div className="relative flex h-4 w-4 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                                </div>
                            }
                         >
                            Stop ({formatTime(recordingTime)})
                         </Button>
                      ) : (
                         <Button 
                            variant="outline"
                            onClick={startRecording} 
                            icon={<Mic className="w-6 h-6" />}
                            className="w-full py-4 text-lg"
                         >
                            Ask Voice
                         </Button>
                      )}
                  </div>
                  
                  <div className="flex items-center justify-center gap-6 pt-2 w-full">
                      <button 
                        onClick={() => audioInputRef.current?.click()}
                        className="text-sm text-gray-500 hover:text-primary flex items-center gap-1.5 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="underline decoration-dotted">Upload Audio</span>
                      </button>
                  </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Scan History Section */}
        {scanHistory.length > 0 && (
          <div className="px-4">
            <h3 className="font-bold text-gray-700 mb-3 px-1 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                My Scans
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {scanHistory.map(item => {
                    const details = JSON.parse(item.details || '{}');
                    const imgSrc = details.imageBase64 
                        ? `data:${details.mimeType || 'image/jpeg'};base64,${details.imageBase64}`
                        : null;
                        
                    return (
                        <Card 
                            key={item.id} 
                            className="group relative p-0 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary transition-all active:scale-95" 
                            onClick={() => restoreActivity(item)}
                        >
                             <div className="aspect-[3/4] bg-gray-100 relative">
                                 {imgSrc ? (
                                    <img src={imgSrc} alt="scan" className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-xs">No Preview</span>
                                    </div>
                                 )}
                                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteActivity(item.id);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                             </div>
                             <div className="p-3 border-t border-gray-100">
                                <p className="font-bold text-gray-800 text-sm truncate leading-tight mb-1" title={item.topic}>{item.topic}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {item.date}
                                </p>
                             </div>
                        </Card>
                    );
                })}
            </div>
          </div>
        )}

        {/* Voice History Section */}
        {audioHistory.length > 0 && (
          <div className="px-4">
            <h3 className="font-bold text-gray-700 mb-3 px-1 flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                Voice History
            </h3>
            <div className="space-y-3">
                {audioHistory.map(item => (
                    <Card key={item.id} className="flex items-center justify-between p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => restoreActivity(item)}>
                         <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <Mic className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{item.topic}</p>
                                <p className="text-xs text-gray-500">{item.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteActivity(item.id);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <ArrowRight className="w-5 h-5 text-gray-300" />
                        </div>
                    </Card>
                ))}
            </div>
          </div>
        )}

        {/* General Recent Activity (Fallback/All) */}
        {history.length > 0 && (
        <div className="px-4">
          <h3 className="font-bold text-gray-700 mb-3 px-1">All Recent Activity</h3>
          <div className="space-y-3">
             {history.slice(0, 5).map(item => {
                     let isAudio = false;
                     try { isAudio = JSON.parse(item.details || '{}').source === 'audio'; } catch {}
                     
                     return (
                        <Card key={item.id} className="flex items-center justify-between p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => restoreActivity(item)}>
                            <div className="flex items-center gap-4">
                                <div className={`${isAudio ? 'bg-indigo-100' : 'bg-orange-100'} p-3 rounded-full`}>
                                    {isAudio ? (
                                        <Mic className="w-5 h-5 text-primary" />
                                    ) : (
                                        <FileText className="w-5 h-5 text-orange-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{item.topic}</p>
                                    <p className="text-xs text-gray-500">{item.date} • {item.type === 'QUIZ' ? `Score: ${item.score}%` : 'Explanation'}</p>
                                </div>
                            </div>
                            <button
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteActivity(item.id);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </Card>
                     );
                 })}
          </div>
        </div>
        )}
      </div>
    );
  }

  if (mode === 'SCAN' && loading) {
    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-800">{loadingText}</h2>
            <p className="text-gray-500 mt-2">I'm working my magic.</p>
        </div>
    );
  }

  if (mode === 'RESULT' && explanation) {
    return (
      <div className="pb-24">
        {/* Intercept Back button to check for sticky quiz */}
        <Header title={explanation.topic} onBack={handleExitResult} />
        
        <div className="p-4 space-y-4">
          <div className="flex justify-end">
              <Button variant="ghost" onClick={handleDownload} icon={<Download className="w-4 h-4" />} className="!py-2 !px-4 text-sm">
                  Download Explanation
              </Button>
          </div>
          
          {/* Display Scanned Image if available */}
          {imageData && (
            <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
               <img src={`data:${imageData.mimeType};base64,${imageData.base64}`} alt="Scanned Content" className="w-full max-h-60 object-contain mx-auto" />
            </div>
          )}

          {/* Audio Player if available */}
          {audioData && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 mb-4">
                  <div>
                      <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                          <Mic className="w-4 h-4 text-primary" />
                          Your Recording
                      </h4>
                      <audio 
                        controls 
                        src={`data:${audioData.mimeType};base64,${audioData.base64}`} 
                        className="w-full h-8" 
                      />
                      {explanation.transcript && (
                          <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600">
                              <h5 className="font-semibold text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Transcript
                              </h5>
                              <p className="italic">"{explanation.transcript}"</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* Level Selector - ALWAYS VISIBLE */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Change Explanation Level:</span>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                  <button 
                    onClick={() => handleRegenerate('Simple')}
                    disabled={loading || explanation.level === 'Simple'}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all ${explanation.level === 'Simple' ? 'bg-white text-secondary shadow ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Very Simple
                  </button>
                  <button 
                    onClick={() => handleRegenerate('Exam')}
                    disabled={loading || explanation.level === 'Exam'}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-bold transition-all ${explanation.level === 'Exam' ? 'bg-white text-primary shadow ring-1 ring-gray-100' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Exam Ready
                  </button>
              </div>
          </div>

          {/* Quick Summary Card */}
          <Card className="bg-yellow-50 border-yellow-100">
            <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Key Points
            </h3>
            <ul className="space-y-2">
              {explanation.summaryPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-gray-700 text-sm">
                  <span className="text-yellow-600">•</span> {point}
                </li>
              ))}
            </ul>
          </Card>

          {/* Full Explanation */}
          <Card title="Explanation">
            <MarkdownText content={explanation.explanation} />
          </Card>

          {/* Related Topics Chips */}
          {explanation.relatedTopics && explanation.relatedTopics.length > 0 && (
             <Card className="bg-indigo-50 border-indigo-100">
                 <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-indigo-600" />
                     Curious? Learn more about:
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {explanation.relatedTopics.map((topic, i) => (
                        <button 
                            key={i}
                            onClick={() => handleTopicClick(topic)}
                            className="bg-white text-indigo-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-300 transition-all active:scale-95"
                        >
                            {topic}
                        </button>
                    ))}
                 </div>
             </Card>
          )}

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3 sticky bottom-0 bg-white/80 backdrop-blur p-4 border-t z-10 -mx-4">
             <Button 
                variant="secondary" 
                onClick={handleTTS}
                disabled={loading}
                icon={isPlaying ? <StopCircle className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
             >
                {isPlaying ? "Stop Dictation" : "Dictate Explanation"}
             </Button>
             <Button 
                variant="primary" 
                onClick={handleGenerateQuiz}
                disabled={loading}
                icon={<Clock className="w-5 h-5"/>}
             >
                {loading ? "Creating..." : "Take Quiz"}
             </Button>
          </div>

        </div>
      </div>
    );
  }

  if (mode === 'QUIZ' && quizData) {
    return <QuizRunner data={quizData} onComplete={(score) => {
        saveActivity('QUIZ', quizData.topic, { score });
        setMode('MENU');
    }} onExit={() => setMode('RESULT')} />;
  }

  return null;
};

// --- QUIZ COMPONENT ---
const QuizRunner: React.FC<{ data: QuizData; onComplete: (score: number) => void; onExit: () => void }> = ({ data, onComplete, onExit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string>("");
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);

    const question = data.questions[currentIndex];
    const isLast = currentIndex === data.questions.length - 1;

    const handleAnswer = (ans: string) => {
        if (showResult) return;
        setSelectedAnswer(ans);
    };

    const handleCheck = () => {
        setShowResult(true);
        // Simple string matching for now. In real app, cleaner ID logic.
        const isCorrect = selectedAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        if (isCorrect) setScore(s => s + 1);
    };

    const handleNext = () => {
        if (isLast) {
            onComplete(Math.round((score / data.questions.length) * 100));
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer("");
            setShowResult(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <Header title={`Quiz: ${data.topic}`} onBack={onExit} />
            <div className="flex-1 p-4 overflow-y-auto pb-32">
                <div className="mb-4 flex justify-between items-center text-sm text-gray-500">
                    <span>Question {currentIndex + 1} of {data.questions.length}</span>
                    <span>Score: {score}</span>
                </div>

                <Card className="mb-6 min-h-[200px] flex flex-col justify-center">
                    <h3 className="text-xl font-medium text-gray-800">{question.question}</h3>
                </Card>

                {question.type === 'MCQ' && question.options && (
                    <div className="space-y-3">
                        {question.options.map((opt, idx) => {
                            let itemClass = "w-full p-4 rounded-xl border-2 text-left transition-all ";
                            if (showResult) {
                                if (opt === question.correctAnswer) itemClass += "border-green-500 bg-green-50 text-green-900";
                                else if (opt === selectedAnswer) itemClass += "border-red-500 bg-red-50 text-red-900";
                                else itemClass += "border-gray-200 opacity-50";
                            } else {
                                if (selectedAnswer === opt) itemClass += "border-primary bg-indigo-50 text-primary";
                                else itemClass += "border-gray-200 hover:border-indigo-200";
                            }

                            return (
                                <button key={idx} className={itemClass} onClick={() => handleAnswer(opt)} disabled={showResult}>
                                    {opt}
                                </button>
                            )
                        })}
                    </div>
                )}

                {question.type === 'SHORT' && (
                    <div className="space-y-4">
                         <textarea 
                            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0"
                            placeholder="Type your answer here..."
                            rows={3}
                            value={selectedAnswer}
                            onChange={(e) => handleAnswer(e.target.value)}
                            disabled={showResult}
                         />
                         {showResult && (
                             <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                 <p className="font-bold text-green-800 text-sm">Correct Answer:</p>
                                 <p className="text-green-700">{question.correctAnswer}</p>
                             </div>
                         )}
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                {!showResult ? (
                    <Button fullWidth onClick={handleCheck} disabled={!selectedAnswer}>Check Answer</Button>
                ) : (
                    <div className="space-y-2">
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-2">
                            <span className="font-bold">Explanation: </span> {question.explanation}
                        </div>
                        <Button fullWidth onClick={handleNext}>{isLast ? "Finish Quiz" : "Next Question"}</Button>
                    </div>
                )}
            </div>
        </div>
    )
};