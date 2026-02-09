import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TeacherDashboard } from '../features/teacher/Teacher';
import { ViewState } from '../types';

export const TeacherPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine initial tab based on route
    let initialTab: 'HOME' | 'CONVERT' | 'VOICE' | 'QUIZ' | 'LIBRARY' | 'MARKING' = 'HOME';
    if (location.pathname === '/teacher/notes') initialTab = 'HOME'; // Stay on Home (Studio) to see note tools
    if (location.pathname === '/teacher/homework') initialTab = 'HOME'; // Stay on Home (Studio) to see quiz tools
    if (location.pathname === '/teacher/marking') initialTab = 'MARKING';

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    return (
        <TeacherDashboard
            onNavigate={handleNavigate}
            initialTab={initialTab}
        />
    );
};
