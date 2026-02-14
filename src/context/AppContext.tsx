import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LearnerActivity, UserRole, TeacherProfile, TeacherActivity, SchoolProfile, SchoolStats, SchoolTeacher, SchoolMaterial, TeacherWallet, TutoringRequest, MaterialListing, SubscriptionPlan, SubscriptionTier } from '../types';

// Update interface
interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  learnerHistory: LearnerActivity[];
  saveActivity: (activity: LearnerActivity) => void;
  deleteActivity: (id: string) => void;
  studentCode: string;
  setStudentCode: (code: string) => void;
  isRegistered: boolean;
  studentProfile: { id: string, name: string, grade: string, schoolId?: string, schoolName?: string, email?: string, parentPhone?: string } | null;
  updateStudentProfile: (updates: { name?: string, grade?: string, parentPhone?: string }) => Promise<{ success: boolean; message?: string }>;
  usageCount: number;
  incrementUsage: () => void;
  studyUsageCount: number;
  incrementStudyUsage: () => void;
  registerStudent: (name: string, grade: string, pin: string, parentPhone?: string) => Promise<{ success: boolean; message?: string; data?: string }>;
  registerTeacher: (name: string, email: string, password: string, classes: string[], subjects: string[]) => Promise<{ success: boolean; message?: string }>;
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
  createTutoringRequest: (topic: string, description: string, price: number) => Promise<{ success: boolean; message: string }>;
  acceptTutoringRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  submitTutoringResponse: (requestId: string, response: string, type: 'TEXT' | 'VOICE' | 'VIDEO') => Promise<{ success: boolean; message: string }>;
  // Marketplace
  marketplaceMaterials: MaterialListing[];
  purchasedMaterialIds: string[];
  listMaterial: (listing: Omit<MaterialListing, 'id' | 'downloadCount' | 'rating' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  purchaseMaterial: (materialId: string) => Promise<{ success: boolean; message: string }>;
  // Revision
  revisionUsageCount: number;
  incrementRevisionUsage: () => void;
  // Subscription
  isPro: boolean;
  subscriptionPlan: SubscriptionTier;
  subscriptionExpiry: string | null;
  upgradeAccount: (plan: SubscriptionPlan) => Promise<boolean>;
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
  language: 'EN' | 'FR';
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

import { supabase } from '../lib/supabase';
import { checkSubscriptionAccess, updateSubscription } from '../services/subscriptionService';
import { offlineService } from '../services/offlineService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);

  const [learnerHistory, setLearnerHistory] = useState<LearnerActivity[]>(offlineService.getLearnerHistory());
  const [studentCode, setStudentCode] = useState<string>("");
  const [usageCount, setUsageCount] = useState<number>(0);
  const [studyUsageCount, setStudyUsageCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('soma_study_usage') || '0');
  });
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<{ id: string, name: string, grade: string, schoolId?: string, schoolName?: string, email?: string, parentPhone?: string, sessionId?: string } | null>(null);

  // Teacher State
  const [teacherUsageCount, setTeacherUsageCount] = useState<number>(0);
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

  // Revision State
  const [revisionUsageCount, setRevisionUsageCount] = useState<number>(0);


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
  const [userId, setUserId] = useState<string | null>(null);

  const [language, setLanguage] = useState<'EN' | 'FR'>(() => {
    return (localStorage.getItem('soma_language') as 'EN' | 'FR') || 'EN';
  });

  // Marketplace State
  const [marketplaceMaterials, setMarketplaceMaterials] = useState<MaterialListing[]>([]);
  const [purchasedMaterialIds, setPurchasedMaterialIds] = useState<string[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const [sessionError, setSessionError] = useState<'MULTI_DEVICE' | 'SINGLE_DEVICE' | null>(null);

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
            sessionId: profile.session_id
          });
          setIsRegistered(true);
          setRole(profile.role === 'REVISION' ? UserRole.REVISION : UserRole.LEARNER);
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
    setDownloadUsageCount(prev => {
      const newVal = prev + 1;
      localStorage.setItem('soma_download_usage', newVal.toString());
      localStorage.setItem('soma_download_date', new Date().toLocaleDateString());
      return newVal;
    });
  };

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'EN' ? 'FR' : 'EN';
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
    setTeacherHistory([]);
    setTeacherWallet(null);
    localStorage.removeItem('soma_active_student');
    setUserId(null); // Clear ID to stop checks
    // NOTE: In Phase 2 mock mode, we don't clear tutoring requests on logout 
    // to allow role switching between Learner and Teacher to see the same queue.
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
            setStudentProfile({
              id: profile.id,
              name: profile.full_name,
              grade: profile.grade,
              schoolName: profile.school_name,
              email: profile.email,
              parentPhone: profile.parent_phone,
              sessionId: profile.session_id
            });
            setIsRegistered(true);
            setRole(profile.role === 'REVISION' ? UserRole.REVISION : UserRole.LEARNER);
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
            setTeacherUsageCount(profile.usage_teacher || 0);
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
              sessionId: profile.session_id
            });
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
            setIsRegistered(true);
            setRole(profile.role === 'REVISION' ? UserRole.REVISION : UserRole.LEARNER);
          } else {
            localStorage.removeItem('soma_active_student');
          }
        }
      }

      // 3. Check Subscription Access if we have a user
      if (currentUserId) {
        const access = await checkSubscriptionAccess(currentUserId, 'STUDENT');
        setIsPro(access.isPro);
        setSubscriptionPlan(access.tier);
        setSubscriptionExpiry(access.expiry);
      }

    };
    initSession();
  }, []);



  const registerStudent = async (name: string, grade: string, pin: string, parentPhone?: string): Promise<{ success: boolean; message?: string; data?: string }> => {
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
        active_sessions: [browserSessionId] // Init with current
      });

      if (dbError) throw dbError;

      setStudentCode(newCode);
      setStudentProfile({ id: userId, name, grade, parentPhone });
      setIsRegistered(true);
      setRole(UserRole.LEARNER);

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
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });

      if (error) {
        console.error("Supabase Auth Error:", error.message);
        return { success: false, message: error.message };
      }

      if (data.user) {
        console.log("Auth successful, User ID:", data.user.id);

        // Fetch profile to set state
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();

        if (profileError) {
          console.error("Profile Fetch Error:", profileError.message);
        }

        if (profile) {
          console.log("Profile found:", profile.role);
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
            expiry: profile.expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
    if (userId) {
      await supabase.from('profiles').update({ usage_teacher: newCount }).eq('id', userId);
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
      const { data: transactions } = await supabase.from('transactions').select('*').eq('teacher_id', userId).order('date', { ascending: false });

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
            date: new Date(t.date).toLocaleDateString(),
            status: t.status
          }))
        });
      } else {
        // Auto-create wallet if missing
        await supabase.from('teacher_wallets').insert([{ id: userId, balance: 0, currency: 'KES' }]);
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
    setRole(UserRole.GUEST);
  };

  const incrementUsage = () => {
    if (role === UserRole.GUEST) {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('somo_guest_usage_general', newCount.toString());
    } else {
      setUsageCount(prev => prev + 1);
    }
  };

  const incrementStudyUsage = () => {
    setStudyUsageCount(prev => {
      const next = prev + 1;
      localStorage.setItem('soma_study_usage', next.toString());
      return next;
    });
  };

  const incrementRevisionUsage = () => {
    if (role === UserRole.GUEST) {
      const newCount = revisionUsageCount + 1;
      setRevisionUsageCount(newCount);
      localStorage.setItem('soma_guest_usage_revision', newCount.toString());
    } else {
      setRevisionUsageCount(prev => prev + 1);
    }
  };

  const fetchResources = async (grade?: string, subject?: string) => {
    try {
      let query = supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });

      if (grade) query = query.eq('grade', grade);
      if (subject) query = query.eq('subject', subject);

      const { data, error } = await query;
      if (error) throw error;
      setResources(data || []);
    } catch (e) {
      console.error("Error fetching resources:", e);
    }
  };

  const registerTeacher = async (name: string, email: string, password: string, classes: string[], subjects: string[]): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'TEACHER',
            classes,
            subjects
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
          email: email
        });

        if (profileError) console.error("Profile creation warning:", profileError);

        setTeacherProfile({ id: data.user.id, name, email, classes, subjects });
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
        classes: profile.classes,
        subjects: profile.subjects
      }).eq('id', user.id);
    }
  };

  const saveTeacherActivity = async (activity: TeacherActivity) => {
    // Optimistic UI Update + Local Save
    const internalActivity = { ...activity, pendingSync: !isOnline };
    setTeacherHistory(prev => [internalActivity, ...prev]);
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

      const { error } = await supabase.from('profiles').update({
        full_name: updates.name,
        grade: updates.grade,
        parent_phone: updates.parentPhone
      }).eq('id', studentProfile.id);

      if (error) throw error;

      // Update local state
      setStudentProfile(prev => prev ? {
        ...prev,
        name: updates.name ?? prev.name,
        grade: updates.grade ?? prev.grade,
        parentPhone: updates.parentPhone ?? prev.parentPhone
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
        sessionId: profile.session_id
      });
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
        sessionId: profile.session_id
      });
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
      if (!studentCode) return;

      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('student_id', studentCode)
          .order('created_at', { ascending: false });

        if (error) {
          // If table doesn't exist, we just ignore it for now (graceful degradation)
          console.warn("Could not fetch history (maybe table missing):", error);
          return;
        }

        if (data) {
          const mapped: LearnerActivity[] = data.map((d: any) => ({
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

    if (isRegistered && studentCode) {
      loadHistory();
    }
  }, [isRegistered, studentCode]);

  // Sync Teacher History
  useEffect(() => {
    const loadTeacherHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || role !== UserRole.TEACHER) return;

      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('student_id', session.user.id)
          .order('created_at', { ascending: false });

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
    offlineService.saveLearnerHistory([newActivity, ...learnerHistory]);

    // Persist to Supabase if Online
    if (isOnline && studentCode) {
      try {
        const { error } = await supabase.from('activities').insert({
          student_id: studentCode,
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
              student_id: studentCode,
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
  const createTutoringRequest = async (topic: string, description: string, price: number): Promise<{ success: boolean; message: string }> => {
    if (!studentProfile) return { success: false, message: "Login to request help" };

    try {
      const { error } = await supabase.from('tutoring_requests').insert({
        student_id: studentProfile.id,
        topic,
        description,
        price,
        status: 'PENDING'
      });

      if (error) throw error;
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

  const submitTutoringResponse = async (requestId: string, response: string, type: 'TEXT' | 'VOICE' | 'VIDEO'): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: "Auth required" };

    try {
      const request = activeTutoringRequests.find(r => r.id === requestId);
      if (!request) return { success: false, message: "Request not found" };

      // 1. Update Request
      const { error: reqError } = await supabase.from('tutoring_requests').update({
        status: 'COMPLETED',
        response,
        response_type: type,
        completed_at: new Date().toISOString()
      }).eq('id', requestId);

      if (reqError) throw reqError;

      // 2. Credit Wallet
      const earnings = request.price;
      const { data: wallet } = await supabase.from('teacher_wallets').select('balance').eq('id', userId).single();
      const currentBalance = wallet?.balance || 0;

      await supabase.from('teacher_wallets').update({ balance: currentBalance + earnings }).eq('id', userId);

      // 3. Add Transaction
      await supabase.from('transactions').insert({
        teacher_id: userId,
        type: 'EARNING',
        amount: earnings,
        description: `Homework Help: ${request.topic}`,
        status: 'COMPLETED'
      });

      fetchEarnings();
      fetchTutoringRequests();

      return { success: true, message: "Response sent! Earnings added to wallet." };
    } catch (e: any) {
      return { success: false, message: e.message };
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
        rating: 5.0,
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
        setMarketplaceMaterials(data.map((m: any) => ({
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

  const fetchTutoringRequests = async () => {
    try {
      const { data, error } = await supabase.from('tutoring_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setActiveTutoringRequests(data.map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          teacherId: r.teacher_id,
          topic: r.topic,
          description: r.description,
          status: r.status,
          price: r.price,
          response: r.response,
          responseType: r.response_type,
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
  }, [role, userId]);


  return (
    <AppContext.Provider value={{
      role, setRole, learnerHistory, saveActivity, deleteActivity, studentCode, setStudentCode,
      isOnline,
      usageCount, incrementUsage, isRegistered, studentProfile, updateStudentProfile,
      studyUsageCount,
      incrementStudyUsage,
      registerStudent, login, loginParent, recoverStudentId, registerTeacher, loginTeacher, resetPassword,
      teacherUsageCount, incrementTeacherUsage,
      teacherDarasaUsage, incrementTeacherDarasaUsage,
      teacherProfile, updateTeacherProfile, teacherHistory,
      saveTeacherActivity,
      deleteTeacherActivity,
      teacherWallet,
      isAvailableForTutoring,
      toggleTutoringAvailability,
      requestWithdrawal,
      fetchEarnings,
      // Revision
      revisionUsageCount, incrementRevisionUsage,
      isPro, subscriptionPlan, subscriptionExpiry, upgradeAccount,
      userId,
      activeTutoringRequests, createTutoringRequest, acceptTutoringRequest, submitTutoringResponse,
      // Marketplace
      marketplaceMaterials, purchasedMaterialIds, listMaterial, purchaseMaterial,
      schoolProfile, loginSchool, registerSchool, registerStudentForSchool,
      schoolStats, schoolTeachers, fetchSchoolStats, addTeacherToSchool, addStudentToSchool, removeUserFromSchool,
      schoolMaterials, shareSchoolMaterial, deleteSchoolMaterial, fetchSchoolMaterials, updateSchoolProfile,
      language, toggleLanguage,
      logout,
      startGuestSession,
      availableQuizzes,
      fetchAvailableQuizzes,
      resources,
      fetchResources,
      sessionError,
      resolveSessionConflict,
      setSessionError,
      refreshProfile,
      downloadUsageCount,
      incrementDownloadUsage
    }}>
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
