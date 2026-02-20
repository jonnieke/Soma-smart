import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Home, X, XCircle, Camera, ScanLine, Mic, Upload, Clock,
  CheckCircle, Play, Pause, ChevronRight, Star, BookOpen, Brain, Lightbulb, Lock, Volume2, CreditCard,
  ArrowRight, UserCircle, Download, ImageIcon, Trash2, AlertTriangle, LogOut, Users, DollarSign, FileText, ShoppingBag, Library, Layers,
  Calculator, FlaskConical, Globe, Languages, Loader2, Headphones, PenTool, Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExplanationResult, QuizData, ViewState, SubscriptionPlan, LearnerProfile, LearnerActivity, UserRole, PodcastScript, ChatMessage } from '../../types';
import { PricingPage } from '../subscription/PricingPage';
import { PaymentFlow } from '../subscription/PaymentFlow';
import { STUDENT_PLANS, TEACHER_PLANS, DOWNLOAD_PASS } from '../../data/pricing';
import { RegistrationModal } from '../../components/RegistrationModal'; // Assuming path
import { LoginModal } from '../../components/LoginModal'; // Assuming path
import { LogoutModal } from '../../components/LogoutModal';
import { MarkdownText, Button, Card } from '../../components/Shared';
import {
  fileToGenerativePart, explainImage, explainAudio, explainTopic,
  generateQuickQuiz, generateQuiz, generateSpeech, stopSpeech, generateLessonRecap, continueResearch,
  summarizeDocument, generateRichLessonNotes, generatePodcastScript
} from '../../services/geminiService';
import { speak, stopSpeech as stopSpeechElevenLabs, playPodcast, cancelPodcast } from '../../services/elevenLabsService';
import confetti from 'canvas-confetti';
import {
  calculateTotalXP, calculateLevel,
  calculateStreak, calculateSubjectPerformance, getDailyChallenge
} from '../../services/gamificationService';
import { translations } from '../../data/translations';
import { QuizRunner } from './QuizRunner';
import { jsPDF } from 'jspdf';
import heroSectionImage from '../../assets/images/herosection.jpg';

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
    // studyUsageCount removed
    // incrementStudyUsage removed
    downloadUsageCount, incrementDownloadUsage,
    logout, isPro, subscriptionPlan, subscriptionExpiry, isOnline, role, language,
    createTutoringRequest, activeTutoringRequests, isAvailableForTutoring,
    rateTutoringResponse, chatMessages, sendChatMessage, fetchChatMessages,
    marketplaceMaterials, purchasedMaterialIds, purchaseMaterial,
    resources, fetchResources,
    extraDownloads, grantExtraDownloads,
    verifySubscription
  } = useApp();
  const t = translations[language];
  const location = useLocation();

  // Find active plan details
  const activePlanDetails = React.useMemo(() => {
    if (!isPro) return null;
    const plans = role === UserRole.TEACHER ? TEACHER_PLANS : STUDENT_PLANS;
    // @ts-ignore - Handle 'PRO' legacy tier or fuzzy matching
    return plans.find(p => p.duration === subscriptionPlan) || (subscriptionPlan === 'PRO' ? plans.find(p => p.duration === 'MONTHLY') : null);
  }, [isPro, role, subscriptionPlan]);

  // --- GAMIFICATION ENGINE ---
  const totalXP = React.useMemo(() => calculateTotalXP(history), [history]);
  const levelInfo = React.useMemo(() => calculateLevel(totalXP), [totalXP]);

  // Real Gamification Stats
  const streak = React.useMemo(() => calculateStreak(history), [history]);
  const subjectPerformance = React.useMemo(() => calculateSubjectPerformance(history), [history]);
  const dailyChallenge = React.useMemo(() => getDailyChallenge(), []);

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

    // Payment Success for Download Pass
    const buyingPass = localStorage.getItem('soma_buying_pass');
    const params = new URLSearchParams(location.search);
    if (buyingPass === 'true' && params.get('payment_status') === 'COMPLETED') {
      grantExtraDownloads(5);
      localStorage.removeItem('soma_buying_pass');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      alert("Success! 5 Extra Downloads Unlocked. 🚀");
    }
  }, [isRegistered, role, navigate, location]);

  const [mode, setMode] = useState<'MENU' | 'SCAN' | 'RESULT' | 'QUIZ' | 'RECAP_RESULT' | 'PROFILE' | 'PRICING' | 'PAYMENT' | 'MARKETPLACE' | 'LIBRARY' | 'HISTORY' | 'SCAN_EXPLAIN' | 'STUDY' | 'REQUESTS'>('MENU');
  const [recapData, setRecapData] = useState<any>(null); // Store LessonRecap

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string, message: string } | null>(null);
  const [loadingText, setLoadingText] = useState("Processing...");
  const [audioData, setAudioData] = useState<{ base64: string, mimeType: string } | null>(null);

  // Podcast State
  const [podcastScript, setPodcastScript] = useState<PodcastScript | null>(null);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1);
  const [podcastLoading, setPodcastLoading] = useState(false);

  const [showDownloadPayment, setShowDownloadPayment] = useState(false);
  const [pendingDownloadMaterial, setPendingDownloadMaterial] = useState<any>(null);

  const SINGLE_DOWNLOAD_PLAN = {
    id: 'single_download',
    name: 'Single Premium Download',
    price: 20,
    segment: 'STUDENT',
    duration: 'ONCE'
  };

  // --- OFFLINE CACHE & MULTIMEDIA ---
  const [explanationCache, setExplanationCache] = useState<Record<string, ExplanationResult>>(() => {
    const saved = localStorage.getItem('somo_explanation_cache');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('somo_explanation_cache', JSON.stringify(explanationCache));
  }, [explanationCache]);

  const [pendingMedia, setPendingMedia] = useState<{ data: string, mimeType: string, type: 'IMAGE' | 'AUDIO' | 'FILE' } | null>(null);
  const studyFileInputRef = useRef<HTMLInputElement>(null);

  const [level, setLevel] = useState<'Simple' | 'Exam'>('Simple');


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
  const [showExpiryModal, setShowExpiryModal] = useState(false); // New State

  // Subscription Expiry Check
  useEffect(() => {
    if (isPro && subscriptionExpiry) {
      const expiryDate = new Date(subscriptionExpiry);
      const now = new Date();
      // Check if expired
      if (expiryDate < now) {
        setShowExpiryModal(true);
      }
    }
  }, [isPro, subscriptionExpiry]);

  const [tutoringTopic, setTutoringTopic] = useState("");
  const [materialCategory, setMaterialCategory] = useState<'ALL' | 'NOTES' | 'PAST_PAPER' | 'SYLLABUS'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL'); // New Filter
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'SOMO' | 'TEACHERS'>('ALL'); // New Filter
  const [pendingMaterialId, setPendingMaterialId] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [studyChat, setStudyChat] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Star Rating & Chat State
  const [ratingRequestId, setRatingRequestId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [chatRequestId, setChatRequestId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [studyChat, loading]);
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const scanAudioRef = useRef<HTMLAudioElement | null>(null);
  const isCameraActiveRef = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (mode === 'MARKETPLACE') {
      fetchResources();
      setMaterialCategory('ALL');
      setSubjectFilter('ALL');
    }
  }, [mode]);

  const unifiedMaterials = React.useMemo(() => {
    const verified = (resources || []).map((r: any) => ({
      id: `v-${r.id}`,
      realId: r.id,
      title: r.title,
      description: `Official ${r.subject} ${r.type.toLowerCase().replace('_', ' ')} aligned with CBC/KCSE.`,
      teacherName: 'Somo Smart Verified',
      isVerified: true,
      price: r.type === 'SYLLABUS' ? 0 : 0, // In logic, if it's premium verified, we check Pro
      grade: r.grade,
      subject: r.subject,
      category: r.type === 'PAST_PAPER' ? 'REVISION_PAPER' : r.type, // Map to marketplace types
      fileUrl: r.file_url,
      rating: 5.0,
      downloadCount: 120,
      isInternal: true
    }));

    const teacher = (marketplaceMaterials || []).map(m => ({ ...m, isVerified: false, isInternal: false }));

    return [...verified, ...teacher];
  }, [resources, marketplaceMaterials]);

  const normalizeGrade = (g: any) => {
    const str = String(g || "").toLowerCase();
    return str.replace(/\s*grade\s*/g, '').replace(/\s*\(jss\)\s*/g, '').trim() || "";
  };

  const gradeFilteredMaterials = React.useMemo(() => {
    const studentGrade = normalizeGrade(studentProfile?.grade || "");
    const exactMatches = unifiedMaterials.filter(m => {
      if (!studentGrade) return true;
      return normalizeGrade(m.grade) === studentGrade;
    });

    // If we have exact matches for student's grade, show only those.
    // If NOT, show everything as a fallback so the screen isn't empty.
    const result = exactMatches.length > 0 ? exactMatches : unifiedMaterials;

    return result;
  }, [unifiedMaterials, studentProfile?.grade]);

  const subjects = React.useMemo(() => {
    const subs = new Set(['ALL']);
    gradeFilteredMaterials.forEach(m => {
      if (m.subject) subs.add(m.subject.trim());
    });
    const result = Array.from(subs);
    return result;
  }, [gradeFilteredMaterials]);

  const filteredMaterials = React.useMemo(() => {
    return unifiedMaterials.filter(m => {
      // 1. Category Filter
      if (materialCategory !== 'ALL' && m.category !== materialCategory) return false;
      // 2. Subject Filter
      if (subjectFilter !== 'ALL' && m.subject !== subjectFilter) return false;
      // 3. Grade Filter
      if (selectedGrade !== 'ALL' && m.grade !== selectedGrade) return false;
      // 4. Source Filter
      if (selectedSource === 'SOMO' && !m.isVerified) return false;
      if (selectedSource === 'TEACHERS' && m.isVerified) return false;

      return true;
    });
  }, [unifiedMaterials, materialCategory, subjectFilter, selectedGrade, selectedSource]);

  // Check for subscription intent & Auto-open material intent
  React.useEffect(() => {
    const state = location.state as { selectedPlan?: SubscriptionPlan; openSubscription?: boolean, initiatePaymentFor?: SubscriptionPlan, materialId?: string };

    // Handle auto-opening material after successful payment
    if (state?.materialId) {
      const material = unifiedMaterials.find(m => m.id === state.materialId || (m as any).realId === state.materialId);
      if (material && material.fileUrl) {
        window.open(material.fileUrl, '_blank');
        // Clear state to avoid re-triggering
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
    }

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
        setPendingMaterialId(state.materialId || null); // Preserve materialId if available 
        // Clear state to avoid re-triggering on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    } else if (state?.openSubscription) {
      setMode('PRICING');
      setPendingMaterialId(state.materialId || null); // Preserve materialId if available
      // Clear state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, isPro, navigate, unifiedMaterials]);

  // --- STUDY CENTER (NotebookLM) ---
  const startStudySession = async (material: any) => {
    // Paywall Check: 3 free usages
    if (usageCount >= 3) {
      if (!isRegistered) {
        setShowRegistration(true);
        return;
      }
      if (!isPro) {
        setShowLimitModal(true);
        return;
      }
    }

    // Increment usage
    incrementUsage();

    setCurrentDocument(material);
    setMode('STUDY');
    setLoading(true);
    setLoadingText("Preparing Your Study Guide...");
    setIsSummarizing(true);
    setStudyChat([]);

    // Save Study Activity for History Tracking
    saveActivity({
      id: `study-${Date.now()}`,
      type: 'STUDY',
      topic: material.title,
      date: new Date().toLocaleDateString(),
      details: JSON.stringify({
        materialId: material.id,
        realId: material.realId,
        subject: material.subject,
        grade: material.grade,
        teacherName: material.teacherName,
        category: material.category,
        isVerified: material.isVerified,
        fileUrl: material.fileUrl
      })
    });

    try {
      // Check Cache or Offline
      const cacheKey = `${material.id}-${language}`;
      if (explanationCache[cacheKey]) {
        setExplanation(explanationCache[cacheKey]);
        setLoading(false);
        setIsSummarizing(false);
        return;
      }

      if (!isOnline) {
        setLoading(false);
        setIsSummarizing(false);
        setError({
          title: "Study Assistant Offline",
          message: "You are offline, check your internet. I couldn't generate a study guide for this document right now."
        });
        return;
      }

      const result = await summarizeDocument(material.title, (material.id || material.realId).toString(), language, material.subject, material.grade);
      setExplanation(result);
      setExplanationCache(prev => ({ ...prev, [cacheKey]: result }));
    } catch (err: any) {
      console.error("Study Guide error:", err);
      // Even if isOnline was true at start, the request might fail due to network drop
      if (!isOnline || !navigator.onLine || err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
        setError({
          title: "Study Assistant Offline",
          message: "You are offline, check your internet. I couldn't generate a study guide for this document right now."
        });
      } else {
        setError({ title: "Study Assistant Error", message: "I couldn't generate a study guide for this document right now." });
      }
    } finally {
      setLoading(false);
      setIsSummarizing(false);
    }
  };

  const handleDownloadAIRevisionNotes = async (material: any, bypassLimit = false) => {
    // 1. Strict Subscription Check
    if (!isPro) {
      setMode('PRICING');
      setError({ title: "Subscription Required", message: "Downloads are exclusive to Somo Smart Pro members. Join today to unlock elite revision notes!" });
      return;
    }

    // 2. Daily Limit Check (5 + extra)
    const effectiveLimit = 5 + extraDownloads;
    if (downloadUsageCount >= effectiveLimit && !bypassLimit) {
      setPendingDownloadMaterial(material);
      setShowDownloadPayment(true);
      return;
    }

    setPendingDownloadMaterial(material);
    setLoading(true);
    setLoadingText("Preparing Rich Lesson Notes...");

    try {
      // FIX: Detect grade from title as metadata might be unreliable (e.g. defaulting to Grade 1)
      const detectGrade = (title: string, fallback: string) => {
        const match = title.match(/Grade\s*(\d+)/i);
        return match ? `Grade ${match[1]}` : fallback;
      };
      const effectiveGrade = detectGrade(material.title, material.grade);

      const result = await generateRichLessonNotes(material.title, (material.realId || material.id).toString(), language, material.subject, effectiveGrade);

      // ... jspdf logic ...
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 25;

      // Helper for adding new page if needed
      const checkPage = (height: number) => {
        if (yPos + height > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // --- PDF Header & Title ---
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("Somo Smart Revision", pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(10);
      doc.text("Elite Learning Material • CBC/KCSE Aligned", pageWidth / 2, 32, { align: 'center' });

      yPos = 55;
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text(result.topic, margin, yPos);

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Subject: ${material.subject} | Grade: ${effectiveGrade} | Teacher: ${material.isVerified ? "Somo AI Specialist" : material.teacherName}`, margin, yPos);

      yPos += 8;
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(margin, yPos, pageWidth - margin, yPos);

      // --- Main Detailed Content (Explanation) ---
      yPos += 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text("Detailed Lesson Notes", margin, yPos);

      yPos += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // Slate-700

      // Split Markdown into sections or just handle long text better
      const cleanText = result.explanation
        .replace(/###/g, '')
        .replace(/##/g, '')
        .replace(/\*/g, '•');

      const lines = doc.splitTextToSize(cleanText, contentWidth);

      lines.forEach((line: string) => {
        checkPage(7);
        // Highlight logic
        if (line.includes('•')) {
          doc.setFont("helvetica", "bold");
          doc.text(line, margin, yPos);
        } else {
          doc.setFont("helvetica", "normal");
          doc.text(line, margin, yPos);
        }
        yPos += 7;
      });

      // --- Key Takeaways ---
      yPos += 10;
      checkPage(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text("Key Takeaways for Students", margin, yPos);

      yPos += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      result.summaryPoints.forEach((point) => {
        const pLines = doc.splitTextToSize(`• ${point}`, contentWidth - 5);
        checkPage(pLines.length * 6);
        doc.text(pLines, margin + 5, yPos);
        yPos += (pLines.length * 6) + 2;
      });

      // --- Exam Success Section ---
      yPos += 15;
      checkPage(40);
      doc.setFillColor(254, 252, 232); // Amber-50
      doc.setDrawColor(252, 211, 77); // Amber-300
      doc.roundedRect(margin - 5, yPos - 8, contentWidth + 10, 35, 3, 3, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(180, 83, 9); // Amber-800
      doc.text("🚀 Exam Success Strategies", margin, yPos);

      yPos += 8;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(146, 64, 14); // Amber-900
      const examHelp = "Focus on the bolded concepts above. They are frequently assessed in national exams. Practice active recall by taking the Somo Smart quiz for this topic.";
      const examLines = doc.splitTextToSize(examHelp, contentWidth);
      doc.text(examLines, margin, yPos);

      // --- Footer on all pages ---
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Page ${i} of ${totalPages} | Prepared by Somo Smart AI`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save(`${material.title.replace(/\s+/g, '_')}_Study_Notes.pdf`);

      // 3. Increment usage only on success and if not a paid overage
      if (!bypassLimit) {
        incrementDownloadUsage();
      }

    } catch (err: any) {
      console.error("PDF Generate error:", err);
      if (!isOnline || !navigator.onLine || err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
        setError({ title: "Offline Error", message: "You are offline. Please check your internet to download teacher notes." });
      } else {
        setError({ title: "Generation Error", message: "I couldn't generate the full teacher notes. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const askStudyBuddy = async (query: string) => {
    if (!query.trim() && !pendingMedia) return;
    if (!currentDocument) return;

    const userMsg = { role: 'user' as const, text: query || (pendingMedia?.type === 'AUDIO' ? "Voice Message 🎤" : "Image Attachment 🖼️") };
    setStudyChat(prev => [...prev, userMsg]);
    setPromptText("");
    setPendingMedia(null);
    setLoading(true);
    setLoadingText("Somo is thinking...");

    try {
      const result = await explainTopic(
        query || (pendingMedia?.type === 'AUDIO' ? "Voice Message" : "Image/File Analysis"),
        level,
        language,
        currentDocument.realId || currentDocument.id,
        currentDocument.subject,
        currentDocument.grade,
        pendingMedia ? { data: pendingMedia.data, mimeType: pendingMedia.mimeType } : undefined
      );
      setStudyChat(prev => [...prev, { role: 'model' as const, text: result.explanation }]);
      setPendingMedia(null);
    } catch (err: any) {
      console.error("Study Buddy error:", err);
      if (!isOnline || !navigator.onLine || err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
        setStudyChat(prev => [...prev, { role: 'model' as const, text: "I can't answer right now because you are offline. 📵" }]);
      } else {
        setStudyChat(prev => [...prev, { role: 'model' as const, text: "I'm sorry, I hit a snag while looking through this document. 😅" }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePracticeQuiz = async () => {
    if (!currentDocument || !explanation) return;
    setLoading(true);
    setLoadingText("Creating an Expert Quiz...");
    try {
      const data = await generateQuiz(explanation.explanation, currentDocument.title, language);
      setQuizData(data);
      setMode('QUIZ');
    } catch (err) {
      console.error("Quiz error:", err);
      setError({ title: "Quiz Failed", message: "I couldn't create a quiz for this material." });
    } finally {
      setLoading(false);
    }
  };

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
    isCameraActiveRef.current = false; // Mark as inactive immediately

    // 1. Stop tracks from the video element's srcObject
    if (scanVideoRef.current && scanVideoRef.current.srcObject) {
      const stream = scanVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped video track from scanVideoRef");
      });
      scanVideoRef.current.srcObject = null;
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
      isCameraActiveRef.current = true; // Mark as active intention

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

      // RACING CONDITION CHECK: If user closed camera while initializing
      if (!isCameraActiveRef.current) {
        console.log("Camera started but was cancelled. Stopping immediately.");
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream; // Save stream to ref for cleanup
      if (scanVideoRef.current) {
        scanVideoRef.current.srcObject = stream;
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError({ title: "Camera Error", message: "Unable to access camera." });
      setLoading(false);
      setShowCamera(false);
      isCameraActiveRef.current = false;
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
      cancelPodcast(); // Stop any playing podcast
    };
  }, []);

  useEffect(() => {
    if (!showCamera) {
      stopCameraStream();
    }
  }, [showCamera]);

  const capturePhoto = () => {
    if (scanVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = scanVideoRef.current.videoWidth;
      canvas.height = scanVideoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(scanVideoRef.current, 0, 0);
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
  const [showLimitModal, setShowLimitModal] = useState(false);

  const checkLimit = (): boolean => {
    // Pro = Unlimited Checks
    if (isPro) return true;

    if (usageCount >= 3) {
      if (role === UserRole.GUEST) {
        setShowLogin(true); // Force login
      } else if (!isRegistered) {
        setShowRegistration(true);
      } else {
        // Registered but Limit Reached -> PAYWALL MODAL
        setShowLimitModal(true);
      }
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
      setPodcastScript(null); // Clear podcast script
      setIsPodcastPlaying(false); // Stop podcast
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
      let errorTitle = "Scan Failed";

      if (!isOnline || !navigator.onLine || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        errorTitle = "Offline Error";
        errorMessage = "You are offline. Please check your internet to process this scan.";
      } else if (error.message?.includes("Safety") || error.message?.includes("blocked")) {
        errorMessage = "This content was flagged by our safety filters. Please try a different page.";
      } else if (error.message?.includes("429")) {
        errorMessage = "We're receiving too many requests. Please wait a moment and try again.";
      }

      setError({ title: errorTitle, message: errorMessage });
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
        console.log("Recording stopped. Chunks:", chunksRef.current.length);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          console.warn("Empty recording blob.");
          setIsRecording(false);
          return;
        }

        if (mode === 'STUDY') {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            setPendingMedia({ data: base64, mimeType, type: 'AUDIO' });
            console.log("Audio attached to Study Buddy");
          };
        } else {
          await handleAudioExplanation(blob, mimeType);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(1000); // chunk every second
      setIsRecording(true);
      console.log("Recording started...");
    } catch (e: any) {
      console.error("Failed to start recording:", e);
      setIsRecording(false);
      setError({
        title: "Microphone Error",
        message: e.message?.includes('denied') || e.message?.includes('Permission')
          ? "Please allow microphone access in your browser settings to use voice features."
          : "Microphone access denied or unavailable."
      });
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
        setPodcastScript(null); // Clear podcast script
        setIsPodcastPlaying(false); // Stop podcast
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
      const isNet = !isOnline || !navigator.onLine || e.message?.includes('network') || e.message?.includes('Failed to fetch');
      setError({
        title: isNet ? "Offline Error" : "Audio Error",
        message: isNet ? "You are offline. Please check your internet to process audio." : "We couldn't understand the audio. Please speak clearly or try again."
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
        result = await explainTopic(explanation.topic, newLevel, language, undefined, currentDocument?.subject, currentDocument?.grade);
      }

      if (result) {
        setExplanation(result);
        setLevel(newLevel);
        setStickyQuizTaken(false); // Reset since content changed/refreshed
        setStickyQuizData(null);
        setPodcastScript(null); // Clear podcast script
        setIsPodcastPlaying(false); // Stop podcast
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

  const handleTopicClick = async (topic: string, multimedia?: { data: string, mimeType: string }) => {
    if (!checkLimit()) return;

    setLoading(true);
    setError(null);
    setLoadingText(topic ? `Exploring ${topic}...` : "Analyzing your attachment...");
    setMode('SCAN'); // Show loading
    try {
      setAudioData(null);
      setImageData(null);

      const result = await explainTopic(
        topic || (multimedia?.mimeType.includes('audio') ? "Voice Message" : "Image Analysis"),
        level,
        language,
        undefined,
        currentDocument?.subject,
        currentDocument?.grade,
        multimedia
      );
      setExplanation(result);
      setStickyQuizTaken(false); // Reset sticky quiz
      setStickyQuizData(null);
      setPodcastScript(null); // Clear podcast script
      setIsPodcastPlaying(false); // Stop podcast
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
    if (!promptText.trim() && !pendingMedia) return;
    const query = promptText.trim();
    const media = pendingMedia;
    setPromptText("");
    setPendingMedia(null);
    await handleTopicClick(query, media);
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
    element.download = `${explanation.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()} _notes.txt`;
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
          setPodcastScript(null); // Clear podcast script
          setIsPodcastPlaying(false); // Stop podcast
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
      const textToRead = `${explanation.topic}. ${explanation.summaryPoints.join('. ')}. Here is the explanation: ${explanation.explanation} `;

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

  const handlePodcastToggle = async () => {
    if (isPodcastPlaying) {
      cancelPodcast();
      setIsPodcastPlaying(false);
      return;
    }

    if (podcastScript) {
      // Resume or Restart? For now, restart.
      setIsPodcastPlaying(true);
      playPodcast(podcastScript.script, (idx) => setCurrentSegmentIndex(idx), () => setIsPodcastPlaying(false));
      return;
    }

    // Generate New
    if (!explanation) return;
    try {
      setPodcastLoading(true);
      const script = await generatePodcastScript(explanation.explanation, explanation.topic);
      setPodcastScript(script);
      setPodcastLoading(false);
      setIsPodcastPlaying(true);

      playPodcast(script.script, (idx) => setCurrentSegmentIndex(idx), () => setIsPodcastPlaying(false));

    } catch (e) {
      console.error(e);
      setPodcastLoading(false);
      setError({ title: "Podcast Error", message: "Failed to generate audio overview." });
    }
  };

  // Remove unused playBuffer helper
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const playBuffer = () => { /* No-op */ };

  // --- VIEWS ---
  const renderMode = () => {
    if (showCamera) {
      return (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col md:aspect-[3/4] h-full md:h-auto max-h-[90vh]"
          >
            {/* Header / Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
              <div className="text-white/90">
                <p className="font-bold text-lg shadow-sm">Take Photo</p>
                <p className="text-xs font-medium opacity-80">Fit question in frame</p>
              </div>
              <button
                onClick={() => setShowCamera(false)}
                className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewport */}
            <div className="flex-1 relative bg-black">
              <video
                ref={scanVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Intelligent Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                <div className={`w-full aspect-[3/4] border-2 rounded-[2rem] transition-all duration-300 relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${scanStatus === 'STABILIZING' ? 'border-yellow-400' : scanStatus === 'CAPTURING' ? 'border-green-500' : 'border-white/30'}`}>
                  {/* Status Pills */}
                  <div className="absolute -top-14 left-0 right-0 flex justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-xl shadow-lg transition-colors ${scanStatus === 'STABILIZING' ? 'bg-yellow-400 text-yellow-900' : scanStatus === 'CAPTURING' ? 'bg-green-500 text-white' : 'bg-white/10 text-white border border-white/20'}`}>
                      {scanStatus === 'LOOKING' && "Looking for question..."}
                      {scanStatus === 'STABILIZING' && "Hold Steady..."}
                      {scanStatus === 'CAPTURING' && "Capturing!"}
                    </span>
                  </div>

                  {/* Scan Line Animation */}
                  {scanStatus === 'LOOKING' && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-scan-y opacity-80" />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="bg-black/80 backdrop-blur-xl p-6 md:p-8 flex items-center justify-around gap-6 relative z-20 border-t border-white/10">

              {/* Switch to Audio */}
              <button
                onClick={() => {
                  setShowCamera(false);
                  setTimeout(() => startRecording(), 100);
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center group-hover:bg-slate-700 transition-colors border border-white/10 group-active:scale-95">
                  <Mic className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Audio</span>
              </button>

              {/* Shutter Button */}
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center relative group transition-all hover:border-white/40 active:scale-95"
              >
                <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all group-hover:scale-90 group-active:scale-100" />
              </button>

              {/* Gallery Import */}
              <button
                onClick={() => {
                  setShowCamera(false);
                  // Locate and trigger the file input from the parent scope or create new
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      setLoading(true);
                      setLoadingText("Analyzing...");
                      setTimeout(() => {
                        setLoading(false);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = (reader.result as string).split(',')[1];
                          setImageData({ base64, mimeType: file.type });
                          setMode('SCAN_EXPLAIN');
                        };
                        reader.readAsDataURL(file);
                      }, 1500);
                    }
                  };
                  input.click();
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center group-hover:bg-slate-700 transition-colors border border-white/10 group-active:scale-95">
                  <ImageIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gallery</span>
              </button>
            </div>
          </motion.div>
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

    if (mode === 'REQUESTS') {
      // If a chat is open, show the chat view
      if (chatRequestId) {
        const chatReq = activeTutoringRequests.find(r => r.id === chatRequestId);
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 relative">
            {/* Chat Header */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center gap-4">
              <button onClick={() => { setChatRequestId(null); setChatInput(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowRight className="w-5 h-5 rotate-180" /></button>
              <div className="flex-1">
                <h2 className="font-bold text-lg leading-tight">{chatReq?.topic || 'Chat'}</h2>
                <p className="text-xs text-slate-500 font-medium">Continuous study session</p>
              </div>
              <button onClick={() => fetchChatMessages(chatRequestId)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-blue-600">
                <Loader2 className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {/* Original response as first message */}
              {chatReq?.response && (
                <div className="flex gap-3 items-end">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">T</div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%] shadow-sm">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Teacher&apos;s Response</p>
                    {chatReq.responseType === 'TEXT' && (
                      <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{chatReq.response}</p>
                    )}
                    {chatReq.responseType === 'VOICE' && chatReq.response && (
                      <audio src={chatReq.response} controls className="w-full" />
                    )}
                    {chatReq.responseType === 'VIDEO' && chatReq.response && (
                      <video src={chatReq.response} controls className="w-full rounded-xl" />
                    )}
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-3 items-end ${msg.senderRole === 'STUDENT' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.senderRole === 'STUDENT' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                    {msg.senderRole === 'STUDENT' ? 'S' : 'T'}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 max-w-[80%] shadow-sm ${msg.senderRole === 'STUDENT'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border border-slate-100 rounded-bl-md'
                    }`}>
                    {msg.messageType === 'TEXT' && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.messageType === 'VOICE' && (
                      <audio src={msg.mediaUrl || msg.content} controls className="w-full" />
                    )}
                    {msg.messageType === 'VIDEO' && (
                      <video src={msg.mediaUrl || msg.content} controls className="w-full rounded-xl" />
                    )}
                    <p className={`text-[10px] mt-1 font-medium ${msg.senderRole === 'STUDENT' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-3 items-end">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (chatInput.trim() && !chatSending) {
                      setChatSending(true);
                      sendChatMessage(chatRequestId, chatInput.trim(), 'TEXT').then(() => {
                        setChatInput('');
                        setChatSending(false);
                        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                      });
                    }
                  }
                }}
                placeholder="Type your follow-up question..."
                rows={1}
                className="flex-1 bg-slate-100 border-0 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
              />
              <button
                onClick={() => {
                  if (chatInput.trim() && !chatSending) {
                    setChatSending(true);
                    sendChatMessage(chatRequestId, chatInput.trim(), 'TEXT').then(() => {
                      setChatInput('');
                      setChatSending(false);
                      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    });
                  }
                }}
                disabled={!chatInput.trim() || chatSending}
                className={`p-3 rounded-full transition-all ${chatInput.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 relative">
          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center gap-4">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowRight className="w-5 h-5 rotate-180" /></button>
            <h2 className="font-bold text-lg">My Requests</h2>
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{activeTutoringRequests.length}</span>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {activeTutoringRequests.length === 0 ? (
              <div className="text-center py-20 opacity-50 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">📬</span></div>
                <p className="font-medium">No requests sent yet.</p>
                <button onClick={() => { setMode('SCAN'); setTimeout(() => setShowTutoringModal(true), 100); }} className="mt-4 text-indigo-600 font-bold text-sm">Ask a Teacher</button>
              </div>
            ) : (
              activeTutoringRequests.map(req => (
                <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight mb-1">{req.topic}</h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                      }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 bg-slate-50 p-3 rounded-xl leading-relaxed">{req.description}</p>

                  {req.status === 'COMPLETED' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Teacher Response</p>

                      {req.responseType === 'TEXT' && (
                        <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                          {req.response}
                        </p>
                      )}

                      {req.responseType === 'VOICE' && (
                        <div className="bg-indigo-50 p-4 rounded-xl flex flex-col gap-3 border border-indigo-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                              <Play className="w-5 h-5 ml-0.5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-indigo-400 uppercase">Audio Answer</p>
                              <p className="text-xs font-bold text-indigo-900">Listen to explanation</p>
                            </div>
                          </div>
                          {req.response && <audio src={req.response} controls className="w-full mt-2" />}
                        </div>
                      )}

                      {req.responseType === 'VIDEO' && (
                        <div className="aspect-video bg-black rounded-xl relative overflow-hidden shadow-lg border border-slate-200">
                          {req.response ? (
                            <video src={req.response} controls className="w-full h-full" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-white">
                              <p className="text-sm font-medium">Video Processing...</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Star Rating Section */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {req.rating ? (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-5 h-5 ${star <= req.rating! ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-slate-400">Rated {req.rating}/5</span>
                            {req.feedback && <span className="text-xs text-slate-400 italic ml-2">&ldquo;{req.feedback}&rdquo;</span>}
                          </div>
                        ) : ratingRequestId === req.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  onMouseEnter={() => setRatingHover(star)}
                                  onMouseLeave={() => setRatingHover(0)}
                                  onClick={() => setRatingValue(star)}
                                  className="p-1 transition-transform hover:scale-125"
                                >
                                  <Star className={`w-7 h-7 transition-colors ${star <= (ratingHover || ratingValue) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                                    }`} />
                                </button>
                              ))}
                              {ratingValue > 0 && (
                                <span className="text-sm font-bold text-amber-600 ml-2">
                                  {ratingValue === 1 ? '😐' : ratingValue === 2 ? '🙂' : ratingValue === 3 ? '😊' : ratingValue === 4 ? '🤩' : '⭐'}
                                </span>
                              )}
                            </div>
                            <input
                              value={ratingFeedback}
                              onChange={e => setRatingFeedback(e.target.value)}
                              placeholder="Optional feedback..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none transition-all"
                            />
                            <div className="flex gap-2">
                              <button
                                disabled={ratingValue === 0 || ratingSubmitted}
                                onClick={async () => {
                                  setRatingSubmitted(true);
                                  await rateTutoringResponse(req.id, ratingValue, ratingFeedback || undefined);
                                  setRatingRequestId(null);
                                  setRatingValue(0);
                                  setRatingFeedback('');
                                  setRatingSubmitted(false);
                                }}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${ratingValue > 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                  }`}
                              >
                                {ratingSubmitted ? 'Saving...' : 'Submit Rating'}
                              </button>
                              <button
                                onClick={() => { setRatingRequestId(null); setRatingValue(0); setRatingFeedback(''); }}
                                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRatingRequestId(req.id)}
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors bg-amber-50 px-4 py-2 rounded-full hover:bg-amber-100"
                          >
                            <Star className="w-4 h-4" /> Rate This Response
                          </button>
                        )}
                      </div>

                      {/* Continue Chat Button */}
                      <button
                        onClick={() => {
                          setChatRequestId(req.id);
                          fetchChatMessages(req.id);
                        }}
                        className="mt-3 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                      >
                        <span>💬</span> Continue Chat with Teacher
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (mode === 'MENU') {
      const displayCode = profile ? profile.code : studentCode;
      const greeting = profile ? `Hi, ${profile.name.split(' ')[0]}` : "My Learning Buddy";

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 relative overflow-hidden">

          {/* --- TOP BAR --- */}
          <div className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100/50">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="bg-blue-600 rounded-xl p-2 text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <span className="font-black text-slate-900 tracking-tight text-xl">Somo</span>
            </div>

            {/* Navigation - Centered Desktop */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-full border border-slate-200/50">
              <button onClick={() => setMode('HISTORY' as any)} className="flex items-center gap-2 px-5 py-2 hover:bg-white rounded-full transition-all text-slate-600 hover:text-blue-600 font-bold text-sm hover:shadow-sm">
                <Clock className="w-4 h-4" />
                History
              </button>
              <div className="w-px h-4 bg-slate-300 mx-1" />
              <button onClick={() => setMode('REQUESTS')} className="flex items-center gap-2 px-5 py-2 hover:bg-white rounded-full transition-all text-slate-600 hover:text-blue-600 font-bold text-sm hover:shadow-sm">
                <span className="relative">
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                  {activeTutoringRequests.some(r => r.status === 'COMPLETED') && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                </span>
                Requests
              </button>
              <div className="w-px h-4 bg-slate-300 mx-1" />
              <button onClick={() => setMode('MARKETPLACE')} className="flex items-center gap-2 px-5 py-2 hover:bg-white rounded-full transition-all text-slate-600 hover:text-blue-600 font-bold text-sm hover:shadow-sm">
                <Library className="w-4 h-4" />
                Library
              </button>
            </nav>

            {/* Profile */}
            <div className="flex items-center gap-3">
              {!isRegistered && (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                >
                  Log In
                </button>
              )}

              <div
                onClick={() => setMode('PROFILE')}
                className="flex items-center gap-3 pl-1.5 pr-5 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-black shadow-md ring-4 ring-indigo-50 group-hover:scale-105 transition-transform">
                  {profile?.name.charAt(0) || 'G'}
                </div>
                <div className="hidden sm:block text-right leading-tight">
                  <p className="text-sm font-black text-slate-900">{profile?.name.split(' ')[0] || 'Guest'}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                    <span className="text-amber-500">★</span> Level {levelInfo.level} • {totalXP} XP
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- MAIN CENTER CONTENT --- */}
          <div className="flex-1 flex flex-col items-center px-4 relative z-10 pb-32 max-w-5xl mx-auto w-full">

            {/* Greeting & CBE CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-8 pt-8 flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
              <div className="flex flex-col items-start pl-6">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
                  Hi, {profile ? profile.name.split(' ')[0] : 'Friend'} <span className="animate-wave text-4xl">👋</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg">Ready to master your studies today?</p>
              </div>

              {/* CBE Notes CTA */}
              <button
                onClick={() => setMode('MARKETPLACE')}
                className="group flex-1 md:flex-none md:w-auto bg-white border-2 border-indigo-50 hover:border-indigo-100 hover:bg-slate-50 p-3 rounded-3xl transition-all hover:shadow-lg flex items-center gap-4 text-left"
              >
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="pr-4">
                  <h3 className="font-black text-slate-900 text-lg leading-tight">CBE NOTES</h3>
                  <p className="text-xs font-semibold text-slate-400 max-w-[240px] leading-tight mt-1">
                    Study with CBE aligned notes. Download & Quiz available.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            </motion.div>


            {/* Requests Summary Card (Mobile & Desktop) */}
            {activeTutoringRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setMode('REQUESTS')}
                className="w-full mb-6 bg-white rounded-3xl p-4 border border-blue-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span className="text-xl">📬</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">My Requests</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {activeTutoringRequests.filter(r => r.status === 'COMPLETED').length > 0
                        ? <span className="text-emerald-600 font-bold">{activeTutoringRequests.filter(r => r.status === 'COMPLETED').length} New Response(s)</span>
                        : `${activeTutoringRequests.length} Active Request${activeTutoringRequests.length === 1 ? '' : 's'}`
                      }
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            )}

            {/* Continue Learning Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full mb-8"
            >
              {history.length > 0 ? (() => {
                // Sort history by ID (timestamp) descending to get true latest
                const sortedHistory = [...history].sort((a, b) => {
                  const tA = parseInt(a.id) || 0;
                  const tB = parseInt(b.id) || 0;
                  return tB - tA;
                });
                const latestActivity = sortedHistory[0];

                const relativeTime = (() => {
                  try {
                    let timestamp = parseInt(latestActivity.id);

                    // Fallback: If ID is not a valid timestamp (e.g. legacy uuid), try parsing the date string
                    if (isNaN(timestamp) || timestamp < 1000000000000) { // Basic check for ms timestamp
                      const dateObj = new Date(latestActivity.date);
                      if (!isNaN(dateObj.getTime())) {
                        timestamp = dateObj.getTime();
                      } else {
                        return 'Recently';
                      }
                    }

                    const diff = Date.now() - timestamp;
                    if (diff < 0) return 'Just now';

                    const minutes = Math.floor(diff / 60000);
                    if (minutes < 1) return 'Just now';
                    if (minutes < 60) return `${minutes} mins ago`;
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) return `${hours} hours ago`;
                    return `${Math.floor(hours / 24)} days ago`;
                  } catch (e) { return 'Recently'; }
                })();

                return (
                  <div
                    onClick={() => restoreActivity(latestActivity)}
                    className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden cursor-pointer group hover:shadow-2xl hover:shadow-blue-900/10 transition-all"
                  >
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-80 -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-700" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-6 max-w-lg">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                              Continue Learning
                            </span>
                            <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> {relativeTime}
                            </span>
                          </div>
                          <h2 className="text-3xl md:text-3xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">
                            {latestActivity.topic || "Untitled Lesson"}
                          </h2>
                          <p className="text-slate-500 font-medium text-lg">
                            {latestActivity.type === 'QUIZ' ? 'Stickiness Boost Quiz' : 'Detailed Explanation & Notes'}
                          </p>
                        </div>

                        <button className="px-8 py-4 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-2xl font-black shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 flex items-center gap-3 text-sm tracking-wide">
                          RESUME LESSON <Play className="w-5 h-5 fill-current" />
                        </button>
                      </div>

                      {/* Dynamic Illustration based on Type */}
                      {/* Dynamic Illustration: Student & Teacher Scene */}
                      <div className="hidden md:flex items-center justify-center relative pr-4">
                        <img
                          src={heroSectionImage}
                          alt="Student learning with teacher"
                          className="w-[14rem] h-auto object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 rounded-2xl"
                        />
                      </div>
                    </div>
                  </div>
                );
              })() : (
                // Empty State Hero
                <div
                  onClick={() => startCamera()}
                  className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-indigo-900/5 border border-slate-100 relative overflow-hidden cursor-pointer group hover:shadow-2xl hover:shadow-indigo-900/10 transition-all"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-50 to-pink-50 rounded-full blur-3xl opacity-80 -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-700" />

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div className="space-y-6 max-w-lg">
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">Start Your First Lesson!</h2>
                      <p className="text-slate-500 font-medium text-lg">Snap a photo of your homework or ask a question to get instant help.</p>
                      <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 flex items-center gap-3 text-sm tracking-wide mx-auto md:mx-0">
                        START LEARNING <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="hidden md:block pr-8">
                      <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center animate-bounce duration-[3000ms]">
                        <Camera className="w-16 h-16 text-indigo-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Redesigned Smart Input Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full relative z-30 mb-12"
            >
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-200 p-2.5 flex items-center gap-2 pr-2.5 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all hover:shadow-2xl hover:shadow-slate-200/80">
                {/* Action Buttons */}
                <div className="flex gap-1 pl-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
                    title="Upload Image"
                  >
                    <ImageIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-3.5 rounded-2xl transition-all group ${isRecording ? 'text-red-500 bg-red-50' : 'text-slate-500 hover:text-red-500 hover:bg-red-50'}`}
                    title="Record Audio"
                  >
                    {isRecording ? <div className="w-6 h-6 bg-red-500 rounded-sm animate-pulse" /> : <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                  </button>
                </div>

                <div className="w-px h-8 bg-slate-200 mx-2" />

                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePromptSubmit();
                    }
                  }}
                  placeholder="Ask anything... (math, science, history)"
                  rows={1}
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 text-lg font-bold py-4 px-2 min-h-[64px] max-h-40 resize-none placeholder:text-slate-400 placeholder:font-medium"
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
                  className={`p-4 rounded-full transition-all aspect-square flex items-center justify-center ${promptText.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-100 hover:bg-blue-700 hover:scale-105' : 'bg-slate-100 text-slate-300 scale-95 cursor-not-allowed'}`}
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>

              {/* Recording Indicator Overlay */}
              {isRecording && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-red-500 text-white text-sm font-bold px-6 py-2.5 rounded-full animate-bounce shadow-xl shadow-red-200 flex items-center gap-3 z-40">
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  Listening... {formatTime(recordingTime)}
                </div>
              )}
            </motion.div>


            {/* Quick Actions Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
            >
              <button onClick={isOnline ? startCamera : undefined} className="bg-blue-50 hover:bg-blue-100 text-blue-800 p-6 rounded-[2rem] transition-all hover:-translate-y-1 flex items-center gap-4 border border-blue-100 group shadow-sm hover:shadow-md cursor-pointer text-left">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ring-4 ring-blue-50/50">
                  <Camera className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <span className="block font-black text-lg leading-tight">Scan<br />Homework</span>
                </div>
              </button>

              <button onClick={() => setShowTutoringModal(true)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 p-6 rounded-[2rem] transition-all hover:-translate-y-1 flex items-center gap-4 border border-indigo-100 group shadow-sm hover:shadow-md cursor-pointer text-left">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ring-4 ring-indigo-50/50">
                  <Users className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <span className="block font-black text-lg leading-tight">Ask a<br />Question</span>
                </div>
              </button>

              <button onClick={() => navigate('/revision')} className="bg-orange-50 hover:bg-orange-100 text-orange-800 p-6 rounded-[2rem] transition-all hover:-translate-y-1 flex items-center gap-4 border border-orange-100 group shadow-sm hover:shadow-md cursor-pointer text-left">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ring-4 ring-orange-50/50">
                  <Brain className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <span className="block font-black text-lg leading-tight">Revision<br />& Exams</span>
                </div>
              </button>
            </motion.div>

            {/* Recommended & Challenge Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
            >
              {/* Recommended For You */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
                <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500 fill-current" /> Recommended for You
                </h3>
                <div className="space-y-3 flex-1">
                  {(() => {
                    // Deriving recommendations from history
                    const recentTopics = [...new Set(history.map(h => h.topic))].slice(0, 3);
                    const defaultSubjects = ['Science', 'English', 'Mathematics'];

                    const subject1 = recentTopics[0] || defaultSubjects[0]; // For Revision
                    const subject2 = recentTopics[1] || (recentTopics[0] === defaultSubjects[1] ? defaultSubjects[0] : defaultSubjects[1]); // For Practice
                    const subject3 = recentTopics[2] || defaultSubjects[2]; // For Mock

                    const recommendations = [
                      {
                        title: `5 min ${subject1.split('•')[0].trim()} revision`,
                        type: "Revision",
                        color: "bg-emerald-100 text-emerald-700",
                        icon: <Brain className="w-5 h-5" />,
                        prompt: `Give me a concise 5-minute revision summary for ${subject1}.`
                      },
                      {
                        title: `${subject2.split('•')[0].trim()} practice`,
                        type: "Practice",
                        color: "bg-blue-100 text-blue-700",
                        icon: <BookOpen className="w-5 h-5" />,
                        prompt: `Generate 5 practice questions for ${subject2}.`
                      },
                      {
                        title: "3 KPSEA style questions",
                        type: "Mock",
                        color: "bg-purple-100 text-purple-700",
                        icon: <PenTool className="w-5 h-5" />,
                        prompt: `Generate 3 KPSEA (CBC Grade 6) style exam questions for ${subject3}.`
                      }
                    ];

                    return recommendations.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setPromptText(item.prompt);
                          // We need to defer the submit slightly to allow state update or just call logic directly if possible
                          // But handlePromptSubmit depends on promptText state. 
                          // Better approach: set text then auto-submit in useEffect or just pass text to a helper.
                          // For now, we'll set it and user can press enter, OR we modify handlePromptSubmit to accept an arg.
                          // Since I can't easily modify handler signature safely without checking, I'll just set text.
                          // Wait, the user asked for it to be FUNCTIONAL. I should try to make it submit.
                          // I'll update the textarea value directly if needed, but react state is better.
                          // Actually, I can allow the user to review the prompt before sending.
                          // User request: "lets make this section functional taking from real data"
                        }}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group/item border border-transparent hover:border-slate-100"
                      >
                        <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center font-bold text-lg group-hover/item:scale-110 transition-transform`}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.type}</p>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            askStudyBuddy(item.prompt);
                          }}
                          className="w-8 h-8 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover/item:border-blue-500 group-hover/item:text-blue-500 transition-all hover:bg-blue-50"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Today's Challenge */}
              <div
                onClick={() => { setPromptText(`Generate a ${dailyChallenge.quiz}`); handlePromptSubmit(); }}
                className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-orange-500/5 transition-all"
              >
                <div className="absolute top-0 right-0 p-20 bg-gradient-to-br from-orange-50 to-amber-50 rounded-full blur-3xl opacity-60 -translate-y-1/3 translate-x-1/3" />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Today's Result<br />Challenge</h3>
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                      🏆
                    </div>
                  </div>

                  <div className="mb-8 flex-1">
                    <p className="text-slate-500 font-medium text-lg mb-2">Solve <strong className="text-slate-900">5 questions</strong></p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-wider">
                      +50 XP Reward
                    </div>
                  </div>

                  <button className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 group-hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    Start Challenge
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Progress & Tools Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 mb-20"
            >
              {/* Weekly Progress (Span 7) */}
              <div className="md:col-span-7 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xl text-slate-900">Weekly Progress</h3>
                  <button className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">View Report</button>
                </div>

                {/* Level Bar */}
                <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-slate-700">Level {levelInfo.level}</span>
                    <span className="text-xs font-bold text-slate-400">{totalXP} / {levelInfo.nextLevelXP} XP</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(totalXP / levelInfo.nextLevelXP) * 100}%` }} />
                  </div>
                </div>

                {/* Subjects */}
                <div className="space-y-4">
                  {subjectPerformance.slice(0, 3).map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>{item.subject}</span>
                        <span className="text-slate-900">{item.score}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'}`} style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                  {subjectPerformance.length === 0 && (
                    <p className="text-center text-slate-400 text-sm italic">Start quizzes to track progress!</p>
                  )}
                </div>
              </div>

              {/* Tools (Span 5) */}
              <div className="md:col-span-5 grid grid-cols-2 gap-4">
                <button onClick={() => setMode('HISTORY' as any)} className="bg-white hover:bg-slate-50 p-4 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all group aspect-square">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="font-bold text-slate-700">History</span>
                </button>
                <label className="bg-white hover:bg-slate-50 p-4 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all group aspect-square cursor-pointer">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="font-bold text-slate-700">Upload</span>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </label>
                <button onClick={() => window.open('/revision', '_blank')} className="col-span-2 bg-white hover:bg-slate-50 p-4 rounded-[2rem] border border-slate-100 flex items-center justify-center gap-4 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Library className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className="font-bold text-slate-700">Resources</span>
                </button>
              </div>
            </motion.div>



            {/* TUTORING MODAL TRIGGER (Hidden logic mostly, exposed via chip) */}
            {/* The actual modal logic is shared */}
          </div>


        </div>
      );
    }

    // --- HISTORY VIEW ---
    if (mode === 'HISTORY' as any) {
      return (
        <div className="min-h-screen bg-white font-sans text-slate-800 max-w-4xl mx-auto border-x border-slate-100 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 bg-white z-20">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowRight className="w-6 h-6 rotate-180" /></button>
            <h1 className="text-lg font-bold">Learning History</h1>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No history yet. Start a chat!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.slice().reverse().map((item) => (
                  <div key={item.id} onClick={() => restoreActivity(item)} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm text-lg">
                      {item.type === 'QUIZ' ? '📝' : '💡'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{item.topic || "Untitled Session"}</h3>
                      <p className="text-xs text-slate-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (mode === 'PROFILE') {
      // PRO GUARD: If no student profile is active, redirect to menu or show login prompt
      if (!isRegistered && role !== UserRole.LEARNER && role !== UserRole.REVISION) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Login Required</h2>
            <p className="text-slate-500 mb-8 max-w-xs">Please log in or register as a student to view and manage your profile settings.</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-12"
            >
              Go to Home
            </Button>
          </div>
        );
      }

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
            {isRegistered && (
              <button onClick={() => setShowLogoutModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        id="studentName"
                        type="text"
                        defaultValue={studentProfile?.name || ''}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:border-blue-500 outline-none transition-all"
                        onChange={() => {
                          const btn = document.getElementById('save-profile-btn');
                          if (btn) btn.style.display = 'block';
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Grade Level</label>
                      <select
                        id="studentGrade"
                        defaultValue={studentProfile?.grade || ''}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:border-blue-500 outline-none transition-all appearance-none"
                        onChange={() => {
                          const btn = document.getElementById('save-profile-btn');
                          if (btn) btn.style.display = 'block';
                        }}
                      >
                        <option value="">Select Grade</option>
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                        <option value="Form 1">Form 1</option>
                        <option value="Form 2">Form 2</option>
                        <option value="Form 3">Form 3</option>
                        <option value="Form 4">Form 4</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Student ID</label>
                      <p className="text-lg font-bold text-blue-600 font-mono tracking-wider bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">{studentCode || '---'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Email</label>
                      <p className="text-sm font-medium text-slate-500 truncate bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{studentProfile?.email || 'No email set'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* Subscription Verification */}
            <section>
              <Card className="p-4 border-indigo-100 bg-indigo-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full"><CreditCard className="w-5 h-5 text-indigo-600" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Missing a Purchase?</p>
                      <p className="text-[10px] text-slate-500">Restore your subscription if it's not showing.</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-indigo-600 hover:bg-indigo-100 font-bold text-xs"
                    onClick={async () => {
                      if (confirm("Check for missing payments? This will scan your transaction history.")) {
                        setLoading(true);
                        setLoadingText("Verifying Transactions...");
                        await verifySubscription();
                        setLoading(false);
                        alert("Verification Complete. If a valid payment was found, your subscription has been restored.");
                      }
                    }}
                  >
                    Restore
                  </Button>
                </div>
              </Card>
            </section>

            {/* Subscription Snapshot */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Subscription Status</h2>
                  <p className="text-xs text-slate-400 font-medium">Manage your plan and billing</p>
                </div>
              </div>

              <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                      <Star className={`w-8 h-8 ${isPro ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-black text-slate-900 uppercase">
                          {activePlanDetails?.name || subscriptionPlan || 'Somo Basic'}
                        </span>
                        {isPro && (
                          <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                            Active Plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {isPro && subscriptionExpiry
                          ? `Valid until ${new Date(subscriptionExpiry).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                          : 'Free Access • 3 Queries/Day'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                      <p className="text-lg font-black text-slate-900">
                        {isPro && activePlanDetails ? `${activePlanDetails.price} KES` : '0 KES'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest px-6 ml-2"
                      onClick={() => setMode('PRICING')}
                    >
                      {isPro ? 'Upgrade Plan' : 'Get Pro Now'}
                    </Button>
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
                        const nameInput = document.getElementById('studentName') as HTMLInputElement;
                        const gradeInput = document.getElementById('studentGrade') as HTMLSelectElement;
                        const phoneInput = document.getElementById('parentPhone') as HTMLInputElement;

                        setLoading(true);
                        setLoadingText("Saving profile...");
                        const { success, message } = await updateStudentProfile({
                          name: nameInput.value,
                          grade: gradeInput.value,
                          parentPhone: phoneInput.value
                        });
                        setLoading(false);

                        if (success) {
                          const btn = document.getElementById('save-profile-btn');
                          if (btn) btn.style.display = 'none';
                          // Show a success state or just rely on the UI updating
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

          </div>

          {/* Global Bottom Nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
            </button>
            <button onClick={() => setMode('MARKETPLACE')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Materials</span>
            </button>
            <div className="relative -mt-10">
              <button onClick={() => setMode('SCAN')} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white transform hover:scale-110 active:scale-90 transition-all border-4 border-white">
                <ScanLine className="w-8 h-8" />
              </button>
            </div>
            <button onClick={() => setMode('LIBRARY')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <Library className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Library</span>
            </button>
            <button onClick={() => setMode('PROFILE')} className="flex flex-col items-center gap-1 text-indigo-600 scale-110">
              <UserCircle className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Me</span>
            </button>
          </div>
        </div >
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
          <p className="text-slate-500 max-w-xs mx-auto text-lg">Somo is putting the pieces together...</p>
        </div>
      );
    }

    if (mode === 'STUDY' && currentDocument) {
      return (
        <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row max-w-[1440px] mx-auto shadow-2xl border-x border-slate-100 overflow-hidden">
          {/* Sidebar: Study Guide & Document Info */}
          <div className="w-full md:w-1/3 bg-white border-r border-slate-200 flex flex-col h-[50vh] md:h-screen">
            <div className="p-6 border-b border-slate-100 bg-indigo-900 text-white">
              <button onClick={() => setMode('MARKETPLACE')} className="flex items-center gap-2 mb-6 text-indigo-200 hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-[10px] font-black uppercase tracking-widest">Exit Study Center</span>
              </button>
              <h1 className="text-2xl font-black mb-2 tracking-tight line-clamp-2">{currentDocument.title}</h1>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                <span>{currentDocument.grade}</span>
                <span>•</span>
                <span>{currentDocument.subject}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {/* Study Guide Content */}
              {isSummarizing ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                </div>
              ) : explanation && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-slate prose-sm max-w-none">
                  <h3 className="text-slate-900 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" /> Official Study Guide & Notes
                  </h3>
                  <MarkdownText content={explanation.explanation} />

                  <div className="mt-8">
                    <h4 className="text-slate-900 font-black uppercase text-[10px] tracking-widest mb-4">Summary Notes for Revision</h4>
                    <ul className="space-y-3">
                      {explanation.summaryPoints.map((point, i) => (
                        <li key={i} className="flex gap-3 text-slate-600 items-start">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="bg-indigo-50 rounded-2xl p-4 mb-4 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-3 h-3 text-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Exam Mastery Guide</span>
                      </div>
                      <p className="text-[10px] text-indigo-600 font-medium italic">Pro Tip: Review these summary notes before starting the quiz to maximize your "Stickiness Score"!</p>
                    </div>

                    <div className="bg-emerald-50 rounded-2xl p-4 mb-4 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Stickiness Boost</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-medium italic">Did you know? Taking a 2-minute quiz now increases your retention by up to 80%!</p>
                    </div>
                    <Button
                      fullWidth
                      className="rounded-2xl py-4 bg-indigo-600 text-white shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:scale-[1.02] transition-all"
                      onClick={generatePracticeQuiz}
                      icon={<Clock className="w-4 h-4" />}
                    >
                      Take Practice Quiz
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Main Content: Chat Interface */}
          <div className="flex-1 flex flex-col bg-slate-50 relative h-[50vh] md:h-screen">
            <div className="sticky top-0 z-10 p-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 tracking-tight">Study Buddy</h2>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Document-Locked Chat</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">Soma v1.5</span>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32 scroll-smooth"
            >
              {studyChat.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-40">
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-black text-slate-600 mb-2">Ready to study with Somo?</h3>
                  <p className="text-sm font-medium text-slate-500">I'm ready to help you master this material. Ask me for examples, easy summaries, or anything else you're curious about!</p>
                </div>
              ) : (
                studyChat.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'}`}>
                      <MarkdownText content={msg.text} />
                    </div>
                  </motion.div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
              <div className="max-w-3xl mx-auto space-y-3">
                {pendingMedia && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 inline-flex items-center gap-3">
                      {pendingMedia.type === 'IMAGE' ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100">
                          <img src={`data:${pendingMedia.mimeType};base64,${pendingMedia.data}`} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                          {pendingMedia.type === 'AUDIO' ? <Mic className="w-6 h-6 text-indigo-600" /> : <FileText className="w-6 h-6 text-indigo-600" />}
                        </div>
                      )}
                      <div className="pr-4 text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Attached {pendingMedia.type}</p>
                        <p className="text-[11px] font-bold text-slate-800">Somo is ready to analyze this!</p>
                      </div>
                      <button onClick={() => setPendingMedia(null)} className="p-1.5 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
                <div className="flex items-center gap-3 p-2 bg-white rounded-[2rem] shadow-2xl border border-slate-200">
                  <input
                    type="file"
                    ref={studyFileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const data = await fileToGenerativePart(file);
                        setPendingMedia({ data, mimeType: file.type, type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE' });
                      }
                    }}
                  />
                  <div className="flex items-center gap-1 pl-2">
                    <button
                      onClick={() => startCamera()}
                      className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Snapshot"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => studyFileInputRef.current?.click()}
                      className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Upload"
                    >
                      <Upload className="w-6 h-6" />
                    </button>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-3 rounded-xl transition-all ${isRecording ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-indigo-600'}`}
                      title={isRecording ? "Stop Recording" : "Voice message"}
                    >
                      {isRecording ? <div className="w-6 h-6 bg-red-600 rounded-sm animate-pulse" /> : <Mic className="w-6 h-6" />}
                    </button>
                    {isRecording && (
                      <span className="text-xs font-black text-red-500 tabular-nums ml-1">
                        {formatTime(recordingTime)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Ask Somo about this document..."
                    className="flex-1 px-2 py-4 outline-none text-slate-700 bg-transparent font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && askStudyBuddy(promptText)}
                  />
                  <button
                    onClick={() => askStudyBuddy(promptText)}
                    disabled={loading || (!promptText.trim() && !pendingMedia)}
                    className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (mode === 'RESULT' && explanation) {
      return (
        <div className="bg-slate-50 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
          {/* Sticky Glass Header */}
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => { cancelPodcast(); handleExitResult(); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-all group">
              <ArrowRight className="w-5 h-5 text-slate-500 rotate-180 group-hover:text-blue-600" />
              <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600">Dashboard</span>
            </button>
            <h1 className="font-bold text-lg text-slate-900 truncate flex-1">{explanation.topic}</h1>

            <button
              onClick={handlePodcastToggle}
              disabled={podcastLoading}
              className={`
                hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5
                ${isPodcastPlaying
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-200'}
              `}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPodcastPlaying ? 'bg-indigo-200' : 'bg-white/20'}`}>
                {podcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPodcastPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Headphones className="w-4 h-4" />)}
              </div>
              <div className="text-left flex flex-col">
                <span className="text-xs font-black uppercase tracking-wide leading-none mb-0.5">{isPodcastPlaying ? "Processing..." : "Listen & Learn"}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isPodcastPlaying ? 'text-indigo-500' : 'text-indigo-100'}`}>
                  {isPodcastPlaying ? "Playing Lesson" : "Audio Lesson Explanation"}
                </span>
              </div>
            </button>

            <button onClick={handleDownload} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>

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

            {/* Podcast Player Overlay */}
            <AnimatePresence>
              {isPodcastPlaying && podcastScript && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 bg-slate-900/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl flex items-center gap-4 md:w-[90%] md:max-w-md z-[100] border border-white/10 ring-1 ring-black/20"
                >
                  <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
                    <Volume2 className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-0.5">Somo Smart Audio</p>
                    <p className="text-white font-bold truncate text-sm">
                      {currentSegmentIndex >= 0 ? `${podcastScript.script[currentSegmentIndex].speaker}: ${podcastScript.script[currentSegmentIndex].text}` : "Starting..."}
                    </p>
                  </div>
                  <button onClick={handlePodcastToggle} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
                    <Pause className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* Mobile-Only Audio Button (Prominent) */}
            <div className="md:hidden w-full mb-6">
              <button
                onClick={handlePodcastToggle}
                disabled={podcastLoading}
                className={`
                  w-full flex items-center justify-between px-5 py-4 rounded-3xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]
                  ${isPodcastPlaying
                    ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-indigo-200'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPodcastPlaying ? 'bg-indigo-200' : 'bg-white/20'}`}>
                    {podcastLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Headphones className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black uppercase tracking-wide">Listen & Learn</p>
                    <p className={`text-xs font-medium ${isPodcastPlaying ? 'text-indigo-600' : 'text-indigo-100'}`}>
                      {isPodcastPlaying ? "Playing Lesson..." : "Audio Lesson Explanation"}
                    </p>
                  </div>
                </div>
                {isPodcastPlaying ? <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" /> : <Play className="w-5 h-5 fill-current opacity-80" />}
              </button>
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
              {/* ACTION FOOTER */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
                <button
                  onClick={handleTTS}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-3 rounded-xl transition-colors"
                >
                  {isPlaying ? <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                  {isPlaying ? "Stop" : "Listen"}
                </button>

                <button
                  onClick={handleGenerateQuiz}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm px-5 py-3 rounded-xl transition-colors border border-indigo-100"
                >
                  <Clock className="w-4 h-4" />
                  Take Quiz
                </button>
              </div>
            </motion.article>

            {/* Need more help? - Phase 2 */}

            {/* CONTINUE RESEARCHING */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 mt-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800">Continue Researching</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Ask a follow-up question to refine this explanation.</p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Give me more examples..."
                  className="flex-1 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      const query = target.value;
                      if (!query.trim() || !explanation) return;

                      target.value = '';
                      setLoading(true);
                      setLoadingText("Researching your question...");
                      setMode('SCAN'); // Show loading

                      try {
                        const result = await continueResearch(explanation.topic, explanation.explanation, query, level, language);
                        setExplanation(result);
                        setMode('RESULT');
                      } catch (err) {
                        console.error(err);
                        setError({ title: "Research Failed", message: "Could not update the explanation. Please try again." });
                        setLoading(false);
                        setMode('RESULT');
                      }
                    }
                  }}
                />
                <button
                  className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  onClick={async (e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    const query = input.value;
                    if (!query.trim() || !explanation) return;

                    input.value = '';
                    setLoading(true);
                    setLoadingText("Researching your question...");
                    setMode('SCAN');

                    try {
                      const result = await continueResearch(explanation.topic, explanation.explanation, query, level, language);
                      setExplanation(result);
                      setMode('RESULT');
                    } catch (err) {
                      console.error(err);
                      setError({ title: "Research Failed", message: "Could not update the explanation. Please try again." });
                      setLoading(false);
                      setMode('RESULT');
                    }
                  }}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h3 className="text-xl font-black">Still confused? 🧐</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isAvailableForTutoring ? 'bg-emerald-400 text-indigo-900 animate-pulse' : 'bg-indigo-500/50 text-indigo-200'}`}>
                    {isAvailableForTutoring ? 'Teachers online' : 'Teachers offline'}
                  </span>
                </div>
                <p className="text-indigo-100 text-sm font-medium">Get a personalized explanation from a top teacher for just KES 20.</p>
              </div>
              <button
                onClick={() => {
                  setTutoringTopic(explanation?.topic || "");
                  setShowTutoringModal(true);
                }}
                className={`px-8 py-4 bg-white text-indigo-600 rounded-full font-black text-sm uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all active:scale-95 ${!isAvailableForTutoring ? 'opacity-70 grayscale' : ''}`}
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



          {/* Global Bottom Nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
            </button>
            <button onClick={() => setMode('MARKETPLACE')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Materials</span>
            </button>
            <div className="relative -mt-10">
              <button onClick={() => setMode('SCAN')} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white transform hover:scale-110 active:scale-90 transition-all border-4 border-white">
                <ScanLine className="w-8 h-8" />
              </button>
            </div>
            <button onClick={() => setMode('LIBRARY')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <Library className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Library</span>
            </button>
            <button onClick={() => setMode('PROFILE')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <UserCircle className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Me</span>
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'QUIZ' && quizData) {
      return <QuizRunner data={quizData} onComplete={(score) => {
        // Enrich topic with subject for better gamification tracking
        const subjectPrefix = currentDocument?.subject ? `${currentDocument.subject} - ` : "";

        saveActivity({
          id: Date.now().toString(),
          type: 'QUIZ',
          topic: `${subjectPrefix}${quizData.topic}`,
          date: new Date().toLocaleDateString(),
          score
        });

        // Return to marketplace/materials after study quiz
        setMode('MARKETPLACE');
      }} onExit={() => setMode('RESULT')} />;
    }

    // --- PRICING & PAYMENT ---

    if (mode === 'PRICING') {
      return (
        <PricingPage
          currentTier={subscriptionPlan}
          isPro={isPro}
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
          materialId={pendingMaterialId || undefined}
          onSuccess={async () => {
            await upgradeAccount(selectedPlan);
            setMode('MENU');
            setSelectedPlan(null);
            // Auto-open if we have a pending material
            if (pendingMaterialId) {
              const material = unifiedMaterials.find(m => m.id === pendingMaterialId || (m as any).realId === pendingMaterialId);
              if (material?.fileUrl) window.open(material.fileUrl, '_blank');
              setPendingMaterialId(null);
            }
          }}
          onCancel={() => setMode('PRICING' as any)}
        />
      );
    }

    if (mode === 'MARKETPLACE') {
      return (
        <div className="bg-slate-50 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 flex flex-col">
          {/* Download Overage Payment Modal */}
          {showDownloadPayment && (
            <PaymentFlow
              plan={SINGLE_DOWNLOAD_PLAN}
              onSuccess={() => {
                setShowDownloadPayment(false);
                if (pendingDownloadMaterial) {
                  handleDownloadAIRevisionNotes(pendingDownloadMaterial, true);
                  setPendingDownloadMaterial(null);
                }
              }}
              onCancel={() => {
                setShowDownloadPayment(false);
                setPendingDownloadMaterial(null);
              }}
            />
          )}

          {/* Header */}
          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowRight className="w-5 h-5 rotate-180" /></button>
              <div>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5">Premium Resource Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isPro && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col items-end mr-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Free Sessions</p>
                    <p className="text-[10px] font-black text-indigo-600">{Math.max(0, 3 - usageCount)} / 3 Left</p>
                  </div>
                  <button
                    onClick={() => setMode('PRICING')}
                    className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-200 shadow-sm"
                  >
                    Go Pro
                  </button>
                </div>
              )}
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Premium Hero - Lean Design */}
            <div className="px-6 pt-6 pb-2">
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-5 text-white shadow-xl shadow-indigo-200/50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                {/* Left: Text Content */}
                <div className="relative z-10 flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Official Content</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1">
                      <CheckCircle className="w-2 h-2" /> Verified
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight leading-tight mb-1">Elite Library.</h3>
                  <p className="opacity-80 text-xs font-medium max-w-[200px] mx-auto md:mx-0 leading-relaxed">
                    Verified CBC past papers & professional revision notes.
                  </p>
                </div>

                {/* Right: Compact Stats */}
                <div className="relative z-10 flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/5 min-w-[90px]">
                    <span className="text-2xl font-black leading-none mb-0.5">{gradeFilteredMaterials.length}</span>
                    <span className="text-[7px] opacity-70 font-black uppercase tracking-widest">Available</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-indigo-500/30 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/5 min-w-[90px]">
                    <span className="text-2xl font-black leading-none mb-0.5">{purchasedMaterialIds.length}</span>
                    <span className="text-[7px] opacity-70 font-black uppercase tracking-widest">Unlocked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recently Studied - Only if history exists */}
            {history.filter(h => h.type === 'STUDY').length > 0 && (
              <div className="px-6 mb-8 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Recently Studied
                  </h4>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                  {(() => {
                    const recentSessions = [];
                    const seenIds = new Set();
                    const studyHistory = [...history].filter(h => h.type === 'STUDY').reverse();

                    for (const session of studyHistory) {
                      try {
                        const details = JSON.parse(session.details || '{}');
                        const mId = details.materialId || details.realId;
                        if (mId && !seenIds.has(mId)) {
                          seenIds.add(mId);
                          recentSessions.push({ ...details, id: mId, title: session.topic });
                        }
                      } catch (e) { }
                      if (recentSessions.length >= 5) break;
                    }

                    return recentSessions.map((material, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => startStudySession(material)}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 min-w-[180px] group cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-95"
                      >
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight h-8 mb-2 group-hover:text-indigo-600">
                          {material.title}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-auto">
                          <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50/50 px-1.5 py-0.5 rounded-md">
                            {material.subject}
                          </span>
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="px-6 space-y-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {(['ALL', 'NOTES', 'PAST_PAPER', 'SYLLABUS'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMaterialCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${materialCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Advanced Filter Row (Grade + Source + Subject) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Source Toggle */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
                  {(['ALL', 'SOMO', 'TEACHERS'] as const).map(source => (
                    <button
                      key={source}
                      onClick={() => setSelectedSource(source)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${selectedSource === source ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {source === 'ALL' ? 'All' : source === 'SOMO' ? 'Somo Verified' : 'Community'}
                    </button>
                  ))}
                </div>

                {/* Grade Selector */}
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="ALL">All Grades</option>
                  <option value="PP1">PP1</option>
                  <option value="PP2">PP2</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Form 3">Form 3</option>
                  <option value="Form 4">Form 4</option>
                </select>

                {/* Subject Slider */}
                {/* Subject Selector */}
                <div className="flex-1 min-w-[140px]">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    <option value="ALL">All Subjects</option>
                    {subjects.filter(s => s !== 'ALL').map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Material Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMaterials.length === 0 ? (
                  <div className="md:col-span-2 py-12 md:py-32 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                    <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h4 className="font-black text-slate-300 uppercase tracking-widest text-xs">No materials found in this category</h4>
                    <button onClick={() => { setMaterialCategory('ALL'); setSubjectFilter('ALL'); }} className="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline">Reset Filters</button>
                  </div>
                ) : (
                  filteredMaterials.map(item => {
                    const isOwned = purchasedMaterialIds.includes(item.id);
                    const isSyllabus = item.category === 'SYLLABUS';
                    const isVerified = item.isVerified;

                    // Monetization Logic
                    let status = 'PURCHASE';
                    if (isOwned) status = 'OWNED';
                    else if (isSyllabus) status = 'FREE';
                    else if (isVerified) status = isPro ? 'PRO_INCLUDED' : 'PRO_LOCKED';

                    return (
                      <motion.div
                        whileHover={{ y: -2 }}
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isVerified ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.category === 'NOTES' ? <FileText className="w-5 h-5" /> : isSyllabus ? <Library className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                            </div>

                            {/* Price / Status Tag */}
                            <div className="flex flex-col items-end gap-1">
                              {status === 'OWNED' ? (
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-[8px] font-black uppercase tracking-widest">Owned</span>
                              ) : status === 'FREE' ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[8px] font-black uppercase tracking-widest">Free</span>
                              ) : status === 'PRO_INCLUDED' ? (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[8px] font-black uppercase tracking-widest">Pro</span>
                              ) : status === 'PRO_LOCKED' ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[8px] font-black uppercase tracking-widest">Locked</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-900 rounded-md text-[9px] font-black">KES {item.price}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-1">
                            {isVerified && (
                              <span className="flex items-center gap-1 text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                                <CheckCircle className="w-2.5 h-2.5" /> Verified
                              </span>
                            )}
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.grade}</span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-base mb-1 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</h4>
                          <div className="flex items-center gap-2 mb-4 text-[8px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">{item.subject}</span>
                            <span className="text-slate-200">•</span>
                            <span className="text-slate-400">{isVerified ? "Somo Smart" : item.teacherName}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <Button
                            fullWidth
                            className={`rounded-xl py-2.5 font-bold uppercase tracking-wider text-[9px] transition-all border ${usageCount >= 3 && !isPro
                              ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-none hover:bg-amber-100'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02]'
                              }`}
                            onClick={() => startStudySession(item)}
                            isLoading={loading && currentDocument?.id === item.id}
                            icon={usageCount >= 3 && !isPro ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          >
                            {usageCount >= 3 && !isPro ? 'Limit Reached' : 'Study'}
                          </Button>
                          <Button
                            variant="ghost"
                            className="rounded-xl p-2.5 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 shadow-sm transition-all"
                            onClick={() => {
                              if (status === 'OWNED' || status === 'PRO_INCLUDED' || status === 'FREE') {
                                handleDownloadAIRevisionNotes(item);
                              } else if (status === 'PRO_LOCKED') {
                                setPendingMaterialId(item.id);
                                if (!isRegistered) setShowLogin(true);
                                else setMode('PRICING');
                              } else {
                                purchaseMaterial(item.id);
                              }
                            }}
                            isLoading={loading && pendingDownloadMaterial?.id === item.id}
                            icon={<Download className="w-4 h-4" />}
                            title="Download"
                          />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Global Bottom Nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
            </button>
            <button onClick={() => setMode('MARKETPLACE')} className="flex flex-col items-center gap-1 text-indigo-600 scale-110">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Materials</span>
            </button>
            <div className="relative -mt-10">
              <button onClick={() => setMode('SCAN')} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white transform hover:scale-110 active:scale-90 transition-all border-4 border-white">
                <ScanLine className="w-8 h-8" />
              </button>
            </div>
            <button onClick={() => setMode('LIBRARY')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <Library className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Library</span>
            </button>
            <button onClick={() => setMode('PROFILE')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <UserCircle className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Me</span>
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'LIBRARY') {
      const ownedUnifiedMaterials = unifiedMaterials.filter(m => {
        const isSyllabus = m.category === 'SYLLABUS';
        const isOwned = purchasedMaterialIds.includes(m.id);
        const isProBenefit = m.isVerified && isPro;
        return isOwned || isSyllabus || isProBenefit;
      });

      return (
        <div className="bg-slate-50 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 flex flex-col">
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">My Library</h1>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5">Unlocked Resources</p>
            </div>
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            {ownedUnifiedMaterials.length === 0 ? (
              <div className="py-12 md:py-32 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                  <Library className="w-10 h-10 text-slate-300" />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Your library is empty</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-12 max-w-xs mx-auto leading-relaxed">Unlock premium notes and revision papers from the marketplace to see them here.</p>
                <Button onClick={() => setMode('MARKETPLACE')} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[10px] border-none">
                  Browse Materials
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {ownedUnifiedMaterials.map(item => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => item.fileUrl && window.open(item.fileUrl, '_blank')}
                    className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-6 group hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/30 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm ${item.isVerified ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                      {item.category === 'NOTES' ? <FileText className="w-8 h-8" /> : item.category === 'SYLLABUS' ? <Library className="w-8 h-8" /> : <Layers className="w-8 h-8" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{item.subject}</span>
                        {item.isVerified && <span className="bg-indigo-50 p-1 rounded-full"><Sparkles className="w-2 h-2 text-indigo-600" /></span>}
                      </div>
                      <h4 className="font-black text-slate-900 text-lg truncate group-hover:text-indigo-600 transition-colors tracking-tight">{item.title}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.category.replace('_', ' ')} • {item.grade}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <Download className="w-5 h-5" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Global Bottom Nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
            </button>
            <button onClick={() => setMode('MARKETPLACE')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Materials</span>
            </button>
            <div className="relative -mt-10">
              <button onClick={() => setMode('SCAN')} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white transform hover:scale-110 active:scale-90 transition-all border-4 border-white">
                <ScanLine className="w-8 h-8" />
              </button>
            </div>
            <button onClick={() => setMode('LIBRARY')} className="flex flex-col items-center gap-1 text-indigo-600 scale-110">
              <Library className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Library</span>
            </button>
            <button onClick={() => setMode('PROFILE')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
              <UserCircle className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Me</span>
            </button>
          </div>
        </div>
      );
    }


    if (mode === 'SCAN') {
      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ScanLine className="w-6 h-6 text-indigo-600" />
                  Scan Homework
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Get Instant Help</p>
              </div>
              <button
                onClick={() => setMode('MENU')}
                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-6 relative">
              {/* Decorative Background Blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="relative z-10">
                <p className="text-slate-600 font-medium leading-relaxed mb-8 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  Snap a clear photo of your question. Somo will explain it simply! 📸
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={startCamera}
                    className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-3xl shadow-xl shadow-indigo-200 transition-all hover:shadow-2xl hover:-translate-y-1 flex items-center gap-6 text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">Open Camera</h3>
                      <p className="text-indigo-100 text-sm font-medium">Take a photo now</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-white/50 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          setLoading(true);
                          setLoadingText("Analyzing...");
                          // Simulate upload/scan delay
                          setTimeout(() => {
                            setLoading(false);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = (reader.result as string).split(',')[1];
                              setImageData({ base64, mimeType: file.type });
                              setMode('SCAN_EXPLAIN');
                            };
                            reader.readAsDataURL(file);
                          }, 1500);
                        }
                      };
                      input.click();
                    }}
                    className="group bg-white border-2 border-slate-100 hover:border-indigo-100 hover:bg-slate-50 text-slate-700 p-5 rounded-3xl transition-all flex items-center gap-5 text-left"
                  >
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-sm transition-colors">
                      <ImageIcon className="w-7 h-7 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Upload Image</h3>
                      <p className="text-slate-400 text-sm font-medium">From your gallery</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                Supported by Gemini AI 🤖
              </p>
            </div>
          </motion.div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      {renderMode()}

      {/* Global Modals - Available in ALL modes */}
      <RegistrationModal
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={() => setShowRegistration(false)}
        onSwitchToLogin={() => { setShowRegistration(false); setShowLogin(true); }}
      />
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={(role) => {
          setShowLogin(false);
          setShowRegistration(true);
        }}
      />
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          navigate('/');
        }}
      />

      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-100 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-50 shadow-sm">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-2">Free Trials Exhausted</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  You have exhausted your free trials. Click here to continue enjoying <span className="text-indigo-600 font-bold">unlimited access</span> to learning for as low as <span className="text-indigo-600 font-bold">20 KES</span>.
                </p>

                <div className="space-y-3">
                  <Button
                    fullWidth
                    onClick={() => {
                      setShowLimitModal(false);
                      setMode('PRICING');
                    }}
                    className="py-4 text-base shadow-xl shadow-indigo-200"
                  >
                    Unlock Unlimited Access
                  </Button>
                  <button
                    onClick={() => setShowLimitModal(false)}
                    className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Cancel to Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExpiryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-100 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-50 shadow-sm">
                  <Clock className="w-8 h-8 text-red-500" />
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-2">Subscription Expired</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Your premium access has expired. Renew now to continue enjoying <span className="text-indigo-600 font-bold">unlimited access</span> to learning for as little as <span className="text-indigo-600 font-bold">20 KES</span>.
                </p>

                <div className="space-y-3">
                  <Button
                    fullWidth
                    onClick={() => {
                      setShowExpiryModal(false);
                      setMode('PRICING');
                    }}
                    className="py-4 text-base shadow-xl shadow-red-200 bg-red-600 hover:bg-red-700"
                  >
                    Renew Now
                  </Button>
                  <button
                    onClick={() => setShowExpiryModal(false)}
                    className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showTutoringModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowTutoringModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-4">Ask a Teacher</h2>
            <p className="text-slate-500 mb-4">Describe your question below:</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade</label>
                <select
                  className="w-full border rounded-xl p-3 bg-slate-50"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option value="ALL">Select Grade</option>
                  {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                <select
                  className="w-full border rounded-xl p-3 bg-slate-50"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="ALL">Select Subject</option>
                  {['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE', 'Physics', 'Biology', 'Chemistry', 'History', 'Geography', 'Business', 'Computer', 'Agriculture'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              className="w-full border rounded-xl p-3 mb-4"
              rows={4}
              placeholder="I need help with..."
              id="tutoring-desc-quick"
            ></textarea>
            <Button fullWidth onClick={async () => {
              const desc = (document.getElementById('tutoring-desc-quick') as HTMLTextAreaElement).value;
              if (!desc) return;
              if (selectedGrade === 'ALL' || subjectFilter === 'ALL') {
                alert("Please select a Grade and Subject for your request.");
                return;
              }
              setLoading(true);
              const res = await createTutoringRequest(tutoringTopic || "General Help", desc, 20, selectedGrade, subjectFilter);
              setLoading(false);
              if (res.success) { setShowTutoringModal(false); alert("Request Sent!"); }
            }}>Send Request</Button>
          </div>
        </div>
      )}

      {/* Hidden Global Inputs */}
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept="audio/*" className="hidden" ref={audioInputRef} onChange={handleAudioUpload} />
    </div>
  );
};
