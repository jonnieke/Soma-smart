import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { LearnerPage } from './pages/LearnerPage';
import { TeacherPage } from './pages/TeacherPage';
import { ParentPage } from './pages/ParentPage';
import { AdminDashboard } from './features/admin/Admin';
import { RevisionPortal } from './features/revision/RevisionPortal';
import { RevisionDashboard } from './features/revision/RevisionDashboard';
import { AskSoma } from './components/AskSoma';
import { DarasaMode } from './features/darasa-mode/DarasaMode';
import { ResetPassword } from './pages/ResetPassword';
import { PricingPage } from './pages/PricingPage';
import { supabase } from './lib/supabase';
import { ConnectivityBanner } from './components/ConnectivityBanner';

const DarasaPage = () => {
    const navigate = useNavigate();
    return <DarasaMode onBack={() => navigate('/teacher')} />;
};

const App: React.FC = () => {
    const navigate = useNavigate();

    // Listen for auth state changes (Recovery flow)
    React.useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                console.log("Password recovery event detected, redirecting...");
                navigate('/reset-password');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <AppProvider>
            <ConnectivityBanner />
            <AskSoma />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/learner" element={<LearnerPage />} />
                <Route path="/teacher" element={<TeacherPage />} />
                <Route path="/parent" element={<ParentPage />} />
                <Route path="/admin" element={<AdminDashboard onNavigate={() => window.location.href = '/'} />} />
                <Route path="/revision" element={<RevisionPortal />} />
                <Route path="/revision/dashboard" element={<RevisionDashboard />} />
                <Route path="/teacher/darasa" element={<DarasaPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AppProvider>
    );
};

export default App;
