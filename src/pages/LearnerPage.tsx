import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LearnerDashboard } from '../features/learner/Learner';
import { useApp } from '../context/AppContext';
import { ViewState } from '../types';

export const LearnerPage: React.FC = () => {
    const navigate = useNavigate();
    const { learnerHistory, saveActivity, deleteActivity, studentCode } = useApp();

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    return (
        <LearnerDashboard
            onNavigate={handleNavigate}
            saveActivity={saveActivity}
            deleteActivity={deleteActivity}
            history={learnerHistory}
            studentCode={studentCode}
        />
    );
};
