import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LearnerActivity, UserRole, TeacherProfile, TeacherActivity } from '../types';

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
  studentProfile: { id: string, name: string, grade: string, email?: string, parentPhone?: string } | null;
  updateStudentProfile: (updates: { name?: string, grade?: string, parentPhone?: string }) => Promise<{ success: boolean; message?: string }>;
  usageCount: number;
  incrementUsage: () => void;
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
  teacherProfile: TeacherProfile | null;
  updateTeacherProfile: (profile: TeacherProfile) => void;
  teacherHistory: TeacherActivity[];
  saveTeacherActivity: (activity: TeacherActivity) => void;
  deleteTeacherActivity: (id: string) => Promise<void>;
  // Revision
  revisionUsageCount: number;
  incrementRevisionUsage: () => void;
  // Subscription
  isPro: boolean;
  subscriptionPlan: SubscriptionTier;
  subscriptionExpiry: string | null;
  upgradeAccount: (plan: SubscriptionPlan) => Promise<boolean>;
  logout: () => Promise<void>;
  isPromoActive: boolean;
  promoEndDate: Date | null;
  userId: string | null;
  isOnline: boolean;
  availableQuizzes: TeacherActivity[];
  fetchAvailableQuizzes: (subject?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

import { supabase } from '../lib/supabase';
import { checkSubscriptionAccess, updateSubscription } from '../services/subscriptionService';
import { SubscriptionTier, SubscriptionPlan } from '../types';
import { offlineService } from '../services/offlineService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);

  const [learnerHistory, setLearnerHistory] = useState<LearnerActivity[]>(offlineService.getLearnerHistory());
  const [studentCode, setStudentCode] = useState<string>("");
  const [usageCount, setUsageCount] = useState<number>(0);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<{ id: string, name: string, grade: string, email?: string, parentPhone?: string } | null>(null);

  // Teacher State
  const [teacherUsageCount, setTeacherUsageCount] = useState<number>(0);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [teacherHistory, setTeacherHistory] = useState<TeacherActivity[]>(offlineService.getTeacherHistory());
  const [availableQuizzes, setAvailableQuizzes] = useState<TeacherActivity[]>([]);

  const isOnline = useOnlineStatus();

  // Revision State
  const [revisionUsageCount, setRevisionUsageCount] = useState<number>(0);
  const incrementRevisionUsage = () => setRevisionUsageCount(prev => prev + 1);

  // Promo State
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [promoEndDate, setPromoEndDate] = useState<Date | null>(null);

  // Subscription State
  const [isPro, setIsPro] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionTier>('FREE');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
          if (profile.role === 'LEARNER' || profile.role === 'REVISION') {
            setStudentProfile({
              id: profile.id,
              name: profile.full_name,
              grade: profile.grade,
              email: profile.email,
              parentPhone: profile.parent_phone
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
              subjects: profile.subjects || []
            });
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
              email: profile.email,
              parentPhone: profile.parent_phone
            });
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

      // 4. Promo functionality is now disabled
      setIsPromoActive(false);
      setPromoEndDate(null);
    };
    initSession();
  }, []);

  const incrementUsage = () => {
    if (!isRegistered) {
      setUsageCount(prev => prev + 1);
    }
  };

  const registerStudent = async (name: string, grade: string, pin: string, parentPhone?: string): Promise<{ success: boolean; message?: string; data?: string }> => {
    try {
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
        parent_phone: parentPhone
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
            subjects: profile.subjects || []
          });
          setRole(UserRole.TEACHER);

          // Clear Learner Session for clarity
          setStudentCode("");
          setStudentProfile(null);
          localStorage.removeItem('soma_active_student');

          return { success: true };
        } else {
          console.warn("CRITICAL: Auth succeeded but NO PROFILE found. Attempting to auto-create profile...");

          // Auto-repair: Create a basic profile
          const { error: insertError } = await supabase.from('profiles').insert([
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
            console.error("Auto-create profile failed:", insertError);
            return { success: false, message: "Account exists but profile is corrupted. Please contact support." };
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

  const incrementTeacherUsage = () => setTeacherUsageCount(prev => prev + 1);

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

  const loginParent = async (codeInput: string, phoneInput: string): Promise<{ success: boolean; message?: string }> => {
    try {
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
        email: profile.email,
        parentPhone: profile.parent_phone
      });
      setIsRegistered(true);
      setRole(UserRole.PARENT);

      return { success: true };
    } catch (e: any) {
      console.error("Parent Login Error:", e);
      return { success: false, message: e.message || "An error occurred during login." };
    }
  };

  const login = async (codeInput: string): Promise<boolean> => {
    try {
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
        email: profile.email,
        parentPhone: profile.parent_phone
      });
      setIsRegistered(true);
      setRole(profile.role === 'REVISION' ? UserRole.REVISION : UserRole.LEARNER);

      // PERSIST LOGIN
      localStorage.setItem('soma_active_student', profile.student_id);

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
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('type', 'QUIZ')
        .order('created_at', { ascending: false });

      if (subject) {
        query = query.eq('subject', subject);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;

      const mappedData: TeacherActivity[] = (data || []).map(item => {
        const details = typeof item.details === 'string' ? JSON.parse(item.details || '{}') : item.details;
        return {
          id: item.id,
          type: item.type,
          title: item.title || item.topic,
          className: item.class_name || details?.className || '',
          subject: item.subject || details?.subject || '',
          date: item.created_at,
          content: item.content || details?.content
        };
      });

      setAvailableQuizzes(mappedData);
    } catch (e) {
      console.error("Error fetching available quizzes:", e);
    }
  };

  return (
    <AppContext.Provider value={{
      role, setRole, learnerHistory, saveActivity, deleteActivity, studentCode, setStudentCode,
      isOnline,
      usageCount, incrementUsage, isRegistered, studentProfile, updateStudentProfile, registerStudent, login, loginParent, recoverStudentId, registerTeacher, loginTeacher, resetPassword,
      teacherUsageCount, incrementTeacherUsage, teacherProfile, updateTeacherProfile, teacherHistory, saveTeacherActivity, deleteTeacherActivity,
      revisionUsageCount, incrementRevisionUsage,
      isPro, subscriptionPlan, subscriptionExpiry, upgradeAccount,
      isPromoActive,
      promoEndDate,
      userId,
      logout: async () => {
        await supabase.auth.signOut();
        setRole(UserRole.NONE);
        setStudentCode("");
        setIsRegistered(false);
        setStudentProfile(null);
        setTeacherProfile(null);
        setTeacherHistory([]);
        localStorage.removeItem('soma_recent_login'); // Optional: clear history if desired, or keep it. Keeping for now is fine.

        // Clear Persistent Session
        localStorage.removeItem('soma_active_student');

        // Clear any specific session data if needed
      },
      availableQuizzes,
      fetchAvailableQuizzes
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
