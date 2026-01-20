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
  usageCount: number;
  incrementUsage: () => void;
  registerStudent: (name: string, grade: string) => void;
  login: (code: string) => Promise<boolean>;
  // Teacher Specific
  teacherUsageCount: number;
  incrementTeacherUsage: () => void;
  teacherProfile: TeacherProfile | null;
  updateTeacherProfile: (profile: TeacherProfile) => void;
  teacherHistory: TeacherActivity[];
  saveTeacherActivity: (activity: TeacherActivity) => void;
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
          .single();

        if (profile) {
          if (profile.role === 'LEARNER') {
            setStudentCode(profile.student_id);
            setStudentProfile({ name: profile.full_name, grade: profile.grade });
            setIsRegistered(true);
            setRole(UserRole.LEARNER);
          } else if (profile.role === 'TEACHER') {
            // Update teacher state
            setTeacherProfile({
              name: profile.full_name,
              classes: [], // Fetch from separate table if needed later
              subjects: []
            });
            setRole(UserRole.TEACHER);
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

  const registerStudent = async (name: string, grade: string) => {
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
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("No User ID");

      const newCode = "SOMA-" + Math.floor(1000 + Math.random() * 9000);

      // 2. Save Profile to DB
      const { error: dbError } = await supabase.from('profiles').insert({
        id: userId,
        role: 'LEARNER',
        full_name: name,
        grade: grade,
        student_id: newCode
      });

      if (dbError) throw dbError;

      // 3. Update Local State
      setStudentCode(newCode);
      setStudentProfile({ name, grade });
      setIsRegistered(true);
      setRole(UserRole.LEARNER); // Auto switch to learner

    } catch (error) {
      console.error("Registration Failed:", error);
      alert("Could not register. Please try again.");
    }
  };

  const incrementTeacherUsage = () => setTeacherUsageCount(prev => prev + 1);

  const updateTeacherProfile = async (profile: TeacherProfile) => {
    // For now just local updating for UI, but could sync to DB
    setTeacherProfile(profile);
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

      // In full Auth, we would sign them in. 
      // For now, if they are "anonymous", we can try link logic or just rely on state if persistence isn't critical across devices (it is).
      // Since we are Anonymous, we are technically signed in as a "User", but maybe not THAT user.
      // For this kid-friendly ID flow, effectively "impersonating" the profile locally is sufficient for the demo flow.
      return true;
    } catch (e) {
      console.error("Login Error:", e);
      return false;
    }
  };

  const saveActivity = (type: 'EXPLANATION' | 'QUIZ', topic: string, details: any) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newActivity: LearnerActivity = {
      id: Date.now().toString(),
      type,
      topic,
      date: dateStr,
      score: details.score,
      details: JSON.stringify(details)
    };
    setLearnerHistory(prev => [newActivity, ...prev]);
  };

  const deleteActivity = (id: string) => {
    setLearnerHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AppContext.Provider value={{
      role, setRole, learnerHistory, saveActivity, deleteActivity, studentCode,
      usageCount, incrementUsage, isRegistered, studentProfile, registerStudent, login,
      teacherUsageCount, incrementTeacherUsage, teacherProfile, updateTeacherProfile, teacherHistory, saveTeacherActivity
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
