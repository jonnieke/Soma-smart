import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TeacherDashboard } from '../features/teacher/Teacher';
import { TeacherDashboardTab } from '../features/teacher/teacherNavigation';
import { ViewState, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { TeacherLanding } from '../components/TeacherLanding';
import { LoginModal } from '../components/LoginModal';
import { RegistrationModal } from '../components/RegistrationModal';
import { PaperStudioWorkspace } from '../features/teacher/paperStudio/PaperStudioWorkspace';
import { CreatePaperWizard } from '../features/teacher/paperStudio/CreatePaperWizard';
import { ExaminationEditor } from '../features/teacher/paperStudio/ExaminationEditor';
import { QuestionBankBrowser } from '../features/teacher/paperStudio/QuestionBankBrowser';

type TeacherInitialTab = 'DASHBOARD' | 'CREATION_HUB' | TeacherDashboardTab | 'EARNINGS' | 'HOME' | 'VOICE' | 'MARKETPLACE' | 'PROFILE' | 'REPORTS';

export const TeacherPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isRegistered, role, teacherProfile } = useApp();
    const state = location.state as { initialTab?: TeacherInitialTab } | null;

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [previewTabOverride, setPreviewTabOverride] = useState<TeacherInitialTab | null>(null);
    const [editingPaperId, setEditingPaperId] = useState<string | null>(null);

    // Determine sub-route views for Paper Studio
    const isPaperStudioBase = location.pathname === '/teacher/paper-studio';
    const isPaperStudioCreate = location.pathname === '/teacher/paper-studio/create';
    const isPaperStudioQuestions = location.pathname === '/teacher/paper-studio/questions';
    const isPaperStudioEditor = location.pathname.startsWith('/teacher/paper-studio/editor');

    // Extract paper ID if on editor route
    const paperIdFromUrl = isPaperStudioEditor ? location.pathname.split('/editor/')[1] : editingPaperId;

    // Determine initial tab based on route
    let initialTab: TeacherInitialTab = 'DASHBOARD';
    const isSubRoute = location.pathname !== '/teacher';

    if (location.pathname === '/teacher/notes') initialTab = 'HOME';
    if (location.pathname === '/teacher/homework') initialTab = 'HOME';
    if (location.pathname === '/teacher/marking') initialTab = 'MARKING';
    if (location.pathname === '/teacher/darasa') initialTab = 'DARASA_MODE';
    if (location.pathname === '/teacher/syllabus') initialTab = 'SYLLABUS_TRACKER';
    if (state?.initialTab) initialTab = state.initialTab;
    if (previewTabOverride) initialTab = previewTabOverride;

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    // An unauthenticated visitor on /teacher gets the high-converting Teacher Studio Showcase
    const isTeacherUser = role === UserRole.TEACHER || Boolean(teacherProfile?.id);
    const showLandingShowcase = !isTeacherUser && !isRegistered && !isSubRoute && !previewTabOverride;

    return (
        <>
            <Helmet>
                <html lang="en" />
                <title>Teacher Studio &amp; Paper Studio | CBC &amp; KCSE Teaching Tools Kenya — Somo Smart</title>
                <meta name="description" content="AI-powered teaching studio for Kenyan educators. Create CBC lesson plans, schemes of work, CATs, topical quizzes, automated assignment marking, and professional examination papers." />
                <meta name="keywords" content="Kenyan teacher studio, Soma Paper Studio, CBC schemes of work generator, KCSE lesson plans, automated quiz marker Kenya, Darasa classroom recap, Somo Smart teacher" />

                {/* AIO & Search Engine Optimization */}
                <meta name="smart-search-index" content="index" />
                <meta name="ai-knowledge-base" content="teacher-portal" />
                <meta name="educational-framework" content="CBC, KCSE, KNEC, KPSEA" />
                <meta name="target-audience" content="Primary Teachers, JSS Teachers, Secondary Teachers, Tutors" />
                <meta name="robots" content="index, follow, max-image-preview:large" />

                {/* OpenGraph */}
                <meta property="og:site_name" content="Somo Smart" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Teacher Studio &amp; Paper Studio — Somo Smart" />
                <meta property="og:description" content="Create schemes of work, lesson plans, quizzes, and professional examination papers for CBC and KCSE." />
                <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
                <meta property="og:url" content="https://www.somaai.co.ke/teacher" />

                <link rel="canonical" href="https://www.somaai.co.ke/teacher" />

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Somo Smart Teacher Studio",
                        "operatingSystem": "Web, Android, iOS",
                        "applicationCategory": "EducationalApplication",
                        "description": "Comprehensive teaching studio for Kenyan teachers to generate CBC schemes of work, lesson plans, and mark assessments.",
                        "provider": {
                            "@type": "Organization",
                            "name": "Somo Smart",
                            "url": "https://www.somaai.co.ke"
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "KES"
                        }
                    })}
                </script>
            </Helmet>

            {showLandingShowcase ? (
                <>
                    <TeacherLanding
                        onLogin={() => setShowLoginModal(true)}
                        onRegister={() => setShowRegisterModal(true)}
                        onExploreTool={(tab) => setPreviewTabOverride(tab as TeacherInitialTab)}
                    />
                    <LoginModal
                        isOpen={showLoginModal}
                        onClose={() => setShowLoginModal(false)}
                        onSuccess={() => setShowLoginModal(false)}
                        onSwitchToRegister={() => {
                            setShowLoginModal(false);
                            setShowRegisterModal(true);
                        }}
                    />
                    <RegistrationModal
                        isOpen={showRegisterModal}
                        onClose={() => setShowRegisterModal(false)}
                        onSuccess={() => setShowRegisterModal(false)}
                        onSwitchToLogin={() => {
                            setShowRegisterModal(false);
                            setShowLoginModal(true);
                        }}
                        initialRole="TEACHER"
                    />
                </>
            ) : isPaperStudioCreate ? (
                <CreatePaperWizard
                    onCancel={() => navigate('/teacher/paper-studio')}
                    onPaperCreated={(id) => navigate(`/teacher/paper-studio/editor/${id}`)}
                />
            ) : isPaperStudioQuestions ? (
                <QuestionBankBrowser
                    onBack={() => navigate('/teacher/paper-studio')}
                />
            ) : isPaperStudioEditor && paperIdFromUrl ? (
                <ExaminationEditor
                    paperId={paperIdFromUrl}
                    onBackToWorkspace={() => navigate('/teacher/paper-studio')}
                />
            ) : isPaperStudioBase ? (
                <PaperStudioWorkspace
                    onNavigateToWizard={() => navigate('/teacher/paper-studio/create')}
                    onOpenPaperEditor={(id) => navigate(`/teacher/paper-studio/editor/${id}`)}
                    onOpenQuestionBank={() => navigate('/teacher/paper-studio/questions')}
                />
            ) : (
                <TeacherDashboard
                    onNavigate={handleNavigate}
                    initialTab={initialTab}
                />
            )}
        </>
    );
};

export default TeacherPage;
