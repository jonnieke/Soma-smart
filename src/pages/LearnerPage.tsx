import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LearnerDashboard } from '../features/learner/Learner';
import { useApp } from '../context/AppContext';
import { ViewState } from '../types';

export const LearnerPage: React.FC = () => {
    const navigate = useNavigate();
    const { learnerHistory, saveActivity, deleteActivity, studentCode, studentProfile, subscriptionPlan, subscriptionExpiry } = useApp();

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) {
            navigate('/');
        }
    };

    return (
        <LearnerDashboard
            onNavigate={handleNavigate}
            profile={studentProfile ? { name: studentProfile.name, code: studentCode, subscriptionTier: subscriptionPlan, subscriptionExpiry: subscriptionExpiry } : null}
        />
    );
};
