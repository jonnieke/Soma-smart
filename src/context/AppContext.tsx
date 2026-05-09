import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LearnerActivity, UserRole, TeacherProfile, TeacherActivity, SchoolProfile, SchoolStats, SchoolTeacher, SchoolMaterial, TeacherWallet, TutoringRequest, MaterialListing, SubscriptionPlan, SubscriptionTier, ChatMessage, SpacedRepetitionItem, TeachingStrategy, PedagogicalAnalytics, EducationLevel } from '../types';
import { processQuizResult, getDueTopics, getWeakTopics, loadSRFromLocal, loadMasteryFromLocal, getPersonalizedChallenge } from '../services/spacedRepetitionService';
import { loadStrategiesFromLocal, approveStrategy as approveStrategyFn, rejectStrategy as rejectStrategyFn, addStrategies, getActiveStrategies, getPendingStrategies } from '../services/strategyService';

// Update interface
interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  learnerHistory: LearnerActivity[];
  saveActivity: (activity: LearnerActivity) => void;
  deleteActivity: (id: string) => void;
  clearHistory: () => void; // New method
  studentCode: string;
  setStudentCode: (code: string) => void;
  isRegistered: boolean;
  studentProfile: { id: string, name: string, grade: string, schoolId?: string, schoolName?: string, email?: string, parentPhone?: string, parentPin?: string, chatApproved?: boolean, sessionId?: string, educationLevel?: EducationLevel, institutionName?: string } | null;
  updateStudentProfile: (updates: { name?: string, grade?: string, parentPhone?: string, educationLevel?: EducationLevel, institutionName?: string }) => Promise<{ success: boolean; message?: string }>;
  usageCount: number;
  incrementUsage: () => void;
  registerStudent: (name: string, grade: string, pin: string, parentPhone?: string, educationLevel?: EducationLevel, institutionName?: string) => Promise<{ success: boolean; message?: string; data?: string }>;
  registerTeacher: (name: string, email: string, password: string, classes: string[], subjects: string[], phone: string) => Promise<{ success: boolean; message?: string }>;
  login: (code: string) => Promise<boolean>;
  loginParent: (code: string, phone: string) => Promise<{ success: boolean; message?: string }>;
  loginTeacher: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (email: string) => Promise<boolean>;
  recoverStudentId: (name: string, pin: string) => Promise<string | null>;
  // Teacher Specific
  teacherUsageCount: number;
  incrementTeacherUsage: () => void;
  teacherDarasaUsage: number;
  incrementTeacherDarasaUsage: () => Promise<void>;
  teacherProfile: TeacherProfile | null;
  updateTeacherProfile: (profile: TeacherProfile) => void;
  teacherHistory: TeacherActivity[];
  saveTeacherActivity: (activity: TeacherActivity) => void;
  deleteTeacherActivity: (id: string) => Promise<void>;
  // Monetization
  teacherWallet: TeacherWallet | null;
  isAvailableForTutoring: boolean;
  toggleTutoringAvailability: () => void;
  requestWithdrawal: (amount: number) => Promise<{ success: boolean; message: string }>;
  fetchEarnings: () => Promise<void>;
  // Tutoring Requests (Phase 2)
  activeTutoringRequests: TutoringRequest[];
  createTutoringRequest: (topic: string, description: string, price: number, grade?: string, subject?: string) => Promise<{ success: boolean; message: string }>;
  acceptTutoringRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  submitTutoringResponse: (requestId: string, response: string, type: 'TEXT' | 'VOICE' | 'VIDEO', pricingType: 'FREE' | 'FIXED' | 'RATE_ME', price: number, attachments: File[]) => Promise<{ success: boolean; message: string }>;
  rateTutoringResponse: (requestId: string, rating: number, feedback?: string) => Promise<{ success: boolean; message: string }>;
  // Chat
  chatMessages: ChatMessage[];
  sendChatMessage: (requestId: string, content: string, type: 'TEXT' | 'VOICE' | 'VIDEO', mediaFile?: File) => Promise<{ success: boolean; message: string }>;
  fetchChatMessages: (requestId: string) => Promise<void>;
  // Parent PIN Chat Approval
  chatApproved: boolean;
  setParentPin: (pin: string) => Promise<{ success: boolean; message: string }>;
  verifyChatPin: (pin: string) => Promise<{ success: boolean; message: string }>;
  // Marketplace
  marketplaceMaterials: MaterialListing[];
  purchasedMaterialIds: string[];
  listMaterial: (listing: Omit<MaterialListing, 'id' | 'downloadCount' | 'rating' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  purchaseMaterial: (materialId: string) => Promise<{ success: boolean; message: string }>;
  // Revision
  revisionUsageCount: number;
  incrementRevisionUsage: () => void;
  // Super Teacher Phase 2: Adaptive Tutoring
  masteryGraph: Record<string, number>;
  spacedRepetitionItems: SpacedRepetitionItem[];
  dueForReview: SpacedRepetitionItem[];
  weakTopics: string[];
  processQuizCompletion: (topic: string, score: number, subject?: string, grade?: string) => void;
  addSpacedRepetitionItem: (item: SpacedRepetitionItem) => void;
  getPersonalizedDailyChallenge: () => { topic: string; title: string; quiz: string; isPersonalized: boolean };
  // Super Teacher Phase 3: Evolutionary Educator
  teachingStrategies: TeachingStrategy[];
  activeStrategies: TeachingStrategy[];
  pendingStrategies: TeachingStrategy[];
  pedagogicalAnalytics: PedagogicalAnalytics | null;
  isAdminAgentRunning: boolean;
  runAdminAgent: () => Promise<void>;
  approveTeachingStrategy: (strategyId: string) => void;
  rejectTeachingStrategy: (strategyId: string) => void;
  // Subscription
  isPro: boolean;
  subscriptionPlan: SubscriptionTier;
  subscriptionExpiry: string | null;
  upgradeAccount: (plan: SubscriptionPlan) => Promise<boolean>;
  verifySubscription: () => Promise<void>;
  logout: () => Promise<void>;
  userId: string | null;
  isOnline: boolean;
  availableQuizzes: TeacherActivity[];
  fetchAvailableQuizzes: (subject?: string) => Promise<void>;
  // School Specific
  schoolProfile: SchoolProfile | null;
  loginSchool: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  registerSchool: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerStudentForSchool: (name: string, grade: string, pin: string) => Promise<{ success: boolean; message?: string; data?: string }>;
  schoolStats: SchoolStats | null;
  schoolTeachers: SchoolTeacher[];
  fetchSchoolStats: () => Promise<void>;
  addTeacherToSchool: (email: string) => Promise<{ success: boolean; message?: string }>;
  addStudentToSchool: (studentId: string) => Promise<{ success: boolean; message?: string }>;
  removeUserFromSchool: (userId: string) => Promise<{ success: boolean; message?: string }>;
  schoolMaterials: SchoolMaterial[];
  shareSchoolMaterial: (material: Partial<SchoolMaterial>) => Promise<{ success: boolean; message?: string }>;
  deleteSchoolMaterial: (id: string) => Promise<{ success: boolean; message?: string }>;
  fetchSchoolMaterials: () => Promise<void>;
  updateSchoolProfile: (updates: { name?: string, email?: string }) => Promise<{ success: boolean; message?: string }>;
  // Language
  language: 'EN' | 'SW';
  toggleLanguage: () => void;
  startGuestSession: () => void;
  // Resource Portal
  resources: any[];
  fetchResources: (grade?: string, subject?: string) => Promise<void>;
  // Session Conflict
  sessionError: 'MULTI_DEVICE' | 'SINGLE_DEVICE' | null;
  resolveSessionConflict: () => Promise<void>;
  setSessionError: (error: 'MULTI_DEVICE' | 'SINGLE_DEVICE' | null) => void;
  refreshProfile: () => Promise<void>;
  downloadUsageCount: number;
  incrementDownloadUsage: () => void;
  extraDownloads: number;
  grantExtraDownloads: (amount: number) => void;
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  // Performance
  lowDataMode: boolean;
  toggleLowDataMode: () => void;
  // Education Level
  educationLevel: EducationLevel;
  setEducationLevel: (level: EducationLevel) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

import { supabase } from '../lib/supabase';
import { checkSubscriptionAccess, updateSubscription, verifyAndFixSubscription } from '../services/subscriptionService';
import { offlineService } from '../services/offlineService';
import { dbService } from '../services/dbService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);

  const [learnerHistory, setLearnerHistory] = useState<LearnerActivity[]>([]);

  // Load history from IndexedDB on mount
  useEffect(() => {
    const loadHistory = async () => {
      const history = await dbService.getLearnerActivities();
      if (history.length > 0) {
        setLearnerHistory(history);
      } else {
        // Fallback to localStorage for migration
        setLearnerHistory(offlineService.getLearnerHistory());
      }
    };
    loadHistory();

    const loadTeacherHistoryDB = async () => {
      const history = await dbService.getTeacherActivities();
      if (history.length > 0) setTeacherHistory(history);
      else setTeacherHistory(offlineService.getTeacherHistory());
    };
    loadTeacherHistoryDB();
  }, [role]);


  const clearHistory = () => {
    setLearnerHistory([]);
    offlineService.clearLearnerHistory();
  };



  const [studentCode, setStudentCode] = useState<string>("");
  const [usageCount, setUsageCount] = useState<number>(() => {
    // For NON-registered users (guests), use the persistent guest key — NOT the daily key.
    // The daily key resets at midnight and would let users bypass the 3-session limit each day.
    // The guest key is LIFETIME (within the browser) and is only cleared on registration/login.
    const guestUsage = localStorage.getItem('somo_guest_usage_general');
    if (guestUsage !== null) {
      return parseInt(guestUsage);
    }
    // Fallback: read the daily key if guest key doesn't exist yet
    const saved = localStorage.getItem('somo_daily_usage');
    const lastDate = localStorage.getItem('somo_daily_date');
    const today = new Date().toLocaleDateString();
    if (lastDate !== today) {
      localStorage.setItem('somo_daily_date', today);
      localStorage.setItem('somo_daily_usage', '0');
      return 0;
    }
    return saved ? parseInt(saved) : 0;
  });
  // studyUsageCount removed
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<{ id: string, name: string, grade: string, schoolId?: string, schoolName?: string, email?: string, parentPhone?: string, parentPin?: string, chatApproved?: boolean, sessionId?: string, educationLevel?: EducationLevel, institutionName?: string } | null>(null);
  const [chatApproved, setChatApproved] = useState<boolean>(false);
  const [educationLevel, setEducationLevelState] = useState<EducationLevel>(() => {
    return (localStorage.getItem('soma_education_level') as EducationLevel) || EducationLevel.SENIOR;
  });

  // Teacher State — guest count persisted daily (registered count comes from Supabase on login)
  const [teacherUsageCount, setTeacherUsageCount] = useState<number>(() => {
    const saved = localStorage.getItem('soma_teacher_usage');
    const lastDate = localStorage.getItem('soma_teacher_date');
    const today = new Date().toLocaleDateString();
    if (lastDate !== today) {
      localStorage.setItem('soma_teacher_date', today);
      localStorage.setItem('soma_teacher_usage', '0');
      return 0;
    }
    return saved ? parseInt(saved) : 0;
  });
  const [teacherDarasaUsage, setTeacherDarasaUsage] = useState<number>(0);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [teacherHistory, setTeacherHistory] = useState<TeacherActivity[]>(offlineService.getTeacherHistory());
  const [availableQuizzes, setAvailableQuizzes] = useState<TeacherActivity[]>([]);
  const [teacherWallet, setTeacherWallet] = useState<TeacherWallet | null>(null);
  const [isAvailableForTutoring, setIsAvailableForTutoring] = useState<boolean>(false);

  const [activeTutoringRequests, setActiveTutoringRequests] = useState<TutoringRequest[]>([]);

  // School State
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [schoolTeachers, setSchoolTeachers] = useState<SchoolTeacher[]>([]);
  const [schoolMaterials, setSchoolMaterials] = useState<SchoolMaterial[]>([]);

  const isOnline = useOnlineStatus();

  // Revision State — persisted daily (same pattern as somo_daily_usage)
  const [revisionUsageCount, setRevisionUsageCount] = useState<number>(() => {
    const saved = localStorage.getItem('soma_revision_usage');
    const lastDate = localStorage.getItem('soma_revision_date');
    const today = new Date().toLocaleDateString();
    if (lastDate !== today) {
      localStorage.setItem('soma_revision_date', today);
      localStorage.setItem('soma_revision_usage', '0');
      return 0;
    }
    return saved ? parseInt(saved) : 0;
  });

  // Super Teacher Phase 2: Adaptive Tutoring State
  const [masteryGraph, setMasteryGraph] = useState<Record<string, number>>(loadMasteryFromLocal);
  const [spacedRepetitionItems, setSpacedRepetitionItems] = useState<SpacedRepetitionItem[]>(loadSRFromLocal);

  // Super Teacher Phase 3: Evolutionary Educator State
  const [teachingStrategies, setTeachingStrategies] = useState<TeachingStrategy[]>(loadStrategiesFromLocal);
  const [pedagogicalAnalytics, setPedagogicalAnalytics] = useState<PedagogicalAnalytics | null>(null);
  const [isAdminAgentRunning, setIsAdminAgentRunning] = useState(false);


  // Subscription State
  const [isPro, setIsPro] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionTier>('FREE');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [downloadUsageCount, setDownloadUsageCount] = useState<number>(() => {
    const saved = localStorage.getItem('soma_download_usage');
    const lastDate = localStorage.getItem('soma_download_date');
    const today = new Date().toLocaleDateString();

    if (lastDate !== today) {
      localStorage.setItem('soma_download_date', today);
      localStorage.setItem('soma_download_usage', '0');
      return 0;
    }
    return parseInt(saved || '0');
  });
  const [extraDownloads, setExtraDownloads] = useState<number>(() => {
    return parseInt(localStorage.getItem('soma_extra_downloads') || '0');
  });
  const [userId, setUserId] = useState<string | null>(null);

  const [language, setLanguage] = useState<'EN' | 'SW'>(() => {
    return (localStorage.getItem('soma_language') as 'EN' | 'SW') || 'EN';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('soma_theme') as 'light' | 'dark';
    if (saved) return saved;
    return 'light';
  });

  type ServerUsageCounts = {
    usage_learner?: number;
    usage_revision?: number;
    usage_download?: number;
    usage_teacher?: number;
  };

  const applyServerUsageCounts = (counts?: ServerUsageCounts) => {
    if (!counts) return;
    if (typeof counts.usage_learner === 'number') setUsageCount(counts.usage_learner);
    if (typeof counts.usage_revision === 'number') setRevisionUsageCount(counts.usage_revision);
    if (typeof counts.usage_download === 'number') setDownloadUsageCount(counts.usage_download);
    if (typeof counts.usage_teacher === 'number') setTeacherUsageCount(counts.usage_teacher);
  };

  const incrementRegisteredUsage = async (type: 'learner' | 'revision' | 'download' | 'teacher') => {
    // Learners lack Supabase Auth JWT, so the edge function will fail with 401. Use RPC instead.
    if (type === 'learner' && userId) {
      const { data, error } = await supabase.rpc('increment_profile_ai_usage', {
        p_profile_id: userId,
        p_usage_kind: 'learner',
        p_limit: 10000
      });
      if (!error && data && data.length > 0) {
        setUsageCount(data[0].usage_count);
      }
      return;
    }

    const { data, error } = await supabase.functions.invoke('usage-limits/increment', {
      body: { type }
    });

    if (error) {
      throw error;
    }

    applyServerUsageCounts(data?.counts);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('soma_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Marketplace State
  const [marketplaceMaterials, setMarketplaceMaterials] = useState<MaterialListing[]>([]);
  const [purchasedMaterialIds, setPurchasedMaterialIds] = useState<string[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const [sessionError, setSessionError] = useState<'MULTI_DEVICE' | 'SINGLE_DEVICE' | null>(null);

  const [lowDataMode, setLowDataMode] = useState<boolean>(() => {
    return localStorage.getItem('soma_low_data_mode') === 'true';
  });

  const toggleLowDataMode = () => {
    setLowDataMode(prev => {
      const newVal = !prev;
      localStorage.setItem('soma_low_data_mode', String(newVal));
      return newVal;
    });
  };

  const getEducationLevelFromGrade = (grade: string): EducationLevel => {
    const g = grade.toUpperCase();
    if (g.includes('UNIVERSITY') || g.includes('COLLEGE') || g.includes('YEAR') || g.includes('CAMPUS')) {
      return EducationLevel.CAMPUS;
    }
    const juniorGrades = ['PP1', 'PP2', 'GRADE 1', 'GRADE 2', 'GRADE 3', 'GRADE 4', 'GRADE 5', 'GRADE 6'];
    if (juniorGrades.some(jg => g.includes(jg))) {
      return EducationLevel.JUNIOR;
    }
    // Default to Senior for Grade 7-12, Form 1-4, KCSE, KPSEA
    return EducationLevel.SENIOR;
  };

  const setEducationLevel = (level: EducationLevel) => {
    if (isRegistered) {
      console.warn("Cannot switch education level for registered user.");
      return;
    }
    setEducationLevelState(level);
    localStorage.setItem('soma_education_level', level);
    // Also persist to Supabase if user is logged in
    if (userId) {
      supabase.from('profiles').update({ education_level: level }).eq('id', userId);
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let currentUserId = session?.user?.id;

    // If no auth session, check local storage for student code
    if (!currentUserId) {
      const savedStudentCode = localStorage.getItem('soma_active_student');
      if (savedStudentCode) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('student_id', savedStudentCode)
          .maybeSingle();
        if (profile) currentUserId = profile.id;
      }
    }

    if (currentUserId) {
      // Fetch latest profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      if (profile) {
        if (profile.role === 'LEARNER' || profile.role === 'REVISION') {
          setStudentProfile({
            id: profile.id,
            name: profile.full_name,
            grade: profile.grade,
            schoolName: profile.school_name,
            email: profile.email,
            parentPhone: profile.parent_phone,
            parentPin: profile.parent_pin,
            chatApproved: profile.chat_approved,
            sessionId: profile.session_id,
            educationLevel: profile.education_level || EducationLevel.SENIOR,
            institutionName: profile.institution_name
          });
          setChatApproved(!!profile.chat_approved);
          setIsRegistered(true);
          setRole(profile.role === 'REVISION' ? UserRole.REVISION : UserRole.LEARNER);
          setEducationLevelState(profile.education_level || EducationLevel.SENIOR);
        } else if (profile.role === 'TEACHER') {
          setRole(UserRole.TEACHER);
          setTeacherProfile({
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            classes: profile.classes || [],
            subjects: profile.subjects || [],
            schoolId: profile.school_id,
            sessionId: profile.session_id,
            isAvailable: profile.is_available
          });
        } else if (profile.role === 'SCHOOL') {
          setRole(UserRole.SCHOOL);
          setSchoolProfile({
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            teacherLimit: profile.teacher_limit || 20,
            studentLimit: profile.student_limit || 100,
            subscriptionStatus: profile.subscription_status || 'TRIAL',
            expiry: profile.expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            sessionId: profile.session_id
          });
        }

        // Check subscription
        const access = await checkSubscriptionAccess(currentUserId, profile.role === 'TEACHER' ? 'TEACHER' : 'STUDENT');
        setIsPro(access.isPro);
        setSubscriptionPlan(access.tier);
        setSubscriptionExpiry(access.expiry);
      }
    }
  };

  const incrementDownloadUsage = () => {
    if (userId && isRegistered && role !== UserRole.GUEST) {
      setDownloadUsageCount(prev => prev + 1);
      incrementRegisteredUsage('download').catch(error => {
        console.error('Failed to sync download usage:', error);
      });
      return;
    }

    setDownloadUsageCount(prev => {
      const newVal = prev + 1;
      localStorage.setItem('soma_download_usage', newVal.toString());
      localStorage.setItem('soma_download_date', new Date().toLocaleDateString());
      return newVal;
    });
  };

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'EN' ? 'SW' : 'EN';
      localStorage.setItem('soma_language', newLang);
      return newLang;
    });
  };

  // Single Device Login Session ID
  // Generate a unique ID for this browser tab session on load, persist in sessionStorage to survive refresh
  const [browserSessionId] = useState(() => {
    const stored = sessionStorage.getItem('soma_tab_session_id');
    if (stored) return stored;
    const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('soma_tab_session_id', newId);
    return newId;
  });

  const logout = async () => {
    await supabase.auth.signOut();
    setRole(UserRole.NONE);
    setStudentCode("");
    setIsRegistered(false);
    setStudentProfile(null);
    setTeacherProfile(null);
    setSchoolProfile(null);
    setLearnerHistory([]); // Clear state
    setPurchasedMaterialIds([]); // Clear state
    setTeacherHistory([]);
    setTeacherWallet(null);
    setIsPro(false);
    setSubscriptionPlan('FREE');
    setSubscriptionExpiry(null);

    // Clear Persisted Data
    localStorage.removeItem('soma_active_student');
    offlineService.clearLearnerHistory();
    offlineService.clearTeacherHistory();

    setUserId(null);
  };

  // Persistence for tutoring available (legacy fallback)
  useEffect(() => {
    if (userId && role === UserRole.TEACHER) {
      supabase.from('profiles').update({ is_available: isAvailableForTutoring }).eq('id', userId);
    }
  }, [isAvailableForTutoring, userId, role]);

  // Periodic Session Check
  useEffect(() => {
    if (!userId) return;

    const checkSession = async () => {
      try {
        // Defensive: Check if column exists by attempting to select it
        const { data, error } = await supabase
          .from('profiles')
          .select('session_id, active_sessions')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn("Session check warning:", error.message);
          return;
        }

        if (data) {
          // Bypass strict session validation for learners/guests because RLS prevents anonymous active_sessions updates
          if (role === UserRole.LEARNER || role === UserRole.REVISION || role === UserRole.GUEST) {
            return;
          }

          let hasConflict = false;
          // Multi-Device logic only if column exists
          if (data && 'active_sessions' in data && data.active_sessions && Array.isArray(data.active_sessions) && data.active_sessions.length > 0) {
            if (!data.active_sessions.includes(browserSessionId)) {
              console.warn("Session mismatch! Active:", data.active_sessions, "Current:", browserSessionId);
              setSessionError("MULTI_DEVICE");
              hasConflict = true;
            }
          }
          // Fallback legacy logic
          else if (data && 'session_id' in data && data.session_id && data.session_id !== browserSessionId) {
            console.warn("Session mismatch (legacy)!");
            setSessionError("SINGLE_DEVICE");
            hasConflict = true;
          }

          if (!hasConflict && sessionError) {
            setSessionError(null);
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 15000); // 15s check (more responsive)
    return () => clearInterval(interval);
  }, [userId, browserSessionId, sessionError]);

  const resolveSessionConflict = async () => {
    if (!userId) return;

    try {
      // Fetch latest sessions to ensure we don't wipe out everything if we just want to add ourselves
      const { data } = await supabase.from('profiles').select('active_sessions').eq('id', userId).single();
      const currentSessions = (data?.active_sessions as string[]) || [];

      // Add current session and keep last 2
      const newSessions = [...currentSessions.filter(s => s !== browserSessionId), browserSessionId].slice(-2);

      await supabase.from('profiles').update({
        session_id: browserSessionId,
        active_sessions: newSessions
      }).eq('id', userId);

      setSessionError(null);
    } catch (e) {
      console.error("Failed to resolve conflict", e);
    }
  };

  // --- Initial Load from Supabase & Local Storage ---
  useEffect(() => {
    const initSession = async () => {
      // 1. Check if we have an active Supabase session (Teacher/Student via Auth)
      const { data: { session } } = await supabase.auth.getSession();
      let currentUserId = null;

      if (session) {
        currentUserId = session.user.id;
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          setUserId(session.user.id);
          // Update Session ID on init if it's yours (or take over)
          // Actually, we should only take over on explicit login action, 
          // but if refreshing page, we want to keep session.
          // Problem: If valid session exists in DB, we should match it or take it over?
          // If we take it over on refresh, we might kick out other tabs.
          // Better approach: On explicit LOGIN action, we set session_id.
          // On page load (refresh), we check if DB session_id matches ours?
          // If browserSessionId is new on refresh (it is), we might kick ourselves out.
          // We need to persist browserSessionId in sessionStorage to survive refresh!

          if (profile.role === 'LEARNER' || profile.role === 'REVISION') {
            const level = getEducationLevelFromGrade(profile.grade || '');
            const usageIsCurrent = profile.usage_date === new Date().toISOString().slice(0, 10);
            setStudentProfile({
              id: profile.id,
              name: profile.full_name,
              grade: profile.grade,
              schoolName: profile.school_name,
              email: profile.email,
              parentPhone: profile.parent_phone,
              sessionId: profile.session_id,
              educationLevel: level,
              institutionName: profile.institution_name
            });
            setRole(profile.role === 'REVISION' ? UserRole.REVISION : UserRole.LEARNER);
            setEducationLevelState(level);
            localStorage.setItem('soma_education_level', level);
            setUsageCount(usageIsCurrent ? (profile.usage_learner || 0) : 0);
            setRevisionUsageCount(usageIsCurrent ? (profile.usage_revision || 0) : 0);
            setDownloadUsageCount(usageIsCurrent ? (profile.usage_download || 0) : 0);
          } else if (profile.role === 'TEACHER') {
            const usageIsCurrent = profile.usage_date === new Date().toISOString().slice(0, 10);
            setRole(UserRole.TEACHER);
            setTeacherProfile({
              id: profile.id,
              name: profile.full_name,
              email: profile.email,
              classes: profile.classes || [],
              subjects: profile.subjects || [],
              schoolId: profile.school_id,
              sessionId: profile.session_id,
              isAvailable: profile.is_available
            });
            setTeacherUsageCount(usageIsCurrent ? (profile.usage_teacher || 0) : 0);
            setTeacherDarasaUsage(profile.usage_teacher_darasa || 0);
            setIsAvailableForTutoring(!!profile.is_available);
          } else if (profile.role === 'SCHOOL') {
            setRole(UserRole.SCHOOL);
            setSchoolProfile({
              id: profile.id,
              name: profile.full_name,
              email: profile.email,
              teacherLimit: profile.teacher_limit || 20,
              studentLimit: profile.student_limit || 100,
              subscriptionStatus: profile.subscription_status || 'TRIAL',
              expiry: profile.expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              sessionId: profile.session_id
            });
          }

          // Multi-Device Sync on Init (Defensive)
          if ('active_sessions' in profile) {
            const activeSessions = (profile.active_sessions as string[]) || []; // Using profile from DB directly might be stale if we just fetched it? 
            // We fetched profile above: const { data: profile } ...

            if (!activeSessions.includes(browserSessionId)) {
              console.log("Adding new tab to active sessions...");
              const newSessions = [...activeSessions, browserSessionId].slice(-2);
              await supabase.from('profiles').update({
                session_id: browserSessionId,
                active_sessions: newSessions
              }).eq('id', profile.id);
            }
          }

          // Backward compat
          if (!profile.session_id) {
            await supabase.from('profiles').update({ session_id: browserSessionId }).eq('id', profile.id);
          }
        }
      } else {
        // 2. No Supabase session? Check for persistent local Student ID
        const savedStudentCode = localStorage.getItem('soma_active_student');
        if (savedStudentCode) {
          console.log("Found persistent student session:", savedStudentCode);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('student_id', savedStudentCode)
            .maybeSingle();

          if (profile) {
            currentUserId = profile.id;
            setUserId(profile.id);
            setStudentCode(profile.student_id);
            setStudentProfile({
              id: profile.id,
              name: profile.full_name,
              grade: profile.grade,
              schoolId: profile.school_id,
              email: profile.email,
              parentPhone: profile.parent_phone,
              sessionId: profile.session_id,
              educationLevel: profile.education_level || EducationLevel.SENIOR,
              institutionName: profile.institution_name
            });
            setEducationLevelState(profile.education_level || EducationLevel.SENIOR);
            // Claim session if missing OR if not in active_sessions (Defensive)
            if ('active_sessions' in profile) {
              const activeSessions = (profile.active_sessions as string[]) || [];
              if (!activeSessions.includes(browserSessionId)) {
                const newSessions = [...activeSessions, browserSessionId].slice(-2);
                await supabase.from('profiles').update({
                  session_id: browserSessionId,
                  active_sessions: newSessions
                }).eq('id', profile.id);
              } else if (!profile.session_id) {
                await supabase.from('profiles').update({ session_id: browserSessionId }).eq('id', profile.id);
              }
            } else if ('session_id' in profile && !profile.session_id) {
              await supabase.from('profiles').update({ session_id: browserSessionId }).eq('id', profile.id);
            }
            setRole(profile.role === 'REVISION' ? UserRole.REVISION : UserRole.LEARNER);
          } else {
            localStorage.removeItem('soma_active_student');
          }
        }
      }

      // 3. Check Subscription Access immediately if we have a user
      if (currentUserId) {
        // Use a defensive segment determination
        let segment: 'STUDENT' | 'TEACHER' = 'STUDENT';

        // Quick re-check profile role if needed, or rely on what we set above 
        // In local state, it's safer to fetch again or use a local variable from the blocks above.
        // Let's use the currentUserId to get the role if not already known.
        const { data: roleCheck } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUserId)
          .maybeSingle();

        if (roleCheck?.role === 'TEACHER') {
          segment = 'TEACHER';
        }

        const access = await checkSubscriptionAccess(currentUserId, segment);
        setIsPro(access.isPro);
        setSubscriptionPlan(access.tier);
        setSubscriptionExpiry(access.expiry);
      } else {
        // RESET STATE if no user found (Prevents stale data leak)
        setIsPro(false);
        setSubscriptionPlan('FREE');
        setSubscriptionExpiry(null);
      }

      // 4. Finally set registration status (triggers UI)
      if (currentUserId) {
        setIsRegistered(true);
      }
    };
    initSession();
  }, []);



  const registerStudent = async (name: string, grade: string, pin: string, parentPhone?: string, regEducationLevel?: EducationLevel, institutionName?: string): Promise<{ success: boolean; message?: string; data?: string }> => {
    try {
      // CLEAR ANY EXISTING SESSIONS FIRST
      // Note: registerStudent uses signUp which might auto-sign in, but if a Teacher is logged in, 
      // signUp might behave differently or error if we don't signOut first?
      // Supabase signUp signs in the NEW user automatically.
      // But good practice to clear local state.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
      setTeacherProfile(null);
      setTeacherHistory([]);
      setSchoolProfile(null);
      setRole(UserRole.NONE);

      console.log("Attempting registration via signUp (Email/Pass)...");
      const dummyId = Math.random().toString(36).substring(7);
      const email = `student-${Date.now()}-${dummyId}@soma.app`;
      const password = `soma-${Date.now()}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No User ID returned from SignUp");

      const newCode = "SOMA-" + Math.floor(1000 + Math.random() * 9000);

      const { error: dbError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'LEARNER',
        full_name: name,
        grade: grade,
        student_id: newCode,
        recovery_pin: pin,
        parent_phone: parentPhone,
        session_id: browserSessionId,
        active_sessions: [browserSessionId], // Init with current
        education_level: regEducationLevel || EducationLevel.SENIOR,
        institution_name: institutionName || null
      });

      if (dbError) throw dbError;

      setStudentCode(newCode);
      setStudentProfile({ id: userId, name, grade, parentPhone, educationLevel: regEducationLevel || EducationLevel.SENIOR, institutionName });
      setIsRegistered(true);
      setRole(UserRole.LEARNER);
      setEducationLevel(regEducationLevel || EducationLevel.SENIOR);

      localStorage.setItem('soma_active_student', newCode);

      try {
        const history = JSON.parse(localStorage.getItem('soma_recent_login') || '[]');
        const newItem = { code: newCode, name, timestamp: Date.now() };
        const updated = [newItem, ...history.filter((h: any) => h.code !== newCode)].slice(0, 5);
        localStorage.setItem('soma_recent_login', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save local history", e);
      }

      return { success: true, data: newCode };

    } catch (error: any) {
      console.error("Registration Failed:", error);
      return { success: false, message: error.message || "Registration failed" };
    }
  };

  const recoverStudentId = async (name: string, pin: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('student_id')
        .ilike('full_name', name)
        .eq('recovery_pin', pin)
        .maybeSingle();

      if (error) throw error;
      return data?.student_id || null;
    } catch (e) {
      console.error("Recovery Failed:", e);
      return null;
    }
  };

  const loginTeacher = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });

      if (error) {
        console.error("Supabase Auth Error:", error.message);
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Fetch profile to set state
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();

        if (profileError) {
          console.error("Profile Fetch Error:", profileError.message);
        }

        if (profile) {
          setTeacherProfile({
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            classes: profile.classes || [],
            subjects: profile.subjects || [],
            schoolId: profile.school_id,
            sessionId: browserSessionId
          });
          setRole(UserRole.TEACHER);
          setTeacherDarasaUsage(profile.usage_teacher_darasa || 0);

          // Multi-Device Logic: Keep last 2 sessions
          const currentSessions = (profile.active_sessions as string[]) || [];
          const newSessions = [...currentSessions, browserSessionId].slice(-2); // Keep max 2

          await supabase.from('profiles').update({
            session_id: browserSessionId, // Update primary for legacy
            active_sessions: newSessions
          }).eq('id', data.user.id);

          // Clear Learner Session for clarity
          setStudentCode("");
          setStudentProfile(null);
          localStorage.removeItem('soma_active_student');

          return { success: true };
        } else {
          console.warn("CRITICAL: Auth succeeded but NO PROFILE found. Attempting to auto-create profile...");

          // Auto-repair: Create or fix a basic profile
          const { error: insertError } = await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              full_name: email.split('@')[0], // Fallback name from email
              role: 'TEACHER',
              email: email,
              classes: [],
              subjects: []
            }
          ]);

          if (insertError) {
            console.error("Auto-repair profile failed:", insertError);
            return { success: false, message: "Account profile could not be repaired: " + insertError.message };
          }

          // Retry fetching profile
          const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();

          if (newProfile) {
            console.log("Profile auto-created successfully.");
            setTeacherProfile({
              id: newProfile.id,
              name: newProfile.full_name,
              classes: newProfile.classes || [],
              subjects: newProfile.subjects || []
            });
            setRole(UserRole.TEACHER);
            setTeacherDarasaUsage(newProfile.usage_teacher_darasa || 0);
            return { success: true };
          } else {
            return { success: false, message: "Failed to create profile." };
          }
        }
      }
      return { success: false, message: "No user returned" };
    } catch (e: any) {
      console.error("Teacher Login Exception:", e);
      return { success: false, message: e.message || "Login Exception" };
    }
  };

  const loginSchool = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, message: error.message };

      if (data.user) {
        let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();

        // REPAIR LOGIC: If profile missing but authenticated as SCHOOL, recreate it
        if (!profile && data.user.user_metadata?.role === 'SCHOOL') {
          console.log("Repairing missing school profile...");
          const { error: upsertError } = await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              full_name: data.user.user_metadata.full_name || 'School Account',
              role: 'SCHOOL',
              email: email,
              // Omit columns with defaults to reduce risk of schema mismatches
              session_id: browserSessionId,
              active_sessions: [browserSessionId],
              // Add these as they might be required by a shared schema
              classes: [],
              subjects: []
            }
          ]);

          if (upsertError) {
            console.error("Profile repair failed during upsert:", {
              message: upsertError.message,
              details: upsertError.details,
              hint: upsertError.hint,
              code: upsertError.code
            });
          } else {
            // Fetch the newly created profile
            const { data: newProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            if (newProfile) {
              profile = newProfile;
              console.log("School profile repaired successfully.");
            } else if (fetchError) {
              console.error("Failed to fetch repaired profile:", fetchError);
            }
          }
        }

        if (profile && profile.role === 'SCHOOL') {
          setSchoolProfile({
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            teacherLimit: profile.teacher_limit || 20,
            studentLimit: profile.student_limit || 100,
            subscriptionStatus: profile.subscription_status || 'TRIAL',
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            sessionId: browserSessionId
          });
          setRole(UserRole.SCHOOL);

          // Multi-Device Logic
          const currentSessions = (profile.active_sessions as string[]) || [];
          const newSessions = [...currentSessions, browserSessionId].slice(-2);

          await supabase.from('profiles').update({
            session_id: browserSessionId,
            active_sessions: newSessions
          }).eq('id', data.user.id);

          // Clear others
          setStudentCode("");
          setStudentProfile(null);
          setTeacherProfile(null);
          localStorage.removeItem('soma_active_student');

          return { success: true };
        } else if (profile && profile.role !== 'SCHOOL') {
          return { success: false, message: "This account is not registered as a School. Please use the correct login tab." };
        }
      }
      return { success: false, message: "Account not found." };
    } catch (e: any) {
      return { success: false, message: e.message || "Login failed" };
    }
  };

  const registerSchool = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role: 'SCHOOL' } }
      });
      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert([
          {
            id: data.user.id,
            full_name: name,
            role: 'SCHOOL',
            email: email,
            teacher_limit: 20,
            student_limit: 100,
            subscription_status: 'TRIAL',
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            session_id: browserSessionId,
            active_sessions: [browserSessionId],
            classes: [],
            subjects: []
          }
        ]);

        if (profileError) {
          console.error("School profile creation failed:", profileError);
          // We don't necessarily throw here because repair logic will handle it during login, 
          // but we should log it clearly.
        }

        setSchoolProfile({
          id: data.user.id,
          name,
          email,
          teacherLimit: 20,
          studentLimit: 100,
          subscriptionStatus: 'TRIAL',
          expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
        setRole(UserRole.SCHOOL);

        // Clear others
        setStudentCode("");
        setStudentProfile(null);
        setTeacherProfile(null);
        localStorage.removeItem('somo_active_student');

        return { success: true };
      }
      return { success: false, message: "Signup failed." };
    } catch (e: any) {
      return { success: false, message: e.message || "Registration failed" };
    }
  };

  const registerStudentForSchool = async (name: string, grade: string, pin: string): Promise<{ success: boolean; message?: string; data?: string }> => {
    if (!schoolProfile) return { success: false, message: "Not logged in as School" };

    // Check Limits
    if (schoolStats.students >= schoolProfile.studentLimit) {
      return { success: false, message: `Student limit reached (${schoolProfile.studentLimit}). Please upgrade your plan.` };
    }

    try {
      // CLEAR ANY EXISTING SESSIONS FIRST to avoid auth conflicts
      const { data: { session } } = await supabase.auth.getSession();

      const dummyId = Math.random().toString(36).substring(7);
      const email = `std-${dummyId}-${Date.now()}@somo-school.app`;
      const password = `somo-std-${Date.now()}`;

      // This uses service-level registration via signUp (no verification needed for these internal accounts)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No User ID returned from SignUp");

      const newCode = "SS-" + Math.floor(1000 + Math.random() * 9000);

      const { error: dbError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'LEARNER',
        full_name: name,
        grade: grade,
        student_id: newCode,
        recovery_pin: pin,
        school_id: schoolProfile.id
      });

      if (dbError) throw dbError;

      // Auto-Update stats
      await fetchSchoolStats();

      // If we were logged in as a school, supa auth might have shifted to the new student.
      // We MUST ensure we are still school if we want to continue.
      // However, usually we should re-login or use a service role if available.
      /**
       * @warning TECHNICAL DEBT
       * supabase.auth.signUp automatically logs in the new user in the client-side SDK.
       * This displaces the School Admin session.
       * RECOMMENDED FIX: Implement a Supabase Edge Function using the Service Role Key
       * to create users without changing the current session.
       */

      return { success: true, data: newCode };

    } catch (error: any) {
      console.error("School Student Registration Failed:", error);
      return { success: false, message: error.message || "Registration failed" };
    }
  };

  const fetchSchoolStats = async () => {
    if (!schoolProfile) return;

    try {
      // 1. Fetch Teachers linked to this school
      const { data: teachers, error: tError } = await supabase
        .from('profiles')
        .select('id, full_name, subjects')
        .eq('school_id', schoolProfile.id)
        .eq('role', 'TEACHER');

      if (tError) throw tError;

      // 2. Fetch Students linked to this school
      const { count: studentCount, error: sError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolProfile.id)
        .eq('role', 'LEARNER');

      if (sError) throw sError;

      // 3. Fetch Lessons/Activities for linked teachers
      // This is a bit complex for a single query, so we use a simple count for now
      // ideally we'd join on activities where student_id in (teacher_ids)
      const teacherIds = teachers.map(t => t.id);
      let lessonCount = 0;
      if (teacherIds.length > 0) {
        const { count, error: lError } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .in('student_id', teacherIds);
        if (!lError) lessonCount = count || 0;
      }

      // 4. Calculate Trends (Simplified logic)
      const teacherTrend = teachers.length > 50 ? "Elite Tier" : (teachers.length > 10 ? "Optimal Staffing" : "Growing Staff");
      const studentTrend = studentCount && studentCount > 100 ? "Highly Scaled" : "Expanding Base";

      setSchoolStats({
        teachers: teachers.length,
        students: studentCount || 0,
        lessons: lessonCount,
        storageUsed: 15.4, // Standardized for now
        teacherTrend,
        studentTrend,
        lessonTrend: lessonCount > 0 ? "Active Learning" : "Initializing"
      });

      setSchoolTeachers(teachers.map(t => ({
        id: t.id,
        name: t.full_name,
        subject: t.subjects?.[0] || 'General Faculty',
        impact: "94%",
        lessons: 12 // Placeholder for individual activity
      })));

    } catch (e) {
      console.error("Error fetching school stats:", e);
    }
  };

  const addTeacherToSchool = async (email: string): Promise<{ success: boolean; message?: string }> => {
    if (!schoolProfile) return { success: false, message: "Not logged in as School" };

    if (schoolStats.teachers >= schoolProfile.teacherLimit) {
      return { success: false, message: `Teacher limit reached (${schoolProfile.teacherLimit}).` };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ school_id: schoolProfile.id })
        .eq('email', email)
        .eq('role', 'TEACHER')
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) return { success: false, message: "Teacher with this email not found." };

      await fetchSchoolStats();
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const addStudentToSchool = async (studentId: string): Promise<{ success: boolean; message?: string }> => {
    if (!schoolProfile) return { success: false, message: "Not logged in as School" };

    if (schoolStats.students >= schoolProfile.studentLimit) {
      return { success: false, message: `Student limit reached (${schoolProfile.studentLimit}).` };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ school_id: schoolProfile.id })
        .eq('student_id', studentId.toUpperCase())
        .eq('role', 'LEARNER')
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) return { success: false, message: "Student with this ID not found." };

      await fetchSchoolStats();
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const removeUserFromSchool = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ school_id: null })
        .eq('id', userId);

      if (error) throw error;
      await fetchSchoolStats();
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password', // Ensure route exists or just main logic
      });

      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error("Reset Password Error:", e);
      alert(e.message || "Failed to send reset email.");
      return false;
    }
  };

  const fetchSchoolMaterials = async () => {
    const currentSchoolId = schoolProfile?.id || studentProfile?.schoolId || teacherProfile?.schoolId;
    if (!currentSchoolId) return;

    try {
      const { data, error } = await supabase
        .from('school_materials')
        .select(`
          *,
          profiles:teacher_id (full_name)
        `)
        .eq('school_id', currentSchoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchoolMaterials((data || []).map(m => ({
        ...m,
        teacher_name: (m.profiles as any)?.full_name || 'School Admin'
      })));
    } catch (e) {
      console.error("Error fetching materials:", e);
    }
  };

  const shareSchoolMaterial = async (material: Partial<SchoolMaterial>): Promise<{ success: boolean; message?: string }> => {
    const currentSchoolId = schoolProfile?.id || teacherProfile?.schoolId;
    if (!currentSchoolId) return { success: false, message: "No school association found." };

    try {
      const { error } = await supabase
        .from('school_materials')
        .insert({
          ...material,
          school_id: currentSchoolId,
          teacher_id: userId
        });

      if (error) throw error;
      await fetchSchoolMaterials();
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const deleteSchoolMaterial = async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.from('school_materials').delete().eq('id', id);
      if (error) throw error;
      await fetchSchoolMaterials();
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const incrementTeacherUsage = async () => {
    const newCount = teacherUsageCount + 1;
    setTeacherUsageCount(newCount);
    if (userId && isRegistered && role !== UserRole.GUEST) {
      incrementRegisteredUsage('teacher').catch(error => {
        console.error('Failed to sync teacher usage:', error);
      });
      return;
    } else {
      // Guest teacher: persist to localStorage so refresh can't bypass limit
      const today = new Date().toLocaleDateString();
      localStorage.setItem('soma_teacher_usage', newCount.toString());
      localStorage.setItem('soma_teacher_date', today);
    }
  };

  const incrementTeacherDarasaUsage = async () => {
    const newCount = teacherDarasaUsage + 1;
    setTeacherDarasaUsage(newCount);
    if (userId) {
      await supabase.from('profiles').update({ usage_teacher_darasa: newCount }).eq('id', userId);
    }
  };

  // Monetization Handlers
  const toggleTutoringAvailability = () => {
    setIsAvailableForTutoring(prev => !prev);
    // In real app, sync with Supabase
  };

  const fetchEarnings = async () => {
    if (!userId) return;
    try {
      // 1. Fetch Wallet
      const { data: wallet } = await supabase.from('teacher_wallets').select('*').eq('id', userId).maybeSingle();

      // 2. Fetch Transactions
      const { data: transactions } = await supabase.from('transactions').select('*').eq('teacher_id', userId).order('created_at', { ascending: false });

      if (wallet) {
        setTeacherWallet({
          balance: wallet.balance,
          currency: wallet.currency,
          lastWithdrawal: wallet.last_withdrawal,
          transactions: (transactions || []).map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: new Date(t.date || t.created_at).toLocaleDateString(),
            status: t.status
          }))
        });
      } else {
        // Auto-create wallet if missing - wrap in try/catch to prevent retry flood
        try {
          await supabase.from('teacher_wallets').insert([{ id: userId, balance: 0, currency: 'KES' }]);
        } catch (insertErr) {
          console.warn('Could not auto-create wallet (RLS may block INSERT):', insertErr);
        }
        setTeacherWallet({ balance: 0, currency: 'KES', transactions: [] });
      }
    } catch (e) {
      console.error("Fetch Earnings Error:", e);
    }
  };

  const requestWithdrawal = async (amount: number) => {
    if (!userId || !teacherWallet || amount > teacherWallet.balance) {
      return { success: false, message: "Insufficient balance" };
    }

    try {
      // Insert withdrawal transaction
      const { error } = await supabase.from('transactions').insert([{
        teacher_id: userId,
        type: 'WITHDRAWAL',
        amount: amount,
        description: 'M-Pesa Withdrawal Request',
        status: 'PENDING'
      }]);

      if (error) throw error;

      // Update wallet balance (In a real app, this should be a transaction/trigger)
      await supabase.from('teacher_wallets').update({ balance: teacherWallet.balance - amount }).eq('id', userId);

      fetchEarnings(); // Refresh
      return { success: true, message: "Withdrawal request submitted via M-Pesa" };
    } catch (e: any) {
      return { success: false, message: e.message || "Withdrawal failed" };
    }
  };

  useEffect(() => {
    if (role === UserRole.TEACHER && isRegistered) {
      fetchEarnings();
    }
  }, [role, isRegistered]);

  const startGuestSession = () => {
    const saved = parseInt(localStorage.getItem('somo_guest_usage_general') || '0');
    const savedRevision = parseInt(localStorage.getItem('somo_guest_usage_revision') || '0');
    setUsageCount(saved);
    setRevisionUsageCount(savedRevision);

    // Reset subscription state for guests
    setIsPro(false);
    setSubscriptionPlan('FREE');
    setSubscriptionExpiry(null);

    setRole(UserRole.GUEST);
  };

  const incrementUsage = () => {
    if (userId && isRegistered && role !== UserRole.GUEST) {
      setUsageCount(prev => prev + 1);
      incrementRegisteredUsage('learner').catch(error => {
        console.error('Failed to sync learner usage:', error);
      });
      return;
    }

    // Non-registered / Guest: persist to the permanent guest key.
    // This key is NEVER daily-reset — it accumulates until the user registers.
    setUsageCount(prev => {
      const newCount = prev + 1;
      localStorage.setItem('somo_guest_usage_general', newCount.toString());
      // Also write to daily key for any legacy reads
      const today = new Date().toLocaleDateString();
      localStorage.setItem('somo_daily_usage', newCount.toString());
      localStorage.setItem('somo_daily_date', today);
      return newCount;
    });
  };

  // incrementStudyUsage removed

  const incrementRevisionUsage = () => {
    if (userId && isRegistered && role !== UserRole.GUEST) {
      setRevisionUsageCount(prev => prev + 1);
      incrementRegisteredUsage('revision').catch(error => {
        console.error('Failed to sync revision usage:', error);
      });
      return;
    }

    setRevisionUsageCount(prev => {
      const newCount = prev + 1;
      const today = new Date().toLocaleDateString();
      localStorage.setItem('soma_revision_usage', newCount.toString());
      localStorage.setItem('soma_revision_date', today);
      // Legacy guest key kept for backward compat
      if (role === UserRole.GUEST) {
        localStorage.setItem('soma_guest_usage_revision', newCount.toString());
      }
      return newCount;
    });
  };

  // --- Super Teacher Phase 2: Adaptive Tutoring Handlers ---
  const processQuizCompletion = (topic: string, score: number, subject?: string, grade?: string) => {
    const result = processQuizResult(topic, score, masteryGraph, spacedRepetitionItems, subject, grade);
    setMasteryGraph(result.mastery);
    setSpacedRepetitionItems(result.srItems);

    // Trigger Celebration on Perfect Score
    if (score === 100) {
      import('canvas-confetti').then(confetti => {
        confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#f59e0b']
        });
      });
    }
  };

  const addSpacedRepetitionItem = (item: SpacedRepetitionItem) => {
    setSpacedRepetitionItems(prev => {
      const exists = prev.find(i => i.topic === item.topic);
      if (exists) return prev;
      const newList = [...prev, item];
      localStorage.setItem('soma_sr_items', JSON.stringify(newList));
      return newList;
    });
  };

  const dueForReview = getDueTopics(spacedRepetitionItems);
  const weakTopics = getWeakTopics(masteryGraph);

  const getPersonalizedDailyChallenge = () => {
    return getPersonalizedChallenge(spacedRepetitionItems, masteryGraph);
  };

  // --- Super Teacher Phase 3: Evolutionary Educator Handlers ---
  const activeStrategies = getActiveStrategies(teachingStrategies);
  const pendingStrategies = getPendingStrategies(teachingStrategies);

  const runAdminAgent = async () => {
    setIsAdminAgentRunning(true);
    try {
      const { fetchPedagogicalAnalytics, generateTeachingStrategies } = await import('../services/adminAgentService');

      // 1. Fetch analytics
      const analytics = await fetchPedagogicalAnalytics();
      setPedagogicalAnalytics(analytics);

      // 2. Generate strategies
      const newStrategies = await generateTeachingStrategies(analytics, activeStrategies);

      // 3. Add to list as PENDING
      const updated = addStrategies(teachingStrategies, newStrategies);
      setTeachingStrategies(updated);
    } catch (e) {
      console.error('Admin Agent failed:', e);
    } finally {
      setIsAdminAgentRunning(false);
    }
  };

  const approveTeachingStrategy = (strategyId: string) => {
    const updated = approveStrategyFn(teachingStrategies, strategyId);
    setTeachingStrategies(updated);
  };

  const rejectTeachingStrategy = (strategyId: string) => {
    const updated = rejectStrategyFn(teachingStrategies, strategyId);
    setTeachingStrategies(updated);
  };

  const grantExtraDownloads = (amount: number) => {
    const newValue = extraDownloads + amount;
    setExtraDownloads(newValue);
    localStorage.setItem('soma_extra_downloads', newValue.toString());
  };

  const fetchResources = async (grade?: string, subject?: string) => {
    try {
      let query = supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });

      if (grade) query = query.eq('grade', grade);
      if (subject) query = query.eq('subject', subject);

      const { data, error } = await query;
      if (error) throw error;

      // For guests or users with no grade set, default to SENIOR (KCSE/KPSEA audience)
      // This prevents the empty state that occurs when profile grade is unset or "Play Group"
      const isGuestOrUnknown = role === UserRole.GUEST || !studentProfile?.grade;
      const effectiveLevel = isGuestOrUnknown ? EducationLevel.SENIOR : educationLevel;

      const filteredData = (data || []).filter(item => {
        const itemLevel = getEducationLevelFromGrade(item.grade || '');
        return itemLevel === effectiveLevel;
      }).filter(item => !/^\d{13}$/.test(item.title));

      setResources(filteredData);
    } catch (e) {
      console.error("Error fetching resources:", e);
    }
  };

  const registerTeacher = async (name: string, email: string, password: string, classes: string[], subjects: string[], phone: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: UserRole.TEACHER,
            full_name: name,
            phone
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile entry if trigger doesn't exist (Manual Fallback)
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: name,
          role: 'TEACHER',
          classes: classes,
          subjects: subjects,
          email: email,
          phone: phone
        });

        if (profileError) console.error("Profile creation warning:", profileError);

        setTeacherProfile({ id: data.user.id, name, email, classes, subjects, phone });
        setRole(UserRole.TEACHER);

        // Clear Learner Session
        setStudentCode("");
        setStudentProfile(null);
        localStorage.removeItem('soma_active_student');

        return { success: true };
      }
      return { success: false, message: "No user returned from signup" };
    } catch (e: any) {
      console.error("Teacher Registration Error:", e);
      return { success: false, message: e.message || "Registration failed" };
    }
  };

  const updateTeacherProfile = async (profile: TeacherProfile) => {
    setTeacherProfile(profile);
    setRole(UserRole.TEACHER);

    // Clear any lingering Learner state when active as Teacher
    setStudentCode("");
    setStudentProfile(null);
    localStorage.removeItem('soma_active_student');

    // Sync to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        full_name: profile.name,
        classes: profile.classes,
        subjects: profile.subjects
      }).eq('id', user.id);
    }
  };

  const saveTeacherActivity = async (activity: TeacherActivity) => {
    // Optimistic UI Update + Local Save
    const internalActivity = { ...activity, pendingSync: !isOnline };
    setTeacherHistory(prev => [internalActivity, ...prev]);

    // High Capacity Save (IndexedDB)
    await dbService.putTeacherActivity(internalActivity);
    // Legacy localStorage sync (Trimmed)
    offlineService.saveTeacherHistory([internalActivity, ...teacherHistory]);

    // Persist to Supabase if Online
    if (isOnline) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        try {
          const { error } = await supabase.from('activities').insert({
            student_id: user.id, // Using user.id as student_id for teachers
            type: activity.type,
            topic: activity.title,
            details: {
              className: activity.className,
              subject: activity.subject,
              content: activity.content
            }
          });

          if (error) console.error("Failed to save teacher activity to DB:", error);
        } catch (e) {
          console.error("Teacher DB Save Exception:", e);
        }
      }
    }
  };

  const updateStudentProfile = async (updates: { name?: string, grade?: string, parentPhone?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!studentProfile?.id) throw new Error("No active student session");

      const newLevel = updates.grade ? getEducationLevelFromGrade(updates.grade) : undefined;
      const { error } = await supabase.from('profiles').update({
        full_name: updates.name,
        grade: updates.grade,
        parent_phone: updates.parentPhone,
        education_level: newLevel
      }).eq('id', studentProfile.id);

      if (error) throw error;

      // Update local state
      if (newLevel) {
        setEducationLevelState(newLevel);
        localStorage.setItem('soma_education_level', newLevel);
      }

      setStudentProfile(prev => prev ? {
        ...prev,
        name: updates.name ?? prev.name,
        grade: updates.grade ?? prev.grade,
        parentPhone: updates.parentPhone ?? prev.parentPhone,
        educationLevel: newLevel ?? prev.educationLevel
      } : null);

      return { success: true };
    } catch (e: any) {
      console.error("Update Profile Error:", e);
      return { success: false, message: e.message || "Failed to update profile" };
    }
  };

  const updateSchoolProfile = async (updates: { name?: string, email?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!schoolProfile?.id) throw new Error("No active school session");

      const { error } = await supabase.from('profiles').update({
        full_name: updates.name,
        email: updates.email
      }).eq('id', schoolProfile.id);

      if (error) throw error;

      // Update local state
      setSchoolProfile(prev => prev ? {
        ...prev,
        name: updates.name ?? prev.name,
        email: updates.email ?? prev.email
      } : null);

      return { success: true };
    } catch (e: any) {
      console.error("Update School Profile Error:", e);
      return { success: false, message: e.message || "Failed to update school profile" };
    }
  };

  const loginParent = async (codeInput: string, phoneInput: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // CLEAR ANY EXISTING SESSIONS FIRST
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
      setTeacherProfile(null);
      setTeacherHistory([]);
      setSchoolProfile(null);
      setRole(UserRole.NONE);

      const sanitizedCode = codeInput.trim().toUpperCase();
      const sanitizedPhone = phoneInput.trim();

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('student_id', sanitizedCode)
        .eq('parent_phone', sanitizedPhone)
        .maybeSingle();

      if (error) throw error;
      if (!profile) return { success: false, message: "Invalid Student ID or Parent Phone Number." };

      // Success! Set student context (Parent session mimics student view)
      setStudentCode(profile.student_id);
      setStudentProfile({
        id: profile.id,
        name: profile.full_name,
        grade: profile.grade,
        schoolId: profile.school_id,
        email: profile.email,
        parentPhone: profile.parent_phone,
        parentPin: profile.parent_pin,
        chatApproved: profile.chat_approved,
        sessionId: profile.session_id
      });
      setChatApproved(!!profile.chat_approved);
      setIsRegistered(true);
      setRole(UserRole.PARENT);
      setUserId(profile.id); // Parent acts as student user for session checks? 
      // Actually Parent role might not need strict session checks if it's read-only, but let's enforce cleanliness.

      // Claim session
      // Claim session
      const currentSessions = (profile.active_sessions as string[]) || [];
      const newSessions = [...currentSessions, browserSessionId].slice(-2);

      await supabase.from('profiles').update({
        session_id: browserSessionId,
        active_sessions: newSessions
      }).eq('id', profile.id);

      return { success: true };
    } catch (e: any) {
      console.error("Parent Login Error:", e);
      return { success: false, message: e.message || "An error occurred during login." };
    }
  };

  const login = async (codeInput: string): Promise<boolean> => {
    try {
      // CLEAR ANY EXISTING SESSIONS FIRST
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
      setTeacherProfile(null);
      setTeacherHistory([]);
      setSchoolProfile(null);
      setRole(UserRole.NONE);

      const sanitizedCode = codeInput.trim().toUpperCase(); // Force uppercase

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('student_id', sanitizedCode)
        .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

      if (error || !profile) return false;

      // Found them! "Sign In"
      setStudentCode(profile.student_id);
      setStudentProfile({
        id: profile.id,
        name: profile.full_name,
        grade: profile.grade,
        schoolId: profile.school_id,
        email: profile.email,
        parentPhone: profile.parent_phone,
        parentPin: profile.parent_pin,
        chatApproved: profile.chat_approved,
        sessionId: profile.session_id
      });
      setChatApproved(!!profile.chat_approved);
      setIsRegistered(true);
      setRole(profile.role === 'REVISION' ? UserRole.REVISION : UserRole.LEARNER);
      setUserId(profile.id);

      // PERSIST LOGIN
      localStorage.setItem('soma_active_student', profile.student_id);

      // Update Session ID for Single Device Login
      // If profile has no session_id, we claim it.
      // If it has one, we overwrite it (taking over session like other logins)

      const currentSessions = (profile.active_sessions as string[]) || [];
      const newSessions = [...currentSessions, browserSessionId].slice(-2);

      await supabase.from('profiles').update({
        session_id: browserSessionId,
        active_sessions: newSessions
      }).eq('id', profile.id);

      // Save to local history for recovery
      try {
        const history = JSON.parse(localStorage.getItem('soma_recent_login') || '[]');
        const newItem = { code: profile.student_id, name: profile.full_name, timestamp: Date.now() };
        const updated = [newItem, ...history.filter((h: any) => h.code !== profile.student_id)].slice(0, 5);
        localStorage.setItem('soma_recent_login', JSON.stringify(updated));
      } catch (e) { console.error(e); }

      return true;
    } catch (e) {
      console.error("Login Error:", e);
      return false;
    }
  };

  // Sync History on Login
  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('activities')
          .select('id, type, topic, score, details, created_at')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          // If table doesn't exist, we just ignore it for now (graceful degradation)
          console.warn("Could not fetch history (maybe table missing):", error);
          return;
        }

        if (data) {
          // Filter out corrupted activities where the topic is just a long timestamp
          const validData = data.filter((d: any) => !/^\d{13}$/.test(d.topic));

          const mapped: LearnerActivity[] = validData.map((d: any) => ({
            id: d.id,
            type: d.type,
            topic: d.topic,
            date: new Date(d.created_at).toLocaleString(),
            score: d.score,
            details: typeof d.details === 'string' ? d.details : JSON.stringify(d.details)
          }));
          const merged = offlineService.mergeLearnerHistory(mapped);
          setLearnerHistory(merged);
        }
      } catch (e) {
        console.error("History Load Error:", e);
      }
    };

    if (isRegistered && userId) {
      loadHistory();
    }
  }, [isRegistered, userId]);

  // Sync Teacher History
  useEffect(() => {
    const loadTeacherHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || role !== UserRole.TEACHER) return;

      try {
        const { data, error } = await supabase.rpc('get_recent_activities', {
          p_student_id: session.user.id,
          p_limit: 200
        });

        if (error) {
          console.warn("Could not fetch teacher history:", error);
          return;
        }

        if (data) {
          const mapped: TeacherActivity[] = data.map((d: any) => ({
            id: d.id,
            type: d.type as 'NOTE' | 'QUIZ',
            title: d.topic,
            className: d.details?.className || '',
            subject: d.details?.subject || '',
            date: new Date(d.created_at).toLocaleDateString(),
            content: d.details?.content
          }));
          const merged = offlineService.mergeTeacherHistory(mapped);
          setTeacherHistory(merged);
        }
      } catch (e) {
        console.error("Teacher History Load Error:", e);
      }
    };

    if (role === UserRole.TEACHER) {
      loadTeacherHistory();
    }
  }, [role]);

  const deleteTeacherActivity = async (id: string) => {
    // Optimistic UI Update
    setTeacherHistory(prev => prev.filter(item => item.id !== id));

    // High Capacity Delete (IndexedDB)
    await dbService.deleteTeacherActivity(id);
    // Legacy localStorage sync
    offlineService.saveTeacherHistory(teacherHistory.filter(item => item.id !== id));

    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to delete teacher activity:", e);
    }
  };

  const saveActivity = async (activity: LearnerActivity) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic UI Update + Local Save
    const newActivity: LearnerActivity = {
      ...activity,
      date: activity.date || dateStr,
      pendingSync: !isOnline
    };
    setLearnerHistory(prev => [newActivity, ...prev]);

    // High Capacity Save (IndexedDB)
    await dbService.putLearnerActivity(newActivity);
    // Legacy localStorage sync (Trimmed)
    offlineService.saveLearnerHistory([newActivity, ...learnerHistory]);

    // Persist to Supabase if Online
    if (isOnline && userId) {
      try {
        const { error } = await supabase.from('activities').insert({
          student_id: userId,
          type: activity.type,
          topic: activity.topic,
          score: activity.score,
          details: activity.details
        });

        if (error) console.error("Failed to save activity to DB:", error);
      } catch (e) {
        console.error("DB Save Exception:", e);
      }
    }
  };

  const deleteActivity = async (id: string) => {
    // Optimistic Delete
    setLearnerHistory(prev => prev.filter(item => item.id !== id));

    // High Capacity Delete (IndexedDB)
    await dbService.deleteLearnerActivity(id);
    // Legacy localStorage sync
    offlineService.saveLearnerHistory(learnerHistory.filter(item => item.id !== id));

    if (studentCode) {
      try {
        await supabase.from('activities').delete().eq('id', id);
      } catch (e) { console.error(e); }
    }
  };

  // Auto-Sync Effect
  useEffect(() => {
    if (isOnline) {
      const syncPending = async () => {
        // Sync Learner
        const pendingLearner = learnerHistory.filter(h => h.pendingSync);
        for (const activity of pendingLearner) {
          try {
            const { error } = await supabase.from('activities').insert({
              student_id: userId,
              type: activity.type,
              topic: activity.topic,
              score: activity.score,
              details: activity.details
            });
            if (!error) {
              setLearnerHistory(prev => prev.map(h => h.id === activity.id ? { ...h, pendingSync: false } : h));
            }
          } catch (e) { console.error("Sync failed", e); }
        }

        // Sync Teacher
        const pendingTeacher = teacherHistory.filter(h => h.pendingSync);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          for (const activity of pendingTeacher) {
            try {
              const { error } = await supabase.from('activities').insert({
                student_id: session.user.id,
                type: activity.type,
                topic: activity.title,
                details: {
                  className: activity.className,
                  subject: activity.subject,
                  content: activity.content
                }
              });
              if (!error) {
                setTeacherHistory(prev => prev.map(h => h.id === activity.id ? { ...h, pendingSync: false } : h));
              }
            } catch (e) { console.error("Sync failed", e); }
          }
        }
      };
      syncPending();
    }
  }, [isOnline]);

  const upgradeAccount = async (plan: SubscriptionPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const success = await updateSubscription(user.id, plan);
    if (success) {
      setIsPro(true);
      setSubscriptionPlan(plan.duration);
      setUsageCount(0);
      setRevisionUsageCount(0);
      // Update expiry locally (re-fetch to be safe)
      const access = await checkSubscriptionAccess(user.id, plan.segment);
      setSubscriptionExpiry(access.expiry);
    }
    return success;
  };

  const fetchAvailableQuizzes = async (subject?: string) => {
    // ... logic ...
  };

  // Tutoring Request Handlers (Mock for Phase 2, sync with Supabase in Phase 3)
  const createTutoringRequest = async (topic: string, description: string, price: number, grade?: string, subject?: string): Promise<{ success: boolean; message: string }> => {
    if (!studentProfile) return { success: false, message: "Login to request help" };

    try {
      // Use RPC to bypass RLS if user is "logged in" via code but not Supabase Auth
      const { data, error } = await supabase.rpc('create_tutoring_request_secure', {
        p_student_id: userId, // This is the profile.id we set in login/loginParent
        p_topic: topic,
        p_description: description,
        p_price: price,
        p_grade: grade,
        p_subject: subject
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      fetchTutoringRequests();
      return { success: true, message: "Request sent to available teachers!" };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const acceptTutoringRequest = async (requestId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId || role !== UserRole.TEACHER) return { success: false, message: "Login as teacher to accept" };

    try {
      const { error } = await supabase.from('tutoring_requests').update({
        teacher_id: userId,
        status: 'ACCEPTED'
      }).eq('id', requestId);

      if (error) throw error;
      fetchTutoringRequests();
      return { success: true, message: "Request accepted! You can now respond." };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const submitTutoringResponse = async (requestId: string, response: string, type: 'TEXT' | 'VOICE' | 'VIDEO', pricingType: 'FREE' | 'FIXED' | 'RATE_ME', price: number, attachments: File[]): Promise<{ success: boolean; message: string }> => {
    // Determine status: if paid request, keep ACCEPTED until payment; free goes straight to COMPLETED
    const newStatus = (pricingType === 'FIXED' && price > 0) ? 'ACCEPTED' : 'COMPLETED';

    // 1. Mock Local Update (fast feedback)
    const previousRequests = [...activeTutoringRequests];
    setActiveTutoringRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: newStatus,
          response,
          // We can't show the file locally immediately until upload confirms, 
          // or we could create a blob URL? For now, keep simple.
          responseType: type,
          pricingType,
          price,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
        };
      }
      return r;
    }));

    if (!userId) return { success: true, message: "Response sent locally (Demo)" };

    try {
      let finalResponse = response;

      // 2. Upload Attachments (if any)
      if (attachments.length > 0) {
        const file = attachments[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${requestId}_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(filePath);

        finalResponse = publicUrl;
      }

      // 3. Real DB Update
      const dbUpdate: any = {
        status: newStatus,
        response: finalResponse,
        response_type: type,
        price: price
      };
      if (newStatus === 'COMPLETED') {
        dbUpdate.completed_at = new Date().toISOString();
      }
      const { error: reqError } = await supabase.from('tutoring_requests').update(dbUpdate).eq('id', requestId);

      if (reqError) throw reqError;

      // 4. Earnings Update (if fixed price) - non-blocking so core response still saves
      if (pricingType === 'FIXED' && price > 0) {
        try {
          const { data: wallet } = await supabase.from('teacher_wallets').select('balance').eq('id', userId).maybeSingle();

          if (!wallet) {
            await supabase.from('teacher_wallets').insert({ id: userId, balance: price });
          } else {
            await supabase.from('teacher_wallets').update({ balance: wallet.balance + price }).eq('id', userId);
          }

          await supabase.from('transactions').insert({
            teacher_id: userId,
            type: 'EARNING',
            amount: price,
            description: `Tutoring: ${requestId.substring(0, 8)}...`,
            status: 'COMPLETED'
          });
        } catch (earningsErr) {
          console.warn('Earnings update failed (non-critical):', earningsErr);
        }

        if (teacherWallet) {
          const newTx: any = {
            id: Date.now().toString(),
            type: 'EARNING',
            amount: price,
            description: `Tutoring: ${requestId.substring(0, 8)}...`,
            date: new Date().toISOString(),
            status: 'COMPLETED'
          };

          setTeacherWallet({
            ...teacherWallet,
            balance: (teacherWallet.balance || 0) + price,
            transactions: [newTx, ...teacherWallet.transactions]
          });
        }
      }

      fetchTutoringRequests();
      return { success: true, message: "Response sent successfully!" };
    } catch (e: any) {
      console.error(e);
      // Revert optimistic update on failure
      setActiveTutoringRequests(previousRequests);
      return { success: false, message: e.message || "Failed to submit response due to permissions/RLS." };
    }
  };

  // --- Star Rating ---
  const rateTutoringResponse = async (requestId: string, rating: number, feedback?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const updateData: any = { rating };
      if (feedback) updateData.feedback = feedback;

      const { error } = await supabase.from('tutoring_requests').update(updateData).eq('id', requestId);
      if (error) throw error;

      // Update local state
      setActiveTutoringRequests(prev => prev.map(r => r.id === requestId ? { ...r, rating, feedback } : r));
      return { success: true, message: "Thank you for rating!" };
    } catch (e: any) {
      console.error("Rating error:", e);
      return { success: false, message: e.message || "Failed to save rating." };
    }
  };

  // --- Parent PIN Chat Approval ---
  const setParentPin = async (pin: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Not logged in.' };
    if (!/^\d{4}$/.test(pin)) return { success: false, message: 'PIN must be exactly 4 digits.' };

    try {
      const { error } = await supabase.from('profiles').update({
        parent_pin: pin,
        chat_approved: true
      }).eq('id', userId);

      if (error) throw error;

      setStudentProfile(prev => prev ? { ...prev, parentPin: pin, chatApproved: true } : null);
      setChatApproved(true);
      return { success: true, message: 'Parent PIN set and chat approved!' };
    } catch (e: any) {
      console.error('Set Parent PIN error:', e);
      return { success: false, message: e.message || 'Failed to set PIN.' };
    }
  };

  const verifyChatPin = async (pin: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Not logged in.' };

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('parent_pin')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!profile?.parent_pin) return { success: false, message: 'No parent PIN set. Ask your parent to set one first.' };
      if (profile.parent_pin !== pin) return { success: false, message: 'Incorrect PIN. Ask your parent for the correct PIN.' };

      // PIN matches — approve chat
      const { error: updateError } = await supabase.from('profiles').update({
        chat_approved: true
      }).eq('id', userId);

      if (updateError) throw updateError;

      setStudentProfile(prev => prev ? { ...prev, chatApproved: true } : null);
      setChatApproved(true);
      return { success: true, message: 'Chat approved!' };
    } catch (e: any) {
      console.error('Verify Chat PIN error:', e);
      return { success: false, message: e.message || 'Failed to verify PIN.' };
    }
  };

  // --- Chat Messages ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const fetchChatMessages = async (requestId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setChatMessages((data || []).map((m: any) => ({
        id: m.id,
        requestId: m.request_id,
        senderId: m.sender_id,
        senderRole: m.sender_role,
        messageType: m.message_type,
        content: m.content,
        mediaUrl: m.media_url,
        createdAt: m.created_at
      })));
    } catch (e) {
      console.error("Fetch chat messages error:", e);
    }
  };

  const sendChatMessage = async (requestId: string, content: string, type: 'TEXT' | 'VOICE' | 'VIDEO', mediaFile?: File): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: "Not logged in." };

    try {
      let mediaUrl: string | undefined;

      // Upload media if present
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `chat_${requestId}_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
      }

      const senderRole = role === UserRole.TEACHER ? 'TEACHER' : 'STUDENT';

      const { error } = await supabase.from('chat_messages').insert({
        request_id: requestId,
        sender_id: userId,
        sender_role: senderRole,
        message_type: type,
        content: mediaUrl || content,
        media_url: mediaUrl
      });

      if (error) throw error;

      // Add optimistic message locally
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        requestId,
        senderId: userId,
        senderRole: senderRole,
        messageType: type,
        content: mediaUrl || content,
        mediaUrl,
        createdAt: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, newMsg]);

      return { success: true, message: "Message sent!" };
    } catch (e: any) {
      console.error("Send chat message error:", e);
      return { success: false, message: e.message || "Failed to send message." };
    }
  };

  const listMaterial = async (listing: Omit<MaterialListing, 'id' | 'downloadCount' | 'rating' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    if (!userId || !teacherProfile) return { success: false, message: "Login as teacher to list material" };

    try {
      const { error } = await supabase.from('marketplace_materials').insert({
        teacher_id: userId,
        teacher_name: teacherProfile.name,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        grade: listing.grade,
        subject: listing.subject,
        category: listing.category,
        file_url: listing.fileUrl,
        preview_url: listing.previewUrl,
        rating: 0,
        download_count: 0
      });

      if (error) throw error;
      fetchMarketplaceMaterials();
      return { success: true, message: "Material listed successfully!" };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const purchaseMaterial = async (materialId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId || !studentProfile) return { success: false, message: "Login as student to buy material" };
    if (purchasedMaterialIds.includes(materialId)) return { success: false, message: "Already purchased" };

    try {
      const material = marketplaceMaterials.find(m => m.id === materialId);
      if (!material) return { success: false, message: "Material not found" };

      // 1. Credit Seller Wallet
      const { data: wallet } = await supabase.from('teacher_wallets').select('balance').eq('id', material.teacherId).single();
      const currentBalance = wallet?.balance || 0;
      await supabase.from('teacher_wallets').update({ balance: currentBalance + material.price }).eq('id', material.teacherId);

      // 2. Add Transaction to Seller
      await supabase.from('transactions').insert({
        teacher_id: material.teacherId,
        type: 'EARNING',
        amount: material.price,
        description: `Marketplace Sale: ${material.title}`,
        status: 'COMPLETED'
      });

      // 3. Update Download Count
      await supabase.from('marketplace_materials').update({ download_count: material.downloadCount + 1 }).eq('id', materialId);

      // 4. Update Local State (In real app, we'd have a 'purchased_materials' table)
      const newPurchased = [...purchasedMaterialIds, materialId];
      setPurchasedMaterialIds(newPurchased);
      localStorage.setItem('soma_purchased_materials', JSON.stringify(newPurchased));

      return { success: true, message: "Material purchased! Check your Library." };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const fetchMarketplaceMaterials = async () => {
    try {
      const { data, error } = await supabase.from('marketplace_materials').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        // Filter based on educationLevel
        const filtered = data.filter((m: any) => {
          const itemLevel = getEducationLevelFromGrade(m.grade || '');
          return itemLevel === educationLevel;
        });

        setMarketplaceMaterials(filtered.map((m: any) => ({
          id: m.id,
          teacherId: m.teacher_id,
          teacherName: m.teacher_name,
          title: m.title,
          description: m.description,
          price: m.price,
          grade: m.grade,
          subject: m.subject,
          category: m.category,
          downloadCount: m.download_count,
          rating: m.rating,
          fileUrl: m.file_url,
          previewUrl: m.preview_url,
          createdAt: m.created_at
        })));
      }
    } catch (e) { console.error("Fetch Marketplace Error:", e); }
  };

  async function fetchTutoringRequests() {
    try {
      let query = supabase.from('tutoring_requests').select('*').order('created_at', { ascending: false });

      // Filter for Students: Only show their own requests
      if (role !== UserRole.TEACHER && userId) {
        query = query.eq('student_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        setActiveTutoringRequests(data.map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          studentName: r.student_name,
          teacherId: r.teacher_id,
          topic: r.topic,
          description: r.description,
          grade: r.grade,
          subject: r.subject,
          status: r.status,
          price: r.price,
          pricingType: r.pricing_type || 'RATE_ME',
          response: r.response,
          responseType: r.response_type,
          attachments: r.attachments || [],
          rating: r.rating,
          feedback: r.feedback,
          createdAt: r.created_at,
          completedAt: r.completed_at
        })));
      }
    } catch (e) { console.error("Fetch Tutoring Error:", e); }
  };

  useEffect(() => {
    fetchMarketplaceMaterials();
    fetchTutoringRequests();
    if (role === UserRole.TEACHER && userId) {
      fetchEarnings();
    }

    const interval = setInterval(() => {
      fetchMarketplaceMaterials();
      fetchTutoringRequests();
      if (role === UserRole.TEACHER && userId) {
        fetchEarnings();
      }
    }, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [role, userId, educationLevel]);

  const verifySubscription = async () => {
    if (!userId) return;
    await verifyAndFixSubscription(userId);
    await refreshProfile();
  };


  const contextValue: AppContextType = {
    role, setRole, learnerHistory, saveActivity, deleteActivity, clearHistory,
    studentCode, setStudentCode, isRegistered, studentProfile, updateStudentProfile,
    usageCount, incrementUsage, registerStudent, registerTeacher, login,
    loginParent, loginTeacher, resetPassword, recoverStudentId, teacherUsageCount,
    incrementTeacherUsage, teacherDarasaUsage, incrementTeacherDarasaUsage,
    teacherProfile, updateTeacherProfile, teacherHistory, saveTeacherActivity,
    deleteTeacherActivity, teacherWallet, isAvailableForTutoring, toggleTutoringAvailability,
    requestWithdrawal, fetchEarnings, activeTutoringRequests, createTutoringRequest,
    acceptTutoringRequest, submitTutoringResponse, rateTutoringResponse,
    chatMessages, sendChatMessage, fetchChatMessages, chatApproved, setParentPin,
    verifyChatPin, marketplaceMaterials, purchasedMaterialIds, listMaterial,
    purchaseMaterial, revisionUsageCount, incrementRevisionUsage, isPro,
    subscriptionPlan, subscriptionExpiry, upgradeAccount, verifySubscription,
    logout, userId, isOnline, availableQuizzes, fetchAvailableQuizzes,
    schoolProfile, loginSchool, registerSchool, registerStudentForSchool,
    schoolStats, schoolTeachers, fetchSchoolStats, addTeacherToSchool,
    addStudentToSchool, removeUserFromSchool, schoolMaterials, shareSchoolMaterial,
    deleteSchoolMaterial, fetchSchoolMaterials, updateSchoolProfile,
    language, toggleLanguage, startGuestSession, resources, fetchResources,
    sessionError, resolveSessionConflict, setSessionError, refreshProfile,
    downloadUsageCount, incrementDownloadUsage, extraDownloads, grantExtraDownloads,
    theme, toggleTheme,
    lowDataMode, toggleLowDataMode,
    masteryGraph, spacedRepetitionItems, dueForReview, weakTopics,
    processQuizCompletion, getPersonalizedDailyChallenge, addSpacedRepetitionItem,
    teachingStrategies, activeStrategies, pendingStrategies,
    pedagogicalAnalytics, isAdminAgentRunning,
    runAdminAgent, approveTeachingStrategy, rejectTeachingStrategy,
    educationLevel, setEducationLevel
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
