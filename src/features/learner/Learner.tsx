import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../assets/images/main_logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import {
  Sparkles, Home, X, XCircle, Camera, ScanLine, Mic, Upload, Clock,
  CheckCircle, Play, Pause, ChevronRight, Star, BookOpen, Brain, Lightbulb, Lock, Volume2, CreditCard, Crown,
  ArrowRight, UserCircle, Download, ImageIcon, Trash2, AlertTriangle, LogOut, Users, DollarSign, FileText, ShoppingBag, Library, Layers,
  Calculator, FlaskConical, Globe, Languages, Loader2, Headphones, PenTool, Zap, ListChecks, Trophy, Hand, ClipboardList
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExplanationResult, QuizData, ViewState, SubscriptionPlan, LearnerProfile, LearnerActivity, UserRole, PodcastScript, ChatMessage, RevisionMode, TeacherActivity, EducationLevel } from '../../types';
import { PricingPage } from '../subscription/PricingPage';
import { PaymentFlow } from '../subscription/PaymentFlow';
import { LEARNING_CREDIT_PACKS, STUDENT_PLANS, TEACHER_PLANS, DOWNLOAD_PASS } from '../../data/pricing';
import { RegistrationModal } from '../../components/RegistrationModal'; // Assuming path
import { LoginModal } from '../../components/LoginModal'; // Assuming path
import { AIFeedbackButtons } from '../../components/AIFeedbackButtons';
import { LogoutModal } from '../../components/LogoutModal';
import { ParentPinModal } from '../../components/ParentPinModal';
import { MarkdownText, Button, Card } from '../../components/Shared';
import { MasteryDashboard } from '../../components/MasteryDashboard';
import {
  calculateTotalXP, calculateLevel,
  calculateStreak, calculateSubjectPerformance, getDailyChallenge
} from '../../services/gamificationService';
import { translations } from '../../data/translations';
import { QuizReviewSummary, QuizRunner } from './QuizRunner';
import { ThemeToggle } from '../../components/ThemeToggle';
import { DashboardSidebar, SidebarTab } from '../../components/DashboardSidebar';
import { classroomService, StudentClassroomSummary } from '../../services/classroomService';
import { getLearnerCtaVariant } from '../../utils/abExperiments';
import { QuestRoadmap } from './QuestRoadmap';
import { LearningPathView } from './LearningPathView';
import { safeImport } from '../../utils/safeImport';
import { PlanLimitError, getPlanLimit, getPlanUsage } from '../../services/planLimitService';
import { pesapalService } from '../../services/pesapalService';
import { supabase } from '../../lib/supabase';
import { extractTextFromURL } from '../../services/contextService';

const RevisionLanding = React.lazy(() => safeImport(() => import('../revision/RevisionLanding').then(module => ({ default: module.RevisionLanding }))));
const RevisionSession = React.lazy(() => safeImport(() => import('../revision/RevisionSession').then(module => ({ default: module.RevisionSession }))));
const Community = React.lazy(() => safeImport(() => import('../community/Community').then(module => ({ default: module.Community }))));
const LearnerAnalytics = React.lazy(() => safeImport(() => import('./LearnerAnalytics').then(module => ({ default: module.LearnerAnalytics }))));
const ConversationalTutor = React.lazy(() => safeImport(() => import('./ConversationalTutor').then(module => ({ default: module.ConversationalTutor }))));
const ReferralView = React.lazy(() => safeImport(() => import('./ReferralView').then(module => ({ default: module.ReferralView }))));

const loadMemoryService = () => safeImport(() => import('../../services/learnerMemoryService'));

const loadGeminiService = () => safeImport(() => import('../../services/learnerGeminiService'));
import { RateLimitError } from '../../services/geminiService';

const fileToGenerativePart = async (...args: any[]) => (await loadGeminiService()).fileToGenerativePart(...args as [File]);
const explainImage = async (...args: any[]) => (await loadGeminiService()).explainImage(...args as [string, string, 'Simple' | 'Exam', 'EN' | 'SW', any]);
const explainAudio = async (...args: any[]) => (await loadGeminiService()).explainAudio(...args as [string, string, 'Simple' | 'Exam', 'EN' | 'SW']);
const explainTopic = async (...args: any[]) => ((await loadGeminiService()).explainTopic as any)(...args);
const generateQuickQuiz = async (...args: any[]) => ((await loadGeminiService()).generateQuickQuiz as any)(...args);
const generateQuiz = async (...args: any[]) => ((await loadGeminiService()).generateQuiz as any)(...args);
const generateSpeech = async (...args: any[]) => ((await loadGeminiService()).generateSpeech as any)(...args);
const stopSpeech = () => { void loadGeminiService().then(service => service.stopSpeech()); };
const generateLessonRecap = async (...args: any[]) => ((await loadGeminiService()).generateLessonRecap as any)(...args);
const continueResearch = async (...args: any[]) => ((await loadGeminiService()).continueResearch as any)(...args);
const summarizeDocument = async (...args: any[]) => ((await loadGeminiService()).summarizeDocument as any)(...args);
const generateRichLessonNotes = async (...args: any[]) => ((await loadGeminiService()).generateRichLessonNotes as any)(...args);
const generatePodcastScript = async (...args: any[]) => ((await loadGeminiService()).generatePodcastScript as any)(...args);
const loadElevenLabsService = () => safeImport(() => import('../../services/elevenLabsService'));
const speak = async (...args: any[]) => ((await loadElevenLabsService()).speak as any)(...args);
const stopSpeechElevenLabs = () => { void loadElevenLabsService().then(service => service.stopSpeech()); };
const playPodcast = async (...args: any[]) => ((await loadElevenLabsService()).playPodcast as any)(...args);
const cancelPodcast = () => { void loadElevenLabsService().then(service => service.cancelPodcast()); };

const formatUsageRemaining = (remaining: number, unit: 'calls' | 'characters') => {
  if (unit === 'characters') {
    if (remaining >= 1000) return `${Math.floor(remaining / 1000)}k chars`;
    return `${remaining} chars`;
  }
  return `${remaining} left`;
};

// ─── Branded lazy-load skeleton ───────────────────────────────────────────────
const DeferredViewLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-slate-400">
    {/* Animated indigo bar */}
    <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-full"
        style={{ animation: 'soma-shimmer 1.6s ease-in-out infinite', backgroundSize: '200% 100%' }}
      />
    </div>
    <style>{`@keyframes soma-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Loading Somo&hellip;</p>
  </div>
);

// --- CBC & KCSE GLOSSARY FOR LEARNER LIBRARY ---
const EDUCATIONAL_GLOSSARY: Record<string, { definition: string; translation: string; pronunciation: string }> = {
  strand: {
    definition: "A broad field of study or major thematic area within a specific subject in the Competency Based Curriculum.",
    translation: "Mada (Eneo pana la kimasomo katika mtaala mpya).",
    pronunciation: "/strænd/"
  },
  "sub-strand": {
    definition: "A smaller sub-topic or specific learning unit under a broader Strand in the syllabus.",
    translation: "Mada Ndogo (Kijisehemu cha mada kuu katika mtaala).",
    pronunciation: "/sʌb-strænd/"
  },
  competency: {
    definition: "The ability to apply knowledge, skills, values, and attitudes to successfully perform tasks in daily life.",
    translation: "Uwezo (Ujuzi na stadi za kutenda jambo na kutatua matatizo).",
    pronunciation: "/ˈkɒmpɪtənsi/"
  },
  assessment: {
    definition: "The systematic process of gathering evidence of a learner's progress, understanding, and performance.",
    translation: "Tathmini (Utaratibu wa kukadiria kiwango cha uelewa wa mwanafunzi).",
    pronunciation: "/əˈsɛsmənt/"
  },
  kicd: {
    definition: "Kenya Institute of Curriculum Development - the official government body responsible for designing school curricula.",
    translation: "Taasisi ya Ukuzaji Mtaala ya Kenya (Inayohusika na kuandaa masomo).",
    pronunciation: "/kē-ī-sē-dē/"
  },
  knec: {
    definition: "Kenya National Examinations Council - the official national body responsible for setting, administering, and marking primary and secondary exams.",
    translation: "Baraza la Mitihani la Kitaifa la Kenya (Linaloandaa na kusimamia mitihani).",
    pronunciation: "/kē-ɛn-ē-sē/"
  },
  kpsea: {
    definition: "Kenya Primary School Education Assessment - the national evaluation done at the end of Grade 6 under the CBC system.",
    translation: "Tathmini ya Elimu ya Msingi ya Kenya (Mitihani ya mwisho wa Gredi ya 6).",
    pronunciation: "/kē-pē-ɛs-ē-ā/"
  },
  kcse: {
    definition: "Kenya Certificate of Secondary Education - the national examination taken at the end of secondary school (Form 4).",
    translation: "Cheti cha Elimu ya Sekondari ya Kenya (Mtihani wa mwisho wa sekondari).",
    pronunciation: "/kē-sē-ɛs-ē/"
  },
  values: {
    definition: "Core principles such as love, respect, unity, and integrity integrated into lessons to shape character.",
    translation: "Maadili (Nguzo za tabia njema na utu zinazofunzwa shuleni).",
    pronunciation: "/ˈvæljuːz/"
  },
  uzalendo: {
    definition: "A core social value representing patriotism, love for country, and active citizenship in the Kenyan society.",
    translation: "Patriotism (Uzalendo na mapenzi ya dhati kwa nchi yako ya Kenya).",
    pronunciation: "/oo-zah-lɛn-dɔ/"
  },
  katiba: {
    definition: "The Constitution of Kenya - the supreme law of the Republic of Kenya that guides governance and citizen rights.",
    translation: "Constitution (Sheria kuu zaidi za nchi ya Kenya).",
    pronunciation: "/kah-tee-bah/"
  },
  mtaala: {
    definition: "The curriculum or course of study designed for students in school, detailing subjects and learning goals.",
    translation: "Curriculum (Mwongozo mzima wa masomo na ujifunzaji shuleni).",
    pronunciation: "/m-tah-ah-lah/"
  }
};

// --- SYLLABUS MAPPING HELPER ---
const getSyllabusMapping = (subject: string, grade: string) => {
  const cleanSubject = (subject || '').toUpperCase();

  if (cleanSubject.includes('MATH') || cleanSubject.includes('HESABU')) {
    return {
      curriculum: 'KICD CBC / KNEC Standards',
      strand: 'Mathematical Operations & Relations',
      subStrand: 'Algebraic Equations & Problem Solving',
      outcomes: [
        'Formulate simple linear equations from real-life scenarios',
        'Solve single-variable algebraic equations with rational numbers',
        'Verify solutions of equations by substitution'
      ]
    };
  } else if (cleanSubject.includes('SCI') || cleanSubject.includes('SAYANSI') || cleanSubject.includes('BIO') || cleanSubject.includes('CHEM') || cleanSubject.includes('PHYS')) {
    return {
      curriculum: 'KICD CBC Syllabus Framework',
      strand: 'Living Things and Their Environment',
      subStrand: 'Human Anatomy, Health, and Body Systems',
      outcomes: [
        'Identify key organs and describe their roles in body systems',
        'Evaluate factors affecting human health and hygiene practices',
        'Formulate models showing the interaction of organs'
      ]
    };
  } else if (cleanSubject.includes('ENG') || cleanSubject.includes('LANG')) {
    return {
      curriculum: 'Kenyan Language Curriculum Standard',
      strand: 'Language Use, Grammar and Literacy',
      subStrand: 'Parts of Speech & Sentence Structuring',
      outcomes: [
        'Apply grammatical rules correctly in writing and speech',
        'Differentiate between active and passive voices in context',
        'Construct descriptive paragraphs with rich vocabulary'
      ]
    };
  } else if (cleanSubject.includes('KISW') || cleanSubject.includes('KISWAHILI')) {
    return {
      curriculum: 'Mtaala wa Kiswahili (KICD)',
      strand: 'Sarufi na Matumizi ya Lugha',
      subStrand: 'Ngeli za Nomino na Upatanisho wa KisARUFI',
      outcomes: [
        'Kutumia ngeli mbalimbali kwa usahihi katika sentensi',
        'Kutambua viambishi na jinsi vinavyoathiri maana',
        'Kuandika insha fupi yenye mtiririko mzuri na msamiati sahihi'
      ]
    };
  } else if (cleanSubject.includes('SOC') || cleanSubject.includes('CRE') || cleanSubject.includes('IRE') || cleanSubject.includes('HRE') || cleanSubject.includes('RELIG')) {
    return {
      curriculum: 'Social Studies & Religious Education CBC Guidelines',
      strand: 'Citizenship, Values and Community Integration',
      subStrand: 'National Unity, Uzalendo, and Constitutional Law',
      outcomes: [
        'Explain the importance of national values (Integrity, Peace)',
        'Describe the structure and key chapters of the Katiba (Constitution)',
        'Demonstrate active participation in community service learning'
      ]
    };
  } else {
    return {
      curriculum: 'Official KICD Syllabus Reference',
      strand: 'Core Subject Competency Area',
      subStrand: 'Fundamental Learning Outcomes',
      outcomes: [
        'Synthesize core knowledge and concepts from learning materials',
        'Apply critical thinking to solve exam-style problems',
        'Establish connections between learning units and practical applications'
      ]
    };
  }
};

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
    learningCredits, grantLearningCredits,
    verifySubscription, login,
    // Phase 2/3: Adaptive Tutoring & Evolutionary Educator
    masteryGraph, spacedRepetitionItems, dueForReview, weakTopics, processQuizCompletion, addSpacedRepetitionItem,
    getPersonalizedDailyChallenge, activeStrategies, educationLevel, updateTopicMastery,
    userId
  } = useApp();
  const t = translations[language];
  const location = useLocation();

  const trackFunnelEvent = React.useCallback((eventName: string, params: Record<string, unknown> = {}) => {
    try {
      if (import.meta.env.VITE_GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
        ReactGA.event(eventName, params);
      }
    } catch (_) {
      // Non-blocking analytics
    }
  }, []);

  // Read target tab from navigation state if coming from another route (like /exam-rooms)
  const initialTab = (location.state as any)?.targetTab as SidebarTab || 'HOME';
  const initialTargetIntent = (location.state as any)?.targetIntent as
    | 'ask_akili'
    | 'official_library'
    | 'exam_prep_papers'
    | 'listen_and_learn'
    | undefined;
  const initialMode = initialTab === 'SMART_TUTOR' || initialTab === 'HOMEWORK' ? 'SCAN_EXPLAIN' :
    initialTab === 'RESOURCES' ? 'MARKETPLACE' :
      initialTab === 'PROGRESS' ? 'HISTORY' :
        initialTab === 'SUBJECTS' ? 'REVISION' :
          initialTab === 'QUEST_MAP' ? 'QUEST_MAP' :
            initialTab === 'COMMUNITY' ? 'COMMUNITY' :
              initialTab === 'TALKBACK' ? 'TALKBACK' : 'MENU';

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
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF4500']
          });
        });
      }
    }
    prevXPRef.current = totalXP;
  }, [totalXP]);

  const [showStreakModal, setShowStreakModal] = useState(false);
  const [joinedClassNotice, setJoinedClassNotice] = useState<string | null>(null);
  const [studentClasses, setStudentClasses] = useState<StudentClassroomSummary[]>([]);
  const [isLoadingStudentClasses, setIsLoadingStudentClasses] = useState(false);
  const prevStreakRef = useRef(streak);

  useEffect(() => {
    const notice = localStorage.getItem('soma_joined_class_notice');
    if (!notice) return;
    setJoinedClassNotice(notice);
    localStorage.removeItem('soma_joined_class_notice');
  }, []);

  useEffect(() => {
    if (!studentProfile?.id) {
      setStudentClasses([]);
      return;
    }

    let mounted = true;
    setIsLoadingStudentClasses(true);
    classroomService.getClassesForStudent(studentProfile.id)
      .then((classes) => {
        if (mounted) setStudentClasses(classes);
      })
      .catch((error) => {
        console.warn('Could not load learner classes:', error);
        if (mounted) setStudentClasses([]);
      })
      .finally(() => {
        if (mounted) setIsLoadingStudentClasses(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentProfile?.id, joinedClassNotice]);

  useEffect(() => {
    // Only show modal if streak increases DURING the session, and they already had a streak (or it's their first, but prev > 0 prevents firing on initial load if we somehow miscalculate)
    // Actually, prevStreakRef.current is initialized to the streak ON MOUNT. 
    // So if it goes up, they just earned it now.
    if (streak > prevStreakRef.current) {
      setShowStreakModal(true);
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#ff4500', '#ffa500', '#ffd700']
        });
      });
    }
    prevStreakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    // We want learners to see the dashboard even if not registered (they get limited access).
    // Allow users to explore directly as a 'Guest' without kicking them.
    const savedStudent = localStorage.getItem('soma_active_student');
    if (!isRegistered && role === UserRole.NONE && !savedStudent) {
      // Intentionally do nothing and let them explore.
          {/* TOP BAR */}
    }

    // Payment Success for Download Pass
    const buyingPass = localStorage.getItem('soma_buying_pass');
    const params = new URLSearchParams(location.search);
    if (buyingPass === 'true' && params.get('payment_status') === 'COMPLETED') {
      grantExtraDownloads(5);
      localStorage.removeItem('soma_buying_pass');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      alert("Success! 5 extra downloads unlocked.");
    }
  }, [isRegistered, role, navigate, location]);

  const [mode, setMode] = useState<'MENU' | 'SCAN' | 'RESULT' | 'QUIZ' | 'RECAP_RESULT' | 'PROFILE' | 'PRICING' | 'PAYMENT' | 'MARKETPLACE' | 'LIBRARY' | 'HISTORY' | 'SCAN_EXPLAIN' | 'STUDY' | 'REQUESTS' | 'COMMUNITY' | 'REVISION' | 'REVISION_SESSION' | 'ANALYTICS' | 'TALKBACK' | 'REFERRAL' | 'QUEST_MAP' | 'FLASHCARDS'>(initialMode as any);

  // --- LEARNER MEMORY (Cloud Sync + Personalized Greeting) ---
  const [showMasteryDashboard, setShowMasteryDashboard] = useState(false);
  const [cloudMemoryRow, setCloudMemoryRow] = useState<any>(null);
  const [questSubTabState, setQuestSubTabState] = useState<'MAP' | 'PATH'>('MAP');

  // Load mastery from cloud on mount (registered users only)
  useEffect(() => {
    const learnerId = studentCode || studentProfile?.id;
    if (!learnerId) return; // Guest — localStorage only
    loadMemoryService().then(({ loadMasteryFromCloud }) => {
      loadMasteryFromCloud(learnerId).then(({ cloudRow }) => {
        if (cloudRow) setCloudMemoryRow(cloudRow);
      }).catch(() => {}); // Silently fail if offline
    });
  }, [studentCode, studentProfile?.id]);

  // Fire-and-forget cloud sync after quiz completion (wrapped for use inside handlers)
  const triggerMemorySync = React.useCallback(() => {
    const learnerId = studentCode || studentProfile?.id;
    if (!learnerId) return;
    const lastActivity = history[0];
    loadMemoryService().then(({ syncMasteryToCloud }) => {
      syncMasteryToCloud(
        learnerId,
        lastActivity?.topic,
        undefined,
        streak,
        totalXP,
        history.length
      ).catch(() => {});
    });
  }, [studentCode, studentProfile?.id, history, streak, totalXP]);

  const [studyTab, setStudyTab] = useState<'LESSON' | 'RECAP' | 'QNA' | 'QUIZ' | 'REFERENCES'>('LESSON');
  const [studyViewMode, setStudyViewMode] = useState<'guide' | 'original'>('guide');
  const [originalViewType, setOriginalViewType] = useState<'text' | 'pdf'>('text');
  const [extractedOriginalPages, setExtractedOriginalPages] = useState<string[]>([]);
  const [isExtractingOriginal, setIsExtractingOriginal] = useState<boolean>(false);
  const [originalPageIndex, setOriginalPageIndex] = useState<number>(0);
  const [fontScale, setFontScale] = useState<number>(1.0);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');
  const [readerSearchTerm, setReaderSearchTerm] = useState<string>('');
  const [readerPage, setReaderPage] = useState<number>(0);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [citationFormat, setCitationFormat] = useState<'SOMA' | 'APA' | 'MLA' | 'HARVARD'>('SOMA');
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<{ term: string; definition: string; translation: string; pronunciation: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedRecaps, setExpandedRecaps] = useState<number[]>([]);
  const [tutorInitialActiveMode, setTutorInitialActiveMode] = useState<'TALKBACK' | 'LANGUAGE_TUTOR'>('TALKBACK');
  const [tutorInitialTutorMode, setTutorInitialTutorMode] = useState<'conversation' | 'pronunciation' | 'sentences' | 'story'>('conversation');
  const [completedRecallChecks, setCompletedRecallChecks] = useState<number[]>([]);
  const [recallRewarded, setRecallRewarded] = useState(false);
  const [showExitRecallPrompt, setShowExitRecallPrompt] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);
  const [studyMissionChecks, setStudyMissionChecks] = useState<number[]>([]);
  const [studyMissionRewarded, setStudyMissionRewarded] = useState(false);
  const [activeRevisionSession, setActiveRevisionSession] = useState<{ data: any, mode: 'LEARN' | 'EXAM' } | null>(null);
  const [recapData, setRecapData] = useState<any>(null); // Store LessonRecap

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string, message: string } | null>(null);
  const [micPermissionNotice, setMicPermissionNotice] = useState(false);
  const [loadingText, setLoadingText] = useState("Akili is on it...");
  const [audioData, setAudioData] = useState<{ base64: string, mimeType: string } | null>(null);

  // Podcast State
  const [podcastScript, setPodcastScript] = useState<PodcastScript | null>(null);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1);
  const [podcastTotalSegments, setPodcastTotalSegments] = useState(0);
  const [podcastLoading, setPodcastLoading] = useState(false);

  // Faded Solution State from Hero
  const [fadedSolutionData, setFadedSolutionData] = useState<{ query: string, answer: string | null, isGenerating: boolean, show: boolean }>({ query: '', answer: null, isGenerating: false, show: false });

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
  const [lastQuizReview, setLastQuizReview] = useState<QuizReviewSummary | null>(null);
  const [learningProofStatus, setLearningProofStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [answerRevealUnlocked, setAnswerRevealUnlocked] = useState(false);
  const [learnerTryText, setLearnerTryText] = useState('');
  const [learningBreakRewarded, setLearningBreakRewarded] = useState(false);
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
  const [groundedAnswerMode, setGroundedAnswerMode] = useState(() => localStorage.getItem('soma_grounded_answer_mode') !== 'off');

  useEffect(() => {
    localStorage.setItem('soma_grounded_answer_mode', groundedAnswerMode ? 'on' : 'off');
  }, [groundedAnswerMode]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRateLimitError = (error: any) => {
    setLoading(false);
    setMode('MENU');
    if (isRegistered) {
      const message = error?.message || '';
      let feature = 'ai_generation';
      if (message.includes('grounded') || message.includes('library')) {
        feature = 'grounded_library_help';
      } else if (message.includes('voice') || message.includes('audio') || message.includes('listen')) {
        feature = 'listen_and_learn_voice';
      }
      try {
        window.dispatchEvent(new CustomEvent('soma-show-upgrade-modal', {
          detail: {
            feature,
            plan: profile?.subscriptionTier || 'FREE',
            limit: getPlanLimit(feature, profile?.subscriptionTier || 'FREE')
          }
        }));
      } catch (_) {}
      triggerToast(message || "Daily limit reached. Upgrade to get more allowance!");
    } else {
      setShowLogin(true);
    }
  };

  const handleGlossaryTrigger = (termKey: string) => {
    const entry = EDUCATIONAL_GLOSSARY[termKey.toLowerCase()];
    if (entry) {
      setActiveGlossaryTerm({
        term: termKey.toUpperCase(),
        definition: entry.definition,
        translation: entry.translation,
        pronunciation: entry.pronunciation
      });
    }
  };

  const handleParagraphAsk = (text: string) => {
    if (!text) return;
    const cleanText = text.length > 200 ? text.substring(0, 200) + '...' : text;
    const query = `Regarding: "${cleanText}" inside the lesson notes of "${currentDocument?.title}". Can you please explain this concept in simpler terms, and provide a practical example that makes it easy to understand?`;
    setStudyTab('QNA');
    askStudyBuddy(query);
  };

  const handleParagraphCopyCitation = (text: string) => {
    if (!currentDocument || !text) return;
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const formattedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    let citation = '';

    if (citationFormat === 'APA') {
      citation = `Soma Smart. (${new Date().getFullYear()}). ${currentDocument.title} [Study Material]. Retrieved from Soma AI Library. "${cleanText}"`;
    } else if (citationFormat === 'MLA') {
      citation = `Soma Smart. "${currentDocument.title}." Soma AI Library, ${new Date().getFullYear()}, "${cleanText}"`;
    } else if (citationFormat === 'HARVARD') {
      citation = `Soma Smart, ${new Date().getFullYear()}. ${currentDocument.title}, Soma AI Library. Available at: Soma Smart. [Accessed ${formattedDate}]. Quote: "${cleanText}"`;
    } else {
      citation = `"${cleanText}" — Soma AI Library: Grade ${currentDocument.grade || 'N/A'} ${currentDocument.subject || 'General'} (${currentDocument.title}). Reference ID: ${currentDocument.realId || currentDocument.id}`;
    }

    navigator.clipboard.writeText(citation).then(() => {
      triggerToast(`Citation copied to clipboard (${citationFormat} format)!`);
    }).catch(() => {
      triggerToast("Failed to copy citation.");
    });
  };

  const handleReaderSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText('');
      setSelectionCoords(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setSelectionCoords({
        x: rect.left + rect.width / 2,
        y: rect.top - 50 + window.scrollY
      });
    } else {
      setSelectedText('');
      setSelectionCoords(null);
    }
  };

  const renderFormattedText = (text: string, search: string, onGlossaryClick: (term: string) => void) => {
    if (!text) return null;
    
    interface Match {
      start: number;
      end: number;
      type: 'search' | 'glossary';
      value: string;
      key?: string;
    }
    const matches: Match[] = [];

    // 1. Search term match
    if (search && search.trim().length > 1) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'gi');
      let m;
      while ((m = searchRegex.exec(text)) !== null) {
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          type: 'search',
          value: m[0]
        });
      }
    }

    // 2. Glossary matches
    Object.keys(EDUCATIONAL_GLOSSARY).forEach(term => {
      const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const termRegex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
      let m;
      while ((m = termRegex.exec(text)) !== null) {
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          type: 'glossary',
          value: m[0],
          key: term
        });
      }
    });

    // Sort matches by start index, then by length descending
    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Filter overlapping matches
    const activeMatches: Match[] = [];
    let lastIndex = 0;
    for (const match of matches) {
      if (match.start >= lastIndex) {
        activeMatches.push(match);
        lastIndex = match.end;
      }
    }

    // Build React elements
    const elements: React.ReactNode[] = [];
    let currentPos = 0;
    activeMatches.forEach((match, idx) => {
      // Add text before match
      if (match.start > currentPos) {
        elements.push(text.substring(currentPos, match.start));
      }
      // Add match element
      if (match.type === 'search') {
        elements.push(
          <mark key={`search-${idx}`} className="bg-yellow-200 dark:bg-yellow-800 text-slate-900 rounded px-0.5 font-bold shadow-sm">
            {match.value}
          </mark>
        );
      } else {
        elements.push(
          <button
            key={`glossary-${idx}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGlossaryClick(match.key!);
            }}
            className="underline decoration-dotted decoration-indigo-400 hover:decoration-solid hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-all inline-flex items-center gap-0.5 cursor-help"
          >
            {match.value}
            <span className="text-[10px] text-indigo-400">📖</span>
          </button>
        );
      }
      currentPos = match.end;
    });

    // Add remaining text
    if (currentPos < text.length) {
      elements.push(text.substring(currentPos));
    }

    return elements.length > 0 ? elements : text;
  };

  const runWithRecallExitGuard = React.useCallback((action: () => void) => {
    if (mode === 'RESULT' && explanation && !stickyQuizTaken) {
      setPendingExitAction(() => action);

      if (stickyQuizData) {
        setQuizData(stickyQuizData);
        setMode('QUIZ');
      } else {
        setLoading(true);
        setLoadingText("Akili is preparing a short quiz to verify your understanding...");
        generateQuickQuiz(explanation.explanation, explanation.topic, language)
          .then(quiz => {
            setQuizData(quiz);
            setMode('QUIZ');
          })
          .catch(() => {
            action();
          })
          .finally(() => setLoading(false));
      }
      return;
    }
    action();
  }, [mode, explanation, stickyQuizTaken, stickyQuizData, language]);

  useEffect(() => {
    setCompletedRecallChecks([]);
    setRecallRewarded(false);
    setLearningProofStatus('idle');
    setAnswerRevealUnlocked(false);
    setLearnerTryText('');
    setLearningBreakRewarded(false);
    setStickyQuizTaken(false);
    setStickyQuizData(null);
  }, [explanation?.topic]);

  const shareLearningProof = React.useCallback(async () => {
    if (!explanation) return;

    const quizLine = lastQuizReview
      ? `Last quiz score: ${lastQuizReview.score}% (${lastQuizReview.correctCount}/${lastQuizReview.totalQuestions} correct).`
      : 'Next step: quiz and repair weak spots.';
    const proofText = [
      `I completed an active recall break on ${explanation.topic} with Soma Smart.`,
      'I answered 3 memory checkpoints before moving on.',
      quizLine,
      'Learning path: Learn -> Recall -> Quiz -> Repair -> Retry.',
      'https://somaai.co.ke'
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Soma Smart learning proof',
          text: proofText
        });
        setLearningProofStatus('shared');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(proofText);
        setLearningProofStatus('copied');
      }
      trackFunnelEvent('learner_learning_proof_shared', {
        topic: explanation.topic,
        method: navigator.share ? 'native_share' : 'clipboard'
      });
    } catch (_) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(proofText);
        setLearningProofStatus('copied');
      }
    }
  }, [explanation, lastQuizReview, trackFunnelEvent]);

  useEffect(() => {
    if (!explanation || recallRewarded || completedRecallChecks.length < 3) return;

    setRecallRewarded(true);
    setAnswerRevealUnlocked(true);
    updateTopicMastery(explanation.topic, 55);
    saveActivity({
      id: `recall-${Date.now()}`,
      type: 'STUDY',
      topic: explanation.topic,
      date: new Date().toLocaleDateString(),
      details: JSON.stringify({
        mode: 'active_recall_break',
        completedChecks: completedRecallChecks.length,
        xpEarned: 30
      })
    });
    trackFunnelEvent('active_recall_break_completed', {
      topic: explanation.topic,
      completedChecks: completedRecallChecks.length
    });
    triggerMemorySync();
  }, [completedRecallChecks.length, explanation, recallRewarded, saveActivity, trackFunnelEvent, triggerMemorySync, updateTopicMastery]);

  useEffect(() => {
    if (!shouldPromptRecallOnExit) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'Finish your active recall break before leaving this explanation.';
      return event.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldPromptRecallOnExit]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }
      const text = selection.toString().trim();
      if (text.length > 3) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectionCoords({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    };

    const handleClearSelection = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.pointer-events-auto') && !window.getSelection()?.toString().trim()) {
        setSelectedText('');
        setSelectionCoords(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('click', handleClearSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('click', handleClearSelection);
    };
  }, []);

  const [showTutoringModal, setShowTutoringModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false); // New State
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hasRecentPaymentUnlock, setHasRecentPaymentUnlock] = useState(false);
  const resumeBypassRef = useRef(false);
  const subscriptionRepairAttemptedRef = useRef(false);
  const paywallRecoveryAttemptedRef = useRef(false);
  const creditRecoveryAttemptedRef = useRef<string | null>(null);

  // --- Spaced Repetition (Flashcards) States & Confetti Hook ---
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'due' | 'all'>('due');

  useEffect(() => {
    if (reviewComplete) {
      import('canvas-confetti').then(confetti => {
        confetti.default({
          particleCount: 180,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#6366f1', '#a855f7', '#10b981', '#f59e0b']
        });
      });
    }
  }, [reviewComplete]);

  const restoreMissingCreditWallet = React.useCallback(async () => {
    if (!isRegistered || learningCredits > 0) return false;
    const profileId = studentProfile?.id || userId;
    if (!profileId) return false;

    try {
      const { data: txs, error } = await supabase
        .from('transactions')
        .select('reference_code, amount, status, description, created_at')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !txs?.length) return false;

      for (const tx of txs as Array<any>) {
        const reference = String(tx.reference_code || '');
        const recoveryKey = `soma_credit_recovered_${reference || tx.created_at}`;
        if (localStorage.getItem(recoveryKey) === '1') continue;

        let status = String(tx.status || '').toUpperCase();
        let remoteStatus: any = null;
        if (status !== 'SUCCESS' && reference) {
          try {
            remoteStatus = await pesapalService.checkTransactionStatus({ merchantReference: reference });
            const statusText = String(
              remoteStatus?.payment_status_description ||
              remoteStatus?.status_description ||
              remoteStatus?.status ||
              ''
            ).toLowerCase();
            if (statusText.includes('completed') || statusText.includes('success')) {
              status = 'SUCCESS';
            }
          } catch {
            // Keep the local transaction status as the fallback signal.
          }
        }

        if (status !== 'SUCCESS') continue;

        const isCreditReference = reference.startsWith('CREDIT_');
        const isCreditDescription = /credit/i.test(String(tx.description || ''));
        const amount = Number(tx.amount || 0);
        const isCreditAmount = amount === 20 || amount === 50 || amount === 100;
        if (!isCreditReference && !isCreditDescription && !isCreditAmount) continue;

        const creditsFromReference = isCreditReference ? Number(reference.split('_')[1] || 0) : 0;
        const creditsFromDescription = Number(String(tx.description || '').match(/(\d+)\s+learning credits/i)?.[1] || 0);
        const creditsFromStatus = Number(remoteStatus?.learning_credits || remoteStatus?.credits_granted || 0);
        const credits =
          creditsFromStatus ||
          creditsFromReference ||
          creditsFromDescription ||
          (amount === 20 ? 30 : amount === 50 ? 100 : amount === 100 ? 250 : 0);

        if (credits <= 0) continue;

        grantLearningCredits(credits);
        localStorage.setItem(recoveryKey, '1');
        setShowLimitModal(false);
        setShowExpiryModal(false);
        setHasRecentPaymentUnlock(true);
        return true;
      }
    } catch (err) {
      console.warn('Credit transaction recovery failed:', err);
    }

    return false;
  }, [isRegistered, learningCredits, studentProfile?.id, userId, grantLearningCredits]);

  useEffect(() => {
    restoreMissingCreditWallet();
  }, [restoreMissingCreditWallet]);

  useEffect(() => {
    if (!isRegistered || isPro || subscriptionRepairAttemptedRef.current) return;
    subscriptionRepairAttemptedRef.current = true;
    verifySubscription().catch((err) => {
      console.warn('Subscription self-heal check failed:', err);
    });
  }, [isRegistered, isPro, verifySubscription]);

  useEffect(() => {
    if (!isRegistered || learningCredits > 0) return;
    const reference = localStorage.getItem('soma_last_payment_reference') || '';
    if (!reference.startsWith('CREDIT_') || creditRecoveryAttemptedRef.current === reference) return;
    if (localStorage.getItem(`soma_credit_recovered_${reference}`) === '1') return;

    creditRecoveryAttemptedRef.current = reference;
    const recoverCreditPayment = async () => {
      try {
        const status = await pesapalService.checkTransactionStatus({ merchantReference: reference });
        const statusText = String(
          status?.payment_status_description ||
          status?.status_description ||
          status?.status ||
          ''
        ).toLowerCase();

        if (!statusText.includes('completed') && !statusText.includes('success')) return;

        const creditsFromReference = Number(reference.split('_')[1] || 0);
        const lastAmount = Number(localStorage.getItem('soma_last_payment_amount') || 0);
        const creditsFromStatus = Number(status?.learning_credits || status?.credits_granted || 0);
        const credits =
          creditsFromStatus ||
          creditsFromReference ||
          (lastAmount === 20 ? 30 : lastAmount === 50 ? 100 : lastAmount === 100 ? 250 : 0);

        if (credits <= 0) return;
        grantLearningCredits(credits);
        localStorage.setItem(`soma_credit_recovered_${reference}`, '1');
        setShowLimitModal(false);
        setShowExpiryModal(false);
        setHasRecentPaymentUnlock(true);
      } catch (err) {
        console.warn('Credit payment recovery failed:', err);
      }
    };

    recoverCreditPayment();
  }, [isRegistered, learningCredits, grantLearningCredits]);

  useEffect(() => {
    if (!showLimitModal || !isRegistered || isPro || paywallRecoveryAttemptedRef.current) return;
    paywallRecoveryAttemptedRef.current = true;
    verifySubscription()
      .catch((err) => {
        console.warn('Paywall recovery check failed:', err);
      })
      .finally(() => {
        window.setTimeout(() => {
          paywallRecoveryAttemptedRef.current = false;
        }, 1500);
      });
  }, [showLimitModal, isRegistered, isPro, verifySubscription]);

  useEffect(() => {
    const hasClientActiveSubscription =
      subscriptionPlan !== 'FREE' &&
      !!subscriptionExpiry &&
      !isNaN(new Date(subscriptionExpiry).getTime()) &&
      new Date(subscriptionExpiry) > new Date();

    if (showLimitModal && (isPro || hasRecentPaymentUnlock || hasClientActiveSubscription || learningCredits > 0)) {
      setShowLimitModal(false);
      setHasRecentPaymentUnlock(true);
    }
  }, [showLimitModal, isPro, hasRecentPaymentUnlock, subscriptionPlan, subscriptionExpiry, learningCredits]);

  // Subscription Expiry Check
  useEffect(() => {
    if (isPro && subscriptionExpiry) {
      const expiryDate = new Date(subscriptionExpiry);
      const now = new Date();
      // Check if expired
      if (expiryDate < now) {
        if (learningCredits > 0) {
          setShowExpiryModal(false);
          setHasRecentPaymentUnlock(true);
          return;
        }
        setShowExpiryModal(true);
      } else {
        setShowExpiryModal(false);
      }
    }
  }, [isPro, subscriptionExpiry, learningCredits]);

  const [tutoringTopic, setTutoringTopic] = useState("");
  const [materialCategory, setMaterialCategory] = useState<'ALL' | 'NOTES' | 'PAST_PAPER' | 'SYLLABUS'>('ALL');
  const [libraryView, setLibraryView] = useState<'UNLOCKED' | 'PURCHASED' | 'PRO_VAULT'>('UNLOCKED');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const learnerCtaVariant = React.useMemo(() => getLearnerCtaVariant(), []);
  const creditMeterPct = Math.min(100, Math.round((learningCredits / 30) * 100));

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

  const getPaywallActionContext = (action: PendingPaywallAction | null): { completed: string; next: string } => {
    if (!action) {
      return {
        completed: 'used your free learning credits',
        next: 'continue with unlimited learning actions'
      };
    }

    switch (action.type) {
      case 'PROCESS_FILE':
        return { completed: 'used image scan support', next: 'analyze this image step-by-step' };
      case 'AUDIO_EXPLANATION':
        return { completed: 'used voice explanation support', next: 'process this audio explanation' };
      case 'TOPIC_CLICK':
        return { completed: `started exploring ${action.topic || 'a topic'}`, next: 'open full topic guidance and practice' };
      case 'STUDY_SESSION':
        return { completed: `opened ${action.materialName || 'a study session'}`, next: 'continue the study session with Akili' };
      case 'STUDY_CHAT':
        return { completed: 'started a study chat', next: 'ask more follow-up questions in context' };
      case 'STUDY_QUIZ':
        return { completed: 'completed your free quiz generation', next: 'generate more quizzes and mark instantly' };
      case 'PODCAST':
        return { completed: 'used Talk & Play audio generation', next: 'create more audio conversations' };
      case 'REVISION_ENTRY':
        return { completed: 'opened Exam Prep', next: 'continue revision and exam practice' };
      case 'TALKBACK_ENTRY':
      case 'TALKBACK_MESSAGE':
        return { completed: 'started Talk & Play practice', next: 'continue the conversation-based learning session' };
      default:
        return { completed: 'used your free learning credits', next: 'continue learning without interruption' };
    }
  };
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL'); // New Filter
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'SOMO' | 'TEACHERS'>('ALL'); // New Filter
  const [pendingMaterialId, setPendingMaterialId] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [studyChat, setStudyChat] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    setStudyMissionChecks([]);
    setStudyMissionRewarded(false);
  }, [currentDocument?.id]);

  useEffect(() => {
    if (!currentDocument || studyMissionRewarded || studyMissionChecks.length < 3) return;

    setStudyMissionRewarded(true);
    saveActivity({
      id: `study-mission-${Date.now()}`,
      type: 'STUDY',
      topic: currentDocument.title,
      date: new Date().toLocaleDateString(),
      details: JSON.stringify({
        mode: 'library_study_mission',
        materialId: currentDocument.id,
        realId: currentDocument.realId,
        subject: currentDocument.subject,
        grade: currentDocument.grade,
        completedChecks: studyMissionChecks.length,
        xpEarned: 40
      })
    });
    trackFunnelEvent('library_study_mission_completed', {
      material_id: currentDocument.id,
      subject: currentDocument.subject,
      grade: currentDocument.grade
    });
    triggerMemorySync();
  }, [currentDocument, saveActivity, studyMissionChecks.length, studyMissionRewarded, trackFunnelEvent, triggerMemorySync]);

  const toggleStudyMissionCheck = React.useCallback((index: number) => {
    setStudyMissionChecks(prev => prev.includes(index) ? prev.filter(item => item !== index) : [...prev, index]);
  }, []);

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
    trackFunnelEvent('pricing_opened', {
      source: 'learner_dashboard',
      role: role || 'GUEST',
      mode
    });
    setMode('PRICING');
  };

  useEffect(() => {
    if (mode === 'MARKETPLACE' || mode === 'RESOURCES' || mode === 'LIBRARY') {
      fetchResources();
      setMaterialCategory('ALL');
      setSubjectFilter('ALL');
    }
  }, [mode, educationLevel]);

  const normalizeMaterialCategory = (rawCategory: any): string => {
    const normalized = String(rawCategory || '')
      .toUpperCase()
      .replace(/[\s-]+/g, '_')
      .trim();

    if (normalized.includes('SYLLABUS')) return 'SYLLABUS';
    if (normalized.includes('NOTE')) return 'NOTES';
    if (normalized === 'REVISION_PAPER' || normalized === 'REVISIONPAPER' || normalized === 'PASTPAPER' || normalized === 'PAST_PAPERS' || normalized === 'PAST_PAPER') return 'PAST_PAPER';
    if (normalized === 'MARKING_SCHEME' || normalized === 'RECORDED_LESSON') return normalized;
    return normalized || 'NOTES';
  };

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
      category: normalizeMaterialCategory(r.type),
      fileUrl: r.file_url,
      rating: r.rating ?? 0,
      downloadCount: r.download_count ?? 0,
      isInternal: true
    }));

    const teacher = (marketplaceMaterials || []).map(m => ({
      ...m,
      category: normalizeMaterialCategory(m.category),
      isVerified: false,
      isInternal: false
    }));

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
    if (g === 'ALL') return educationLevel;
    return EducationLevel.SENIOR;
  };

  const getAcademicCluster = (grade: string): 'LOWER_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY' | 'CAMPUS' | 'UNKNOWN' => {
    const g = String(grade || "").toLowerCase().trim();
    if (!g) return 'UNKNOWN';

    if (g.includes('university') || g.includes('college') || g.includes('campus') || g.includes('year') || g.includes('degree') || g.includes('diploma')) {
      return 'CAMPUS';
    }

    if (g.includes('pp1') || g.includes('pp2') || g.includes('pre-unit') || g.includes('nursery')) {
      return 'LOWER_PRIMARY';
    }

    if (g.match(/\bgrade\s*[1-3]\b/) || g === '1' || g === '2' || g === '3') {
      return 'LOWER_PRIMARY';
    }

    if (g.match(/\bgrade\s*[4-6]\b/) || g === '4' || g === '5' || g === '6') {
      return 'UPPER_PRIMARY';
    }

    if (g.includes('jss') || g.match(/\bgrade\s*[7-9]\b/) || g === '7' || g === '8' || g === '9') {
      return 'JUNIOR_SECONDARY';
    }

    if (g.includes('form') || g.match(/\bgrade\s*(1[0-2])\b/) || g === '10' || g === '11' || g === '12' || g.includes('kcse')) {
      return 'SENIOR_SECONDARY';
    }

    const numMatch = g.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      if (num >= 1 && num <= 3) return 'LOWER_PRIMARY';
      if (num >= 4 && num <= 6) return 'UPPER_PRIMARY';
      if (num >= 7 && num <= 9) return 'JUNIOR_SECONDARY';
      if (num >= 10 && num <= 12) return 'SENIOR_SECONDARY';
    }

    return 'UNKNOWN';
  };

  const normalizeGrade = (g: any) => {
    const str = String(g || "").toLowerCase();
    return str.replace(/\s*grade\s*/g, '').replace(/\s*\(jss\)\s*/g, '').trim() || "";
  };

  const isGradeInStudentRange = (materialGrade: string, studentGrade: string): boolean => {
    if (!studentGrade) return true;
    const materialCluster = getAcademicCluster(materialGrade);
    const studentCluster = getAcademicCluster(studentGrade);
    
    if (materialCluster === 'UNKNOWN' || materialCluster === 'all') return true;
    if (studentCluster === 'UNKNOWN') return true;

    return materialCluster === studentCluster;
  };

  const gradeFilteredMaterials = React.useMemo(() => {
    // First filter by education level to prevent cross-level content
    const levelFiltered = unifiedMaterials.filter(m => getGradeLevel(m.grade || '') === educationLevel);

    const result = levelFiltered.filter(m => {
      if (!studentProfile?.grade) return true;
      return isGradeInStudentRange(m.grade || '', studentProfile.grade);
    });

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
      const normalizedCategory = normalizeMaterialCategory(m.category);

      // 0. Education level filter: prevent cross-level content leakage
      const materialLevel = getGradeLevel(m.grade || '');
      if (materialLevel !== educationLevel) return false;

      // 0b. Profile-level Grade Range Filter for ALL materials
      if (studentProfile?.grade) {
        if (!isGradeInStudentRange(m.grade || '', studentProfile.grade)) {
          return false;
        }
      }

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
  }, [unifiedMaterials, materialCategory, subjectFilter, selectedGrade, selectedSource, educationLevel, studentProfile?.grade]);

  const isStarterCategory = (category: string) =>
    ['SYLLABUS', 'NOTES', 'PAST_PAPER'].includes(normalizeMaterialCategory(category));

  const getMaterialAccessStatus = React.useCallback((material: any) => {
    const normalizedCategory = normalizeMaterialCategory(material.category);
    const isOwned = purchasedMaterialIds.includes(material.id);
    const isVerified = Boolean(material.isVerified);
    const starter = isStarterCategory(normalizedCategory);

    if (isOwned) return 'OWNED' as const;
    if (isVerified && starter) return 'FREE' as const;
    if (isVerified && isPro) return 'PRO_INCLUDED' as const;
    if (isVerified && !isPro) return 'PRO_LOCKED' as const;
    return 'PURCHASE' as const;
  }, [purchasedMaterialIds, isPro]);

  // Check for subscription intent & Auto-open material intent
  React.useEffect(() => {
    const state = location.state as {
      pendingHeroQuestion?: string;
      autoStartPractice?: boolean;
      selectedPlan?: SubscriptionPlan;
      openSubscription?: boolean;
      initiatePaymentFor?: SubscriptionPlan;
      materialId?: string;
    };

    // Faded Solution / Full Solution Modal Check
    if (state?.pendingHeroQuestion) {
      const shouldAutoStartPractice = Boolean(state.autoStartPractice);
      setFadedSolutionData({ query: state.pendingHeroQuestion, answer: null, isGenerating: true, show: !shouldAutoStartPractice });
      
      const fetchHeroAnswer = async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: 'user', parts: [{ text: `Provide a clear, simple, step-by-step solution for the following question. Do not use overly academic language or excess data. Get straight to the point. Use Markdown formatting and bullet points. Question: ${state.pendingHeroQuestion}` }] }]
                })
            });
            
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                setFadedSolutionData({ query: state.pendingHeroQuestion, answer: text, isGenerating: false, show: !shouldAutoStartPractice });

                if (shouldAutoStartPractice) {
                  try {
                    const heroQuiz = await generateQuickQuiz(text, state.pendingHeroQuestion, language);
                    setQuizData(heroQuiz);
                    trackFunnelEvent('learner_quiz_started', {
                      source: 'landing_auto_practice',
                      topic: state.pendingHeroQuestion
                    });
                    setMode('QUIZ');
                  } catch {
                    setError({
                      title: "Quiz Unavailable",
                      message: "We generated your answer, but couldn't start the quiz right now. Please try again in a moment."
                    });
                  }
                }
            }
          } catch(err) {
              setFadedSolutionData({ query: state.pendingHeroQuestion, answer: "**Connection Interrupted**\n\nThe AI was generating the detailed step-by-step logic, but a network error occurred. Please close this window and try again to view the full breakdown.", isGenerating: false, show: true });
          }
      };
      fetchHeroAnswer();
      
      // Clear react router state to prevent re-triggering when dependencies like unifiedMaterials update
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // Handle auto-opening material after successful payment
    if (state?.materialId) {
      const material = unifiedMaterials.find(m => m.id === state.materialId || (m as any).realId === state.materialId);
      const normalizedCategory = normalizeMaterialCategory(material?.category);
      if (material && ['PAST_PAPER', 'SYLLABUS', 'NOTES'].includes(normalizedCategory)) {
        startStudySession(material);
      } else if (material) {
        startStudySession(material);
        // Clear state to avoid re-triggering
      }
      navigate(location.pathname, { replace: true, state: {} });
      return;
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
    const normalizedCategory = normalizeMaterialCategory(material?.category);
    const isPastPaperMaterial = normalizedCategory === 'PAST_PAPER';

    if (isPastPaperMaterial) {
      if (!checkLimit({ type: 'REVISION_ENTRY' })) return;

      trackFunnelEvent('library_action_explain', {
        source: mode === 'LIBRARY' ? 'library' : 'marketplace',
        material_id: material.id,
        material_category: material.category,
        subject: material.subject,
        grade: material.grade,
        action: 'paper_exam'
      });

      setCurrentDocument(material);
      setActiveRevisionSession({ data: material, mode: 'EXAM' });
      setMode('REVISION_SESSION');
      return;
    }

    // Paywall Check: 3 free usages for non-pro users
    if (!checkLimit({ type: 'STUDY_SESSION', material, materialName: material.title })) return;
    trackFunnelEvent('library_action_explain', {
      source: mode === 'LIBRARY' ? 'library' : 'marketplace',
      material_id: material.id,
      material_category: material.category,
      subject: material.subject,
      grade: material.grade
    });

    setCurrentDocument(material);
    setMode('STUDY');
    setLoading(true);
    setLoadingText("Akili is building your study guide...");
    setIsSummarizing(true);
    setStudyChat([]);
    
    setStudyViewMode('guide');
    setOriginalViewType('text');
    setExtractedOriginalPages([]);
    setOriginalPageIndex(0);

    const docUrl = material.fileUrl || material.file_url;
    if (docUrl) {
      setIsExtractingOriginal(true);
      extractTextFromURL(docUrl)
        .then(fullText => {
          if (fullText) {
            const rawPages = fullText.split(/--- Page \d+ ---/);
            const parsedPages = rawPages
              .map(p => p.trim())
              .filter(p => p.length > 0);
            setExtractedOriginalPages(parsedPages);
          }
        })
        .catch(err => console.error("Error extracting original textbook pages:", err))
        .finally(() => setIsExtractingOriginal(false));
    }

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
          message: "You are offline. Please check your internet connection."
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
        if (!navigator.onLine) {
          setError({
            title: "Study Assistant Offline",
            message: "You are offline. Please check your internet connection to generate a study guide."
          });
        } else {
          setError({
            title: "Connection Error",
            message: "We couldn't connect to our servers. Please check your internet connection or try again shortly."
          });
        }
      } else {
        setError({ title: "Study Assistant Error", message: "I couldn't generate a study guide for this document right now." });
      }
    } finally {
      setLoading(false);
      setIsSummarizing(false);
    }
  };

  const handleDownloadAIRevisionNotes = async (material: any, bypassLimit = false) => {
    const normalizedCategory = normalizeMaterialCategory(material?.category);
    const isAdminStarterMaterial = Boolean(material?.isVerified) && (normalizedCategory === 'NOTES' || normalizedCategory === 'PAST_PAPER');
    const isTeacherMonetizedMaterial = !material?.isVerified;

    // Gate only teacher-created monetized materials.
    if (isTeacherMonetizedMaterial && !isPro) {
      handlePricingNavigation();
      setError({ title: "Subscription Required", message: "Upgrade to Pro to download teacher premium resources." });
      return;
    }

    // Apply paid daily limit only to monetized paths, not admin starter resources.
    if (!isAdminStarterMaterial) {
      const effectiveLimit = 3 + extraDownloads;
      if (downloadUsageCount >= effectiveLimit && !bypassLimit) {
        setPendingDownloadMaterial(material);
        setShowDownloadPayment(true);
        return;
      }
    }

    setPendingDownloadMaterial(material);
    setLoading(true);
    setLoadingText("Akili is writing your lesson notes...");

    try {
      // FIX: Detect grade from title as metadata might be unreliable (e.g. defaulting to Grade 1)
      const detectGrade = (title: string, fallback: string) => {
        const match = title.match(/Grade\s*(\d+)/i);
        return match ? `Grade ${match[1]}` : fallback;
      };
      const effectiveGrade = detectGrade(material.title, material.grade);

      const result = await generateRichLessonNotes(material.title, (material.realId || material.id).toString(), language, material.subject, effectiveGrade);
      const { jsPDF } = await import('jspdf');

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
      doc.text("Official Study Material - CBC/KCSE Aligned", pageWidth / 2, 32, { align: 'center' });

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
        .replace(/\*/g, '-');

      const lines = doc.splitTextToSize(cleanText, contentWidth);

      lines.forEach((line: string) => {
        checkPage(7);
        // Highlight logic
        if (line.includes('-')) {
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
        const pLines = doc.splitTextToSize(`- ${point}`, contentWidth - 5);
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
      doc.text("Exam Success Strategies", margin, yPos);

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

      const downloadFileName = `${material.title || 'lesson_notes'}_somo_smart.pdf`
        .replace(/[^a-z0-9_\- ]/gi, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
      doc.save(downloadFileName);
      trackFunnelEvent('library_downloaded', {
        material_id: material.id,
        material_category: material.category,
        subject: material.subject,
        grade: material.grade,
        source: mode === 'LIBRARY' ? 'library' : 'marketplace'
      });

      // Increment usage only for monetized materials (admin starter resources are open access).
      if (!isAdminStarterMaterial && !bypassLimit) {
        incrementDownloadUsage();
      }

    } catch (err: any) {
      console.error("PDF Generate error:", err);
      if (!isOnline || !navigator.onLine || err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
        if (!navigator.onLine) {
          setError({ title: "Offline Error", message: "You are offline. Please check your internet connection to download teacher notes." });
        } else {
          setError({ title: "Connection Error", message: "We couldn't connect to our servers. Please check your internet connection or try again shortly." });
        }
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
    if (!checkLimit({ type: 'STUDY_CHAT', query })) return;

    const userMsg = { role: 'user' as const, text: query || (pendingMedia?.type === 'AUDIO' ? "Voice Message" : "Image Attachment") };
    setStudyChat(prev => [...prev, userMsg]);
    setPromptText("");
    setPendingMedia(null);
    setLoading(true);
    setLoadingText("Akili is thinking...");

    try {
      let activePageText = "";
      if (studyViewMode === 'original' && extractedOriginalPages[originalPageIndex]) {
        activePageText = extractedOriginalPages[originalPageIndex];
      } else if (studyViewMode === 'guide' && explanation) {
        if (readerPage === 0) {
          activePageText = explanation.explanation;
        } else if (readerPage > 0 && readerPage <= (explanation.subtopics?.length || 0)) {
          const sub = explanation.subtopics[readerPage - 1];
          activePageText = `${sub.title}\n\n${sub.content}`;
        }
      }

      const finalQuery = activePageText
        ? `Here is the context from the page of the study material the student is currently reading:\n"""\n${activePageText}\n"""\n\nQuestion: ${query || (pendingMedia?.type === 'AUDIO' ? "Voice Message" : "Image/File Analysis")}`
        : (query || (pendingMedia?.type === 'AUDIO' ? "Voice Message" : "Image/File Analysis"));

      const result = await explainTopic(
        finalQuery,
        level,
        language,
        currentDocument.realId || currentDocument.id,
        currentDocument.subject,
        currentDocument.grade,
        pendingMedia ? { data: pendingMedia.data, mimeType: pendingMedia.mimeType } : undefined,
        { masteryGraph, recentHurdles: weakTopics },
        activeStrategies,
        'TUTOR',
        educationLevel
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
        if (!navigator.onLine) {
          setStudyChat(prev => [...prev, { role: 'model' as const, text: "I can't answer right now because you are offline. Please check your internet connection." }]);
        } else {
          setStudyChat(prev => [...prev, { role: 'model' as const, text: "We couldn't connect to our servers. Please check your internet connection or try again shortly." }]);
        }
      } else {
        setStudyChat(prev => [...prev, { role: 'model' as const, text: "I'm sorry, I hit a snag while looking through this document." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePracticeQuiz = async () => {
    if (!currentDocument || !explanation) return;
    if (!checkLimit({ type: 'STUDY_QUIZ' })) return;
    setLoading(true);
    setLoadingText("Akili is crafting your quiz...");
    try {
      const data = await generateQuiz(explanation.explanation, currentDocument.title, language);
      setQuizData(data);
      trackFunnelEvent('library_action_quiz', {
        material_id: currentDocument.id,
        material_category: currentDocument.category,
        subject: currentDocument.subject,
        grade: currentDocument.grade
      });
      trackFunnelEvent('learner_quiz_started', {
        source: 'study_session',
        topic: currentDocument.title
      });
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(initialTab);
  const [entryIntent, setEntryIntent] = useState(initialTargetIntent || null);

  type PendingPaywallAction = 
    | { type: 'PROCESS_FILE', file: File }
    | { type: 'AUDIO_EXPLANATION', blob: Blob, mimeType: string }
    | { type: 'TOPIC_CLICK', topic: string, multimedia?: { data: string, mimeType: string } }
    | { type: 'STUDY_SESSION', material: any, materialName: string }
    | { type: 'STUDY_CHAT', query: string }
    | { type: 'STUDY_QUIZ' }
    | { type: 'PODCAST' }
    | { type: 'REVISION_ENTRY' }
    | { type: 'TALKBACK_ENTRY' }
    | { type: 'TALKBACK_MESSAGE' };
  const [pendingPaywallAction, setPendingPaywallAction] = useState<PendingPaywallAction | null>(null);

  const handleSidebarTabChange = (tab: SidebarTab, preserveTutorState = false) => {
    setSidebarTab(tab);
    switch (tab) {
      case 'HOME':
        runWithRecallExitGuard(() => setMode('MENU'));
        break;
      case 'SMART_TUTOR':
        runWithRecallExitGuard(() => setMode('SCAN_EXPLAIN'));
        break;
      case 'QUEST_MAP':
        runWithRecallExitGuard(() => setMode('QUEST_MAP'));
        break;
      case 'RESOURCES':
        runWithRecallExitGuard(() => setMode('LIBRARY'));
        break;
      case 'PROGRESS':
        runWithRecallExitGuard(() => setMode('ANALYTICS'));
        break;
      case 'SUBJECTS':
        runWithRecallExitGuard(() => setMode('REVISION'));
        break;
      case 'EXAM_ROOMS':
        runWithRecallExitGuard(() => navigate('/exam-rooms'));
        break;
      case 'COMMUNITY':
        runWithRecallExitGuard(() => setMode('COMMUNITY'));
        break;
      case 'REFERRAL':
        runWithRecallExitGuard(() => setMode('REFERRAL'));
        break;
      case 'TALKBACK':
        if (!preserveTutorState) {
          setTutorInitialActiveMode('TALKBACK');
          setTutorInitialTutorMode('conversation');
        }
        runWithRecallExitGuard(() => setMode('TALKBACK'));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!entryIntent) return;

    trackFunnelEvent('learner_deep_link_consumed', {
      intent: entryIntent,
      target_tab: initialTab
    });

    if (entryIntent === 'ask_akili') {
      setSidebarTab('SMART_TUTOR');
      setMode('SCAN_EXPLAIN');
    } else if (entryIntent === 'official_library') {
      setSidebarTab('RESOURCES');
      setLibraryView('UNLOCKED');
      setMode('LIBRARY');
    } else if (entryIntent === 'exam_prep_papers') {
      setSidebarTab('SUBJECTS');
      setMode('REVISION');
    } else if (entryIntent === 'listen_and_learn') {
      setSidebarTab('TALKBACK');
      setMode('TALKBACK');
    }

    setEntryIntent(null);
    navigate(location.pathname, { replace: true, state: {} });
  }, [entryIntent, initialTab, location.pathname, navigate, trackFunnelEvent]);

  const checkLimit = (action?: PendingPaywallAction): boolean => {
    if (resumeBypassRef.current) {
      resumeBypassRef.current = false;
      return true;
    }

    const hasClientActiveSubscription =
      subscriptionPlan !== 'FREE' &&
      !!subscriptionExpiry &&
      !isNaN(new Date(subscriptionExpiry).getTime()) &&
      new Date(subscriptionExpiry) > new Date();

    // Pro = Unlimited Checks
    if (isPro || hasRecentPaymentUnlock || hasClientActiveSubscription || learningCredits > 0) return true;

    // Defensive: If we are registered but isPro is not yet set (or false), 
    // we should still allow access if usage is below limit.
    // If usage is ABOVE limit, and we are registered, we show limit modal.
    if (usageCount >= 3) {
      trackFunnelEvent('paywall_shown', {
        source: 'learner_usage_limit',
        role: role || 'GUEST',
        action_type: action?.type || 'UNKNOWN'
      });
      if (action) {
        setPendingPaywallAction(action);
      }

      // Second chance: refresh profile once if we think we might be pro but usage is high
      // (This is a bit heavy, but safe for users who just paid)

      if (role === UserRole.GUEST || !isRegistered) {
        setShowLimitModal(true);
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
    if (!checkLimit({ type: 'PROCESS_FILE', file })) return;

    setLoading(true);
    setError(null);
    setLoadingText("Akili is reading your content...");
    setMode('SCAN'); // Show loading/preview

    try {
      const base64 = await fileToGenerativePart(file);
      setImageData({ base64, mimeType: file.type });
      setAudioData(null); // Clear previous audio if any

      const result = await explainImage(base64, file.type, level, language, 'TUTOR', educationLevel);
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

      if (error instanceof RateLimitError || error?.name === 'RateLimitError') {
        handleRateLimitError(error);
        return;
      }

      let errorMessage = "We couldn't process this image. Please ensure it's clear and contains text.";
      let errorTitle = "Scan Failed";

      if (!isOnline || !navigator.onLine || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        if (!navigator.onLine) {
          errorTitle = "Offline Error";
          errorMessage = "You are offline. Please check your internet to process this scan.";
        } else {
          errorTitle = "Connection Error";
          errorMessage = "We couldn't connect to our servers. Please check your internet connection or try again shortly.";
        }
      } else if (error.message?.includes("Safety") || error.message?.includes("blocked")) {
        errorMessage = "This content was flagged by our safety filters. Please try a different page.";
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
    // ConversationalTutor (TALKBACK) manages its own recording — don't interfere.
    if (mode === 'TALKBACK') return;
    try {
      setMicPermissionNotice(false);

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
        } else if (mode === 'TALKBACK') {
          // ConversationalTutor has its own recording system — do NOT navigate away.
          console.log("Global recorder stopped in TALKBACK mode — ignoring.");
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
      const message = String(e?.message || '');
      const isPermissionError =
        e?.name === 'NotAllowedError' ||
        e?.name === 'PermissionDeniedError' ||
        message.toLowerCase().includes('denied') ||
        message.toLowerCase().includes('permission');

      if (isPermissionError) {
        setError(null);
        setMicPermissionNotice(true);
        return;
      }

      setError({
        title: "Microphone Error",
        message: "Your browser could not start the microphone. Check that your device has a working mic, then try again."
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
    if (!checkLimit({ type: 'AUDIO_EXPLANATION', blob, mimeType })) return;

    setLoading(true);
    setError(null);
    setLoadingText("Akili is listening...");
    setMode('SCAN'); // repurpose SCAN for loading view

    const handleAudioFailure = (e: any) => {
      console.error(e);

      if (e instanceof RateLimitError || e?.name === 'RateLimitError') {
        handleRateLimitError(e);
        return;
      }

      if (e?.name === 'SystemQuotaError' || e?.message?.toLowerCase?.().includes('rate-limiting')) {
        setError({
          title: "Akili Is Busy",
          message: e?.message || "Too many AI requests are hitting the system right now. Please wait a few minutes, then try the recording again."
        });
        setLoading(false);
        setMode('MENU');
        return;
      }

      const isNet = !isOnline || !navigator.onLine || e.message?.includes('network') || e.message?.includes('Failed to fetch');
      if (isNet) {
        if (!navigator.onLine) {
          setError({
            title: "Offline Error",
            message: "You are offline. Please check your internet to process audio."
          });
        } else {
          setError({
            title: "Connection Error",
            message: "We couldn't connect to our servers. Please check your internet connection or try again shortly."
          });
        }
      } else {
        setError({
          title: "Audio Error",
          message: "We couldn't understand the audio. Please speak clearly or try again."
        });
      }
      setLoading(false);
      setMode('MENU');
    };

    const reader = new FileReader();
    reader.onerror = () => handleAudioFailure(new Error("Could not read the audio recording."));
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];

        setAudioData({ base64: base64Data, mimeType }); // Store for regeneration
        setImageData(null);

        const result = await explainAudio(base64Data, mimeType, level, language, educationLevel);
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
      } catch (e: any) {
        handleAudioFailure(e);
      }
    };
    reader.readAsDataURL(blob);
  };

  const handleRegenerate = async (newLevel: 'Simple' | 'Exam') => {
    if (!audioData && !imageData && !explanation?.topic) return;

    setLoading(true);
    setError(null);
    setLoadingText("Akili is updating the explanation...");
    setMode('SCAN'); // Show loading screen
    try {
      let result: ExplanationResult | null = null;

      if (audioData) {
        result = await explainAudio(audioData.base64, audioData.mimeType, newLevel, language, educationLevel);
      } else if (imageData) {
        result = await explainImage(imageData.base64, imageData.mimeType, newLevel, language, 'TUTOR', educationLevel);
      } else if (explanation?.topic) {
        // Fallback for topic based regeneration
        result = await explainTopic(explanation.topic, newLevel, language, undefined, currentDocument?.subject, currentDocument?.grade, undefined, { masteryGraph, recentHurdles: weakTopics }, activeStrategies, 'TUTOR', educationLevel, groundedAnswerMode);
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

  const getQuizRequestTopic = (input: string): string | null => {
    const cleaned = input.trim();
    if (!cleaned) return null;

    const lower = cleaned.toLowerCase();
    const isQuizRequest =
      /\b(generate|create|make|set|give|start|take|practice|prepare)\b.*\b(quiz|test|questions?)\b/.test(lower) ||
      /\b(quiz|test)\s+me\b/.test(lower);

    if (!isQuizRequest) return null;

    const topicMatch = cleaned.match(/\b(?:on|about|for|from)\s+(.+)$/i);
    const rawTopic = topicMatch?.[1] || cleaned
      .replace(/\b(generate|create|make|set|give|start|take|practice|prepare)\b/gi, '')
      .replace(/\b(a|an|quick|short|practice|revision|quiz|test|questions?|me)\b/gi, '');

    return rawTopic.replace(/[?.!]+$/g, '').trim() || 'General revision';
  };

  const restoreMemberSessionForResume = async () => {
    const savedStudentCode = localStorage.getItem('soma_active_student');
    if (!savedStudentCode) return false;

    const restored = await login(savedStudentCode);
    if (restored) {
      await verifySubscription();
      setHasRecentPaymentUnlock(true);
    }
    return restored;
  };

  const handleTopicClick = async (topic: string, multimedia?: { data: string, mimeType: string }) => {
    if (!checkLimit({ type: 'TOPIC_CLICK', topic, multimedia })) return;

    setLoading(true);
    setError(null);
    const requestedQuizTopic = !multimedia ? getQuizRequestTopic(topic) : null;
    setLoadingText(requestedQuizTopic ? `Akili is crafting a quiz on ${requestedQuizTopic}...` : topic ? `Akili is exploring ${topic}...` : "Akili is reading your attachment...");
    setMode('SCAN'); // Show loading
    const purpose = sidebarTab === 'HOMEWORK' ? 'HOMEWORK' : 'TUTOR';
    try {
      setAudioData(null);
      setImageData(null);

      if (requestedQuizTopic) {
        const quiz = await generateQuickQuiz(
          `Create a learner-ready quiz on ${requestedQuizTopic}. Test key definitions, process steps, misconceptions, and exam-style understanding. Do not explain what a quiz is, and do not add an introduction or tutorial text.`,
          requestedQuizTopic,
          language
        );
        setQuizData(quiz);
        setStickyQuizTaken(true);
        trackFunnelEvent('learner_quiz_started', {
          source: 'ask_akili_prompt',
          topic: requestedQuizTopic
        });
        setMode('QUIZ');
        return;
      }

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
        purpose,
        educationLevel,
        groundedAnswerMode
      );
      setExplanation(result);
      trackFunnelEvent('learner_grounding_result', {
        requested: groundedAnswerMode,
        used: !!result.grounding?.used,
        sourceCount: result.grounding?.sources?.length || 0,
        topic: result.topic
      });

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

      // Update baseline topic mastery on studying a topic (40%) and trigger immediate cloud sync
      updateTopicMastery(result.topic, 40);
      triggerMemorySync();

      // Trigger background quiz generation
      generateQuickQuiz(result.explanation, result.topic, language)
        .then(data => setStickyQuizData(data))
        .catch(err => console.error("Background quiz gen failed", err));
    } catch (e: any) {
      console.error("Topic explain error:", e);

      if (e instanceof RateLimitError || e?.name === 'RateLimitError') {
        handleRateLimitError(e);
        return;
      }

      const isNet = !isOnline || !navigator.onLine || e.message?.includes('network') || e.message?.includes('Failed to fetch');
      if (isNet) {
        if (!navigator.onLine) {
          setError({
            title: "Offline Error",
            message: "You are offline. Please check your internet connection."
          });
        } else {
          setError({
            title: "Connection Error",
            message: "We couldn't connect to our servers. Please check your internet connection or try again shortly."
          });
        }
      } else {
        setError({
          title: "Explanation Failed",
          message: "We couldn't generate an explanation. Please try again."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSubmit = async (overrideText?: unknown) => {
    const query = typeof overrideText === 'string' ? overrideText.trim() : promptText.trim();
    if (!query && !pendingMedia) return;
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
${explanation.summaryPoints.map(p => `- ${p}`).join('\n')}

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
                      {item.type === 'QUIZ' ? <FileText className="w-5 h-5 text-indigo-500" /> : <Lightbulb className="w-5 h-5 text-amber-500" />}
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
    if (!checkLimit({ type: 'STUDY_QUIZ' })) return;
    setLoading(true);
    setLoadingText("Creating your quiz...");
    try {
      const quiz = await generateQuiz(explanation.explanation, explanation.topic, language);
      setQuizData(quiz);
      setStickyQuizTaken(true); // Marked as taken so they aren't bugged on exit
      trackFunnelEvent('learner_quiz_started', {
        source: 'result_view',
        topic: explanation.topic
      });
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
      // Build a natural spoken script — avoid raw markdown being read aloud
      const spokenIntro = `Today we're learning about ${explanation.topic}.`;
      const spokenSummary = explanation.summaryPoints.length > 0
        ? `Here are the key points. ${explanation.summaryPoints.join('. ')}.`
        : '';
      // Use plain explanation text, stripping markdown
      const plainExplanation = explanation.explanation
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, ' ')
        .trim();
      const textToRead = `${spokenIntro} ${spokenSummary} ${plainExplanation}`.slice(0, 4500);

      setIsPlaying(true);
      await generateSpeech(textToRead, language);
    } catch (e: any) {
      console.error("TTS Error:", e);
      if (e instanceof PlanLimitError || e?.name === 'PlanLimitError') {
        setShowLimitModal(true);
        setError({
          title: "Voice Limit Reached",
          message: "Your Listen & Learn voice allowance is used up. Buy learning credits or upgrade your plan to continue with natural ElevenLabs audio."
        });
        return;
      }
      setError({
        title: "Voice Unavailable",
        message: e?.message || "The natural ElevenLabs voice could not load. Please check the voice service configuration."
      });
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
      // Restart from beginning
      setCurrentSegmentIndex(0);
      setIsPodcastPlaying(true);

      if (explanation) {
        updateTopicMastery(explanation.topic, 50);
        saveActivity({
          id: Date.now().toString(),
          type: 'STUDY',
          topic: explanation.topic,
          date: new Date().toLocaleDateString(),
          details: JSON.stringify({ mode: 'podcast_recap', xpEarned: 30 })
        });
        triggerMemorySync();
      }

      playPodcast(
        podcastScript.script,
        (idx) => setCurrentSegmentIndex(idx),
        () => setIsPodcastPlaying(false),
        (err) => {
          setIsPodcastPlaying(false);
          setError({ title: "Voice Unavailable", message: err.message || "The natural ElevenLabs voice could not play." });
        }
      );
      return;
    }

    // Generate New
    if (!explanation) return;
    if (!checkLimit({ type: 'PODCAST' })) return;
    try {
      setPodcastLoading(true);
      setCurrentSegmentIndex(-1);
      const script = await generatePodcastScript(explanation.explanation, explanation.topic);
      setPodcastScript(script);
      setPodcastTotalSegments(script.script.length);
      setPodcastLoading(false);
      setIsPodcastPlaying(true);

      updateTopicMastery(explanation.topic, 50);
      saveActivity({
        id: Date.now().toString(),
        type: 'STUDY',
        topic: explanation.topic,
        date: new Date().toLocaleDateString(),
        details: JSON.stringify({ mode: 'podcast_recap', xpEarned: 30 })
      });
      triggerMemorySync();

      playPodcast(
        script.script,
        (idx) => setCurrentSegmentIndex(idx),
        () => setIsPodcastPlaying(false),
        (err) => {
          setIsPodcastPlaying(false);
          setError({ title: "Voice Unavailable", message: err.message || "The natural ElevenLabs voice could not play." });
        }
      );

    } catch (e) {
      console.error(e);
      setPodcastLoading(false);
      setError({ title: "Podcast Error", message: "Failed to generate audio overview." });
    }
  };

  const handlePodcastSkip = () => {
    if (!podcastScript) return;
    const nextIdx = currentSegmentIndex + 1;
    if (nextIdx >= podcastScript.script.length) {
      cancelPodcast();
      setIsPodcastPlaying(false);
      setCurrentSegmentIndex(-1);
      return;
    }
    cancelPodcast();
    const remaining = podcastScript.script.slice(nextIdx);
    setCurrentSegmentIndex(nextIdx);
    setIsPodcastPlaying(true);
    playPodcast(
      remaining,
      (idx) => setCurrentSegmentIndex(nextIdx + idx),
      () => setIsPodcastPlaying(false),
      (err) => {
        setIsPodcastPlaying(false);
        setError({ title: "Voice Unavailable", message: err.message || "The natural ElevenLabs voice could not play." });
      }
    );
  };

  const handlePodcastRegenerate = () => {
    cancelPodcast();
    setIsPodcastPlaying(false);
    setPodcastScript(null);
    setPodcastTotalSegments(0);
    setCurrentSegmentIndex(-1);
    // Kick off generation again after state settles
    setTimeout(() => handlePodcastToggle(), 100);
  };

  const autoPlayPodcastRef = useRef<boolean>(false);

  useEffect(() => {
    if (mode === 'RESULT' && explanation && autoPlayPodcastRef.current) {
      autoPlayPodcastRef.current = false;
      setTimeout(() => {
        handlePodcastToggle();
      }, 500);
    }
  }, [mode, explanation]);

  const handleQuestStudyTopic = (topic: string) => {
    handleTopicClick(topic);
  };

  const handleQuestTakeQuiz = async (topic: string) => {
    if (!checkLimit({ type: 'STUDY_QUIZ' })) return;
    setLoading(true);
    setError(null);
    setLoadingText(`Akili is crafting a quiz on ${topic}...`);
    setMode('SCAN'); // Show loading screen
    try {
      const quiz = await generateQuickQuiz(
        `Create a learner-ready quiz on ${topic}. Test key definitions, process steps, misconceptions, and exam-style understanding. Do not explain what a quiz is, and do not add an introduction or tutorial text.`,
        topic,
        language
      );
      setQuizData(quiz);
      setStickyQuizTaken(true);
      trackFunnelEvent('learner_quiz_started', {
        source: 'quest_roadmap',
        topic: topic
      });
      setMode('QUIZ');
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError({ title: "Quiz Generation Error", message: "Failed to generate quick quiz." });
    }
  };

  const handleQuestListenRecap = (topic: string) => {
    autoPlayPodcastRef.current = true;
    handleTopicClick(topic);
  };

  // Remove unused playBuffer helper
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const playBuffer = () => { /* No-op */ };

  // --- VIEWS ---
  const renderMode = () => {
    if (mode === 'FLASHCARDS') {
      const flashcardItems = (practiceMode === 'due' ? dueForReview : spacedRepetitionItems)
        .filter(item => item.question && item.answer);

      const totalFlashcards = spacedRepetitionItems?.filter(i => i.question && i.answer).length || 0;
      const dueFlashcardsCount = dueForReview?.filter(i => i.question && i.answer).length || 0;

      const handleSeed = () => {
        const samples = [
          {
            topic: "Photosynthesis",
            subject: "Biology",
            grade: "Form 1",
            nextReviewDate: new Date().toISOString(),
            intervalDays: 1,
            easeFactor: 2.5,
            lastScore: 0,
            reviewCount: 0,
            question: "What are the raw materials and products of photosynthesis in plants?",
            answer: "Raw Materials:\n- Carbon dioxide (absorbed through stomata)\n- Water (absorbed through roots)\n\nProducts:\n- Glucose (chemical energy stored as starch)\n- Oxygen gas (released as a byproduct through stomata)\n\nReaction Equation:\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂"
          },
          {
            topic: "Quadratic Equations",
            subject: "Mathematics",
            grade: "Form 2",
            nextReviewDate: new Date().toISOString(),
            intervalDays: 1,
            easeFactor: 2.5,
            lastScore: 0,
            reviewCount: 0,
            question: "State the quadratic formula and explain what the discriminant determines about the roots.",
            answer: "Quadratic Formula:\nx = [-b ± √(b² - 4ac)] / (2a)\n\nDiscriminant (D = b² - 4ac):\n1. D > 0: Two distinct real roots.\n2. D = 0: One repeated real root (equal roots).\n3. D < 0: Two complex/imaginary roots."
          },
          {
            topic: "Devolution in Kenya",
            subject: "History & Government",
            grade: "Form 4",
            nextReviewDate: new Date().toISOString(),
            intervalDays: 1,
            easeFactor: 2.5,
            lastScore: 0,
            reviewCount: 0,
            question: "What are the primary objectives of devolving governance to the 47 counties in Kenya?",
            answer: "Primary Objectives:\n1. Promote democratic and accountable exercise of power.\n2. Foster national unity by recognizing diversity.\n3. Give powers of self-governance to the people and enhance their participation.\n4. Ensure equitable sharing of national and local resources across Kenya.\n5. Facilitate the decentralization of state organs and public services from the capital."
          }
        ];
        samples.forEach(item => addSpacedRepetitionItem(item));
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setReviewComplete(false);
      };

      if (reviewComplete) {
        return (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 md:p-12 rounded-3xl max-w-xl w-full text-center shadow-2xl relative z-10 animate-fade-in">
              <div className="w-20 h-20 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-indigo-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2 tracking-wide font-sans">Deck Mastered! 🎉</h1>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed font-sans font-medium">
                Fantastic job! You've successfully finished this spaced-repetition active recall session.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Reviewed</p>
                  <p className="text-2xl font-black text-white">{flashcardItems.length} Cards</p>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Sync Status</p>
                  <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Cloud Synced
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setMode('MENU')}
                  className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95 duration-200 cursor-pointer text-center"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => {
                    setPracticeMode('all');
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setReviewComplete(false);
                  }}
                  className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700/85 border border-slate-700 text-slate-200 rounded-2xl font-bold text-sm transition-all active:scale-95 duration-200 cursor-pointer text-center"
                >
                  Review Deck Again
                </button>
              </div>
            </div>
          </div>
        );
      }

      const activeCard = flashcardItems[currentCardIndex];
      const progressPct = flashcardItems.length > 0 ? (currentCardIndex / flashcardItems.length) * 100 : 0;

      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col p-4 md:p-8 select-none relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

          {/* HEADER BAR */}
          <div className="max-w-4xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl relative z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('MENU')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center group active:scale-95"
              >
                <ArrowRight className="rotate-180 w-4 h-4 text-slate-300 group-hover:text-white" />
              </button>
              <div>
                <h1 className="text-base font-extrabold tracking-wide flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                  Active Recall Review
                </h1>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  Spaced Repetition Queue
                </p>
              </div>
            </div>

            {totalFlashcards > 0 && (
              <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => {
                    setPracticeMode('due');
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setReviewComplete(false);
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    practiceMode === 'due'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Due Review ({dueFlashcardsCount})
                </button>
                <button
                  onClick={() => {
                    setPracticeMode('all');
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setReviewComplete(false);
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    practiceMode === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Review All ({totalFlashcards})
                </button>
              </div>
            )}
          </div>

          {/* MAIN BODY AREA */}
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center relative z-10 py-4">
            {flashcardItems.length === 0 ? (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-xl">
                <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Queue is Clear! ✨</h2>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">
                  {totalFlashcards > 0
                    ? "Fantastic work! You have no spaced repetition cards due right now. You can practice all decks at any time!"
                    : "No flashcards found in your deck yet. Seed 3 high-yield CBC/KCSE curriculum cards to get started!"
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleSeed}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 duration-200 cursor-pointer"
                  >
                    {totalFlashcards > 0 ? "Reset & Seed 3 Q&A Cards" : "Seed 3 Sample Q&A Cards"}
                  </button>
                  {totalFlashcards > 0 && (
                    <button
                      onClick={() => {
                        setPracticeMode('all');
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                        setReviewComplete(false);
                      }}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95 duration-200 cursor-pointer"
                    >
                      Review All ({totalFlashcards})
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="max-w-xl w-full mx-auto mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                    <span className="text-[10px] font-black text-indigo-400 tracking-wider">PROGRESS</span>
                    <span>Card {currentCardIndex + 1} of {flashcardItems.length}</span>
                  </div>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* 3D Flipping Card Container */}
                <div className="w-full max-w-xl mx-auto min-h-[360px] md:min-h-[400px] perspective-[1200px] relative mb-8">
                  <div
                    onClick={() => { if (!isFlipped) setIsFlipped(true); }}
                    className="w-full h-full min-h-[360px] md:min-h-[400px] rounded-3xl relative transition-transform duration-700 cursor-pointer"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    {/* FRONT FACE */}
                    <div
                      className="absolute inset-0 w-full h-full p-6 md:p-8 rounded-3xl border border-slate-800 bg-slate-900 flex flex-col justify-between overflow-y-auto select-none shadow-2xl"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/35 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {activeCard.subject || 'General'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {activeCard.grade || 'KCSE'}
                        </span>
                      </div>

                      <div className="my-auto py-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Question</p>
                        <h2 className="text-xl md:text-2xl font-extrabold text-white leading-relaxed select-text font-sans">
                          {activeCard.question}
                        </h2>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-indigo-400/80 text-xs font-bold animate-bounce mt-4">
                        <span>Tap Card to Show Answer</span>
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>

                    {/* BACK FACE */}
                    <div
                      className="absolute inset-0 w-full h-full p-6 md:p-8 rounded-3xl border border-indigo-500/30 bg-slate-900 flex flex-col justify-between overflow-y-auto select-none shadow-2xl shadow-indigo-500/5"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/35 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {activeCard.topic}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            Answer Revealed
                          </span>
                        </div>

                        <div className="py-2">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Suggested Answer</p>
                          <div className="text-sm md:text-base font-medium text-slate-200 leading-relaxed whitespace-pre-wrap select-text font-sans">
                            {activeCard.answer}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] font-semibold text-slate-500 text-center mt-6 uppercase tracking-wider">
                        Rate difficulty below to update memory schedule
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating buttons shown only when flipped */}
                {isFlipped && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl w-full mx-auto relative z-20 animate-fade-in">
                    {[
                      { name: 'Again 🟥', score: 20, desc: 'Forgot completely', color: 'from-rose-500/10 to-rose-600/10 border-rose-500/20 text-rose-400 hover:from-rose-500 hover:to-rose-600' },
                      { name: 'Hard 🟨', score: 50, desc: 'Struggled a lot', color: 'from-amber-500/10 to-amber-600/10 border-amber-500/20 text-amber-400 hover:from-amber-500 hover:to-amber-600' },
                      { name: 'Good 🟩', score: 80, desc: 'Remembered well', color: 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:from-emerald-500 hover:to-emerald-600' },
                      { name: 'Easy 🟦', score: 100, desc: 'Fluent / Perfect', color: 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:from-indigo-500 hover:to-indigo-600' }
                    ].map(btn => (
                      <button
                        key={btn.name}
                        onClick={() => {
                          processQuizCompletion(activeCard.topic, btn.score, activeCard.subject, activeCard.grade);
                          triggerMemorySync();

                          if (currentCardIndex < flashcardItems.length - 1) {
                            setCurrentCardIndex(prev => prev + 1);
                            setIsFlipped(false);
                          } else {
                            setReviewComplete(true);
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3.5 bg-gradient-to-br ${btn.color} border hover:text-white rounded-2xl transition-all cursor-pointer hover:shadow-lg active:scale-95 duration-200 group/btn`}
                      >
                        <span className="font-extrabold text-xs mb-0.5">{btn.name}</span>
                        <span className="text-[8px] font-bold opacity-60 group-hover/btn:text-white">{btn.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    if (mode === 'QUEST_MAP') {
      const masteryMapForPath: Record<string, number> = cloudMemoryRow?.mastery_graph || {};
      const weakTopicsForPath: string[] = (cloudMemoryRow?.weak_topics || []).filter(Boolean).slice(0, 8);
      const strongTopicsForPath: string[] = (cloudMemoryRow?.strong_topics || []).filter(Boolean).slice(0, 5);
      const gradeLabel = studentProfile?.grade || (educationLevel === 'CAMPUS' ? 'University' : educationLevel === 'JUNIOR' ? 'Class 8' : 'Form 3');
      const subjectsForPath = [...new Set(weakTopicsForPath.map(t => t.split(' – ')[0] || t.split(':')[0]).filter(Boolean))].slice(0, 4);

      return (
        <div className="pb-24">
          {/* Sub-tab switcher */}
          <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-3 flex gap-2">
            {(['MAP', 'PATH'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setQuestSubTabState(tab)}
                className={`flex-1 py-2 text-sm font-black rounded-xl transition-all ${
                  questSubTabState === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab === 'MAP' ? '🗺️ Quest Map' : '✨ My Path'}
              </button>
            ))}
          </div>
          {questSubTabState === 'MAP' ? (
            <QuestRoadmap
              onStudyTopic={handleQuestStudyTopic}
              onTakeQuiz={handleQuestTakeQuiz}
              onListenRecap={handleQuestListenRecap}
              cloudMemoryRow={cloudMemoryRow}
            />
          ) : (
            <div className="p-4 md:p-6">
              <LearningPathView
                grade={gradeLabel}
                subjects={subjectsForPath.length > 0 ? subjectsForPath : ['Mathematics', 'English', 'Science']}
                masteryMap={masteryMapForPath}
                completedTopics={strongTopicsForPath}
                weakTopics={weakTopicsForPath}
                streak={cloudMemoryRow?.streak_days ?? 0}
                avgScore={cloudMemoryRow?.avg_score ?? 0}
                onStartTopic={handleQuestStudyTopic}
              />
            </div>
          )}
        </div>
      );
    }

    if (mode === 'REVISION') {
      return (
        <React.Suspense fallback={<DeferredViewLoader />}>
          <RevisionLanding
            onBack={() => setMode('MENU')}
            onNavigate={onNavigate}
            onStartSession={(data, sessionMode) => {
              if (!checkLimit({ type: 'REVISION_ENTRY' })) return;
              setActiveRevisionSession({ data, mode: sessionMode });
              setMode('REVISION_SESSION');
            }}
          />
        </React.Suspense>
      );
    }

    if (mode === 'REVISION_SESSION' && activeRevisionSession) {
      return (
        <React.Suspense fallback={<DeferredViewLoader />}>
          <RevisionSession
            data={activeRevisionSession.data}
            mode={activeRevisionSession.mode}
            onExit={() => {
              setActiveRevisionSession(null);
              setMode('REVISION');
            }}
          />
        </React.Suspense>
      );
    }

    if (mode === 'TALKBACK') {
      return (
        <React.Suspense fallback={<DeferredViewLoader />}>
          <ConversationalTutor
            onBeforeMessage={() => checkLimit({ type: 'TALKBACK_MESSAGE' })}
            initialActiveMode={tutorInitialActiveMode}
            initialTutorMode={tutorInitialTutorMode}
            onBack={() => {
              setMode('MENU');
              setSidebarTab('HOME');
            }}
          />
        </React.Suspense>
      );
    }

    if (mode === 'COMMUNITY') {
      return (
        <div className="p-4 md:p-8 animate-in fade-in pb-24">
          <React.Suspense fallback={<DeferredViewLoader />}>
            <Community />
          </React.Suspense>
        </div>
      );
    }

    if (mode === 'REFERRAL') {
      return (
        <div className="p-4 md:p-8 animate-in fade-in pb-24">
          <React.Suspense fallback={<DeferredViewLoader />}>
            <ReferralView />
          </React.Suspense>
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
          {/* TOP BAR */}
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
                  <li key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm flex gap-3">
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
                  <p key={i} className="text-sm text-red-800 font-medium">- {tip}</p>
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
                    : 'bg-white border-2 border-slate-300 rounded-bl-md'
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
                      {!isNaN(new Date(msg.createdAt).getTime()) ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><ClipboardList className="w-9 h-9 text-slate-400" /></div>
                <p className="font-medium">No requests sent yet.</p>
                <button onClick={() => { setMode('SCAN'); setTimeout(() => setShowTutoringModal(true), 100); }} className="mt-4 text-indigo-600 font-bold text-sm">Ask a Teacher</button>
              </div>
            ) : (
              activeTutoringRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border-2 border-slate-300 dark:border-slate-800 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{req.topic}</h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {!isNaN(new Date(req.createdAt).getTime()) ? new Date(req.createdAt).toLocaleDateString() : 'Unknown Date'}</p>
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
                        <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800">
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
                        <div className="aspect-video bg-black rounded-xl relative overflow-hidden shadow-lg border-2 border-slate-300">
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
                                  {ratingValue === 1 ? 'Needs work' : ratingValue === 2 ? 'Okay' : ratingValue === 3 ? 'Good' : ratingValue === 4 ? 'Great' : 'Excellent'}
                                </span>
                              )}
                            </div>
                            <input
                              value={ratingFeedback}
                              onChange={e => setRatingFeedback(e.target.value)}
                              placeholder="Optional feedback..."
                              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none transition-all"
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

                      {/* Continue Chat Button - gated by parent PIN + payment */}
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
                          <>Continue Chat with Teacher</>
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
      const hour = new Date().getHours();
      const getGreetingWord = () => hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const recentTopics = [...new Set(history.map((h: any) => h.topic))].filter(Boolean).slice(0, 3) as string[];
      const hasHistory = history.length > 0;
      const hasProgress = totalXP > 0;
      const freeUsesLeft = Math.max(0, 3 - usageCount);
      const latestStudy = history.find((h: any) => h.type === 'EXPLANATION' || h.type === 'STUDY');
      const latestQuiz = history.find((h: any) => h.type === 'QUIZ');
      const hasStudiedTopic = Boolean(latestStudy?.topic);
      const hasQuizAttempt = Boolean(latestQuiz);
      const hasScoreGain = typeof latestQuiz?.score === 'number' && latestQuiz.score >= 0;
      const quizAttempts = history.filter((h: any) => h.type === 'QUIZ').length;
      const scoredQuizzes = history.filter((h: any) => h.type === 'QUIZ' && typeof h.score === 'number') as Array<{ score: number }>;
      const averageQuizScore = scoredQuizzes.length
        ? Math.round(scoredQuizzes.reduce((sum, item) => sum + item.score, 0) / scoredQuizzes.length)
        : null;
      const effectivePlan = isPro ? subscriptionPlan : 'FREE';
      const planMeters = [
        { feature: 'ai_generation', label: 'Ask Akili', icon: <Sparkles className="w-4 h-4" />, unit: 'calls' as const },
        { feature: 'exam_guru', label: 'Exam Guru', icon: <ClipboardList className="w-4 h-4" />, unit: 'calls' as const },
        { feature: 'exam_marking', label: 'Smart Marking', icon: <PenTool className="w-4 h-4" />, unit: 'calls' as const },
        { feature: 'listen_and_learn_voice', label: 'Voice Lessons', icon: <Headphones className="w-4 h-4" />, unit: 'characters' as const },
      ].map(item => {
        const limit = getPlanLimit(item.feature, effectivePlan);
        const used = getPlanUsage(item.feature, effectivePlan);
        const remaining = Math.max(0, limit - used);
        return {
          ...item,
          limit,
          used,
          remaining,
          pct: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100
        };
      });
      const dueFlashcardsCountForNext = dueForReview?.filter(i => i.question && i.answer).length || 0;
      const focusTopic = (lastQuizReview?.missedQuestions.length && explanation?.topic)
        ? explanation.topic
        : (weakTopics?.[0] || latestQuiz?.topic || latestStudy?.topic || recentTopics[0] || 'today\'s topic');
      const nextStep = lastQuizReview?.missedQuestions.length
        ? {
            label: 'Repair last quiz misses',
            title: `Fix ${lastQuizReview.missedQuestions.length} missed question${lastQuizReview.missedQuestions.length === 1 ? '' : 's'}`,
            body: 'Do a correction-first drill before moving to a new topic.',
            cta: 'Start Repair Drill',
            action: () => {
              const repairPrompt = `Create a correction-first repair drill on ${focusTopic}. Start with the key idea, then give 5 practice questions. Do not show answers until I try.`;
              setPromptText(repairPrompt);
              handlePromptSubmit(repairPrompt);
            }
          }
        : weakTopics?.length
        ? {
            label: 'Weak topic detected',
            title: `Strengthen ${focusTopic}`,
            body: 'Akili will explain the idea, test you, then help repair mistakes.',
            cta: 'Start Weakness Drill',
            action: () => {
              const weakPrompt = `Help me improve in ${focusTopic}. Explain the core idea briefly, then generate a 5-question quiz and mark my answers after I try.`;
              setPromptText(weakPrompt);
              handlePromptSubmit(weakPrompt);
            }
          }
        : dueFlashcardsCountForNext > 0
        ? {
            label: 'Memory review due',
            title: `${dueFlashcardsCountForNext} recall card${dueFlashcardsCountForNext === 1 ? '' : 's'} due`,
            body: 'Reviewing before you forget is the fastest way to improve exam memory.',
            cta: 'Review Cards',
            action: () => {
              setPracticeMode('due');
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setReviewComplete(false);
              setMode('FLASHCARDS');
            }
          }
        : hasQuizAttempt
        ? {
            label: 'Beat your last score',
            title: `Last quiz: ${typeof latestQuiz?.score === 'number' ? `${latestQuiz.score}%` : 'completed'}`,
            body: `Take a focused retry on ${focusTopic} and aim for a better score.`,
            cta: 'Try Again',
            action: () => {
              const retryPrompt = `Generate a fresh 5-question quiz on ${focusTopic}. Make it exam-style and wait for my answers before marking.`;
              setPromptText(retryPrompt);
              handlePromptSubmit(retryPrompt);
            }
          }
        : {
            label: 'First performance loop',
            title: 'Pick one topic, learn it, then test yourself',
            body: 'Start from library notes or a past paper question, then ask Akili to quiz you.',
            cta: 'Open Library',
            action: () => handleSidebarTabChange('RESOURCES')
          };
      const learningModePrompts = [
        {
          label: 'Hint First',
          body: 'Get guidance without giving away the answer.',
          buildPrompt: (question: string) => `Act like a tutor, not a lecturer. Give me one hint first, ask me to try, then reveal the next step only after I respond.\n\nDo not explain what a quiz, exam, or lesson is.\n\nMy question: ${question || '[type or paste your question here]'}`
        },
        {
          label: 'Mark My Working',
          body: 'Paste your attempt and get corrections.',
          buildPrompt: (question: string) => `Mark my working like a KNEC examiner. Identify the first mistake, explain why it is wrong, and give me one similar practice question.\n\nDo not give a lesson about what marking is. Go straight to the correction.\n\nMy working: ${question || '[paste your working here]'}`
        },
        {
          label: 'Quiz Me',
          body: 'Turn this topic into a self-test.',
          buildPrompt: (question: string) => `Create a 5-question quiz on this topic only. Do not explain what a quiz is, what a test is, or add an introduction.\n\nAsk one question at a time, wait for my answer, then mark it and explain the correction.\n\nTopic: ${question || '[type the topic here]'}`
        },
        {
          label: 'Past Paper Coach',
          body: 'Work through exam questions step by step.',
          buildPrompt: (question: string) => `Help me solve this past paper question like an exam coach. First identify the topic and command word, then guide me through the method.\n\nDo not explain what a past paper is. Do not give the final answer until I try.\n\nQuestion: ${question || '[paste the past paper question here]'}`
        },
        {
          label: 'Explain Simply',
          body: 'Break it down for a stuck learner.',
          buildPrompt: (question: string) => `Explain this in simple language for a Kenyan learner. Go straight to the idea, use a short example, then ask me one check question before giving a quiz.\n\nDo not define the learning tool itself.\n\nTopic or question: ${question || '[type what you do not understand here]'}`
        },
        {
          label: 'Swahili Support',
          body: 'Use simple English with Kiswahili help.',
          buildPrompt: (question: string) => `Explain this using simple English, and add short Kiswahili support for hard words. Then ask me to explain it back in my own words.\n\nDo not add generic tutorial text.\n\nTopic or question: ${question || '[type your question here]'}`
        }
      ];

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 w-full transition-colors duration-300">

          {/* TOP BAR */}
          <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/70">
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <img src={logoImg} alt="Somo Smart" className="h-8 w-auto object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {!isRegistered ? (
                  <>
                    <button
                      onClick={() => navigate('/parent')}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Parent
                    </button>
                    <button
                      onClick={() => setShowRegistration(true)}
                      className="hidden sm:block px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Register
                    </button>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Log In
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setMode('PROFILE')}
                    className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md hover:scale-105 transition-transform"
                    aria-label="Open profile"
                  >
                    {profile?.name?.charAt(0) || 'S'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SCROLL CONTENT */}
          <div className="max-w-5xl mx-auto px-4 pb-32 pt-6">
            <AnimatePresence>
              {joinedClassNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">You joined {joinedClassNotice}</p>
                    <p className="text-xs font-bold text-emerald-800/80 dark:text-emerald-200/80 mt-1">
                      Your teacher can now see you in the classroom roster.
                    </p>
                  </div>
                  <button
                    onClick={() => setJoinedClassNotice(null)}
                    className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors"
                    aria-label="Dismiss class joined notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>


            {/* WELCOME CARD — newly registered users on first login (registered + zero history) */}
            {isRegistered && !hasHistory && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 p-5 sm:p-6 text-white shadow-lg shadow-emerald-500/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-xl">🎓</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mb-1">
                      Welcome, {profile?.name?.split(' ')[0] || 'Learner'}!
                    </p>
                    <p className="font-bold text-base mb-3">Your learning dashboard is ready — here&apos;s how to start</p>
                    <div className="space-y-2 mb-4">
                      {[
                        { icon: '❓', label: 'Type any question or topic below — Akili explains it step by step' },
                        { icon: '📸', label: 'Scan or upload your textbook page to get instant notes' },
                        { icon: '✅', label: 'Take a quick quiz to test yourself and track your progress' },
                      ].map(({ icon, label }) => (
                        <div key={label} className="flex items-start gap-2.5 text-sm font-medium text-white/90">
                          <span className="text-base shrink-0 mt-0.5">{icon}</span>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setMode('SCAN_EXPLAIN')}
                        className="rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-2.5 text-left font-black text-sm transition-colors"
                      >
                        Ask a Question
                        <span className="block text-[10px] font-bold text-emerald-500 mt-0.5">Type or scan work</span>
                      </button>
                      <button
                        onClick={() => handleSidebarTabChange('RESOURCES')}
                        className="rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-2.5 text-left font-black text-sm transition-colors"
                      >
                        Browse Library
                        <span className="block text-[10px] font-bold text-emerald-100 mt-0.5">Notes &amp; past papers</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* START HERE — Onboarding card for brand-new users (zero history, not registered) */}
            {!isRegistered && !hasHistory && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-xl">🚀</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Welcome to Somo Smart!</p>
                    <p className="font-bold text-base mb-3">Start with these 3 steps — no signup needed</p>
                    <div className="space-y-2">
                      {[
                        { step: '1', label: 'Type a question below or scan your textbook', icon: '❓' },
                        { step: '2', label: 'Get a step-by-step explanation instantly', icon: '⚡' },
                        { step: '3', label: 'Test yourself with a quick quiz on the topic', icon: '✅' },
                      ].map(({ step, label, icon }) => (
                        <div key={step} className="flex items-center gap-2.5 text-sm font-medium text-white/90">
                          <span className="text-base">{icon}</span>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FREE USAGE METER — visible for all non-pro, non-registered users */}
            {!isRegistered && !hasHistory && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">Free trial: solve one school problem now</p>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">Stuck on homework, revision, or past papers?</h2>
                    <p className="text-sm font-semibold text-indigo-100 leading-relaxed max-w-2xl">
                      Ask Akili for hints, a worked method, and a quick practice check. No signup needed to start.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:w-56">
                    <button
                      onClick={() => setMode('SCAN_EXPLAIN')}
                      className="rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-3 text-left font-black text-sm transition-colors"
                    >
                      Ask a Question
                      <span className="block text-[10px] font-bold text-indigo-500 mt-0.5">Type or scan work</span>
                    </button>
                    <button
                      onClick={() => handleSidebarTabChange('RESOURCES')}
                      className="rounded-2xl bg-white/12 hover:bg-white/20 border border-white/15 px-4 py-3 text-left font-black text-sm transition-colors"
                    >
                      Open Library
                      <span className="block text-[10px] font-bold text-indigo-100 mt-0.5">Notes and past papers</span>
                    </button>
                    <button
                      onClick={() => handleSidebarTabChange('SUBJECTS')}
                      className="rounded-2xl bg-white/12 hover:bg-white/20 border border-white/15 px-4 py-3 text-left font-black text-sm transition-colors"
                    >
                      Exam Prep
                      <span className="block text-[10px] font-bold text-indigo-100 mt-0.5">Exam-style drills</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {!isPro && !isRegistered && freeUsesLeft === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mb-6 rounded-2xl border-2 p-4 ${
                  freeUsesLeft === 0
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                    : freeUsesLeft === 1
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-2">
                      {[1, 2, 3].map((slot) => (
                        <div
                          key={slot}
                          className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                            slot <= usageCount
                              ? freeUsesLeft === 0
                                ? 'bg-red-500'
                                : 'bg-amber-400'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`hidden text-xs font-black uppercase tracking-[0.14em] ${
                      freeUsesLeft === 0
                        ? 'text-red-700 dark:text-red-400'
                        : freeUsesLeft === 1
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {freeUsesLeft === 0
                        ? 'Free limit reached — upgrade to keep going'
                        : `${usageCount} of 3 free answers used${freeUsesLeft === 1 ? ' — 1 left!' : ''}`}
                    </p>
                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${
                      freeUsesLeft === 0
                        ? 'text-red-700 dark:text-red-400'
                        : freeUsesLeft === 1
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {freeUsesLeft === 0
                        ? 'Free trial complete'
                        : `${freeUsesLeft} guided answer${freeUsesLeft === 1 ? '' : 's'} left today`}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                      {freeUsesLeft === 0
                        ? 'Create or log into a learner profile, then choose a plan to keep progress, quizzes, and notes together.'
                        : 'Use the free answers to test Akili. Paid plans keep guided help, quizzes, notes, and parent progress proof together.'}
                    </p>
                  </div>
                  <button
                    onClick={handlePricingNavigation}
                    className={`hidden shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                      freeUsesLeft === 0
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {freeUsesLeft === 0 ? 'Upgrade Now' : 'From KES 20/day →'}
                  </button>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      onClick={handlePricingNavigation}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                        freeUsesLeft === 0
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {freeUsesLeft === 0 ? 'Continue With Plan' : 'Plans From KES 20 · M-PESA'}
                    </button>
                    {freeUsesLeft === 0 && (
                      <button
                        onClick={() => setShowLogin(true)}
                        className="px-3 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
                      >
                        Log In
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mb-8">
              <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-indigo-100/80 bg-white/90 p-4 shadow-sm shadow-indigo-50 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Credit Wallet</p>
                    <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {!isRegistered
                        ? 'Log in to view credits'
                        : learningCredits > 0
                          ? `${learningCredits} credits available`
                          : 'No credits available'}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        if (!isRegistered) {
                          setShowLogin(true);
                          return;
                        }
                        setLoading(true);
                        setLoadingText('Checking credit payments...');
                        const restored = await restoreMissingCreditWallet();
                        setLoading(false);
                        if (!restored) {
                          setError({
                            title: 'No Credit Payment Found',
                            message: 'We could not find a completed credit-pack payment for this learner yet. If you just paid, wait a moment and try again.'
                          });
                        }
                      }}
                      className="self-start sm:self-auto rounded-xl bg-white dark:bg-slate-950 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                    >
                      {isRegistered ? 'Restore Credits' : 'Log In'}
                    </button>
                    <button
                      onClick={() => {
                        trackFunnelEvent('credit_pack_selected', {
                          source: 'learner_plan_balance',
                          credits: LEARNING_CREDIT_PACKS[0].credits,
                          amount_kes: LEARNING_CREDIT_PACKS[0].price
                        });
                        setSelectedPlan(LEARNING_CREDIT_PACKS[0]);
                        setMode('PAYMENT' as any);
                      }}
                      className="self-start sm:self-auto rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 transition-colors"
                    >
                      Buy Credits
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${learningCredits <= 0 ? 'bg-slate-400' : learningCredits < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${creditMeterPct}%` }}
                  />
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {isRegistered
                    ? 'Credits are used for metered actions like grounded answers, marking, deep document analysis, and voice.'
                    : 'Credits are tied to your Soma student account. Log in with your Student ID after payment to see and use them.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Today&apos;s Plan Balance</p>
                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {isPro ? `${subscriptionPlan.toLowerCase()} plan controls` : 'Free trial controls'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    trackFunnelEvent('credit_pack_selected', {
                      source: 'learner_plan_balance',
                      credits: LEARNING_CREDIT_PACKS[0].credits,
                      amount_kes: LEARNING_CREDIT_PACKS[0].price
                    });
                    setSelectedPlan(LEARNING_CREDIT_PACKS[0]);
                    setMode('PAYMENT' as any);
                  }}
                  className="self-start sm:self-auto rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 transition-colors"
                >
                  Buy Credits
                </button>
              </div>
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-4 py-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-500">Credit Wallet</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">Used only after your daily plan balance runs out.</p>
                </div>
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{learningCredits}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {planMeters.map((meter) => (
                  <div key={meter.feature} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-sm shrink-0">
                          {meter.icon}
                        </div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{meter.label}</p>
                      </div>
                      <p className={`text-[10px] font-black ${meter.remaining <= 0 ? 'text-rose-500' : meter.pct >= 75 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {formatUsageRemaining(meter.remaining, meter.unit)}
                      </p>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${meter.remaining <= 0 ? 'bg-rose-500' : meter.pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${meter.pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-slate-400">
                      {meter.unit === 'characters'
                        ? `${meter.used.toLocaleString()} / ${meter.limit.toLocaleString()} chars today`
                        : `${meter.used} / ${meter.limit} uses today`}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Limits reset daily and keep Soma affordable while protecting high-value tools like marking and voice lessons.
              </p>
            </div>


            {/* HEADER METRICS */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {cloudMemoryRow?.total_sessions > 1 || history.length > 0
                      ? `${getGreetingWord()}, ${profile?.name?.split(' ')[0] || 'Learner'}! 👋`
                      : `Hey ${profile?.name?.split(' ')[0] || 'there'}! 👋`}
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {cloudMemoryRow?.last_topic || history[0]?.topic ? (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Last studied: <span className="font-bold text-indigo-600 dark:text-indigo-400">{cloudMemoryRow?.last_topic || history[0]?.topic}</span>
                      {streak > 1 && <span className="ml-2">· 🔥 {streak}-day streak!</span>}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Let's keep learning and growing today.</p>
                  )}
                  <button
                    onClick={() => { /* open level picker in sidebar */ setSidebarOpen(true); }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all hover:opacity-80 ${
                      educationLevel === 'JUNIOR' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      educationLevel === 'CAMPUS' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    <span>{educationLevel === 'JUNIOR' ? '📚' : educationLevel === 'CAMPUS' ? '🎓' : '🏫'}</span>
                    {educationLevel === 'JUNIOR' ? 'Junior' : educationLevel === 'CAMPUS' ? 'Campus' : 'Senior'}
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {showStreakModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0, y: -20 }}
                      className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border-4 border-orange-100 dark:border-orange-900 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-400/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
                      
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10 border-4 border-white dark:border-slate-800">
                        <motion.span 
                          animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5] }} 
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-5xl"
                        >
                          🔥
                        </motion.span>
                      </div>
                      <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2 relative z-10 tracking-tight">{streak} Day Streak!</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 relative z-10 leading-relaxed">You're on fire! You completed a lesson today. Keep coming back daily to build your streak.</p>
                      
                      <button
                        onClick={() => setShowStreakModal(false)}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/30 relative z-10 transform hover:scale-[1.02] active:scale-95"
                      >
                        Keep Going!
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
                {/* Day Streak */}
                <div className="flex-1 md:flex-none flex items-center gap-2 sm:gap-3 bg-white dark:bg-slate-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm border-2 border-slate-300 dark:border-slate-800">
                  <div className="text-orange-500 text-lg sm:text-xl shrink-0">🔥</div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white leading-none">{streak}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Streak</div>
                  </div>
                </div>
                {/* Points */}
                <div className="flex-1 md:flex-none flex items-center gap-2 sm:gap-3 bg-white dark:bg-slate-900 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm border-2 border-slate-300 dark:border-slate-800">
                  <div className="text-amber-500 shrink-0"><Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500" /></div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white leading-none">{totalXP}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Points</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden">
              {[
                {
                  icon: <Lightbulb className="w-4 h-4" />,
                  label: 'For homework',
                  title: 'Get hints before answers',
                  body: 'Akili makes the learner try a step first, then explains the method.'
                },
                {
                  icon: <ListChecks className="w-4 h-4" />,
                  label: 'For exams',
                  title: 'Practice and repair mistakes',
                  body: quizAttempts > 0
                    ? `${quizAttempts} quiz attempt${quizAttempts === 1 ? '' : 's'} recorded${averageQuizScore !== null ? `, average ${averageQuizScore}%` : ''}.`
                    : 'Turn any topic into a short quiz and fix weak areas immediately.'
                },
                {
                  icon: <Users className="w-4 h-4" />,
                  label: 'For parents',
                  title: 'Visible learning proof',
                  body: hasHistory
                    ? `${history.length} learning action${history.length === 1 ? '' : 's'} saved for review.`
                    : 'Parents can see progress, not just trust that screen time was useful.'
                }
              ].map((item) => (
                <div key={item.label} className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{item.title}</h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
              <div className="lg:col-span-2 space-y-6">
                  {/* RETURNING GUEST CONTINUE CARD */}
                  {!isRegistered && hasHistory && recentTopics.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-indigo-200 dark:border-indigo-800 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">Continue Where You Left Off</p>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{recentTopics[0]}</h3>
                      <p className="text-xs font-semibold text-slate-500 mb-4">Jump back into your last learning thread and keep momentum.</p>
                      <button
                        onClick={async () => {
                          const restored = await restoreMemberSessionForResume();
                          if (restored) {
                            // Immediate one-shot bypass for the resumed action in the same tick.
                            resumeBypassRef.current = true;
                          }
                          const resumePrompt = `Continue explaining: ${recentTopics[0]}`;
                          setPromptText(resumePrompt);
                          handlePromptSubmit(resumePrompt);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider"
                      >
                        Resume Learning
                      </button>
                    </div>
                  )}

                  {/* FIRST SESSION WELCOME — only for registered users with zero history */}
                  {isRegistered && !hasHistory && !hasProgress && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-300/30 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Welcome, {profile?.name?.split(' ')[0] || 'Learner'}! 🎉</p>
                        <h2 className="text-xl font-black tracking-tight mb-1">Your first question is one tap away.</h2>
                        <p className="text-sm font-medium text-indigo-100 mb-5 leading-relaxed">
                          Type anything — a topic, a past paper question, even a photo of your textbook. Akili will explain it step by step.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={() => setMode('SCAN_EXPLAIN')}
                            className="bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl p-3 text-left transition-all group"
                          >
                            <span className="text-xl block mb-1">📸</span>
                            <span className="text-xs font-black block">Scan a Question</span>
                            <span className="text-[10px] text-indigo-200 font-medium">Photo from textbook</span>
                          </button>
                          <button
                            onClick={() => setMode('SCAN_EXPLAIN')}
                            className="bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl p-3 text-left transition-all group"
                          >
                            <span className="text-xl block mb-1">✍️</span>
                            <span className="text-xs font-black block">Type a Question</span>
                            <span className="text-[10px] text-indigo-200 font-medium">Any subject, any level</span>
                          </button>
                          <button
                            onClick={() => handleSidebarTabChange('SUBJECTS')}
                            className="bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl p-3 text-left transition-all group"
                          >
                            <span className="text-xl block mb-1">📚</span>
                            <span className="text-xs font-black block">Browse by Subject</span>
                            <span className="text-[10px] text-indigo-200 font-medium">Revision & past papers</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Start Learning</p>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">What do you need help with?</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Basic help starts fast. Grounded library answers, marking, deep exam analysis, and voice use your plan or credits.</p>
                      </div>
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="self-start sm:self-auto rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-600 dark:hover:text-indigo-300"
                      >
                        More Tools
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        {
                          title: 'Ask Akili',
                          body: 'Basic help',
                          icon: <Sparkles className="w-5 h-5" />,
                          className: 'bg-blue-600 text-white border-blue-600',
                          action: () => setMode('SCAN_EXPLAIN')
                        },
                        {
                          title: 'Scan',
                          body: 'Photo question',
                          icon: <ScanLine className="w-5 h-5" />,
                          className: 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700',
                          action: () => setMode('SCAN')
                        },
                        {
                          title: 'Library',
                          body: isPro ? 'Grounded help' : 'Notes & papers',
                          icon: <Library className="w-5 h-5" />,
                          className: 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700',
                          action: () => handleSidebarTabChange('RESOURCES')
                        },
                        {
                          title: 'Exam Prep',
                          body: isPro ? 'Exam Coach' : 'Practice drills',
                          icon: <ClipboardList className="w-5 h-5" />,
                          className: 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700',
                          action: () => handleSidebarTabChange('SUBJECTS')
                        },
                        {
                          title: 'Listen',
                          body: learningCredits > 0 ? `${learningCredits} credits` : 'Audio lesson',
                          icon: <Headphones className="w-5 h-5" />,
                          className: 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700',
                          action: () => {
                            setTutorInitialActiveMode('TALKBACK');
                            setTutorInitialTutorMode('conversation');
                            handleSidebarTabChange('TALKBACK', true);
                          }
                        },
                        {
                          title: 'Speak & Pronounce',
                          body: 'Learn to Speak',
                          icon: <Mic className="w-5 h-5 text-indigo-500" />,
                          className: 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700',
                          action: () => {
                            setTutorInitialActiveMode('LANGUAGE_TUTOR');
                            setTutorInitialTutorMode('pronunciation');
                            handleSidebarTabChange('TALKBACK', true);
                          }
                        },
                        {
                          title: dueFlashcardsCountForNext > 0 ? 'Review' : 'Progress',
                          body: dueFlashcardsCountForNext > 0 ? `${dueFlashcardsCountForNext} due` : `${totalXP} points`,
                          icon: dueFlashcardsCountForNext > 0 ? <Brain className="w-5 h-5" /> : <Trophy className="w-5 h-5" />,
                          className: 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700',
                          action: () => {
                            if (dueFlashcardsCountForNext > 0) {
                              setPracticeMode('due');
                              setCurrentCardIndex(0);
                              setIsFlipped(false);
                              setReviewComplete(false);
                              setMode('FLASHCARDS');
                            } else {
                              setShowMasteryDashboard(true);
                            }
                          }
                        }
                      ].map((tool) => (
                        <button
                          key={tool.title}
                          onClick={tool.action}
                          className={`min-h-[92px] rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${tool.className}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                              {tool.icon}
                            </div>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                          </div>
                          <p className="mt-3 text-sm font-black leading-tight">{tool.title}</p>
                          <p className="mt-0.5 text-[11px] font-bold opacity-70">{tool.body}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white">Advanced Mode</p>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Soma-grounded answers, deep document analysis, smart marking, and voice practice are premium/credit-powered so basic learning stays affordable.</p>
                      </div>
                      <button
                        onClick={handlePricingNavigation}
                        className="self-start sm:self-auto rounded-xl bg-indigo-600 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white hover:bg-indigo-700"
                      >
                        Plans & Credits
                      </button>
                    </div>
                  </div>

                  {/* START HERE: PRIMARY FIRST-SESSION PATH — for returning users or registered with history */}
                  {(!isRegistered || hasHistory || hasProgress) && (
                  <div className="hidden">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 mb-2">Start Here</p>
                    <h2 className="text-2xl font-black tracking-tight mb-2">
                      {learnerCtaVariant === 'A' ? 'Open one topic and finish with a score' : 'Pick one topic and test yourself'}
                    </h2>
                    <p className="text-sm font-medium text-indigo-100 mb-5">
                      {learnerCtaVariant === 'A'
                        ? 'Open notes or past papers, get help, then take a quick quiz.'
                        : 'Choose one note or paper, get help, then finish with a short quiz.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          trackFunnelEvent('library_intent_selected', { intent: 'start_here_library', variant: learnerCtaVariant });
                          handleSidebarTabChange('RESOURCES');
                        }}
                        className="flex-1 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl py-3.5 px-4 font-black text-sm transition-colors shadow-sm"
                      >
                        {learnerCtaVariant === 'A' ? '1. Open Library' : '1. Pick A Topic'}
                      </button>
                      <button
                        onClick={() => {
                          trackFunnelEvent('library_intent_selected', { intent: 'start_here_ask_akili', variant: learnerCtaVariant });
                          setMode('SCAN_EXPLAIN');
                        }}
                        className="flex-1 bg-indigo-500/40 hover:bg-indigo-500/60 border border-indigo-300/40 rounded-2xl py-3.5 px-4 font-black text-sm transition-colors"
                      >
                        {learnerCtaVariant === 'A' ? '2. Ask Akili' : '2. Get Instant Help'}
                      </button>
                    </div>
                  </div>
                  )}

                  {/* ASK AKILI QUICK ENTRY */}
                  <div className="hidden">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="max-w-xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100 mb-2">Ask Akili</p>
                        <h3 className="text-xl font-black tracking-tight leading-tight">Stuck on a question? Start here.</h3>
                        <p className="text-sm font-medium text-sky-100/90 mt-2 leading-relaxed">
                          Get a hint, a worked method, or a quick quiz. Type, scan, or talk to Akili in one tap.
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <button
                          onClick={() => setMode('SCAN_EXPLAIN')}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 px-4 py-3 text-sm font-black shadow-sm transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          Open Ask Akili
                        </button>
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                          <button
                            onClick={() => setMode('SCAN_EXPLAIN')}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-black text-white hover:bg-white/20 transition-colors"
                          >
                            Scan
                          </button>
                          <button
                            onClick={() => setMode('SCAN_EXPLAIN')}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-black text-white hover:bg-white/20 transition-colors"
                          >
                            Type
                          </button>
                          <button
                            onClick={() => handleSidebarTabChange('TALKBACK')}
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-black text-white hover:bg-white/20 transition-colors"
                          >
                            Talk
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SOLVE IT NOW: immediate student pain points */}
                  <div className="hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Solve It Now</p>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">Choose one thing to do now</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setMode('SCAN_EXPLAIN')}
                        className="text-left rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">I am stuck on one question</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Get hints, steps, then a quick check question.</p>
                      </button>
                      <button
                        onClick={() => handleSidebarTabChange('SUBJECTS')}
                        className="text-left rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Exam is near, I need practice</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Go to Exam Prep and start drills.</p>
                      </button>
                      <button
                        onClick={() => handleSidebarTabChange('RESOURCES')}
                        className="text-left rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">I need notes or past papers now</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Open the library with all materials.</p>
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSidebarTabChange('TALKBACK')}
                        className="rounded-full border border-pink-200 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/30 px-4 py-2 text-xs font-black text-pink-700 dark:text-pink-300"
                      >
                        Listen to a lesson
                      </button>
                      <button
                        onClick={() => setMode('SCAN_EXPLAIN')}
                        className="rounded-full border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 text-xs font-black text-indigo-700 dark:text-indigo-300"
                      >
                        Open Ask Akili
                      </button>
                    </div>
                  </div>

                  {/* AI INPUT BUBBLE */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-slate-300 dark:border-slate-800 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex flex-col sm:flex-row items-start gap-4 relative z-10">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-md">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 w-full">
                        <div className="mb-3">
                          <h2 className="text-base font-bold text-slate-800 dark:text-white">Ask Akili</h2>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                            Type, scan, or upload. Akili helps step by step.
                          </p>
                        </div>
                        <div className="mb-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-emerald-800 dark:text-emerald-200">Soma Library grounding</p>
                            <p className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-300/80">
                              Akili will try to use indexed notes and past papers before answering.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGroundedAnswerMode(prev => !prev)}
                            className={`relative h-8 w-16 rounded-full p-1 transition-colors ${groundedAnswerMode ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                            aria-pressed={groundedAnswerMode}
                            aria-label="Toggle Soma Library grounding"
                          >
                            <span className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${groundedAnswerMode ? 'translate-x-8' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border-2 border-slate-300 dark:border-slate-700 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 dark:focus-within:ring-blue-900/20 transition-all">
                          <textarea
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePromptSubmit(); }
                            }}
                            placeholder={educationLevel === 'JUNIOR' ? "Hey Akili, help me with..." : educationLevel === 'CAMPUS' ? "Ask Akili to research..." : "Ask Akili about your studies..."}
                            rows={2}
                            className="w-full bg-transparent border-0 focus:ring-0 text-sm font-medium py-2 px-2 resize-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {learningModePrompts.slice(0, 4).map((modePrompt) => (
                              <button
                                key={modePrompt.label}
                                type="button"
                                onClick={() => {
                                  const currentQuestion = promptText.trim();
                                  const nextPromptValue = modePrompt.buildPrompt(currentQuestion);
                                  setPromptText(nextPromptValue);
                                  if (currentQuestion) {
                                    handlePromptSubmit(nextPromptValue);
                                  }
                                }}
                                className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                              >
                                <span className="block text-[11px] font-black text-slate-800 dark:text-white">{modePrompt.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                             <div className="flex gap-1">
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors" title="Upload Image"><ImageIcon className="w-4 h-4" /></button>
                                <button onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-xl transition-colors ${isRecording ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`} title="Voice Note"><Mic className="w-4 h-4" /></button>
                                <button onClick={startCamera} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-colors" title="Scan Document"><Camera className="w-4 h-4" /></button>
                             </div>
                             <button onClick={handlePromptSubmit} disabled={(!promptText.trim() && !pendingMedia) || loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm">
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Get Help'}
                              </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SHORTCUTS — secondary actions */}
                  <div className="hidden grid-cols-3 gap-2 sm:gap-4">
                     {(
                       educationLevel === 'JUNIOR' ? [
                         { icon: <Library className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Library 📚', color: 'bg-blue-600', onClick: () => handleSidebarTabChange('RESOURCES') },
                         { icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Exam Prep', color: 'bg-orange-500', onClick: () => handleSidebarTabChange('SUBJECTS') },
                         { icon: <Mic className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Talk & Play', color: 'bg-pink-500', onClick: () => handleSidebarTabChange('TALKBACK') }
                       ] : educationLevel === 'CAMPUS' ? [
                         { icon: <Library className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Research', color: 'bg-purple-600', onClick: () => handleSidebarTabChange('RESOURCES') },
                         { icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Courses', color: 'bg-indigo-500', onClick: () => handleSidebarTabChange('SUBJECTS') },
                         { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Study Group', color: 'bg-emerald-500', onClick: () => handleSidebarTabChange('EXAM_ROOMS') }
                       ] : [
                         { icon: <Library className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Library', color: 'bg-blue-600', onClick: () => handleSidebarTabChange('RESOURCES') },
                         { icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Exam Hall', color: 'bg-orange-500', onClick: () => handleSidebarTabChange('SUBJECTS') },
                         { icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'My Progress', color: 'bg-indigo-600', onClick: () => setShowMasteryDashboard(true) }
                       ]
                     ).map((item, i) => (
                        <button key={i} onClick={item.onClick} className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                           <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.color} rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                              {item.icon}
                           </div>
                           <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 line-clamp-1">{item.label}</span>
                        </button>
                     ))}
                  </div>

                  {/* CONTINUE LEARNING */}
                  {hasHistory && recentTopics.length > 0 && (
                     <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-slate-300 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="font-bold text-slate-800 dark:text-white">Continue Learning</h3>
                           <button onClick={() => setMode('HISTORY' as any)} className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {recentTopics.map((topic, i) => (
                              <div key={i} onClick={() => { setPromptText(`Continue explaining: ${topic}`); handlePromptSubmit(`Continue explaining: ${topic}`); }} className="flex flex-col p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer transition-colors group">
                                 <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                    <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                 </div>
                                 <span className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{topic}</span>
                                 <div className="mt-auto flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Review Topic</span>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

              </div>

              <div className="space-y-6">
                  {/* PARENT VALUE CARD */}
                  <div className="hidden">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300 mb-1">Parent Confidence</p>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">KES 20 should buy learning, not scrolling.</h3>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-3 mb-5">
                      {[
                        'Try-first answers reduce copy and paste homework.',
                        'Notes, past papers, quizzes, and audio learning stay in one place.',
                        'Progress history gives parents a simple proof of study.'
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => setShowMasteryDashboard(true)}
                        className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-colors"
                      >
                        See Progress
                      </button>
                      <button
                        onClick={() => navigate('/parent')}
                        className="py-3 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider transition-colors"
                      >
                        Parent Portal
                      </button>
                      <button
                        onClick={handlePricingNavigation}
                        className="py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider transition-colors"
                      >
                        View Plans
                      </button>
                    </div>
                  </div>

                  {/* RECOMMENDED NEXT STEP */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-indigo-200 dark:border-indigo-900/60 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300 mb-1">Today's 10-minute plan</p>
                          <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{nextStep.title}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                      </div>
                      <span className="inline-flex mb-3 text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-3 py-1 rounded-full">
                        {nextStep.label}
                      </span>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{nextStep.body}</p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { step: '1', label: 'Repair', body: 'Fix the weakest point' },
                          { step: '2', label: 'Test', body: 'Score a short quiz' },
                          { step: '3', label: 'Proof', body: 'Share progress' }
                        ].map((item) => (
                          <div key={item.step} className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/70 p-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black mb-2">
                              {item.step}
                            </div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">{item.label}</p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{item.body}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={nextStep.action}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                      >
                        {nextStep.cta}
                      </button>
                    </div>
                  </div>

                  {/* MY CLASSES */}
                  {(isRegistered || studentClasses.length > 0) && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-slate-300 dark:border-slate-800 p-6">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white">My Classes</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Teacher updates</p>
                        </div>
                        {isLoadingStudentClasses && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                      </div>

                      {studentClasses.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-5 text-center">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No class invites joined yet.</p>
                          <p className="text-xs font-medium text-slate-400 mt-1">Open a teacher's WhatsApp invite link to join.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {studentClasses.slice(0, 3).map((item) => {
                            const latestPost = item.latestPosts[0];
                            return (
                              <div key={item.class.id} className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.class.name}</h4>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{item.class.subject}</p>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                    {item.class.profiles?.name || 'Teacher'}
                                  </span>
                                </div>

                                {latestPost ? (
                                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {latestPost.post_type === 'ASSIGNMENT' ? 'Assignment' : 'Announcement'}
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap">{latestPost.content}</p>
                                  </div>
                                ) : (
                                  <p className="text-xs font-bold text-slate-400">No teacher posts yet.</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTIVE RECALL FLASHCARDS NUDGE */}
                  {(() => {
                    const totalFlashcards = spacedRepetitionItems?.filter(i => i.question && i.answer).length || 0;
                    const dueFlashcardsCount = dueForReview?.filter(i => i.question && i.answer).length || 0;

                    return (
                      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl shadow-xl border border-indigo-500/25 p-6 relative overflow-hidden group">
                        {/* Glowing radial backdrops */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700"></div>
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-700"></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                              <Brain className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm tracking-wide">Active Recall</h3>
                              <p className="text-[10px] font-medium text-indigo-300/70">Spaced Repetition (SM-2)</p>
                            </div>
                          </div>
                          {dueFlashcardsCount > 0 ? (
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse">
                              {dueFlashcardsCount} Due
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/35 px-2.5 py-1 rounded-full uppercase tracking-widest">
                              Clear ✨
                            </span>
                          )}
                        </div>

                        {dueFlashcardsCount > 0 ? (
                          <>
                            <p className="text-xs font-semibold text-slate-300 mb-5 relative z-10 leading-relaxed">
                              You have <span className="text-indigo-400 font-bold">{dueFlashcardsCount} cards</span> due for review. Keep your daily streak going!
                            </p>
                            <button
                              onClick={() => {
                                setPracticeMode('due');
                                setCurrentCardIndex(0);
                                setIsFlipped(false);
                                setReviewComplete(false);
                                setMode('FLASHCARDS');
                              }}
                              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 duration-200 cursor-pointer text-center relative z-10"
                            >
                              Review Due Cards
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-slate-300 mb-5 relative z-10 leading-relaxed">
                              {totalFlashcards > 0 
                                ? "Excellent! Your daily review queue is fully clear. Review past cards to strengthen memory."
                                : "Supercharge your long-term memory! Seed our CBC/KCSE high-yield cards to get started."
                              }
                            </p>
                            <div className="flex flex-col gap-2 relative z-10">
                              {totalFlashcards > 0 && (
                                <button
                                  onClick={() => {
                                    setPracticeMode('all');
                                    setCurrentCardIndex(0);
                                    setIsFlipped(false);
                                    setReviewComplete(false);
                                    setMode('FLASHCARDS');
                                  }}
                                  className="w-full py-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all active:scale-95 duration-200 cursor-pointer text-center"
                                >
                                  Review All Decks
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  // Seed samples
                                  const samples = [
                                    {
                                      topic: "Photosynthesis",
                                      subject: "Biology",
                                      grade: "Form 1",
                                      nextReviewDate: new Date().toISOString(),
                                      intervalDays: 1,
                                      easeFactor: 2.5,
                                      lastScore: 0,
                                      reviewCount: 0,
                                      question: "What are the raw materials and products of photosynthesis in plants?",
                                      answer: "Raw Materials:\n- Carbon dioxide (absorbed through stomata)\n- Water (absorbed through roots)\n\nProducts:\n- Glucose (chemical energy stored as starch)\n- Oxygen gas (released as a byproduct through stomata)\n\nReaction Equation:\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂"
                                    },
                                    {
                                      topic: "Quadratic Equations",
                                      subject: "Mathematics",
                                      grade: "Form 2",
                                      nextReviewDate: new Date().toISOString(),
                                      intervalDays: 1,
                                      easeFactor: 2.5,
                                      lastScore: 0,
                                      reviewCount: 0,
                                      question: "State the quadratic formula and explain what the discriminant determines about the roots.",
                                      answer: "Quadratic Formula:\nx = [-b ± √(b² - 4ac)] / (2a)\n\nDiscriminant (D = b² - 4ac):\n1. D > 0: Two distinct real roots.\n2. D = 0: One repeated real root (equal roots).\n3. D < 0: Two complex/imaginary roots."
                                    },
                                    {
                                      topic: "Devolution in Kenya",
                                      subject: "History & Government",
                                      grade: "Form 4",
                                      nextReviewDate: new Date().toISOString(),
                                      intervalDays: 1,
                                      easeFactor: 2.5,
                                      lastScore: 0,
                                      reviewCount: 0,
                                      question: "What are the primary objectives of devolving governance to the 47 counties in Kenya?",
                                      answer: "Primary Objectives:\n1. Promote democratic and accountable exercise of power.\n2. Foster national unity by recognizing diversity.\n3. Give powers of self-governance to the people and enhance their participation.\n4. Ensure equitable sharing of national and local resources across Kenya.\n5. Facilitate the decentralization of state organs and public services from the capital."
                                    }
                                  ];
                                  samples.forEach(item => addSpacedRepetitionItem(item));
                                  
                                  // Navigate directly
                                  setPracticeMode('due');
                                  setCurrentCardIndex(0);
                                  setIsFlipped(false);
                                  setReviewComplete(false);
                                  setMode('FLASHCARDS');
                                }}
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 duration-200 cursor-pointer text-center"
                              >
                                {totalFlashcards > 0 ? "Reset & Seed 3 Q&A Cards" : "Seed 3 Sample Q&A Cards"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* DAILY CHALLENGE */}
                  {dailyChallenge && (
                     <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-slate-300 dark:border-slate-800 p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                 <Trophy className="w-4 h-4 text-orange-500" />
                              </div>
                              <h3 className="font-bold text-slate-800 dark:text-white">Daily Goal</h3>
                           </div>
                           <span className="text-[10px] font-black text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md uppercase tracking-widest">Active</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-5 relative z-10">{dailyChallenge.quiz}</p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-5 overflow-hidden">
                           <div className="bg-orange-500 h-1.5 rounded-full w-1/4"></div>
                        </div>
                        <button onClick={() => { setPromptText(`Generate a ${dailyChallenge.quiz}`); handlePromptSubmit(`Generate a ${dailyChallenge.quiz}`); }} className="w-full py-3 bg-white border-2 border-slate-300 dark:border-slate-700 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all relative z-10">
                           Start Challenge
                        </button>
                     </div>
                  )}

                  {/* REAL PROGRESS PROOF */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-slate-300 dark:border-slate-800 p-6">
                     <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white">Progress Proof</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">What a parent can verify</p>
                        </div>
                        <button onClick={() => setShowMasteryDashboard(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700">Open</button>
                     </div>
                     <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: 'Study actions', value: history.length, icon: <BookOpen className="w-4 h-4" /> },
                          { label: 'Quiz attempts', value: quizAttempts, icon: <ListChecks className="w-4 h-4" /> },
                          { label: 'Average score', value: averageQuizScore !== null ? `${averageQuizScore}%` : '--', icon: <Trophy className="w-4 h-4" /> },
                          { label: 'Streak days', value: streak, icon: <Star className="w-4 h-4" /> }
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                              <span className="text-indigo-600 dark:text-indigo-300">{item.icon}</span>
                            </div>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{item.value}</p>
                          </div>
                        ))}
                     </div>
                     <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                       This is the story parents should see: what the learner studied, how they tested, and where they need help next.
                     </p>
                  </div>

                  {/* LEGACY STATIC BADGES HIDDEN */}
                  <div className="hidden bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-slate-300 dark:border-slate-800 p-6">
                     <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-800 dark:text-white">Recent Badges</h3>
                        <button className="text-xs font-bold text-slate-400 hover:text-slate-600">View All</button>
                     </div>
                     <div className="space-y-4">
                        {[
                           { icon: '🚀', title: 'Quick Learner', desc: 'Completed 5 quizzes', color: 'bg-blue-50 dark:bg-blue-900/20' },
                           { icon: '🧠', title: 'Math Whiz', desc: 'Aced Algebra test', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
                           { icon: '⭐', title: 'Consistent Star', desc: '7 day streak', color: 'bg-amber-50 dark:bg-amber-900/20' }
                        ].map((badge, i) => (
                           <div key={i} className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl ${badge.color} flex items-center justify-center text-xl shadow-inner shrink-0`}>
                                 {badge.icon}
                              </div>
                              <div>
                                 <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{badge.title}</div>
                                 <div className="text-[11px] font-medium text-slate-500 mt-0.5">{badge.desc}</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
              </div>

            </div>
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
                  <div key={item.id} onClick={() => restoreActivity(item)} className="p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-300 dark:border-slate-800 shadow-sm text-lg">
                      {item.type === 'QUIZ' ? <FileText className="w-5 h-5 text-indigo-500" /> : <Lightbulb className="w-5 h-5 text-amber-500" />}
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
        <React.Suspense fallback={<DeferredViewLoader />}>
          <LearnerAnalytics
            history={history}
            totalXP={totalXP}
            levelInfo={levelInfo}
            subjectPerformance={subjectPerformance}
            masteryGraph={masteryGraph}
            weakTopics={weakTopics}
          />
        </React.Suspense>
      );
    }

    if (mode === 'PROFILE') {
      // PRO GUARD: If no student profile is active, redirect to menu or show login prompt
      if (!isRegistered) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center max-w-md mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full"
            >
              <div className="mb-8">
                <button
                  onClick={() => setShowLogin(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-100 dark:border-blue-800 mb-8"
                >
                  Already have an ID? Login here
                </button>

                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 dark:shadow-none rotate-3">
                  <UserCircle className="w-12 h-12 text-white" />
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Create Student Profile</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                  Join thousands of students and get personalized AI tutoring, progress tracking, and access to all study materials.
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={() => setShowRegistration(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl w-full px-8 py-5 transition-all shadow-xl shadow-blue-200 dark:shadow-none active:scale-95 text-lg flex items-center justify-center gap-3 group"
                >
                  Get Your Student ID
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="flex items-center gap-4 my-4">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                </div>

                <button
                  onClick={() => setMode('MENU')}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold py-2 transition-colors text-sm"
                >
                  Continue as Guest
                </button>
              </div>

              <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-900/30 text-left">
                <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-1 flex items-center gap-2">
                   <Sparkles className="w-4 h-4" /> Why create a profile?
                </h4>
                <ul className="text-xs font-medium text-amber-700/80 dark:text-amber-500/80 space-y-2 mt-3">
                  <li className="flex gap-2"><span>•</span> Save your learning history and streaks</li>
                  <li className="flex gap-2"><span>•</span> Unlock high daily AI study limits</li>
                  <li className="flex gap-2"><span>•</span> Get a personalized study buddy profile</li>
                </ul>
              </div>
            </motion.div>
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <UserCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Student Profile</h2>
                  <p className="text-sm font-medium text-slate-500">Manage your identity and school info</p>
                </div>
              </div>

              <Card className="p-8 space-y-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                      <input
                        id="studentName"
                        type="text"
                        defaultValue={studentProfile?.name || ''}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        onChange={() => {
                          const btn = document.getElementById('save-profile-btn');
                          if (btn) btn.style.display = 'block';
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Grade Level</label>
                      <div className="relative">
                        <select
                          id="studentGrade"
                          defaultValue={studentProfile?.grade || ''}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none"
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
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ArrowRight className="w-4 h-4 rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">My Student ID</label>
                      <div className="group relative">
                        <p className="text-xl font-black text-blue-600 font-mono tracking-widest bg-blue-50 border-2 border-blue-100 px-5 py-3.5 rounded-2xl flex items-center justify-between">
                          {studentCode || '---'}
                          <CheckCircle className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 mt-2 px-1">Share this with your parents to link accounts.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Verified Email</label>
                      <p className="text-sm font-bold text-slate-600 bg-slate-50/50 border-2 border-slate-100 px-5 py-3.5 rounded-2xl truncate">
                        {studentProfile?.email || 'No email set'}
                      </p>
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
                      <p className="text-[10px] text-slate-500">If you already paid, tap restore and we will refresh access.</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-indigo-600 hover:bg-indigo-100 font-bold text-xs"
                    onClick={async () => {
                      if (confirm("Check for missing payments? This will scan your transaction history and restore access if a valid payment is found.")) {
                        setLoading(true);
                        setLoadingText("Verifying Transactions...");
                        await verifySubscription();
                        setLoading(false);
                        alert("Verification complete. If a valid payment was found, your subscription has been restored.");
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Learning Plan</h2>
                  <p className="text-sm font-medium text-slate-500">Manage your subscription and features</p>
                </div>
              </div>

              <Card className="p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 transition-transform group-hover:scale-110"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 shadow-sm ${isPro ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                      <Star className={`w-8 h-8 ${isPro ? 'text-amber-600 fill-amber-600' : 'text-slate-300'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg font-black text-slate-900 tracking-tight">
                          {activePlanDetails?.name || subscriptionPlan || 'Somo Basic'}
                        </span>
                        {isPro && (
                          <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        {isPro && subscriptionExpiry && !isNaN(new Date(subscriptionExpiry).getTime())
                          ? <><Clock className="w-3.5 h-3.5" /> Valid until {new Date(subscriptionExpiry).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</>
                          : <><Sparkles className="w-3.5 h-3.5" /> Free access - 3 queries left today</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Amount</p>
                      <p className="text-xl font-black text-slate-900">
                        {isPro && activePlanDetails ? `${activePlanDetails.price} KES` : '0 KES'}
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedPlan(activePlanDetails || STUDENT_PLANS[1])}
                      className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                        isPro 
                        ? 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 shadow-slate-100' 
                        : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200'
                      }`}
                    >
                      {isPro ? 'Manage Plan' : 'Unlock Learning'}
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Parental Controls</h2>
                  <p className="text-sm font-medium text-slate-500">Secure access for your guardians</p>
                </div>
              </div>

              <Card className="p-8 space-y-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                
                <div className="relative z-10">
                  <label htmlFor="parentPhone" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Parent&apos;s Phone Number</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <input
                        id="parentPhone"
                        type="tel"
                        defaultValue={studentProfile?.parentPhone || ''}
                        placeholder="e.g. 0712345678"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-lg font-black text-slate-800 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all outline-none"
                        onChange={() => {
                          const btn = document.getElementById('save-profile-btn');
                          if (btn) btn.style.display = 'block';
                        }}
                      />
                    </div>
                    <div id="save-profile-btn" style={{ display: 'none' }} className="sm:w-48">
                      <Button
                        fullWidth
                        className="h-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-200 active:scale-95 transition-all"
                        onClick={async () => {
                          const nameInput = document.getElementById('studentName') as HTMLInputElement;
                          const gradeInput = document.getElementById('studentGrade') as HTMLSelectElement;
                          const phoneInput = document.getElementById('parentPhone') as HTMLInputElement;

                          setLoading(true);
                          setLoadingText("Updating profile...");
                          const { success, message } = await updateStudentProfile({
                            name: nameInput.value,
                            grade: gradeInput.value,
                            parentPhone: phoneInput.value
                          });
                          setLoading(false);

                          if (success) {
                            const btn = document.getElementById('save-profile-btn');
                            if (btn) btn.style.display = 'none';
                          } else {
                            alert(message || "Failed to update profile");
                          }
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                  <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="p-2 bg-white rounded-lg shadow-sm"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Providing this number allows your parent to log in to the <span className="text-purple-600 font-bold">Parent Dashboard</span> to see your progress reports and manage your subscription.
                    </p>
                  </div>
                </div>
              </Card>
            </section>

          </div>

          {/* Global Bottom Nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 pb-safe flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Home</span>
            </button>
            <button onClick={() => setMode('MARKETPLACE')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Materials</span>
            </button>
            <div className="relative -mt-10">
              <button onClick={() => setMode('SCAN')} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white transform hover:scale-110 active:scale-90 transition-all border-4 border-white">
                <ScanLine className="w-8 h-8" />
              </button>
            </div>
            <button onClick={() => setMode('LIBRARY')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Library className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Library</span>
            </button>
            <button onClick={() => isRegistered ? setMode('PROFILE') : setShowLogin(true)} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-indigo-600 scale-110">
              <UserCircle className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Me</span>
            </button>
          </div>
        </div >
      );
    }

    if (mode === 'SCAN' && loading) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-50 max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-white p-6 rounded-full shadow-xl">
              <Sparkles className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-8 mb-2 animate-pulse">{loadingText}</h2>
          <p className="text-slate-500 max-w-xs mx-auto text-lg">Akili is putting the pieces together...</p>
        </div>
      );
    }

    if (mode === 'STUDY' && currentDocument) {
      const subtopics = explanation?.subtopics || [];
      const totalPages = subtopics.length + 2; // Overview (0), Subtopics (1..N), Summary/References (N+1)
      const isSyllabus = currentDocument.category === 'SYLLABUS';
      const cleanSubject = currentDocument.subject || 'General';
      const cleanGrade = currentDocument.grade || 'N/A';
      const syllabus = getSyllabusMapping(cleanSubject, cleanGrade);

      const handlePageChange = (p: number) => {
        setReaderPage(Math.max(0, Math.min(totalPages - 1, p)));
        setSelectedText('');
        setSelectionCoords(null);
      };

      const handleOriginalPageChange = (p: number) => {
        setOriginalPageIndex(Math.max(0, Math.min(extractedOriginalPages.length - 1, p)));
        setSelectedText('');
        setSelectionCoords(null);
      };


      return (
        <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row max-w-[1440px] mx-auto shadow-2xl border-x border-slate-100 overflow-hidden relative">
          
          {/* Virtual Classroom Sidebar Navigation */}
          <div className="w-full md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-auto md:h-screen shrink-0 relative z-20">
            {/* Header Area */}
            <div className="p-6 pb-8 border-b border-white/10 bg-gradient-to-b from-indigo-900/50 to-slate-900">
              <button
                onClick={() => setMode('LIBRARY')}
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

              <button
                onClick={() => setStudyTab('REFERENCES')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${studyTab === 'REFERENCES' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                <ClipboardList className={`w-5 h-5 ${studyTab === 'REFERENCES' ? 'text-indigo-200' : ''}`} />
                <span className="text-[15px] tracking-wide">Citations & Syllabus</span>
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
              <div className="mb-5 rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">Study Mission</p>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.round((studyMissionChecks.length / 3) * 105)}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-slate-300">
                  {studyMissionRewarded ? 'Mission complete. Study XP added.' : `${studyMissionChecks.length}/3 active steps done`}
                </p>
              </div>
            </div>
          </div>

          {/* SPLIT PANE MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col lg:flex-row bg-slate-100 relative h-[50vh] md:h-screen overflow-hidden">
            
            {/* LEFT PANE: The Document Reader */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 ${studyTab === 'LESSON' ? 'flex' : 'hidden lg:flex'}`}>
              
              {/* Reader Header / Toolbar */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 z-10 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  {studyViewMode === 'guide' ? (
                    <span className="text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                      Page {readerPage + 1} of {totalPages}
                    </span>
                  ) : (
                    <span className="text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                      Page {originalPageIndex + 1} of {extractedOriginalPages.length || 1}
                    </span>
                  )}

                  {currentDocument.fileUrl && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-black select-none border border-slate-200/10 ml-2">
                      <button
                        onClick={() => setStudyViewMode('guide')}
                        className={`px-2.5 py-1 rounded-md transition-all ${studyViewMode === 'guide' ? 'bg-white dark:bg-slate-700 text-indigo-750 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Study Guide
                      </button>
                      <button
                        onClick={() => setStudyViewMode('original')}
                        className={`px-2.5 py-1 rounded-md transition-all ${studyViewMode === 'original' ? 'bg-white dark:bg-slate-700 text-indigo-750 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Original Book
                      </button>
                    </div>
                  )}

                  {studyViewMode === 'original' && extractedOriginalPages.length > 0 && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-black select-none border border-slate-200/10 ml-2">
                      <button
                        onClick={() => setOriginalViewType('text')}
                        className={`px-2.5 py-1 rounded-md transition-all ${originalViewType === 'text' ? 'bg-white dark:bg-slate-700 text-indigo-750 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        📖 Text
                      </button>
                      <button
                        onClick={() => setOriginalViewType('pdf')}
                        className={`px-2.5 py-1 rounded-md transition-all ${originalViewType === 'pdf' ? 'bg-white dark:bg-slate-700 text-indigo-750 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        📄 PDF
                      </button>
                    </div>
                  )}
                  
                  {/* Listen & Learn Audio Lesson Button */}
                  <button
                    onClick={handlePodcastToggle}
                    disabled={podcastLoading}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-black uppercase tracking-wider ${
                      isPodcastPlaying ? 'bg-indigo-700 text-white shadow-inner animate-pulse' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {podcastLoading ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-700/30 border-t-indigo-700 animate-spin" />
                    ) : isPodcastPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Headphones className="w-3.5 h-3.5" />
                    )}
                    <span>Listen</span>
                  </button>

                  <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                    <button
                      onClick={() => setFontScale(prev => Math.max(0.8, prev - 0.1))}
                      className="w-8 h-8 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 text-xs flex items-center justify-center transition-colors"
                      title="Make text smaller"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontScale(prev => Math.min(1.5, prev + 0.1))}
                      className="w-8 h-8 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 text-xs flex items-center justify-center transition-colors"
                      title="Make text larger"
                    >
                      A+
                    </button>
                    <button
                      onClick={() => setFontFamily(prev => prev === 'sans' ? 'serif' : 'sans')}
                      className="px-2.5 h-8 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 text-[10px] uppercase tracking-wider flex items-center justify-center transition-colors font-semibold"
                      title="Change font style"
                    >
                      {fontFamily === 'sans' ? 'Serif' : 'Sans'}
                    </button>
                  </div>
                </div>

                {/* Inline Search Bar */}
                <div className="relative max-w-xs w-full">
                  <input
                    type="text"
                    value={readerSearchTerm}
                    onChange={(e) => setReaderSearchTerm(e.target.value)}
                    placeholder="Search in notes..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 pl-9 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs text-slate-700 dark:text-white placeholder:text-slate-400"
                  />
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  {readerSearchTerm && (
                    <button
                      onClick={() => setReaderSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Reader Scrollable Notes Pane */}
              <div
                onScroll={() => {
                  setSelectedText('');
                  setSelectionCoords(null);
                }}
                className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar bg-slate-50 dark:bg-slate-950"
              >
                <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-14 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative">
                  {studyViewMode === 'guide' ? (
                    isSummarizing ? (
                      <div className="space-y-6 animate-pulse">
                        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3 mb-10"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-11/12"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6 mt-8"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                      </div>
                    ) : explanation ? (
                      <div className="prose prose-slate prose-lg max-w-none dark:prose-invert">
                        {/* Active Study Mission Banner */}
                        {readerPage === 0 && (
                          <div className="mb-10 rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 p-5 not-prose">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 mb-1">Active Study Mission</p>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Learn actively, unlock your future</h3>
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Check off the classroom steps to record your progress.</p>
                              </div>
                              <div className="rounded-xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900 px-3.5 py-2 min-w-[80px] text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Done</p>
                                <p className="text-xl font-black text-emerald-800 dark:text-emerald-400">{studyMissionChecks.length}/3</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                              {['Read Notes', 'Ask Questions', 'Take Quiz'].map((lbl, idx) => {
                                const done = studyMissionChecks.includes(idx);
                                return (
                                  <button
                                    key={lbl}
                                    onClick={() => {
                                      if (idx === 1) setStudyTab('QNA');
                                      else if (idx === 2) setStudyTab('QUIZ');
                                      else {
                                        toggleStudyMissionCheck(0);
                                      }
                                    }}
                                    className={`px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all ${
                                      done ? 'bg-emerald-600 border-emerald-600 text-white font-semibold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400 font-semibold'
                                    }`}
                                  >
                                    <span>{lbl}</span>
                                    <CheckCircle className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-slate-300'}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* PAGE 0: Overview */}
                        {readerPage === 0 && (
                          <div>
                            <div className="flex items-center gap-3.5 mb-8 border-b border-indigo-50 dark:border-slate-800 pb-4">
                              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl">
                                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white m-0">Introduction</h2>
                                <p className="text-xs font-medium text-slate-500 m-0 leading-none mt-1.5">Overview of this material</p>
                              </div>
                            </div>
                            
                            <div className="relative group/paragraph flex items-start gap-4">
                              <div className="flex-1">
                                <p style={{ fontSize: `${fontScale}rem` }} className={`text-slate-700 dark:text-slate-300 leading-relaxed m-0 whitespace-pre-line ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                                  {renderFormattedText(explanation.explanation, readerSearchTerm, handleGlossaryTrigger)}
                                </p>
                              </div>
                              <div className="opacity-0 group-hover/paragraph:opacity-100 flex flex-col gap-1.5 shrink-0 transition-opacity duration-200">
                                <button
                                  onClick={() => handleParagraphAsk(explanation.explanation)}
                                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg shadow-sm"
                                  title="Ask Akili about this paragraph"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleParagraphCopyCitation(explanation.explanation)}
                                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg shadow-sm"
                                  title="Copy Citation"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUBTOPIC PAGES */}
                        {readerPage > 0 && readerPage <= subtopics.length && (() => {
                          const sub = subtopics[readerPage - 1];
                          return (
                            <div>
                              <div className="flex items-center gap-3.5 mb-8 border-b border-indigo-50 dark:border-slate-800 pb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl">
                                  <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                  <h2 className="text-2xl font-black text-slate-800 dark:text-white m-0 truncate max-w-xl">{sub.title}</h2>
                                  <p className="text-xs font-medium text-slate-500 m-0 leading-none mt-1.5">Syllabus Section {readerPage}</p>
                                </div>
                              </div>

                              {sub.blocks && sub.blocks.length > 0 ? (
                                <div className="space-y-6">
                                  {sub.blocks.map((block, bIdx) => (
                                    <React.Fragment key={bIdx}>
                                      {block.type === 'paragraph' && block.text && (
                                        <div className="relative group/paragraph flex items-start gap-4">
                                          <div className="flex-1">
                                            <p style={{ fontSize: `${fontScale}rem` }} className={`text-slate-700 dark:text-slate-300 leading-relaxed m-0 whitespace-pre-line ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                                              {renderFormattedText(block.text, readerSearchTerm, handleGlossaryTrigger)}
                                            </p>
                                          </div>
                                          <div className="opacity-0 group-hover/paragraph:opacity-100 flex flex-col gap-1.5 shrink-0 transition-opacity duration-200">
                                            <button
                                              onClick={() => handleParagraphAsk(block.text)}
                                              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg shadow-sm"
                                              title="Ask Akili"
                                            >
                                              <Sparkles className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleParagraphCopyCitation(block.text)}
                                              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg shadow-sm"
                                              title="Copy Citation"
                                            >
                                              <FileText className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {block.type === 'list' && block.items && block.items.length > 0 && (
                                        <ul className={`list-disc list-outside ml-6 space-y-2 m-0 text-slate-700 dark:text-slate-300 ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`} style={{ fontSize: `${fontScale}rem` }}>
                                          {block.items.map((item, iIdx) => (
                                            <li key={iIdx} className="pl-2 leading-relaxed">
                                              {renderFormattedText(item, readerSearchTerm, handleGlossaryTrigger)}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              ) : sub.content ? (
                                <div style={{ fontSize: `${fontScale}rem` }} className={fontFamily === 'serif' ? 'font-serif' : 'font-sans'}>
                                  <MarkdownText content={sub.content} />
                                </div>
                              ) : null}
                            </div>
                          );
                        })()}

                        {/* LAST PAGE: Summary & References */}
                        {readerPage === totalPages - 1 && (
                          <div className="space-y-10">
                            <div className="flex items-center gap-3.5 mb-6 border-b border-slate-150 dark:border-slate-800 pb-4">
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl">
                                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white m-0">Summary & Standards</h2>
                                <p className="text-xs font-medium text-slate-500 m-0 leading-none mt-1.5">Curriculum alignment & Citation builder</p>
                              </div>
                            </div>

                            {/* Quick summary points */}
                            <div>
                              <h3 className="text-base font-black text-slate-800 dark:text-white mb-3 uppercase tracking-wider font-semibold">Key Takeaways</h3>
                              <ul className="list-disc list-outside ml-6 space-y-2.5 text-slate-700 dark:text-slate-300">
                                {(explanation.summaryPoints || []).map((pt, i) => (
                                  <li key={i} className="text-sm font-semibold leading-relaxed">
                                    {renderFormattedText(pt, readerSearchTerm, handleGlossaryTrigger)}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Syllabus Alignment Card */}
                            <div className="p-6 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 rounded-3xl not-prose">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-2 font-semibold">Kenyan Curriculum Mapping</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-indigo-100/50 dark:border-slate-800 pb-4 mb-4">
                                <div>
                                  <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Curriculum</span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-white">{syllabus.curriculum}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Strand</span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-white">{syllabus.strand}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Sub-Strand</span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-white">{syllabus.subStrand}</span>
                                </div>
                              </div>
                              <div>
                                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Target Learning Outcomes</span>
                                <ul className="space-y-1.5">
                                  {syllabus.outcomes.map((out, i) => (
                                    <li key={i} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                      <span className="text-emerald-500 mt-0.5">✔</span>
                                      <span>{out}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Academic Citation Builder */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl not-prose">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Academic Citation Builder</h4>
                                <div className="flex bg-slate-200 dark:bg-slate-850 p-0.5 rounded-lg text-[9px] font-bold">
                                  {(['SOMA', 'APA', 'MLA', 'HARVARD'] as const).map(fmt => (
                                    <button
                                      key={fmt}
                                      onClick={() => setCitationFormat(fmt)}
                                      className={`px-2 py-1 rounded-md uppercase tracking-wider transition-all ${
                                        citationFormat === fmt ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                      }`}
                                    >
                                      {fmt}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs text-slate-650 dark:text-slate-400 italic font-mono leading-relaxed select-all">
                                {citationFormat === 'APA' && `Soma Smart. (${new Date().getFullYear()}). ${currentDocument.title} [Study Material]. Retrieved from Soma AI Library.`}
                                {citationFormat === 'MLA' && `Soma Smart. "${currentDocument.title}." Soma AI Library, ${new Date().getFullYear()}.`}
                                {citationFormat === 'HARVARD' && `Soma Smart, ${new Date().getFullYear()}. ${currentDocument.title}, Soma AI Library. Available at: Soma Smart.`}
                                {citationFormat === 'SOMA' && `Soma AI Library: Grade ${cleanGrade} ${cleanSubject} (${currentDocument.title}). Reference ID: ${currentDocument.realId || currentDocument.id}`}
                              </div>

                              <button
                                onClick={() => {
                                  const textRef =
                                    citationFormat === 'APA' ? `Soma Smart. (${new Date().getFullYear()}). ${currentDocument.title} [Study Material]. Retrieved from Soma AI Library.` :
                                    citationFormat === 'MLA' ? `Soma Smart. "${currentDocument.title}." Soma AI Library, ${new Date().getFullYear()}.` :
                                    citationFormat === 'HARVARD' ? `Soma Smart, ${new Date().getFullYear()}. ${currentDocument.title}, Soma AI Library. Available at: Soma Smart.` :
                                    `Soma AI Library: Grade ${cleanGrade} ${cleanSubject} (${currentDocument.title}). Reference ID: ${currentDocument.realId || currentDocument.id}`;
                                  navigator.clipboard.writeText(textRef);
                                  triggerToast(`Copied ${citationFormat} Reference!`);
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Copy Reference
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-32 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                          <BookOpen className="w-10 h-10 text-slate-300 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black text-slate-400">Loading lesson material...</h3>
                      </div>
                    )
                  ) : (
                    /* studyViewMode === 'original' */
                    isExtractingOriginal ? (
                      <div className="space-y-6 animate-pulse py-12 text-center text-slate-400">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-500 animate-pulse">Extracting Textbook Pages...</p>
                      </div>
                    ) : (extractedOriginalPages.length === 0 || originalViewType === 'pdf') ? (
                      /* Fallback to original PDF embed if extraction failed/empty (e.g. scanned image) or user toggles PDF view */
                      <div className="h-[calc(100vh-280px)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-sm">
                        <embed
                          src={currentDocument.fileUrl || currentDocument.file_url}
                          type="application/pdf"
                          className="w-full h-full"
                          style={{ minHeight: 'calc(100vh - 280px)' }}
                        />
                      </div>
                    ) : (
                      /* Render clean extracted page */
                      <div className="prose prose-slate prose-lg max-w-none dark:prose-invert">
                        <div className="flex items-center gap-3.5 mb-8 border-b border-indigo-50 dark:border-slate-800 pb-4">
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl">
                            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-slate-850 dark:text-white m-0">Original Page Content</h2>
                            <p className="text-xs font-medium text-slate-500 m-0 leading-none mt-1.5">Page {originalPageIndex + 1} of {extractedOriginalPages.length}</p>
                          </div>
                        </div>

                        <div className="relative group/paragraph flex items-start gap-4">
                          <div className="flex-1">
                            <p 
                              style={{ fontSize: `${fontScale}rem` }} 
                              className={`text-slate-755 dark:text-slate-350 leading-relaxed m-0 whitespace-pre-line select-text ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
                            >
                              {renderFormattedText(extractedOriginalPages[originalPageIndex], readerSearchTerm, handleGlossaryTrigger)}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover/paragraph:opacity-100 flex flex-col gap-1.5 shrink-0 transition-opacity duration-200">
                            <button
                              onClick={() => handleParagraphAsk(extractedOriginalPages[originalPageIndex])}
                              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg shadow-sm"
                              title="Ask Akili about this page"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleParagraphCopyCitation(extractedOriginalPages[originalPageIndex])}
                              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg shadow-sm"
                              title="Copy Citation"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                </div>
              </div>

              {/* Reader Footer Page Navigation controls */}
              {((studyViewMode === 'guide' && !isSummarizing && explanation) || 
                (studyViewMode === 'original' && !isExtractingOriginal && extractedOriginalPages.length > 0 && originalViewType === 'text')) && (
                <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
                  <button
                    disabled={studyViewMode === 'guide' ? readerPage === 0 : originalPageIndex === 0}
                    onClick={() => {
                      if (studyViewMode === 'guide') {
                        handlePageChange(readerPage - 1);
                      } else {
                        handleOriginalPageChange(originalPageIndex - 1);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-black uppercase tracking-wider text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all font-semibold"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                    {Array.from({ length: studyViewMode === 'guide' ? totalPages : extractedOriginalPages.length }).map((_, i) => {
                      const isActive = studyViewMode === 'guide' ? readerPage === i : originalPageIndex === i;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (studyViewMode === 'guide') {
                              handlePageChange(i);
                            } else {
                              handleOriginalPageChange(i);
                            }
                          }}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={studyViewMode === 'guide' ? readerPage === totalPages - 1 : originalPageIndex === extractedOriginalPages.length - 1}
                    onClick={() => {
                      if (studyViewMode === 'guide') {
                        handlePageChange(readerPage + 1);
                      } else {
                        handleOriginalPageChange(originalPageIndex + 1);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-black uppercase tracking-wider text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all font-semibold"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT PANE: Contextual Tools (Chat, Recap, Quiz, References) */}
            <div className={`w-full lg:w-[450px] shrink-0 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-250 dark:border-slate-800 ${studyTab !== 'LESSON' ? 'flex' : 'hidden lg:flex'}`}>
              
              {/* Desktop Secondary tab header */}
              <div className="lg:flex hidden bg-slate-50 dark:bg-slate-850 p-2 border-b border-slate-200 dark:border-slate-800 gap-1 select-none">
                {([
                  { id: 'QNA', label: 'Ask Akili', icon: Sparkles },
                  { id: 'RECAP', label: 'Quick Recap', icon: ListChecks },
                  { id: 'REFERENCES', label: 'Syllabus/Citations', icon: ClipboardList }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStudyTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all font-semibold ${
                      (studyTab === 'LESSON' ? 'QNA' : studyTab) === tab.id
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600'
                        : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* RENDER ACTIVE TOOL */}
              <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col h-full">
                
                {/* TOOL: QNA (Akili Chat) */}
                {(studyTab === 'QNA' || studyTab === 'LESSON') && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
                    {/* Mobile Back to Lesson Button */}
                    <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                      <button onClick={() => setStudyTab('LESSON')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                        ← Back to Lesson
                      </button>
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Raise Hand</span>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-850 dark:text-white text-sm">Teacher Somo</h4>
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 inline-block rounded-full bg-emerald-500 animate-pulse"></span> Grounded AI Teacher
                          </span>
                        </div>
                      </div>
                    </div>

                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
                      {studyChat.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto py-10 opacity-70">
                          <div className="w-16 h-16 bg-white dark:bg-slate-850 rounded-full flex items-center justify-center mb-4 border-2 border-indigo-50 dark:border-slate-700 shadow-md">
                            <Sparkles className="w-6 h-6 text-indigo-500" />
                          </div>
                          <h4 className="text-sm font-black text-slate-850 dark:text-white mb-1 tracking-tight">Need clarification?</h4>
                          <p className="text-xs text-slate-550 leading-relaxed">Ask anything about the notes, highlight a word/sentence to ask, or request an example.</p>
                        </div>
                      ) : (
                        studyChat.map((msg, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                              <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mr-2 mt-1 shrink-0 border border-indigo-100 dark:border-indigo-900">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              </div>
                            )}
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-350 rounded-tl-none font-medium'
                            }`}>
                              <MarkdownText content={msg.text} />
                            </div>
                          </motion.div>
                        ))
                      )}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mr-2 mt-1 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-slate-950 via-white dark:via-slate-950 to-transparent shrink-0">
                      {pendingMedia && (
                        <div className="mb-2 inline-flex items-center gap-2 p-2 bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-700 rounded-xl shadow-md">
                          <span className="text-[10px] font-black uppercase text-indigo-600 font-semibold">Attached {pendingMedia.type}</span>
                          <button onClick={() => setPendingMedia(null)} className="text-slate-400 hover:text-red-500">✕</button>
                        </div>
                      )}
                      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-700 rounded-2xl p-1 shadow-md focus-within:ring-2 focus-within:ring-indigo-500">
                        <button type="button" onClick={() => studyFileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 rounded-full">
                          <Upload className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full ${isRecording ? 'text-red-500 animate-pulse bg-red-50' : 'text-slate-400 hover:text-indigo-600'}`}>
                          <Mic className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={promptText}
                          onChange={(e) => setPromptText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && askStudyBuddy(promptText)}
                          placeholder="Ask a question..."
                          className="flex-1 bg-transparent px-3 py-2 outline-none text-xs text-slate-700 dark:text-white"
                          disabled={loading}
                        />
                        <button
                          onClick={() => askStudyBuddy(promptText)}
                          disabled={(!promptText.trim() && !pendingMedia) || loading}
                          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TOOL: RECAP (Key Concept Nodes) */}
                {studyTab === 'RECAP' && (
                  <div className="flex-1 p-5 space-y-4">
                    {/* Mobile Back */}
                    <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                      <button onClick={() => setStudyTab('LESSON')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 font-semibold">
                        ← Back to Lesson
                      </button>
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Quick Recap</span>
                    </div>

                    <div className="mb-4">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded font-semibold">Memory Review</span>
                      <h4 className="text-lg font-black text-slate-850 dark:text-white mt-2">Key takeaway summaries</h4>
                    </div>

                    {explanation?.recapNodes && explanation.recapNodes.length > 0 ? (
                      <div className="space-y-3">
                        {explanation.recapNodes.map((node, i) => {
                          const isExpanded = expandedRecaps.includes(i);
                          return (
                            <div
                              key={i}
                              onClick={() => {
                                setExpandedRecaps(prev => isExpanded ? prev.filter(x => x !== i) : [...prev, i]);
                              }}
                              className={`border rounded-2xl p-4 bg-white dark:bg-slate-900 transition-all cursor-pointer ${
                                isExpanded ? 'border-indigo-400 ring-2 ring-indigo-50 dark:ring-indigo-950/20' : 'border-slate-250 hover:border-slate-350'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-slate-800 dark:text-white">{node.point}</span>
                                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </div>
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-450 leading-relaxed">
                                  <MarkdownText content={node.details} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-xs text-slate-400">No recap nodes available.</div>
                    )}
                  </div>
                )}

                {/* TOOL: QUIZ (Practice Quiz launcher) */}
                {studyTab === 'QUIZ' && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    {/* Mobile Back */}
                    <div className="lg:hidden w-full flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0 mb-10">
                      <button onClick={() => setStudyTab('LESSON')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 font-semibold">
                        ← Back to Lesson
                      </button>
                      <span className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-widest font-semibold">Pop Quiz</span>
                    </div>

                    <div className="max-w-xs">
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2 font-semibold">Pop Quiz!</h4>
                      <p className="text-xs text-slate-550 leading-relaxed mb-6">Test your recall of the concepts in this study material to cement what you have read.</p>
                      
                      <Button
                        fullWidth
                        onClick={generatePracticeQuiz}
                        className="rounded-xl bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs py-3 border-none hover:bg-emerald-600 font-semibold"
                      >
                        Start Practice Quiz
                      </Button>
                    </div>
                  </div>
                )}

                {/* TOOL: REFERENCES (Syllabus & Citations) */}
                {studyTab === 'REFERENCES' && (
                  <div className="flex-1 p-5 space-y-6">
                    {/* Mobile Back */}
                    <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-850 shrink-0">
                      <button onClick={() => setStudyTab('LESSON')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 font-semibold">
                        ← Back to Lesson
                      </button>
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest font-semibold">References</span>
                    </div>

                    <div>
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase rounded font-semibold">Academic Mapping</span>
                      <h4 className="text-lg font-black text-slate-850 dark:text-white mt-2">Syllabus & Citations</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Syllabus Alignment */}
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                        <h5 className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 mb-3 tracking-wider font-semibold">Curriculum Mapping</h5>
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="block text-[8px] font-black uppercase text-slate-400">Curriculum standard</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{syllabus.curriculum}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black uppercase text-slate-400 font-semibold">Strand</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{syllabus.strand}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black uppercase text-slate-400 font-semibold">Sub-strand</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{syllabus.subStrand}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black uppercase text-slate-400 mb-1 font-semibold">KNEC Learning Objectives</span>
                            <ul className="space-y-1 pl-1">
                              {syllabus.outcomes.map((out, i) => (
                                <li key={i} className="text-slate-650 dark:text-slate-350 flex items-start gap-1">
                                  <span className="text-emerald-500">✔</span>
                                  <span>{out}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Citation Builder */}
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cite Material</h5>
                          <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-md text-[8px] font-black">
                            {(['SOMA', 'APA', 'MLA', 'HARVARD'] as const).map(fmt => (
                              <button
                                key={fmt}
                                onClick={() => setCitationFormat(fmt)}
                                className={`px-1.5 py-0.5 rounded transition-all ${
                                  citationFormat === fmt ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'
                                }`}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 p-3 rounded-xl text-xs text-slate-650 dark:text-slate-400 font-mono italic leading-relaxed select-all border border-slate-200 dark:border-slate-900">
                          {citationFormat === 'APA' && `Soma Smart. (${new Date().getFullYear()}). ${currentDocument.title} [Study Material]. Retrieved from Soma AI Library.`}
                          {citationFormat === 'MLA' && `Soma Smart. "${currentDocument.title}." Soma AI Library, ${new Date().getFullYear()}.`}
                          {citationFormat === 'HARVARD' && `Soma Smart, ${new Date().getFullYear()}. ${currentDocument.title}, Soma AI Library. Available at: Soma Smart.`}
                          {citationFormat === 'SOMA' && `Soma AI Library: Grade ${cleanGrade} ${cleanSubject} (${currentDocument.title}). Reference ID: ${currentDocument.realId || currentDocument.id}`}
                        </div>

                        <button
                          onClick={() => {
                            const textRef =
                              citationFormat === 'APA' ? `Soma Smart. (${new Date().getFullYear()}). ${currentDocument.title} [Study Material]. Retrieved from Soma AI Library.` :
                              citationFormat === 'MLA' ? `Soma Smart. "${currentDocument.title}." Soma AI Library, ${new Date().getFullYear()}.` :
                              citationFormat === 'HARVARD' ? `Soma Smart, ${new Date().getFullYear()}. ${currentDocument.title}, Soma AI Library. Available at: Soma Smart.` :
                              `Soma AI Library: Grade ${cleanGrade} ${cleanSubject} (${currentDocument.title}). Reference ID: ${currentDocument.realId || currentDocument.id}`;
                            navigator.clipboard.writeText(textRef);
                            triggerToast(`Copied ${citationFormat} Reference!`);
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-655 dark:text-indigo-400 hover:underline font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Copy Reference
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* GLOSSARY OVERLAY POPUP */}
          {activeGlossaryTerm && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 border-2 border-slate-350 dark:border-slate-800 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-500"></div>
                <button
                  onClick={() => setActiveGlossaryTerm(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="mt-2 flex items-center gap-2">
                  <h4 className="text-lg font-black text-slate-800 dark:text-white leading-none">{activeGlossaryTerm.term}</h4>
                  <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">{activeGlossaryTerm.pronunciation}</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 font-semibold">Definition (English)</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{activeGlossaryTerm.definition}</p>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-855 pt-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 font-semibold">Tafsiri (Kiswahili)</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{activeGlossaryTerm.translation}</p>
                  </div>
                </div>
                <div className="mt-8">
                  <Button
                    fullWidth
                    onClick={() => setActiveGlossaryTerm(null)}
                    className="rounded-xl bg-indigo-600 text-white font-bold uppercase tracking-wider text-xs py-3 border-none hover:bg-indigo-700 font-semibold"
                  >
                    I Understand
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* FLOATING TEXT SELECTION BUBBLE */}
          {selectedText && selectionCoords && (
            <div
              style={{
                position: 'fixed',
                left: `${selectionCoords.x}px`,
                top: `${selectionCoords.y - 10}px`,
                transform: 'translateX(-50%) translateY(-100%)',
                zIndex: 100
              }}
              className="bg-slate-900 border border-slate-750 rounded-2xl shadow-xl flex items-center p-1 gap-1 select-none animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                onClick={() => {
                  handleParagraphAsk(selectedText);
                  setSelectedText('');
                  setSelectionCoords(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Akili</span>
              </button>
              <button
                onClick={() => {
                  handleParagraphCopyCitation(selectedText);
                  setSelectedText('');
                  setSelectionCoords(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-750 font-semibold"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Cite Quote</span>
              </button>
              <button
                onClick={() => {
                  setSelectedText('');
                  setSelectionCoords(null);
                }}
                className="p-1 text-slate-400 hover:text-red-400 rounded-xl"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TOAST MESSAGE OVERLAY */}
          {toastMessage && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 border border-slate-800">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-wide">{toastMessage}</span>
              </div>
            </div>
          )}

        </div>
      );
    }
    if (mode === 'SCAN_EXPLAIN') {
      const isHomework = sidebarTab === 'HOMEWORK';
      const themeGradient = isHomework ? 'from-amber-400 via-orange-500 to-rose-500' : 'from-indigo-500 via-purple-500 to-pink-500';
      const bgGlow = isHomework ? 'bg-amber-500/10' : 'bg-indigo-500/10';
      const iconBg = isHomework ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50' : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800/50';
      const iconColor = isHomework ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400';

      return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center p-6 w-full animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-2 border-slate-300 dark:border-slate-800 p-6 sm:p-8 md:p-12 relative overflow-hidden">
            {/* Background decorations */}
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${themeGradient}`}></div>
            <div className={`absolute -top-24 -right-24 w-48 h-48 ${bgGlow} rounded-full blur-3xl pointer-events-none`}></div>

            <div className="flex flex-col items-center text-center relative z-10 mb-8">
              <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mb-6 shadow-inner border`}>
                {isHomework ? (
                  <ClipboardList className={`w-10 h-10 ${iconColor}`} />
                ) : (
                  <Brain className={`w-10 h-10 ${iconColor}`} />
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
                {educationLevel === EducationLevel.JUNIOR
                  ? (isHomework ? 'Fun Tasks' : 'Akili Buddy')
                  : educationLevel === EducationLevel.CAMPUS
                    ? (isHomework ? 'Assignments' : 'Ask Akili')
                    : (isHomework ? 'Homework Help' : 'Ask Akili')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
                {imageData
                  ? (educationLevel === EducationLevel.JUNIOR ? "I see your picture! What should I help with?" : "Image attached! What would you like Akili to explain?")
                  : isHomework
                    ? (educationLevel === EducationLevel.JUNIOR ? "Show me your task or tell me about it!" : "Upload your homework or record audio — Akili will break it down step by step.")
                    : (educationLevel === EducationLevel.JUNIOR ? "Ask Akili anything, show a picture, or just talk!" : "Type a topic, upload an image, or record audio — Akili has you covered.")}
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
            <button onClick={() => runWithRecallExitGuard(() => { cancelPodcast(); handleExitResult(); })} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
              <ArrowRight className="w-5 h-5 text-slate-500 rotate-180 group-hover:text-blue-600" />
              <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600">Dashboard</span>
            </button>
            <h1 className="font-bold text-lg text-slate-900 dark:text-white truncate flex-1">{explanation.topic}</h1>

            <button
              onClick={handlePodcastToggle}
              disabled={podcastLoading}
              className={`
                hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5
                ${podcastLoading
                  ? 'bg-indigo-50 text-indigo-400 border-2 border-indigo-200 cursor-wait'
                  : isPodcastPlaying
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-200'}
              `}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${podcastLoading ? 'bg-indigo-100' : isPodcastPlaying ? 'bg-indigo-200' : 'bg-white/20'}`}>
                {podcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPodcastPlaying ? <Pause className="w-4 h-4" /> : <Headphones className="w-4 h-4" />)}
              </div>
              <div className="text-left flex flex-col">
                <span className="text-xs font-black uppercase tracking-wide leading-none mb-0.5">
                  {podcastLoading ? 'Generating...' : isPodcastPlaying ? 'Pause' : 'Listen & Learn'}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isPodcastPlaying ? 'text-indigo-500' : podcastLoading ? 'text-indigo-400' : 'text-indigo-100'}`}>
                  {isPodcastPlaying && podcastTotalSegments > 0
                    ? `Segment ${currentSegmentIndex + 1} of ${podcastTotalSegments}`
                    : podcastLoading ? 'Scripting your episode...' : 'Audio Lesson'}
                </span>
              </div>
            </button>


            <button onClick={handleDownload} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-6 max-w-2xl mx-auto">

            {/* Media Section (Your Question - Image/Audio) */}
            {(imageData || audioData) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border-2 border-slate-300 dark:border-slate-800 animate-in fade-in zoom-in duration-300"
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

            {/* Your Question (Text query) */}
            {!imageData && !audioData && explanation?.topic && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border-2 border-slate-300 dark:border-slate-800 animate-in fade-in zoom-in duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">Your Question</p>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{explanation.topic}</h3>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Key Takeaways - Placed on top below 'your question' card */}
            {explanation.summaryPoints && explanation.summaryPoints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-300 dark:border-slate-800 shadow-sm relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  Key Takeaways
                </h3>
                <ul className="space-y-4">
                  {explanation.summaryPoints.map((point, i) => (
                    <li key={i} className="flex gap-4 text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                      <span className="text-sm md:text-base">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Podcast Player Overlay — Premium Media Player */}
            <AnimatePresence>
              {(isPodcastPlaying || podcastLoading) && (isPodcastPlaying ? podcastScript : true) && (
                <motion.div
                  initial={{ y: 120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 120, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed bottom-20 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:w-[92%] md:max-w-xl z-[100]"
                >
                  <div className="bg-slate-900/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 ring-1 ring-black/30 overflow-hidden">
                    {/* Progress Bar Track */}
                    {podcastTotalSegments > 0 && (
                      <div className="h-1 bg-white/10 w-full">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                          style={{ width: `${Math.round(((currentSegmentIndex + 1) / podcastTotalSegments) * 100)}%` }}
                        />
                      </div>
                    )}

                    <div className="p-4">
                      {/* Episode Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50">
                          {podcastLoading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Headphones className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] leading-none mb-1">Somo Smart Audio</p>
                          <p className="text-white font-bold text-sm truncate leading-tight">
                            {podcastScript?.title || (explanation?.topic ?? 'Generating episode...')}
                          </p>
                        </div>
                        {podcastTotalSegments > 0 && (
                          <span className="shrink-0 text-[10px] font-bold text-slate-400 tabular-nums">
                            {currentSegmentIndex + 1}/{podcastTotalSegments}
                          </span>
                        )}
                      </div>

                      {/* Current Segment Transcript */}
                      {isPodcastPlaying && podcastScript && currentSegmentIndex >= 0 && (() => {
                        const seg = podcastScript.script[currentSegmentIndex];
                        return (
                          <div className="bg-white/5 rounded-2xl px-4 py-3 mb-4">
                            <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                              seg.speaker === 'Host'
                                ? 'bg-indigo-500/30 text-indigo-300'
                                : 'bg-violet-500/30 text-violet-300'
                            }`}>
                              {seg.speaker === 'Host' ? '🎙️ Host' : '🎓 Expert'}
                            </span>
                            <p className="text-slate-200 text-sm leading-relaxed font-medium">{seg.text}</p>
                          </div>
                        );
                      })()}

                      {podcastLoading && (
                        <div className="bg-white/5 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                          <p className="text-slate-400 text-sm font-medium">Scripting your audio episode with AI...</p>
                        </div>
                      )}

                      {/* Controls Row */}
                      <div className="flex items-center gap-2">
                        {/* Re-generate */}
                        <button
                          onClick={handlePodcastRegenerate}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-slate-400 hover:text-slate-200 transition-all text-xs font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Re-generate
                        </button>

                        {/* Skip Segment */}
                        <button
                          onClick={handlePodcastSkip}
                          disabled={!podcastScript || currentSegmentIndex >= podcastScript.script.length - 1}
                          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/8 hover:bg-white/12 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Skip segment"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Pause / Play */}
                        <button
                          onClick={handlePodcastToggle}
                          className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
                            isPodcastPlaying
                              ? 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-900/50'
                              : 'bg-white/15 hover:bg-white/20'
                          }`}
                        >
                          {isPodcastPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white fill-white" />}
                        </button>

                        {/* Stop & Close */}
                        <button
                          onClick={() => { cancelPodcast(); setIsPodcastPlaying(false); setCurrentSegmentIndex(-1); }}
                          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/8 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                          title="Stop playback"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Akili answer / Grounded by Soma Library notice */}
            <div className={`rounded-3xl border-2 p-4 shadow-sm ${
              explanation.grounding?.used
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/70'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  explanation.grounding?.used
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                }`}>
                  <Library className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-[0.16em] ${
                    explanation.grounding?.used ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {explanation.grounding?.used ? 'Grounded by Soma Library' : 'General Akili answer'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {explanation.grounding?.used
                      ? 'This answer used indexed Soma notes, syllabuses, or past papers where relevant.'
                      : groundedAnswerMode
                        ? 'No matching indexed source was found, so Akili answered from general curriculum knowledge.'
                        : 'Soma Library grounding was switched off for this answer.'}
                  </p>
                  {explanation.grounding?.sources && explanation.grounding.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {explanation.grounding.sources.slice(0, 4).map((source) => (
                        <span key={source} className="rounded-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/70 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 truncate max-w-full">
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Level Switcher */}
            <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border-2 border-slate-300 dark:border-slate-800">
              {(['Simple', 'Exam'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => handleRegenerate(l)}
                  disabled={loading || explanation.level === l}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${explanation.level === l ? (l === 'Simple' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-blue-100 text-blue-700 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {l === 'Simple' ? 'Explain Simply' : 'Exam Mode'}
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
                  ${podcastLoading
                    ? 'bg-indigo-50 border-2 border-dashed border-indigo-300 text-indigo-400 cursor-wait'
                    : isPodcastPlaying
                    ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-indigo-200'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    podcastLoading ? 'bg-indigo-100' : isPodcastPlaying ? 'bg-indigo-200' : 'bg-white/20'
                  }`}>
                    {podcastLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPodcastPlaying ? <Pause className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black uppercase tracking-wide">
                      {podcastLoading ? 'Generating...' : isPodcastPlaying ? 'Pause' : 'Listen & Learn'}
                    </p>
                    {isPodcastPlaying && podcastScript && currentSegmentIndex >= 0 ? (
                      <>
                        <p className="text-[11px] font-bold text-indigo-500 truncate max-w-[180px]">
                          {podcastScript.script[currentSegmentIndex].speaker === 'Host' ? '🎙️ Host' : '🎓 Expert'}
                        </p>
                        {podcastTotalSegments > 0 && (
                          <div className="mt-1 h-1 w-28 bg-indigo-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.round(((currentSegmentIndex + 1) / podcastTotalSegments) * 100)}%` }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <p className={`text-xs font-medium ${isPodcastPlaying ? 'text-indigo-600' : podcastLoading ? 'text-indigo-400' : 'text-indigo-100'}`}>
                        {podcastLoading ? 'Scripting episode...' : 'Audio Lesson Explanation'}
                      </p>
                    )}
                  </div>
                </div>
                {podcastLoading
                  ? <Loader2 className="w-5 h-5 animate-spin opacity-50" />
                  : isPodcastPlaying
                  ? <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  : <Play className="w-5 h-5 fill-current opacity-80" />}
              </button>
            </div>

            {lastQuizReview && lastQuizReview.missedQuestions.length > 0 && lastQuizReview.score < 100 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-3xl border-2 border-rose-200 dark:border-rose-900/60 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300 mb-1">Repair Your Misses</p>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      Fix {lastQuizReview.missedQuestions.length} weak spot{lastQuizReview.missedQuestions.length === 1 ? '' : 's'} from your last quiz
                    </h3>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                      Score: {lastQuizReview.score}%. Review the exact questions you missed before moving on.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-3">
                  {lastQuizReview.missedQuestions.slice(0, 3).map(({ question, index, selectedAnswer }) => (
                    <div key={`${question.id}-${index}`} className="rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Question {index + 1}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{question.question}</p>
                      <div className="grid gap-1 text-xs font-semibold">
                        <p className="text-rose-700 dark:text-rose-300">Your answer: {selectedAnswer || 'No answer'}</p>
                        <p className="text-emerald-700 dark:text-emerald-300">Correct answer: {String(question.correctAnswer)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      const repairPrompt = `Help me repair my mistakes on ${lastQuizReview.missedQuestions.length} quiz question(s) about ${explanation.topic}. For each missed question, explain the concept, show the method, then give me one similar practice question without the answer first.\n\n${lastQuizReview.missedQuestions.map(({ question, selectedAnswer }, i) => `${i + 1}. Question: ${question.question}\nMy answer: ${selectedAnswer || 'No answer'}\nCorrect answer: ${String(question.correctAnswer)}\nExplanation: ${question.explanation}`).join('\n\n')}`;
                      handlePromptSubmit(repairPrompt);
                    }}
                    className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Repair With Akili
                  </button>
                  <button
                    onClick={() => {
                      const repairQuestions = lastQuizReview.missedQuestions.map(({ question }) => question);
                      if (repairQuestions.length === 0) return;
                      setQuizData({
                        topic: `${explanation.topic} Repair Drill`,
                        questions: repairQuestions
                      });
                      setLastQuizReview(null);
                      trackFunnelEvent('learner_repair_drill_started', {
                        topic: explanation.topic,
                        missedQuestions: repairQuestions.length
                      });
                      setMode('QUIZ');
                    }}
                    className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    Retry Missed Only
                  </button>
                </div>
              </motion.div>
            )}

            {/* Detailed Explanation */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border-2 border-slate-300 dark:border-slate-800 prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white"
            >
              <div>
                <MarkdownText content={explanation.explanation} />
              </div>
              {/* ACTION FOOTER */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-2 sm:gap-4">
                <button
                  onClick={handleTTS}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 sm:px-5 py-3 rounded-xl transition-colors"
                >
                  {isPlaying ? <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                  {isPlaying ? "Stop" : "Listen"}
                </button>

                <button
                  onClick={handleGenerateQuiz}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm px-4 sm:px-5 py-3 rounded-xl transition-colors border border-indigo-100"
                >
                  <Clock className="w-4 h-4" />
                  Take Quiz
                </button>
              </div>
            </motion.article>

            {/* QUIZ NUDGE: convert explanation intent into quiz starts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-200"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-1">Next Step</p>
                  <h3 className="text-lg font-black">Lock this in with a 60-second quiz</h3>
                  <p className="text-xs font-semibold text-emerald-100 mt-1">Best results come when you test immediately after learning.</p>
                </div>
                <button
                  onClick={() => {
                    trackFunnelEvent('learner_quiz_nudge_clicked', {
                      source: 'result_quiz_nudge',
                      topic: explanation.topic
                    });
                    handleGenerateQuiz();
                  }}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-wider"
                >
                  Start Quiz
                </button>
              </div>
            </motion.div>

            {/* Need more help? - Phase 2 */}

            {/* CONTINUE RESEARCHING */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border-2 border-slate-300 dark:border-slate-700 mt-8"
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
                  className="flex-1 p-4 rounded-xl border-2 border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      const query = target.value;
                      if (!query.trim() || !explanation) return;

                      runWithRecallExitGuard(async () => {
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
                      });
                    }
                  }}
                />
                <button
                  className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    const query = input.value;
                    if (!query.trim() || !explanation) return;

                    runWithRecallExitGuard(async () => {
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
                    });
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
                  <h3 className="text-xl font-black">Still confused?</h3>
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
                      className="bg-white border-2 border-slate-300 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all active:scale-95 shadow-sm"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

          </div>



          {/* Global Bottom Nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 pb-safe flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => runWithRecallExitGuard(() => setMode('MENU'))} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Home</span>
            </button>
            <button onClick={() => runWithRecallExitGuard(() => setMode('MARKETPLACE'))} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Materials</span>
            </button>
            <div className="relative -mt-10">
              <button onClick={() => runWithRecallExitGuard(() => setMode('SCAN'))} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white transform hover:scale-110 active:scale-90 transition-all border-4 border-white">
                <ScanLine className="w-8 h-8" />
              </button>
            </div>
            <button onClick={() => runWithRecallExitGuard(() => setMode('LIBRARY'))} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Library className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Library</span>
            </button>
            <button onClick={() => runWithRecallExitGuard(() => isRegistered ? setMode('PROFILE') : setShowLogin(true))} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <UserCircle className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Me</span>
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'QUIZ' && quizData) {
      return <QuizRunner data={quizData} onComplete={(score, review) => {
        setStickyQuizTaken(true);
        setLastQuizReview(review);
        // Enrich topic with subject for better gamification tracking
        const subjectPrefix = currentDocument?.subject ? `${currentDocument.subject} - ` : "";

        saveActivity({
          id: Date.now().toString(),
          type: 'QUIZ',
          topic: `${subjectPrefix}${quizData.topic}`,
          date: new Date().toLocaleDateString(),
          score,
          details: JSON.stringify({ ...quizData, review })
        });

        // Phase 2: Update mastery graph & spaced repetition schedule
        processQuizCompletion(
          quizData.topic,
          score,
          currentDocument?.subject,
          currentDocument?.grade || studentProfile?.grade
        );

        // Feature: Sync mastery to cloud (non-blocking)
        triggerMemorySync();

        trackFunnelEvent('learner_quiz_completed', {
          topic: quizData.topic,
          score,
          source: 'quiz_runner'
        });

        const action = pendingExitAction;
        setPendingExitAction(null);
        if (action) {
          action();
        } else {
          // Return to the explanation when available so learners can repair weak spots.
          setMode(explanation ? 'RESULT' : 'MARKETPLACE');
        }
      }} onExit={() => {
        setPendingExitAction(null);
        setMode('RESULT');
      }} />;
    }

    // --- PRICING & PAYMENT ---

    if (mode === 'PRICING') {
      return (
        <PricingPage
          currentTier={subscriptionPlan}
          isPro={isPro}
          onSelectPlan={async (plan) => {
            trackFunnelEvent('pricing_plan_selected', {
              source: 'learner_pricing',
              plan_id: (plan as any)?.id,
              plan_name: plan?.name,
              amount_kes: (plan as any)?.price
            });
            await verifySubscription();
            const hasKnownActiveSubscription =
              subscriptionPlan !== 'FREE' &&
              !!subscriptionExpiry &&
              !isNaN(new Date(subscriptionExpiry).getTime()) &&
              new Date(subscriptionExpiry) > new Date();

            if (!(plan as any)?.isCreditPack && (isPro || hasKnownActiveSubscription)) {
              setHasRecentPaymentUnlock(true);
              setShowLimitModal(false);
              setMode('MENU');
              return;
            }
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
            trackFunnelEvent('payment_success', {
              source: 'learner_payment',
              plan_id: (selectedPlan as any)?.id,
              plan_name: selectedPlan?.name
            });
            setHasRecentPaymentUnlock(true);
            setShowLimitModal(false);
            await verifySubscription();
            setMode('MENU');
            setSelectedPlan(null);
            
            // Resume pending paywall action
            if (pendingPaywallAction) {
              const action = pendingPaywallAction;
              setPendingPaywallAction(null);
              setTimeout(() => {
                if (action.type === 'PROCESS_FILE') processFile(action.file);
                else if (action.type === 'AUDIO_EXPLANATION') handleAudioExplanation(action.blob, action.mimeType);
                else if (action.type === 'TOPIC_CLICK') handleTopicClick(action.topic, action.multimedia);
                else if (action.type === 'STUDY_SESSION') startStudySession(action.material);
                else if (action.type === 'STUDY_CHAT') askStudyBuddy(action.query);
                else if (action.type === 'STUDY_QUIZ') {
                  if (currentDocument) generatePracticeQuiz();
                  else handleGenerateQuiz();
                }
                else if (action.type === 'PODCAST') handlePodcastToggle();
                else if (action.type === 'REVISION_ENTRY') setMode('REVISION');
                else if (action.type === 'TALKBACK_ENTRY') setMode('TALKBACK');
                else if (action.type === 'TALKBACK_MESSAGE') setMode('TALKBACK');
              }, 100);
            } else if (pendingMaterialId) {
              const material = unifiedMaterials.find(m => m.id === pendingMaterialId || (m as any).realId === pendingMaterialId);
              const normalizedCategory = normalizeMaterialCategory(material?.category);
              if (material && normalizedCategory === 'PAST_PAPER') {
                startStudySession(material);
              } else if (material && normalizedCategory === 'SYLLABUS') {
                startStudySession(material);
              } else if (material) {
                startStudySession(material);
              }
              setPendingMaterialId(null);
            }
          }}
          onCancel={() => {
            trackFunnelEvent('payment_cancel', {
              source: 'learner_payment',
              plan_id: (selectedPlan as any)?.id,
              plan_name: selectedPlan?.name
            });
            handlePricingNavigation();
          }}
        />
      );
    }

    if (mode === 'MARKETPLACE' || mode === 'RESOURCES') {
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
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5">Official Study Library</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isPro && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col items-end mr-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Free trials</p>
                    <p className="text-[10px] font-black text-indigo-600">{Math.max(0, 3 - usageCount)} / 3 Left</p>
                  </div>
                  <button
                    onClick={() => handlePricingNavigation()}
                    className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-200 shadow-sm"
                  >
                    Unlock Full Access
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
                  <h3 className="text-2xl font-black tracking-tight leading-tight mb-1">Official Study Library.</h3>
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
                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border-2 border-slate-300 dark:border-slate-800 min-w-[180px] group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all active:scale-95"
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

            {/* Outcome-First Paths */}
            <div className="px-6 pb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Start with your goal</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    id: 'revise_topic',
                    title: 'Revise a Topic',
                    subtitle: 'High-quality notes for fast understanding',
                    icon: Brain,
                    className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
                    onClick: () => {
                      setMaterialCategory('NOTES');
                      setSelectedSource('SOMO');
                      setSelectedGrade('ALL');
                      setSubjectFilter('ALL');
                      trackFunnelEvent('library_intent_selected', { intent: 'revise_topic' });
                    }
                  },
                  {
                    id: 'past_paper_marking',
                    title: 'Past Paper + Marking',
                    subtitle: 'Exam-style papers and answer guidance',
                    icon: Layers,
                    className: 'border-amber-200 bg-amber-50 text-amber-700',
                    onClick: () => {
                      setMaterialCategory('PAST_PAPER');
                      setSelectedSource('SOMO');
                      setSelectedGrade('ALL');
                      setSubjectFilter('ALL');
                      trackFunnelEvent('library_intent_selected', { intent: 'past_paper_marking' });
                    }
                  },
                  {
                    id: 'quick_notes',
                    title: 'Quick Notes',
                    subtitle: 'Concise notes to review in minutes',
                    icon: FileText,
                    className: 'border-blue-200 bg-blue-50 text-blue-700',
                    onClick: () => {
                      setMaterialCategory('NOTES');
                      setSubjectFilter('ALL');
                      setSelectedGrade('ALL');
                      setSelectedSource('SOMO');
                      trackFunnelEvent('library_intent_selected', { intent: 'quick_notes' });
                    }
                  },
                  {
                    id: 'teacher_picks',
                    title: 'Teacher Picks',
                    subtitle: 'Community-created premium resources',
                    icon: Star,
                    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    onClick: () => {
                      setSelectedSource('TEACHERS');
                      setMaterialCategory('ALL');
                      setSelectedGrade('ALL');
                      setSubjectFilter('ALL');
                      trackFunnelEvent('library_intent_selected', { intent: 'teacher_picks' });
                    }
                  }
                ].map((card) => (
                  <button
                    key={card.id}
                    onClick={card.onClick}
                    className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${card.className}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
                        <card.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-tight">{card.title}</p>
                        <p className="text-[11px] font-semibold opacity-80">{card.subtitle}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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

              {/* Content-Type Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                {([
                  { id: 'ALL',        emoji: '📚', label: 'All',         activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' },
                  { id: 'SYLLABUS',   emoji: '📖', label: 'Syllabus',    activeClass: 'bg-purple-600 text-white shadow-lg shadow-purple-200' },
                  { id: 'NOTES',      emoji: '📝', label: 'Notes',       activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-200' },
                  { id: 'PAST_PAPER', emoji: '📄', label: 'Past Papers', activeClass: 'bg-amber-500 text-white shadow-lg shadow-amber-200' },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMaterialCategory(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                      materialCategory === tab.id
                        ? tab.activeClass
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{tab.emoji}</span> {tab.label}
                    {tab.id !== 'ALL' && (
                      <span className={`ml-1 text-[8px] px-1.5 py-0.5 rounded-full font-black ${
                        materialCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {unifiedMaterials.filter(m => m.category === tab.id && (getGradeLevel(m.grade || '') === educationLevel)).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Grade + Subject Row */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedSource}
                  onChange={(e) => {
                    const nextSource = e.target.value as 'ALL' | 'SOMO' | 'TEACHERS';
                    setSelectedSource(nextSource);
                    trackFunnelEvent('library_source_changed', { source: nextSource });
                  }}
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Sources</option>
                  <option value="SOMO">Somo Smart</option>
                  <option value="TEACHERS">Teacher Picks</option>
                </select>

                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Grades</option>
                  {['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4']
                    .filter(g => {
                      if (studentProfile?.grade) {
                        return isGradeInStudentRange(g, studentProfile.grade);
                      }
                      return getGradeLevel(g) === educationLevel;
                    })
                    .map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))
                  }
                </select>

                <div className="flex-1 min-w-[140px]">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="ALL">All Subjects</option>
                    {subjects.filter(s => s !== 'ALL').map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {(materialCategory !== 'ALL' || selectedGrade !== 'ALL' || subjectFilter !== 'ALL' || selectedSource !== 'ALL') && (
                  <button
                    onClick={() => {
                      setMaterialCategory('ALL');
                      setSelectedGrade('ALL');
                      setSubjectFilter('ALL');
                      setSelectedSource('ALL');
                      trackFunnelEvent('library_filters_reset', { source: 'ALL' });
                    }}
                    className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-wider px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                  >
                    Reset ✕
                  </button>
                )}
              </div>
            </div>

            {/* Material Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMaterials.length === 0 ? (
                  <div className="md:col-span-2 py-12 md:py-32 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                    <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h4 className="font-black text-slate-300 uppercase tracking-widest text-xs">No materials found in this category</h4>
                    <button onClick={() => { setMaterialCategory('ALL'); setSubjectFilter('ALL'); setSelectedSource('ALL'); trackFunnelEvent('library_filters_reset', { source: 'ALL' }); }} className="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline">Reset Filters</button>
                  </div>
                ) : (
                  filteredMaterials.map(item => {
                    const isSyllabus = item.category === 'SYLLABUS';
                    const isNotes = item.category === 'NOTES';
                    const isPastPaper = item.category === 'PAST_PAPER';
                    const isVerified = item.isVerified;
                    const sourceType = isVerified ? 'Somo Smart' : 'Teacher';
                    const alignmentTag = getGradeLevel(item.grade || '') === EducationLevel.JUNIOR ? 'CBC/KPSEA' : 'KCSE';
                    const createdAtValue = (item as any).createdAt ? new Date((item as any).createdAt) : null;
                    const reviewedLabel = createdAtValue && !isNaN(createdAtValue.getTime())
                      ? `Reviewed ${createdAtValue.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                      : 'Recently reviewed';
                    const qualityLabel = isVerified ? 'Editorial Reviewed' : 'Community Rated';

                    const status = getMaterialAccessStatus(item);

                    return (
                      <motion.div
                        whileHover={{ y: -2 }}
                        key={item.id}
                        className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-black/30 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                              isNotes ? 'bg-blue-50 text-blue-600' :
                              isPastPaper ? 'bg-amber-50 text-amber-600' :
                              isSyllabus ? 'bg-purple-50 text-purple-600' :
                              isVerified ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'
                            }`}>
                              {isNotes ? <FileText className="w-5 h-5" /> : isPastPaper ? <Layers className="w-5 h-5" /> : isSyllabus ? <Library className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
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
                            <span className="text-slate-200">/</span>
                            <span className="text-slate-400">{isVerified ? "Somo Smart" : item.teacherName}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                              {sourceType}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {alignmentTag}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {qualityLabel}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                              {reviewedLabel}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <Button
                            fullWidth
                            className={`rounded-xl py-2.5 font-bold uppercase tracking-wider text-[9px] transition-all border ${usageCount >= 3 && !isPro
                              ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-none hover:bg-amber-100'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02]'
                              }`}
                            onClick={() => {
                              if (isSyllabus) {
                                trackFunnelEvent('library_syllabus_opened', {
                                  material_id: item.id,
                                  subject: item.subject,
                                  grade: item.grade
                                });
                                startStudySession(item);
                                return;
                              }
                              startStudySession(item);
                            }}
                            isLoading={loading && currentDocument?.id === item.id}
                            icon={isSyllabus ? <Library className="w-3 h-3" /> : usageCount >= 3 && !isPro ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          >
                            {isSyllabus ? 'Open Guide' : usageCount >= 3 && !isPro ? 'Limit Reached' : 'Study'}
                          </Button>
                          <Button
                            variant="ghost"
                            className="rounded-xl p-2.5 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 shadow-sm transition-all"
                            onClick={() => {
                              const normalizedCategory = normalizeMaterialCategory(item.category);
                              if (normalizedCategory === 'PAST_PAPER') {
                                startStudySession(item);
                              } else if (status === 'OWNED' || status === 'PRO_INCLUDED' || status === 'FREE') {
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
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 pb-safe flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Home</span>
            </button>
            <button onClick={() => setMode('MARKETPLACE')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-indigo-600 scale-110">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Materials</span>
            </button>
            <div className="relative -mt-10">
              <button onClick={() => setMode('SCAN')} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white transform hover:scale-110 active:scale-90 transition-all border-4 border-white">
                <ScanLine className="w-8 h-8" />
              </button>
            </div>
            <button onClick={() => setMode('LIBRARY')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Library className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Library</span>
            </button>
            <button onClick={() => isRegistered ? setMode('PROFILE') : setShowLogin(true)} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <UserCircle className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Me</span>
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'LIBRARY') {
      const purchasedResources = unifiedMaterials.filter(m => getMaterialAccessStatus(m) === 'OWNED');
      const freeStarterResources = unifiedMaterials.filter(m => getMaterialAccessStatus(m) === 'FREE');
      const proVaultResources = unifiedMaterials.filter(m => getMaterialAccessStatus(m) === 'PRO_INCLUDED' || getMaterialAccessStatus(m) === 'PRO_LOCKED');
      const unlockedResources = unifiedMaterials.filter(m => {
        const status = getMaterialAccessStatus(m);
        const normalizedCategory = normalizeMaterialCategory(m.category);
        // Always include starter library content in unlocked view.
        if (isStarterCategory(normalizedCategory)) return true;
        return status === 'OWNED' || status === 'FREE' || status === 'PRO_INCLUDED';
      });

      const visibleLibraryMaterials =
        libraryView === 'PURCHASED'
          ? purchasedResources
          : libraryView === 'PRO_VAULT'
            ? (isPro ? proVaultResources : [])
            : unlockedResources;

      return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">My Library</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.15em] mt-1.5">Saved Learning Resources</p>
            </div>
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => {
                  setLibraryView('UNLOCKED');
                  trackFunnelEvent('library_view_changed', { view: 'UNLOCKED' });
                }}
                className={`rounded-xl px-3 py-2 border text-left transition-all ${libraryView === 'UNLOCKED'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest">Unlocked</p>
                <p className="text-lg font-black">{unlockedResources.length}</p>
              </button>
              <button
                onClick={() => {
                  setLibraryView('PURCHASED');
                  trackFunnelEvent('library_view_changed', { view: 'PURCHASED' });
                }}
                className={`rounded-xl px-3 py-2 border text-left transition-all ${libraryView === 'PURCHASED'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest">Purchased</p>
                <p className="text-lg font-black">{purchasedResources.length}</p>
              </button>
              <button
                onClick={() => {
                  setLibraryView('PRO_VAULT');
                  trackFunnelEvent('library_view_changed', { view: 'PRO_VAULT' });
                }}
                className={`rounded-xl px-3 py-2 border text-left transition-all ${libraryView === 'PRO_VAULT'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest">Pro Vault</p>
                <p className="text-lg font-black">{proVaultResources.length}</p>
              </button>
            </div>

            {libraryView === 'PRO_VAULT' && !isPro ? (
              <div className="py-12 md:py-24 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-amber-200 dark:border-amber-900/40 rounded-[3rem] mb-6">
                <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border-2 border-amber-200 dark:border-amber-800/30">
                  <Lock className="w-10 h-10 text-amber-500 dark:text-amber-400" />
                </div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Pro Vault is locked</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-8 max-w-sm mx-auto leading-relaxed">Upgrade to unlock premium teacher resources curated for faster exam prep.</p>
                <Button onClick={() => handlePricingNavigation()} className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-100 font-black uppercase tracking-widest text-[10px] border-none">
                  Unlock Pro Vault
                </Button>
              </div>
            ) : visibleLibraryMaterials.length === 0 ? (
              <div className="py-12 md:py-32 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border-2 border-slate-300 dark:border-slate-700">
                  <Library className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Your library is empty</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-12 max-w-xs mx-auto leading-relaxed">
                  {libraryView === 'PURCHASED'
                    ? 'Buy premium resources from the marketplace and they will appear here.'
                    : 'Unlock premium notes and revision papers from the marketplace to see them here.'}
                </p>
                <Button onClick={() => setMode('MARKETPLACE')} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[10px] border-none">
                  Browse Materials
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {visibleLibraryMaterials.map(item => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      trackFunnelEvent('library_item_opened', {
                        material_id: item.id,
                        material_category: item.category,
                        subject: item.subject,
                        grade: item.grade,
                        source: libraryView
                      });
                      const normalizedCategory = normalizeMaterialCategory(item.category);
                      if (normalizedCategory === 'SYLLABUS') {
                        startStudySession(item);
                        return;
                      }
                      if (normalizedCategory === 'PAST_PAPER') {
                        startStudySession(item);
                        return;
                      }
                      startStudySession(item);
                    }}
                    className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-6 group hover:border-indigo-100 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-50/30 dark:hover:shadow-black/30 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 border-slate-300 dark:border-slate-700 shadow-sm ${item.isVerified ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                      {item.category === 'NOTES' ? <FileText className="w-8 h-8" /> : item.category === 'SYLLABUS' ? <Library className="w-8 h-8" /> : <Layers className="w-8 h-8" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{item.subject}</span>
                        {item.isVerified && <span className="bg-indigo-50 p-1 rounded-full"><Sparkles className="w-2 h-2 text-indigo-600" /></span>}
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white text-lg truncate group-hover:text-indigo-600 transition-colors tracking-tight">{item.title}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.category.replace('_', ' ')} / {item.grade}</p>
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
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 pb-safe flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Home</span>
            </button>
            <button onClick={() => setMode('MARKETPLACE')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Materials</span>
            </button>
            <div className="relative -mt-10">
              <button onClick={() => setMode('SCAN')} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 text-white transform hover:scale-110 active:scale-90 transition-all border-4 border-white">
                <ScanLine className="w-8 h-8" />
              </button>
            </div>
            <button onClick={() => setMode('LIBRARY')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-indigo-600 scale-110">
              <Library className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Library</span>
            </button>
            <button onClick={() => isRegistered ? setMode('PROFILE') : setShowLogin(true)} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <UserCircle className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Me</span>
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
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8 text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800">
                  Snap a clear photo of your question. Somo will explain it simply.
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
                Supported by Gemini AI
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
        onProfile={() => runWithRecallExitGuard(() => setMode('PROFILE'))}
      />

      {/* Main Content */}
      <div className="lg:ml-[260px] min-h-screen overflow-x-hidden min-w-0">
        {renderMode()}
      </div>

      <AnimatePresence>
        {micPermissionNotice && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-[430px] z-[130] rounded-2xl border border-amber-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-amber-500/40 dark:bg-slate-900"
          >
            <div className="p-4 flex gap-3">
              <div className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 flex items-center justify-center">
                <Mic className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-slate-900 dark:text-white">Enable microphone access</h3>
                  <button
                    type="button"
                    onClick={() => setMicPermissionNotice(false)}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Dismiss microphone notice"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Your browser blocked Soma from using the mic. Click the lock icon near the address bar, allow Microphone for this site, then reload or test the mic again.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-amber-600"
                  >
                    Reload After Enabling
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMicPermissionNotice(false);
                      setError({
                        title: "Enable Microphone",
                        message: "Open the lock icon in your browser address bar, allow Microphone for Soma, then come back and tap the mic again."
                      });
                    }}
                    className="rounded-xl border border-amber-300 px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
                  >
                    Show Steps
                  </button>
                  <button
                    type="button"
                    onClick={() => setMicPermissionNotice(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Faded Solution Paywall Modal */}
      <AnimatePresence>
        {fadedSolutionData.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100">Full Step-by-Step Logic</h2>
                    <p className="text-sm font-medium text-slate-500 line-clamp-1">"{fadedSolutionData.query}"</p>
                  </div>
                </div>
                <button
                  onClick={() => setFadedSolutionData(prev => ({ ...prev, show: false }))}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
                >
                  <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                </button>
              </div>

              {/* Content Area - Faded ONLY if NOT registered and ONLY if NOT short error */}
              <div 
                className={`relative p-8 overflow-y-auto flex-1 ${!isRegistered ? 'pb-32 overflow-hidden' : ''}`}
                style={!isRegistered && !fadedSolutionData.answer?.includes('Connection Interrupted') ? { 
                    maskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)', 
                    WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)' 
                } : {}}
              >
                {fadedSolutionData.isGenerating ? (
                  <div className="space-y-6 animate-pulse mt-4">
                    <div className="h-8 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                        <div className="h-4 w-11/12 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    </div>
                    <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl mt-8"></div>
                    <div className="space-y-3 mt-8">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                        <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    </div>
                  </div>
                ) : (
                  <div className={`prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 ${!isRegistered ? 'pointer-events-none' : ''}`}>
                    <MarkdownText content={fadedSolutionData.answer || ''} />
                  </div>
                )}
              </div>

              {/* Paywall CTA absolute overlay - ONLY IF NOT REGISTERED */}
              {!isRegistered && (
                  <div className="absolute bottom-0 left-0 right-0 p-8 pt-24 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900/90 flex flex-col items-center justify-end text-center z-20">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 shadow-inner border border-blue-100 dark:border-blue-800/50">
                        <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold font-display text-slate-800 dark:text-white mb-2">View Full Solution</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6 font-medium text-base">
                      Sign up free to unlock the complete step-by-step logic. You get <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold mx-1">3 free answers</span> before KES 20/day premium access!
                    </p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => {
                                setFadedSolutionData(prev => ({ ...prev, show: false }));
                                setShowRegistration(true);
                            }}
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/40"
                        >
                            Sign Up to View Free
                        </button>
                        <button
                            onClick={() => {
                                setFadedSolutionData(prev => ({ ...prev, show: false }));
                                setShowLogin(true);
                            }}
                            className="flex-1 sm:flex-none bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 transition-all"
                        >
                            Log In
                        </button>
                    </div>
                  </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

                <h3 className="text-xl font-black text-slate-800 mb-2">Continue Guided Learning</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {(() => {
                    const ctx = getPaywallActionContext(pendingPaywallAction);
                    return (
                      <>
                        You already <span className="font-bold text-slate-700">{ctx.completed}</span>. Choose a learner plan to <span className="font-bold text-slate-700">{ctx.next}</span> and keep your progress proof in one place.
                      </>
                    );
                  })()}
                </p>

                <div className="mb-6 bg-indigo-50 rounded-2xl border border-indigo-100 p-4 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">What parents and learners get</p>
                  <ul className="space-y-1.5 text-xs font-bold text-slate-700">
                    <li>Step-by-step Ask Akili help that asks the learner to try first</li>
                    <li>High daily limits for quizzes, instant marking, and repair drills</li>
                    <li>Notes, past papers, and shareable parent progress proof</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button
                    fullWidth
                    onClick={() => {
                      trackFunnelEvent('pricing_opened', {
                        source: 'learner_limit_modal',
                        role: role || 'GUEST',
                        action_type: pendingPaywallAction?.type || 'UNKNOWN'
                      });
                      setShowLimitModal(false);
                      handlePricingNavigation();
                    }}
                    className="py-4 text-base shadow-xl shadow-indigo-200"
                  >
                    View Learner Plans
                  </Button>
                  <button
                    onClick={() => {
                      trackFunnelEvent('credit_pack_selected', {
                        source: 'learner_limit_modal',
                        credits: LEARNING_CREDIT_PACKS[0].credits,
                        amount_kes: LEARNING_CREDIT_PACKS[0].price
                      });
                      setShowLimitModal(false);
                      setSelectedPlan(LEARNING_CREDIT_PACKS[0]);
                      setMode('PAYMENT' as any);
                    }}
                    className="w-full rounded-2xl border-2 border-indigo-100 bg-indigo-50 px-4 py-3 text-left hover:border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Need just a top-up?</span>
                    <span className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-slate-800">Buy 30 Learning Credits</span>
                      <span className="text-sm font-black text-indigo-700">KES 20</span>
                    </span>
                    <span className="mt-1 block text-[11px] font-bold text-slate-500">
                      Current wallet: {learningCredits} credit{learningCredits === 1 ? '' : 's'}
                    </span>
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      setLoadingText("Verifying Transactions...");
                      try {
                        const success = await verifySubscription();
                        setLoading(false);
                        if (success) {
                          alert("Awesome! Your premium subscription has been successfully restored!");
                          setShowLimitModal(false);
                        } else {
                          // Ask for custom reference code
                          const codeInput = prompt(
                            "Auto-scan did not find a recent payment. If you paid on a different device or account, please enter that device's Student Code (e.g. SOM-1234), your phone number, or receipt reference code to link it:"
                          );
                          if (codeInput && codeInput.trim()) {
                            setLoading(true);
                            setLoadingText("Verifying custom reference...");
                            const customSuccess = await verifySubscription(codeInput.trim());
                            setLoading(false);
                            if (customSuccess) {
                              alert("Awesome! Your premium subscription has been successfully restored!");
                              setShowLimitModal(false);
                            } else {
                              alert("We couldn't verify this payment reference. Please double check the code or contact support.");
                            }
                          }
                        }
                      } catch (err) {
                        setLoading(false);
                        alert("An error occurred during verification. Please try again or refresh the page.");
                      }
                    }}
                    className="w-full text-indigo-600 hover:text-indigo-700 font-bold text-xs uppercase tracking-widest transition-colors py-1 block"
                  >
                    Already subscribed? Restore access
                  </button>
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
                  Your premium access has expired. If you still have learning credits, you can keep using Soma Smart with metered access. Otherwise renew now to continue enjoying <span className="text-indigo-600 font-bold">full plan access</span> to learning for as little as <span className="text-indigo-600 font-bold">20 KES</span>.
                </p>

                <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Wallet status</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {learningCredits > 0
                      ? `${learningCredits} learning credit${learningCredits === 1 ? '' : 's'} available`
                      : 'No learning credits available'}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    fullWidth
                    onClick={() => {
                      if (learningCredits > 0) {
                        setShowExpiryModal(false);
                        setHasRecentPaymentUnlock(true);
                        return;
                      }
                      setShowExpiryModal(false);
                      handlePricingNavigation();
                    }}
                    className="py-4 text-base shadow-xl shadow-red-200 bg-red-600 hover:bg-red-700"
                  >
                    {learningCredits > 0 ? 'Continue with Credits' : 'Renew Now'}
                  </Button>
                  <button
                    onClick={() => {
                      setShowExpiryModal(false);
                      if (learningCredits > 0) setHasRecentPaymentUnlock(true);
                    }}
                    className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    {learningCredits > 0 ? 'Go to Dashboard' : 'Continue to Dashboard'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MASTERY DASHBOARD MODAL */}
      <AnimatePresence>
        {showMasteryDashboard && (
          <MasteryDashboard
            masteryGraph={masteryGraph}
            srItems={dueForReview}
            streak={streak}
            totalXP={totalXP}
            onClose={() => setShowMasteryDashboard(false)}
            onPractice={(topic) => {
              setShowMasteryDashboard(false);
              setPromptText(topic);
              setMode('MENU');
              setTimeout(() => handlePromptSubmit(), 150);
            }}
          />
        )}
      </AnimatePresence>

      {showTutoringModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowTutoringModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-4">Ask a Teacher</h2>
            <p className="text-slate-500 mb-4">Describe your question below:</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade</label>
                <select
                  className="w-full border rounded-xl p-3 bg-slate-50 text-slate-900"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option value="ALL">Select Grade</option>
                  {['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4']
                    .filter(g => {
                      if (studentProfile?.grade) {
                        return isGradeInStudentRange(g, studentProfile.grade);
                      }
                      return getGradeLevel(g) === educationLevel;
                    })
                    .map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                <select
                  className="w-full border rounded-xl p-3 bg-slate-50 text-slate-900"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="ALL">Select Subject</option>
                  {['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE', 'Physics', 'Biology', 'Chemistry', 'History', 'Geography', 'Business Studies', 'Computer', 'Agriculture', 'Indigenous Language', 'Swahili (Kiswahili Sanifu)', 'German', 'Arabic', 'Integrated Science', 'Physical Education (PE)', 'Music'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              className="w-full border rounded-xl p-3 mb-4 text-slate-900"
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
