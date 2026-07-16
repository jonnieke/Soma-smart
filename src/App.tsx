import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { BookOpen, GraduationCap, Home, Shield, Users } from 'lucide-react';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { SessionConflictModal } from './components/SessionConflictModal';
import { SubscriptionExpiredModal } from './components/SubscriptionExpiredModal';
import { UpgradeModal } from './components/UpgradeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import { AdminGuard } from './components/AdminGuard';
import ReactGA from "react-ga4";
import { useLocation } from 'react-router-dom';
import { flushMasterySyncQueue } from './services/learnerMemoryService';
import { safeImport } from './utils/safeImport';
import { trackAnalyticsEvent } from './services/analyticsEventService';
import { launchFeatures } from './config/launchFeatures';
import { GA_MEASUREMENT_ID } from './config/analytics';

// Lazy Load Pages for Performance
const LandingPage = React.lazy(() => safeImport(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage }))));
const LearnerPage = React.lazy(() => safeImport(() => import('./pages/LearnerPage').then(module => ({ default: module.LearnerPage }))));
const TeacherPage = React.lazy(() => safeImport(() => import('./pages/TeacherPage').then(module => ({ default: module.TeacherPage }))));
const ParentPage = React.lazy(() => safeImport(() => import('./pages/ParentPage').then(module => ({ default: module.ParentPage }))));
const AdminDashboard = React.lazy(() => safeImport(() => import('./features/admin/Admin').then(module => ({ default: module.AdminDashboard }))));
const AdminKnowledgeBase = React.lazy(() => safeImport(() => import('./features/admin/KnowledgeBase').then(module => ({ default: module.AdminKnowledgeBase }))));
const RevisionPortal = React.lazy(() => safeImport(() => import('./features/revision/RevisionPortal').then(module => ({ default: module.RevisionPortal }))));
const RevisionDashboard = React.lazy(() => safeImport(() => import('./features/revision/RevisionDashboard').then(module => ({ default: module.RevisionDashboard }))));
const ResetPassword = React.lazy(() => safeImport(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword }))));
const PricingPage = React.lazy(() => safeImport(() => import('./pages/PricingPage').then(module => ({ default: module.PricingPage }))));
const SchoolDashboard = React.lazy(() => safeImport(() => import('./features/school/SchoolDashboard').then(module => ({ default: module.SchoolDashboard }))));
const OfflinePage = React.lazy(() => safeImport(() => import('./pages/OfflinePage').then(module => ({ default: module.OfflinePage }))));
const GuestQuiz = React.lazy(() => safeImport(() => import('./pages/GuestQuiz').then(module => ({ default: module.GuestQuiz }))));
const ClassJoinPage = React.lazy(() => safeImport(() => import('./pages/ClassJoinPage').then(module => ({ default: module.ClassJoinPage }))));

// Exam Rooms Pages
const ExamRoomsListPage = React.lazy(() => safeImport(() => import('./pages/ExamRoomsListPage').then(module => ({ default: module.ExamRoomsListPage }))));
const ExamRoomChatPage = React.lazy(() => safeImport(() => import('./pages/ExamRoomChatPage').then(module => ({ default: module.ExamRoomChatPage }))));

// Campus Pages
const CampusPage = React.lazy(() => safeImport(() => import('./pages/CampusPage').then(module => ({ default: module.CampusPage }))));

// Blog Pages
const BlogIndex = React.lazy(() => safeImport(() => import('./pages/Blog/BlogIndex').then(module => ({ default: module.BlogIndex }))));
const BlogPost = React.lazy(() => safeImport(() => import('./pages/Blog/BlogPost').then(module => ({ default: module.BlogPost }))));
const AskSomo = React.lazy(() => safeImport(() => import('./components/AskSomo').then(module => ({ default: module.AskSomo }))));

// Loading Fallback Component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading Somo Smart...</p>
        </div>
    </div>
);

const GlobalNavigation: React.FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const items = [
        { label: 'Home', icon: Home, to: '/', active: pathname === '/' },
        { label: 'Learner', icon: GraduationCap, to: '/learner', active: pathname.startsWith('/learner') },
        { label: 'Revision', icon: BookOpen, to: '/revision', active: pathname.startsWith('/revision') },
        { label: 'Teacher', icon: Users, to: '/teacher', active: pathname.startsWith('/teacher') },
        { label: 'Admin', icon: Shield, to: '/admin', active: pathname.startsWith('/admin') },
    ];

    if (pathname === '/' || pathname.startsWith('/revision')) return null;

    return (
        <div className="sticky top-0 z-[90] border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/95">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200 dark:hover:bg-indigo-950/50"
                    aria-label="Go to homepage"
                >
                    <Home className="h-4 w-4" />
                    Back to homepage
                </button>

                <div className="flex flex-wrap items-center gap-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.to}
                                type="button"
                                onClick={() => navigate(item.to)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    item.active
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-900 dark:hover:text-indigo-200'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const hideGlobalAssistant = ['/learner', '/teacher', '/revision'].some(path => location.pathname.startsWith(path));
    const previousPathRef = React.useRef<string | null>(null);

    // Initialize Google Analytics
    React.useEffect(() => {
        const gaId = GA_MEASUREMENT_ID;
        if (gaId && gaId !== 'G-CHECK_GA_DASHBOARD') {
            ReactGA.initialize(gaId);
        }
    }, []);

    // Track page views on route change
    React.useEffect(() => {
        if (GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [location]);

    React.useEffect(() => {
        const currentPath = `${location.pathname}${location.search}`;
        const previousPath = previousPathRef.current;

        void trackAnalyticsEvent({
            eventType: 'PAGE_VIEW',
            eventName: 'page_view',
            path: currentPath,
            previousPath: previousPath || undefined,
            metadata: {
                title: document.title
            }
        });

        if (previousPath && previousPath !== currentPath) {
            void trackAnalyticsEvent({
                eventType: 'ROUTE_CHANGE',
                eventName: 'route_change',
                path: currentPath,
                previousPath,
                metadata: {
                    from: previousPath,
                    to: currentPath
                }
            });
        }

        previousPathRef.current = currentPath;
    }, [location.pathname, location.search]);

    // Listen for auth state changes (Recovery flow)
    React.useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event !== 'INITIAL_SESSION') {
                void trackAnalyticsEvent({
                    eventType: 'AUTH_EVENT',
                    eventName: String(event).toLowerCase(),
                    path: `${window.location.pathname}${window.location.search}`,
                    metadata: {
                        has_session: Boolean(session),
                        auth_provider: session?.user?.app_metadata?.provider || null
                    }
                });
            }

            if (event === 'PASSWORD_RECOVERY') {
                console.log("Password recovery event detected, redirecting...");
                const recoveryUrl = `/reset-password${window.location.search}${window.location.hash}`;
                navigate(recoveryUrl, { replace: true });
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
        if (navigator.onLine) flushMasterySyncQueue();
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return (
        <HelmetProvider>
            <ErrorBoundary>
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold">Skip to content</a>
                <ConnectivityBanner />
                <GlobalNavigation />
                {!hideGlobalAssistant && (
                    <Suspense fallback={null}>
                        <AskSomo />
                    </Suspense>
                )}
                <SessionConflictModal />
                <SubscriptionExpiredModal />
                <UpgradeModal onUpgrade={(_planId) => navigate('/pricing')} />
                <Suspense fallback={<PageLoader />}>
                    <main id="main-content">
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/learner" element={<LearnerPage />} />
                            <Route path="/teacher" element={<TeacherPage />} />
                            <Route path="/teacher/notes" element={<TeacherPage />} />
                            <Route path="/teacher/homework" element={<TeacherPage />} />
                            <Route path="/teacher/marking" element={<TeacherPage />} />
                            <Route path="/teacher/syllabus" element={<TeacherPage />} />
                            <Route path="/parent" element={<ParentPage />} />
                            <Route path="/admin" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminDashboard onNavigate={() => navigate('/')} /></AdminGuard>} />
                            <Route path="/admin/knowledge" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminKnowledgeBase /></AdminGuard>} />
                            <Route path="/revision" element={<RevisionPortal />} />
                            <Route path="/revision/dashboard" element={<RevisionDashboard />} />
                            <Route path="/exam-rooms" element={launchFeatures.examRooms ? <ExamRoomsListPage /> : <Navigate to="/learner" replace />} />
                            <Route path="/exam-rooms/:id" element={launchFeatures.examRooms ? <ExamRoomChatPage /> : <Navigate to="/learner" replace />} />
                            <Route path="/campus" element={launchFeatures.campus ? <CampusPage /> : <Navigate to="/" replace />} />
                            <Route path="/teacher/darasa" element={<TeacherPage />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/pricing" element={<PricingPage />} />
                            <Route path="/school" element={<SchoolDashboard />} />
                            <Route path="/offline" element={<OfflinePage />} />
                            <Route path="/quiz/:id" element={<GuestQuiz />} />
                            <Route path="/join" element={<ClassJoinPage />} />
                            <Route path="/join/:classId" element={<ClassJoinPage />} />
                            <Route path="/class/:classId" element={<ClassJoinPage />} />
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
