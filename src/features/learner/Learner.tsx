import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../assets/images/main_logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import {
  Sparkles, Home, X, XCircle, Camera, ScanLine, Mic, Upload, Clock,
  CheckCircle, Play, Pause, ChevronRight, Star, BookOpen, Brain, Lightbulb, Lock, Volume2, CreditCard, Crown,
  ArrowRight, UserCircle, Download, ImageIcon, Trash2, AlertTriangle, LogOut, Users, DollarSign, FileText, ShoppingBag, Library, BookMarked, Layers,
  Calculator, FlaskConical, Globe, Languages, Loader2, Headphones, PenTool, Zap, ListChecks, Trophy, Hand, ClipboardList,
  BookmarkPlus, Share2, Bell, Flame, GraduationCap, School
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExplanationResult, QuizData, ViewState, SubscriptionPlan, LearnerProfile, LearnerActivity, UserRole, PodcastScript, ChatMessage, RevisionMode, TeacherActivity, EducationLevel, StudyNote } from '../../types';
import { PricingPage } from '../subscription/PricingPage';
import { PaymentFlow } from '../subscription/PaymentFlow';
import { LEARNING_CREDIT_PACKS, STUDENT_PLANS, TEACHER_PLANS, DOWNLOAD_PASS } from '../../data/pricing';
import { RegistrationModal } from '../../components/RegistrationModal'; // Assuming path
import { GA_MEASUREMENT_ID } from '../../config/analytics';
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
import { SidebarTab } from '../../components/DashboardSidebar';
import { LearnerHome } from './home/LearnerHome';
import { LearnerSidebar } from './home/LearnerSidebar';
import { classroomService, StudentClassroomSummary } from '../../services/classroomService';
import { getBulkMasteryMemories } from '../../services/learnerMemoryService';
import { getLearnerCtaVariant } from '../../utils/abExperiments';
import { QuestRoadmap } from './QuestRoadmap';
import { LearningPathView } from './LearningPathView';
import { safeImport } from '../../utils/safeImport';
import { PlanLimitError, formatLearningCredits, getPlanLimit, getPlanUsage, getCreditPackExpiry } from '../../services/planLimitService';
import { pesapalService } from '../../services/pesapalService';
import { supabase } from '../../lib/supabase';
import { trackAnalyticsEvent } from '../../services/analyticsEventService';
import { extractTextFromURL } from '../../services/contextService';
import { LearnerNotebook } from './LearnerNotebook';
import { getNotebookOwnerKey, migrateGuestNotebook, saveStudyNote } from '../../services/notebookService';
import { formatAkiliAnswerForWhatsApp, formatParentConnectionForWhatsApp, formatQuizResultForWhatsApp, formatWeeklyProgressForWhatsApp, normalizeWhatsAppPhone, openWhatsAppShare } from '../../services/whatsappService';

const RevisionLanding = React.lazy(() => safeImport(() => import('../revision/RevisionLanding').then(module => ({ default: module.RevisionLanding }))));
const RevisionSession = React.lazy(() => safeImport(() => import('../revision/RevisionSession').then(module => ({ default: module.RevisionSession }))));
const Community = React.lazy(() => safeImport(() => import('../community/Community').then(module => ({ default: module.Community }))));
const LearnerAnalytics = React.lazy(() => safeImport(() => import('./LearnerAnalytics').then(module => ({ default: module.LearnerAnalytics }))));
const ConversationalTutor = React.lazy(() => safeImport(() => import('./ConversationalTutor').then(module => ({ default: module.ConversationalTutor }))));
const ReferralView = React.lazy(() => safeImport(() => import('./ReferralView').then(module => ({ default: module.ReferralView }))));

const loadMemoryService = () => safeImport(() => import('../../services/learnerMemoryService'));

const loadGeminiService = () => safeImport(() => import('../../services/learnerGeminiService'));
import { RateLimitError, transcribeAudioForChat } from '../../services/geminiService';

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
const generateTopicFlashcards = async (...args: any[]) => ((await loadGeminiService()).generateTopicFlashcards as any)(...args);
const generateRevisionTimetable = async (...args: any[]) => ((await loadGeminiService()).generateRevisionTimetable as any)(...args);
const loadElevenLabsService = () => safeImport(() => import('../../services/elevenLabsService'));
const speak = async (...args: any[]) => ((await loadElevenLabsService()).speak as any)(...args);
const stopSpeechElevenLabs = () => { void loadElevenLabsService().then(service => service.stopSpeech()); };
const playPodcast = async (...args: any[]) => ((await loadElevenLabsService()).playPodcast as any)(...args);
const cancelPodcast = () => { void loadElevenLabsService().then(service => service.cancelPodcast()); };

const getBriefDefinition = (explanationText: string, topicName: string): string => {
  if (!explanationText) return '';
  const lines = explanationText.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.toLowerCase().startsWith('curriculum alignment:')) continue;
    if (line.startsWith('#')) continue;
    if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) continue;
    return line;
  }
  return `${topicName} is a key concept in the curriculum. Here are the main takeaways to remember.`;
};

const formatUsageRemaining = (remaining: number, unit: 'calls' | 'characters') => {
  if (unit === 'characters') {
    if (remaining >= 1000) return `${Math.floor(remaining / 1000)}k chars`;
    return `${remaining} chars`;
  }
  return `${remaining} left`;
};



type ContinueLearningSnapshot = {
  topic: string;
  description: string;
  summaryPoints: string[];
  progress: number;
};

const cleanAcademicText = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value
    .replace(String.fromCharCode(0), " ")
    .replace(/\s+/g, " ")
    .replace(/[{}]/g, "")
    .trim();
};

const takeAcademicLead = (value: unknown, maxSentences = 2) => {
  const text = cleanAcademicText(value);
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) || [text];
  return sentences.slice(0, maxSentences).join(" ").replace(/\s+/g, " ").trim();
};

const extractReadablePoints = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return cleanAcademicText(item);
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return cleanAcademicText(record.point || record.title || record.details || record.text);
        }
        return "";
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|\u2022/)
      .map((part) => cleanAcademicText(part))
      .filter(Boolean)
      .slice(0, 3);
  }

  return [];
};

const buildContinueLearningSnapshot = (activity?: LearnerActivity, fallbackTopic = "Photosynthesis"): ContinueLearningSnapshot => {
  const topic = cleanAcademicText(activity?.topic) || fallbackTopic;
  const fallbackDescription = "You were learning about " + topic.toLowerCase() + ".";
  let parsed: Record<string, unknown> | null = null;

  if (typeof activity?.details === "string" && activity.details.trim()) {
    try {
      const decoded = JSON.parse(activity.details);
      if (decoded && typeof decoded === "object") {
        parsed = decoded as Record<string, unknown>;
      }
    } catch {
      parsed = null;
    }
  }

  const explanationRecord = parsed?.explanation && typeof parsed.explanation === "object"
    ? parsed.explanation as Record<string, unknown>
    : null;

  const descriptionCandidates = [
    explanationRecord?.explanation,
    parsed?.explanation,
    parsed?.description,
    parsed?.summaryText,
    parsed?.text,
    activity?.details,
  ];

  let description = "";
  for (const candidate of descriptionCandidates) {
    const lead = takeAcademicLead(candidate, 2);
    if (lead) {
      description = lead;
      break;
    }
  }

  if (!description) {
    description = fallbackDescription;
  }

  const summaryCandidates = [
    explanationRecord?.summaryPoints,
    parsed?.summaryPoints,
    parsed?.summary,
    parsed?.recapNodes,
    explanationRecord?.recapNodes,
  ];

  let summaryPoints: string[] = [];
  for (const candidate of summaryCandidates) {
    summaryPoints = extractReadablePoints(candidate);
    if (summaryPoints.length > 0) break;
  }

  if (summaryPoints.length === 0) {
    summaryPoints = [description];
  }

  const progress = typeof activity?.score === "number"
    ? Math.max(10, Math.min(100, activity.score))
    : activity ? 70 : 35;

  return {
    topic,
    description,
    summaryPoints: summaryPoints.slice(0, 3),
    progress,
  };
};

function getExplanationDepthProfile(grade: string, level: 'Simple' | 'Exam' = 'Simple') {
  const g = String(grade || '').toLowerCase();
  const isLowerPrimary = /(grade\s*[1-3]|grade\s*[4-6]|lower primary|upper primary|kcpe|kpsea)/.test(g);
  const isJunior = /(grade\s*[7-9]|junior|kjsea)/.test(g);
  const isSenior = /(form\s*[1-4]|senior|kcse)/.test(g) || level === 'Exam';

  if (isLowerPrimary) {
    return { label: 'Simple depth', introBlocks: 1, subtopics: 2, recapNodes: 2 };
  }
  if (isJunior) {
    return { label: 'Guided depth', introBlocks: 2, subtopics: 3, recapNodes: 3 };
  }
  if (isSenior) {
    return { label: 'Exam depth', introBlocks: 3, subtopics: 4, recapNodes: 4 };
  }
  return { label: 'Guided depth', introBlocks: 2, subtopics: 3, recapNodes: 3 };
}

function buildDetailedExplanationPreview(explanationText: string, topic: string, grade: string, level: 'Simple' | 'Exam' = 'Simple') {
  const profile = getExplanationDepthProfile(grade, level);
  const rawBlocks = String(explanationText || '')
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^curriculum alignment:/i.test(part));
  const selected = rawBlocks.slice(0, profile.introBlocks);
  if (selected.length > 0) return selected.join('\n\n');
  return `Let's unpack ${topic} step by step for your class level.`;
}

const inferSubjectFromTopic = (topic?: string): string => {
  const lower = (topic || '').toLowerCase();
  if (/(math|equation|algebra|number|fraction|geometry)/.test(lower)) return 'Mathematics';
  if (/(english|grammar|composition|reading|literature)/.test(lower)) return 'English';
  if (/(kiswahili|swahili|translation)/.test(lower)) return 'Kiswahili';
  if (/(photosynthesis|plant|biology|science|leaf|chlorophyll|chemistry|physics)/.test(lower)) return 'Science';
  if (/(social|history|geography|civics|cre)/.test(lower)) return 'Social Studies';
  return '';
};

// ------ Branded lazy-load skeleton ------
const DeferredViewLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-slate-400">
    {/* Animated indigo bar */}
    <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
    pronunciation: "/strand/"
  },
  "sub-strand": {
    definition: "A smaller sub-topic or specific learning unit under a broader Strand in the syllabus.",
    translation: "Mada Ndogo (Kijisehemu cha mada kuu katika mtaala).",
    pronunciation: "/sub-strand/"
  },
  competency: {
    definition: "The ability to apply knowledge, skills, values, and attitudes to successfully perform tasks in daily life.",
    translation: "Uwezo (Ujuzi na stadi za kutenda jambo na kutatua matatizo).",
    pronunciation: "/competency/"
  },
  assessment: {
    definition: "The systematic process of gathering evidence of a learner's progress, understanding, and performance.",
    translation: "Tathmini (Utaratibu wa kukadiria kiwango cha uelewa wa mwanafunzi).",
    pronunciation: "/assessment/"
  },
  kicd: {
    definition: "Kenya Institute of Curriculum Development - the official government body responsible for designing school curricula.",
    translation: "Taasisi ya Ukuzaji Mtaala ya Kenya (Inayohusika na kuandaa masomo).",
    pronunciation: "/kcid/"
  },
  knec: {
    definition: "Kenya National Examinations Council - the official national body responsible for setting, administering, and marking primary and secondary exams.",
    translation: "Baraza la Mitihani la Kitaifa la Kenya (Linaloandaa na kusimamia mitihani).",
    pronunciation: "/kinek/"
  },
  kpsea: {
    definition: "Kenya Primary School Education Assessment - the national evaluation done at the end of Grade 6 under the CBC system.",
    translation: "Tathmini ya Elimu ya Msingi ya Kenya (Mitihani ya mwisho wa Gredi ya 6).",
    pronunciation: "/kay-pi-es-i-ay/"
  },
  kcse: {
    definition: "Kenya Certificate of Secondary Education - the national examination taken at the end of secondary school (Form 4).",
    translation: "Cheti cha Elimu ya Sekondari ya Kenya (Mtihani wa mwisho wa sekondari).",
    pronunciation: "/kcse-s-i/"
  },
  values: {
    definition: "Core principles such as love, respect, unity, and integrity integrated into lessons to shape character.",
    translation: "Maadili (Nguzo za tabia njema na utu zinazofunzwa shuleni).",
    pronunciation: "/values/"
  },
  uzalendo: {
    definition: "A core social value representing patriotism, love for country, and active citizenship in the Kenyan society.",
    translation: "Patriotism (Uzalendo na mapenzi ya dhati kwa nchi yako ya Kenya).",
    pronunciation: "/oo-zah-len-doh/"
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
      if (GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
        ReactGA.event(eventName, params);
      }
      void trackAnalyticsEvent({
        eventType: 'FUNNEL',
        eventName,
        path: `${window.location.pathname}${window.location.search}`,
        metadata: params,
      });
    } catch (_) {
      // Non-blocking analytics
    }
  }, []);

  // Preserve intent from in-app navigation and public search landing pages.
  const publicStart = new URLSearchParams(location.search).get('start');
  const publicStartMap: Record<string, { tab: SidebarTab; intent: 'ask_akili' | 'official_library' | 'exam_prep_papers' | 'listen_and_learn' }> = {
    'ask-akili': { tab: 'SMART_TUTOR', intent: 'ask_akili' },
    library: { tab: 'RESOURCES', intent: 'official_library' },
    'exam-prep': { tab: 'SUBJECTS', intent: 'exam_prep_papers' },
    listen: { tab: 'TALKBACK', intent: 'listen_and_learn' },
  };
  const publicDestination = publicStart ? publicStartMap[publicStart] : undefined;
  const initialTab = ((location.state as any)?.targetTab as SidebarTab | undefined) || publicDestination?.tab || 'HOME';
  const initialTargetIntent = ((location.state as any)?.targetIntent as
    | 'ask_akili'
    | 'official_library'
    | 'exam_prep_papers'
    | 'listen_and_learn'
    | undefined) || publicDestination?.intent;
  const initialMode = initialTab === 'SMART_TUTOR' || initialTab === 'HOMEWORK' ? 'SCAN_EXPLAIN' :
    initialTab === 'NOTEBOOK' ? 'NOTEBOOK' :
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
    // Handle 'PRO' legacy tier or fuzzy matching
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


  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied'>(
    () => typeof Notification !== 'undefined' ? Notification.permission as 'default' | 'granted' | 'denied' : 'default'
  );
  const [joinedClassNotice, setJoinedClassNotice] = useState<string | null>(null);
  const [studentClasses, setStudentClasses] = useState<StudentClassroomSummary[]>([]);
  const [isLoadingStudentClasses, setIsLoadingStudentClasses] = useState(false);
  const [classLeaderboards, setClassLeaderboards] = useState<Record<string, { name: string; xp: number; isMe: boolean }[]>>({});
  const prevStreakRef = useRef(streak);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
    if (!studentClasses.length) return;
    let mounted = true;
    (async () => {
      const boards: Record<string, { name: string; xp: number; isMe: boolean }[]> = {};
      for (const item of studentClasses.slice(0, 2)) {
        const classId = item.class.id;
        if (classId.startsWith('local-class:')) continue;
        try {
          const roster = await classroomService.getClassRoster(classId);
          if (!roster.length) continue;
          const ids = roster.map(r => r.student_id);
          const memories = await getBulkMasteryMemories(ids);
          const rows = roster.map(r => {
            const mem = memories.find(m => m.learner_id === r.student_id);
            return {
              name: r.profiles?.name || 'Learner',
              xp: mem?.total_xp || 0,
              isMe: r.student_id === (userId || studentProfile?.id),
            };
          }).sort((a, b) => b.xp - a.xp).slice(0, 5);
          boards[classId] = rows;
        } catch { /* silent */ }
      }
      if (mounted) setClassLeaderboards(boards);
    })();
    return () => { mounted = false; };
  }, [studentClasses, userId, studentProfile?.id]);

  useEffect(() => {
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

  useEffect(() => {
    if (isRegistered && !studentProfile?.grade && !localStorage.getItem('soma_onboarded')) {
      const t = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(t);
    }
  }, [isRegistered, studentProfile?.grade]);

  const [mode, setMode] = useState<'MENU' | 'SCAN' | 'RESULT' | 'QUIZ' | 'RECAP_RESULT' | 'PROFILE' | 'PRICING' | 'PAYMENT' | 'MARKETPLACE' | 'LIBRARY' | 'HISTORY' | 'SCAN_EXPLAIN' | 'STUDY' | 'REQUESTS' | 'COMMUNITY' | 'REVISION' | 'REVISION_SESSION' | 'ANALYTICS' | 'TALKBACK' | 'REFERRAL' | 'QUEST_MAP' | 'FLASHCARDS' | 'NOTEBOOK' | 'RESOURCES'>(initialMode as any);

  // --- LEARNER MEMORY (Cloud Sync + Personalized Greeting) ---
  const [showMasteryDashboard, setShowMasteryDashboard] = useState(false);
  const [cloudMemoryRow, setCloudMemoryRow] = useState<any>(null);
  const [questSubTabState, setQuestSubTabState] = useState<'MAP' | 'PATH'>('MAP');

  // Load mastery from cloud on mount (registered users only)
  useEffect(() => {
    const learnerId = studentCode || studentProfile?.id;
    if (!learnerId) return; // Guest - localStorage only
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
  const [revisionInitialSubject, setRevisionInitialSubject] = useState<string>('All');
  const [revisionInitialSearchQuery, setRevisionInitialSearchQuery] = useState<string>('');
  const [completedRecallChecks, setCompletedRecallChecks] = useState<number[]>([]);
  const [recallRewarded, setRecallRewarded] = useState(false);
  const [showExitRecallPrompt, setShowExitRecallPrompt] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);
  const [studyMissionChecks, setStudyMissionChecks] = useState<number[]>([]);
  const [studyMissionRewarded, setStudyMissionRewarded] = useState(false);
  const [activeRevisionSession, setActiveRevisionSession] = useState<{ data: any, mode: RevisionMode } | null>(null);
  const [recapData, setRecapData] = useState<any>(null); // Store LessonRecap

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; action?: 'voice_retry' | 'paywall' | 'go_home' | 'menu' } | null>(null);
  const [micPermissionNotice, setMicPermissionNotice] = useState(false);
  const voiceSubmitTimerRef = useRef<number | null>(null);
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState<1 | 2>(1);
  const [onboardGrade, setOnboardGrade] = useState('');
  const [showQuizSharePrompt, setShowQuizSharePrompt] = useState<{ score: number; topic: string } | null>(null);
  const [parentPhoneDraft, setParentPhoneDraft] = useState(studentProfile?.parentPhone || '');
  const [parentConsent, setParentConsent] = useState(Boolean(studentProfile?.parentWhatsAppConsentAt));

  useEffect(() => {
    setParentPhoneDraft(studentProfile?.parentPhone || '');
    setParentConsent(Boolean(studentProfile?.parentWhatsAppConsentAt));
  }, [studentProfile?.parentPhone, studentProfile?.parentWhatsAppConsentAt]);

  // Study timer
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) { clearInterval(timerRef.current!); setTimerActive(false); setTimerDone(true); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  // Offline saves
  const OFFLINE_KEY = 'soma_offline_saves';
  const getOfflineSaves = (): { id: string; topic: string; content: string; subject: string; savedAt: string }[] => {
    try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]'); } catch { return []; }
  };
  const saveForOffline = (topic: string, content: string, subject: string) => {
    const saves = getOfflineSaves();
    if (saves.find(s => s.topic === topic)) { triggerToast('Already saved for offline.'); return; }
    saves.unshift({ id: Date.now().toString(), topic, content, subject, savedAt: new Date().toLocaleDateString() });
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(saves.slice(0, 20)));
    triggerToast('Saved for offline reading');
  };

  // Ask teacher state
  const [askTeacherClassId, setAskTeacherClassId] = useState<string | null>(null);
  const [askTeacherText, setAskTeacherText] = useState('');
  const [askTeacherSending, setAskTeacherSending] = useState(false);

  // Topic flashcards (inline in RESULT mode)
  const [topicFlashcards, setTopicFlashcards] = useState<{ term: string; definition: string }[]>([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [flashcardGot, setFlashcardGot] = useState<Set<number>>(new Set());
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);

  // Revision timetable
  const TIMETABLE_KEY = 'soma_revision_timetable';
  const getTimetable = (): { examDate: string; days: { date: string; dayLabel: string; subject: string; topics: string; duration: string; done?: boolean }[] } | null => {
    try { return JSON.parse(localStorage.getItem(TIMETABLE_KEY) || 'null'); } catch { return null; }
  };
  const [timetable, setTimetable] = useState(() => getTimetable());
  const [showTimetableBuilder, setShowTimetableBuilder] = useState(false);
  const [timetableExamDate, setTimetableExamDate] = useState('');
  const [timetableSubjects, setTimetableSubjects] = useState('');
  const [timetableLoading, setTimetableLoading] = useState(false);

  // PWA install banner (shows after 2nd session if install prompt available)
  const [pwaBannerDismissed, setPwaBannerDismissed] = useState(() => localStorage.getItem('soma_pwa_dismissed') === '1');
  const [pwaVisitReady, setPwaVisitReady] = useState(false);
  useEffect(() => {
    const count = parseInt(localStorage.getItem('soma_visit_count') || '0', 10) + 1;
    localStorage.setItem('soma_visit_count', String(count));
    if (count >= 2) setPwaVisitReady(true);
  }, []);
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
  const [voiceTranscriptPreview, setVoiceTranscriptPreview] = useState<string | null>(null);
  const [groundedAnswerMode, setGroundedAnswerMode] = useState(() => localStorage.getItem('soma_grounded_answer_mode') !== 'off');

  useEffect(() => {
    localStorage.setItem('soma_grounded_answer_mode', groundedAnswerMode ? 'on' : 'off');
  }, [groundedAnswerMode]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveExplanationToNotebook = () => {
    if (!explanation) return;
    const note = saveStudyNote(notebookOwnerKey, {
      title: explanation.topic,
      topic: explanation.topic,
      content: [
        ...(explanation.summaryPoints || []),
        explanation.explanation,
      ].filter(Boolean).join('\n\n'),
      subject: currentDocument?.subject || 'General',
      grade: studentProfile?.grade || currentDocument?.grade || '',
      source: 'ai_answer',
      masteryStatus: 'learning',
      userId: userId || undefined,
      studentCode: studentCode || undefined,
    });

    if (isRegistered) {
      saveActivity({
        id: 'notebook-' + note.id,
        type: 'STUDY',
        topic: note.topic || note.title,
        date: new Date().toLocaleDateString(),
        details: JSON.stringify({
          mode: 'notebook_saved',
          noteId: note.id,
          subject: note.subject,
          grade: note.grade,
        }),
      });
    }

    trackFunnelEvent('notebook_saved', {
      source: 'ask_akili_result',
      subject: note.subject,
      registered: isRegistered,
    });
    triggerToast(isRegistered ? 'Saved to My Notebook.' : 'Saved on this device. Register later to protect it.');
  };
  const handleShareExplanationToWhatsApp = (destination: 'contact' | 'parent') => {
    if (!explanation) return;
    openWhatsAppShare(formatAkiliAnswerForWhatsApp({
      topic: explanation.topic,
      explanation: explanation.explanation,
      summaryPoints: explanation.summaryPoints,
      subject: currentDocument?.subject || 'General',
      grade: studentProfile?.grade || currentDocument?.grade || '',
    }), destination === 'parent' && studentProfile?.parentWhatsAppConsentAt ? studentProfile?.parentPhone : undefined);
    trackFunnelEvent('akili_answer_whatsapp_share', {
      destination,
      subject: currentDocument?.subject || 'General',
      registered: isRegistered,
    });
  };
  const handleShareQuizResultToWhatsApp = (destination: 'contact' | 'parent') => {
    if (!showQuizSharePrompt) return;
    openWhatsAppShare(formatQuizResultForWhatsApp({
      topic: showQuizSharePrompt.topic,
      score: showQuizSharePrompt.score,
      grade: studentProfile?.grade || '',
    }), destination === 'parent' && studentProfile?.parentWhatsAppConsentAt ? studentProfile?.parentPhone : undefined);
    trackFunnelEvent('quiz_whatsapp_share', {
      destination,
      score: showQuizSharePrompt.score,
      registered: isRegistered,
    });
    setShowQuizSharePrompt(null);
  };
  const handleRateLimitError = (error: any) => {
    setLoading(false);
    setMode('MENU');
    const message = error?.message || '';
    let feature = 'ai_generation';
    let action: PendingPaywallAction = { type: 'STUDY_CHAT', query: '' };
    if (message.includes('grounded') || message.includes('library')) {
      feature = 'grounded_library_help';
      action = { type: 'TOPIC_CLICK', topic: currentDocument?.topic || 'Library help' };
    } else if (message.includes('listen and learn') || message.includes('listen_and_learn')) {
      feature = 'listen_and_learn';
      action = { type: 'TALKBACK_MESSAGE' };
    } else if (message.includes('voice') || message.includes('audio') || message.includes('listen')) {
      feature = 'listen_and_learn_voice';
      action = { type: 'VOICE_QUESTION' };
    } else if (message.includes('exam') || message.includes('marking')) {
      feature = 'exam_marking';
      action = { type: 'REVISION_ENTRY' };
    } else if (message.includes('quiz')) {
      feature = 'quiz_generation';
      action = { type: 'STUDY_QUIZ' };
    }
    setPendingPaywallAction(action);
    setShowLimitModal(true);
    const featureLabelMap: Record<string, string> = {
      ai_generation: 'AI Tutor',
      grounded_library_help: 'Library Help',
      listen_and_learn: 'Listen & Learn',
      listen_and_learn_voice: 'Voice Lessons',
      exam_marking: 'Smart Marking',
      quiz_generation: 'Quiz Generation',
      exam_guru: 'Exam Guru',
    };
    try {
      window.dispatchEvent(new CustomEvent('soma-show-upgrade-modal', {
        detail: {
          feature,
          featureLabel: featureLabelMap[feature] || 'AI Tutor',
          plan: subscriptionPlan || 'FREE',
          limit: getPlanLimit(feature, subscriptionPlan || 'FREE')
        }
      }));
    } catch (_) { /* ignore */ }
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
    citation = `"${cleanText}" - Soma AI Library: Grade ${currentDocument.grade || 'N/A'} ${currentDocument.subject || 'General'} (${currentDocument.title}). Reference ID: ${currentDocument.realId || currentDocument.id}`;
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
      const escapedSearch = search.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
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
      const escapedTerm = term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
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
            <span className="text-[10px] text-indigo-400">Guide</span>
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
    if (learningCredits > 0) return false;

    const resolveProfileId = async () => {
      if (studentProfile?.id) return studentProfile.id;
      if (userId) return userId;

      const savedStudentCode = (localStorage.getItem('soma_active_student') || '').trim().toUpperCase();
      if (!savedStudentCode) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', savedStudentCode)
        .maybeSingle();

      return profile?.id || null;
    };

    const profileId = await resolveProfileId();
    if (!profileId) return false;

    try {
      const lastReference = localStorage.getItem('soma_last_payment_reference') || '';
      const query = supabase
        .from('transactions')
        .select('reference_code, user_id, amount, status, description, created_at, order_tracking_id')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: txs, error } = lastReference
        ? await query.or(`user_id.eq.${profileId},reference_code.eq.${lastReference}`)
        : await query.eq('user_id', profileId);

      if (error || !txs?.length) return false;

      for (const tx of txs as Array<any>) {
        const reference = String(tx.reference_code || '');
        const recoveryKey = `soma_credit_recovered_${reference || tx.created_at}`;
        if (localStorage.getItem(recoveryKey) === '1') continue;

        let status = String(tx.status || '').toUpperCase();
        let remoteStatus: any = null;
        if (status !== 'SUCCESS' && reference && tx.order_tracking_id) {
          try {
            remoteStatus = await pesapalService.checkTransactionStatus({
              merchantReference: reference,
              orderTrackingId: tx.order_tracking_id
            });
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
        const expiry = getCreditPackExpiry(amount === 20 ? 'DAILY' : amount === 50 ? 'WEEKLY' : amount === 100 ? 'MONTHLY' : null);

        if (credits <= 0) continue;

        grantLearningCredits(credits, expiry);
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
  }, [learningCredits, studentProfile?.id, userId, grantLearningCredits]);

  useEffect(() => {
    restoreMissingCreditWallet();
  }, [restoreMissingCreditWallet]);

  useEffect(() => {
    if (isPro || subscriptionRepairAttemptedRef.current) return;
    subscriptionRepairAttemptedRef.current = true;
    verifySubscription().catch((err) => {
      console.warn('Subscription self-heal check failed:', err);
    });
  }, [isPro, verifySubscription]);

  useEffect(() => {
    if (learningCredits > 0) return;
    const reference = localStorage.getItem('soma_last_payment_reference') || '';
    if (!reference.startsWith('CREDIT_') || creditRecoveryAttemptedRef.current === reference) return;
    if (localStorage.getItem(`soma_credit_recovered_${reference}`) === '1') return;

    const recoverCreditPayment = async () => {
      try {
        const { data: tx } = await supabase
          .from('transactions')
          .select('status, amount, order_tracking_id')
          .eq('reference_code', reference)
          .maybeSingle();

        if (!tx?.order_tracking_id) return;

        creditRecoveryAttemptedRef.current = reference;
        const status = await pesapalService.checkTransactionStatus({
          merchantReference: reference,
          orderTrackingId: tx.order_tracking_id
        });
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
        const expiry = getCreditPackExpiry(lastAmount === 20 ? 'DAILY' : lastAmount === 50 ? 'WEEKLY' : lastAmount === 100 ? 'MONTHLY' : null);

        if (credits <= 0) return;
        grantLearningCredits(credits, expiry);
        localStorage.setItem(`soma_credit_recovered_${reference}`, '1');
        setShowLimitModal(false);
        setShowExpiryModal(false);
        setHasRecentPaymentUnlock(true);
      } catch (err) {
        console.warn('Credit payment recovery failed:', err);
      }
    };

    recoverCreditPayment();
  }, [learningCredits, grantLearningCredits]);

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
  const [libraryItemPreview, setLibraryItemPreview] = useState<any>(null);
  const [activeLibraryCategory, setActiveLibraryCategory] = useState<'ALL' | 'PAST_PAPER' | 'NOTES'>('ALL');
  const [activeLibrarySubject, setActiveLibrarySubject] = useState<string>('ALL');
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
      case 'VOICE_QUESTION':
        return { completed: 'used voice question support', next: 'continue asking questions by voice and text' };
      default:
        return { completed: 'used your free learning credits', next: 'continue learning without interruption' };
    }
  };
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL'); // New Filter
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'SOMO' | 'TEACHERS'>('ALL'); // New Filter
  const [pendingMaterialId, setPendingMaterialId] = useState<string | null>(null);
  const enrolledGrade = studentProfile?.grade || '';
  const hasAppliedEnrolledGradeRef = React.useRef(false);
  const [currentDocument, setCurrentDocument] = useState<any>(null);

  useEffect(() => {
    if (!enrolledGrade || hasAppliedEnrolledGradeRef.current) return;
    setSelectedGrade(enrolledGrade);
    hasAppliedEnrolledGradeRef.current = true;
  }, [enrolledGrade]);

  const tutorSyllabusContext = React.useMemo(() => {
    const grade = studentProfile?.grade || currentDocument?.grade || educationLevel || '';
    const subject = currentDocument?.subject || '';
    const topic = currentDocument?.title || '';
    const sourceTitle = currentDocument?.title || currentDocument?.subject || '';
    if (!grade && !subject && !topic && !sourceTitle) return undefined;
    return { grade, subject, topic, sourceTitle };
  }, [studentProfile?.grade, currentDocument?.grade, currentDocument?.subject, currentDocument?.title, educationLevel]);

  const buildSyllabusPromptContext = React.useCallback((basePrompt: string) => {
    const pieces: string[] = [];
    const grade = studentProfile?.grade || currentDocument?.grade || educationLevel || '';
    if (grade) pieces.push(`Grade: ${grade}`);
    if (currentDocument?.subject) pieces.push(`Subject: ${currentDocument.subject}`);
    if (currentDocument?.title) pieces.push(`Topic: ${currentDocument.title}`);
    if (pieces.length === 0) return basePrompt;
    return `${basePrompt}

Syllabus context:
${pieces.join('\n')}

Stay anchored to this context unless I ask for something broader.`;
  }, [studentProfile?.grade, currentDocument?.grade, currentDocument?.subject, currentDocument?.title, educationLevel]);

  const buildFocusedStartupPrompt = React.useCallback((basePrompt: string) => {
    const pieces: string[] = [];
    const grade = studentProfile?.grade || currentDocument?.grade || educationLevel || '';
    if (grade) pieces.push(`Grade: ${grade}`);
    if (currentDocument?.subject) pieces.push(`Subject: ${currentDocument.subject}`);
    if (currentDocument?.title) pieces.push(`Topic: ${currentDocument.title}`);
    if (pieces.length === 0) return basePrompt;
    return `${basePrompt}

Startup rule:
- Start with one short answer or one short check question, not a lecture.
- Stay on the current lesson/topic until the learner asks to move on.
- End with one useful follow-up question to keep the learner thinking.

Syllabus context:
${pieces.join('\n')}

Stay anchored to this context unless I ask for something broader.`;
  }, [studentProfile?.grade, currentDocument?.grade, currentDocument?.subject, currentDocument?.title, educationLevel]);


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
      structured_questions: r.structured_questions,
      exam_instructions: r.exam_instructions,
      exam_type: r.exam_type,
      exam_year: r.exam_year,
      paper_code: r.paper_code,
      paper_number: r.paper_number,
      duration_minutes: r.duration_minutes,
      total_marks: r.total_marks,
      source: r.source,
      marking_scheme_source: r.marking_scheme_source,
      indexing_status: r.indexing_status,
      indexed_at: r.indexed_at,
      chunk_count: r.chunk_count,
      last_index_error: r.last_index_error,
      rating: r.rating || 0,
      downloadCount: r.download_count || 0,
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
    
    if (materialCluster === 'UNKNOWN' || (materialCluster as string) === 'all') return true;
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
      setActiveRevisionSession({ data: material, mode: RevisionMode.EXAM });
      setMode('REVISION_SESSION');
      return;
    }

    // Paywall Check: 5 free usages for non-pro users
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

      const startupPrompt = buildFocusedStartupPrompt(query || (pendingMedia?.type === 'AUDIO' ? "Voice Message" : "Image/File Analysis"));
      const finalQuery = activePageText
        ? `Here is the context from the page of the study material the student is currently reading:\n"""\n${activePageText}\n"""\n\nStartup rule: start with one short answer or one short check question, then ask one follow-up.\n\nQuestion: ${query || (pendingMedia?.type === 'AUDIO' ? "Voice Message" : "Image/File Analysis")}`
        : startupPrompt;




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
  const notebookOwnerKey = React.useMemo(
    () => getNotebookOwnerKey(studentCode, userId),
    [studentCode, userId]
  );

  useEffect(() => {
    if (!isRegistered || notebookOwnerKey === 'guest') return;
    const migratedCount = migrateGuestNotebook(notebookOwnerKey);
    if (migratedCount > 0) {
      trackFunnelEvent('guest_notebook_migrated', { note_count: migratedCount });
    }
  }, [isRegistered, notebookOwnerKey, trackFunnelEvent]);

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
    | { type: 'TALKBACK_MESSAGE' }
    | { type: 'VOICE_QUESTION' };
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
      case 'NOTEBOOK':
        runWithRecallExitGuard(() => setMode('NOTEBOOK'));
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
      setRevisionInitialSubject(currentDocument?.subject || 'All');
      setRevisionInitialSearchQuery(currentDocument?.title || currentDocument?.subject || '');
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
    if (usageCount >= 5) {
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

  const startVoiceQuestion = async () => {
    // ConversationalTutor (TALKBACK) manages its own recording - don't interfere.
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
        console.log('Voice question recorder stopped. Chunks:', chunksRef.current.length);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach(t => t.stop());

        if (blob.size === 0) {
          setIsRecording(false);
          setError({ title: 'Voice Not Captured', message: 'We could not hear a clear question. Please try again.', action: 'voice_retry' });
          return;
        }

        setLoading(true);
        setLoadingText('Transcribing your question...');
        setMode('SCAN');

        try {
          const transcriptFile = new File([blob], `voice_${Date.now()}.webm`, { type: mimeType });
          const base64Data = await fileToGenerativePart(transcriptFile);
          const transcript = (await transcribeAudioForChat(base64Data, mimeType, language === 'SW' ? 'sw' : 'en')).trim();

          if (!transcript) {
            setError({ title: 'Voice Not Clear', message: 'I could not transcribe that recording. Please try again closer to the microphone.', action: 'voice_retry' });
            return;
          }

          setVoiceTranscriptPreview(transcript);
          setPromptText(transcript);
          if (voiceSubmitTimerRef.current) window.clearTimeout(voiceSubmitTimerRef.current);
          voiceSubmitTimerRef.current = window.setTimeout(async () => {
            try {
              await handlePromptSubmit(transcript);
            } finally {
              setVoiceTranscriptPreview(null);
            }
          }, 1200);
        } catch (err: any) {
          console.error('Voice transcription failed:', err);
          const voiceLimitReached = err instanceof RateLimitError || err?.name === 'RateLimitError';
          if (voiceLimitReached) {
            setError(null);
            setPendingPaywallAction({ type: 'VOICE_QUESTION' });
            setMode('MENU');
            setShowLimitModal(true);
          } else {
            setError({
              title: 'Voice Question Failed',
              message: err?.message || 'We could not transcribe your voice question. Please try again.',
              action: 'voice_retry'
            });
          }
        } finally {
          setLoading(false);
          setIsRecording(false);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      console.log('Voice question recording started...');
    } catch (e: any) {
      console.error('Failed to start voice question recording:', e);
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
        title: 'Microphone Error',
        message: 'Your browser could not start the microphone. Check that your device has a working mic, then try again.'
      });
    }
  };

  const startRecording = async () => {
    // ConversationalTutor (TALKBACK) manages its own recording - don't interfere.
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
        } else if ((mode as string) === 'TALKBACK') {
          // ConversationalTutor has its own recording system - do NOT navigate away.
          console.log("Global recorder stopped in TALKBACK mode - ignoring.");
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

  useEffect(() => {
    return () => {
      if (voiceSubmitTimerRef.current) {
        window.clearTimeout(voiceSubmitTimerRef.current);
      }
    };
  }, []);

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
    const savedPin = sessionStorage.getItem('soma_student_pin_session');
    if (!savedStudentCode || !savedPin) return false;

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

      const startupPrompt = buildFocusedStartupPrompt(topic || (multimedia?.mimeType.includes('audio') ? "Voice Message" : "Image Analysis"));

      const result = await explainTopic(
        startupPrompt,
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
      // Build a natural spoken script - avoid raw markdown being read aloud
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
        setError(null);
        setPendingPaywallAction({ type: 'PODCAST' });
        setMode('MENU');
        setShowLimitModal(true);
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
      answer: "Raw Materials:\n- Carbon dioxide (absorbed through stomata)\n- Water (absorbed through roots)\n\nProducts:\n- Glucose (chemical energy stored as starch)\n- Oxygen gas (released as a byproduct through stomata)\n\nReaction Equation:\n6CO2 + 6H2O + light -> C6H12O6 + 6O2",
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
            answer: "Quadratic Formula:\nx = [-b +/- sqrt(b2 - 4ac)] / (2a)\n\nDiscriminant (D = b2 - 4ac):\n1. D > 0: Two distinct real roots.\n2. D = 0: One repeated real root (equal roots).\n3. D < 0: Two complex/imaginary roots."
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
          <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>

            <div className="bg-white backdrop-blur-xl border border-slate-200 p-8 md:p-12 rounded-3xl max-w-xl w-full text-center shadow-xl relative z-10 animate-fade-in">
              <div className="w-20 h-20 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-indigo-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2 tracking-wide font-sans">Deck Mastered!</h1>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed font-sans font-medium">
                {"Fantastic job! You've successfully finished this spaced-repetition active recall session."}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Reviewed</p>
                  <p className="text-2xl font-black text-white">{flashcardItems.length} Cards</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center items-center">
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
                  className="px-8 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all active:scale-95 duration-200 cursor-pointer text-center"
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
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-4 md:p-8 select-none relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

          {/* HEADER BAR */}
          <div className="max-w-4xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl relative z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('MENU')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center group active:scale-95"
              >
                <ArrowRight className="rotate-180 w-4 h-4 text-slate-600 group-hover:text-white" />
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
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
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
              <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-lg">
                <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Queue is Clear!</h2>
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
                  <div className="w-full bg-white border border-slate-200 rounded-full h-2 overflow-hidden p-0.5">
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
                      className="absolute inset-0 w-full h-full p-6 md:p-8 rounded-3xl border border-slate-200 bg-white flex flex-col justify-between overflow-y-auto select-none shadow-2xl"
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
                      className="absolute inset-0 w-full h-full p-6 md:p-8 rounded-3xl border border-indigo-200 bg-white flex flex-col justify-between overflow-y-auto select-none shadow-2xl"
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
                      { name: 'Again', score: 20, desc: 'Forgot completely', color: 'from-rose-500/10 to-rose-600/10 border-rose-500/20 text-rose-400 hover:from-rose-500 hover:to-rose-600' },
                      { name: 'Hard', score: 50, desc: 'Struggled a lot', color: 'from-amber-500/10 to-amber-600/10 border-amber-500/20 text-amber-400 hover:from-amber-500 hover:to-amber-600' },
                      { name: 'Good', score: 80, desc: 'Remembered well', color: 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:from-emerald-500 hover:to-emerald-600' },
                      { name: 'Easy', score: 100, desc: 'Fluent / Perfect', color: 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:from-indigo-500 hover:to-indigo-600' }
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
      const subjectsForPath = [...new Set(weakTopicsForPath.map(t => t.split(' - ')[0] || t.split(':')[0]).filter(Boolean))].slice(0, 4);

      return (
        <div className="pb-24">
          {/* Sub-tab switcher */}
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-3 flex gap-2">
            {(['MAP', 'PATH'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setQuestSubTabState(tab)}
                className={`flex-1 py-2 text-sm font-black rounded-xl transition-all ${
                  questSubTabState === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 dark:text-slate-400 hover:bg-slate-200 hover:bg-slate-50'
                }`}
              >
            {tab === 'MAP' ? 'Quest Map' : 'My Path'}
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
                streak={cloudMemoryRow?.streak_days - 0}
                avgScore={cloudMemoryRow?.avg_score - 0}
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
            initialSubject={revisionInitialSubject}
            initialSearchQuery={revisionInitialSearchQuery}
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
            syllabusContext={tutorSyllabusContext}
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
        <div className="fixed inset-0 z-[60] bg-white/85 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col md:aspect-[3/4] h-full md:h-auto max-h-[90vh]"
          >
          {/* TOP BAR */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
              <div className="text-white/90">
                <p className="font-bold text-lg shadow-sm">Take Photo</p>
                <p className="text-xs font-medium opacity-80">Fit question in frame</p>
              </div>
              <button
                onClick={() => setShowCamera(false)}
                className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewport */}
            <div className="flex-1 relative bg-slate-50">
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
            <div className="bg-white/95 backdrop-blur-xl p-6 md:p-8 flex items-center justify-around gap-6 relative z-20 border-t border-slate-200">

              {/* Switch to Audio */}
              <button
                onClick={() => {
                  setShowCamera(false);
                  setTimeout(() => startRecording(), 100);
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center group-hover:bg-slate-50 transition-colors border border-slate-200 group-active:scale-95">
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
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center group-hover:bg-slate-50 transition-colors border border-slate-200 group-active:scale-95">
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
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800 dark:text-slate-100 w-full">
          <div className="bg-white p-6 sticky top-0 z-10 shadow-sm flex items-center gap-4 border-b border-slate-200">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 hover:bg-slate-50 rounded-full transition-colors"><ArrowRight className="w-6 h-6 rotate-180 dark:text-slate-400" /></button>
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
                  <li key={i} className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-sm flex gap-3">
                    <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
                    <span className="text-sm dark:text-slate-600">{p}</span>
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
            {error.action === 'voice_retry' ? (
              <Button variant="ghost" fullWidth onClick={() => {
                const retry = startVoiceQuestion;
                setError(null);
                void retry();
              }}>
                Try Voice Again
              </Button>
            ) : error.action === 'paywall' ? (
              <Button variant="ghost" fullWidth onClick={() => {
                setError(null);
                setShowLimitModal(true);
              }}>
                View learner plans
              </Button>
            ) : error.action === 'go_home' ? (
              <Button variant="ghost" fullWidth onClick={() => { setError(null); setMode('MENU'); }}>
                Continue typing instead
              </Button>
            ) : (
              <Button variant="ghost" fullWidth onClick={() => setError(null)}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (mode === 'REQUESTS') {
      // If a chat is open, show the chat view
      if (chatRequestId) {
        const chatReq = activeTutoringRequests.find(r => r.id === chatRequestId);
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 dark:text-slate-100 w-full relative">
            {/* Chat Header */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center gap-4">
              <button onClick={() => { setChatRequestId(null); setChatInput(''); }} className="p-2 hover:bg-slate-100 hover:bg-slate-50 rounded-full transition-colors"><ArrowRight className="w-5 h-5 rotate-180 dark:text-slate-400" /></button>
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
                      <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{typeof chatReq.response === 'string' ? chatReq.response : JSON.stringify(chatReq.response, null, 2)}</p>
                    )}
                    {chatReq.responseType === 'VOICE' && typeof chatReq.response === 'string' && chatReq.response && (
                      <audio src={chatReq.response} controls className="w-full" />
                    )}
                    {chatReq.responseType === 'VIDEO' && typeof chatReq.response === 'string' && chatReq.response && (
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
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 space-y-2">
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
                    : 'bg-slate-100 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  title={isRecordingChat ? 'Stop recording' : 'Record voice message'}
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Image Upload Button */}
                <button
                  onClick={() => chatImageInputRef.current?.click()}
                  className="p-3 rounded-2xl bg-slate-100 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex-shrink-0"
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
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:ring-0 focus:border-blue-300 dark:focus:border-blue-700 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
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
                  className={`p-3 rounded-2xl transition-all flex-shrink-0 ${chatInput.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' : 'bg-slate-100 text-slate-600 dark:text-slate-600 cursor-not-allowed'
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
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 dark:text-slate-100 w-full relative">
          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center gap-4">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 hover:bg-slate-50 rounded-full transition-colors"><ArrowRight className="w-5 h-5 rotate-180 dark:text-slate-400" /></button>
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
                <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border-2 border-slate-300 transition-all hover:shadow-md">
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
                  <p className="text-slate-600 dark:text-slate-600 text-sm mb-4 bg-slate-50 p-3 rounded-xl leading-relaxed">{req.description}</p>

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
                        <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border-2 border-slate-300">
                          {typeof req.response === 'string' ? req.response : JSON.stringify(req.response, null, 2)}
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
                          {typeof req.response === 'string' && req.response && <audio src={req.response} controls className="w-full mt-2" />}
                        </div>
                      )}

                      {req.responseType === 'VIDEO' && (
                        <div className="aspect-video bg-black rounded-xl relative overflow-hidden shadow-lg border-2 border-slate-300">
                          {typeof req.response === 'string' && req.response ? (
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
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${ratingValue > 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600' : 'bg-slate-100 text-slate-600 cursor-not-allowed'
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
      const latestLearningActivity = history.find((item: LearnerActivity) => item.type === 'EXPLANATION' || item.type === 'STUDY');
      const latestQuizActivity = history.find((item: LearnerActivity) => item.type === 'QUIZ');
      const latestLearningSnapshot = buildContinueLearningSnapshot(latestLearningActivity, latestQuizActivity?.topic || 'Photosynthesis');
      const featuredSubject = inferSubjectFromTopic(latestLearningSnapshot.topic || latestQuizActivity?.topic || latestLearningActivity?.topic);
      const recommendedHomeTopic = weakTopics?.[0]
        || (latestQuizActivity?.score !== undefined && latestQuizActivity.score < 70 ? latestQuizActivity.topic : 'Linear Equations');
      const sessionsLeft = Math.max(0, 5 - usageCount);

      return (
        <LearnerHome
          learnerName={studentProfile?.name || profile?.name || 'Learner'}
          grade={studentProfile?.grade || 'Grade 7'}
          sessionsLeft={sessionsLeft}
          latestTopic={latestLearningSnapshot.topic}
          latestTopicDescription={latestLearningSnapshot.description}
          latestTopicSummary={latestLearningSnapshot.summaryPoints}
          latestProgress={latestLearningSnapshot.progress}
          recommendedTopic={recommendedHomeTopic}
          recommendationReason={latestQuizActivity?.score !== undefined && latestQuizActivity.score < 70
            ? 'Your last quiz suggests this is the best place to strengthen marks.'
            : weakTopics?.[0]
              ? 'This topic came from your weak-topic list and is worth a quick review.'
              : 'A short revision lesson should help lock in the idea.'}
          featuredSubject={featuredSubject}
          onOpenMenu={() => setSidebarOpen(true)}
          onProfile={() => setMode('PROFILE')}
          onTeach={(topic) => {
            setPromptText(topic);
            void handlePromptSubmit(topic);
          }}
          onScan={() => void startCamera()}
          onUpload={() => fileInputRef.current?.click()}
          onVoice={() => void startVoiceQuestion()}
          voiceTranscript={voiceTranscriptPreview}
          onSubject={(subject) => {
            if (subject === 'More Subjects') {
              handleSidebarTabChange('RESOURCES');
              return;
            }
            const subjectPrompt = `Teach me an important ${subject} topic for ${studentProfile?.grade || 'my grade'}.`;
            setPromptText(subjectPrompt);
            void handlePromptSubmit(subjectPrompt);
          }}
          onContinue={(topic) => void handleQuestTakeQuiz(topic)}
          onViewAll={() => handleSidebarTabChange('PROGRESS')}
          onOpenRevision={() => setMode('REVISION')}
          onStartRecommendation={(topic) => void handleTopicClick(topic)}
          onStartWeakDrill={(topic) => void handleQuestTakeQuiz(topic)}
        />
      );
    }

    if (mode === 'NOTEBOOK') {
      return (
        <LearnerNotebook
          ownerKey={notebookOwnerKey}
          grade={studentProfile?.grade}
          parentPhone={studentProfile?.parentWhatsAppConsentAt ? studentProfile?.parentPhone : undefined}
          isRegistered={isRegistered}
          onBack={() => setMode('MENU')}
          onRegister={() => setShowRegistration(true)}
          onNoteSaved={(note) => {
            if (isRegistered) {
              saveActivity({
                id: 'notebook-' + note.id,
                type: 'STUDY',
                topic: note.topic || note.title,
                date: new Date().toLocaleDateString(),
                details: JSON.stringify({
                  mode: 'manual_notebook_note',
                  noteId: note.id,
                  subject: note.subject,
                  grade: note.grade,
                }),
              });
            }
            trackFunnelEvent('notebook_saved', {
              source: 'manual_note',
              subject: note.subject,
              registered: isRegistered,
            });
            triggerToast('Note saved.');
          }}
          onWhatsAppShare={(note, destination) => {
            trackFunnelEvent('notebook_whatsapp_share', {
              destination,
              subject: note.subject,
              source: note.source,
              registered: isRegistered,
            });
          }}
          onWhatsAppPackShare={(notes, destination) => {
            trackFunnelEvent('notebook_whatsapp_pack_share', {
              destination,
              note_count: notes.length,
              registered: isRegistered,
            });
          }}
          onOpenNote={(note) => {
            const summaryPoints = note.content
              .split(/[.!?]\s+/)
              .map(point => point.trim())
              .filter(Boolean)
              .slice(0, 3);
            setExplanation({
              topic: note.topic || note.title,
              explanation: note.content,
              summaryPoints: summaryPoints.length > 0 ? summaryPoints : [note.title],
              level: 'Simple',
              relatedTopics: [],
            });
            setSidebarTab('NOTEBOOK');
            setMode('RESULT');
          }}
          onListenNote={async (note) => {
            try {
              await speak(note.content, language);
            } catch {
              triggerToast('Audio is not available on this device right now.');
            }
          }}
          onQuizNote={async (note) => {
            setLoading(true);
            setLoadingText('Akili is creating a short Notebook quiz...');
            try {
              const quiz = await generateQuickQuiz(note.content, note.topic || note.title, language);
              setExplanation({
                topic: note.topic || note.title,
                explanation: note.content,
                summaryPoints: [note.title],
                level: 'Simple',
                relatedTopics: [],
              });
              setQuizData(quiz);
              setStickyQuizTaken(true);
              trackFunnelEvent('notebook_quiz_generated', {
                subject: note.subject,
                topic: note.topic || note.title,
              });
              setMode('QUIZ');
            } catch (error) {
              console.error('Notebook quiz generation failed:', error);
              triggerToast('Could not create the quiz. Please try again.');
            } finally {
              setLoading(false);
            }
          }}
        />
      );
    }

    // --- HISTORY VIEW ---
    if (mode === 'HISTORY' as any) {
      return (
        <div className="min-h-screen bg-white font-sans text-slate-800 dark:text-slate-100 w-full flex flex-col transition-colors duration-300">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 bg-white z-20">
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 hover:bg-slate-50 rounded-full transition-colors"><ArrowRight className="w-6 h-6 rotate-180" /></button>
            <h1 className="text-lg font-bold">Learning History</h1>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <Clock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p>No history yet. Start a chat!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.slice().reverse().map((item) => (
                  <div key={item.id} onClick={() => restoreActivity(item)} className="p-4 rounded-2xl border-2 border-slate-300 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-slate-300 shadow-sm text-lg">
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
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
                  <div className="h-px flex-1 bg-slate-200"></div>
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
                      <li className="flex gap-2"><span>-</span> Save your learning history and streaks</li>
                      <li className="flex gap-2"><span>-</span> Unlock high daily AI study limits</li>
                      <li className="flex gap-2"><span>-</span> Get a personalized study buddy profile</li>
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
                      <Star className={`w-8 h-8 ${isPro ? 'text-amber-600 fill-amber-600' : 'text-slate-600'}`} />
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

            {/* Achievement Badges */}
            {isRegistered && (
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Achievements</h2>
                    <p className="text-xs text-slate-400 font-medium">Badges earned from your study journey</p>
                  </div>
                </div>
                <Card className="p-5">
                  {(() => {
                    const quizCount = history.filter((h: any) => h.type === 'QUIZ').length;
                    const inClass = studentClasses.length > 0;
                    const BADGES = [
        { id: 'first_study', emoji: 'Seed', name: 'First Step', desc: 'Completed your first study session', earned: history.length >= 1 },
        { id: 'first_quiz', emoji: 'Note', name: 'Quiz Taker', desc: 'Took your first quiz', earned: quizCount >= 1 },
                      { id: 'streak_3', emoji: 'Hot', name: 'On Fire', desc: '3-day study streak', earned: streak >= 3 },
                      { id: 'streak_7', emoji: 'Spark', name: 'Streak Keeper', desc: '7-day study streak', earned: streak >= 7 },
                      { id: 'streak_30', emoji: 'Watch', name: 'Streak Legend', desc: '30-day streak', earned: streak >= 30 },
                      { id: 'xp_100', emoji: 'Star', name: 'XP Explorer', desc: 'Earned 100 XP', earned: totalXP >= 100 },
                      { id: 'xp_500', emoji: 'Trophy', name: 'XP Champion', desc: 'Earned 500 XP', earned: totalXP >= 500 },
                      { id: 'quiz_5', emoji: 'Target', name: 'Quiz Master', desc: 'Completed 5 quizzes', earned: quizCount >= 5 },
                      { id: 'quiz_20', emoji: 'Medal', name: 'Quiz Legend', desc: 'Completed 20 quizzes', earned: quizCount >= 20 },
                      { id: 'class_join', emoji: 'Team', name: 'Team Player', desc: 'Joined a class', earned: inClass },
                      { id: 'kcse_warrior', emoji: 'Alert', name: 'KCSE Warrior', desc: 'Studied 30+ sessions before exam', earned: history.length >= 30 },
                      { id: 'notebook', emoji: 'Notebook', name: 'Note Taker', desc: 'Saved 5+ answers to Notebook', earned: (JSON.parse(localStorage.getItem(`somo_notebook_${notebookOwnerKey}`) || '[]') as any[]).length >= 5 },
                    ];
                    const earned = BADGES.filter(b => b.earned);
                    const locked = BADGES.filter(b => !b.earned);
                    return (
                      <>
                        {earned.length === 0 ? (
                           <p className="text-xs font-bold text-slate-400 text-center py-4">No badges yet - start studying to earn your first!</p>
                        ) : (
                          <>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">{earned.length} badge{earned.length !== 1 ? 's' : ''} earned</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
                              {earned.map(b => (
                                <div key={b.id} className="flex flex-col items-center gap-1 bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 text-center">
                                  <span className="text-2xl">{b.emoji}</span>
                                  <p className="text-[10px] font-black text-amber-900 leading-tight">{b.name}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {locked.length > 0 && (
                          <>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{locked.length} locked</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {locked.slice(0, 4).map(b => (
                                <div key={b.id} title={b.desc} className="flex flex-col items-center gap-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-2.5 text-center opacity-50">
                                  <span className="text-xl grayscale">{b.emoji}</span>
                                  <p className="text-[9px] font-bold text-slate-400 leading-tight">{b.name}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </Card>
              </section>
            )}

            {/* Progress Report Card */}
            {isRegistered && (
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Progress Report Card</h2>
                    <p className="text-xs text-slate-400 font-medium">Share your weekly progress with parents or teachers</p>
                  </div>
                </div>
                <Card className="p-6 space-y-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border-emerald-200">
                  {(() => {
                    const quizHistory = history.filter((h: any) => h.type === 'QUIZ' || (h.score && h.score > 0));
                    const quizAvg = quizHistory.length > 0 ? Math.round(quizHistory.reduce((a: number, h: any) => a + (h.score || 0), 0) / quizHistory.length) : 0;
                    const topSubjects = (subjectPerformance as any)
                      ?.filter((s: any) => s.hasData)
                      ?.sort((a: any, b: any) => b.score - a.score)
                      ?.slice(0, 3)
                      ?.map((s: any) => s.subject) || [];
                    const reportText = formatWeeklyProgressForWhatsApp({
                      learnerName: studentProfile?.name || 'Student',
                      grade: studentProfile?.grade,
                      streak,
                      level: levelInfo?.level || 1,
                      totalXP,
                      sessionsThisWeek: history.filter((item: any) => {
                        const date = new Date(item.date);
                        return (Date.now() - date.getTime()) < 7 * 864e5;
                      }).length,
                      quizAverage: quizHistory.length > 0 ? quizAvg : undefined,
                      topSubjects,
                      weakTopics: (weakTopics as string[]).slice(0, 2),
                    });
                    return (
                      <>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                            <p className="text-2xl font-black text-emerald-600">{streak}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Day Streak</p>
                          </div>
                          <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                            <p className="text-2xl font-black text-indigo-600">{levelInfo?.level || 1}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level</p>
                          </div>
                          <div className="bg-white rounded-2xl p-3 border border-emerald-100">
                             <p className="text-2xl font-black text-amber-600">{quizAvg > 0 ? `${quizAvg}%` : "--"}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quiz Avg</p>
                          </div>
                        </div>
                        <div className={`grid gap-2 ${studentProfile?.parentPhone && studentProfile?.parentWhatsAppConsentAt ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              openWhatsAppShare(reportText);
                              trackFunnelEvent('progress_report_whatsapp_share', { destination: 'contact', registered: isRegistered });
                            }}
                            className="rounded-xl bg-[#25D366] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-[#128C7E]"
                          >
                            Share on WhatsApp
                          </button>
                          {studentProfile?.parentPhone && studentProfile?.parentWhatsAppConsentAt && (
                            <button
                              type="button"
                              onClick={() => {
                                openWhatsAppShare(reportText, studentProfile.parentPhone);
                                trackFunnelEvent('progress_report_whatsapp_share', { destination: 'parent', registered: isRegistered });
                              }}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 transition-colors hover:bg-emerald-100"
                            >
                              Send to parent
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard?.writeText(reportText); triggerToast('Report copied!'); }}
                            className="rounded-xl border-2 border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition-colors hover:bg-emerald-50"
                          >
                            Copy
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </Card>
              </section>
            )}

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

            {/* Study Reminders */}
            {isRegistered && 'Notification' in window && (
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-100">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Study Reminders</h2>
                    <p className="text-xs text-slate-400 font-medium">Daily nudge to keep your streak alive</p>
                  </div>
                </div>
                <Card className="p-5">
                  {(() => {
                    
                    const enable = async () => {
                      const result = await Notification.requestPermission();
                      setNotifStatus(result as 'granted' | 'denied');
                      if (result === 'granted') {
                        new Notification('Somo Smart', {
                          body: "Reminders enabled! We'll nudge you at 6pm if you haven't studied.",
                          icon: '/icons/icon-192x192.png',
                        });
                        triggerToast('Daily reminders enabled!');
                      }
                    };
                    return (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {notifStatus === 'granted' ? 'Reminders are on' : notifStatus === 'denied' ? 'Blocked in browser settings' : 'Enable daily study reminders'}
                          </p>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">
                            {notifStatus === 'granted' ? "You'll get a nudge at 6pm if you haven't studied today." : notifStatus === 'denied' ? 'Allow notifications in your browser site settings.' : "Get a 6pm reminder if you haven't studied yet."}
                          </p>
                        </div>
                        {notifStatus !== 'denied' && (
                          <button
                            onClick={enable}
                            disabled={notifStatus === 'granted'}
                            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-colors ${notifStatus === 'granted' ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                          >
                            {notifStatus === 'granted' ? 'Enabled ?' : 'Enable'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              </section>
            )}

            {/* Parent WhatsApp Connection */}
            <section>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-100">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">Parent WhatsApp</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${studentProfile?.parentPhone && studentProfile?.parentWhatsAppConsentAt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {studentProfile?.parentPhone && studentProfile?.parentWhatsAppConsentAt ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500">Share notes, Akili answers and quiz progress with permission.</p>
                </div>
              </div>

              <Card className="relative overflow-hidden border-emerald-100 p-6 sm:p-8">
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-emerald-50 blur-3xl" />
                <div className="relative z-10 space-y-5">
                  <div>
                    <label htmlFor="parentPhone" className="mb-2 block px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Parent or guardian WhatsApp number</label>
                    <input
                      id="parentPhone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={parentPhoneDraft}
                      onChange={(event) => {
                        setParentPhoneDraft(event.target.value);
                        if (!event.target.value.trim()) setParentConsent(false);
                      }}
                      placeholder="e.g. 0712 345 678"
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-lg font-black text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                    />
                    <p className="mt-2 px-1 text-xs font-medium text-slate-400">Kenyan mobile formats such as 0712 345 678 or +254 712 345 678 are accepted.</p>
                  </div>

                  <label className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${parentConsent ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      checked={parentConsent}
                      disabled={!parentPhoneDraft.trim()}
                      onChange={(event) => setParentConsent(event.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
                    />
                    <span className="text-xs font-semibold leading-5 text-slate-600">
                      I confirm this parent or guardian agreed to receive learning updates on WhatsApp. Somo Smart will not send anything automatically.
                    </span>
                  </label>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={async () => {
                        const normalized = normalizeWhatsAppPhone(parentPhoneDraft);
                        if (parentPhoneDraft.trim() && (!normalized.startsWith('254') || normalized.length !== 12)) {
                          triggerToast('Enter a valid Kenyan WhatsApp number.');
                          return;
                        }
                        if (normalized && !parentConsent) {
                          triggerToast('Confirm parent or guardian permission first.');
                          return;
                        }
                        const storedPhone = normalized ? `0${normalized.slice(3)}` : '';
                        const consentAt = storedPhone
                          ? (storedPhone === studentProfile?.parentPhone && studentProfile?.parentWhatsAppConsentAt) || new Date().toISOString()
                          : null;
                        const nameInput = document.getElementById('studentName') as HTMLInputElement;
                        const gradeInput = document.getElementById('studentGrade') as HTMLSelectElement;
                        setLoading(true);
                        setLoadingText('Saving parent connection...');
                        const { success, message } = await updateStudentProfile({
                          name: nameInput?.value,
                          grade: gradeInput?.value,
                          parentPhone: storedPhone,
                          parentWhatsAppConsentAt: consentAt,
                        });
                        setLoading(false);
                        if (!success) {
                          triggerToast(message || 'Could not save the parent connection.');
                          return;
                        }
                        setParentPhoneDraft(storedPhone);
                        trackFunnelEvent('parent_whatsapp_connection_saved', { connected: Boolean(storedPhone) });
                        triggerToast(storedPhone ? 'Parent WhatsApp connected.' : 'Profile saved.');
                      }}
                      className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-emerald-700"
                    >
                      {studentProfile?.parentPhone ? 'Save connection' : 'Connect parent'}
                    </button>

                    {studentProfile?.parentPhone && studentProfile?.parentWhatsAppConsentAt && (
                      <button
                        type="button"
                        onClick={() => {
                          openWhatsAppShare(formatParentConnectionForWhatsApp(studentProfile?.name), studentProfile.parentPhone);
                          trackFunnelEvent('parent_whatsapp_connection_tested', { registered: isRegistered });
                        }}
                        className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-black text-emerald-800 transition-colors hover:bg-emerald-100"
                      >
                        Test in WhatsApp
                      </button>
                    )}
                  </div>

                  {studentProfile?.parentPhone && (
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-800">Connected to {studentProfile.parentPhone}</p>
                        <p className="mt-0.5 text-xs font-medium text-slate-400">
                          Consent recorded {studentProfile.parentWhatsAppConsentAt ? new Date(studentProfile.parentWhatsAppConsentAt).toLocaleDateString() : 'pending'}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Disconnect this parent WhatsApp number?')) return;
                          const { success, message } = await updateStudentProfile({ parentPhone: '', parentWhatsAppConsentAt: null });
                          if (!success) {
                            triggerToast(message || 'Could not disconnect the number.');
                            return;
                          }
                          setParentPhoneDraft('');
                          setParentConsent(false);
                          trackFunnelEvent('parent_whatsapp_connection_removed', {});
                          triggerToast('Parent WhatsApp disconnected.');
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" /> Disconnect
                      </button>
                    </div>
                  )}

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="rounded-lg bg-white p-2 shadow-sm"><CheckCircle className="h-4 w-4 text-emerald-500" /></div>
                    <p className="text-xs font-medium leading-relaxed text-slate-500">
                      Connecting a number also allows the parent to use the Parent Dashboard with the learner&apos;s Student ID. The parent can be disconnected at any time.
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
            <button onClick={() => setMode('NOTEBOOK')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <BookMarked className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">My Notes</span>
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
          <div className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col h-auto md:h-screen shrink-0 relative z-20">
            {/* Header Area */}
            <div className="p-6 pb-8 border-b border-slate-200 bg-gradient-to-b from-indigo-50 to-white">
              <button
                onClick={() => setMode('LIBRARY')}
                className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors w-fit"
                title="Exit Classroom"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-[10px] font-black uppercase tracking-widest">Exit Class</span>
              </button>

              <div className="flex items-start gap-4 mt-2">
                <div className="p-2.5 bg-indigo-50 rounded-xl mt-1 border border-indigo-100 shrink-0">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 leading-tight mb-3 tracking-tight">{currentDocument.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded w-fit border border-indigo-100">{currentDocument.grade}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded w-fit border border-emerald-100">{currentDocument.subject}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Classroom Activities</p>

              <button
                onClick={() => setStudyTab('LESSON')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${studyTab === 'LESSON' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <FileText className={`w-5 h-5 ${studyTab === 'LESSON' ? 'text-indigo-200' : ''}`} />
                <span className="text-[15px] tracking-wide">The Lesson</span>
              </button>

              <button
                onClick={() => setStudyTab('RECAP')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${studyTab === 'RECAP' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <ListChecks className={`w-5 h-5 ${studyTab === 'RECAP' ? 'text-indigo-200' : ''}`} />
                <span className="text-[15px] tracking-wide">Quick Recap</span>
              </button>

              <button
                onClick={() => setStudyTab('QNA')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${studyTab === 'QNA' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
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
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${studyTab === 'REFERENCES' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <ClipboardList className={`w-5 h-5 ${studyTab === 'REFERENCES' ? 'text-indigo-200' : ''}`} />
                <span className="text-[15px] tracking-wide">Citations & Syllabus</span>
              </button>

              <div className="pt-4 mt-4 border-t border-slate-200">
                <button
                  onClick={() => setStudyTab('QUIZ')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border border-dashed ${studyTab === 'QUIZ' ? 'bg-emerald-50 shadow-none border-emerald-100 text-emerald-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-[15px] tracking-wide">Pop Quiz</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white/90 backdrop-blur-md">
              <div className="mb-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">Study Mission</p>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.round((studyMissionChecks.length / 3) * 105)}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-slate-600">
                  {studyMissionRewarded ? 'Mission complete. Study XP added.' : `${studyMissionChecks.length}/3 active steps done`}
                </p>
              </div>
            </div>
          </div>

          {/* SPLIT PANE MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col lg:flex-row bg-slate-100 relative h-[50vh] md:h-screen overflow-hidden">
            
            {/* LEFT PANE: The Document Reader */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-50 ${studyTab === 'LESSON' ? 'flex' : 'hidden lg:flex'}`}>
              
              {/* Reader Header / Toolbar */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 z-10 shadow-sm">
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
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-black select-none border border-slate-200/10 ml-2">
                      <button
                        onClick={() => setStudyViewMode('guide')}
                        className={`px-2.5 py-1 rounded-md transition-all ${studyViewMode === 'guide' ? 'bg-white dark:bg-slate-700 text-indigo-750 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-600'}`}
                      >
                        Study Guide
                      </button>
                      <button
                        onClick={() => setStudyViewMode('original')}
                        className={`px-2.5 py-1 rounded-md transition-all ${studyViewMode === 'original' ? 'bg-white dark:bg-slate-700 text-indigo-750 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-600'}`}
                      >
                        Original Book
                      </button>
                    </div>
                  )}

                  {studyViewMode === 'original' && extractedOriginalPages.length > 0 && (
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-black select-none border border-slate-200/10 ml-2">
                      <button
                        onClick={() => setOriginalViewType('text')}
                        className={`px-2.5 py-1 rounded-md transition-all ${originalViewType === 'text' ? 'bg-white dark:bg-slate-700 text-indigo-750 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-600'}`}
                      >
                        Text
                      </button>
                      <button
                        onClick={() => setOriginalViewType('pdf')}
                        className={`px-2.5 py-1 rounded-md transition-all ${originalViewType === 'pdf' ? 'bg-white dark:bg-slate-700 text-indigo-750 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-600'}`}
                      >
                        PDF
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

                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <button
                      onClick={() => setFontScale(prev => Math.max(0.8, prev - 0.1))}
                      className="w-8 h-8 rounded bg-slate-50 border border-slate-200 text-slate-600 dark:text-slate-600 font-bold hover:bg-slate-100 text-xs flex items-center justify-center transition-colors"
                      title="Make text smaller"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontScale(prev => Math.min(1.5, prev + 0.1))}
                      className="w-8 h-8 rounded bg-slate-50 border border-slate-200 text-slate-600 dark:text-slate-600 font-bold hover:bg-slate-100 text-xs flex items-center justify-center transition-colors"
                      title="Make text larger"
                    >
                      A+
                    </button>
                    <button
                      onClick={() => setFontFamily(prev => prev === 'sans' ? 'serif' : 'sans')}
                      className="px-2.5 h-8 rounded bg-slate-50 border border-slate-200 text-slate-600 dark:text-slate-600 font-bold hover:bg-slate-100 text-[10px] uppercase tracking-wider flex items-center justify-center transition-colors font-semibold"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 pl-9 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs text-slate-700 dark:text-white placeholder:text-slate-400"
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
                className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar bg-slate-50"
              >
                <div className="max-w-3xl mx-auto bg-white p-8 md:p-14 rounded-3xl shadow-sm border border-slate-200 relative">
                  {studyViewMode === 'guide' ? (
                    isSummarizing ? (
                      <div className="space-y-6 animate-pulse">
                        <div className="h-8 bg-slate-100 rounded-lg w-1/3 mb-10"></div>
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 rounded w-11/12"></div>
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 rounded w-5/6 mt-8"></div>
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
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
                              <div className="rounded-xl bg-white border border-emerald-100 dark:border-emerald-900 px-3.5 py-2 min-w-[80px] text-center">
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
                                      done ? 'bg-emerald-600 border-emerald-600 text-white font-semibold' : 'bg-white border-slate-200 text-slate-600 dark:text-slate-400 hover:border-emerald-400 font-semibold'
                                    }`}
                                  >
                                    <span>{lbl}</span>
                                    <CheckCircle className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-slate-600'}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* PAGE 0: Overview */}
                        {readerPage === 0 && (
                          <div>
                            <div className="flex items-center gap-3.5 mb-8 border-b border-indigo-50 pb-4">
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
                                <p style={{ fontSize: `${fontScale}rem` }} className={`text-slate-700 dark:text-slate-600 leading-relaxed m-0 whitespace-pre-line ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                                  {renderFormattedText(explanation.explanation, readerSearchTerm, handleGlossaryTrigger)}
                                </p>
                              </div>
                              <div className="opacity-0 group-hover/paragraph:opacity-100 flex flex-col gap-1.5 shrink-0 transition-opacity duration-200">
                                <button
                                  onClick={() => handleParagraphAsk(explanation.explanation)}
                                  className="p-2 bg-slate-50 border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg shadow-sm"
                                  title="Ask Akili about this paragraph"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleParagraphCopyCitation(explanation.explanation)}
                                  className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg shadow-sm"
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
                              <div className="flex items-center gap-3.5 mb-8 border-b border-indigo-50 pb-4">
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
                                            <p style={{ fontSize: `${fontScale}rem` }} className={`text-slate-700 dark:text-slate-600 leading-relaxed m-0 whitespace-pre-line ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                                              {renderFormattedText(block.text, readerSearchTerm, handleGlossaryTrigger)}
                                            </p>
                                          </div>
                                          <div className="opacity-0 group-hover/paragraph:opacity-100 flex flex-col gap-1.5 shrink-0 transition-opacity duration-200">
                                            <button
                                              onClick={() => handleParagraphAsk(block.text)}
                                              className="p-2 bg-slate-50 border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg shadow-sm"
                                              title="Ask Akili"
                                            >
                                              <Sparkles className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleParagraphCopyCitation(block.text)}
                                              className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg shadow-sm"
                                              title="Copy Citation"
                                            >
                                              <FileText className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {block.type === 'list' && block.items && block.items.length > 0 && (
                                        <ul className={`list-disc list-outside ml-6 space-y-2 m-0 text-slate-700 dark:text-slate-600 ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`} style={{ fontSize: `${fontScale}rem` }}>
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
                            <div className="flex items-center gap-3.5 mb-6 border-b border-slate-150 pb-4">
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
                              <ul className="list-disc list-outside ml-6 space-y-2.5 text-slate-700 dark:text-slate-600">
                                {(explanation.summaryPoints || []).map((pt, i) => (
                                  <li key={i} className="text-sm font-semibold leading-relaxed">
                                    {renderFormattedText(pt, readerSearchTerm, handleGlossaryTrigger)}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Syllabus Alignment Card */}
                            <div className="p-6 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-900 border border-indigo-100 rounded-3xl not-prose">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-2 font-semibold">Kenyan Curriculum Mapping</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-indigo-100/50 pb-4 mb-4">
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
                                    <li key={i} className="text-xs font-semibold text-slate-700 dark:text-slate-600 flex items-start gap-2">
                                       <span className="text-emerald-500 mt-0.5">Yes</span>
                                      <span>{out}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Academic Citation Builder */}
                            <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-3xl not-prose">
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

                              <div className="bg-white border border-slate-200 p-4 rounded-2xl text-xs text-slate-650 dark:text-slate-400 italic font-mono leading-relaxed select-all">
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
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                          <BookOpen className="w-10 h-10 text-slate-600 animate-pulse" />
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
                      <div className="h-[calc(100vh-280px)] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
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
                        <div className="flex items-center gap-3.5 mb-8 border-b border-indigo-50 pb-4">
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
                              className="p-2 bg-slate-50 border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg shadow-sm"
                              title="Ask Akili about this page"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleParagraphCopyCitation(extractedOriginalPages[originalPageIndex])}
                              className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg shadow-sm"
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
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                  <button
                    disabled={studyViewMode === 'guide' ? readerPage === 0 : originalPageIndex === 0}
                    onClick={() => {
                      if (studyViewMode === 'guide') {
                        handlePageChange(readerPage - 1);
                      } else {
                        handleOriginalPageChange(originalPageIndex - 1);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-black uppercase tracking-wider text-slate-650 dark:text-slate-600 hover:bg-slate-50 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-all font-semibold"
                  >
                     Previous
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
                            isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:bg-slate-50'
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
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-black uppercase tracking-wider text-slate-650 dark:text-slate-600 hover:bg-slate-50 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-all font-semibold"
                  >
                     Next
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT PANE: Contextual Tools (Chat, Recap, Quiz, References) */}
            <div className={`w-full lg:w-[450px] shrink-0 flex flex-col h-full bg-white border-l border-slate-250 ${studyTab !== 'LESSON' ? 'flex' : 'hidden lg:flex'}`}>
              
              {/* Desktop Secondary tab header */}
              <div className="lg:flex hidden bg-slate-50 dark:bg-slate-850 p-2 border-b border-slate-200 gap-1 select-none">
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
                  <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
                    {/* Mobile Back to Lesson Button */}
                    <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                      <button onClick={() => setStudyTab('LESSON')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                         Back to Lesson
                      </button>
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Raise Hand</span>
                    </div>

                    <div className="p-4 bg-white/50 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between shrink-0">
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
                          <div className="w-16 h-16 bg-white dark:bg-slate-850 rounded-full flex items-center justify-center mb-4 border-2 border-indigo-50 shadow-md">
                            <Sparkles className="w-6 h-6 text-indigo-500" />
                          </div>
                          <h4 className="text-sm font-black text-slate-850 dark:text-white mb-1 tracking-tight">Need clarification?</h4>
                          <p className="text-xs text-slate-550 leading-relaxed">Ask anything about the notes, highlight a word/sentence to ask, or request an example.</p>
                        </div>
                      ) : (
                        studyChat.map((msg, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                            {msg.role === 'model' && (
                              <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mr-2 mt-1 shrink-0 border border-indigo-100 dark:border-indigo-900">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1 max-w-[85%]">
                              <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 dark:text-slate-350 rounded-tl-none font-medium'
                              }`}>
                                <MarkdownText content={msg.text} />
                              </div>
                              {msg.role === 'model' && (
                                <div className="self-start flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                  <button
                                    onClick={() => {
                                      saveStudyNote(notebookOwnerKey, {
                                        title: currentDocument?.title || 'AI Answer',
                                        topic: currentDocument?.title || 'Study Chat',
                                        content: msg.text,
                                        subject: currentDocument?.subject || 'General',
                                        grade: studentProfile?.grade || '',
                                        source: 'ai_answer',
                                        masteryStatus: 'learning',
                                        userId: userId || undefined,
                                        studentCode: studentCode || undefined,
                                      });
                                      triggerToast('Saved to Notebook');
                                    }}
                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center gap-1"
                                  >
                                    <BookmarkPlus className="w-3 h-3" /> Save
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!checkLimit({ type: 'STUDY_QUIZ' })) return;
                                      setLoading(true);
                                      setLoadingText('Akili is crafting a quick quiz...');
                                      try {
                                        const data = await generateQuiz(msg.text, currentDocument?.title || explanation?.topic || 'Topic', language);
                                        setQuizData(data);
                                        setMode('QUIZ');
                                      } catch { setError({ title: 'Quiz Failed', message: 'Could not generate quiz.' }); }
                                      finally { setLoading(false); }
                                    }}
                                    className="text-[10px] font-bold text-amber-500 hover:text-amber-700 flex items-center gap-1"
                                  >
                                    <Zap className="w-3 h-3" /> Quick Quiz
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mr-2 mt-1 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-1.5">
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
                        <div className="mb-2 inline-flex items-center gap-2 p-2 bg-white dark:bg-slate-850 border border-slate-250 rounded-xl shadow-md">
                          <span className="text-[10px] font-black uppercase text-indigo-600 font-semibold">Attached {pendingMedia.type}</span>
                        <button onClick={() => setPendingMedia(null)} className="text-slate-400 hover:text-red-500">Close</button>
                        </div>
                      )}
                      <div className="flex items-center bg-white border border-slate-350 rounded-2xl p-1 shadow-md focus-within:ring-2 focus-within:ring-indigo-500">
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
                    <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
                      <button onClick={() => setStudyTab('LESSON')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 font-semibold">
                         Back to Lesson
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
                              className={`border rounded-2xl p-4 bg-white transition-all cursor-pointer ${
                                isExpanded ? 'border-indigo-400 ring-2 ring-indigo-50 dark:ring-indigo-950/20' : 'border-slate-250 hover:border-slate-350'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-slate-800 dark:text-white">{node.point}</span>
                                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </div>
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-650 dark:text-slate-450 leading-relaxed">
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
                    <div className="lg:hidden w-full flex items-center justify-between pb-4 border-b border-slate-200 shrink-0 mb-10">
                      <button onClick={() => setStudyTab('LESSON')} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-600 font-semibold">
                         Back to Lesson
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
                         Back to Lesson
                      </button>
                      <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest font-semibold">References</span>
                    </div>

                    <div>
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase rounded font-semibold">Academic Mapping</span>
                      <h4 className="text-lg font-black text-slate-850 dark:text-white mt-2">Syllabus & Citations</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Syllabus Alignment */}
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
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
                                   <span className="text-emerald-500">Yes</span>
                                  <span>{out}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Citation Builder */}
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cite Material</h5>
                          <div className="flex bg-slate-200 p-0.5 rounded-md text-[8px] font-black">
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

                        <div className="bg-white p-3 rounded-xl text-xs text-slate-650 dark:text-slate-400 font-mono italic leading-relaxed select-all border border-slate-200">
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
                className="bg-white border-2 border-slate-350 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
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
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-600 leading-relaxed">{activeGlossaryTerm.definition}</p>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-855 pt-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 font-semibold">Tafsiri (Kiswahili)</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-600 leading-relaxed">{activeGlossaryTerm.translation}</p>
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
              className="bg-white border border-slate-200 rounded-2xl shadow-xl flex items-center p-1 gap-1 select-none animate-in fade-in zoom-in-95 duration-150"
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
              <div className="bg-white text-slate-800 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 border border-slate-200">
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
        <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-6 w-full animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-2 border-slate-200 p-6 sm:p-8 md:p-12 relative overflow-hidden">
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
                     ? (educationLevel === EducationLevel.JUNIOR ? "Show me your task or tell me about it!" : "Upload your homework or record audio - Akili will break it down step by step.")
                     : (educationLevel === EducationLevel.JUNIOR ? "Ask Akili anything, show a picture, or just talk!" : "Type a topic, upload an image, or record audio - Akili has you covered.")}
              </p>
            </div>

            {imageData && (
              <div className="relative w-full max-w-sm mx-auto h-48 mb-8 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 group shadow-md text-center flex items-center justify-center">
                <img src={`data:${imageData.mimeType};base64,${imageData.base64}`} alt="Uploaded content" className="max-w-full max-h-full object-contain" />
                <button
                  onClick={() => setImageData(null)}
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-50 text-slate-700 rounded-full backdrop-blur-md transition-colors shadow-sm"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="w-full relative z-10">
              {/* Recording-in-progress overlay replaces the input card */}
              {isRecording ? (
                <div className="bg-red-950/95 rounded-[2rem] p-4 border-2 border-red-700/60 shadow-xl shadow-red-900/30 flex flex-col gap-3 animate-in fade-in duration-200">
                  {/* Top row: label + timer */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse shadow-lg shadow-red-500/60" />
                      <span className="text-red-200 text-xs font-black uppercase tracking-[0.18em]">Recording</span>
                    </div>
                    <span className="text-red-300 text-sm font-mono font-bold tabular-nums">
                      {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Animated waveform bars */}
                  <div className="flex items-center justify-center gap-[3px] h-10 px-2">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[3px] rounded-full bg-red-400 opacity-90"
                        style={{
                          height: `${20 + Math.sin((i / 3) + (recordingTime * 2)) * 14 + Math.cos((i / 2.5)) * 8}%`,
                          minHeight: '15%',
                          maxHeight: '100%',
                          animation: `waveBar${i % 4} 0.${6 + (i % 5)}s ease-in-out infinite alternate`,
                          animationDelay: `${(i * 40) % 300}ms`,
                        }}
                      />
                    ))}
                  </div>

                   {/* Stop button - big and obvious */}
                  <button
                    onClick={stopRecording}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-red-500 hover:bg-red-400 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-red-900/50"
                  >
                    <div className="w-5 h-5 bg-white rounded-sm shrink-0" />
                    Stop Recording
                  </button>
                </div>
              ) : (
              <div className="bg-slate-50 rounded-[2rem] p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 border-2 border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30 transition-all shadow-inner">
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
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
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
              )}
            </div>

            <button
              onClick={() => {
                setImageData(null);
                setMode('MENU');
              }}
              className="mt-8 mx-auto block text-sm font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-600 transition-colors"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      );
    }

    if (mode === 'RESULT' && explanation) {
      return (
        <div className="bg-slate-50 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100">
          {/* Sticky Glass Header */}
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => runWithRecallExitGuard(() => { cancelPodcast(); handleExitResult(); })} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 hover:bg-slate-50 rounded-xl transition-all group">
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
                className="bg-white p-2 rounded-2xl shadow-sm border-2 border-slate-300 animate-in fade-in zoom-in duration-300"
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
                className="bg-white p-5 rounded-[2rem] shadow-sm border-2 border-slate-300 animate-in fade-in zoom-in duration-300"
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

            {/* Detailed explanation + Key Takeaways */}
            {explanation.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="bg-white p-6 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/40 shadow-sm relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-indigo-600" />
                      </div>
                      Detailed explanation
                    </h3>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">Grade-sensitive depth - {getExplanationDepthProfile(studentProfile?.grade || currentDocument?.grade || educationLevel || '', explanation.level).label}</p>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none rounded-2xl border border-indigo-100/60 bg-indigo-50/30 p-4 text-slate-700 dark:text-slate-200 leading-relaxed">
                  <MarkdownText content={buildDetailedExplanationPreview(explanation.explanation, explanation.topic, studentProfile?.grade || currentDocument?.grade || educationLevel || '', explanation.level)} />
                </div>
                {Array.isArray(explanation.subtopics) && explanation.subtopics.length > 0 && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {explanation.subtopics.slice(0, getExplanationDepthProfile(studentProfile?.grade || currentDocument?.grade || educationLevel || '', explanation.level).subtopics).map((subtopic, index) => (
                      <div key={`${subtopic.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">{index + 1}. {subtopic.title}</p>
                        {subtopic.content && (
                          <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-600 prose prose-sm dark:prose-invert max-w-none">
                            <MarkdownText content={buildDetailedExplanationPreview(subtopic.content, subtopic.title, studentProfile?.grade || currentDocument?.grade || educationLevel || '', explanation.level)} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {Array.isArray(explanation.recapNodes) && explanation.recapNodes.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3">Step-by-step recap</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {explanation.recapNodes.slice(0, getExplanationDepthProfile(studentProfile?.grade || currentDocument?.grade || educationLevel || '', explanation.level).recapNodes).map((node, index) => (
                        <div key={`${node.point}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{node.point}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-600">{node.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {explanation.summaryPoints && explanation.summaryPoints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-sm relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  Key Takeaways
                </h3>
                <div className="text-slate-600 dark:text-slate-600 text-sm md:text-base leading-relaxed mb-6 font-medium bg-amber-50/20 p-4 rounded-2xl border border-amber-100/50 prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownText content={getBriefDefinition(explanation.explanation, explanation.topic)} />
                </div>
                <ul className="space-y-4">
                  {explanation.summaryPoints.map((point, i) => (
                    <li key={i} className="flex gap-4 text-slate-600 dark:text-slate-600 leading-relaxed font-medium">
                      <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                      <span className="text-sm md:text-base">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

             {/* Podcast Player Overlay - Premium Media Player */}
            <AnimatePresence>
              {(isPodcastPlaying || podcastLoading) && (isPodcastPlaying ? podcastScript : true) && (
                <motion.div
                  initial={{ y: 120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 120, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed bottom-20 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:w-[92%] md:max-w-xl z-[100]"
                >
                  <div className="bg-white backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
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
                            {podcastScript?.title || (explanation?.topic ? 'Generating episode...' : '')}
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
                          <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-4 border border-slate-200">
                            <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                              seg.speaker === 'Host'
                                ? 'bg-indigo-500/40 text-indigo-200'
                                : 'bg-violet-500/40 text-violet-200'
                            }`}>
                              {seg.speaker === 'Host' ? 'Host' : 'Expert'}
                            </span>
                            <p className="text-white text-sm leading-relaxed font-medium">{seg.text}</p>
                          </div>
                        );
                      })()}

                      {podcastLoading && (
                        <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 border border-slate-200">
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                          <p className="text-slate-600 text-sm font-medium">Scripting your audio episode with AI...</p>
                        </div>
                      )}

                      {/* Controls Row */}
                      <div className="flex items-center gap-2">
                        {/* Re-generate */}
                        <button
                          onClick={handlePodcastRegenerate}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all text-xs font-bold border border-slate-200"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Re-generate
                        </button>

                        {/* Skip Segment */}
                        <button
                          onClick={handlePodcastSkip}
                          disabled={!podcastScript || currentSegmentIndex >= podcastScript.script.length - 1}
                          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200"
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
                          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 transition-all border border-slate-200"
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
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  explanation.grounding?.used
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500 dark:text-slate-600'
                }`}>
                  <Library className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-[0.16em] ${
                    explanation.grounding?.used ? 'text-emerald-700 dark:text-emerald-700' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {explanation.grounding?.used ? 'Grounded by Soma Library' : 'General Akili answer'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-600">
                    {explanation.grounding?.used
                      ? 'This answer used indexed Soma notes, curriculum guides, or original papers where relevant.'
                      : groundedAnswerMode
                        ? 'No matching indexed source was found, so Akili answered from general curriculum knowledge.'
                        : 'Soma Library grounding was switched off for this answer.'}
                  </p>
                  {explanation.grounding?.sources && explanation.grounding.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {explanation.grounding.sources.slice(0, 4).map((source) => (
                        <span key={source} className="rounded-full bg-white border border-emerald-200 dark:border-emerald-900/70 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 truncate max-w-full">
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Level Switcher */}
            <div className="flex bg-white p-1.5 rounded-xl shadow-sm border-2 border-slate-300">
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
                          {podcastScript.script[currentSegmentIndex].speaker === 'Host' ? 'Host' : 'Expert'}
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
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-600 mt-1">
                      Score: {lastQuizReview.score}%. Review the exact questions you missed before moving on.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-3">
                  {lastQuizReview.missedQuestions.slice(0, 3).map(({ question, index, selectedAnswer }) => (
                    <div key={`${question.id}-${index}`} className="rounded-2xl bg-white border border-rose-200 dark:border-rose-900/60 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Question {index + 1}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{question.question}</p>
                      <div className="grid gap-1 text-xs font-semibold">
                        <p className="text-rose-700 dark:text-rose-300">Your answer: {selectedAnswer || 'No answer'}</p>
                        <p className="text-emerald-700 dark:text-emerald-700">Correct answer: {String(question.correctAnswer)}</p>
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
                    className="flex-1 rounded-2xl bg-white border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
              className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-300 prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-600 prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white"
            >
              <div>
                <MarkdownText content={explanation.explanation} />
              </div>
              {/* ACTION FOOTER */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-2 sm:gap-4">
                <button
                  onClick={handleSaveExplanationToNotebook}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-sm px-4 sm:px-5 py-3 rounded-xl transition-colors border border-amber-200"
                >
                  <BookMarked className="w-4 h-4" />
                  Save to Notebook
                </button>
                <button
                  onClick={() => handleShareExplanationToWhatsApp('contact')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#e9f9ef] hover:bg-[#d8f4e3] text-[#087a3e] font-bold text-sm px-4 sm:px-5 py-3 rounded-xl transition-colors border border-emerald-200"
                >
                  <Share2 className="w-4 h-4" />
                  Share on WhatsApp
                </button>
                {studentProfile?.parentPhone && studentProfile?.parentWhatsAppConsentAt && (
                  <button
                    onClick={() => handleShareExplanationToWhatsApp('parent')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-[#087a3e] font-bold text-sm px-4 sm:px-5 py-3 rounded-xl transition-colors border border-emerald-200 hover:bg-emerald-50 dark:text-emerald-700 dark:border-emerald-900"
                  >
                    <Share2 className="w-4 h-4" />
                    Send to parent
                  </button>
                )}
                <button
                  onClick={() => saveForOffline(explanation.topic, explanation.explanation, currentDocument?.subject || 'General')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 sm:px-5 py-3 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Save Offline
                </button>

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

                <button
                  onClick={async () => {
                    if (topicFlashcards.length > 0) { setTopicFlashcards([]); return; }
                    setFlashcardsLoading(true);
                    setFlashcardIndex(0);
                    setFlashcardFlipped(false);
                    setFlashcardGot(new Set());
                    try {
                      const cards = await generateTopicFlashcards(explanation.explanation, explanation.topic);
                      setTopicFlashcards(cards);
                    } catch { triggerToast('Could not generate flashcards. Try again.'); }
                    finally { setFlashcardsLoading(false); }
                  }}
                  disabled={flashcardsLoading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-sm px-4 sm:px-5 py-3 rounded-xl transition-colors border border-violet-100 disabled:opacity-60"
                >
                  {flashcardsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  {topicFlashcards.length > 0 ? 'Hide Cards' : 'Flashcards'}
                </button>
              </div>

              {/* INLINE FLIP CARDS */}
              {topicFlashcards.length > 0 && (() => {
                const card = topicFlashcards[flashcardIndex];
                const total = topicFlashcards.length;
                const gotCount = flashcardGot.size;
                return (
                  <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-3">
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Flashcards - {gotCount}/{total} Got It</p>
                      <p className="text-xs font-bold text-slate-400">{flashcardIndex + 1} / {total}</p>
                    </div>
                    <div
                      onClick={() => setFlashcardFlipped(f => !f)}
                      className="cursor-pointer select-none"
                      style={{ perspective: '1000px' }}
                    >
                      <div style={{
                        position: 'relative', height: '160px', transition: 'transform 0.45s',
                        transformStyle: 'preserve-3d',
                        transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}>
                        {/* Front */}
                        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
                          className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl flex flex-col items-center justify-center p-6 shadow-lg shadow-violet-200">
                          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">Term</p>
                          <p className="text-xl font-black text-white text-center">{card.term}</p>
                          <p className="text-[10px] text-white/50 mt-3">Tap to reveal</p>
                        </div>
                        {/* Back */}
                        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'absolute', inset: 0, transform: 'rotateY(180deg)' }}
                          className="bg-white border-2 border-violet-200 dark:border-violet-800 rounded-3xl flex flex-col items-center justify-center p-6 shadow-lg">
                          <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-3">Definition</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center leading-relaxed">{card.definition}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          setFlashcardGot(prev => new Set([...prev, flashcardIndex]));
                          setFlashcardFlipped(false);
                          if (flashcardIndex < total - 1) setFlashcardIndex(i => i + 1);
                        }}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-2xl text-sm transition-colors"
                      >
                         Yes Got It
                      </button>
                      <button
                        onClick={() => {
                          setFlashcardFlipped(false);
                          if (flashcardIndex < total - 1) setFlashcardIndex(i => i + 1);
                        }}
                        className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-black py-3 rounded-2xl text-sm transition-colors"
                      >
                         No Still Learning
                      </button>
                    </div>
                    {flashcardIndex === total - 1 && (
                      <button onClick={() => { setFlashcardIndex(0); setFlashcardFlipped(false); setFlashcardGot(new Set()); }}
                        className="w-full mt-3 text-xs font-black text-violet-600 hover:text-violet-800 underline">
                        Restart deck
                      </button>
                    )}
                  </div>
                );
              })()}
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
              className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-300 mt-8"
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
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isAvailableForTutoring ? 'bg-emerald-500 text-indigo-900 animate-pulse' : 'bg-indigo-500/50 text-indigo-200'}`}>
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

          {/* --- ONBOARDING MODAL --- */}
          {showOnboarding && (
            <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
                  <div className="text-3xl mb-2">Class</div>
                  <h2 className="text-xl font-black">Welcome to Somo Smart!</h2>
                  <p className="text-indigo-100 text-sm mt-1">{"Let's personalise your learning"}</p>
                  <div className="flex justify-center gap-2 mt-3">
                    <div className={`w-6 h-1.5 rounded-full ${onboardStep >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                    <div className={`w-6 h-1.5 rounded-full ${onboardStep >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                  </div>
                </div>
                <div className="p-6">
                  {onboardStep === 1 && (
                    <>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4">What class are you in?</p>
                      <div className="grid grid-cols-3 gap-2">
                        {['Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4'].map(g => (
                          <button
                            key={g}
                            onClick={() => setOnboardGrade(g)}
                            className={`py-3 rounded-xl text-sm font-black transition-all border-2 ${onboardGrade === g ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 dark:text-slate-600 hover:border-indigo-300'}`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      <button
                        disabled={!onboardGrade}
                        onClick={() => setOnboardStep(2)}
                        className="mt-5 w-full bg-indigo-600 disabled:opacity-40 text-white py-3.5 rounded-xl font-black"
                      >
                        Next
                      </button>
                    </>
                  )}
                  {onboardStep === 2 && (
                    <>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200 mb-2">Class set to <span className="text-indigo-600">{onboardGrade}</span> OK</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{"You're ready to explore. Scan a page, ask a question, or browse notes for your class."}</p>
                      <button
                        onClick={async () => {
                          await updateStudentProfile({ grade: onboardGrade });
                          localStorage.setItem('soma_onboarded', '1');
                          setShowOnboarding(false);
                          trackFunnelEvent('learner_onboarding_completed', { grade: onboardGrade });
                        }}
                        className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-black"
                      >
                        Start Learning
                      </button>
                      <button onClick={() => setOnboardStep(1)} className="mt-2 w-full text-slate-400 text-xs font-bold py-2">Back</button>
                    </>
                  )}
                  <button
                    onClick={() => { localStorage.setItem('soma_onboarded', '1'); setShowOnboarding(false); }}
                    className="mt-1 w-full text-slate-600 dark:text-slate-600 text-xs py-1"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- QUIZ WHATSAPP SHARE PROMPT --- */}
          {showQuizSharePrompt && (
            <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-6 text-center">
                <div className="text-4xl mb-3">Done</div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{showQuizSharePrompt.score}%!</h2>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 mb-5">{showQuizSharePrompt.topic}</p>
                <div className="grid gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handleShareQuizResultToWhatsApp('contact')}
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-black transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    Share on WhatsApp
                  </button>
                  {studentProfile?.parentPhone && studentProfile?.parentWhatsAppConsentAt && (
                    <button
                      type="button"
                      onClick={() => handleShareQuizResultToWhatsApp('parent')}
                      className="flex items-center justify-center gap-2 w-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-3 rounded-xl font-black transition-colors dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-700"
                    >
                      <Share2 className="w-5 h-5" />
                      Send result to parent
                    </button>
                  )}
                </div>
                <button onClick={() => setShowQuizSharePrompt(null)} className="w-full text-slate-400 text-sm font-bold py-2">
                  Continue studying
                </button>
              </div>
            </div>
          )}

          {/* Global Bottom Nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 pb-safe flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => runWithRecallExitGuard(() => setMode('MENU'))} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Home</span>
            </button>
            <button onClick={() => runWithRecallExitGuard(() => setMode('NOTEBOOK'))} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <BookMarked className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">My Notes</span>
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

        if (score >= 70) {
          setShowQuizSharePrompt({ score, topic: quizData.topic });
        }

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
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5">Official Study Library</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isPro && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col items-end mr-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Free trials</p>
                    <p className="text-[10px] font-black text-indigo-600">{Math.max(0, 5 - usageCount)} / 5 Left</p>
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
                    <span className="bg-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1">
                      <CheckCircle className="w-2 h-2" /> Verified
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight leading-tight mb-1">Official Study Library.</h3>
                  <p className="opacity-80 text-xs font-medium max-w-[200px] mx-auto md:mx-0 leading-relaxed">
                    {educationLevel === EducationLevel.CAMPUS
                      ? 'University lecture notes & course materials.'
                      : educationLevel === EducationLevel.JUNIOR
                        ? 'KPSEA prep & fun learning notes.'
                        : 'Verified CBC original papers & professional revision notes.'}
                  </p>
                </div>

                {/* Right: Compact Stats */}
                <div className="relative z-10 flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200 min-w-[90px]">
                    <span className="text-2xl font-black leading-none mb-0.5">{gradeFilteredMaterials.length}</span>
                    <span className="text-[7px] opacity-70 font-black uppercase tracking-widest">Available</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-indigo-500/30 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200 min-w-[90px]">
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
                      } catch (e) { /* ignore */ }
                      if (recentSessions.length >= 5) break;
                    }

                    return recentSessions.map((material, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => startStudySession(material)}
                        className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-300 min-w-[180px] group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all active:scale-95"
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
                    aria-label={`Switch to {tab.label} section`}
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
                  { id: 'ALL',        emoji: '', label: 'All',         activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' },
  { id: 'NOTES',      emoji: '', label: 'Notes',       activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-200' },
  { id: 'PAST_PAPER', emoji: '', label: 'Past Papers', activeClass: 'bg-amber-500 text-white shadow-lg shadow-amber-200' },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMaterialCategory(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                      materialCategory === tab.id
                        ? tab.activeClass
                        : 'bg-slate-100 text-slate-500 dark:text-slate-400 hover:bg-slate-200 hover:bg-slate-50'
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
                  className="bg-white border-2 border-slate-200 text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Sources</option>
                  <option value="SOMO">Somo Smart</option>
                  <option value="TEACHERS">Teacher Picks</option>
                </select>

                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-white border-2 border-slate-200 text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
                    className="w-full bg-white border-2 border-slate-200 text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
                    className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-wider px-3 py-2 rounded-xl hover:bg-indigo-50 hover:bg-indigo-50 transition-all"
                  >
                     Reset
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
                    <h4 className="font-black text-slate-600 uppercase tracking-widest text-xs">No materials found in this category</h4>
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
                        className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-black/30 transition-all flex flex-col justify-between group"
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
                            className={`rounded-xl py-2.5 font-bold uppercase tracking-wider text-[9px] transition-all border ${usageCount >= 5 && !isPro
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
                            icon={isSyllabus ? <Library className="w-3 h-3" /> : usageCount >= 5 && !isPro ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          >
                            {isSyllabus ? 'Open Guide' : usageCount >= 5 && !isPro ? 'Limit Reached' : 'Study'}
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
                            icon={isPastPaper ? <ClipboardList className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            title={isPastPaper ? "Start structured exam" : "Download"}
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
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 pb-safe flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Home</span>
            </button>
            <button onClick={() => setMode('NOTEBOOK')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-indigo-600 scale-110">
              <BookMarked className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">My Notes</span>
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
      const libraryGradeScope = selectedGrade !== 'ALL' ? selectedGrade : (studentProfile?.grade || enrolledGrade);
      const learnerGradeKey = normalizeGrade(libraryGradeScope || '');
      const isPublishedPaper = (material: any) => normalizeMaterialCategory(material?.category) === 'PAST_PAPER';
      const isSomaOriginalPaper = (material: any) => {
        const normalizedCategory = normalizeMaterialCategory(material?.category);
        const source = String(material?.source || material?.marking_scheme_source || '').toUpperCase();
        const title = String(material?.title || '').toLowerCase();
        return normalizedCategory === 'PAST_PAPER' && (
          source.includes('STRUCTURED_IMPORT') ||
          /somaai\s+original|original mock|originals/.test(title)
        );
      };
      const parseGradeNumber = (grade: string) => {
        const g = String(grade || '').toLowerCase();
        const match = g.match(/\b(?:grade|form)\s*(\d{1,2})\b/) || g.match(/\b(\d{1,2})\b/);
        return match ? Number(match[1]) : null;
      };
      const compareGradeProximity = (a: string, b: string) => {
        const aGrade = normalizeGrade(a || '');
        const bGrade = normalizeGrade(b || '');
        if (learnerGradeKey) {
          if (aGrade === learnerGradeKey && bGrade !== learnerGradeKey) return -1;
          if (bGrade === learnerGradeKey && aGrade !== learnerGradeKey) return 1;
        }
        const aClusterMatch = !libraryGradeScope ? false : getAcademicCluster(a || '') === getAcademicCluster(libraryGradeScope);
        const bClusterMatch = !libraryGradeScope ? false : getAcademicCluster(b || '') === getAcademicCluster(libraryGradeScope);
        if (aClusterMatch !== bClusterMatch) return aClusterMatch ? -1 : 1;
        const learnerNum = parseGradeNumber(libraryGradeScope || '');
        const aNum = parseGradeNumber(a || '');
        const bNum = parseGradeNumber(b || '');
        const aDistance = learnerNum != null && aNum != null ? Math.abs(aNum - learnerNum) : 99;
        const bDistance = learnerNum != null && bNum != null ? Math.abs(bNum - learnerNum) : 99;
        if (aDistance !== bDistance) return aDistance - bDistance;
        return String(a || '').localeCompare(String(b || ''));
      };
      const purchasedResources = unifiedMaterials.filter(m => getMaterialAccessStatus(m) === 'OWNED');
      const freeStarterResources = unifiedMaterials.filter(m => getMaterialAccessStatus(m) === 'FREE');
      const preferredStarterResources = freeStarterResources.filter(m => {
        if (!libraryGradeScope) return true;
        return normalizeGrade(m.grade || '') === normalizeGrade(libraryGradeScope);
      });
      const featuredPaperResources = (preferredStarterResources.length > 0 ? preferredStarterResources : freeStarterResources)
        .filter(m => isPublishedPaper(m))
        .sort((a, b) => compareGradeProximity(a.grade || '', b.grade || ''))
        .slice(0, 3);
      const proVaultResources = unifiedMaterials.filter(m => getMaterialAccessStatus(m) === 'PRO_INCLUDED' || getMaterialAccessStatus(m) === 'PRO_LOCKED');
      const unlockedResources = unifiedMaterials.filter(m => {
        const status = getMaterialAccessStatus(m);
        const normalizedCategory = normalizeMaterialCategory(m.category);
        if (isStarterCategory(normalizedCategory)) return true;
        return status === 'OWNED' || status === 'FREE' || status === 'PRO_INCLUDED';
      });
      const starterPaperResources = featuredPaperResources.length > 0
        ? featuredPaperResources
        : unlockedResources
            .filter(m => isPublishedPaper(m))
            .sort((a, b) => compareGradeProximity(a.grade || '', b.grade || ''))
            .slice(0, 3);

      const activeList =
        libraryView === 'PURCHASED'
          ? purchasedResources
          : libraryView === 'PRO_VAULT'
            ? (isPro ? proVaultResources : [])
            : unlockedResources;

      // Extract unique subjects from current view for filtering
      const subjectsList = ['ALL', ...Array.from(new Set(activeList.map(m => m.subject).filter(Boolean))).sort()];


      const gradeScopedLibraryMaterials = activeList
        .filter(m => {
          const materialLevel = getGradeLevel(m.grade || '');
          const matchesEducationLevel = materialLevel === educationLevel;
          const matchesStudentRange = !studentProfile?.grade || isGradeInStudentRange(m.grade || '', studentProfile.grade);
          return matchesEducationLevel && matchesStudentRange;
        })
        .sort((a, b) => compareGradeProximity(a.grade || '', b.grade || ''));

      const exactGradeLibraryMaterials = gradeScopedLibraryMaterials.filter(m => {
        const matchesSubject = activeLibrarySubject === 'ALL' || m.subject === activeLibrarySubject;
        const matchesGrade = !libraryGradeScope || normalizeGrade(m.grade || '') === normalizeGrade(libraryGradeScope);
        return matchesSubject && matchesGrade;
      });

      const visibleLibraryMaterials = (exactGradeLibraryMaterials.length > 0
        ? exactGradeLibraryMaterials
        : gradeScopedLibraryMaterials.filter(m => activeLibrarySubject === 'ALL' || m.subject === activeLibrarySubject))
        .filter(m => normalizeMaterialCategory(m.category) !== 'SYLLABUS');
      const showingGradeFallback = exactGradeLibraryMaterials.length === 0 && gradeScopedLibraryMaterials.length > 0;
      const categoryLibraryMaterials = activeLibraryCategory === 'ALL'
        ? visibleLibraryMaterials
        : visibleLibraryMaterials.filter(m => normalizeMaterialCategory(m.category) === activeLibraryCategory);

      // Group filtered books by category
      const syllabuses = [] as typeof categoryLibraryMaterials;
      const originalPapers = categoryLibraryMaterials.filter(m => isPublishedPaper(m));
      const studyNotes = categoryLibraryMaterials.filter(m => normalizeMaterialCategory(m.category) === 'NOTES');

      // Helper to generate a gradient background class based on the subject name
      const getSubjectGradient = (subj: string) => {
        const s = String(subj || '').toLowerCase();
        if (s.includes('math') || s.includes('calc')) return 'from-blue-600 to-indigo-800 text-blue-100';
        if (s.includes('bio') || s.includes('scie') || s.includes('agri')) return 'from-emerald-600 to-teal-800 text-emerald-100';
        if (s.includes('chem') || s.includes('phys')) return 'from-cyan-600 to-blue-800 text-cyan-100';
        if (s.includes('kisw') || s.includes('swah')) return 'from-amber-500 to-orange-700 text-amber-100';
        if (s.includes('cre') || s.includes('ire') || s.includes('hist') || s.includes('geog') || s.includes('social')) return 'from-purple-600 to-fuchsia-800 text-purple-100';
        return 'from-slate-700 to-slate-900 text-slate-100';
      };

      const libraryCategoryMeta = {
        ALL: { label: 'All', count: visibleLibraryMaterials.length, pill: 'bg-slate-50 text-slate-600 dark:text-slate-200' },
        PAST_PAPER: { label: 'Exam Papers', count: visibleLibraryMaterials.filter(m => isPublishedPaper(m)).length, pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200' },
        NOTES: { label: 'Notes', count: visibleLibraryMaterials.filter(m => normalizeMaterialCategory(m.category) === 'NOTES').length, pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200' },
      } as const;

      // Helper to get cover illustration emoji
      const getSubjectEmoji = (subj: string) => {
        const s = String(subj || '').toLowerCase();
        if (s.includes('math') || s.includes('calc')) return 'Math';
        if (s.includes('bio')) return 'Biology';
        if (s.includes('agri')) return 'Agriculture';
        if (s.includes('scie')) return 'Science';
        if (s.includes('chem')) return 'Chemistry';
        if (s.includes('phys')) return 'Physics';
        if (s.includes('kisw') || s.includes('swah')) return 'Kiswahili';
        if (s.includes('cre') || s.includes('ire')) return 'CRE';
        if (s.includes('hist') || s.includes('social')) return 'History';
        return 'Books';
      };

      return (
        <div className="bg-slate-50 min-h-screen pb-32 max-w-4xl mx-auto shadow-2xl border-x border-slate-100 flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">My Library</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.15em] mt-1.5">Published Papers / Exam Papers</p>
            </div>
            <button onClick={() => setMode('MENU')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-slate-950 to-blue-700 p-5 text-white shadow-xl shadow-indigo-500/20 mb-6">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Published papers first</p>
                  <h2 className="mt-2 text-xl font-black leading-tight">Welcome and start learning with a real paper.</h2>
                  <p className="mt-2 text-sm text-indigo-50/90 max-w-xl">Open a curated original mock, work through it under time, and use the feedback to recover marks fast.</p>
                </div>
                <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200">
                  <Layers className="h-6 w-6 text-emerald-200" />
                </div>
              </div>
              {starterPaperResources.length > 0 ? (
                <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                  {starterPaperResources.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => { setMode('REVISION'); setPendingMaterialId(item.id); }}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Featured paper</p>
                      <p className="mt-2 text-sm font-bold leading-snug line-clamp-2">{item.title}</p>
                      <p className="mt-2 text-[11px] text-indigo-100/80">Open this paper now.</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="relative mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  We&apos;re preparing your published papers. As soon as one is ready, it appears here first.
                </div>
              )}
            </div>

            {showingGradeFallback && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                Showing Grade {studentProfile?.grade || enrolledGrade || 'ready'} materials while we finish matching exact papers.
              </div>
            )}

            {/* Library Category Tabs */}
            <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => {
                  setLibraryView('UNLOCKED');
                  setActiveLibrarySubject('ALL');
                  trackFunnelEvent('library_view_changed', { view: 'UNLOCKED' });
                }}
                className={`rounded-xl px-3 py-2 text-center transition-all font-black text-xs ${libraryView === 'UNLOCKED'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-600'
                }`}
              >
                Unlocked ({unlockedResources.length})
              </button>
              <button
                onClick={() => {
                  setLibraryView('PURCHASED');
                  setActiveLibrarySubject('ALL');
                  trackFunnelEvent('library_view_changed', { view: 'PURCHASED' });
                }}
                className={`rounded-xl px-3 py-2 text-center transition-all font-black text-xs ${libraryView === 'PURCHASED'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-600'
                }`}
              >
                Purchased ({purchasedResources.length})
              </button>
              <button
                onClick={() => {
                  setLibraryView('PRO_VAULT');
                  setActiveLibrarySubject('ALL');
                  trackFunnelEvent('library_view_changed', { view: 'PRO_VAULT' });
                }}
                className={`rounded-xl px-3 py-2 text-center transition-all font-black text-xs ${libraryView === 'PRO_VAULT'
                  ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-600'
                }`}
              >
                Pro Vault ({proVaultResources.length})
              </button>
            </div>

            {/* Category Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-100 p-1 rounded-2xl">
              {(['ALL', 'PAST_PAPER', 'NOTES'] as const).map(tabKey => {
                const tab = libraryCategoryMeta[tabKey];
                return (
                  <button
                    key={tabKey}
                    onClick={() => setActiveLibraryCategory(tabKey)}
                    className={`rounded-xl px-3 py-2 text-center transition-all font-black text-[10px] sm:text-xs leading-tight ${activeLibraryCategory === tabKey
                      ? 'bg-white text-slate-900 dark:text-white shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-750 dark:hover:text-slate-600'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 uppercase tracking-[0.14em] ${tab.pill}`}>{tab.label}</span>
                    <span className="mt-1 block text-[9px] opacity-70">{tab.count}</span>
                  </button>
                );
              })}
            </div>

            {/* Subject Filters Row */}
            {subjectsList.length > 2 && (
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none no-scrollbar shrink-0">
                {subjectsList.map(subj => (
                  <button
                    key={subj}
                    onClick={() => setActiveLibrarySubject(subj)}
                    className={`px-4 py-2 rounded-full text-xs font-black shrink-0 transition-all ${activeLibrarySubject === subj
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-slate-650 dark:text-slate-400 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {subj === 'ALL' ? 'All Subjects' : `${getSubjectEmoji(subj)} ${subj}`}
                  </button>
                ))}
              </div>
            )}

            {libraryView === 'PRO_VAULT' && !isPro ? (
              /* Premium Paywall Page */
              <div className="py-16 md:py-24 text-center bg-white border-2 border-dashed border-amber-200 dark:border-amber-900/40 rounded-[3rem] mb-6">
                <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border-2 border-amber-200 dark:border-amber-800/30">
                  <Lock className="w-10 h-10 text-amber-500 dark:text-amber-400" />
                </div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Pro Vault is locked</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-8 max-w-sm mx-auto leading-relaxed">Upgrade to unlock premium teacher resources curated for faster exam prep.</p>
                <Button onClick={() => handlePricingNavigation()} className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-100 font-black uppercase tracking-widest text-[10px] border-none">
                  Unlock Pro Vault
                </Button>
              </div>
            ) : categoryLibraryMaterials.length === 0 ? (
              /* Empty Library State */
              <div className="py-16 md:py-28 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border-2 border-slate-300">
                  <Library className="w-10 h-10 text-slate-600 dark:text-slate-600" />
                </div>
                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Nothing in this section yet</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-8 max-w-sm mx-auto leading-relaxed">
                  {activeLibraryCategory === 'PAST_PAPER'
                    ? 'Exam papers for your grade will appear here once they are ready.'
                    : activeLibraryCategory === 'NOTES'
                      ? 'Notes for your grade will appear here once they are ready.'
                      : libraryView === 'PURCHASED'
                        ? 'No purchased materials match this filter yet.'
                        : 'We are matching the closest materials for your grade and subject. Open one now if it looks close enough.'}
                </p>
                {starterPaperResources.length > 0 ? (
                  <div className="mx-auto mb-10 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
                    {starterPaperResources.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        onClick={() => { setMode('REVISION'); setPendingMaterialId(item.id); }}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-300 hover:bg-white hover:bg-slate-50"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Ready original</p>
                        <p className="mt-2 text-sm font-bold leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">{item.title}</p>
                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{item.subject} ? {item.grade}</p>
                        <p className="mt-2 text-[11px] font-black text-indigo-600 dark:text-indigo-400">Open now</p>
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button onClick={() => setMode('REVISION')} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[10px] border-none">
                    Open originals
                  </Button>
                  <Button onClick={() => setMode('MARKETPLACE')} variant="outline" className="px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                    Back to library
                  </Button>
                </div>
              </div>
            ) : (
              /* Redesigned Bookshelf UI */
              <div className="space-y-10 pb-24">
                {/* 2. SomaAI Original Papers */}
                {originalPapers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="p-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600">PDF</span>
                      Exam Papers lane ({originalPapers.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {originalPapers.map(item => (
                        <motion.div
                          key={item.id}
                          whileHover={{ y: -6 }}
                          onClick={() => setLibraryItemPreview(item)}
                          className="flex flex-col cursor-pointer group"
                        >
                          {/* Visual Book Cover */}
                          <div className={`w-full aspect-[3/4] bg-gradient-to-br ${getSubjectGradient(item.subject)} rounded-2xl shadow-lg relative p-4 flex flex-col justify-between overflow-hidden border border-white/10 group-hover:shadow-2xl transition-all ring-1 ring-amber-300/30`}>
                            {/* Book spine simulation */}
                            <div className="absolute top-0 bottom-0 left-0 w-3 bg-white/20 border-r border-white/30" />
                            <div className="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur">
                              Original
                            </div>
                            
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/25 text-white rounded-full">{item.grade}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-500/30 text-amber-100 rounded-full border border-amber-400/20">SomaAI Original</span>
                            </div>
                            
                            <div className="my-auto text-center">
                              <span className="text-4xl block mb-2 filter drop-shadow-md">{getSubjectEmoji(item.subject)}</span>
                              <h4 className="font-black text-sm tracking-tight text-white leading-tight line-clamp-3 px-1">{item.title}</h4>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/20 pt-2 text-[9px] font-bold opacity-80">
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/90">Timed original</span>
                            </div>
                          </div>
                          <span className="mt-2 text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-2 text-center group-hover:text-indigo-600 transition-colors">{item.title}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Study Notes & Guides */}
                {studyNotes.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="p-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600">Note</span>
                      Notes lane ({studyNotes.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {studyNotes.map(item => (
                        <motion.div
                          key={item.id}
                          whileHover={{ y: -6 }}
                          onClick={() => setLibraryItemPreview(item)}
                          className="flex flex-col cursor-pointer group"
                        >
                          {/* Visual Book Cover */}
                          <div className={`w-full aspect-[3/4] bg-gradient-to-br ${getSubjectGradient(item.subject)} rounded-2xl shadow-lg relative p-4 flex flex-col justify-between overflow-hidden border border-white/10 group-hover:shadow-2xl transition-all ring-1 ring-blue-300/30`}>
                            {/* Book spine simulation */}
                            <div className="absolute top-0 bottom-0 left-0 w-3 bg-white/20 border-r border-white/30" />
                            <div className="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur">
                              Notes
                            </div>
                            
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/25 text-white rounded-full">{item.grade}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-500/30 text-blue-100 rounded-full border border-blue-400/20">Study Note</span>
                            </div>
                            
                            <div className="my-auto text-center">
                              <span className="text-4xl block mb-2 filter drop-shadow-md">{getSubjectEmoji(item.subject)}</span>
                              <h4 className="font-black text-sm tracking-tight text-white leading-tight line-clamp-3 px-1">{item.title}</h4>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/20 pt-2 text-[9px] font-bold opacity-80">
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/90">Quick revision</span>
                            </div>
                          </div>
                          <span className="mt-2 text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-2 text-center group-hover:text-indigo-600 transition-colors">{item.title}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Premium Setup/Rewrite Modal */}
          <AnimatePresence>
            {libraryItemPreview && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  className="bg-white rounded-[2.5rem] p-6 max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[9px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">Soma Study Setup</span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">Read & Rewrite Material</h3>
                    </div>
                    <button
                      onClick={() => setLibraryItemPreview(null)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 hover:bg-slate-50 rounded-full text-slate-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Book Preview Detail */}
                  <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-3xl border border-slate-100 dark:border-slate-850">
                    <div className={`w-20 aspect-[3/4] rounded-xl shrink-0 bg-gradient-to-br ${getSubjectGradient(libraryItemPreview.subject)} p-2 flex flex-col justify-between overflow-hidden shadow-md relative border border-slate-200`}>
                      <div className="absolute top-0 bottom-0 left-0 w-2 bg-white/25" />
                      <span className="text-[7px] font-black bg-white/80 text-slate-700 px-1 py-0.5 rounded w-fit leading-none">{libraryItemPreview.grade}</span>
                      <span className="text-xl block text-center my-auto filter drop-shadow">{getSubjectEmoji(libraryItemPreview.subject)}</span>
                      <span className="text-[7px] font-black uppercase text-center text-white/90 leading-none truncate">{libraryItemPreview.subject}</span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{libraryItemPreview.subject} - {libraryItemPreview.grade}</span>
                      <h4 className="font-black text-base text-slate-950 dark:text-white truncate mt-1 leading-tight">{libraryItemPreview.title}</h4>
                      <p className="text-[11px] font-medium text-slate-550 dark:text-slate-400 leading-snug mt-1.5 line-clamp-2">{libraryItemPreview.description || 'Verified curriculum source notes and resources.'}</p>
                    </div>
                  </div>

                  {/* Feature Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-slate-850">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">Book AI Study Guide</h5>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Soma reads the PDF and rewrites it into clean, bite-sized lessons with visual emojis, bold highlights, and curriculum-aligned outlines.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100/50 dark:border-slate-850">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">Audio Lectures</h5>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Generate a narrated audio pod. Sit back and listen to Akili explain the material hands-free.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-slate-850">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">Pop Quizzes & Flashcards</h5>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Turn the material into interactive practice drills instantly to test your memory and lock in grades.</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setLibraryItemPreview(null)}
                      className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-600 font-bold transition-all text-xs"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={() => {
                        const target = libraryItemPreview;
                        setLibraryItemPreview(null);
                        startStudySession(target);
                      }}
                      className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all text-xs shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                      Sparkle Read & Rewrite
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Global Bottom Nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 pb-safe flex justify-between items-center z-50 max-w-4xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <button onClick={() => setMode('MENU')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <Home className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">Home</span>
            </button>
            <button onClick={() => setMode('NOTEBOOK')} className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600">
              <BookMarked className="w-6 h-6" />
              <span className="text-[11px] font-black uppercase tracking-tight">My Notes</span>
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
            className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
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
                <p className="text-slate-600 dark:text-slate-600 font-medium leading-relaxed mb-8 text-center bg-slate-50 p-4 rounded-xl border-2 border-slate-300">
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
    <div className="relative min-h-screen bg-slate-50">
      {/* Sidebar */}
      <LearnerSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={sidebarTab}
        onTabChange={handleSidebarTabChange}
        onProfile={() => runWithRecallExitGuard(() => setMode('PROFILE'))}
        onPlans={() => runWithRecallExitGuard(() => setMode('PRICING'))}
        onParent={() => navigate('/parent')}
        sessionsLeft={Math.max(0, 5 - usageCount)}
      />

      {/* Main Content */}
      <div className="lg:ml-[260px] min-h-screen overflow-x-hidden min-w-0">
        {renderMode()}
      </div>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-[131] rounded-2xl border border-red-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-red-500/40"
          >
            <div className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                <Mic className="h-5 w-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-300">Listening</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Speak your question and Akili will transcribe it for the same learning flow as text.</p>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-600"
              >
                Stop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {micPermissionNotice && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-[430px] z-[130] rounded-2xl border border-amber-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-amber-500/40"
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
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 hover:bg-slate-50 dark:hover:text-slate-200"
                    aria-label="Dismiss microphone notice"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-600">
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
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600 hover:bg-slate-50 dark:text-slate-600 hover:bg-slate-50"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100">Full Step-by-Step Logic</h2>
                    <p className="text-sm font-medium text-slate-500 line-clamp-1">&quot;{fadedSolutionData.query}&quot;</p>
                  </div>
                </div>
                <button
                  onClick={() => setFadedSolutionData(prev => ({ ...prev, show: false }))}
                  className="p-3 hover:bg-slate-100 hover:bg-slate-50 rounded-full transition-colors group"
                >
                  <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-600" />
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
                    <div className="h-8 w-2/3 bg-slate-200 rounded-xl"></div>
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-slate-200 rounded-lg"></div>
                        <div className="h-4 w-5/6 bg-slate-200 rounded-lg"></div>
                        <div className="h-4 w-11/12 bg-slate-200 rounded-lg"></div>
                    </div>
                    <div className="h-32 w-full bg-slate-200 rounded-2xl mt-8"></div>
                    <div className="space-y-3 mt-8">
                        <div className="h-4 w-full bg-slate-200 rounded-lg"></div>
                        <div className="h-4 w-4/5 bg-slate-200 rounded-lg"></div>
                    </div>
                  </div>
                ) : (
                  <div className={`prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-600 ${!isRegistered ? 'pointer-events-none' : ''}`}>
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
                      Sign up free to unlock the complete step-by-step logic. You get <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold mx-1">5 free answers</span> before KES 20/day premium access!
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
                            className="flex-1 sm:flex-none bg-white hover:bg-slate-50 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-6 rounded-xl border-2 border-slate-200 transition-all"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm p-4">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/85 backdrop-blur-sm p-4">
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

                <h3 className="text-xl font-black text-slate-800 mb-2">Continue learning with Akili</h3>
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
                    <li>Continue voice, quizzes, marking, and repair drills with learner plans</li>
                    <li>Notes, original papers, and shareable parent progress proof</li>
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
                    See learner plans
                  </Button>
                  <button
                    onClick={() => {
                      setShowLimitModal(false);
                      handlePricingNavigation();
                    }}
                    className="w-full rounded-2xl border-2 border-indigo-100 bg-indigo-50 px-4 py-3 text-left hover:border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Prefer to keep going?</span>
                    <span className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-slate-800">Open a smaller learner plan</span>
                      <span className="text-sm font-black text-indigo-700">from KES 20</span>
                    </span>
                    <span className="mt-1 block text-[11px] font-bold text-slate-500">
                      Plans keep revision, marking, and voice moving without interruption.
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/85 backdrop-blur-sm p-4">
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
                  Your premium access has expired. Choose a small plan to continue enjoying <span className="text-indigo-600 font-bold">full plan access</span> to learning from as little as <span className="text-indigo-600 font-bold">KES 20</span>.
                </p>

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/85 backdrop-blur-sm p-6 overflow-y-auto">
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



















