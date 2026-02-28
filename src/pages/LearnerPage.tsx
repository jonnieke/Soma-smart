import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
        <>
            <Helmet>
                <title>Study Dashboard | Somo Smart — AI Learning for Kenyan Students</title>
                <meta name="description" content="Your personalized AI study dashboard. Scan textbooks, get simple explanations, practice quizzes, and master CBC & KCSE topics with Somo Smart." />
                <link rel="canonical" href="https://somaai.co.ke/learner" />
                <meta property="og:title" content="Study Dashboard | Somo Smart" />
                <meta property="og:description" content="Your personalized AI study dashboard for CBC & KCSE topics." />
                <meta property="og:url" content="https://somaai.co.ke/learner" />
            </Helmet>
            <LearnerDashboard
                onNavigate={handleNavigate}
                profile={studentProfile ? { name: studentProfile.name, code: studentCode, subscriptionTier: subscriptionPlan, subscriptionExpiry: subscriptionExpiry } : null}
            />
        </>
    );
};
