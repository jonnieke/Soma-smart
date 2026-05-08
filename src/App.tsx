import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { SessionConflictModal } from './components/SessionConflictModal';
import { SubscriptionExpiredModal } from './components/SubscriptionExpiredModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import { AdminGuard } from './components/AdminGuard';
import ReactGA from "react-ga4";
import { useLocation } from 'react-router-dom';
import { flushMasterySyncQueue } from './services/learnerMemoryService';

// Lazy Load Pages for Performance
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const LearnerPage = React.lazy(() => import('./pages/LearnerPage').then(module => ({ default: module.LearnerPage })));
const TeacherPage = React.lazy(() => import('./pages/TeacherPage').then(module => ({ default: module.TeacherPage })));
const ParentPage = React.lazy(() => import('./pages/ParentPage').then(module => ({ default: module.ParentPage })));
const AdminDashboard = React.lazy(() => import('./features/admin/Admin').then(module => ({ default: module.AdminDashboard })));
const AdminKnowledgeBase = React.lazy(() => import('./features/admin/KnowledgeBase').then(module => ({ default: module.AdminKnowledgeBase })));
const RevisionPortal = React.lazy(() => import('./features/revision/RevisionPortal').then(module => ({ default: module.RevisionPortal })));
const RevisionDashboard = React.lazy(() => import('./features/revision/RevisionDashboard').then(module => ({ default: module.RevisionDashboard })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const PricingPage = React.lazy(() => import('./pages/PricingPage').then(module => ({ default: module.PricingPage })));
const SchoolDashboard = React.lazy(() => import('./features/school/SchoolDashboard').then(module => ({ default: module.SchoolDashboard })));
const OfflinePage = React.lazy(() => import('./pages/OfflinePage').then(module => ({ default: module.OfflinePage })));
const GuestQuiz = React.lazy(() => import('./pages/GuestQuiz').then(module => ({ default: module.GuestQuiz })));

// Exam Rooms Pages
const ExamRoomsListPage = React.lazy(() => import('./pages/ExamRoomsListPage').then(module => ({ default: module.ExamRoomsListPage })));
const ExamRoomChatPage = React.lazy(() => import('./pages/ExamRoomChatPage').then(module => ({ default: module.ExamRoomChatPage })));

// Campus Pages
const CampusPage = React.lazy(() => import('./pages/CampusPage').then(module => ({ default: module.CampusPage })));

// Blog Pages
const BlogIndex = React.lazy(() => import('./pages/Blog/BlogIndex').then(module => ({ default: module.BlogIndex })));
const BlogPost = React.lazy(() => import('./pages/Blog/BlogPost').then(module => ({ default: module.BlogPost })));
const AskSomo = React.lazy(() => import('./components/AskSomo').then(module => ({ default: module.AskSomo })));

// Loading Fallback Component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading Somo Smart...</p>
        </div>
    </div>
);

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const hideGlobalAssistant = ['/learner', '/teacher', '/revision'].some(path => location.pathname.startsWith(path));

    // Initialize Google Analytics
    React.useEffect(() => {
        const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
        if (gaId && gaId !== 'G-CHECK_GA_DASHBOARD') {
            ReactGA.initialize(gaId);
        }
    }, []);

    // Track page views on route change
    React.useEffect(() => {
        if (import.meta.env.VITE_GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [location]);

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

    // Listen for connection restoration to sync offline cognitive mastery
    React.useEffect(() => {
        const handleOnline = () => {
            console.log("Internet restored. Flushing mastery sync queue...");
            flushMasterySyncQueue();
        };

        window.addEventListener('online', handleOnline);
        
        // Also try flushing on initial load if we are already online
        if (navigator.onLine) {
            flushMasterySyncQueue();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return (
        <HelmetProvider>
            <ErrorBoundary>
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold">Skip to content</a>
                <ConnectivityBanner />
                {!hideGlobalAssistant && (
                    <Suspense fallback={null}>
                        <AskSomo />
                    </Suspense>
                )}
                <SessionConflictModal />
                <SubscriptionExpiredModal />
                <Suspense fallback={<PageLoader />}>
                    <main id="main-content">
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/learner" element={<LearnerPage />} />
                            <Route path="/teacher" element={<TeacherPage />} />
                            <Route path="/teacher/notes" element={<TeacherPage />} />
                            <Route path="/teacher/homework" element={<TeacherPage />} />
                            <Route path="/teacher/marking" element={<TeacherPage />} />
                            <Route path="/parent" element={<ParentPage />} />
                            <Route path="/admin" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminDashboard onNavigate={() => navigate('/')} /></AdminGuard>} />
                            <Route path="/admin/knowledge" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminKnowledgeBase /></AdminGuard>} />
                            <Route path="/revision" element={<RevisionPortal />} />
                            <Route path="/revision/dashboard" element={<RevisionDashboard />} />
                            <Route path="/exam-rooms" element={<ExamRoomsListPage />} />
                            <Route path="/exam-rooms/:id" element={<ExamRoomChatPage />} />
                            <Route path="/campus" element={<CampusPage />} />
                            <Route path="/teacher/darasa" element={<TeacherPage />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/pricing" element={<PricingPage />} />
                            <Route path="/school" element={<SchoolDashboard />} />
                            <Route path="/offline" element={<OfflinePage />} />
                            <Route path="/quiz/:id" element={<GuestQuiz />} />
                            <Route path="/blog" element={<BlogIndex />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </Suspense>
            </ErrorBoundary>
        </HelmetProvider>
    );
};

export default App;
