import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LearnerActivity, UserRole, TeacherProfile, TeacherActivity } from '../types';

// Update interface
interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  learnerHistory: LearnerActivity[];
  saveActivity: (type: 'EXPLANATION' | 'QUIZ', topic: string, details: any) => void;
  deleteActivity: (id: string) => void;
  studentCode: string;
  isRegistered: boolean;
  studentProfile: { name: string, grade: string } | null;
  usageCount: number;
  incrementUsage: () => void;
  registerStudent: (name: string, grade: string, pin: string) => Promise<string | null>;
  registerTeacher: (name: string, email: string, password: string, classes: string[], subjects: string[]) => Promise<boolean>;
  login: (code: string) => Promise<boolean>;
  loginTeacher: (email: string, pass: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  recoverStudentId: (name: string, pin: string) => Promise<string | null>;
  // Teacher Specific
  teacherUsageCount: number;
  incrementTeacherUsage: () => void;
  teacherProfile: TeacherProfile | null;
  updateTeacherProfile: (profile: TeacherProfile) => void;
  teacherHistory: TeacherActivity[];
  saveTeacherActivity: (activity: TeacherActivity) => void;
  // Revision
  revisionUsageCount: number;
  incrementRevisionUsage: () => void;
  // Subscription
  isPro: boolean;
  subscriptionPlan: 'FREE' | 'DAILY' | 'MONTHLY';
  upgradeAccount: (plan: 'DAILY' | 'MONTHLY') => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

import { supabase } from '../lib/supabase';

// ... (Interface update if needed, but keeping it same for now)

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);

  const [learnerHistory, setLearnerHistory] = useState<LearnerActivity[]>([]);
  const [studentCode, setStudentCode] = useState<string>("");
  const [usageCount, setUsageCount] = useState<number>(0);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<{ name: string, grade: string } | null>(null);

  // Teacher State
  const [teacherUsageCount, setTeacherUsageCount] = useState<number>(0);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [teacherHistory, setTeacherHistory] = useState<TeacherActivity[]>([]);

  // Revision State
  const [revisionUsageCount, setRevisionUsageCount] = useState<number>(0);
  const incrementRevisionUsage = () => setRevisionUsageCount(prev => prev + 1);

  // --- Initial Load from Supabase ---
  useEffect(() => {
    const initSession = async () => {
      // Check if we have an active session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.role === 'LEARNER') {
            setStudentCode(profile.student_id);
            setStudentProfile({ name: profile.full_name, grade: profile.grade });
            setIsRegistered(true);
            setRole(UserRole.LEARNER);
          } else if (profile.role === 'TEACHER') {
            // Update teacher state
            setRole(UserRole.TEACHER);
            // Fetch classes/subjects if they exist in profile
            if (profile.classes || profile.subjects) {
              setTeacherProfile({
                name: profile.full_name,
                classes: profile.classes || [],
                subjects: profile.subjects || []
              });
            } else {
              // Fallback if not yet set
              setTeacherProfile({
                name: profile.full_name,
                classes: [],
                subjects: []
              });
            }
          }
        }
      }
    };
    initSession();
  }, []);

  const incrementUsage = () => {
    if (!isRegistered) {
      setUsageCount(prev => prev + 1);
    }
  };

  const registerStudent = async (name: string, grade: string, pin: string): Promise<string | null> => {
    try {
      console.log("Attempting registration via signUp (Email/Pass)...");
      // 1. Create Auth User (Anonymous fall back to email/pass)
      // Since anonymous might be disabled, we autogenerate credentials
      const dummyId = Math.random().toString(36).substring(7);
      const email = `student-${Date.now()}-${dummyId}@soma.app`;
      const password = `soma-${Date.now()}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Supabase Auth Response:", authData);

      if (authError) throw authError;

      const userId = authData.user?.id;
      const session = authData.session;

      if (!userId) throw new Error("No User ID returned from SignUp");
      // Session check skipped for now as we might be handling confirmation differently or just want to create the record

      // Generate Student ID
      const newCode = "SOMA-" + Math.floor(1000 + Math.random() * 9000);

      // 2. Save Profile (Upsert to handle race conditions/triggers)
      const { error: dbError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'LEARNER',
        full_name: name,
        grade: grade,
        student_id: newCode,
        recovery_pin: pin
      });

      if (dbError) {
        console.error("Database Error details:", dbError);
        throw dbError;
      }

      // 3. Update Local State
      setStudentCode(newCode);
      setStudentProfile({ name, grade });
      setIsRegistered(true);
      setRole(UserRole.LEARNER); // Auto switch to learner

      // Save to local history for recovery
      try {
        const history = JSON.parse(localStorage.getItem('soma_recent_login') || '[]');
        const newItem = { code: newCode, name, timestamp: Date.now() };
        const updated = [newItem, ...history.filter((h: any) => h.code !== newCode)].slice(0, 5);
        localStorage.setItem('soma_recent_login', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save local history", e);
      }

      return newCode;

    } catch (error: any) {
      console.error("Registration Failed Full Error:", error);
      alert(`Registration Failed: ${error.message || JSON.stringify(error)}`);
      return null;
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

  const loginTeacher = async (email: string, pass: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });

      if (error) throw error;

      if (data.user) {
        // Fetch profile to set state
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        if (profile) {
          setTeacherProfile({
            name: profile.full_name,
            classes: profile.classes || [],
            subjects: profile.subjects || []
          });
          setRole(UserRole.TEACHER);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("Teacher Login Error", e);
      return false;
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

  const registerTeacher = async (name: string, email: string, password: string, classes: string[], subjects: string[]): Promise<boolean> => {
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

        setTeacherProfile({ name, classes, subjects });
        setRole(UserRole.TEACHER);
        return true;
      }
      return false;
    } catch (e: any) {
      console.error("Teacher Registration Error:", e);
      alert(e.message);
      return false;
    }
  };

  const updateTeacherProfile = async (profile: TeacherProfile) => {
    setTeacherProfile(profile);
    // Sync to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        classes: profile.classes,
        subjects: profile.subjects
      }).eq('id', user.id);
    }
  };

  const saveTeacherActivity = (activity: TeacherActivity) => {
    setTeacherHistory(prev => [activity, ...prev]);
  };

  const login = async (codeInput: string): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('student_id', codeInput)
        .single();

      if (error || !profile) return false;

      // Found them! "Sign In"
      setStudentCode(profile.student_id);
      setStudentProfile({ name: profile.full_name, grade: profile.grade });
      setIsRegistered(true);
      setRole(UserRole.LEARNER);

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
          setLearnerHistory(mapped);
        }
      } catch (e) {
        console.error("History Load Error:", e);
      }
    };

    if (isRegistered && studentCode) {
      loadHistory();
    }
  }, [isRegistered, studentCode]);

  const saveActivity = async (type: 'EXPLANATION' | 'QUIZ', topic: string, details: any) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic UI Update
    const tempId = Date.now().toString();
    const newActivity: LearnerActivity = {
      id: tempId,
      type,
      topic,
      date: dateStr,
      score: details.score,
      details: JSON.stringify(details)
    };
    setLearnerHistory(prev => [newActivity, ...prev]);

    // Persist to Supabase
    if (studentCode) {
      try {
        const { error } = await supabase.from('activities').insert({
          student_id: studentCode,
          type,
          topic,
          score: details.score,
          details: JSON.stringify(details)
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

  // Subscription State
  const [isPro, setIsPro] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'FREE' | 'DAILY' | 'MONTHLY'>('FREE');

  const upgradeAccount = async (plan: 'DAILY' | 'MONTHLY') => {
    // Mock Payment Process
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    setIsPro(true);
    setSubscriptionPlan(plan);
    setUsageCount(0); // Reset limits
    setRevisionUsageCount(0);
    // Ideally save to DB/Profile here
    return true;
  };

  return (
    <AppContext.Provider value={{
      role, setRole, learnerHistory, saveActivity, deleteActivity, studentCode,
      usageCount, incrementUsage, isRegistered, studentProfile, registerStudent, login, recoverStudentId, registerTeacher, loginTeacher, resetPassword,
      teacherUsageCount, incrementTeacherUsage, teacherProfile, updateTeacherProfile, teacherHistory, saveTeacherActivity,
      revisionUsageCount, incrementRevisionUsage,
      isPro, subscriptionPlan, upgradeAccount
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
