import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { BookOpen, FileText, GraduationCap, Home, Shield, Users } from 'lucide-react';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { SessionConflictModal } from './components/SessionConflictModal';
import { SubscriptionExpiredModal } from './components/SubscriptionExpiredModal';
import { UpgradeModal } from './components/UpgradeModal';
import { WhatsAppFloatingWidget } from './components/WhatsAppFloatingWidget';
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
import { TelegramService } from './services/telegramService';

// Lazy Load Pages for Performance
const LandingPage = React.lazy(() => safeImport(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage }))));
const LearnerPage = React.lazy(() => safeImport(() => import('./pages/LearnerPage').then(module => ({ default: module.LearnerPage }))));
const TeacherPage = React.lazy(() => safeImport(() => import('./pages/TeacherPage').then(module => ({ default: module.TeacherPage }))));
const ParentPage = React.lazy(() => safeImport(() => import('./pages/ParentPage').then(module => ({ default: module.ParentPage }))));
const AdminDashboard = React.lazy(() => safeImport(() => import('./features/admin/Admin').then(module => ({ default: module.AdminDashboard }))));
const AdminKnowledgeBase = React.lazy(() => safeImport(() => import('./features/admin/KnowledgeBase').then(module => ({ default: module.AdminKnowledgeBase }))));
const AdminAssessmentEngine = React.lazy(() => safeImport(() => import('./features/admin/AdminAssessmentEngine').then(module => ({ default: module.AdminAssessmentEngine }))));
const RevisionPortal = React.lazy(() => safeImport(() => import('./features/revision/RevisionPortal').then(module => ({ default: module.RevisionPortal }))));
const RevisionDashboard = React.lazy(() => safeImport(() => import('./features/revision/RevisionDashboard').then(module => ({ default: module.RevisionDashboard }))));
const ExamPaperBankPage = React.lazy(() => safeImport(() => import('./pages/ExamPaperBankPage').then(module => ({ default: module.ExamPaperBankPage }))));
const ExamPaperReaderPage = React.lazy(() => safeImport(() => import('./pages/ExamPaperReaderPage').then(module => ({ default: module.ExamPaperReaderPage }))));
const SomaGuidePage = React.lazy(() => safeImport(() => import('./pages/SomaGuidePage').then(module => ({ default: module.SomaGuidePage }))));
const ResetPassword = React.lazy(() => safeImport(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword }))));
const PricingPage = React.lazy(() => safeImport(() => import('./pages/PricingPage').then(module => ({ default: module.PricingPage }))));
const SchoolDashboard = React.lazy(() => safeImport(() => import('./features/school/SchoolDashboard').then(module => ({ default: module.SchoolDashboard }))));
const SchoolWorkspaceLayout = React.lazy(() => safeImport(() => import('./features/school/workspace/SchoolWorkspaceLayout').then(module => ({ default: module.SchoolWorkspaceLayout }))));
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
const ContactUsPage = React.lazy(() => safeImport(() => import('./pages/ContactUsPage').then(module => ({ default: module.ContactUsPage }))));
const AskSomo = React.lazy(() => safeImport(() => import('./components/AskSomo').then(module => ({ default: module.AskSomo }))));

// Phase 4 — Marketplace & District
const MarketplacePage = React.lazy(() => safeImport(() => import('./features/marketplace/CreatorMarketplacePage').then(module => ({ default: module.CreatorMarketplacePage }))));
const DistrictDashboard = React.lazy(() => safeImport(() => import('./features/district/DistrictDashboard').then(module => ({ default: module.DistrictDashboard }))));
const PurchasedLibraryView = React.lazy(() => safeImport(() => import('./features/marketplace/CreatorPurchasedLibraryPage').then(module => ({ default: module.CreatorPurchasedLibraryPage }))));
const CreatorStudioPage = React.lazy(() => safeImport(() => import('./features/marketplace/CreatorStudioPage').then(module => ({ default: module.CreatorStudioPage }))));


// Phase 5 — Assessment Delivery, Marking & Intelligence
const TeacherAssessmentsView = React.lazy(() => safeImport(() => import('./features/teacher/TeacherAssessmentsView').then(module => ({ default: module.TeacherAssessmentsView }))));
const TeacherMarkingCentreView = React.lazy(() => safeImport(() => import('./features/teacher/TeacherMarkingCentreView').then(module => ({ default: module.TeacherMarkingCentreView }))));
const TeacherMarkingInterface = React.lazy(() => safeImport(() => import('./features/teacher/TeacherMarkingInterface').then(module => ({ default: module.TeacherMarkingInterface }))));
const TeacherResultsAnalyticsView = React.lazy(() => safeImport(() => import('./features/teacher/TeacherResultsAnalyticsView').then(module => ({ default: module.TeacherResultsAnalyticsView }))));
const TeacherReportsView = React.lazy(() => safeImport(() => import('./features/teacher/TeacherReportsView').then(module => ({ default: module.TeacherReportsView }))));

const LearnerAssessmentsView = React.lazy(() => safeImport(() => import('./features/learner/LearnerAssessmentsView').then(module => ({ default: module.LearnerAssessmentsView }))));
const LearnerAssessmentTakeView = React.lazy(() => safeImport(() => import('./features/learner/LearnerAssessmentTakeView').then(module => ({ default: module.LearnerAssessmentTakeView }))));
const LearnerAssessmentResultView = React.lazy(() => safeImport(() => import('./features/learner/LearnerAssessmentResultView').then(module => ({ default: module.LearnerAssessmentResultView }))));
const LearnerCorrectionsView = React.lazy(() => safeImport(() => import('./features/learner/LearnerCorrectionsView').then(module => ({ default: module.LearnerCorrectionsView }))));
const LearnerWeakAreasView = React.lazy(() => safeImport(() => import('./features/learner/LearnerWeakAreasView').then(module => ({ default: module.LearnerWeakAreasView }))));
const LearnerRevisionPlanView = React.lazy(() => safeImport(() => import('./features/learner/LearnerRevisionPlanView').then(module => ({ default: module.LearnerRevisionPlanView }))));

const SchoolAssessmentPerformanceView = React.lazy(() => safeImport(() => import('./features/school/SchoolAssessmentPerformanceView').then(module => ({ default: module.SchoolAssessmentPerformanceView }))));
const AdminAssessmentDeliveryView = React.lazy(() => safeImport(() => import('./features/admin/AdminAssessmentDeliveryView').then(module => ({ default: module.AdminAssessmentDeliveryView }))));

// Phase 6 — Soma Education Intelligence
const TeacherIntelligenceDashboardView = React.lazy(() => safeImport(() => import('./features/teacher/TeacherIntelligenceDashboardView').then(module => ({ default: module.TeacherIntelligenceDashboardView }))));
const LearnerProgressView = React.lazy(() => safeImport(() => import('./features/learner/LearnerProgressView').then(module => ({ default: module.LearnerProgressView }))));
const SchoolIntelligenceView = React.lazy(() => safeImport(() => import('./features/school/SchoolIntelligenceView').then(module => ({ default: module.SchoolIntelligenceView }))));
const AdminEducationIntelligenceView = React.lazy(() => safeImport(() => import('./features/admin/AdminEducationIntelligenceView').then(module => ({ default: module.AdminEducationIntelligenceView }))));

// Phase 7 — Soma Content OS
const TeacherContentOSView = React.lazy(() => safeImport(() => import('./features/teacher/TeacherContentOSView').then(module => ({ default: module.TeacherContentOSView }))));
const SchoolContentLibraryView = React.lazy(() => safeImport(() => import('./features/school/SchoolContentLibraryView').then(module => ({ default: module.SchoolContentLibraryView }))));
const PublisherPortalView = React.lazy(() => safeImport(() => import('./features/publisher/PublisherPortalView').then(module => ({ default: module.PublisherPortalView }))));
const AdminContentOSView = React.lazy(() => safeImport(() => import('./features/admin/AdminContentOSView').then(module => ({ default: module.AdminContentOSView }))));

// Phase 8 — Soma School OS
const SchoolOSDashboardView = React.lazy(() => safeImport(() => import('./features/school/SchoolOSDashboardView').then(module => ({ default: module.SchoolOSDashboardView }))));
const InstitutionDashboardView = React.lazy(() => safeImport(() => import('./features/institution/InstitutionDashboardView').then(module => ({ default: module.InstitutionDashboardView }))));
const AdminInstitutionsView = React.lazy(() => safeImport(() => import('./features/admin/AdminInstitutionsView').then(module => ({ default: module.AdminInstitutionsView }))));

// Phase 9 — Soma Growth OS
const TeacherGettingStartedView = React.lazy(() => safeImport(() => import('./features/teacher/TeacherGettingStartedView').then(module => ({ default: module.TeacherGettingStartedView }))));
const SchoolGrowthPortalView = React.lazy(() => safeImport(() => import('./features/school/SchoolGrowthPortalView').then(module => ({ default: module.SchoolGrowthPortalView }))));
const PartnerPortalView = React.lazy(() => safeImport(() => import('./features/partner/PartnerPortalView').then(module => ({ default: module.PartnerPortalView }))));
const AdminGrowthOSView = React.lazy(() => safeImport(() => import('./features/admin/AdminGrowthOSView').then(module => ({ default: module.AdminGrowthOSView }))));

// Phase 10 — Soma Platform Core & Governance
const AdminPlatformCoreView = React.lazy(() => safeImport(() => import('./features/admin/AdminPlatformCoreView').then(module => ({ default: module.AdminPlatformCoreView }))));
const OrganizationEnterpriseView = React.lazy(() => safeImport(() => import('./features/organization/OrganizationEnterpriseView').then(module => ({ default: module.OrganizationEnterpriseView }))));
const DeveloperPortalView = React.lazy(() => safeImport(() => import('./features/developer/DeveloperPortalView').then(module => ({ default: module.DeveloperPortalView }))));
const PublicStatusTrustView = React.lazy(() => safeImport(() => import('./features/public/PublicStatusTrustView').then(module => ({ default: module.PublicStatusTrustView }))));

// Phase 11 — Soma Strategic Intelligence Layer
const TeacherEvidenceView = React.lazy(() => safeImport(() => import('./features/teacher/TeacherEvidenceView').then(module => ({ default: module.TeacherEvidenceView }))));
const SchoolEvidenceView = React.lazy(() => safeImport(() => import('./features/school/SchoolEvidenceView').then(module => ({ default: module.SchoolEvidenceView }))));
const CreatorEvidenceView = React.lazy(() => safeImport(() => import('./features/creator/CreatorEvidenceView').then(module => ({ default: module.CreatorEvidenceView }))));
const ResearchPartnerPortalView = React.lazy(() => safeImport(() => import('./features/research/ResearchPartnerPortalView').then(module => ({ default: module.ResearchPartnerPortalView }))));
const AdminStrategicIntelligenceView = React.lazy(() => safeImport(() => import('./features/admin/AdminStrategicIntelligenceView').then(module => ({ default: module.AdminStrategicIntelligenceView }))));









// Loading Fallback Component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading Soma AI...</p>
        </div>
    </div>
);

const GlobalNavigation: React.FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const items = [
        { label: 'Home', icon: Home, to: '/', active: pathname === '/' },
        { label: 'Learner', icon: GraduationCap, to: '/learner', active: pathname.startsWith('/learner') },
        { label: 'Exam Papers', icon: FileText, to: '/exam-papers', active: pathname.startsWith('/exam-papers') },
        { label: 'Revision', icon: BookOpen, to: '/revision', active: pathname.startsWith('/revision') },
        { label: 'Soma Guide', icon: BookOpen, to: '/guide', active: pathname.startsWith('/guide') },
        { label: 'Teacher', icon: Users, to: '/teacher', active: pathname.startsWith('/teacher') },
        { label: 'Admin', icon: Shield, to: '/admin', active: pathname.startsWith('/admin') },
    ];

    if (pathname === '/' || pathname.startsWith('/teacher') || pathname.startsWith('/revision') || pathname.startsWith('/exam-papers')) return null;

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

        // Initialize Telegram WebApp SDK if running inside Telegram (TWA)
        TelegramService.init();

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
                <WhatsAppFloatingWidget />
                <Suspense fallback={<PageLoader />}>
                    <main id="main-content">
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/learner" element={<LearnerPage />} />
                            <Route path="/teacher" element={<TeacherPage />} />
                            <Route path="/teacher/paper-studio" element={<TeacherPage />} />
                            <Route path="/teacher/paper-studio/create" element={<TeacherPage />} />
                            <Route path="/teacher/paper-studio/questions" element={<TeacherPage />} />
                            <Route path="/teacher/paper-studio/editor/:id" element={<TeacherPage />} />
                            <Route path="/teacher/school-library" element={<TeacherPage />} />
                            <Route path="/teacher/paper-bank" element={<MarketplacePage />} />
                            <Route path="/teacher/earnings" element={<CreatorStudioPage />} />
                            <Route path="/teacher/notes" element={<TeacherPage />} />
                            <Route path="/teacher/homework" element={<TeacherPage />} />
                            <Route path="/teacher/marking" element={<TeacherPage />} />
                            <Route path="/teacher/syllabus" element={<TeacherPage />} />
                            <Route path="/parent" element={<ParentPage />} />
                            <Route path="/admin" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminDashboard onNavigate={() => navigate('/')} /></AdminGuard>} />
                            <Route path="/admin/knowledge" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminKnowledgeBase /></AdminGuard>} />
                            <Route path="/admin/assessment-engine" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminAssessmentEngine /></AdminGuard>} />
                            <Route path="/revision" element={<RevisionPortal />} />
                            <Route path="/exam-papers" element={<ExamPaperBankPage />} />
                            <Route path="/exam-papers/:id/read" element={<ExamPaperReaderPage />} />
                            <Route path="/guide" element={<SomaGuidePage />} />
                            <Route path="/revision/dashboard" element={<RevisionDashboard />} />
                            <Route path="/exam-rooms" element={launchFeatures.examRooms ? <ExamRoomsListPage /> : <Navigate to="/learner" replace />} />
                            <Route path="/exam-rooms/:id" element={launchFeatures.examRooms ? <ExamRoomChatPage /> : <Navigate to="/learner" replace />} />
                            <Route path="/campus" element={launchFeatures.campus ? <CampusPage /> : <Navigate to="/" replace />} />
                            <Route path="/teacher/darasa" element={<TeacherPage />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/pricing" element={<PricingPage />} />
                            <Route path="/school/assessment" element={launchFeatures.schoolWorkspaceEnabled ? <SchoolWorkspaceLayout /> : <Navigate to="/" replace />} />
                            <Route path="/school/assessment/*" element={launchFeatures.schoolWorkspaceEnabled ? <SchoolWorkspaceLayout /> : <Navigate to="/" replace />} />
                            <Route path="/marketplace" element={launchFeatures.marketplace ? <MarketplacePage /> : <Navigate to="/" replace />} />
                            <Route path="/marketplace/sell" element={launchFeatures.marketplace ? <CreatorStudioPage /> : <Navigate to="/" replace />} />
                            <Route path="/marketplace/purchased" element={launchFeatures.marketplacePurchasesEnabled ? <PurchasedLibraryView /> : <Navigate to="/marketplace" replace />} />
                            <Route path="/teacher/paper-bank/search" element={<MarketplacePage />} />
                            <Route path="/teacher/paper-bank/purchases" element={<PurchasedLibraryView />} />
                            <Route path="/teacher/paper-bank/library" element={<PurchasedLibraryView />} />
                            <Route path="/teacher/creator-studio" element={<CreatorStudioPage />} />
                            <Route path="/teacher/seller" element={<CreatorStudioPage />} />
                            <Route path="/teacher/seller/onboarding" element={<CreatorStudioPage />} />
                            <Route path="/teacher/seller/listings" element={<CreatorStudioPage />} />
                            <Route path="/teacher/seller/earnings" element={<CreatorStudioPage />} />
                            <Route path="/teacher/seller/withdrawals" element={<Navigate to="/teacher/creator-studio" replace />} />
                            <Route path="/district" element={launchFeatures.districtOversightEnabled ? <DistrictDashboard /> : <Navigate to="/" replace />} />
                            <Route path="/district/:districtId" element={launchFeatures.districtOversightEnabled ? <DistrictDashboard /> : <Navigate to="/" replace />} />

                            {/* Phase 5 — Teacher Routes */}
                            <Route path="/teacher/assessments" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherAssessmentsView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/assessments/create" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherAssessmentsView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/assessments/:assessmentId" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherAssessmentsView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/assessments/:assessmentId/assign" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherAssessmentsView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/assessments/:assessmentId/submissions" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherMarkingCentreView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/marking/:attemptId" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherMarkingInterface /> : <Navigate to="/teacher/marking" replace />} />
                            <Route path="/teacher/results" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherResultsAnalyticsView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/results/:assessmentId" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherResultsAnalyticsView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/insights" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherResultsAnalyticsView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/reports" element={launchFeatures.assessmentDeliveryEnabled ? <TeacherReportsView /> : <Navigate to="/teacher" replace />} />

                            {/* Phase 5 — Learner Routes */}
                            <Route path="/exam/take/:assignmentId" element={<LearnerAssessmentTakeView />} />
                            <Route path="/exam/take/:assignmentId/result" element={<LearnerAssessmentResultView />} />
                            <Route path="/learner/assessments" element={<LearnerAssessmentsView />} />
                            <Route path="/learner/assessments/:assignmentId" element={<LearnerAssessmentsView />} />
                            <Route path="/learner/assessments/:assignmentId/start" element={<LearnerAssessmentTakeView />} />
                            <Route path="/learner/assessments/:assignmentId/result" element={<LearnerAssessmentResultView />} />
                            <Route path="/learner/corrections" element={<LearnerCorrectionsView />} />
                            <Route path="/learner/weak-areas" element={<LearnerWeakAreasView />} />
                            <Route path="/learner/revision-plan" element={<LearnerRevisionPlanView />} />

                            {/* Phase 5 — School Routes */}
                            <Route path="/school/assessment-performance" element={launchFeatures.assessmentDeliveryEnabled ? <SchoolAssessmentPerformanceView /> : <Navigate to="/" replace />} />
                            <Route path="/school/assessment-performance/*" element={launchFeatures.assessmentDeliveryEnabled ? <SchoolAssessmentPerformanceView /> : <Navigate to="/" replace />} />

                            {/* Phase 5 — Admin Routes */}
                            <Route path="/admin/assessment-delivery" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminAssessmentDeliveryView /></AdminGuard>} />
                            <Route path="/admin/assessment-jobs" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminAssessmentDeliveryView /></AdminGuard>} />
                            <Route path="/admin/scanning" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminAssessmentDeliveryView /></AdminGuard>} />
                            <Route path="/admin/assessment-costs" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminAssessmentDeliveryView /></AdminGuard>} />

                            {/* Phase 6 — Teacher Intelligence Routes */}
                            <Route path="/teacher/intelligence" element={launchFeatures.educationIntelligenceEnabled ? <TeacherIntelligenceDashboardView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/intelligence/*" element={launchFeatures.educationIntelligenceEnabled ? <TeacherIntelligenceDashboardView /> : <Navigate to="/teacher" replace />} />

                            {/* Phase 6 — Learner Progress Routes */}
                            <Route path="/learner/progress" element={<LearnerProgressView />} />
                            <Route path="/learner/progress/*" element={<LearnerProgressView />} />

                            {/* Phase 6 — School Intelligence Routes */}
                            <Route path="/school/intelligence" element={launchFeatures.educationIntelligenceEnabled ? <SchoolIntelligenceView /> : <Navigate to="/" replace />} />
                            <Route path="/school/intelligence/*" element={launchFeatures.educationIntelligenceEnabled ? <SchoolIntelligenceView /> : <Navigate to="/" replace />} />

                            {/* Phase 6 — Admin Intelligence Routes */}
                            <Route path="/admin/education-intelligence" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminEducationIntelligenceView /></AdminGuard>} />
                            <Route path="/admin/education-intelligence/*" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminEducationIntelligenceView /></AdminGuard>} />

                            {/* Phase 7 — Teacher Content OS Routes */}
                            <Route path="/teacher/content" element={launchFeatures.contentOSEnabled ? <TeacherContentOSView /> : <Navigate to="/teacher" replace />} />
                            <Route path="/teacher/content/*" element={launchFeatures.contentOSEnabled ? <TeacherContentOSView /> : <Navigate to="/teacher" replace />} />

                            {/* Phase 7 — School Content OS Routes */}
                            <Route path="/school/content" element={launchFeatures.contentOSEnabled ? <SchoolContentLibraryView /> : <Navigate to="/" replace />} />
                            <Route path="/school/content/*" element={launchFeatures.contentOSEnabled ? <SchoolContentLibraryView /> : <Navigate to="/" replace />} />

                            {/* Phase 7 — Publisher Portal Routes */}
                            <Route path="/publisher" element={launchFeatures.publisherPortalEnabled ? <PublisherPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/publisher/*" element={launchFeatures.publisherPortalEnabled ? <PublisherPortalView /> : <Navigate to="/" replace />} />

                            {/* Phase 7 — Admin Content OS Routes */}
                            <Route path="/admin/content-os" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminContentOSView /></AdminGuard>} />
                            <Route path="/admin/content-os/*" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminContentOSView /></AdminGuard>} />

                            {/* Phase 8 — School OS Routes */}
                            <Route path="/school" element={launchFeatures.schoolOSEnabled ? <SchoolOSDashboardView /> : <Navigate to="/" replace />} />
                            <Route path="/school/setup" element={launchFeatures.schoolOSEnabled ? <SchoolOSDashboardView /> : <Navigate to="/" replace />} />
                            <Route path="/school/people" element={launchFeatures.schoolOSEnabled ? <SchoolOSDashboardView /> : <Navigate to="/" replace />} />
                            <Route path="/school/classes" element={launchFeatures.schoolOSEnabled ? <SchoolOSDashboardView /> : <Navigate to="/" replace />} />
                            <Route path="/school/calendar" element={launchFeatures.schoolOSEnabled ? <SchoolOSDashboardView /> : <Navigate to="/" replace />} />
                            <Route path="/school/billing" element={launchFeatures.schoolBillingEnabled ? <SchoolOSDashboardView /> : <Navigate to="/" replace />} />
                            <Route path="/school/*" element={launchFeatures.schoolOSEnabled ? <SchoolOSDashboardView /> : <Navigate to="/" replace />} />

                            {/* Phase 8 — Multi-Campus Institution Routes */}
                            <Route path="/institution" element={launchFeatures.schoolOSEnabled ? <InstitutionDashboardView /> : <Navigate to="/" replace />} />
                            <Route path="/institution/*" element={launchFeatures.schoolOSEnabled ? <InstitutionDashboardView /> : <Navigate to="/" replace />} />

                            {/* Phase 8 — Admin Institution & Platform Health Routes */}
                            <Route path="/admin/institutions" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminInstitutionsView /></AdminGuard>} />
                            <Route path="/admin/institutions/*" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminInstitutionsView /></AdminGuard>} />

                            {/* Phase 9 — Teacher Growth Routes */}
                            <Route path="/teacher/getting-started" element={<TeacherGettingStartedView />} />
                            <Route path="/teacher/referrals" element={<TeacherGettingStartedView />} />
                            <Route path="/teacher/ambassador" element={<TeacherGettingStartedView />} />
                            <Route path="/teacher/creator-programme" element={<TeacherGettingStartedView />} />
                            <Route path="/teacher/upgrade" element={<TeacherGettingStartedView />} />
                            <Route path="/teacher/benefits" element={<TeacherGettingStartedView />} />

                            {/* Phase 9 — School Growth Routes */}
                            <Route path="/school/trial" element={<SchoolGrowthPortalView />} />
                            <Route path="/school/demo" element={<SchoolGrowthPortalView />} />
                            <Route path="/school/pilot" element={<SchoolGrowthPortalView />} />
                            <Route path="/school/referrals" element={<SchoolGrowthPortalView />} />
                            <Route path="/school/success" element={<SchoolGrowthPortalView />} />
                            <Route path="/school/renewal" element={<SchoolGrowthPortalView />} />

                            {/* Phase 9 — Partner Routes */}
                            <Route path="/partner" element={launchFeatures.partnerPortalEnabled ? <PartnerPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/partner/referrals" element={launchFeatures.partnerPortalEnabled ? <PartnerPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/partner/schools" element={launchFeatures.partnerPortalEnabled ? <PartnerPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/partner/campaigns" element={launchFeatures.partnerPortalEnabled ? <PartnerPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/partner/earnings" element={launchFeatures.partnerPortalEnabled ? <PartnerPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/partner/deployments" element={launchFeatures.partnerPortalEnabled ? <PartnerPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/partner/reports" element={launchFeatures.partnerPortalEnabled ? <PartnerPortalView /> : <Navigate to="/" replace />} />

                            {/* Phase 9 — Admin Growth OS Routes */}
                            <Route path="/admin/growth" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminGrowthOSView /></AdminGuard>} />
                            <Route path="/admin/growth/*" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminGrowthOSView /></AdminGuard>} />

                            {/* Phase 10 — Platform Administration Routes */}
                            <Route path="/admin/platform" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminPlatformCoreView /></AdminGuard>} />
                            <Route path="/admin/platform/*" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminPlatformCoreView /></AdminGuard>} />

                            {/* Phase 10 — Enterprise Organization Routes */}
                            <Route path="/organization/settings" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/security" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/identity" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/audit" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/api-access" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/integrations" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/data-governance" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/service-status" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/support" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />
                            <Route path="/organization/*" element={launchFeatures.platformReliabilityEnabled ? <OrganizationEnterpriseView /> : <Navigate to="/" replace />} />

                            {/* Phase 10 — Developer Portal Routes */}
                            <Route path="/developers" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/developers/apps" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/developers/api-keys" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/developers/webhooks" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/developers/usage" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/developers/logs" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/developers/docs" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/developers/sandbox" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />
                            <Route path="/developers/*" element={launchFeatures.developerPortalEnabled ? <DeveloperPortalView /> : <Navigate to="/" replace />} />

                            {/* Phase 10 — Public Operational & Trust Routes */}
                            <Route path="/status" element={launchFeatures.publicStatusPageEnabled ? <PublicStatusTrustView /> : <Navigate to="/" replace />} />
                            <Route path="/security" element={<PublicStatusTrustView />} />
                            <Route path="/trust" element={<PublicStatusTrustView />} />
                            <Route path="/api/docs" element={<PublicStatusTrustView />} />

                            {/* Phase 11 — Teacher Evidence Routes */}
                            <Route path="/teacher/evidence" element={<TeacherEvidenceView />} />
                            <Route path="/teacher/evidence/questions" element={<TeacherEvidenceView />} />
                            <Route path="/teacher/evidence/resources" element={<TeacherEvidenceView />} />
                            <Route path="/teacher/evidence/curriculum" element={<TeacherEvidenceView />} />
                            <Route path="/teacher/evidence/contributions" element={<TeacherEvidenceView />} />
                            <Route path="/teacher/evidence/*" element={<TeacherEvidenceView />} />

                            {/* Phase 11 — School Evidence Routes */}
                            <Route path="/school/evidence" element={<SchoolEvidenceView />} />
                            <Route path="/school/evidence/assessment-quality" element={<SchoolEvidenceView />} />
                            <Route path="/school/evidence/curriculum" element={<SchoolEvidenceView />} />
                            <Route path="/school/evidence/interventions" element={<SchoolEvidenceView />} />
                            <Route path="/school/evidence/resources" element={<SchoolEvidenceView />} />
                            <Route path="/school/evidence/value-report" element={<SchoolEvidenceView />} />
                            <Route path="/school/evidence/*" element={<SchoolEvidenceView />} />

                            {/* Phase 11 — Creator Evidence Routes */}
                            <Route path="/creator/evidence" element={<CreatorEvidenceView />} />
                            <Route path="/creator/evidence/content" element={<CreatorEvidenceView />} />
                            <Route path="/creator/evidence/questions" element={<CreatorEvidenceView />} />
                            <Route path="/creator/evidence/reputation" element={<CreatorEvidenceView />} />
                            <Route path="/creator/evidence/earnings" element={<CreatorEvidenceView />} />
                            <Route path="/creator/evidence/*" element={<CreatorEvidenceView />} />

                            {/* Phase 11 — Research Partner Routes */}
                            <Route path="/research" element={<ResearchPartnerPortalView />} />
                            <Route path="/research/projects" element={<ResearchPartnerPortalView />} />
                            <Route path="/research/datasets" element={<ResearchPartnerPortalView />} />
                            <Route path="/research/approvals" element={<ResearchPartnerPortalView />} />
                            <Route path="/research/results" element={<ResearchPartnerPortalView />} />
                            <Route path="/research/governance" element={<ResearchPartnerPortalView />} />
                            <Route path="/research/*" element={<ResearchPartnerPortalView />} />

                            {/* Phase 11 — Admin Strategic Intelligence Routes */}
                            <Route path="/admin/strategy" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminStrategicIntelligenceView /></AdminGuard>} />
                            <Route path="/admin/strategy/*" element={<AdminGuard onNavigateBack={() => navigate('/')}><AdminStrategicIntelligenceView /></AdminGuard>} />







                            <Route path="/offline" element={<OfflinePage />} />
                            <Route path="/quiz/:id" element={<GuestQuiz />} />
                            <Route path="/join" element={<ClassJoinPage />} />
                            <Route path="/join/:classId" element={<ClassJoinPage />} />
                            <Route path="/class/:classId" element={<ClassJoinPage />} />
                            <Route path="/blog" element={<BlogIndex />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />
                            <Route path="/contact" element={<ContactUsPage />} />
                            <Route path="/contact-us" element={<ContactUsPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </Suspense>
            </ErrorBoundary>
        </HelmetProvider>
    );
};

export default App;
