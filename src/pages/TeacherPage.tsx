import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherDashboard } from '../features/teacher/Teacher';
import { ViewState } from '../types';

export const TeacherPage: React.FC = () => {
    const navigate = useNavigate();

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    return (
        <TeacherDashboard
            onNavigate={handleNavigate}
        />
    );
};
