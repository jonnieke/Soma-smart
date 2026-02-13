import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { AskSomo } from './components/AskSomo';
import { SessionConflictModal } from './components/SessionConflictModal';
import { supabase } from './lib/supabase';

// Lazy Load Pages for Performance
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const LearnerPage = React.lazy(() => import('./pages/LearnerPage').then(module => ({ default: module.LearnerPage })));
const TeacherPage = React.lazy(() => import('./pages/TeacherPage').then(module => ({ default: module.TeacherPage })));
const ParentPage = React.lazy(() => import('./pages/ParentPage').then(module => ({ default: module.ParentPage })));
const AdminDashboard = React.lazy(() => import('./features/admin/Admin').then(module => ({ default: module.AdminDashboard })));
const AdminKnowledgeBase = React.lazy(() => import('./features/admin/KnowledgeBase').then(module => ({ default: module.AdminKnowledgeBase })));
const RevisionPortal = React.lazy(() => import('./features/revision/RevisionPortal').then(module => ({ default: module.RevisionPortal })));
const RevisionDashboard = React.lazy(() => import('./features/revision/RevisionDashboard').then(module => ({ default: module.RevisionDashboard })));
const DarasaMode = React.lazy(() => import('./features/darasa-mode/DarasaMode').then(module => ({ default: module.DarasaMode })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const PricingPage = React.lazy(() => import('./pages/PricingPage').then(module => ({ default: module.PricingPage })));
const SchoolDashboard = React.lazy(() => import('./features/school/SchoolDashboard').then(module => ({ default: module.SchoolDashboard })));

// Loading Fallback Component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading Somo Smart...</p>
        </div>
    </div>
);

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
        <>
            <ConnectivityBanner />
            <AskSomo />
            <SessionConflictModal />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/learner" element={<LearnerPage />} />
                    <Route path="/teacher" element={<TeacherPage />} />
                    <Route path="/teacher/notes" element={<TeacherPage />} />
                    <Route path="/teacher/homework" element={<TeacherPage />} />
                    <Route path="/teacher/marking" element={<TeacherPage />} />
                    <Route path="/parent" element={<ParentPage />} />
                    <Route path="/admin" element={<AdminDashboard onNavigate={() => window.location.href = '/'} />} />
                    <Route path="/admin/knowledge" element={<AdminKnowledgeBase />} />
                    <Route path="/revision" element={<RevisionPortal />} />
                    <Route path="/revision/dashboard" element={<RevisionDashboard />} />
                    <Route path="/teacher/darasa" element={<DarasaPage />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/school" element={<SchoolDashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </>
    );
};

export default App;
