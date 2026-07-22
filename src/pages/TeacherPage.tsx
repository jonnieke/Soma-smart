import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TeacherDashboard } from '../features/teacher/Teacher';
import { TeacherDashboardTab } from '../features/teacher/teacherNavigation';
import { ViewState, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { TeacherLanding } from '../components/TeacherLanding';
import { LoginModal } from '../components/LoginModal';
import { RegistrationModal } from '../components/RegistrationModal';

type TeacherInitialTab = 'DASHBOARD' | 'CREATION_HUB' | TeacherDashboardTab | 'EARNINGS' | 'HOME' | 'VOICE' | 'MARKETPLACE' | 'PROFILE' | 'REPORTS';

export const TeacherPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isRegistered, role, studentProfile, teacherProfile } = useApp();
    const state = location.state as { initialTab?: TeacherInitialTab } | null;

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [previewTabOverride, setPreviewTabOverride] = useState<TeacherInitialTab | null>(null);

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
                <title>Teacher Studio | CBC &amp; KCSE Teaching Tools Kenya — Somo Smart</title>
                <meta name="description" content="AI-powered teaching studio for Kenyan educators. Create CBC lesson plans, schemes of work, topical quizzes, automated assignment marking, and Darasa classroom recaps." />
                <meta name="keywords" content="Kenyan teacher studio, CBC schemes of work generator, KCSE lesson plans, automated quiz marker Kenya, Darasa classroom recap, Somo Smart teacher" />

                {/* AIO & Search Engine Optimization */}
                <meta name="smart-search-index" content="index" />
                <meta name="ai-knowledge-base" content="teacher-portal" />
                <meta name="educational-framework" content="CBC, KCSE, KNEC" />
                <meta name="target-audience" content="Primary Teachers, JSS Teachers, Secondary Teachers, Tutors" />
                <meta name="robots" content="index, follow, max-image-preview:large" />

                {/* OpenGraph */}
                <meta property="og:site_name" content="Somo Smart" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Teacher Studio | CBC &amp; KCSE Teaching Tools Kenya — Somo Smart" />
                <meta property="og:description" content="Create schemes of work, lesson plans, quizzes, and automated assignment marking for CBC and KCSE." />
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
