import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LearnerActivity, UserRole } from '../types';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  learnerHistory: LearnerActivity[];
  saveActivity: (type: 'EXPLANATION' | 'QUIZ', topic: string, details: any) => void;
  deleteActivity: (id: string) => void;
  studentCode: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  const [learnerHistory, setLearnerHistory] = useState<LearnerActivity[]>(() => {
    try {
        const saved = localStorage.getItem('soma_learner_history');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to parse history", e);
        return [];
    }
  });
  
  const [studentCode, setStudentCode] = useState<string>("");

  useEffect(() => {
    // Generate or retrieve student code
    let code = localStorage.getItem('soma_student_code');
    if (!code) {
        code = "STU-" + Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem('soma_student_code', code);
    }
    setStudentCode(code);
  }, []);

  useEffect(() => {
    localStorage.setItem('soma_learner_history', JSON.stringify(learnerHistory));
  }, [learnerHistory]);

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
    if (window.confirm("Are you sure you want to delete this item?")) {
        setLearnerHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <AppContext.Provider value={{ role, setRole, learnerHistory, saveActivity, deleteActivity, studentCode }}>
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
