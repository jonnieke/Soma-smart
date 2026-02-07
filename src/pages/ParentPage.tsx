import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentDashboard } from '../features/parent/Parent';
import { useApp } from '../context/AppContext';
import { ViewState } from '../types';

export const ParentPage: React.FC = () => {
    const navigate = useNavigate();
    const { learnerHistory, studentCode, loginParent } = useApp();

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    return (
        <ParentDashboard
            onNavigate={handleNavigate}
            activityLog={learnerHistory}
            validStudentCode={studentCode}
            login={loginParent}
        />
    );
};
