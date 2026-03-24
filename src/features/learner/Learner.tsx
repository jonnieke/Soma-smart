import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../assets/images/main_logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Home, X, XCircle, Camera, ScanLine, Mic, Upload, Clock,
  CheckCircle, Play, Pause, ChevronRight, Star, BookOpen, Brain, Lightbulb, Lock, Volume2, CreditCard,
  ArrowRight, UserCircle, Download, ImageIcon, Trash2, AlertTriangle, LogOut, Users, DollarSign, FileText, ShoppingBag, Library, Layers,
  Calculator, FlaskConical, Globe, Languages, Loader2, Headphones, PenTool, Zap, ListChecks, Trophy, Hand, ClipboardList
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExplanationResult, QuizData, ViewState, SubscriptionPlan, LearnerProfile, LearnerActivity, UserRole, PodcastScript, ChatMessage, RevisionMode, TeacherActivity, EducationLevel } from '../../types';
import { PricingPage } from '../subscription/PricingPage';
import { PaymentFlow } from '../subscription/PaymentFlow';
import { STUDENT_PLANS, TEACHER_PLANS, DOWNLOAD_PASS } from '../../data/pricing';
import { RegistrationModal } from '../../components/RegistrationModal'; // Assuming path
import { LoginModal } from '../../components/LoginModal'; // Assuming path
import { LogoutModal } from '../../components/LogoutModal';
import { ParentPinModal } from '../../components/ParentPinModal';
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
import { ThemeToggle } from '../../components/ThemeToggle';
import { RevisionLanding } from '../revision/RevisionLanding';
import { DashboardSidebar, SidebarTab } from '../../components/DashboardSidebar';
import { Community } from '../community/Community';
import { LearnerAnalytics } from './LearnerAnalytics';
import { ConversationalTutor } from './ConversationalTutor';
import { ReferralView } from './ReferralView';

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
    chatApproved, setParentPin, verifyChatPin,
    marketplaceMaterials, purchasedMaterialIds, purchaseMaterial,
    resources, fetchResources,
    extraDownloads, grantExtraDownloads,
    verifySubscription,
    // Phase 2/3: Adaptive Tutoring & Evolutionary Educator
    masteryGraph, dueForReview, weakTopics, processQuizCompletion, addSpacedRepetitionItem,
    getPersonalizedDailyChallenge, activeStrategies, educationLevel
  } = useApp();
  const t = translations[language];
  const location = useLocation();

  // Read target tab from navigation state if coming from another route (like /exam-rooms)
  const initialTab = (location.state as any)?.targetTab as SidebarTab || 'HOME';
  const initialMode = initialTab === 'SMART_TUTOR' || initialTab === 'HOMEWORK' ? 'SCAN_EXPLAIN' :
    initialTab === 'RESOURCES' ? 'MARKETPLACE' :
      initialTab === 'PROGRESS' ? 'HISTORY' :
        initialTab === 'SUBJECTS' ? 'REVISION' :
          initialTab === 'COMMUNITY' ? 'COMMUNITY' : 'MENU';

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
  const dailyChallenge = React.useMemo(() => getPersonalizedDailyChallenge(), [getPersonalizedDailyChallenge]);

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
    // We want learners to see the dashboard even if not registered (they get limited access).
    // Allow users to explore directly as a 'Guest' without kicking them.
    const savedStudent = localStorage.getItem('soma_active_student');
    if (!isRegistered && role === UserRole.NONE && !savedStudent) {
      // Intentionally do nothing and let them explore.
      // Top bar will display Register and Log In buttons.
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

  const [mode, setMode] = useState<'MENU' | 'SCAN' | 'RESULT' | 'QUIZ' | 'RECAP_RESULT' | 'PROFILE' | 'PRICING' | 'PAYMENT' | 'MARKETPLACE' | 'LIBRARY' | 'HISTORY' | 'SCAN_EXPLAIN' | 'STUDY' | 'REQUESTS' | 'COMMUNITY' | 'REVISION' | 'ANALYTICS' | 'TALKBACK' | 'REFERRAL'>(initialMode as any);
  const [studyTab, setStudyTab] = useState<'LESSON' | 'RECAP' | 'QNA' | 'QUIZ'>('LESSON');
  const [expandedRecaps, setExpandedRecaps] = useState<number[]>([]);
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA Install Prompt Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };
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
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPaymentGate, setShowPaymentGate] = useState<{ reqId: string; price: number; topic: string } | null>(null);
  const [isRecordingChat, setIsRecordingChat] = useState(false);
  const chatRecorderRef = useRef<MediaRecorder | null>(null);
  const chatChunksRef = useRef<Blob[]>([]);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

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

  const handlePricingNavigation = () => {
    if (!isRegistered) {
      setShowRegistration(true);
    } else {
      setMode('PRICING');
    }
  };

  useEffect(() => {
    if (mode === 'MARKETPLACE') {
      fetchResources();
      setMaterialCategory('ALL');
      setSubjectFilter('ALL');
    }
  }, [mode, educationLevel]);

  const unifiedMaterials = React.useMemo(() => {
    const verified = (resources || []).map((r: any) => ({
      id: `v-${r.id}`,
      realId: r.id,
      title: r.title,
      description: `Official ${r.subject} ${r.type.toLowerCase().replace('_', ' ')} aligned with ${educationLevel === EducationLevel.JUNIOR ? 'CBC/KPSEA' :
        educationLevel === EducationLevel.CAMPUS ? 'University curriculum' :
          'CBC/KCSE'
        }.`,
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

  const getGradeLevel = (grade: string): EducationLevel => {
    const g = (grade || '').toUpperCase();
    if (g.includes('UNIVERSITY') || g.includes('COLLEGE') || g.includes('YEAR') || g.includes('CAMPUS') || g.includes('DEGREE') || g.includes('DIPLOMA')) {
      return EducationLevel.CAMPUS;
    }
    const juniorGrades = ['PP1', 'PP2', 'GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5', 'GRADE 6'];
    if (juniorGrades.some(jg => g.includes(jg))) {
      return EducationLevel.JUNIOR;
    }
    return EducationLevel.SENIOR;
  };

  const normalizeGrade = (g: any) => {
    const str = String(g || "").toLowerCase();
    return str.replace(/\s*grade\s*/g, '').replace(/\s*\(jss\)\s*/g, '').trim() || "";
  };

  const gradeFilteredMaterials = React.useMemo(() => {
    // First filter by education level to prevent cross-level content
    const levelFiltered = unifiedMaterials.filter(m => getGradeLevel(m.grade || '') === educationLevel);

    const studentGrade = normalizeGrade(studentProfile?.grade || "");
    const exactMatches = levelFiltered.filter(m => {
      if (!studentGrade) return true;
      return normalizeGrade(m.grade) === studentGrade;
    });

    // If we have exact matches for student's grade, show only those.
    // If NOT, show level-filtered materials as a fallback so the screen isn't empty.
    const result = exactMatches.length > 0 ? exactMatches : levelFiltered;

    return result;
  }, [unifiedMaterials, studentProfile?.grade, educationLevel]);

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
      // 0. Education Level Filter — prevent cross-level content leakage
      const materialLevel = getGradeLevel(m.grade || '');
      if (materialLevel !== educationLevel) return false;

      // 1. Category Filter
      if (materialCategory !== 'ALL' && m.category !== materialCategory) return false;
      // 2. Subject Filter
      if (subjectFilter !== 'ALL' && m.subject !== subjectFilter) return false;
      // 3. Grade Filter
      if (selectedGrade !== 'ALL' && normalizeGrade(m.grade) !== normalizeGrade(selectedGrade)) return false;
      // 4. Source Filter
      if (selectedSource === 'SOMO' && !m.isVerified) return false;
      if (selectedSource === 'TEACHERS' && m.isVerified) return false;

      return true;
    });
  }, [unifiedMaterials, materialCategory, subjectFilter, selectedGrade, selectedSource, educationLevel]);

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
      if (!isRegistered) {
        setShowRegistration(true);
      } else {
        setSelectedPlan(state.initiatePaymentFor);
        setMode('PAYMENT');
      }
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (state?.selectedPlan) {
      if (isPro) {
        // Already pro, just stay on dashboard and clear state
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        if (!isRegistered) {
          setShowRegistration(true);
        } else {
          setSelectedPlan(state.selectedPlan);
          setMode('PAYMENT');
          setPendingMaterialId(state.materialId || null); // Preserve materialId if available 
        }
        // Clear state to avoid re-triggering on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    } else if (state?.openSubscription) {
      handlePricingNavigation();
      setPendingMaterialId(state.materialId || null); // Preserve materialId if available
      // Clear state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, isPro, isRegistered, navigate, unifiedMaterials]);

  // --- STUDY CENTER (NotebookLM) ---
  const startStudySession = async (material: any) => {
    // Paywall Check: 3 free usages for non-pro users
    if (!isPro && usageCount >= 3) {
      if (!isRegistered) {
        setShowRegistration(true);
        return;
      }
      setShowLimitModal(true);
      return;
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
      handlePricingNavigation();
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
        pendingMedia ? { data: pendingMedia.data, mimeType: pendingMedia.mimeType } : undefined,
        { masteryGraph, recentHurdles: weakTopics },
        activeStrategies
      );
      setStudyChat(prev => [...prev, { role: 'model' as const, text: result.explanation }]);
      setPendingMedia(null);

      if (result.flashcard) {
        addSpacedRepetitionItem({
          topic: result.topic,
          subject: currentDocument.subject || 'General',
          grade: studentProfile?.grade || currentDocument.grade || '',
          nextReviewDate: new Date().toISOString(),
          intervalDays: 1,
          easeFactor: 2.5,
          lastScore: 0,
          reviewCount: 0,
          question: result.flashcard.question,
          answer: result.flashcard.answer
        });
      }
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
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera access is not supported in this browser or context (HTTPS may be required).");
        }
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
      } catch (err: any) {
        console.error(err);
        setError({ title: "Camera Error", message: err.message?.includes('Camera access is not supported') ? err.message : "Unable to access camera." });
        setLoading(false);
        setShowCamera(false);
        isCameraActiveRef.current = false;
      }
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(initialTab);

  const handleSidebarTabChange = (tab: SidebarTab) => {
    setSidebarTab(tab);
    switch (tab) {
      case 'HOME':
        setMode('MENU');
        break;
      case 'SMART_TUTOR':
        setMode('SCAN_EXPLAIN');
        break;
      case 'RESOURCES':
        setMode('MARKETPLACE');
        break;
      case 'PROGRESS':
        setMode('ANALYTICS');
        break;
      case 'HOMEWORK':
        setMode('SCAN_EXPLAIN');
        break;
      case 'SUBJECTS':
        setMode('REVISION');
        break;
      case 'EXAM_ROOMS':
        navigate('/exam-rooms');
        break;
      case 'COMMUNITY':
        setMode('COMMUNITY');
        break;
      case 'REFERRAL':
        setMode('REFERRAL');
        break;
      case 'TALKBACK':
        setMode('TALKBACK');
        break;
      default:
        break;
    }
  };

  const checkLimit = (): boolean => {
    // Pro = Unlimited Checks
    if (isPro) return true;

    // Defensive: If we are registered but isPro is not yet set (or false), 
    // we should still allow access if usage is below limit.
    // If usage is ABOVE limit, and we are registered, we show limit modal.
    if (usageCount >= 3) {
      // Second chance: refresh profile once if we think we might be pro but usage is high
      // (This is a bit heavy, but safe for users who just paid)

      if (role === UserRole.GUEST) {
        setShowLogin(true); // Force login
      } else if (!isRegistered) {
        setShowRegistration(true);
      } else {
        // Registered but Limit Reached -> PAYWALL MODAL
        // Only show if we are CERTAIN it's not a loading state
        if (studentProfile) {
          setShowLimitModal(true);
        }
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser or context (HTTPS may be required).");
      }
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
        result = await explainTopic(explanation.topic, newLevel, language, undefined, currentDocument?.subject, currentDocument?.grade, undefined, { masteryGraph, recentHurdles: weakTopics }, activeStrategies);
      }

      if (result) {
        setExplanation(result);
        setLevel(newLevel);

        if (result.flashcard) {
          addSpacedRepetitionItem({
            topic: result.topic,
            subject: currentDocument?.subject || 'General',
            grade: studentProfile?.grade || currentDocument?.grade || '',
            nextReviewDate: new Date().toISOString(),
            intervalDays: 1,
            easeFactor: 2.5,
            lastScore: 0,
            reviewCount: 0,
            question: result.flashcard.question,
            answer: result.flashcard.answer
          });
        }

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
    const purpose = sidebarTab === 'HOMEWORK' ? 'HOMEWORK' : 'TUTOR';
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
        multimedia,
        { masteryGraph, recentHurdles: weakTopics },
        activeStrategies,
        purpose
      );
      setExplanation(result);

      if (result.flashcard) {
        addSpacedRepetitionItem({
          topic: result.topic,
          subject: currentDocument?.subject || 'General',
          grade: studentProfile?.grade || currentDocument?.grade || '',
          nextReviewDate: new Date().toISOString(),
          intervalDays: 1,
          easeFactor: 2.5,
          lastScore: 0,
          reviewCount: 0,
          question: result.flashcard.question,
          answer: result.flashcard.answer
        });
      }

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

      setMode('SCAN_EXPLAIN');
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
    if (!item.details) return;

    try {
      const details = JSON.parse(item.details);

      if (item.type === 'EXPLANATION' && details.explanation) {
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
      } else if (item.type === 'QUIZ') {
        setQuizData(details);
        setMode('QUIZ');
      } else if (item.type === 'STUDY') {
        const material = {
          id: details.materialId,
          realId: details.realId,
          title: item.topic,
          subject: details.subject,
          grade: details.grade,
          teacherName: details.teacherName,
          category: details.category,
          isVerified: details.isVerified,
          fileUrl: details.fileUrl
        };
        startStudySession(material);
      }
    } catch (e) {
      console.error("Failed to restore activity", e);
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
      playPodcast(
        podcastScript.script,
        (idx) => setCurrentSegmentIndex(idx),
        () => setIsPodcastPlaying(false),
        (err) => setError({ title: "Audio Error", message: err.message || "Failed to play audio segment." })
      );
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

      playPodcast(
        script.script,
        (idx) => setCurrentSegmentIndex(idx),
        () => setIsPodcastPlaying(false),
        (err) => setError({ title: "Audio Error", message: err.message || "Failed to play audio segment." })
      );

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
    if (mode === 'REVISION') {
      return (
        <RevisionLanding
          onBack={() => setMode('MENU')}
          onNavigate={onNavigate}
          onStartSession={(data, mode) => {
            // If data is a Past Paper (File or TeacherActivity with content),
            // navigate to SCAN_EXPLAIN or specialized viewer if we had one.
            // For now, satisfy the interface and log.
            console.log("Starting revision session", { data, mode });
          }}
        />
      );
    }

    if (mode === 'TALKBACK') {
      return (
        <ConversationalTutor
          onBack={() => {
            setMode('MENU');
            setSidebarTab('HOME');
          }}
        />
      );
    }

    if (mode === 'COMMUNITY') {
      return (
        <div className="p-4 md:p-8 animate-in fade-in pb-24">
          <Community />
        </div>
      );
    }

    if (mode === 'REFERRAL') {
      return (
        <div className="p-4 md:p-8 animate-in fade-in pb-24">
          <ReferralView />
        </div>
      );
    }

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans text-slate-800 dark:text-slate-100 w-full">
          <div className="bg-white dark:bg-slate-900 p-6 sticky top-0 z-10 shadow-sm flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ArrowRight className="w-6 h-6 rotate-180 dark:text-slate-400" /></button>
            <h2 className="font-bold text-lg dark:text-white">Lesson Recap</h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
              <h1 className="text-2xl font-bold mb-2">{recapData.topic}</h1>
              <p className="opacity-90">{recapData.summary}</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Key Points</h3>
              <ul className="space-y-3">
                {recapData.keyPoints.map((p: string, i: number) => (
                  <li key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3">
                    <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
                    <span className="text-sm dark:text-slate-300">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Exam Tips</h3>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                {recapData.examTips.map((tip: string, i: number) => (
                  <p key={i} className="text-sm text-red-800 font-medium">• {tip}</p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500" /> Definitions</h3>
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
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 w-full relative">
            {/* Chat Header */}
            <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
              <button onClick={() => { setChatRequestId(null); setChatInput(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ArrowRight className="w-5 h-5 rotate-180 dark:text-slate-400" /></button>
              <div className="flex-1">
                <h2 className="font-bold text-lg dark:text-white leading-tight">{chatReq?.topic || 'Chat'}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Continuous study session</p>
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
                      <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{chatReq.response}</p>
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
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 space-y-2">
              {/* Hidden file input for image upload */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={chatImageInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !chatRequestId) return;
                  setChatSending(true);
                  await sendChatMessage(chatRequestId, 'Sent an image', 'TEXT', file);
                  setChatSending(false);
                  e.target.value = '';
                  setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
              />
              <div className="flex gap-2 items-end">
                {/* Voice Record Button */}
                <button
                  onClick={async () => {
                    if (isRecordingChat) {
                      // Stop recording
                      chatRecorderRef.current?.stop();
                      setIsRecordingChat(false);
                    } else {
                      // Start recording
                      try {
                        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                          throw new Error("Microphone access is not supported in this browser or context (HTTPS may be required).");
                        }
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const recorder = new MediaRecorder(stream);
                        chatChunksRef.current = [];
                        recorder.ondataavailable = (e) => { if (e.data.size > 0) chatChunksRef.current.push(e.data); };
                        recorder.onstop = async () => {
                          stream.getTracks().forEach(t => t.stop());
                          const blob = new Blob(chatChunksRef.current, { type: 'audio/webm' });
                          const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
                          if (chatRequestId) {
                            setChatSending(true);
                            await sendChatMessage(chatRequestId, 'Voice message', 'VOICE', file);
                            setChatSending(false);
                            setTimeout(() => {
                              chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }
                        };
                        recorder.start();
                        chatRecorderRef.current = recorder;
                        setIsRecordingChat(true);
                      } catch (err: any) {
                        console.error(err);
                        alert(err.message?.includes('Microphone access is not supported') ? err.message : "Microphone access is required for voice messages.");
                      }
                    }
                  }}
                  className={`p-3 rounded-2xl transition-all flex-shrink-0 ${isRecordingChat
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  title={isRecordingChat ? 'Stop recording' : 'Record voice message'}
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Image Upload Button */}
                <button
                  onClick={() => chatImageInputRef.current?.click()}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex-shrink-0"
                  title="Send an image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* Text Input */}
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
                  className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:ring-0 focus:border-blue-300 dark:focus:border-blue-700 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                />

                {/* Send Button */}
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
                  className={`p-3 rounded-2xl transition-all flex-shrink-0 ${chatInput.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div >
        );
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 w-full relative">
          <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ArrowRight className="w-5 h-5 rotate-180 dark:text-slate-400" /></button>
            <h2 className="font-bold text-lg dark:text-white">My Requests</h2>
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
                <div key={req.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{req.topic}</h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl leading-relaxed">{req.description}</p>

                  {/* Payment Required Card for priced requests */}
                  {req.status === 'ACCEPTED' && req.price > 0 && req.response && (
                    <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <p className="font-black text-blue-900 text-sm">Teacher has responded!</p>
                      </div>
                      <p className="text-blue-700 text-xs mb-3">Pay <span className="font-black text-lg text-blue-900">KES {req.price}</span> to access the response and chat with your teacher.</p>
                      <button
                        onClick={() => setShowPaymentGate({ reqId: req.id, price: req.price, topic: req.topic })}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" /> Pay & View Response
                      </button>
                    </div>
                  )}

                  {(req.status === 'COMPLETED' || (req.status === 'ACCEPTED' && req.response && req.price === 0)) && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Teacher Response</p>

                      {req.responseType === 'TEXT' && (
                        <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
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

                      {/* Continue Chat Button — gated by parent PIN + payment */}
                      <button
                        onClick={() => {
                          if (!chatApproved) {
                            setShowPinModal(true);
                          } else if (req.price > 0 && req.status !== 'COMPLETED') {
                            setShowPaymentGate({ reqId: req.id, price: req.price, topic: req.topic });
                          } else {
                            setChatRequestId(req.id);
                            fetchChatMessages(req.id);
                          }
                        }}
                        className="mt-3 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                      >
                        {!chatApproved ? (
                          <><Lock className="w-4 h-4" /> Unlock Chat (Parent PIN Required)</>
                        ) : req.price > 0 && req.status !== 'COMPLETED' ? (
                          <><CreditCard className="w-4 h-4" /> Pay KES {req.price} to Chat</>
                        ) : (
                          <><span>💬</span> Continue Chat with Teacher</>
                        )}
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
        <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 w-full relative overflow-hidden transition-colors duration-300">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
          <div className="absolute top-[-10%] right-[-5%] w-[40%] aspect-square bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[20%] left-[-5%] w-[30%] aspect-square bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />

          {/* --- TOP BAR --- */}
          <div className="flex justify-between items-center px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100/50 dark:border-slate-800/50 transition-colors">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
              <img src={logoImg} alt="Somo Smart" className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
            </div>

            {/* Navigation - Centered Desktop */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              <button onClick={() => setMode('HISTORY' as any)} className="flex items-center gap-2 px-5 py-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm hover:shadow-sm">
                <Clock className="w-4 h-4" />
                History
              </button>
              {isRegistered && (
                <>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                  <button onClick={() => setMode('REQUESTS')} className="flex items-center gap-2 px-5 py-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm hover:shadow-sm">
                    <span className="relative">
                      <div className="w-4 h-4 rounded-full border-2 border-current" />
                      {activeTutoringRequests.some(r => r.status === 'COMPLETED') && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />}
                    </span>
                    Requests
                  </button>
                </>
              )}
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
              <button onClick={() => setMode('MARKETPLACE')} className="flex items-center gap-2 px-5 py-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm hover:shadow-sm">
                <Library className="w-4 h-4" />
                Library
              </button>
            </nav>

            {/* Profile & Streaks */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 mr-2 shadow-sm dark:bg-orange-900/20 dark:border-orange-900/30">
                <span className="text-orange-500 font-bold text-sm">🔥 3</span>
                <span className="text-orange-800 dark:text-orange-300 text-[10px] font-black uppercase tracking-wider">Day Streak</span>
              </div>
              <ThemeToggle />

              {!isRegistered && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRegistration(true)}
                    className="hidden sm:block px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-bold hover:bg-slate-200 transition-all font-sans"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                  >
                    Log In
                  </button>
                </div>
              )}

              <div
                onClick={() => isRegistered ? setMode('PROFILE') : setShowLogin(true)}
                className="flex items-center gap-3 pl-1.5 pr-5 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-black shadow-md ring-4 ring-indigo-50 dark:ring-indigo-900/50 group-hover:scale-105 transition-transform">
                  {profile?.name.charAt(0) || 'G'}
                </div>
                <div className="hidden sm:block text-right leading-tight">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{profile?.name.split(' ')[0] || 'Guest'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                    <span className="text-amber-500">★</span> Lvl {levelInfo.level} • {totalXP} XP
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- MAIN CENTER CONTENT --- */}
          <div className="flex-1 flex flex-col items-center px-4 md:px-8 relative z-10 pb-32 max-w-7xl mx-auto w-full">

            {/* Premium Unified Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-8 md:mt-16 mb-8 md:mb-12 text-center relative z-10"
            >
              <h1 className="text-4xl md:text-[4rem] font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
                {educationLevel === EducationLevel.JUNIOR ? `Hello, ${profile?.name.split(' ')[0] || 'Friend'}! 🎈` :
                  educationLevel === EducationLevel.CAMPUS ? `Welcome Back, ${profile?.name.split(' ')[0] || 'Scholar'}` :
                    `Good Morning, ${profile?.name.split(' ')[0] || 'Friend'}`}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 block sm:inline mt-2 sm:mt-0 sm:ml-3">
                  {educationLevel === EducationLevel.JUNIOR ? "Time for a Fun Lesson!" :
                    educationLevel === EducationLevel.CAMPUS ? "Accelerate Your Research." :
                      "Improve Your Marks Today."}
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg md:text-xl max-w-2xl mx-auto block leading-relaxed mt-4 opacity-90">
                {educationLevel === EducationLevel.JUNIOR ? "Snap a picture of your book, ask your Buddy a question, or play a learning game!" :
                  educationLevel === EducationLevel.CAMPUS ? "Upload your lecture notes, ask a complex research question, or analyze your course progress." :
                    "Snap a photo of your homework, ask a tricky question, or dive straight into personalized revision."}
              </p>


            </motion.div>

            {/* Redesigned Smart Input Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full md:max-w-[75%] relative z-30 mb-10 md:mb-14 mx-auto px-4 md:px-0"
            >
              <div className="bg-white/95 dark:bg-slate-900/95 rounded-[2rem] md:rounded-[3rem] shadow-[0_30px_70px_-15px_rgba(79,70,229,0.25)] dark:shadow-black/40 border-2 border-slate-300/80 dark:border-slate-800/80 p-1.5 md:p-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-1 md:gap-2 px-3 md:pl-8 md:pr-3 focus-within:ring-4 focus-within:ring-indigo-100/70 dark:focus-within:ring-indigo-900/30 focus-within:border-indigo-500/60 transition-all duration-300 hover:shadow-[0_40px_80px_-15px_rgba(79,70,229,0.3)] dark:hover:shadow-black/50 hover:border-indigo-400/80 backdrop-blur-md">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePromptSubmit();
                    }
                  }}
                  placeholder={
                    educationLevel === EducationLevel.JUNIOR ? "Ask your Buddy a question here..." :
                      educationLevel === EducationLevel.CAMPUS ? "Search or ask a research question..." :
                        "your homework or revision question here"
                  }
                  rows={1}
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-slate-100 text-base md:text-lg font-bold py-3 md:py-5 px-1 min-h-[50px] md:min-h-[70px] max-h-40 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-medium outline-none overflow-hidden"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />

                {/* Action Buttons Container */}
                <div className="flex items-center justify-between md:justify-end gap-1 shrink-0 pb-2 md:pb-0 border-t border-slate-100 md:border-t-0 pt-2 md:pt-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group"
                      title="Upload Image"
                    >
                      <ImageIcon className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-3 rounded-2xl transition-all group ${isRecording ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                      title="Record Audio"
                    >
                      {isRecording ? <div className="w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-sm animate-pulse" /> : <Mic className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />}
                    </button>
                  </div>

                  <div className="hidden md:block w-px h-8 bg-slate-200 mx-2" />

                  <button
                    onClick={handlePromptSubmit}
                    disabled={!promptText.trim() || loading}
                    className={`p-3.5 md:p-5 rounded-2xl md:rounded-full transition-all flex items-center justify-center ml-1 ${promptText.trim() ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-100 hover:bg-indigo-700 hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-300 scale-95 cursor-not-allowed'}`}
                  >
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>

              {/* Recording Indicator Overlay */}
              {isRecording && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-red-500 text-white text-sm font-bold px-6 py-2.5 rounded-full animate-bounce shadow-xl shadow-red-200 flex items-center gap-3 z-40">
                  <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  Listening... {formatTime(recordingTime)}
                </div>
              )}
            </motion.div>

            {/* Sleek Action Pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full flex flex-wrap justify-center gap-3 md:gap-4 mb-10"
            >
              {[
                {
                  onClick: isOnline ? startCamera : undefined,
                  icon: <Camera className="w-4 h-4" />,
                  text: educationLevel === EducationLevel.JUNIOR ? "Snap Book" : educationLevel === EducationLevel.CAMPUS ? "Scan Notes" : "Scan Homework",
                  color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
                  aria: "Scan content using camera"
                },
                {
                  onClick: () => setShowTutoringModal(true),
                  icon: <Users className="w-4 h-4" />,
                  text: educationLevel === EducationLevel.JUNIOR ? "Ask Buddy" : educationLevel === EducationLevel.CAMPUS ? "Ask Expert" : "Ask a Question",
                  color: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50",
                  aria: "Ask a question"
                },
                {
                  onClick: () => navigate('/revision'),
                  icon: <Brain className="w-4 h-4" />,
                  text: educationLevel === EducationLevel.JUNIOR ? "Play & Learn" : educationLevel === EducationLevel.CAMPUS ? "Resource Hub" : "Revision & Exams",
                  color: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/50",
                  aria: "Open resources"
                }
              ].map((pill, i) => (
                <button
                  key={i}
                  onClick={pill.onClick}
                  aria-label={pill.aria}
                  className={`${pill.color} px-5 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold text-sm transition-all hover:shadow-lg dark:hover:shadow-black/30 active:scale-95 border flex items-center gap-2.5`}
                >
                  {pill.icon} {pill.text}
                </button>
              ))}
            </motion.div>

            {/* Top Grid Redesign */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-12 mt-8"
            >
              {(() => {
                const validPerformances = subjectPerformance.filter(s => s.hasData);
                let overallAvg = 0;
                let strongest = educationLevel === EducationLevel.JUNIOR
                  ? { subject: 'Storytelling', score: 84 }
                  : educationLevel === EducationLevel.CAMPUS
                    ? { subject: 'Algorithms', score: 88 }
                    : { subject: 'Chemistry', score: 84 };
                let needsAtten = educationLevel === EducationLevel.JUNIOR
                  ? { subject: 'Colouring', score: 45 }
                  : educationLevel === EducationLevel.CAMPUS
                    ? { subject: 'Ethics', score: 52 }
                    : { subject: 'Kiswahili', score: 45 };

                if (validPerformances.length > 0) {
                  const totalScore = validPerformances.reduce((acc, curr) => acc + curr.score, 0);
                  overallAvg = Math.round(totalScore / validPerformances.length);
                  strongest = validPerformances.reduce((prev, current) => (prev.score > current.score) ? prev : current);
                  needsAtten = validPerformances.reduce((prev, current) => (prev.score < current.score) ? prev : current);
                } else {
                  overallAvg = educationLevel === EducationLevel.JUNIOR ? 78 : educationLevel === EducationLevel.CAMPUS ? 68 : 72;
                }

                const totalMins = history.length * 15 || 200;
                const hrs = Math.floor(totalMins / 60);
                const mins = totalMins % 60;

                // Level-specific stat labels
                const statLabels = educationLevel === EducationLevel.JUNIOR
                  ? { avg: 'My Score', top: 'Best Class', weak: 'Keep Trying', time: 'Play Time', weakAction: 'Try Again! 💪' }
                  : educationLevel === EducationLevel.CAMPUS
                    ? { avg: 'GPA Estimate', top: 'Strongest Module', weak: 'Focus Area', time: 'Research Hours', weakAction: 'Needs Depth' }
                    : { avg: 'Overall Avg', top: 'Top Subject', weak: 'Needs Work', time: 'Study Time', weakAction: 'Practice More' };

                const recentTopics = [...new Set(history.map(h => h.topic))].slice(0, 3);
                const defaultSubjects = educationLevel === EducationLevel.JUNIOR
                  ? ['Fun Science', 'Our Story', 'Big Maths']
                  : educationLevel === EducationLevel.CAMPUS
                    ? ['Advanced Theory', 'Core Research', 'Ethics']
                    : ['Physics', 'Chemistry', 'Biology'];
                const subject1 = recentTopics[0] || defaultSubjects[0];
                const subject2 = recentTopics[1] || defaultSubjects[1];
                const subject3 = recentTopics[2] || defaultSubjects[2];

                return (
                  <>
                    {/* ROW 1: Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/80 hover:shadow-md dark:hover:shadow-black/40 transition-all">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{statLabels.avg}</p>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">{overallAvg}%</span>
                          <span className="text-xs font-bold text-emerald-500 mb-1">+5%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(10, overallAvg)}%` }} />
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/80 hover:shadow-md dark:hover:shadow-black/40 transition-all">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{statLabels.top}</p>
                        <span className="text-xl font-black text-slate-900 dark:text-white">{strongest.subject}</span>
                        <p className="text-sm font-bold text-emerald-600 mt-1">{strongest.score}%</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/80 hover:shadow-md dark:hover:shadow-black/40 transition-all">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{statLabels.weak}</p>
                        <span className="text-xl font-black text-slate-900 dark:text-white">{needsAtten.subject}</span>
                        <p className="text-sm font-bold text-amber-500 mt-1">{statLabels.weakAction}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800/80 hover:shadow-md dark:hover:shadow-black/40 transition-all">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{statLabels.time}</p>
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{hrs}h {mins}m</span>
                      </div>
                    </div>

                    {/* ROW 2: Three Equal Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                      <div
                        onClick={() => setMode('MARKETPLACE')}
                        className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl hover:shadow-indigo-200/40 hover:-translate-y-0.5 transition-all relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="relative z-10">
                          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-lg">{educationLevel === EducationLevel.JUNIOR ? '📖' : '📜'}</span>
                          </div>
                          <h3 className="font-black text-lg mb-1">{educationLevel === EducationLevel.JUNIOR ? "Story Time" : educationLevel === EducationLevel.CAMPUS ? "Seminar Prep" : "End-Term Prep"}</h3>
                          <p className="text-indigo-200 text-sm font-medium">{educationLevel === EducationLevel.JUNIOR ? "Explore fun books" : "Advanced research materials"}</p>
                        </div>
                      </div>

                      <button
                        onClick={startCamera}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800/80 text-left hover:shadow-xl dark:hover:shadow-black/40 hover:-translate-y-0.5 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all group"
                      >
                        <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-white text-lg mb-1">{educationLevel === EducationLevel.JUNIOR ? "Buddy Check" : educationLevel === EducationLevel.CAMPUS ? "Assignment Scan" : "Homework Scan"}</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Snap & get instant help</p>
                      </button>

                      <div
                        onClick={() => { setPromptText(`Generate a ${dailyChallenge.quiz}`); handlePromptSubmit(); }}
                        className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white cursor-pointer hover:shadow-xl dark:hover:shadow-black/50 hover:-translate-y-0.5 transition-all relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <span className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">{educationLevel === EducationLevel.JUNIOR ? "Fun Game" : "Daily Challenge"}</span>
                            <span className="text-lg">🏆</span>
                          </div>
                          <h3 className="font-black text-lg mb-1">{educationLevel === EducationLevel.JUNIOR ? "Super Quiz" : "Sprint Quiz"}</h3>
                          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mb-3">{educationLevel === EducationLevel.JUNIOR ? "Win stars for playing" : "5 questions for +50 XP"}</p>
                          <div className="w-full py-2.5 bg-white/10 dark:bg-white/5 border border-white/10 dark:border-white/5 text-white rounded-xl text-center text-sm font-bold group-hover:bg-white/20 transition-colors">
                            {educationLevel === EducationLevel.JUNIOR ? "Play Now →" : "Start →"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ROW 3: Recommendations + Progress */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800/80 hover:shadow-md dark:hover:shadow-black/40 transition-all">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500 fill-current" /> Recommended
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">AI Curated</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            {
                              title: `${(subject1 as string).split('•')[0].trim()} ${educationLevel === EducationLevel.JUNIOR ? 'Recap' : 'Deep Dive'}`,
                              type: educationLevel === EducationLevel.JUNIOR ? "Fun Learning" : "Revision",
                              color: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
                              icon: <Brain className="w-4 h-4" />,
                              prompt: `Give me a concise ${educationLevel === EducationLevel.CAMPUS ? 'abstract' : '5-minute revision summary'} for ${subject1}.`
                            },
                            {
                              title: `${(subject2 as string).split('•')[0].trim()} ${educationLevel === EducationLevel.JUNIOR ? 'Fun' : 'Practice'}`,
                              type: "Practice",
                              color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                              icon: <BookOpen className="w-4 h-4" />,
                              prompt: `Generate ${educationLevel === EducationLevel.JUNIOR ? '3 easy' : '5 practice'} questions for ${subject2}.`
                            },
                            {
                              title: educationLevel === EducationLevel.CAMPUS ? "Colloquium Prep" : "Exams Mock",
                              type: "Exams",
                              color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
                              icon: <PenTool className="w-4 h-4" />,
                              prompt: `Generate ${educationLevel === EducationLevel.CAMPUS ? 'complex discussion questions' :
                                educationLevel === EducationLevel.JUNIOR ? 'KPSEA style exam questions' :
                                  'KCSE style exam questions'
                                } for ${subject3}.`
                            }
                          ].map((item, i) => (
                            <div
                              key={i}
                              onClick={() => { setPromptText(item.prompt); }}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group/item border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                            >
                              <div className={`w-9 h-9 ${item.color} rounded-lg flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform`}>
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{item.title}</h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{item.type}</p>
                              </div>
                              <div
                                onClick={(e) => { e.stopPropagation(); askStudyBuddy(item.prompt); }}
                                className="w-7 h-7 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover/item:border-indigo-400 group-hover/item:text-indigo-500 transition-all shrink-0"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 border border-slate-200/70 hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="font-black text-slate-800 dark:text-white text-base">Progress</h3>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-md">{totalXP} XP</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-slate-800 dark:text-white text-sm">Level {levelInfo.level}</span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{totalXP}/{levelInfo.nextLevelXP} XP</span>
                          </div>
                          <div className="h-2.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" style={{ width: `${(totalXP / levelInfo.nextLevelXP) * 100}%` }} />
                          </div>
                        </div>
                        <div className="space-y-3">
                          {subjectPerformance.slice(0, 3).map((item, i) => (
                            <div key={i}>
                              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                                <span>{item.subject}</span>
                                <span className="text-slate-700">{item.score}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-indigo-500' : 'bg-purple-500'}`} style={{ width: `${item.score}%` }} />
                              </div>
                            </div>
                          ))}
                          {subjectPerformance.length === 0 && (
                            <p className="text-center text-slate-400 text-sm italic py-2">Complete quizzes to track progress!</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ROW 4: Quick Tools */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button onClick={() => setMode('HISTORY' as any)} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-center gap-2.5 hover:shadow-md dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all group">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">History</span>
                      </button>
                      <label className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-center gap-2.5 hover:shadow-md dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all group cursor-pointer">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Upload</span>
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      </label>
                      <button onClick={() => setMode('MARKETPLACE')} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-center gap-2.5 hover:shadow-md dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all group">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Library className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Library</span>
                      </button>
                      <button onClick={() => setMode('MARKETPLACE')} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-center gap-2.5 hover:shadow-md dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all group">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Resources</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>

            {/* TUTORING MODAL TRIGGER */}
            {/* The actual modal logic is shared */}
          </div>

        </div>
      );
    }


    // --- HISTORY VIEW ---
    if (mode === 'HISTORY' as any) {
      return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 w-full flex flex-col transition-colors duration-300">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 sticky top-0 bg-white dark:bg-slate-900 z-20">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ArrowRight className="w-6 h-6 rotate-180" /></button>
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
                  <div key={item.id} onClick={() => restoreActivity(item)} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm text-lg">
                      {item.type === 'QUIZ' ? '📝' : '💡'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">{item.topic || "Untitled Session"}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (mode === 'ANALYTICS' as any) {
      return (
        <LearnerAnalytics
          history={history}
          totalXP={totalXP}
          levelInfo={levelInfo}
          subjectPerformance={subjectPerformance}
          masteryGraph={masteryGraph}
          weakTopics={weakTopics}
        />
      );
    }

    if (mode === 'PROFILE') {
      // PRO GUARD: If no student profile is active, redirect to menu or show login prompt
      if (!isRegistered && role !== UserRole.REVISION) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Login Required</h2>
            <p className="text-slate-500 mb-8 max-w-xs">Please log in or register as a student to view and manage your profile settings.</p>
            <div className="flex flex-col gap-3 w-full max-w-sm justify-center">
              <button
                onClick={() => setShowLogin(true)}
                className="bg-blue-600 hover:bg-blue-700 pulse-blue text-white font-bold rounded-2xl w-full px-8 py-4 transition-all shadow-lg hover:shadow-blue-200 active:scale-95 text-base flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5 text-blue-200" />
                Login / Register Now
              </button>
              <button
                onClick={() => setMode('MENU')}
                className="text-slate-400 hover:text-slate-600 font-bold py-2 transition-colors text-sm"
              >
                Cancel and Return
              </button>
            </div>
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
            role="banner"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('MENU')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all group"
                aria-label="Back to main menu"
              >
                <ArrowRight className="w-5 h-5 text-slate-500 rotate-180 group-hover:text-blue-600" />
              </button>
              <h1 className="font-bold text-xl text-slate-900">Your Profile</h1>
            </div>
            {isRegistered && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold"
                aria-label="Logout from account"
              >
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
                        <option value="1st Year (University)">1st Year (University)</option>
                        <option value="2nd Year (University)">2nd Year (University)</option>
                        <option value="3rd Year (University)">3rd Year (University+)</option>
                        <option value="Diploma / Certificate">Diploma / Certificate</option>
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
                      onClick={() => setSelectedPlan(activePlanDetails || STUDENT_PLANS[1])}
                    >
                      {isPro ? 'Manage' : 'Upgrade'}
                    </Button>
                  </div>
                </div>
              </Card>
            </section>

            {/* PWA Install Section */}
            {deferredPrompt && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <Download className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Get the App</h2>
                    <p className="text-xs text-slate-400 font-medium">Install Somo Smart on your home screen</p>
                  </div>
                </div>

                <Card className="p-6 border-indigo-200 bg-indigo-50/20 shadow-lg shadow-indigo-100/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">Better Experience</p>
                      <p className="text-xs text-slate-500 max-w-[200px]">Faster access, offline support, and no browser bars.</p>
                    </div>
                    <Button
                      onClick={handleInstallClick}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 rounded-xl shadow-md py-3 active:scale-95 transition-all text-sm"
                    >
                      Install Now
                    </Button>
                  </div>
                </Card>
              </section>
            )}

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
            <button onClick={() => isRegistered ? setMode('PROFILE') : setShowLogin(true)} className="flex flex-col items-center gap-1 text-indigo-600 scale-110">
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
          {/* Virtual Classroom Sidebar Navigation */}
          <div className="w-full md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-auto md:h-screen shrink-0 relative z-20">
            {/* Header Area */}
            <div className="p-6 pb-8 border-b border-white/10 bg-gradient-to-b from-indigo-900/50 to-slate-900">
              <button
                onClick={() => setMode('MARKETPLACE')}
                className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors w-fit"
                title="Exit Classroom"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-[10px] font-black uppercase tracking-widest">Exit Class</span>
              </button>

              <div className="flex items-start gap-4 mt-2">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl mt-1 border border-indigo-500/30 shrink-0">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white leading-tight mb-3 tracking-tight">{currentDocument.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200 bg-indigo-500/20 px-2.5 py-1 rounded w-fit border border-indigo-500/20">{currentDocument.grade}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded w-fit border border-emerald-500/20">{currentDocument.subject}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Classroom Activities</p>

              <button
                onClick={() => setStudyTab('LESSON')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${studyTab === 'LESSON' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                <FileText className={`w-5 h-5 ${studyTab === 'LESSON' ? 'text-indigo-200' : ''}`} />
                <span className="text-[15px] tracking-wide">The Lesson</span>
              </button>

              <button
                onClick={() => setStudyTab('RECAP')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${studyTab === 'RECAP' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                <ListChecks className={`w-5 h-5 ${studyTab === 'RECAP' ? 'text-indigo-200' : ''}`} />
                <span className="text-[15px] tracking-wide">Quick Recap</span>
              </button>

              <button
                onClick={() => setStudyTab('QNA')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${studyTab === 'QNA' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className={`w-5 h-5 ${studyTab === 'QNA' ? 'text-indigo-200' : ''}`} />
                    {studyChat.length > 0 && studyTab !== 'QNA' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                    )}
                  </div>
                  <span className="text-[15px] tracking-wide">Raise Hand</span>
                </div>
              </button>

              <div className="pt-4 mt-4 border-t border-white/5">
                <button
                  onClick={() => setStudyTab('QUIZ')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border border-dashed ${studyTab === 'QUIZ' ? 'bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] border-emerald-500/50 text-emerald-400 font-bold' : 'border-slate-700 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-[15px] tracking-wide">Pop Quiz</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Virtual Classroom</span>
                  <span className="block text-xs font-bold text-slate-400">Somo Smart</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-slate-50 relative h-[50vh] md:h-screen overflow-hidden">

            {/* TAB: LESSON */}
            {studyTab === 'LESSON' && (
              <div className="flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
                <div className="max-w-4xl mx-auto bg-white p-6 md:p-16 rounded-[2rem] shadow-sm border border-slate-100">
                  {isSummarizing ? (
                    <div className="space-y-6 animate-pulse">
                      <div className="h-8 bg-slate-100 rounded-lg w-1/3 mb-10"></div>
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                      <div className="h-4 bg-slate-100 rounded w-11/12"></div>
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                      <div className="h-4 bg-slate-100 rounded w-5/6 mt-8"></div>
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </div>
                  ) : explanation ? (
                    <div className="prose prose-slate prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600 prose-li:marker:text-indigo-400 prose-strong:font-semibold">
                      <div className="mb-10 border-b border-indigo-100 pb-6">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 bg-indigo-50 rounded-2xl">
                            <BookOpen className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight m-0">The Lesson</h2>
                            <p className="text-sm font-medium text-slate-500 m-0 leading-none mt-1">Detailed Study Guide & Notes</p>
                          </div>
                        </div>

                        {/* Action Pill Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={handlePodcastToggle}
                            disabled={podcastLoading}
                            className={`flex items-center gap-3 px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${isPodcastPlaying ? 'bg-indigo-700 shadow-inner' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                              {podcastLoading ? (
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                              ) : isPodcastPlaying ? (
                                <Pause className="w-4 h-4 text-white" />
                              ) : (
                                <Headphones className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex flex-col items-start pr-2">
                              <span className="text-white font-black text-sm leading-none m-0 uppercase tracking-wide">Listen & Learn</span>
                              <span className="text-indigo-200 font-bold text-[0.65rem] leading-none m-0 uppercase tracking-widest mt-1">Audio Lesson Explanation</span>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => setStudyTab('QNA')}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md hover:-translate-y-0.5"
                            >
                              <Hand className="w-3.5 h-3.5" />
                              Raise Hand
                            </button>
                            <button
                              onClick={() => currentDocument && handleDownloadAIRevisionNotes(currentDocument)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md hover:-translate-y-0.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Notes
                            </button>
                            <button
                              onClick={() => setStudyTab('QUIZ')}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 hover:shadow-lg hover:-translate-y-0.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Quiz
                            </button>
                          </div>
                        </div>
                      </div>

                      {explanation.subtopics && explanation.subtopics.length > 0 ? (
                        <div className="space-y-16">
                          {explanation.subtopics.map((sub, idx) => (
                            <div key={idx} className="relative">
                              <h3 className="text-xl font-semibold text-slate-700 mb-4">{sub.title}</h3>

                              {sub.blocks && sub.blocks.length > 0 ? (
                                <div className="space-y-4">
                                  {sub.blocks.map((block, bIdx) => (
                                    <React.Fragment key={bIdx}>
                                      {block.type === 'paragraph' && block.text && (
                                        <p className="text-slate-700 leading-relaxed text-lg m-0 whitespace-pre-line">{block.text}</p>
                                      )}
                                      {block.type === 'list' && block.items && block.items.length > 0 && (
                                        <ul className="list-disc list-outside ml-6 space-y-2 m-0 text-slate-700 text-lg">
                                          {block.items.map((item, iIdx) => (
                                            <li key={iIdx} className="pl-2">{item}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              ) : sub.content ? (
                                <MarkdownText content={sub.content} />
                              ) : null}

                              <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-500">
                                    <Trophy className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="text-emerald-900 font-bold m-0 text-base leading-tight">Mastered this topic?</h4>
                                    <p className="text-emerald-700 m-0 text-sm leading-tight mt-1">Test your knowledge before moving on.</p>
                                  </div>
                                </div>
                                <Button onClick={() => setStudyTab('QUIZ')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-2 font-bold whitespace-nowrap shadow-md shadow-emerald-500/20">
                                  Take a Quick Quiz
                                </Button>
                              </div>
                              {idx < explanation.subtopics!.length - 1 && <hr className="my-16 border-slate-100" />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <MarkdownText content={explanation.explanation} />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-32 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <BookOpen className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-black text-slate-400">Loading lesson material...</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: RECAP */}
            {studyTab === 'RECAP' && (
              <div className="flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
                <div className="max-w-3xl mx-auto">
                  <div className="mb-10 text-center md:text-left">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest mb-4">Memory Check</span>
                    <h2 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">Quick Recap</h2>
                    <p className="text-slate-500 font-medium text-lg max-w-xl">Key concepts and takeaways from the lesson. Tap each to expand the detailed revision notes — make sure you've mastered every concept before the quiz.</p>
                  </div>

                  {explanation ? (
                    <div className="space-y-4">
                      {explanation.recapNodes && explanation.recapNodes.length > 0 ? (
                        explanation.recapNodes.map((node, i) => {
                          const isExpanded = expandedRecaps.includes(i);
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              key={i}
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedRecaps(prev => prev.filter(id => id !== i));
                                } else {
                                  setExpandedRecaps(prev => [...prev, i]);
                                }
                              }}
                              className={`bg-white rounded-3xl shadow-sm border ${isExpanded ? 'border-indigo-400 shadow-md ring-4 ring-indigo-50' : 'border-slate-200 hover:border-indigo-300'} transition-all cursor-pointer relative overflow-hidden`}
                            >
                              <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-indigo-500 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0'}`}></div>

                              <div className="p-6 md:p-8 flex gap-6 items-start">
                                <div className={`p-3 border rounded-xl transition-colors shrink-0 ${isExpanded ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                                  {isExpanded ? <CheckCircle className="w-6 h-6" /> : <ListChecks className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 pt-1.5">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <span className={`text-lg font-black leading-tight tracking-tight transition-colors block ${isExpanded ? 'text-indigo-900' : 'text-slate-800'}`}>{node.point}</span>
                                      <span className="text-xs font-medium text-slate-400 mt-1 block">Tap to expand revision notes</span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                                  </div>

                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                        animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="prose prose-slate prose-p:leading-relaxed text-slate-600 border-t border-slate-100 pt-4">
                                          <MarkdownText content={node.details} />
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        explanation.summaryPoints.map((point, i) => (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex gap-6 items-start group hover:border-indigo-300 hover:shadow-md transition-all cursor-cell relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors shrink-0">
                              <CheckCircle className="w-6 h-6 text-indigo-500 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-xl text-slate-700 font-medium leading-relaxed pt-1.5">{point}</span>
                          </motion.div>
                        ))
                      )}

                      <div className="mt-12 p-8 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl text-center">
                        <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-slate-800 mb-2">Feeling Confident?</h3>
                        <p className="text-slate-500 font-medium mb-6">If you understood these points, you are ready to test your knowledge.</p>
                        <Button onClick={() => setStudyTab('QUIZ')} className="bg-indigo-600 text-white rounded-full px-8 py-3 font-bold hover:bg-indigo-700 transition-colors">Go to Pop Quiz</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-slate-400">Loading recap...</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: QUIZ */}
            {studyTab === 'QUIZ' && (
              <div className="flex-1 overflow-y-auto p-4 md:p-12 flex flex-col items-center justify-center no-scrollbar animate-in fade-in zoom-in-95 duration-500">
                <div className="max-w-lg w-full text-center bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                  <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Pop Quiz!</h2>
                  <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">Taking a practice quiz right after a session increases knowledge retention by up to <strong className="text-emerald-600 font-black">80%</strong>. Let's see how much you remember!</p>

                  <Button
                    fullWidth
                    className="rounded-full py-5 text-lg bg-emerald-500 border-b-4 border-emerald-700 text-white font-black hover:bg-emerald-400 hover:border-emerald-600 active:border-b-0 active:translate-y-1 transition-all shadow-lg hover:shadow-emerald-500/30"
                    onClick={generatePracticeQuiz}
                  >
                    Start Quiz Now
                  </Button>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6">Powered by Somo AI Assessment</p>
                </div>
              </div>
            )}

            {/* TAB: QNA (Raise Hand / Chatbot) */}
            {studyTab === 'QNA' && (
              <div className="flex-1 flex flex-col bg-white rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none shadow-[-10px_0_30px_rgba(0,0,0,0.03)] relative h-full animate-in fade-in slide-in-from-right-8 duration-500 border-l border-slate-200 overflow-hidden">
                <div className="p-5 md:p-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-10 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                      <Sparkles className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-800 text-2xl tracking-tight leading-none mb-1">Somo Smart</h2>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 inline-block rounded-full bg-emerald-500 animate-pulse"></span> Online Assistant</p>
                    </div>
                  </div>
                </div>

                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar pb-40 scroll-smooth bg-slate-50/50"
                >
                  {studyChat.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-80">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border-4 border-indigo-50 shadow-xl relative">
                        <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <Sparkles className="w-10 h-10 text-indigo-500 relative z-10" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Raise your hand!</h3>
                      <p className="text-base font-medium text-slate-500 leading-relaxed">I am your personal teacher for this class. Ask me to clarify anything in the notes, give you an example, or explain it in a simpler way.</p>
                    </div>
                  ) : (
                    studyChat.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Chat Avatars */}
                        {msg.role === 'model' && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                        <div className={`max-w-[85%] p-5 rounded-3xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200/50 mr-2' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium'}`}>
                          <MarkdownText content={msg.text} />
                        </div>
                      </motion.div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm opacity-50">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-3 h-[60px]">
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Secure Chat Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-white via-white to-transparent shrink-0">
                  <div className="max-w-4xl mx-auto space-y-3">
                    {pendingMedia && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 inline-flex items-center gap-3">
                          {pendingMedia.type === 'IMAGE' ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                              <img src={`data:${pendingMedia.mimeType};base64,${pendingMedia.data}`} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                              {pendingMedia.type === 'AUDIO' ? <Mic className="w-6 h-6 text-indigo-600" /> : <FileText className="w-6 h-6 text-indigo-600" />}
                            </div>
                          )}
                          <div className="pr-6 text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Attached {pendingMedia.type}</p>
                            <p className="text-xs font-bold text-slate-800">Somo is ready to analyze this!</p>
                          </div>
                          <button onClick={() => setPendingMedia(null)} className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors ml-2">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <div className="relative group">
                      <div className="absolute -inset-1.5 bg-indigo-500 rounded-[2rem] opacity-0 group-focus-within:opacity-20 blur-lg transition duration-500"></div>
                      <div className="relative flex items-center bg-white border border-slate-200 rounded-[2rem] p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                        <button type="button" onClick={() => studyFileInputRef.current?.click()} className="p-3.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors hidden sm:block">
                          <Upload className="w-6 h-6" />
                        </button>
                        <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-3.5 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}>
                          <Mic className="w-6 h-6" />
                        </button>
                        <input type="file" ref={studyFileInputRef} className="hidden" accept="image/*,.pdf" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const data = await fileToGenerativePart(file);
                            setPendingMedia({ data, mimeType: file.type, type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE' });
                          }
                        }} />

                        <input
                          type="text"
                          value={promptText}
                          onChange={(e) => setPromptText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && askStudyBuddy(promptText)}
                          placeholder="Ask Teacher Somo a question..."
                          className="flex-1 bg-transparent px-4 py-4 outline-none text-slate-700 placeholder:text-slate-400 font-medium text-lg"
                          disabled={loading}
                        />

                        <button
                          type="button"
                          disabled={(!promptText.trim() && !pendingMedia) || loading}
                          onClick={() => askStudyBuddy(promptText)}
                          className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200 mr-1"
                        >
                          <ArrowRight className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (mode === 'SCAN_EXPLAIN') {
      return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center p-6 w-full animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col items-center text-center relative z-10 mb-8">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner border border-indigo-100 dark:border-indigo-800/50">
                {sidebarTab === 'HOMEWORK' ? (
                  <ClipboardList className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
                {educationLevel === EducationLevel.JUNIOR
                  ? (sidebarTab === 'HOMEWORK' ? 'Task Buddy' : 'Helper Buddy')
                  : educationLevel === EducationLevel.CAMPUS
                    ? (sidebarTab === 'HOMEWORK' ? 'Assignments' : 'AI Researcher')
                    : (sidebarTab === 'HOMEWORK' ? 'Homework Assistant' : 'Smart Tutor')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
                {imageData
                  ? (educationLevel === EducationLevel.JUNIOR ? "I see your picture! What's next?" : "Image attached! What would you like to know about it?")
                  : sidebarTab === 'HOMEWORK'
                    ? (educationLevel === EducationLevel.JUNIOR ? "Show me your task or tell me about it!" : "Upload your homework question or record audio to get structured guidance.")
                    : (educationLevel === EducationLevel.JUNIOR ? "Ask me anything, show me a picture, or talk to me!" : "Type a question, upload an image, or record an audio clip to get started.")}
              </p>
            </div>

            {imageData && (
              <div className="relative w-full max-w-sm mx-auto h-48 mb-8 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 group shadow-md text-center flex items-center justify-center">
                <img src={`data:${imageData.mimeType};base64,${imageData.base64}`} alt="Uploaded content" className="max-w-full max-h-full object-contain" />
                <button
                  onClick={() => setImageData(null)}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors shadow-sm"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="w-full relative z-10">
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-[2rem] p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 border-2 border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30 transition-all shadow-inner">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (imageData) {
                        // If we already have an image, trigger explaining the image
                        setLoading(true);
                        setLoadingText("Analyzing your content...");
                        setMode('SCAN');
                        const purpose = sidebarTab === 'HOMEWORK' ? 'HOMEWORK' : 'TUTOR';
                        explainImage(imageData.base64, imageData.mimeType, level, language, purpose)
                          .then(result => {
                            setExplanation(result);
                            setPodcastScript(null);
                            setIsPodcastPlaying(false);
                            setMode('RESULT');
                          })
                          .catch(err => {
                            console.error(err);
                            setError({ title: "Analysis Failed", message: "Failed to analyze the image." });
                            setMode('SCAN_EXPLAIN');
                          })
                          .finally(() => setLoading(false));
                      } else {
                        handlePromptSubmit();
                      }
                    }
                  }}
                  placeholder={
                    imageData
                      ? (educationLevel === EducationLevel.JUNIOR ? "Tell your Buddy about this picture!" : "Ask about the image...")
                      : (educationLevel === EducationLevel.JUNIOR ? "Ask your Buddy anything!" :
                        educationLevel === EducationLevel.CAMPUS ? "Analyze your course materials..." :
                          "Ask your revision question...")
                  }
                  rows={1}
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-slate-100 text-lg font-bold py-4 px-5 min-h-[60px] max-h-[200px] resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />
                <div className="flex items-center justify-end gap-2 pr-2 pb-2 md:pb-0">
                  {!imageData && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        title="Upload Image"
                      >
                        <ImageIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-xl transition-colors ${isRecording ? 'text-red-500 bg-red-100 dark:bg-red-900/30 animate-pulse' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                        title="Record Audio"
                      >
                        <Mic className="w-6 h-6" />
                      </button>
                      <button
                        onClick={startCamera}
                        className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                        title="Open Camera"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      if (imageData) {
                        setLoading(true);
                        setLoadingText("Analyzing your content...");
                        setMode('SCAN');
                        explainImage(imageData.base64, imageData.mimeType, level, language)
                          .then(result => {
                            setExplanation(result);
                            setMode('RESULT');
                          })
                          .catch(err => {
                            console.error(err);
                            setError({ title: "Analysis Failed", message: "Failed to analyze the image." });
                            setMode('MENU');
                          })
                          .finally(() => setLoading(false));
                      } else {
                        handlePromptSubmit();
                      }
                    }}
                    disabled={(!promptText.trim() && !imageData) || loading}
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 ml-2 shadow-md"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setImageData(null);
                setMode('MENU');
              }}
              className="mt-8 mx-auto block text-sm font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'RESULT' && explanation) {
      return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 dark:border-slate-800">
          {/* Sticky Glass Header */}
          <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
            <button onClick={() => { cancelPodcast(); handleExitResult(); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
              <ArrowRight className="w-5 h-5 text-slate-500 rotate-180 group-hover:text-blue-600" />
              <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600">Dashboard</span>
            </button>
            <h1 className="font-bold text-lg text-slate-900 dark:text-white truncate flex-1">{explanation.topic}</h1>

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
                <span className="text-xs font-black uppercase tracking-wide leading-none mb-0.5">{isPodcastPlaying ? "Stop Playing" : "Listen & Learn"}</span>

                <span className={`text-[9px] font-bold uppercase tracking-wider ${isPodcastPlaying ? 'text-indigo-500' : 'text-indigo-100'}`}>
                  {isPodcastPlaying ? "Audio Lesson" : "Audio Lesson Explanation"}
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
                className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
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
            <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
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
                    <p className="text-sm font-black uppercase tracking-wide">{isPodcastPlaying ? "Stop" : "Listen & Learn"}</p>

                    <p className={`text-xs font-medium ${isPodcastPlaying ? 'text-indigo-600' : 'text-indigo-100'}`}>
                      {isPodcastPlaying ? "Audio Lesson Active" : "Audio Lesson Explanation"}
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
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
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
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white"
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
              className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 mt-8"
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
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
            <button onClick={() => isRegistered ? setMode('PROFILE') : setShowLogin(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
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
          score,
          details: JSON.stringify(quizData)
        });

        // Phase 2: Update mastery graph & spaced repetition schedule
        processQuizCompletion(
          quizData.topic,
          score,
          currentDocument?.subject,
          currentDocument?.grade || studentProfile?.grade
        );

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
            await verifySubscription();
            setMode('MENU');
            setSelectedPlan(null);
            // Auto-open if we have a pending material
            if (pendingMaterialId) {
              const material = unifiedMaterials.find(m => m.id === pendingMaterialId || (m as any).realId === pendingMaterialId);
              if (material?.fileUrl) window.open(material.fileUrl, '_blank');
              setPendingMaterialId(null);
            }
          }}
          onCancel={() => handlePricingNavigation()}
        />
      );
    }

    if (mode === 'MARKETPLACE') {
      return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 dark:border-slate-800 flex flex-col">
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
          <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
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
                    onClick={() => handlePricingNavigation()}
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
                    {educationLevel === EducationLevel.CAMPUS
                      ? 'University lecture notes & course materials.'
                      : educationLevel === EducationLevel.JUNIOR
                        ? 'KPSEA prep & fun learning notes.'
                        : 'Verified CBC past papers & professional revision notes.'}
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
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 min-w-[180px] group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all active:scale-95"
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
              {/* Simple Horizontal Mode Tabs for Mobile-First Experience */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 pt-2" role="tablist">
                {[
                  { id: 'TUTOR', icon: Brain, label: 'Tutor', color: 'indigo' },
                  { id: 'REVISION', icon: Library, label: 'Exams', color: 'amber' },
                  { id: 'RESOURCES', icon: BookOpen, label: 'Library', color: 'blue' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={mode === tab.id}
                    aria-label={`Switch to ${tab.label} section`}
                    onClick={() => setMode(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all active:scale-95 ${mode === tab.id
                      ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-200`
                      : `bg-slate-50 text-slate-500 hover:bg-slate-100`
                      }`}
                  >
                    <tab.icon className={`w-4 h-4 ${mode === tab.id ? 'text-white' : `text-${tab.color}-600`}`} />
                    {tab.label}
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
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-black/30 transition-all flex flex-col justify-between group"
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

                          <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</h4>
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
                                else handlePricingNavigation();
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
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
            <button onClick={() => isRegistered ? setMode('PROFILE') : setShowLogin(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
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
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">My Library</h1>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5">Unlocked Resources</p>
            </div>
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            {ownedUnifiedMaterials.length === 0 ? (
              <div className="py-12 md:py-32 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700">
                  <Library className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Your library is empty</h4>
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
                    className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-6 group hover:border-indigo-100 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-50/30 dark:hover:shadow-black/30 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 shadow-sm ${item.isVerified ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {item.category === 'NOTES' ? <FileText className="w-8 h-8" /> : item.category === 'SYLLABUS' ? <Library className="w-8 h-8" /> : <Layers className="w-8 h-8" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{item.subject}</span>
                        {item.isVerified && <span className="bg-indigo-50 p-1 rounded-full"><Sparkles className="w-2 h-2 text-indigo-600" /></span>}
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white text-lg truncate group-hover:text-indigo-600 transition-colors tracking-tight">{item.title}</h4>
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
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
            <button onClick={() => isRegistered ? setMode('PROFILE') : setShowLogin(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
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
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 relative z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
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
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8 text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
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

            {/* Phase 2: Due for Review Section */}
            {dueForReview.length > 0 && (
              <div className="px-6 pb-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/60 rounded-3xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm tracking-tight">Due for Review</h3>
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">{dueForReview.length} topic{dueForReview.length > 1 ? 's' : ''} to revise</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {dueForReview.slice(0, 3).map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleTopicClick(item.topic)}
                        className="w-full bg-white/80 hover:bg-white border border-amber-100 rounded-2xl px-4 py-3 flex items-center justify-between group transition-all"
                      >
                        <div className="text-left">
                          <p className="font-bold text-slate-800 text-sm">{item.topic}</p>
                          <p className="text-[10px] text-amber-600 font-medium">Last score: {item.lastScore}%</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={sidebarTab}
        onTabChange={handleSidebarTabChange}
        onLogout={() => setShowLogoutModal(true)}
        onProfile={() => setMode('PROFILE')}
      />

      {/* Main Content */}
      <div className="lg:ml-[260px] min-h-screen overflow-x-hidden min-w-0">
        {renderMode()}
      </div>

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
      <ParentPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        hasPin={!!studentProfile?.parentPin}
        onSetPin={setParentPin}
        onVerifyPin={verifyChatPin}
        parentPhone={studentProfile?.parentPhone}
      />

      {/* Payment Gate Modal */}
      <AnimatePresence>
        {showPaymentGate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Payment Required</h3>
              <p className="text-slate-500 text-sm mb-1">To chat with your teacher about:</p>
              <p className="font-bold text-slate-800 mb-4">{showPaymentGate.topic}</p>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 mb-6">
                <p className="text-3xl font-black">KES {showPaymentGate.price}</p>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">One-time fee</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // For now, proceed to chat (wire to payment later)
                    setChatRequestId(showPaymentGate.reqId);
                    fetchChatMessages(showPaymentGate.reqId);
                    setShowPaymentGate(null);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-xl transition-all"
                >
                  Pay KES {showPaymentGate.price} & Start Chat
                </button>
                <button
                  onClick={() => setShowPaymentGate(null)}
                  className="w-full py-2.5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      handlePricingNavigation();
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
                      handlePricingNavigation();
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
                  {['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE', 'Physics', 'Biology', 'Chemistry', 'History', 'Geography', 'Business Studies', 'Computer', 'Agriculture', 'Indigenous Language', 'French', 'German', 'Arabic', 'Integrated Science', 'Physical Education (PE)', 'Music'].map(s => (
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
              if (!desc) { alert("Please describe your question."); return; }
              if (selectedGrade === 'ALL' || subjectFilter === 'ALL') {
                alert("Please select a Grade and Subject for your request.");
                return;
              }
              if (!studentProfile) {
                alert("You need to log in with your Student Code to ask a teacher. Guest mode doesn't support this feature.");
                return;
              }
              setLoading(true);
              const res = await createTutoringRequest(tutoringTopic || "General Help", desc, 20, selectedGrade, subjectFilter);
              setLoading(false);
              if (res.success) { setShowTutoringModal(false); alert("Request Sent!"); }
              else { alert(res.message || "Failed to send request. Please try again."); }
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
