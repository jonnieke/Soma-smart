import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Home, X, XCircle, Camera, ScanLine, Mic, Upload, Clock,
  CheckCircle, Play, Pause, ChevronRight, Star, BookOpen, Brain, Lightbulb, Lock, Volume2, CreditCard,
  ArrowRight, UserCircle, Download, ImageIcon, Trash2, AlertTriangle, LogOut, Users, DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExplanationResult, QuizData, ViewState, SubscriptionPlan, LearnerProfile, LearnerActivity, UserRole } from '../../types';
import { PricingPage } from '../subscription/PricingPage';
import { PaymentFlow } from '../subscription/PaymentFlow';
import { STUDENT_PLANS } from '../../data/pricing';
import { RegistrationModal } from '../../components/RegistrationModal'; // Assuming path
import { LoginModal } from '../../components/LoginModal'; // Assuming path
import { LogoutModal } from '../../components/LogoutModal';
import { MarkdownText, Button, Card } from '../../components/Shared';
import {
  fileToGenerativePart, explainImage, explainAudio, explainTopic,
  generateQuickQuiz, generateQuiz, generateSpeech, stopSpeech, generateLessonRecap
} from '../../services/geminiService';
import confetti from 'canvas-confetti';
import { calculateTotalXP, calculateLevel } from '../../services/gamificationService';
import { translations } from '../../data/translations';

// Simple Button component if not imported (placeholder or real import)
// const Button = ... (If it's a custom component, imply import. If standard HTML button is used in code, maybe it was styled component?)
// Checking the code usage: <Button ...>
// I will assume it's a component.

interface LearnerProps {
  onNavigate: (view: ViewState) => void;
  profile: LearnerProfile | null;
}

export const LearnerDashboard: React.FC<LearnerProps> = ({ onNavigate, profile }) => {
  const navigate = useNavigate();
  // We use useApp here to get usageCount and isRegistered centrally
  const {
    learnerHistory: history, saveActivity, deleteActivity, studentCode,
    usageCount, incrementUsage, isRegistered, studentProfile, updateStudentProfile,
    upgradeAccount, revisionUsageCount, incrementRevisionUsage,
    logout, isPro, subscriptionPlan, subscriptionExpiry, isOnline, role, language,
    createTutoringRequest
  } = useApp();
  const t = translations[language];
  const location = useLocation();

  // Check for subscription intent
  React.useEffect(() => {
    const state = location.state as { selectedPlan?: SubscriptionPlan; openSubscription?: boolean, initiatePaymentFor?: SubscriptionPlan };

    // New Direct Payment handling
    if (state?.initiatePaymentFor) {
      setSelectedPlan(state.initiatePaymentFor);
      setMode('PAYMENT');
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (state?.selectedPlan) {
      if (isPro) {
        // Already pro, just stay on dashboard and clear state
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        setSelectedPlan(state.selectedPlan);
        setMode('PAYMENT');
        // Clear state to avoid re-triggering on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    } else if (state?.openSubscription) {
      setMode('PRICING');
      // Clear state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, isPro, navigate]);

  // --- GAMIFICATION ENGINE ---
  const totalXP = React.useMemo(() => calculateTotalXP(history), [history]);
  const levelInfo = React.useMemo(() => calculateLevel(totalXP), [totalXP]);
  const prevXPRef = useRef(totalXP);

  useEffect(() => {
    if (totalXP > prevXPRef.current) {
      const diff = totalXP - prevXPRef.current;
      if (diff > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF4500']
        });
      }
    }
    prevXPRef.current = totalXP;
  }, [totalXP]);

  useEffect(() => {
    // Only redirect if NONE role (Guest is allowed)
    if (!isRegistered && role === UserRole.NONE) {
      navigate('/');
    }
  }, [isRegistered, role, navigate]);

  const [mode, setMode] = useState<'MENU' | 'SCAN' | 'RESULT' | 'QUIZ' | 'RECAP_RESULT' | 'PROFILE' | 'PRICING' | 'PAYMENT'>('MENU');
  const [recapData, setRecapData] = useState<any>(null); // Store LessonRecap

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string, message: string } | null>(null);
  const [loadingText, setLoadingText] = useState("Processing...");
  const [audioData, setAudioData] = useState<{ base64: string, mimeType: string } | null>(null);

  const [level, setLevel] = useState<'Simple' | 'Exam'>('Simple');

  // ... (rest of state) ...

  // Image data state (renamed from image for clarity and type safety)
  const [imageData, setImageData] = useState<{ base64: string, mimeType: string } | null>(null);

  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [stickyQuizTaken, setStickyQuizTaken] = useState(false);
  const [stickyQuizData, setStickyQuizData] = useState<QuizData | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [qualityWarning, setQualityWarning] = useState<{ show: boolean, issues: string[], file: File | null } | null>(null);
  // Separate warning object to match usage if needed, or just simplify
  const [qualityCallback, setQualityCallback] = useState<(() => void) | null>(null); // For custom modal action maybe? Unused but keeping clean.

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'STABILIZING' | 'CAPTURING' | 'LOOKING'>('idle');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [promptText, setPromptText] = useState("");
  const [showTutoringModal, setShowTutoringModal] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const checkImageQuality = (file: File): Promise<{ ok: boolean; warning?: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 600 || img.height < 600) {
          resolve({ ok: true, warning: "Image resolution is low. Results might be less accurate." });
        } else {
          resolve({ ok: true });
        }
      };
      img.onerror = () => resolve({ ok: true }); // Ignore error
      img.src = URL.createObjectURL(file);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    // 1. Stop tracks from the video element's srcObject
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped video track from videoRef");
      });
      videoRef.current.srcObject = null;
    }

    // 2. Stop tracks from the streamRef (most reliable if DOM is already gone)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped video track from streamRef");
      });
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setLoading(true);
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream; // Save stream to ref for cleanup
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError({ title: "Camera Error", message: "Unable to access camera." });
      setLoading(false);
    }
  };

  // Fix: Stop camera and mic when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup Camera
      stopCameraStream();

      // Cleanup Microphone
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!showCamera) {
      stopCameraStream();
    }
  }, [showCamera]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(blob => {
        if (blob) {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          processFile(file);
          setShowCamera(false);
          stopCameraStream(); // Explicitly stop
        }
      }, 'image/jpeg');
    }
  };



  // REMOVE duplicate useApp call that was around here
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const checkLimit = (): boolean => {
    // Pro = Unlimited Checks
    if (isPro) return true;

    // Guest Mode Limit (Max 5)
    if (role === UserRole.GUEST) {
      if (usageCount >= 5) {
        setShowLogin(true); // Force login
        return false;
      }
      incrementUsage();
      return true;
    }

    if (!isRegistered && usageCount >= 5) {
      setShowRegistration(true);
      return false;
    }
    incrementUsage();
    return true;
  };

  const processFile = async (file: File) => {
    if (!checkLimit()) return;

    setLoading(true);
    setError(null);
    setLoadingText("Analyzing your content...");
    setMode('SCAN'); // Show loading/preview

    try {
      const base64 = await fileToGenerativePart(file);
      setImageData({ base64, mimeType: file.type });
      setAudioData(null); // Clear previous audio if any

      const result = await explainImage(base64, file.type, level, language);
      setExplanation(result);
      setStickyQuizTaken(false); // Reset sticky quiz status for new content
      setStickyQuizData(null); // Clear prefetched quiz
      setMode('RESULT');
      saveActivity({
        id: Date.now().toString(),
        type: 'EXPLANATION',
        topic: result.topic,
        date: new Date().toLocaleDateString(),
        details: JSON.stringify({
          summary: result.summaryPoints,
          source: 'image',
          explanation: result,
          imageBase64: base64,
          mimeType: file.type
        })
      });

      // Trigger background quiz generation
      generateQuickQuiz(result.explanation, result.topic, language)
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
      if (issues.warning) {
        setQualityWarning({ show: true, issues: [issues.warning], file }); // Wrap string in array/object
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
      setError({ title: "Microphone Error", message: "Microphone access denied or unavailable." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioExplanation = async (blob: Blob, mimeType: string) => {
    if (!checkLimit()) return;

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

        const result = await explainAudio(base64Data, mimeType, level, language);
        setExplanation(result);
        setStickyQuizTaken(false); // Reset sticky quiz
        setStickyQuizData(null); // Clear prefetched quiz
        setMode('RESULT');
        saveActivity({
          id: Date.now().toString(),
          type: 'EXPLANATION',
          topic: result.topic,
          date: new Date().toLocaleDateString(),
          details: JSON.stringify({
            summary: result.summaryPoints,
            source: 'audio',
            explanation: result,
            audioBase64: base64Data,
            mimeType: mimeType
          })
        });
        setLoading(false);

        // Trigger background quiz generation
        generateQuickQuiz(result.explanation, result.topic, language)
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
        result = await explainAudio(audioData.base64, audioData.mimeType, newLevel, language);
      } else if (imageData) {
        result = await explainImage(imageData.base64, imageData.mimeType, newLevel, language);
      } else if (explanation?.topic) {
        // Fallback for topic based regeneration
        result = await explainTopic(explanation.topic, newLevel, language);
      }

      if (result) {
        setExplanation(result);
        setLevel(newLevel);
        setStickyQuizTaken(false); // Reset since content changed/refreshed
        setStickyQuizData(null);
        setMode('RESULT');

        // Trigger background quiz generation
        generateQuickQuiz(result.explanation, result.topic, language)
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
    if (!checkLimit()) return;

    setLoading(true);
    setError(null);
    setLoadingText(`Exploring ${topic}...`);
    setMode('SCAN'); // Show loading
    try {
      setAudioData(null);
      setImageData(null);

      const result = await explainTopic(topic, level, language);
      setExplanation(result);
      setStickyQuizTaken(false); // Reset sticky quiz
      setStickyQuizData(null);
      setMode('RESULT');
      saveActivity({
        id: Date.now().toString(),
        type: 'EXPLANATION',
        topic: result.topic,
        date: new Date().toLocaleDateString(),
        details: JSON.stringify({
          summary: result.summaryPoints,
          source: 'text',
          explanation: result
        })
      });

      // Trigger background quiz generation
      generateQuickQuiz(result.explanation, result.topic, language)
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

  const handlePromptSubmit = async () => {
    if (!promptText.trim()) return;
    const query = promptText.trim();
    setPromptText("");
    await handleTopicClick(query);
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
    const file = new Blob([textContent], { type: 'text/plain' });
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
        if (details && details.explanation) {
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
      const quiz = await generateQuiz(explanation.explanation, explanation.topic, language);
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
    // If background generation finished, we can just leave or show a quick prompt
    // But let's prioritize "No Confusion" and just go back if it's annoying
    if (stickyQuizTaken || !explanation) {
      setMode('MENU');
      return;
    }

    // Optional: Only confirm if they haven't seen the result for long? 
    // For now, let's keep it but make it clear it's a choice
    setMode('MENU');
  };

  const handleTTS = async () => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    if (!explanation) return;

    setLoading(true);
    setLoadingText("Generating high-quality voice...");
    try {
      const textToRead = `${explanation.topic}. ${explanation.summaryPoints.join('. ')}. Here is the explanation: ${explanation.explanation}`;

      setIsPlaying(true);
      await generateSpeech(textToRead);
    } catch (e: any) {
      console.error("TTS Error:", e);
      // generateSpeech already has a fallback to browser TTS inside, 
      // but if even that fails, we stop loading.
    } finally {
      setIsPlaying(false);
      setLoading(false);
    }
  };

  // Remove unused playBuffer helper
  const playBuffer = () => { };

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
            <div className={`w-11/12 md:w-3/4 aspect-[3/4] border-2 rounded-3xl transition-all duration-300 relative ${scanStatus === 'STABILIZING' ? 'border-yellow-400 scale-105' :
              scanStatus === 'CAPTURING' ? 'border-green-500 bg-white/20 scale-100' :
                'border-white/50'
              }`}>
              <div className="absolute -top-12 left-0 right-0 text-center">
                <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-md ${scanStatus === 'STABILIZING' ? 'bg-yellow-400 text-yellow-900' :
                  scanStatus === 'CAPTURING' ? 'bg-green-500 text-white' :
                    'bg-black/60 text-white border border-white/20'
                  }`}>
                  {scanStatus === 'LOOKING' && "Fit whole question in box"}
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
            className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 z-10 transition-colors border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="bg-black/90 p-8 flex items-center justify-around gap-8 relative z-10 pb-12 rounded-t-[2rem] border-t border-white/10">
          {/* Audio Option */}
          <button
            onClick={() => {
              setShowCamera(false);
              setTimeout(() => startRecording(), 100); // Small delay to allow UI transition
            }}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors border border-slate-700">
              <Mic className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-slate-400">Read Aloud</span>
          </button>

          <button
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 shadow-xl shadow-white/10"
          >
            <div className="w-16 h-16 bg-white rounded-full"></div>
          </button>

          {/* Placeholder for Gallery/Upload if needed later, currently just spacer or generic help */}
          <button
            className="flex flex-col items-center gap-2 group opacity-50 cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <ImageIcon className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-xs font-medium text-slate-400">Gallery</span>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'RECAP_RESULT' && recapData) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800 max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm flex items-center gap-4">
          <button onClick={() => setMode('MENU')}><ArrowRight className="w-6 h-6 rotate-180" /></button>
          <h2 className="font-bold text-lg">Lesson Recap</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
            <h1 className="text-2xl font-bold mb-2">{recapData.topic}</h1>
            <p className="opacity-90">{recapData.summary}</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Key Points</h3>
            <ul className="space-y-3">
              {recapData.keyPoints.map((p: string, i: number) => (
                <li key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-3">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
                  <span className="text-sm">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Exam Tips</h3>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
              {recapData.examTips.map((tip: string, i: number) => (
                <p key={i} className="text-sm text-red-800 font-medium">• {tip}</p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500" /> Definitions</h3>
            <div className="space-y-2">
              {recapData.definitions.map((def: any, i: number) => (
                <div key={i} className="bg-blue-50 p-3 rounded-lg">
                  <span className="font-bold text-blue-900">{def.term}: </span>
                  <span className="text-blue-800 text-sm">{def.definition}</span>
                </div>
              ))}
            </div>
          </div>
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
        return d?.source === 'audio';
      } catch { return false; }
    });

    const scanHistory = history.filter(h => {
      if (h.type !== 'EXPLANATION') return false;
      try {
        const d = JSON.parse(h.details || '{}');
        return d?.source === 'image';
      } catch { return false; }
    });

    const displayCode = profile ? profile.code : studentCode;
    const greeting = profile ? `Hi, ${profile.name.split(' ')[0]}!` : "My Learning Buddy";

    return (
      <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800 max-w-4xl mx-auto shadow-2xl border-x border-slate-100">

        {/* --- HERO HEADER --- */}
        <div className="bg-white px-6 pt-8 pb-6 rounded-b-[3rem] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-100 rounded-full blur-2xl opacity-50"></div>

          {/* TSC LIVE BANNER */}

          {/* Hero Content */}

          <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-4">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-1"
              >
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Student</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight"
              >
                {greeting} <span className="inline-block animate-bounce">👋</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 font-medium text-sm md:text-base"
              >
                your smart powered study companion
              </motion.p>

              {/* GAMIFICATION PROGRESS */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                transition={{ delay: 0.4 }}
                className="mt-5 w-full max-w-[240px]"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                      <Star className="w-3 h-3 text-yellow-900 fill-yellow-900" />
                    </div>
                    {t.learner.stats.level} {levelInfo.level}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{Math.floor(levelInfo.progressPercent)}% to L{levelInfo.level + 1}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[2px]">
                  <motion.div
                    layout
                    initial={{ width: 0 }}
                    animate={{ width: `${levelInfo.progressPercent}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-sm"
                  />
                </div>
                <div className="text-right mt-1">
                  <span className="text-[10px] font-bold text-indigo-400">{totalXP} {t.learner.stats.xp}</span>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-start">
              <button
                onClick={() => onNavigate(ViewState.DASHBOARD)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors group text-xs font-bold text-slate-600"
                title="Back to Landing Page"
              >
                <Home className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                {language === 'FR' ? 'Accueil' : 'Home'}
              </button>
              <button onClick={() => setMode('PRICING')} className="flex-1 md:flex-none flex justify-center items-center p-2 bg-indigo-100 rounded-xl hover:bg-indigo-200 transition-colors group" title="Pricing Plans">
                <CreditCard className="w-6 h-6 text-indigo-600" />
              </button>
              <button
                onClick={() => setMode('PROFILE')}
                className={`flex-1 md:flex-none flex justify-center items-center p-2 rounded-xl transition-colors group ${mode === ('PROFILE' as any) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                title="Your Profile"
              >
                <UserCircle className="w-6 h-6" />
              </button>
              <button onClick={() => setShowLogoutModal(true)} className="flex-1 md:flex-none flex justify-center items-center p-2 bg-slate-100 rounded-xl hover:bg-red-100 transition-colors group" title="Logout">
                <LogOut className="w-6 h-6 text-slate-500 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          </div>


          {/* Student ID Card - Mini - Modernized */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-white border border-slate-200 rounded-2xl p-4 text-slate-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-indigo-300 transition-all"
            onClick={() => {
              navigator.clipboard.writeText(displayCode);
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>

            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Student ID</p>
                  <p className="text-xl font-bold font-mono tracking-widest text-slate-900">{displayCode}</p>
                </div>
              </div>
              {!profile && !displayCode ? (
                <button onClick={(e) => { e.stopPropagation(); setShowLogin(true); }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                  Login
                </button>
              ) : (
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">Tap to copy</span>
              )}
            </div>
          </motion.div>


          {/* QUICK PROMPT FIELD */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`mt-8 relative z-30 ${!isOnline ? 'opacity-50 grayscale-[0.5] pointer-events-none' : ''}`}
          >
            <div className="flex items-center gap-2 mb-3 pl-1">
              <Sparkles className={`w-5 h-5 ${isOnline ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {isOnline ? t.learner.actions.topic : (language === 'FR' ? "Demander à Soma (Hors ligne)" : "Ask Soma (Offline)")}
              </h2>
              {!isOnline && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">Internet Required</span>}
            </div>

            <div className="bg-white rounded-3xl shadow-2xl shadow-blue-200/60 border-2 border-blue-400/30 p-2 flex items-end gap-2 pr-4 focus-within:border-blue-500 transition-all">
              <div className="flex gap-1 pl-2 mb-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                  title="Upload Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2.5 rounded-2xl transition-all ${isRecording ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
                  title="Record Audio"
                >
                  {isRecording ? <div className="w-4 h-4 bg-red-500 rounded-sm animate-pulse" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePromptSubmit();
                  }
                }}
                placeholder="Ask Soma anything... (type, upload, or record)"
                rows={1}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-700 text-base font-medium py-3 px-2 min-h-[44px] max-h-32 resize-none"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />

              <button
                onClick={handlePromptSubmit}
                disabled={!promptText.trim() || loading}
                className={`p-3 rounded-2xl transition-all mb-1 ${promptText.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-300 scale-105 active:scale-95' : 'bg-slate-100 text-slate-300'}`}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            {isRecording && (
              <div className="absolute -top-10 left-6 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording... {formatTime(recordingTime)}
              </div>
            )}
          </motion.div>
        </div>

        {/* --- MAGIC TOOLS --- */}
        <div className="px-6 -mt-4 relative z-20">
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-100 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" /> {language === 'FR' ? 'Outils Magiques' : 'Magic Tools'}
              </h2>

              {/* Level Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setLevel('Simple')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${level === 'Simple' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                  Simple
                </button>
                <button onClick={() => setLevel('Exam')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${level === 'Exam' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  Exam
                </button>
              </div>
            </div>

            {/* Hidden Inputs */}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <input type="file" accept="audio/*" className="hidden" ref={audioInputRef} onChange={handleAudioUpload} />

            {/* Hidden Input for Recap */}
            <input
              type="file"
              id="recap-upload"
              className="hidden"
              accept="audio/*,image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setLoading(true);
                setLoadingText("Summarizing lesson...");
                setMode('SCAN');

                try {
                  let base64 = "";
                  if (file.type.startsWith('image')) {
                    base64 = await fileToGenerativePart(file);
                  } else {
                    // For audio/video
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    await new Promise(resolve => reader.onloadend = resolve);
                    base64 = (reader.result as string).split(',')[1];
                  }
                  // Simple hack: assume video is audio for now or fails gracefully
                  const audience = 'LEARNER';
                  const result = await generateLessonRecap(base64, file.type, audience, language);
                  setRecapData(result);
                  setMode('RECAP_RESULT');
                  saveActivity({
                    id: Date.now().toString(),
                    type: 'EXPLANATION',
                    topic: result.topic,
                    date: new Date().toLocaleDateString(),
                    details: JSON.stringify({ type: 'RECAP', data: result, source: file.type.startsWith('image') ? 'image' : 'audio' })
                  } as any);
                } catch (e) {
                  alert("Recap failed. Please try again.");
                  setMode('MENU');
                } finally {
                  setLoading(false);
                }
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Row 1: Scan (2) + Upload (1) */}

              {/* Camera Action - Modernized */}
              <motion.button
                whileHover={isOnline ? { scale: 1.01 } : {}}
                whileTap={isOnline ? { scale: 0.99 } : {}}
                onClick={isOnline ? startCamera : undefined}
                className={`col-span-1 lg:col-span-2 p-6 rounded-3xl border-2 flex items-center justify-between group relative transition-all shadow-sm ${isOnline ? 'bg-white border-blue-100 hover:border-blue-400 hover:shadow-blue-50' : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed grayscale'}`}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isOnline ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-200'}`}>
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-xl font-bold ${isOnline ? 'text-slate-900' : 'text-slate-400'}`}>{t.learner.actions.scan}</h3>
                    <p className={`${isOnline ? 'text-slate-500' : 'text-slate-400'} text-xs font-medium`}>
                      {isOnline ? "Snap a photo to understand instantly" : "Connect to internet to scan"}
                    </p>
                  </div>
                </div>
                {isOnline && (
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </motion.button>

              {/* Upload Action */}
              <motion.button
                whileHover={isOnline ? { scale: 1.02 } : {}}
                whileTap={isOnline ? { scale: 0.98 } : {}}
                onClick={isOnline ? () => fileInputRef.current?.click() : undefined}
                className={`col-span-1 p-4 rounded-3xl shadow-sm border flex flex-col items-center justify-center gap-3 transition-all ${isOnline ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed grayscale'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm text-slate-700 opacity-70">Upload</span>
              </motion.button>

              {/* Row 2: Revision (2) + Voice (1) */}

              {/* Past Papers Action - Modernized */}
              <motion.button
                whileHover={isOnline ? { scale: 1.01 } : {}}
                whileTap={isOnline ? { scale: 0.99 } : {}}
                onClick={isOnline ? () => navigate('/revision') : undefined}
                className={`col-span-1 lg:col-span-2 p-6 rounded-3xl border-2 flex items-center justify-between group relative transition-all shadow-sm ${isOnline ? 'bg-white border-orange-100 hover:border-orange-400 hover:shadow-orange-50' : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed grayscale'}`}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isOnline ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-slate-200'}`}>
                    <Brain className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-xl font-bold ${isOnline ? 'text-slate-900' : 'text-slate-400'}`}>{t.learner.actions.pastPapers}</h3>
                    <p className={`${isOnline ? 'text-slate-500' : 'text-slate-400'} text-xs font-medium`}>
                      {isOnline ? "Upload materials & get smart coaching" : "Connect to internet for coaching"}
                    </p>
                  </div>
                </div>
                {isOnline && (
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center group-hover:bg-orange-50 transition-colors">
                    <ArrowRight className="w-5 h-5 text-orange-600" />
                  </div>
                )}
              </motion.button>

              {/* Voice Action */}
              <motion.button
                whileHover={isOnline ? { scale: 1.02 } : {}}
                whileTap={isOnline ? { scale: 0.98 } : {}}
                onClick={isOnline ? (isRecording ? stopRecording : startRecording) : undefined}
                className={`col-span-1 p-4 rounded-3xl shadow-sm border flex flex-col items-center justify-center gap-3 transition-colors ${!isOnline ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed grayscale' : isRecording ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
              >
                {isRecording ? (
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                    <div className="w-4 h-4 rounded-sm bg-red-600" />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Mic className="w-6 h-6" />
                  </div>
                )}
                <span className={`font-bold text-sm ${isRecording ? 'text-red-600' : 'text-slate-700 opacity-70'}`}>
                  {isRecording ? formatTime(recordingTime) : t.learner.actions.voice}
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* --- LEARNING JOURNEY --- */}
        <div className="px-6 mt-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Recent Adventures
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">No learning adventures yet!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.slice(0, 10).map((item, index) => {
                let details: Record<string, any> = {};
                try {
                  const parsed = JSON.parse(item.details || '{}');
                  details = (parsed && typeof parsed === 'object') ? parsed : {};
                } catch (e) { /* ignore */ }
                const isQuiz = item.type === 'QUIZ';
                const isAudio = details?.source === 'audio';

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.id}
                    onClick={() => restoreActivity(item)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isQuiz ? 'bg-orange-100 text-orange-600' : isAudio ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {isQuiz ? <CheckCircle className="w-6 h-6" /> : isAudio ? <Mic className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate">{item.topic}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        {item.date}
                        {isQuiz && <span className="text-orange-600 font-bold">• {item.score}% Score</span>}
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); deleteActivity(item.id); }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <RegistrationModal
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSuccess={() => setShowRegistration(false)}
          onSwitchToLogin={() => { setShowRegistration(false); setShowLogin(true); }}
        />
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            logout();
            navigate('/');
          }}
        />

        {/* Tutoring Request Modal - Phase 2 */}
        <AnimatePresence>
          {showTutoringModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden"
              >
                {/* Header */}
                <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <button
                    onClick={() => setShowTutoringModal(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="relative z-10 flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">Ask a Teacher</h3>
                      <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Connect with a real human</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Topic for Discussion</label>
                    <p className="text-lg font-bold text-slate-800 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">{explanation?.topic || 'General Question'}</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Explain what you need help with</label>
                    <textarea
                      placeholder="e.g. I don't understand how the second step works..."
                      rows={4}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-700 font-medium focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none"
                      id="tutoring-desc"
                    />
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-amber-900" />
                    </div>
                    <div>
                      <p className="text-amber-900 font-black text-sm">Cost: KES 20</p>
                      <p className="text-amber-700 text-[10px] font-bold">This will be deducted from your wallet or added to your termly bill.</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      fullWidth
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 py-4 text-lg"
                      onClick={async () => {
                        const desc = (document.getElementById('tutoring-desc') as HTMLTextAreaElement).value;
                        if (!desc.trim()) {
                          alert("Please explain your question first!");
                          return;
                        }
                        setLoading(true);
                        setLoadingText("Sending request...");
                        const res = await createTutoringRequest(explanation?.topic || "General Help", desc, 20);
                        setLoading(false);
                        if (res.success) {
                          setShowTutoringModal(false);
                          alert(res.message);
                        } else {
                          alert(res.message);
                        }
                      }}
                    >
                      Send Request
                    </Button>
                    <p className="text-center text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-widest">A teacher will respond via voice or video</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Quality Warning Modal */}

      </div>
    );
  }

  if (mode === 'PROFILE') {
    return (
      <div className="bg-slate-50 min-h-screen pb-20 max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        {/* Sticky Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 rounded-xl transition-all group">
              <ArrowRight className="w-5 h-5 text-slate-500 rotate-180 group-hover:text-blue-600" />
            </button>
            <h1 className="font-bold text-xl text-slate-900">Your Profile</h1>
          </div>
          <button onClick={() => setShowLogoutModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>

        <div className="p-6 space-y-8 max-w-2xl mx-auto">
          {/* Profile Card */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Account Details</h2>
            </div>

            <Card className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <p className="text-lg font-bold text-slate-800">{studentProfile?.name || '---'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Student ID</label>
                  <p className="text-lg font-bold text-blue-600 font-mono tracking-wider">{studentCode || '---'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Grade Level</label>
                  <p className="text-lg font-bold text-slate-800">{studentProfile?.grade || '---'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Email</label>
                  <p className="text-sm font-medium text-slate-500 truncate">{studentProfile?.email || 'No email set'}</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Parent Contact Settings */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Parent Dashboard Access</h2>
                <p className="text-xs text-slate-400 font-medium">Allows parents to log in using their phone number</p>
              </div>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="parentPhone" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parent&apos;s Phone Number</label>
                  <div className="relative">
                    <input
                      id="parentPhone"
                      type="tel"
                      defaultValue={studentProfile?.parentPhone || ''}
                      placeholder="e.g. 0712345678"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-lg font-bold text-slate-800 focus:border-purple-500 focus:ring-0 transition-all outline-none"
                      onChange={(e) => {
                        const val = e.target.value;
                        const btn = document.getElementById('save-profile-btn');
                        if (btn) btn.style.display = 'block';
                      }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                    Parents use this number + your Student ID to access performance reports and subscription management.
                  </p>
                </div>

                <div id="save-profile-btn" style={{ display: 'none' }}>
                  <Button
                    fullWidth
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                    onClick={async () => {
                      const input = document.getElementById('parentPhone') as HTMLInputElement;
                      setLoading(true);
                      setLoadingText("Saving profile...");
                      const { success, message } = await updateStudentProfile({ parentPhone: input.value });
                      setLoading(false);
                      if (success) {
                        const btn = document.getElementById('save-profile-btn');
                        if (btn) btn.style.display = 'none';
                        // Optional: Toast success
                      } else {
                        alert(message || "Failed to save profile");
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* Subscription Status */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Subscription Status</h2>
            </div>

            <Card className={`p-6 border-2 ${isPro ? 'border-amber-200 bg-gradient-to-br from-white to-amber-50/30' : 'border-slate-100'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${isPro ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {subscriptionPlan === 'FREE' ? 'Free Tier' : `${subscriptionPlan} Plan`}
                    </span>
                    {isPro && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Active</span>}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1">
                    {isPro ? 'Soma Smart Pro' : 'Limited Access'}
                  </h3>
                  {isPro && subscriptionExpiry && (
                    <p className="text-xs text-slate-500 font-medium">Valid until {new Date(subscriptionExpiry).toLocaleDateString()}</p>
                  )}
                  {!isPro && (
                    <p className="text-xs text-slate-500 font-medium">Scans remaining today: <span className="text-blue-600 font-bold">{5 - usageCount}</span></p>
                  )}
                </div>

                <div className="shrink-0">
                  <Button
                    variant={isPro ? 'outline' : 'primary'}
                    onClick={() => setMode('PRICING' as any)}
                    className={!isPro ? 'bg-amber-500 hover:bg-amber-600 text-white border-0 px-8 py-3' : ''}
                  >
                    {isPro ? 'Extend Plan' : 'Go Pro Now'}
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>
    );
  }

  if (mode === 'SCAN' && loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-white p-6 rounded-full shadow-xl">
            <Sparkles className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-8 mb-2 animate-pulse">{loadingText}</h2>
        <p className="text-slate-500 max-w-xs mx-auto text-lg">Soma is putting the pieces together...</p>
      </div>
    );
  }

  if (mode === 'RESULT' && explanation) {
    return (
      <div className="bg-slate-50 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
        {/* Sticky Glass Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3"
        >
          <button onClick={handleExitResult} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-all group">
            <ArrowRight className="w-5 h-5 text-slate-500 rotate-180 group-hover:text-blue-600" />
            <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600">Dashboard</span>
          </button>
          <h1 className="font-bold text-lg text-slate-900 truncate flex-1">{explanation.topic}</h1>
          <button onClick={handleDownload} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </motion.div>

        <div className="p-4 space-y-6 max-w-2xl mx-auto">

          {/* Media Section */}
          {(imageData || audioData) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200"
            >
              {imageData && (
                <div className="relative rounded-xl overflow-hidden bg-slate-100 max-h-60">
                  <img src={`data:${imageData.mimeType};base64,${imageData.base64}`} alt="Scanned Content" className="w-full h-full object-contain" />
                </div>
              )}
              {audioData && (
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mic className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Your Question</p>
                      <p className="text-xs text-slate-400">Audio Recording</p>
                    </div>
                  </div>
                  <audio controls src={`data:${audioData.mimeType};base64,${audioData.base64}`} className="w-full h-10" />
                </div>
              )}
            </motion.div>
          )}

          {/* Level Switcher */}
          <div className="flex bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            {(['Simple', 'Exam'] as const).map((l) => (
              <button
                key={l}
                onClick={() => handleRegenerate(l)}
                disabled={loading || explanation.level === l}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${explanation.level === l ? (l === 'Simple' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-blue-100 text-blue-700 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
              >
                {l === 'Simple' ? 'Explain Simply 🐣' : 'Exam Mode 🎓'}
              </button>
            ))}
          </div>

          {/* Key Points - Modernized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></div>
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              Key Takeaways
            </h3>
            <ul className="space-y-4">
              {explanation.summaryPoints.map((point, i) => (
                <li key={i} className="flex gap-4 text-slate-600 leading-relaxed font-medium">
                  <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <span className="text-sm md:text-base">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Detailed Explanation */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 prose prose-slate max-w-none prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-slate-900"
          >
            <MarkdownText content={explanation.explanation} />
          </motion.article>

          {/* Need more help? - Phase 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center gap-6"
          >
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-black mb-1">Still confused? 🧐</h3>
              <p className="text-indigo-100 text-sm font-medium">Get a personalized explanation from a top teacher for just KES 20.</p>
            </div>
            <button
              onClick={() => setShowTutoringModal(true)}
              className="px-8 py-4 bg-white text-indigo-600 rounded-full font-black text-sm uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all active:scale-95"
            >
              Ask a Teacher
            </button>
          </motion.div>

          {/* Related Topics */}
          {explanation.relatedTopics && explanation.relatedTopics.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-bold text-slate-800 mb-3 px-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" /> Keep Exploring
              </h4>
              <div className="flex flex-wrap gap-2">
                {explanation.relatedTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleTopicClick(topic)}
                    className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all active:scale-95 shadow-sm"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </div>

        {/* Floating Action Dock */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl p-2 pl-4 pr-2 rounded-full shadow-2xl z-50 transition-all hover:scale-105">
          <button
            onClick={handleTTS}
            className="flex items-center gap-2 text-white font-bold text-sm hover:text-blue-300 transition-colors"
          >
            {isPlaying ? <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> : <Volume2 className="w-5 h-5" />}
            {isPlaying ? "Stop" : "Listen"}
          </button>

          <div className="w-px h-6 bg-white/20"></div>

          <button
            onClick={handleGenerateQuiz}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Clock className="w-5 h-5" />
            Take Quiz
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'QUIZ' && quizData) {
    return <QuizRunner data={quizData} onComplete={(score) => {
      saveActivity({
        id: Date.now().toString(),
        type: 'QUIZ',
        topic: quizData.topic,
        date: new Date().toLocaleDateString(),
        score
      });
      setMode('MENU');
    }} onExit={() => setMode('RESULT')} />;
  }

  // --- PRICING & PAYMENT ---

  if (mode === 'PRICING') {
    return (
      <PricingPage
        onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          setMode('PAYMENT' as any);
        }}
        onClose={() => setMode('MENU')}
      />
    );
  }

  if (mode === 'PAYMENT' && selectedPlan) {
    return (
      <PaymentFlow
        plan={selectedPlan}
        onSuccess={async () => {
          await upgradeAccount(selectedPlan);
          setMode('MENU');
          setSelectedPlan(null);
        }}
        onCancel={() => setMode('PRICING' as any)}
      />
    );
  }

  return null;
};

// --- QUIZ COMPONENT ---
const QuizRunner: React.FC<{ data: QuizData; onComplete: (score: number) => void; onExit: () => void }> = ({ data, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = data.questions[currentIndex];
  const isLast = currentIndex === data.questions.length - 1;
  const progress = ((currentIndex + 1) / data.questions.length) * 100;

  const handleAnswer = (ans: string) => {
    if (showResult) return;
    setSelectedAnswer(ans);
  };

  const handleCheck = () => {
    setShowResult(true);
    const correct = selectedAnswer.toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      onComplete(Math.round((score / data.questions.length) * 100));
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer("");
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 max-w-lg mx-auto shadow-2xl border-x border-slate-100">
      {/* Quiz Header */}
      <div className="bg-white px-4 py-3 shadow-sm z-10 flex items-center justify-between sticky top-0">
        <button onClick={onExit} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-all group">
          <X className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
          <span className="text-xs font-bold text-slate-400 group-hover:text-red-500">Dashboard</span>
        </button>
        <div className="flex-1 px-4">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
            />
          </div>
        </div>
        <div className="font-bold text-slate-700 text-sm">{currentIndex + 1}/{data.questions.length}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 leading-snug">{question.question}</h3>
          </div>

          {question.type === 'MCQ' && question.options && (
            <div className="grid gap-3">
              {question.options.map((opt, idx) => {
                let itemClass = "w-full p-4 rounded-2xl text-left border-2 transition-all font-medium relative overflow-hidden ";

                if (showResult) {
                  if (opt === question.correctAnswer) itemClass += "border-green-500 bg-green-50 text-green-900 shadow-md";
                  else if (opt === selectedAnswer) itemClass += "border-red-500 bg-red-50 text-red-900";
                  else itemClass += "border-slate-100 text-slate-400 opacity-50";
                } else {
                  if (selectedAnswer === opt) itemClass += "border-blue-500 bg-blue-50 text-blue-900 shadow-md transform scale-[1.02]";
                  else itemClass += "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm";
                }

                return (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    key={idx}
                    className={itemClass}
                    onClick={() => handleAnswer(opt)}
                    disabled={showResult}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span>{opt}</span>
                      {showResult && opt === question.correctAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {showResult && opt === selectedAnswer && opt !== question.correctAnswer && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          {question.type === 'SHORT' && (
            <div className="space-y-4">
              <textarea
                className="w-full p-5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none text-lg bg-white shadow-sm"
                placeholder="Type your answer here..."
                rows={4}
                value={selectedAnswer}
                onChange={(e) => handleAnswer(e.target.value)}
                disabled={showResult}
              />
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-green-50 rounded-2xl border border-green-200"
                >
                  <p className="font-bold text-green-800 text-sm uppercase tracking-wide mb-1">Correct Answer</p>
                  <p className="text-green-900 font-medium text-lg">{question.correctAnswer}</p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer Controls */}
      <div className="p-4 bg-white border-t border-slate-200 z-50">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button fullWidth onClick={handleCheck} disabled={!selectedAnswer} className="py-4 text-lg rounded-xl shadow-lg shadow-blue-200">
                  Check Answer
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className={`p-4 rounded-xl flex items-start gap-3 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {isCorrect ? <Sparkles className="w-6 h-6 shrink-0" /> : <BookOpen className="w-6 h-6 shrink-0" />}
                  <div>
                    <p className="font-bold text-sm mb-1">{isCorrect ? "Correct!" : "Explanation:"}</p>
                    <p className="text-sm leading-relaxed opacity-90">{question.explanation}</p>
                  </div>
                </div>
                <Button fullWidth onClick={handleNext} className={`py-4 text-lg rounded-xl shadow-lg ${isCorrect ? 'shadow-green-200 bg-green-600 hover:bg-green-700' : 'shadow-slate-200 bg-slate-800 hover:bg-slate-900'}`}>
                  {isLast ? "Finish Quiz" : "Next Question"} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
};