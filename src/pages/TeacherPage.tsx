import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TeacherDashboard } from '../features/teacher/Teacher';
import { TeacherDashboardTab } from '../features/teacher/teacherNavigation';
import { ViewState } from '../types';

type TeacherInitialTab = 'DASHBOARD' | 'CREATION_HUB' | TeacherDashboardTab | 'EARNINGS' | 'HOME' | 'VOICE' | 'MARKETPLACE' | 'PROFILE' | 'REPORTS';

export const TeacherPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { initialTab?: TeacherInitialTab } | null;

    // Determine initial tab based on route
    let initialTab: TeacherInitialTab = 'DASHBOARD';
    if (location.pathname === '/teacher/notes') initialTab = 'HOME'; // Stay on Home (Studio) to see note tools
    if (location.pathname === '/teacher/homework') initialTab = 'HOME'; // Stay on Home (Studio) to see quiz tools
    if (location.pathname === '/teacher/marking') initialTab = 'MARKING';
    if (location.pathname === '/teacher/darasa') initialTab = 'DARASA_MODE';
    if (state?.initialTab) initialTab = state.initialTab;

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    return (
        <>
            <Helmet>
                <title>Teacher Dashboard | Somo Smart â€” AI Teaching Tools for Kenyan Educators</title>
                <meta name="description" content="AI-powered teaching studio for Kenyan educators. Create lesson notes, generate quizzes, mark assignments, and manage your classroom with Somo Smart." />
                <link rel="canonical" href="https://somaai.co.ke/teacher" />
                <meta property="og:title" content="Teacher Dashboard | Somo Smart" />
                <meta property="og:description" content="AI-powered teaching tools for Kenyan CBC & KCSE educators." />
                <meta property="og:url" content="https://somaai.co.ke/teacher" />
            </Helmet>
            <TeacherDashboard
                onNavigate={handleNavigate}
                initialTab={initialTab}
            />
        </>
    );
};

